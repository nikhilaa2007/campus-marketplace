import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach the saved token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errorMessage = (err) => err.response?.data?.message || 'Something went wrong';

export default api;
