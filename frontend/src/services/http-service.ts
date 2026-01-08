import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { offlineQueue } from "./offline-queue";

const getBaseURL = () => {
  return `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`;
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  // Timeouts plus longs en production pour gérer la latence réseau
  timeout: import.meta.env.PROD ? 30000 : 10000, // 30s en prod, 10s en dev
});

// Methods that should be queued when offline
// Note: GET requests will be queued and retried, but may return stale data
const QUEUEABLE_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // Handle network errors or when offline
    if (
      (!navigator.onLine ||
        error.code === "ERR_NETWORK" ||
        error.code === "ECONNABORTED") &&
      error.config &&
      QUEUEABLE_METHODS.includes(error.config.method?.toUpperCase() || "")
    ) {
      const method = (error.config.method?.toUpperCase() || "GET") as
        | "GET"
        | "POST"
        | "PUT"
        | "PATCH"
        | "DELETE";
      const url = error.config.url || "";

      // Extract headers (excluding Authorization which will be added from localStorage on retry)
      const headers = { ...error.config.headers };
      delete headers["Authorization"];
      delete headers["authorization"];

      try {
        await offlineQueue.queueRequest(
          method,
          url,
          error.config.data,
          headers as Record<string, string>,
          error.config.params
        );

        // Create a proper Error object that React Query can handle
        const queuedError: Error & {
          isQueued: boolean;
          response?: typeof error.response;
        } = Object.assign(new Error("Request queued for retry when online"), {
          isQueued: true,
          response: error.response,
        });
        return Promise.reject(queuedError);
      } catch (queueError) {
        console.error("Failed to queue request:", queueError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Wrapper functions that check online status before making requests
 */
const createHttpMethod = (
  method: "get" | "post" | "put" | "patch" | "delete"
) => {
  return async (url: string, data?: unknown, config?: AxiosRequestConfig) => {
    // If offline and it's a queueable method, queue it immediately
    if (!navigator.onLine && QUEUEABLE_METHODS.includes(method.toUpperCase())) {
      const headers = (config?.headers as Record<string, string>) || {};
      try {
        const queueId = await offlineQueue.queueRequest(
          method.toUpperCase() as "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
          url,
          data,
          headers,
          config?.params
        );
        // Create a proper Error object that React Query can handle
        const queuedError: Error & { isQueued: boolean; queueId?: string } =
          Object.assign(new Error("Request queued for retry when online"), {
            isQueued: true,
            queueId,
          });
        throw queuedError;
      } catch (error: unknown) {
        if (error && typeof error === "object" && "isQueued" in error) {
          throw error;
        }
        // If queueing failed, throw network error
        throw new Error("Network error: Unable to queue request");
      }
    }

    // Otherwise, proceed with normal request
    if (method === "get" || method === "delete") {
      return await axiosInstance[method](url, config);
    } else {
      return await axiosInstance[method](url, data, config);
    }
  };
};

export const httpService = {
  get: createHttpMethod("get"),
  post: createHttpMethod("post"),
  put: createHttpMethod("put"),
  patch: createHttpMethod("patch"),
  delete: createHttpMethod("delete"),
};

// Export axios instance for direct use if needed (e.g., for blob requests)
export { axiosInstance };
