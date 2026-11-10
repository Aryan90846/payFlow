import api from './axios.js';

export const getDashboard = () => api.get('/admin/dashboard');
export const runExpiryCheck = () => api.post('/admin/expire-subscriptions');
