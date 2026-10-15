import api from './api';

// One call that returns every number the trainer dashboard needs
export const getTrainerStats = (trainerId) => api.get(`/trainers/${trainerId}/stats`);