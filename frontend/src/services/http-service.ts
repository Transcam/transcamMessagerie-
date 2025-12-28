import axios from "axios";

const getBaseURL = () => {
  return `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`;
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
});

// Request interceptor - Add auth token when colleague implements auth
// TODO: Uncomment and configure when auth is ready
// axiosInstance.interceptors.request.use((config) => {
//   const token = localStorage.getItem("auth_token"); // or from auth context
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// Response interceptor - Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 (Unauthorized) - redirect to login
    if (error.response?.status === 401) {
      // TODO: Redirect to login when auth is implemented
      // window.location.href = "/login";
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
