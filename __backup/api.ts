// src/services/api.ts
import axios from 'axios';

// Ein Client für alle Requests.
// Basis-URL: /api -> Vite-Proxy leitet an dein Backend weiter.
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // 🔑 sendet Cookies immer mit
  headers: {
    'Content-Type': 'application/json',
  },
});

// Häufig genutzte Helfer (optional, praktisch):
export const getSession = () => api.get('/session').then(r => r.data);
export const postLogin = (data: { email: string; password: string }) =>
  api.post('/auth/login', data).then(r => r.data);
export const postRegister = (data: { email: string; password: string; name?: string }) =>
  api.post('/auth/register', data).then(r => r.data);
export const postLogout = () => api.post('/auth/mock-logout').then(r => r.data);
export const getSubStatus = () => api.get('/subscription/status').then(r => r.data);
