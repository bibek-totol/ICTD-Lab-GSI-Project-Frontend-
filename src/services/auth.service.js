import api from "./api";

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
    
    // Store user data and token in localStorage for persistence
    if (response.data?.data) {
        localStorage.setItem("user", JSON.stringify(response.data.data));
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
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
    localStorage.removeItem("user");
    localStorage.removeItem("token");
};

const getCurrentUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user"));
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
};

export default AuthService;
