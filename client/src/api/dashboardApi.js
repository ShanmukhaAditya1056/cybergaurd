import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const getSecurityScore = async () => {
  const response = await axios.get(`${API_URL}/dashboard/score`);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await axios.get(`${API_URL}/dashboard/stats`);
  return response.data;
};

export const clearAllScans = async () => {
  const response = await axios.delete(`${API_URL}/scans/all`);
  return response.data;
};

export const healthCheck = async () => {
  const response = await axios.get(`${API_URL}/health`);
  return response.data;
};
