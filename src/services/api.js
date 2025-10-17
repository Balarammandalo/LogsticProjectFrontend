import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

// Vehicle API
export const vehicleAPI = {
  getVehicles: () => api.get('/vehicles'),
  getVehicle: (id) => api.get(`/vehicles/${id}`),
  createVehicle: (vehicleData) => api.post('/vehicles', vehicleData),
  updateVehicle: (id, vehicleData) => api.put(`/vehicles/${id}`, vehicleData),
  deleteVehicle: (id) => api.delete(`/vehicles/${id}`),
  assignDriver: (id, driverId) => api.put(`/vehicles/${id}/assign-driver`, { driverId }),
  updateLocation: (id, location) => api.put(`/vehicles/${id}/location`, location),
};

// Delivery API
export const deliveryAPI = {
  getDeliveries: () => api.get('/deliveries'),
  getDelivery: (id) => api.get(`/deliveries/${id}`),
  createDelivery: (deliveryData) => api.post('/deliveries', deliveryData),
  updateStatus: (id, statusData) => api.put(`/deliveries/${id}/status`, statusData),
  assignDelivery: (id, assignmentData) => api.put(`/deliveries/${id}/assign`, assignmentData),
  getTracking: (id) => api.get(`/deliveries/${id}/track`),
};

// Analytics API (if needed)
export const analyticsAPI = {
  getStats: () => api.get('/analytics/stats'),
  getDriverStats: () => api.get('/analytics/drivers'),
  getVehicleStats: () => api.get('/analytics/vehicles'),
};

export default api;
