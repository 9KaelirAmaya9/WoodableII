import axios from 'axios';

// Always use relative path for API, so Traefik can route correctly
const API_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Register new user
  register: async (email, password, name) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },

  // Login with email/password
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Google OAuth login
  googleAuth: async (googleId, email, name, picture) => {
    const response = await api.post('/auth/google', { googleId, email, name, picture });
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  // Request password reset
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, password) => {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Menu API calls
export const menuAPI = {
  getCategories: async () => {
    const response = await api.get('/menu/categories');
    return response.data;
  },

  getItems: async () => {
    const response = await api.get('/menu/items');
    return response.data;
  },

  createCategory: async (data) => {
    const response = await api.post('/menu/categories', data);
    return response.data;
  },

  createItem: async (data) => {
    const response = await api.post('/menu/items', data);
    return response.data;
  },

  updateItem: async (id, data) => {
    const response = await api.put(`/menu/items/${id}`, data);
    return response.data;
  },

  deleteItem: async (id) => {
    const response = await api.delete(`/menu/items/${id}`);
    return response.data;
  },
};

// Order API calls
export const orderAPI = {
  createOrder: async (orderData) => {
    // orderData: { items: [{id, quantity}], customer_name, customer_phone, special_instructions }
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getAllOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/orders/analytics');
    return response.data;
  },
};

// Work Order API calls
export const workOrderAPI = {
  createWorkOrder: async (data) => {
    const response = await api.post('/workorders', data);
    return response.data;
  },

  getWorkOrders: async (filters = {}) => {
    const response = await api.get('/workorders', { params: filters });
    return response.data;
  },

  getWorkOrderById: async (id) => {
    const response = await api.get(`/workorders/${id}`);
    return response.data;
  },

  updateWorkOrder: async (id, data) => {
    const response = await api.put(`/workorders/${id}`, data);
    return response.data;
  },

  deleteWorkOrder: async (id) => {
    const response = await api.delete(`/workorders/${id}`);
    return response.data;
  },

  downloadPDF: async (id) => {
    const response = await api.get(`/workorders/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};


export default api;
