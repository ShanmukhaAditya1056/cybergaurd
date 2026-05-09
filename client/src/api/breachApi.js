import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const checkBreach = async (input, type = 'email') => {
  const response = await axios.post(`${API_URL}/breach/check`, { input, type });
  return response.data;
};

export const getBreachHistory = async () => {
  const response = await axios.get(`${API_URL}/breach/history`);
  return response.data;
};
