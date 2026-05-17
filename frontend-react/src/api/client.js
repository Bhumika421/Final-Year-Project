  import axios from 'axios';

  const API_BASE = 'http://localhost/safe-journey-planner/backend-php/public';

  export const api = axios.create({
    baseURL: API_BASE,
  });

  export function setAuthToken(token) {
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete api.defaults.headers.common['Authorization'];
  }

  export function getToken() {
    return localStorage.getItem('sjp_token');
  }

  export function saveToken(token) {
    localStorage.setItem('sjp_token', token);
    setAuthToken(token);
  }

  export function clearToken() {
    localStorage.removeItem('sjp_token');
    setAuthToken(null);
  }

  // Page load huda token auto-set
  const _t = getToken();
  if (_t) setAuthToken(_t);

  // 401 response aayo bhane token automatically clear gara
  // Yesle loyalty.js ma getToken() null return garcha → API call nai hudaina
  api.interceptors.response.use(
    res => res,
    err => {
      if (err?.response?.status === 401) {
        clearToken();
      }
      return Promise.reject(err);
    }
  );

  export default api;