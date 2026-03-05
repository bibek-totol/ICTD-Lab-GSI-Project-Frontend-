import axios from "axios";
import AuthService from "./auth.service";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Request interceptor: Attach token only if present and not expired (5h security)
api.interceptors.request.use(
  (config) => {
    if (AuthService.isTokenExpired()) {
      AuthService.clearAuthStorage();
      return config;
    }
    const token = localStorage.getItem(AuthService.AUTH_STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: clear auth on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AuthService.clearAuthStorage();
    }
    return Promise.reject(error);
  }
);

export default api;
