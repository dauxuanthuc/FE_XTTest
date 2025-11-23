import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function getNotifications() {
  return axios.get(`${API_URL}/api/admin/notifications`);
}

function getUserNotifications() {
  return axios.get(`${API_URL}/api/notifications`);
}

function getAllNotifications() {
  return axios.get(`${API_URL}/api/admin/notifications/all`);
}

function createNotification(payload) {
  return axios.post(`${API_URL}/api/admin/notifications`, payload);
}

function markAsRead(id) {
  return axios.put(`${API_URL}/api/admin/notifications/${id}/read`);
}

function markUserAsRead(id) {
  return axios.put(`${API_URL}/api/notifications/${id}/read`);
}

const notificationApi = {
  getNotifications,
  getUserNotifications,
  getAllNotifications,
  createNotification,
  markAsRead,
  markUserAsRead,
};

export default notificationApi;
