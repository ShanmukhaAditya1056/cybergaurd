import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const analyzeWifi = async (data) => {
  const response = await axios.post(`${API_URL}/wifi/analyze`, data);
  return response.data;
};

export const autoScanWifi = async () => {
  const response = await axios.post(`${API_URL}/wifi/auto-scan`);
  return response.data;
};

export const getWifiHistory = async () => {
  const response = await axios.get(`${API_URL}/wifi/history`);
  return response.data;
};
