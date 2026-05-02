import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, UserPlus, Trash2, CheckCircle, Clock, Eye, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { projectService, taskService, userService } from '../services/api';

const statusIcons = {
  todo: <Clock size={16} />,
  in_progress: <AlertTriangle size={16} />,
  review: <Eye size={16} />,
  done: <CheckCircle size={16} />
};

const statusColors = {
  todo: 'var(--text-muted)',
  in_progress: 'var(--color-primary)',
  review: 'var(--color-warning)',
  done: 'var(--color-success)'
};

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', assignedTo: ''
  });
  const [memberForm, setMemberForm] = useState({ userId: '', role: 'member' });
  const [allUsers, setAllUsers] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadProject(); }, [id]);

  async function loadProject() {
    try {
      const [projectRes, membersRes, tasksRes] = await Promise.all([
        projectService.getById(id),
        projectService.getMembers(id),
        taskService.getAll(id)
      ]);
setProject(projectRes.data.project);
      setMembers(membersRes.data.members);
      setTasks(tasksRes.data.tasks);

      const ownerId = projectRes.data.project.owner?._id || projectRes.data.project.owner;
      const isOwner = ownerId === user?.id;
      const currentMember = membersRes.data.members.find(m => m.user?._id === user?.id);
      const isProjectAdmin = currentMember?.role === 'admin';
      const isSystemAdmin = user?.role === 'admin';
      setIsAdmin(isOwner || isProjectAdmin || isSystemAdmin);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function loadAllUsers() {
    try {
      const res = await userService.getAll();
      const existingIds = members.map(m => m.user?._id?.toString());
      const currentUserId = user && user._id ? user._id.toString() : null;
      const availableUsers = res.data.users.filter(u => 
        u._id.toString() !== currentUserId && 
        !existingIds.includes(u._id.toString())
      );
      setAllUsers(availableUsers);
    } catch (err) { console.error(err); }
  }

  async function openMemberModal() {
    await loadAllUsers();
    setMemberModal(true);
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    try {
      const res = await taskService.create(id, taskForm);
      setTasks([res.data.task, ...tasks]);
      setTaskModal(false);
      setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', assignedTo: '' });
    } catch (err) { alert(err.response?.data?.error || 'Failed to create task'); }
  }

  async function handleUpdateTask(taskId, data) {
    try {
      const res = await taskService.update(taskId, data);
      setTasks(tasks.map(t => t._id === taskId ? res.data.task : t));
    } catch (err) { console.error(err); }
  }

  async function handleDeleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    try {
      await taskService.delete(taskId);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete task'); }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    try {
      const res = await projectService.addMember(id, memberForm);
      setMembers([...members, res.data.member]);
      setMemberModal(false);
      setMemberForm({ userId: '', role: 'member' });
    } catch (err) { alert(err.response?.data?.error || 'Failed to add member'); }
  }

  async function handleRemoveMember(userId) {
    if (!confirm('Remove this member?')) return;
    try {
      await projectService.removeMember(id, userId);
      setMembers(members.filter(m => m.user?._id !== userId));
    } catch (err) { alert(err.response?.data?.error || 'Failed to remove member'); }
  }

  function isOverdue(dueDate, status) {
    if (!dueDate || status === 'done') return false;
    return new Date(dueDate) < new Date();
  }

  const filteredTasks = tasks.filter(t => filter === 'all' || t.status === filter);

  const ownerId = project?.owner?._id || project?.owner;
  const isOwner = ownerId === user?.id;
  const isSystemAdmin = user?.role === 'admin';
  const canAddMembers = isOwner || isSystemAdmin;
  const canAddTasks = true;
  const canDelete = isOwner || isSystemAdmin;

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/projects" className="btn btn-secondary btn-sm"><ArrowLeft size={16} /> Back</Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{project?.name}</h1>
          <p className="project-description">{project?.description}</p>
        </div>
        {(canAddMembers || canAddTasks) && (
          <div style={{ display: 'flex', gap: '12px' }}>
            {canAddMembers && (
              <button className="btn btn-secondary" onClick={() => openMemberModal()}>
                <UserPlus size={18} /> Add Member
              </button>
            )}
            {canAddTasks && (
              <button className="btn btn-primary" onClick={() => setTaskModal(true)}>
                <Plus size={18} /> New Task
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: '24px', gap: '24px' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <div className="filter-bar">
            <select className="input filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Tasks</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          {filteredTasks.length > 0 ? (
            <div className="list">
              {filteredTasks.map((task) => (
                <div key={task._id} className="card task-card">
                  <div className="task-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {statusIcons[task.status]}
                      <div className="task-title">{task.title}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        className="input"
                        value={task.status}
                        onChange={(e) => handleUpdateTask(task._id, { status: e.target.value })}
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                      {canDelete && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task._id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  {task.description && <div className="task-description">{task.description}</div>}
                  <div className="task-meta">
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    {task.assignedTo && <span className="badge">{task.assignedTo.username}</span>}
                    {task.dueDate && (
                      <span className={`task-due ${isOverdue(task.dueDate, task.status) ? 'overdue' : ''}`}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card empty-state">
              <div className="empty-title">No tasks yet</div>
              <div className="empty-description">Create your first task</div>
            </div>
          )}
        </div>

        <div>
          <h3 style={{ marginBottom: '16px' }}>Team Members</h3>
          {members.length > 0 ? (
            <div className="card">
              <div className="list">
                {members.map((member) => (
                  <div key={member.user?._id} className="list-item">
                    <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                      {member.user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="user-name">{member.user?.username}</div>
                      <div className="user-role">{member.role}</div>
                    </div>
                    {isAdmin && member.role !== 'admin' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(member.user._id)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card empty-state"><div className="empty-title">No members</div></div>
          )}
        </div>
      </div>

      {taskModal && (
        <div className="modal-overlay" onClick={() => setTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Task</h2>
              <button className="modal-close" onClick={() => setTaskModal(false)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleCreateTask}>
              <div className="input-group">
                <label className="input-label">Title</label>
                <input type="text" className="input" value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} required />
              </div>
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="input" value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2">
                <div className="input-group">
                  <label className="input-label">Status</label>
                  <select className="input" value={taskForm.status} onChange={(e) => setTaskForm({...taskForm, status: e.target.value})}>
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Priority</label>
                  <select className="input" value={taskForm.priority} onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Due Date</label>
                <input type="date" className="input" value={taskForm.dueDate} onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Assign To</label>
                <select className="input" value={taskForm.assignedTo} onChange={(e) => setTaskForm({...taskForm, assignedTo: e.target.value})}>
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.user?._id} value={m.user?._id}>{m.user?.username}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {memberModal && (
        <div className="modal-overlay" onClick={() => setMemberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Member</h2>
              <button className="modal-close" onClick={() => setMemberModal(false)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleAddMember}>
              <div className="input-group">
                <label className="input-label">Select User</label>
                <select className="input" value={memberForm.userId} onChange={(e) => setMemberForm({...memberForm, userId: e.target.value})} required>
                  <option value="">Select a user...</option>
                  {allUsers.map((u) => <option key={u._id} value={u._id}>{u.username} ({u.email})</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Role</label>
                <select className="input" value={memberForm.role} onChange={(e) => setMemberForm({...memberForm, role: e.target.value})}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}