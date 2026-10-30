import api from './api';

export const getEmployees = async (params = {}) => {
  const res = await api.get('/employees', { params });
  return res.data;
};

export const getEmployee = async (id) => {
  const res = await api.get(`/employees/${id}`);
  return res.data;
};

export const createEmployee = async (data) => {
  const res = await api.post('/employees', data);
  return res.data;
};

export const updateEmployee = async (id, data) => {
  const res = await api.put(`/employees/${id}`, data);
  return res.data;
};

export const deleteEmployee = async (id) => {
  const res = await api.delete(`/employees/${id}`);
  return res.data;
};

export const getDashboardStats = async () => {
  const res = await api.get('/employees/stats');
  return res.data;
};

export const getRecentEmployees = async () => {
  const res = await api.get('/employees/recent');
  return res.data;
};

export const updateOwnProfile = async (data) => {
  const res = await api.put('/employees/profile/me', data);
  return res.data;
};