import api from './api';

export const getMemberProfile = (memberId) => api.get(`/member-profile/${memberId}`);
export const saveMemberProfile = (memberId, data) => api.put(`/member-profile/${memberId}`, data);
export const changeMemberPassword = (memberId, data) => api.put(`/member-profile/${memberId}/password`, data);