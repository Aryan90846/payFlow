import api from './axios.js';

export const createSubscription = (payload) => api.post('/subscriptions', payload);
export const listSubscriptions = (params) => api.get('/subscriptions', { params });
export const getCurrentSubscription = () => api.get('/subscriptions/me/current');
export const getSubscription = (id) => api.get(`/subscriptions/${id}`);
export const changePlan = (id, payload) => api.put(`/subscriptions/${id}/change-plan`, payload);
export const cancelSubscription = (id) => api.put(`/subscriptions/${id}/cancel`);
