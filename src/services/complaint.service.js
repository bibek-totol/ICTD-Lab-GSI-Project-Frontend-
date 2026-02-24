import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL + "/complaints";

const getComplaints = async (params) => {
    const response = await axios.get(API_URL, { params });
    return response.data;
};

const createComplaint = async (data) => {
    const response = await axios.post(API_URL, data);
    return response.data;
};

const updateComplaint = async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
};

const deleteComplaint = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};

const ComplaintService = {
    getComplaints,
    createComplaint,
    updateComplaint,
    deleteComplaint,
};

export default ComplaintService;
