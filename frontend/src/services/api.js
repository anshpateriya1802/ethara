import axios from 'axios';

// Normalize API base so it always targets the backend's /api prefix.
// - If VITE_API_URL is set to the backend root (e.g. https://api.example.com),
//   ensure we call https://api.example.com/api
// - If VITE_API_URL is unset, default to the relative '/api' path.
const rawBase = import.meta.env.VITE_API_URL || '';
let API_URL;
if (!rawBase) {
  API_URL = '/api';
} else {
  // remove trailing slash
  const trimmed = rawBase.replace(/\/+$/, '');
  API_URL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
};

export const projectService = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`)
};

export const taskService = {
  getAll: (projectId) => api.get(`/projects/${projectId}/tasks`),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`)
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getOverdue: () => api.get('/dashboard/overdue'),
  getRecentProjects: () => api.get('/dashboard/recent-projects')
};

export const userService = {
  getAll: () => api.get('/users/all'),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  delete: (id) => api.delete(`/users/${id}`)
};

export default api;