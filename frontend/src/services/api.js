import axios from 'axios';

const envBaseUrl = process.env.REACT_APP_API_BASE_URL;
const isProd = process.env.NODE_ENV === 'production';

const api = axios.create({
  baseURL: envBaseUrl || (isProd ? undefined : 'http://localhost:5000/api')
});

if (isProd && !envBaseUrl) {
  // eslint-disable-next-line no-console
  console.warn('Missing REACT_APP_API_BASE_URL; API calls may fail in production.');
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
