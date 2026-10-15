import api from './api';

// Trainers assigned to a member (trainers of the classes the member booked)
export const getMemberTrainers = (memberId) => api.get(`/messages/member/${memberId}/trainers`);