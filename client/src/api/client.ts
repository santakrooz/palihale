import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (username: string, email: string, password: string) =>
  api.post('/auth/register', { username, email, password });

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

// Markets
export const getMarkets = (resolved?: boolean) =>
  api.get('/markets', { params: { resolved } });

export const getMarket = (id: number) =>
  api.get(`/markets/${id}`);

export const createMarket = (question: string, description: string, endDate: string) =>
  api.post('/markets', { question, description, endDate });

export const resolveMarket = (id: number, outcome: boolean) =>
  api.post(`/markets/${id}/resolve`, { outcome });

// Trades
export const buyShares = (marketId: number, outcome: boolean, amount: number) =>
  api.post('/trades/buy', { marketId, outcome, amount });

export const sellShares = (marketId: number, outcome: boolean, shares: number) =>
  api.post('/trades/sell', { marketId, outcome, shares });

export const getTradeHistory = () =>
  api.get('/trades/history');

// User
export const getCurrentUser = () =>
  api.get('/users/me');

export const getUserPositions = () =>
  api.get('/users/positions');
