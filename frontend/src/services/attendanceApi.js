import api from './api';

// Trainer: roster of a class for one date, with any status already recorded
export const getClassRoster = (classId, date) =>
  api.get('/class-attendance/roster', { params: { class_id: classId, date } });

// Trainer: save attendance for one session
export const saveClassAttendance = (data) => api.post('/class-attendance', data);

// Member: their own class attendance history
export const getMemberClassAttendance = (memberId) => api.get(`/class-attendance/member/${memberId}`);

// Admin: every class attendance record (optional filters)
export const getAllClassAttendance = (params = {}) => api.get('/class-attendance', { params });