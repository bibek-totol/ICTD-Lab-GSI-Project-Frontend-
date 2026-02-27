import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL + "/users";

/**
 * Update user profile
 * @param {FormData} formData - Contains profile data and optionally a profilePicture file
 * @returns {Promise<Object>} - Updated user data
 */
const updateProfile = async (formData) => {
    const response = await axios.put(`${API_URL}/profile`, formData, {
        withCredentials: true,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    
    // Update local storage if successful
    if (response.data?.success && response.data?.data) {
        localStorage.setItem("user", JSON.stringify(response.data.data));
    }
    
    return response.data;
};

const UserService = {
    updateProfile,
    changePassword: async (passwords) => {
        const response = await axios.patch(`${API_URL}/change-password`, passwords, {
            withCredentials: true,
        });
        return response.data;
    },
};

export default UserService;
