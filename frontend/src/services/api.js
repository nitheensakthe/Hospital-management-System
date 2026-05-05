import axios from 'axios';

const envBaseUrl = process.env.REACT_APP_API_BASE_URL;
const isProd = process.env.NODE_ENV === 'production';

const api = axios.create({
  baseURL: envBaseUrl || (isProd ? '/api' : 'http://localhost:5000/api')
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
