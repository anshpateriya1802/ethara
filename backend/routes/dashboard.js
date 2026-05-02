import express from 'express';
import { Task, Project } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    let projectIds;
    if (isAdmin) {
      const allProjects = await Project.find().select('_id');
      projectIds = allProjects.map(p => p._id);
    } else {
      const userProjects = await Project.find({
        $or: [{ owner: userId }, { 'members.user': userId }]
      }).select('_id');
      projectIds = userProjects.map(p => p._id);
    }

    if (projectIds.length === 0) {
      return res.json({
        stats: { totalTasks: 0, todo: 0, inProgress: 0, review: 0, done: 0, overdue: 0 }
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          review: { $sum: { $cond: [{ $eq: ['$status', 'review'] }, 1, 0] } },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', today] },
                    { $ne: ['$status', 'done'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({ stats: stats[0] || { totalTasks: 0, todo: 0, inProgress: 0, review: 0, done: 0, overdue: 0 } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/overdue', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    let projectIds;
    if (isAdmin) {
      const allProjects = await Project.find().select('_id');
      projectIds = allProjects.map(p => p._id);
    } else {
      const userProjects = await Project.find({
        $or: [{ owner: userId }, { 'members.user': userId }]
      }).select('_id');
      projectIds = userProjects.map(p => p._id);
    }

    if (projectIds.length === 0) {
      return res.json({ tasks: [] });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await Task.find({
      project: { $in: projectIds },
      dueDate: { $lt: today },
      status: { $ne: 'done' }
    })
      .populate('assignedTo', 'username email')
      .populate('project', 'name')
      .sort({ dueDate: 1 })
      .limit(20);

    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch overdue tasks' });
  }
});

router.get('/recent-projects', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    let query;
    if (isAdmin) {
      query = Project.find().sort({ createdAt: -1 }).limit(5);
    } else {
      query = Project.find({
        $or: [{ owner: userId }, { 'members.user': userId }]
      }).sort({ createdAt: -1 }).limit(5);
    }

    const projects = await query
      .populate('owner', 'username email')
      .populate('members.user', 'username email');

    const projectList = await Promise.all(projects.map(async (p) => {
      const taskCount = await Task.countDocuments({ project: p._id });
      return {
        id: p._id,
        name: p.name,
        description: p.description,
        owner: p.owner,
        members: p.members,
        taskCount,
        createdAt: p.createdAt
      };
    }));

    res.json({ projects: projectList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

export default router;