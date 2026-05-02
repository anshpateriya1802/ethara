import express from 'express';
import { body, validationResult } from 'express-validator';
import { Task, Project } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/project/:projectId/tasks', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(m => m.user && m.user.toString() === req.user._id.toString());
    const isAdminUser = req.user.role === 'admin';

    if (!isOwner && !isMember && !isAdminUser) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email')
      .sort({ status: 1, priority: 1, createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/project/:projectId/tasks', authenticate, [
  body('title').trim().notEmpty().withMessage('Task title is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(m => m.user && m.user.toString() === req.user._id.toString());
    const isAdminUser = req.user.role === 'admin';

    if (!isOwner && !isMember && !isAdminUser) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { title, description = '', status = 'todo', priority = 'medium', dueDate = null, assignedTo = null } = req.body;

    const task = new Task({
      title,
      description,
      status,
      priority,
      dueDate,
      project: projectId,
      assignedTo,
      createdBy: req.user._id
    });

    await task.save();
    await task.populate('assignedTo', 'username email');
    await task.populate('createdBy', 'username email');

    res.status(201).json({ task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.get('/tasks/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email')
      .populate('project', 'name owner');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(m => m.user && m.user._id.toString() === req.user._id.toString());
    const isAdminUser = req.user.role === 'admin';

    if (!isOwner && !isMember && !isAdminUser) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.put('/tasks/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const isOwner = project.owner.toString() === req.user._id.toString();
    const memberRole = project.members.find(m => m.user && m.user.toString() === req.user._id.toString())?.role;
    const isProjectAdmin = memberRole === 'admin';
    const isAdminUser = req.user.role === 'admin';

    if (!isOwner && !isProjectAdmin && !isAdminUser) {
      return res.status(403).json({ error: 'Only project members can update tasks' });
    }

    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) {
      if (!['todo', 'in_progress', 'review', 'done'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      task.status = status;
    }
    if (priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority' });
      }
      task.priority = priority;
    }
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assignedTo !== undefined) {
      if (assignedTo) {
        const isMember = project.members.some(m => m.user && m.user.toString() === assignedTo);
        if (!isMember) {
          return res.status(400).json({ error: 'Assigned user is not a project member' });
        }
      }
      task.assignedTo = assignedTo || null;
    }

    task.updatedAt = new Date();
    await task.save();
    await task.populate('assignedTo', 'username email');
    await task.populate('createdBy', 'username email');

    res.json({ task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/tasks/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const isOwner = project.owner.toString() === req.user._id.toString();
    const memberRole = project.members.find(m => m.user && m.user.toString() === req.user._id.toString())?.role;
    const isProjectAdmin = memberRole === 'admin';
    const isAdminUser = req.user.role === 'admin';

    if (!isOwner && !isProjectAdmin && !isAdminUser) {
      return res.status(403).json({ error: 'Only project creator or admin can delete tasks' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;