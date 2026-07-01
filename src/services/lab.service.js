import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/labs`;

const getLabs = async (params) => {
  const response = await axios.get(API_URL, { params });
  return response.data;
};

const getUnifiedLabs = async () => {
  const response = await axios.get(`${API_URL}/unified-labs`);
  return response.data;
};

const getFilterOptions = async (params) => {
  const response = await axios.get(`${API_URL}/filter-options`, { params });
  return response.data;
};

const getUnifiedFilterOptions = async (params) => {
  const response = await axios.get(`${API_URL}/unified-filter-options`, { params });
  return response.data;
};

const LabService = {
  getLabs,
  getUnifiedLabs,
  getFilterOptions,
  getUnifiedFilterOptions,
};

export default LabService;
