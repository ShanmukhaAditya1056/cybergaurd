import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const scanPhishing = async (input) => {
  const response = await axios.post(`${API_URL}/phishing/scan`, { input });
  return response.data;
};

export const getPhishingHistory = async () => {
  const response = await axios.get(`${API_URL}/phishing/history`);
  return response.data;
};
