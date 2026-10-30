import api from './api';

export const getLeaveTypes = async () => {
  const res = await api.get('/leaves/types');
  return res.data;
};

export const getLeaveRequests = async (params = {}) => {
  const res = await api.get('/leaves', { params });
  return res.data;
};

export const reviewLeave = async (id, data) => {
  const res = await api.put(`/leaves/${id}/review`, data);
  return res.data;
};

export const applyLeave = async (data) => {
  const res = await api.post('/leaves/apply', data);
  return res.data;
};

export const getMyLeaves = async () => {
  const res = await api.get('/leaves/my');
  return res.data;
};

export const cancelLeave = async (id) => {
  const res = await api.put(`/leaves/${id}/cancel`);
  return res.data;
};

export const getLeaveBalance = async () => {
  const res = await api.get('/leaves/balance');
  return res.data;
};

export const getLeaveTrends = async () => {
  const res = await api.get('/leaves/trends');
  return res.data;
};

export const getHolidays = async (year) => {
  const res = await api.get('/leaves/holidays', { params: { year } });
  return res.data;
};