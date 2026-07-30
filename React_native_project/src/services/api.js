import axios from 'axios';
import { cookieManager } from '../utils/cookieManager';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://railway-iot-testing-2soh.onrender.com'
).replace(/\/+$/, '');

const ACCESS_TOKEN_KEY = 'session_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

const saveSession = async ({ accessToken, refreshToken }) => {
  if (accessToken) {
    await cookieManager.setCookie(ACCESS_TOKEN_KEY, accessToken, 7);
  }

  if (refreshToken) {
    await cookieManager.setCookie(REFRESH_TOKEN_KEY, refreshToken, 30);
  }
};

const clearSession = async () => {
  await Promise.all([
    cookieManager.clearCookie(ACCESS_TOKEN_KEY),
    cookieManager.clearCookie(REFRESH_TOKEN_KEY),
  ]);
};

apiClient.interceptors.request.use(async (config) => {
  const accessToken = await cookieManager.getCookie(ACCESS_TOKEN_KEY);

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

let refreshRequest;

const refreshAccessToken = async () => {
  if (!refreshRequest) {
    refreshRequest = (async () => {
      const refreshToken = await cookieManager.getCookie(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const response = await apiClient.post(
        '/api/auth/refresh-token',
        { token: refreshToken },
        { skipAuthRefresh: true }
      );
      const accessToken = response.data?.data?.accessToken;

      if (!accessToken) {
        throw new Error('The server did not return a refreshed access token.');
      }

      await saveSession({ accessToken });
      return accessToken;
    })().finally(() => {
      refreshRequest = undefined;
    });
  }

  return refreshRequest;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const statusCode = error.response?.status;

    if (
      statusCode !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.skipAuthRefresh
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      await clearSession();
      return Promise.reject(refreshError);
    }
  }
);

export const api = {
  health: () => apiClient.get('/api/health'),
  auth: {
    register: (payload) => apiClient.post('/api/auth/register', payload),
    login: (email) => apiClient.post('/api/auth/login', { email }),
    verifyOtp: async (email, otp) => {
      const response = await apiClient.post('/api/auth/verify-otp', { email, otp });
      await saveSession(response.data?.data || {});
      return response;
    },
    me: () => apiClient.get('/api/auth/me'),
    logout: async () => {
      const refreshToken = await cookieManager.getCookie(REFRESH_TOKEN_KEY);

      try {
        if (refreshToken) {
          await apiClient.post('/api/auth/logout', { token: refreshToken });
        }
      } finally {
        await clearSession();
      }
    },
    hasSession: async () => Boolean(await cookieManager.getCookie(ACCESS_TOKEN_KEY)),
    clearSession,
  },
  users: {
    getProfile: () => apiClient.get('/api/users/profile'),
    updateProfile: (payload) => apiClient.patch('/api/users/profile', payload),
    getFavouriteGates: () => apiClient.get('/api/users/favourite-gates'),
    updateFavouriteGates: (gates) => apiClient.put('/api/users/favourite-gates', { gates }),
    enableNotifications: () => apiClient.patch('/api/users/notifications/enable'),
    disableNotifications: () => apiClient.patch('/api/users/notifications/disable'),
  },
  gates: {
    list: () => apiClient.get('/api/gates'),
    getById: (gateId) => apiClient.get(`/api/gates/${gateId}`),
    getByCode: (gateCode) => apiClient.get(`/api/gates/code/${gateCode}`),
    getCurrentStatus: (gateId) => apiClient.get(`/api/gates/${gateId}/current-status`),
    getHistory: (gateId, limit = 50) => apiClient.get(`/api/gates/${gateId}/history`, { params: { limit } }),
    create: (payload) => apiClient.post('/api/gates', payload),
    update: (gateId, payload) => apiClient.patch(`/api/gates/${gateId}`, payload),
    remove: (gateId) => apiClient.delete(`/api/gates/${gateId}`),
    assignDevice: (gateId, deviceId) => apiClient.put(`/api/gates/${gateId}/assign-device`, { deviceId }),
    unassignDevice: (gateId) => apiClient.delete(`/api/gates/${gateId}/unassign-device`),
    updateStatus: (gateId, status) => apiClient.patch(`/api/gates/${gateId}/status`, { status }),
  },
  devices: {
    list: () => apiClient.get('/api/devices'),
    getById: (deviceId) => apiClient.get(`/api/devices/${deviceId}`),
    getByCode: (deviceCode) => apiClient.get(`/api/devices/code/${deviceCode}`),
    register: (payload) => apiClient.post('/api/devices', payload),
    update: (deviceId, payload) => apiClient.patch(`/api/devices/${deviceId}`, payload),
    remove: (deviceId) => apiClient.delete(`/api/devices/${deviceId}`),
    updateFirmware: (deviceId, firmwareVersion) => apiClient.patch(`/api/devices/${deviceId}/firmware`, { firmwareVersion }),
    markOnline: (deviceId) => apiClient.patch(`/api/devices/${deviceId}/online`),
    markOffline: (deviceId) => apiClient.patch(`/api/devices/${deviceId}/offline`),
    updateRssi: (deviceId, rssi) => apiClient.patch(`/api/devices/${deviceId}/rssi`, { rssi }),
    updateHeartbeat: (deviceId, payload) => apiClient.patch(`/api/devices/${deviceId}/heartbeat`, payload),
    assignGate: (deviceId, gateId) => apiClient.put(`/api/devices/${deviceId}/assign-gate`, { gateId }),
    unassignGate: (deviceId) => apiClient.delete(`/api/devices/${deviceId}/unassign-gate`),
  },
  iot: {
    sendStatus: (payload) => apiClient.post('/api/iot/status', payload),
    sendHeartbeat: (payload) => apiClient.post('/api/iot/heartbeat', payload),
    getDeviceStatus: (deviceCode) => apiClient.get(`/api/iot/device/${deviceCode}/status`),
    getDeviceHeartbeat: (deviceCode) => apiClient.get(`/api/iot/device/${deviceCode}/heartbeat`),
  },
  notifications: {
    list: () => apiClient.get('/api/notifications'),
    unreadCount: () => apiClient.get('/api/notifications/unread-count'),
    markRead: (notificationId) => apiClient.patch(`/api/notifications/${notificationId}/read`),
    remove: (notificationId) => apiClient.delete(`/api/notifications/${notificationId}`),
    create: (payload) => apiClient.post('/api/notifications', payload),
  },
};

export default apiClient;
