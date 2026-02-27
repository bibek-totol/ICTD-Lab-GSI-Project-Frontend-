import React, { createContext, useState, useEffect, useContext } from "react";
import AuthService from "../services/auth.service";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Define logout here so it's available for the interceptor
    const logout = async () => {
        setLoading(true);
        await AuthService.logout();
        setUser(null);
        localStorage.removeItem("user"); // Ensure local storage is cleared
        localStorage.removeItem("token"); // Ensure token is cleared
        setLoading(false);
    };

    useEffect(() => {
        // Apply interceptor to the specific api instance
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Unauthorized - token expired or invalid
                    logout(); // Call the logout function
                }
                return Promise.reject(error);
            }
        );

        const fetchUser = async () => {
            setLoading(true);
            const cached = AuthService.getCurrentUser();
            if (cached) {
                setUser(cached);
            }

            try {
                const freshUser = await AuthService.getMe();
                if (freshUser) {
                    setUser(freshUser);
                    localStorage.setItem("user", JSON.stringify(freshUser));
                } else {
                    // If backend returns success but no data (shouldn't happen with 401)
                    setUser(null);
                    localStorage.removeItem("user");
                }
            } catch (err) {
                console.error("Auth rehydration failed:", err);
                // Only clear if we actually get a 401 or 403
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setUser(null);
                    localStorage.removeItem("user");
                    localStorage.removeItem("token");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchUser();

        // Cleanup function to eject the interceptor when the component unmounts
        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

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
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Custom hook for easy consumption
export const useAuth = () => useContext(AuthContext);
