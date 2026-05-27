import axios from 'axios';

// ─── Axios instance ───────────────────────────────────────────
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,        // send httpOnly cookies
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Response interceptor: auto-refresh on 401 ───────────────
let refreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (
      err.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(() => api(original)).catch(e => Promise.reject(e));
      }
      original._retry = true;
      refreshing = true;
      try {
        await api.post('/auth/refresh');
        refreshQueue.forEach(({ resolve }) => resolve());
        refreshQueue = [];
        return api(original);
      } catch (refreshErr) {
        refreshQueue.forEach(({ reject }) => reject(refreshErr));
        refreshQueue = [];
        // Hard redirect to login on refresh failure
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  register:           (data)  => api.post('/auth/register', data),
  verifyEmail:        (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  login:              (data)  => api.post('/auth/login', data),
  logout:             ()      => api.post('/auth/logout'),
  refresh:            ()      => api.post('/auth/refresh'),
  forgotPassword:     (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:      (data)  => api.post('/auth/reset-password', data),
  getMe:              ()      => api.get('/auth/me'),
};

// ─── Users ────────────────────────────────────────────────────
export const userApi = {
  getProfile:           ()     => api.get('/users/profile'),
  updateProfile:        (data) => api.patch('/users/profile', data),
  changePassword:       (data) => api.patch('/users/change-password', data),
  getBadges:            ()     => api.get('/users/badges'),
  getNotifications:     ()     => api.get('/users/notifications'),
  markNotificationsRead:()     => api.patch('/users/notifications/read-all'),
};

// ─── Activation ───────────────────────────────────────────────
export const activationApi = {
  redeem:    (code) => api.post('/activation/redeem', { code }),
  getStatus: ()     => api.get('/activation/status'),
};

// ─── Exams ────────────────────────────────────────────────────
export const examApi = {
  getSubjects:  ()                    => api.get('/exams/subjects'),
  getConfigs:   ()                    => api.get('/exams/configs'),
  start:        (data)                => api.post('/exams/start', data),
  saveAnswer:   (sessionId, data)     => api.patch(`/exams/${sessionId}/answer`, data),
  toggleFlag:   (sessionId, data)     => api.patch(`/exams/${sessionId}/flag`, data),
  syncTime:     (sessionId, data)     => api.patch(`/exams/${sessionId}/sync-time`, data),
  submit:       (sessionId)           => api.post(`/exams/${sessionId}/submit`),
  getHistory:   (page = 1, limit = 10)=> api.get(`/exams/history?page=${page}&limit=${limit}`),
  getReview:    (sessionId)           => api.get(`/exams/${sessionId}/review`),
};

// ─── Admin ────────────────────────────────────────────────────
export const adminApi = {
  getDashboard:    ()           => api.get('/admin/dashboard'),
  // Activation codes
  generateCodes:   (data)       => api.post('/admin/activation-codes/generate', data),
  getCodes:        (params)     => api.get('/admin/activation-codes', { params }),
  deleteCode:      (id)         => api.delete(`/admin/activation-codes/${id}`),
  // Students
  getStudents:     (params)     => api.get('/admin/students', { params }),
  toggleStudent:   (id)         => api.patch(`/admin/students/${id}/toggle`),
  // Questions
  getQuestions:    (params)     => api.get('/admin/questions', { params }),
  addQuestion:     (data)       => api.post('/admin/questions/manual', data),
  uploadQuestions: (formData)   => api.post('/admin/questions/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteQuestion:  (id)         => api.delete(`/admin/questions/${id}`),
};

export default api;
