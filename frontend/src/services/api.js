import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------- AUTH ----------
export const registerMember = (data) => api.post('/auth/register', data);
export const login = (credentials) => api.post('/auth/login', credentials);

// ---------- MEMBERS ----------
export const getMembers = () => api.get('/members');
export const getMember = (id) => api.get(`/members/${id}`);
export const createMember = (data) => api.post('/members', data);
export const updateMember = (id, data) => api.put(`/members/${id}`, data);
export const deleteMember = (id) => api.delete(`/members/${id}`);

// ---------- TRAINERS ----------
export const getTrainers = () => api.get('/trainers');
export const getTrainer = (id) => api.get(`/trainers/${id}`);
export const createTrainer = (data) => api.post('/trainers', data);
export const updateTrainer = (id, data) => api.put(`/trainers/${id}`, data);
export const deleteTrainer = (id) => api.delete(`/trainers/${id}`);
export const resetTrainerPassword = (id, password) => api.put(`/trainers/${id}/password`, { password });

// ---------- CLASSES ----------
export const getClasses = () => api.get('/classes');
export const getClass = (id) => api.get(`/classes/${id}`);
export const createClass = (data) => api.post('/classes', data);
export const updateClass = (id, data) => api.put(`/classes/${id}`, data);
export const deleteClass = (id) => api.delete(`/classes/${id}`);

// ---------- PAYMENTS ----------
export const getPayments = () => api.get('/payments');
export const getPayment = (id) => api.get(`/payments/${id}`);
export const getPaymentsByMember = (memberId) => api.get(`/payments/member/${memberId}`);
export const createPayment = (data) => api.post('/payments', data);
export const updatePayment = (id, data) => api.put(`/payments/${id}`, data);
export const deletePayment = (id) => api.delete(`/payments/${id}`);
//////////
export const submitPayment = (data) => api.post('/payments/submit', data);
export const validatePayment = (id) => api.put(`/payments/${id}/validate`);
export const rejectPayment = (id) => api.put(`/payments/${id}/reject`);
export const getPendingPaymentsCount = () => api.get('/payments/pending-count');

// ---------- ATTENDANCE ----------
export const getAttendance = () => api.get('/attendance');
export const getAttendanceByMember = (memberId) => api.get(`/attendance/member/${memberId}`);
export const checkIn = (memberId) => api.post('/attendance/check-in', { member_id: memberId });
export const checkOut = (attendanceId) => api.put(`/attendance/check-out/${attendanceId}`);
export const deleteAttendance = (id) => api.delete(`/attendance/${id}`);

// ---------- NOTIFICATIONS ----------
export const getNotifications = () => api.get('/notifications');
export const getNotificationsByMember = (memberId) => api.get(`/notifications/member/${memberId}`);
export const createNotification = (data) => api.post('/notifications', data);
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);

// ---------- CLASS BOOKINGS ----------
export const getBookings = () => api.get('/bookings');
export const getBookingsByMember = (memberId) => api.get(`/bookings/member/${memberId}`);
export const getBookingsByClass = (classId) => api.get(`/bookings/class/${classId}`);
export const createBooking = (data) => api.post('/bookings', data);
export const cancelBooking = (id) => api.put(`/bookings/${id}/cancel`);
export const markAttended = (id) => api.put(`/bookings/${id}/attend`);

export default api;