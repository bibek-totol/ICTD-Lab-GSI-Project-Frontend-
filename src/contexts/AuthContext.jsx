import React, { createContext, useState, useEffect, useContext } from "react";
import AuthService from "../services/auth.service";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            // First try localStorage for instant load
            const cached = AuthService.getCurrentUser();
            if (cached) {
                setUser(cached);
            }

            // Then try to get fresh data from backend
            try {
                const freshUser = await AuthService.getMe();
                if (freshUser) {
                    setUser(freshUser);
                    localStorage.setItem("user", JSON.stringify(freshUser));
                }
            } catch (err) {
                // If not authenticated (cookie expired), clear local storage
                if (!cached) {
                    setUser(null);
                }
            }
            setLoading(false);
        };
        fetchUser();
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

    const logout = () => {
        AuthService.logout();
        setUser(null);
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
