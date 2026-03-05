import api from "./api";
import {
  TOKEN_EXPIRY_MS,
  AUTH_STORAGE_KEYS,
} from "../config/auth.config.js";

/** Clear all auth-related data from localStorage (token, user, expiry, login state). */
export const clearAuthStorage = () => {
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRES_AT);
  localStorage.removeItem(AUTH_STORAGE_KEYS.LOGIN_PAGE_STATE);
};

/** Return true if token is missing or past its expiry time. */
export const isTokenExpired = () => {
  const expiresAt = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRES_AT);
  if (!expiresAt) return true;
  const now = Date.now();
  return now >= Number(expiresAt);
};

/** If token is expired, clear auth storage and return true; otherwise return false. */
export const clearAuthIfExpired = () => {
  if (isTokenExpired()) {
    clearAuthStorage();
    return true;
  }
  return false;
};

const register = async (email, password) => {
    const response = await api.post(`/auth/signup`, {
        email,
        password,
    });
    return response.data;
};

const login = async (email, password) => {
    const response = await api.post(`/auth/signin`, {
        email,
        password,
    });
    
    // Store user data and token in localStorage with 5h expiry for security
    if (response.data?.data) {
        localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(response.data.data));
        if (response.data.token) {
            localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, response.data.token);
            const expiresAt = Date.now() + TOKEN_EXPIRY_MS;
            localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));
        }
    }
    return response.data?.data || response.data;
};

const getMe = async () => {
    const response = await api.get(`/auth/me`);
    return response.data?.data;
};

const verifyEmail = async (email) => {
    const response = await api.post(`/auth/verify/email`, { email });
    return response.data;
};

const verifyEmailCode = async (email, emailCode) => {
    const response = await api.post(`/auth/verify/code`, { email, emailCode });
    return response.data;
};

const logout = async () => {
    try {
        await api.post(`/auth/logout`, {});
    } catch (err) {
        console.error("Logout error:", err);
    }
    clearAuthStorage();
};

const getCurrentUser = () => {
    if (isTokenExpired()) {
        clearAuthStorage();
        return null;
    }
    try {
        return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEYS.USER));
    } catch {
        return null;
    }
};

const AuthService = {
    register,
    login,
    logout,
    getCurrentUser,
    getMe,
    verifyEmail,
    verifyEmailCode,
    clearAuthStorage,
    isTokenExpired,
    clearAuthIfExpired,
    AUTH_STORAGE_KEYS,
};

export default AuthService;
