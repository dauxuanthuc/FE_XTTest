import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Use `token` key for compatibility with components
const TOKEN_KEY = 'token';

// initialize axios header if token already present
const _existing = localStorage.getItem(TOKEN_KEY);
if (_existing) axios.defaults.headers.common['Authorization'] = `Bearer ${_existing}`;

// Add response interceptor to handle 401
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.log('Token invalid or expired, clearing storage');
      localStorage.removeItem(TOKEN_KEY);
      delete axios.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  delete axios.defaults.headers.common['Authorization'];
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

async function login(username, password) {
  const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
  if (res.data && res.data.token) {
    setToken(res.data.token);
  }
  return res.data;
}

async function signup(username, password, roles) {
  const res = await axios.post(`${API_URL}/api/auth/signup`, { username, password, roles });
  return res.data;
}

function logout() {
  removeToken();
}

function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  const payload = parseJwt(token);
  if (!payload) return null;
  return { username: payload.sub, roles: payload.roles || [] };
}

function isAuthenticated() {
  return !!getToken();
}

const authApi = {
  login,
  signup,
  logout,
  getToken,
  getCurrentUser,
  isAuthenticated,
};

export default authApi;
