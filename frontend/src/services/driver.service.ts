import { httpService } from "./http-service";

export enum DriverStatus {
  ACTIF = "actif",
  INACTIF = "inactif",
}

export const DRIVER_STATUS_LABELS: Record<DriverStatus, { fr: string; en: string }> = {
  [DriverStatus.ACTIF]: { fr: "Actif", en: "Active" },
  [DriverStatus.INACTIF]: { fr: "Inactif", en: "Inactive" },
};

export interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  license_number: string;
  email: string | null;
  address: string | null;
  status: DriverStatus;
  created_by: { id: number; username: string };
  created_at: string;
  updated_at: string;
  departures?: any[];
}

export interface CreateDriverDTO {
  first_name: string;
  last_name: string;
  phone: string;
  license_number: string;
  email?: string;
  address?: string;
  status?: DriverStatus;
}

export interface UpdateDriverDTO {
  first_name?: string;
  last_name?: string;
  phone?: string;
  license_number?: string;
  email?: string;
  address?: string;
  status?: DriverStatus;
}

export interface DriverFilters {
  status?: DriverStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DriverListResponse {
  data: Driver[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const driverService = {
  // List drivers with filters
  list: async (filters?: DriverFilters): Promise<DriverListResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await httpService.get(`/drivers?${params.toString()}`);
    return response.data;
  },

  // Get single driver
  getOne: async (id: number): Promise<Driver> => {
    const response = await httpService.get(`/drivers/${id}`);
    return response.data.data || response.data;
  },

  // Create driver
  create: async (data: CreateDriverDTO): Promise<Driver> => {
    const response = await httpService.post("/drivers", data);
    return response.data.data || response.data;
  },

  // Update driver
  update: async (id: number, data: UpdateDriverDTO): Promise<Driver> => {
    const response = await httpService.patch(`/drivers/${id}`, data);
    return response.data.data || response.data;
  },

  // Delete driver
  delete: async (id: number): Promise<void> => {
    await httpService.delete(`/drivers/${id}`);
  },

  // Get available drivers (ACTIF only)
  getAvailable: async (): Promise<Driver[]> => {
    const response = await httpService.get("/drivers/available");
    return response.data.data || response.data;
  },
};

