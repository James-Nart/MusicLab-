import axios from 'axios';

const API_BASE_URL = 'http://localhost:5100';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attaches token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('musiclab_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;