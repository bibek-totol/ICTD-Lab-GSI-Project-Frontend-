import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL + "/auth";

const register = async (email, password) => {
    const response = await axios.post(`${API_URL}/signup`, {
        email,
        password,
    }, { withCredentials: true });
    return response.data;
};

const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/signin`, {
        email,
        password,
    }, { withCredentials: true });
    
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
    const response = await axios.get(`${API_URL}/me`, {
        withCredentials: true,
    });
    return response.data?.data;
};

const verifyEmail = async (email) => {
    const response = await axios.post(`${API_URL}/verify/email`, { email });
    return response.data;
};

const verifyEmailCode = async (email, emailCode) => {
    const response = await axios.post(`${API_URL}/verify/code`, { email, emailCode });
    return response.data;
};

const logout = () => {
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
