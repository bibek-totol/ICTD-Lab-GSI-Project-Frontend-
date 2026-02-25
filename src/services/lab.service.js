import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL + "/labs";

const getLabs = async (params) => {
    const response = await axios.get(API_URL, { params });
    return response.data;
};

const getUnifiedLabs = async () => {
    const response = await axios.get(`${API_URL}/unified-labs`);
    return response.data;
};

const LabService = {
    getLabs,
    getUnifiedLabs,
};

export default LabService;
