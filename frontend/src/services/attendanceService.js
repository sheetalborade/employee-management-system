import api from './api';

export const getAttendance = async (params = {}) => {
  const res = await api.get('/attendance', { params });
  return res.data;
};

export const markAttendance = async (data) => {
  const res = await api.post('/attendance/mark', data);
  return res.data;
};

export const getMyAttendance = async (params = {}) => {
  const res = await api.get('/attendance/my', { params });
  return res.data;
};

export const getAttendanceSummary = async () => {
  const res = await api.get('/attendance/summary');
  return res.data;
};

export const getDailySummary = async (date) => {
  const res = await api.get('/attendance/daily', { params: { date } });
  return res.data;
};