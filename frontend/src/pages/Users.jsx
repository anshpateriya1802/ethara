import { useState, useEffect } from 'react';
import { Users as UsersIcon, Trash2, Shield, Folder, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userService, projectService } from '../services/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [usersRes, projectsRes] = await Promise.all([
        userService.getAll(),
        projectService.getAll()
      ]);
      setUsers(usersRes.data.users);
      setProjects(projectsRes.data.projects);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/');
      } else {
        setError(err.response?.data?.error || 'Access denied');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await userService.updateRole(userId, newRole);
      setUsers(users.map(u => u._id === userId ? {...u, role: newRole} : u));
      alert(`Role updated to ${newRole}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update role');
    }
  }

  async function handleDeleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.delete(userId);
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  }

  async function handleDeleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectService.delete(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  }

  if (loading) return <div>Loading...</div>;

  if (error) {
    return (
      <div className="card empty-state">
        <div className="empty-title">Access Denied</div>
        <div className="empty-description">{error}</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go to Dashboard</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button 
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('users')}
        >
          <UsersIcon size={18} /> Users ({users.length})
        </button>
        <button 
          className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('projects')}
        >
          <Folder size={18} /> Projects ({projects.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
                        {user.username}
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className="input"
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(user._id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="grid grid-cols-2">
          {projects.map((project) => (
            <div key={project.id} className="card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <div className="project-name">{project.name}</div>
                  <div className="project-description">{project.description || 'No description'}</div>
                  <div className="project-stats">
                    <span><FileText size={14} /> {project.taskCount || 0} tasks</span>
                    <span><UsersIcon size={14} /> {project.members?.length || 0} members</span>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProject(project.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}