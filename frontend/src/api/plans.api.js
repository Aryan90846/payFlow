import api from './axios.js';

export const listPlans = (params) => api.get('/plans', { params });
export const getPlan = (id) => api.get(`/plans/${id}`);
export const createPlan = (payload) => api.post('/plans', payload);
export const updatePlan = (id, payload) => api.put(`/plans/${id}`, payload);
export const deletePlan = (id) => api.delete(`/plans/${id}`);
