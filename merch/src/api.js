// src/api.js
import axios from "axios";

// Use environment variable for API URL
// Local: http://localhost:4000
// Production: https://bmsce-merch-backend.onrender.com
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 60000, // 60 second timeout for Render cold start (free tier can take 50+ sec to wake)
});

// Attach token from localStorage on every request as fallback
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  return config;
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
}

export default api;

