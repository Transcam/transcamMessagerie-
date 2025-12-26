import axios from "axios";

const getBaseURL = () => {
  return `${process.env["VITE_API_URL"] || "http://localhost:3000"}/api`;
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
});

export const httpService = {
  get: axiosInstance.get,
  post: axiosInstance.post,
  put: axiosInstance.put,
  delete: axiosInstance.delete,
};
