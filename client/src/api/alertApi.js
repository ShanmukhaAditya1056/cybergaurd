import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const getAlerts = async (type) => {
  const params = type && type !== 'All' ? `?type=${type}` : '';
  const response = await axios.get(`${API_URL}/alerts${params}`);
  return response.data;
};

export const markAlertAsRead = async (id) => {
  const response = await axios.patch(`${API_URL}/alerts/${id}/read`);
  return response.data;
};

export const deleteAlert = async (id) => {
  const response = await axios.delete(`${API_URL}/alerts/${id}`);
  return response.data;
};
