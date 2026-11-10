import api from './axios.js';

export const createPayment = (payload) => api.post('/payments', payload);
export const listPayments = (params) => api.get('/payments', { params });
export const getPayment = (id) => api.get(`/payments/${id}`);
