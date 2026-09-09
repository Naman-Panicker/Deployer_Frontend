import axios from "axios";
import { getToken, clearToken } from "./utils";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:9000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 — clear token and bounce to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      window.location.replace("/login");
    }
    return Promise.reject(error);
  }
);

export default api;
