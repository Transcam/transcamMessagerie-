import axios from "axios";

const getBaseURL = () => {
  return `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`;
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  // Timeouts plus longs en production pour gérer la latence réseau
  timeout: import.meta.env.PROD ? 30000 : 10000, // 30s en prod, 10s en dev
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const httpService = {
  get: axiosInstance.get,
  post: axiosInstance.post,
  put: axiosInstance.put,
  patch: axiosInstance.patch,
  delete: axiosInstance.delete,
};
