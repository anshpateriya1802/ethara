import express from 'express';
import { body, validationResult } from 'express-validator';
import { Project, User } from '../config/db.js';
import { authenticate, requireAdmin, checkProjectAdmin, checkProjectMemberManage } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    let projects;
    if (isAdmin) {
      projects = await Project.find()
        .populate('owner', 'username email')
        .populate('members.user', 'username email')
        .sort({ createdAt: -1 });
    } else {
      projects = await Project.find({
        $or: [
          { owner: userId },
          { 'members.user': userId }
        ]
      })
        .populate('owner', 'username email')
        .populate('members.user', 'username email')
        .sort({ createdAt: -1 });
    }

    const projectList = await Promise.all(projects.map(async (p) => {
      const Task = (await import('../config/db.js')).Task;
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

router.post('/', authenticate, async (req, res) => {
  const { name, description = '' } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const ownerId = req.user._id;

  try {
    const project = new Project({
      name: name.trim(),
      description,
      owner: ownerId,
      members: [{ user: ownerId, role: 'admin' }]
    });
    
    await project.save();
    await project.populate('owner', 'username email');
    await project.populate('members.user', 'username email');

    res.status(201).json({ project: { id: project._id, name: project.name, description: project.description, owner: project.owner, members: project.members, createdAt: project.createdAt } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('members.user', 'username email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner = project.owner._id.toString() === req.user._id.toString();
    const isMember = project.members.some(m => m.user && m.user._id.toString() === req.user._id.toString());
    const isAdminUser = req.user.role === 'admin';

    if (!isOwner && !isMember && !isAdminUser) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const Task = (await import('../config/db.js')).Task;
    const taskCount = await Task.countDocuments({ project: project._id });

    res.json({ project: { id: project._id, name: project.name, description: project.description, owner: project.owner, members: project.members, taskCount, createdAt: project.createdAt } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.put('/:id', authenticate, checkProjectAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;

    await project.save();
    await project.populate('owner', 'username email');
    await project.populate('members.user', 'username email');

    res.json({ project: { id: project._id, name: project.name, description: project.description, owner: project.owner, members: project.members } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/:id', authenticate, checkProjectAdmin, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const Task = (await import('../config/db.js')).Task;
    await Task.deleteMany({ project: req.params.id });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

router.get('/:id/members', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.user', 'username email role');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(m => m.user && m.user._id.toString() === req.user._id.toString());
    const isAdminUser = req.user.role === 'admin';

    if (!isOwner && !isMember && !isAdminUser) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ members: project.members });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

router.post('/:id/members', authenticate, checkProjectMemberManage, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Invalid role')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { userId, role = 'member' } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingMember = project.members.find(m => m.user && m.user.toString() === userId);
    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    project.members.push({ user: userId, role });
    await project.save();
    await project.populate('members.user', 'username email');

    const newMember = project.members.find(m => m.user.toString() === userId);
    res.status(201).json({ member: newMember });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

router.delete('/:id/members/:userId', authenticate, checkProjectMemberManage, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ error: 'Cannot remove project owner' });
    }

    project.members = project.members.filter(m => m.user && m.user.toString() !== req.params.userId);
    await project.save();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

export default router;