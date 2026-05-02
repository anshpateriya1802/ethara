import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Folder, CheckCircle, AlertCircle, FileText, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const [statsRes, overdueRes, projectsRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getOverdue(),
        dashboardService.getRecentProjects()
      ]);
      setStats(statsRes.data.stats);
      setOverdueTasks(overdueRes.data.tasks);
      setRecentProjects(projectsRes.data.projects);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function isOverdue(dueDate, status) {
    if (!dueDate || status === 'done') return false;
    return new Date(dueDate) < new Date();
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.username}</h1>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: '32px' }}>
        <div className="card stat-card">
          <div className="stat-value">{stats?.totalTasks || 0}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats?.todo || 0}</div>
          <div className="stat-label">To Do</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats?.inProgress || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="card stat-card danger">
          <div className="stat-value">{stats?.overdue || 0}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '24px' }}>
        <div>
          <h2 className="page-title" style={{ marginBottom: '16px' }}>Recent Projects</h2>
          {recentProjects.length > 0 ? (
            <div className="card">
              <div className="list">
                {recentProjects.map((project) => (
                  <Link key={project.id} to={`/projects/${project.id}`} className="list-item">
                    <Folder size={20} />
                    <div style={{ flex: 1 }}>
                      <div className="project-name">{project.name}</div>
                      <div className="project-stats">
                        <span>{project.taskCount} tasks</span>
                        <span>{project.members?.length} members</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="card empty-state">
              <Folder className="empty-icon" size={48} />
              <div className="empty-title">No projects</div>
              <Link to="/projects" className="btn btn-primary">Create Project</Link>
            </div>
          )}
        </div>

        <div>
          <h2 className="page-title" style={{ marginBottom: '16px' }}>Overdue Tasks</h2>
          {overdueTasks.length > 0 ? (
            <div className="card">
              <div className="list">
                {overdueTasks.map((task) => (
                  <div key={task._id} className="list-item">
                    <AlertCircle size={20} color="var(--color-danger)" />
                    <div style={{ flex: 1 }}>
                      <div className="task-title">{task.title}</div>
                      <div className="task-due overdue">Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                    </div>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card empty-state">
              <CheckCircle className="empty-icon" size={48} color="var(--color-success)" />
              <div className="empty-title">No overdue tasks</div>
              <div className="empty-description">Great job keeping up!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}