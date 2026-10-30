import api from './api';

export const getDepartments = async () => {
  const res = await api.get('/departments');
  return res.data;
};

export const getDepartment = async (id) => {
  const res = await api.get(`/departments/${id}`);
  return res.data;
};

export const createDepartment = async (data) => {
  const res = await api.post('/departments', data);
  return res.data;
};

export const updateDepartment = async (id, data) => {
  const res = await api.put(`/departments/${id}`, data);
  return res.data;
};

export const deleteDepartment = async (id) => {
  const res = await api.delete(`/departments/${id}`);
  return res.data;
};