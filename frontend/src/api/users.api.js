import api from './axios.js';

export const getProfile = () => api.get('/users/me');
export const updateProfile = (payload) => api.put('/users/me', payload);
export const listUsers = (params) => api.get('/users', { params });
export const updateUserRole = (id, payload) => api.put(`/users/${id}/role`, payload);
