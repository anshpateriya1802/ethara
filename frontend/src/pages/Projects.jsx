import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Folder, Users, FileText, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const res = await projectService.getAll();
      setProjects(res.data.projects || res.data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await projectService.create(formData);
      const newProject = res.data.project;
      setProjects([newProject, ...projects]);
      setShowModal(false);
      setFormData({ name: '', description: '' });
      alert('Project created successfully!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create project';
      setError(msg);
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectService.delete(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Project
        </button>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-3">
          {projects.map((project) => {
            const ownerId = project.owner?._id || project.owner;
            const isOwner = ownerId === user?.id;
            const canDelete = isOwner || user?.role === 'admin';

            return (
              <div key={project.id} className="card project-card" onClick={() => navigate(`/projects/${project.id}`)}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div className="project-name">{project.name}</div>
                  {canDelete && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                      className="btn btn-danger btn-sm" 
                      style={{padding: '4px 8px'}}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="project-description">
                  {project.description || 'No description'}
                </div>
                <div className="project-stats">
                  <span><FileText size={14} /> {project.taskCount || 0} tasks</span>
                  <span><Users size={14} /> {project.members?.length || 0} members</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card empty-state">
          <Folder className="empty-icon" size={48} />
          <div className="empty-title">No projects yet</div>
          <div className="empty-description">Create your first project to start managing tasks</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Create Project
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Project Name</label>
                <input type="text" className="input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="input" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}