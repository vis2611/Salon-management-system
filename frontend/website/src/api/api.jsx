import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: false,
});

// ── Attach access token to every request ────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-refresh on 401 ──────────────────────
let refreshing = false;
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && !refreshing) {
      original._retry = true;
      refreshing = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post("/api/auth/refresh", { refreshToken });
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

// ── API helpers ──────────────────────────────
export const authAPI = {
  register: (d) => api.post("/auth/register", d),
  login: (d) => api.post("/auth/login", d),
  logout: (refreshToken) => api.post("/auth/logout", { refreshToken }),
  me: () => api.get("/auth/me"),
};

export const servicesAPI = {
  list: (p) => api.get("/services", { params: p }),
  categories: () => api.get("/services/categories"),
  get: (id) => api.get(`/services/${id}`),
  create: (d) => api.post("/services", d),
  update: (id, d) => api.put(`/services/${id}`, d),
  delete: (id) => api.delete(`/services/${id}`),
};

export const staffAPI = {
  list: () => api.get("/staff"),
  get: (id) => api.get(`/staff/${id}`),
  create: (d) => api.post("/staff", d),
  update: (id, d) => api.put(`/staff/${id}`, d),
  assignServices: (id, serviceIds) => api.put(`/staff/${id}/services`, { serviceIds }),
  setHours: (id, hours) => api.put(`/staff/${id}/working-hours`, { hours }),
};

export const appointmentsAPI = {
  list: (p) => api.get("/appointments", { params: p }),
  get: (id) => api.get(`/appointments/${id}`),
  create: (d) => api.post("/appointments", d),
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
  cancel: (id) => api.delete(`/appointments/${id}`),
  availability: (p) => api.get("/appointments/check/availability", { params: p }),
};

export const paymentsAPI = {
  createOrder: (appointmentId) => api.post("/payments/create-order", { appointmentId }),
  verify: (d) => api.post("/payments/verify", d),
  myPayments: () => api.get("/payments/my"),
};

export const reviewsAPI = {
  list: (p) => api.get("/reviews", { params: p }),
  create: (d) => api.post("/reviews", d),
};

export const photosAPI = {
  list: (p) => api.get("/photos", { params: p }),
  upload: (formData) => api.post("/photos", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, d) => api.patch(`/photos/${id}`, d),
  delete: (id) => api.delete(`/photos/${id}`),
};

export const couponsAPI = {
  validate: (d) => api.post("/coupons/validate", d),
  list: () => api.get("/coupons"),
  create: (d) => api.post("/coupons", d),
};

export const notificationsAPI = {
  list: () => api.get("/notifications"),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};

export const adminAPI = {
  dashboard: () => api.get("/admin/dashboard"),
  revenue: (p) => api.get("/admin/revenue", { params: p }),
  appointments: (p) => api.get("/admin/appointments", { params: p }),
  staffPerformance: () => api.get("/admin/staff-performance"),
  auditLogs: (p) => api.get("/admin/audit-logs", { params: p }),
  users: (p) => api.get("/users", { params: p }),
};

export default api;