import jwt from 'jsonwebtoken';
import { User, Project } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-secret-key-2024';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const checkProjectAdmin = async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const memberRole = project.members.find(
      m => m.user && m.user.toString() === req.user._id.toString()
    )?.role;

    if (!isOwner && (!memberRole || memberRole !== 'admin')) {
      return res.status(403).json({ error: 'Only project creator or admin can manage this project' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

export const checkProjectMemberManage = async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const memberRole = project.members.find(
      m => m.user && m.user.toString() === req.user._id.toString()
    )?.role;
    const isProjectAdmin = memberRole === 'admin';
    const isSystemAdmin = req.user.role === 'admin';

    if (!isOwner && !isProjectAdmin && !isSystemAdmin) {
      return res.status(403).json({ error: 'Only project creator or admin can manage members' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

export const checkProjectMember = async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(
      m => m.user && m.user.toString() === req.user._id.toString()
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({ error: 'You are not a member of this project' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};