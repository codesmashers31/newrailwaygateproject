import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Hardcoded backend URL
});

// Interceptor to inject token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
