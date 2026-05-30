import React, { createContext, useState, useEffect, useContext } from "react";
import AuthService from "../services/auth.service";
import api from "../services/api";
import CircularLoader from "../components/sheard/CircularLoader";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Define logout here so it's available for the interceptor
    const logout = async () => {
        setLoading(true);
        await AuthService.logout();
        setUser(null);
        AuthService.clearAuthStorage(); // Ensure all auth keys (token, user, tokenExpiresAt, LoginPageState) are cleared
        setLoading(false);
    };

    useEffect(() => {
        // Apply interceptor to the specific api instance
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Unauthorized - token expired or invalid
                    logout();
                }
                return Promise.reject(error);
            }
        );

        const fetchUser = async () => {
            setLoading(true);
            // Security: if token is past 5h expiry, clear auth and require re-login
            if (AuthService.clearAuthIfExpired()) {
                setUser(null);
                setLoading(false);
                return;
            }

            const cached = AuthService.getCurrentUser();
            if (cached) {
                setUser(cached);
            }

            try {
                const freshUser = await AuthService.getMe();
                if (freshUser) {
                    setUser(freshUser);
                    localStorage.setItem(AuthService.AUTH_STORAGE_KEYS.USER, JSON.stringify(freshUser));
                } else {
                    setUser(null);
                    AuthService.clearAuthStorage();
                }
            } catch (err) {
                console.error("Auth rehydration failed:", err);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setUser(null);
                    AuthService.clearAuthStorage();
                }
            } finally {
                setLoading(false);
            }
        };
        fetchUser();

        // Periodic check: auto-logout when token has exceeded 5h (security)
        const intervalId = setInterval(() => {
            if (AuthService.clearAuthIfExpired()) {
                setUser(null);
            }
        }, 60 * 1000); // every 1 minute

        return () => {
            api.interceptors.response.eject(interceptor);
            clearInterval(intervalId);
        };
    }, []);

    const login = async (email, password) => {
        const data = await AuthService.login(email, password);
        setUser(data);
        return data;
    };

    const register = async (email, password) => {
        return await AuthService.register(email, password);
    };

    const verifyEmail = async (email) => {
        return await AuthService.verifyEmail(email);
    };

    const verifyEmailCode = async (email, code) => {
        return await AuthService.verifyEmailCode(email, code);
    };

    // Role helper computed from user 
    const role = user?.role || null;
    const isSuperAdmin = role === "SuperAdmin";
    const isDivisionAdmin = role === "DivisionAdmin";
    const isDistrictAdmin = role === "DistrictAdmin";
    const isUpazilaAdmin = role === "UpazilaAdmin";
    const isLabAdmin = role === "LabAdmin";

    // Jurisdiction helpers
    const userDivision = user?.division || null;
    const userDistrict = user?.district || null;
    const userUpazila = user?.upazila || null;

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                role,
                isSuperAdmin,
                isDivisionAdmin,
                isDistrictAdmin,
                isUpazilaAdmin,
                isLabAdmin,
                userDivision,
                userDistrict,
                userUpazila,
                login,
                register,
                verifyEmail,
                verifyEmailCode,
                logout,
                setUser,
            }}
        >
            {loading ? <CircularLoader /> : children}
        </AuthContext.Provider>
    );
};

// Custom hook for easy consumption
export const useAuth = () => useContext(AuthContext);
