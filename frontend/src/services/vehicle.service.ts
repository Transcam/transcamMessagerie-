import { httpService } from "./http-service";

export enum VehicleType {
  BUS = "bus",
  COASTER = "coaster",
  MINIBUS = "minibus",
}

export enum VehicleStatus {
  ACTIF = "actif",
  INACTIF = "inactif",
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  [VehicleType.BUS]: "Bus",
  [VehicleType.COASTER]: "Coaster",
  [VehicleType.MINIBUS]: "Minibus",
};

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  [VehicleStatus.ACTIF]: "Actif",
  [VehicleStatus.INACTIF]: "Inactif",
};

export interface Vehicle {
  id: number;
  registration_number: string;
  name: string;
  type: VehicleType;
  status: VehicleStatus;
  created_by: { id: number; username: string };
  created_at: string;
  updated_at: string;
  departures?: any[];
}

export interface CreateVehicleDTO {
  registration_number: string;
  name: string;
  type: VehicleType;
  status?: VehicleStatus;
}

export interface UpdateVehicleDTO {
  registration_number?: string;
  name?: string;
  type?: VehicleType;
  status?: VehicleStatus;
}

export interface VehicleFilters {
  status?: VehicleStatus;
  type?: VehicleType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface VehicleListResponse {
  data: Vehicle[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const vehicleService = {
  // List vehicles with filters
  list: async (filters?: VehicleFilters): Promise<VehicleListResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await httpService.get(`/vehicles?${params.toString()}`);
    return response.data;
  },

  // Get single vehicle
  getOne: async (id: number): Promise<Vehicle> => {
    const response = await httpService.get(`/vehicles/${id}`);
    return response.data.data || response.data;
  },

  // Create vehicle
  create: async (data: CreateVehicleDTO): Promise<Vehicle> => {
    const response = await httpService.post("/vehicles", data);
    return response.data.data || response.data;
  },

  // Update vehicle
  update: async (id: number, data: UpdateVehicleDTO): Promise<Vehicle> => {
    const response = await httpService.patch(`/vehicles/${id}`, data);
    return response.data.data || response.data;
  },

  // Delete vehicle
  delete: async (id: number): Promise<void> => {
    await httpService.delete(`/vehicles/${id}`);
  },

  // Get available vehicles (ACTIF only)
  getAvailable: async (): Promise<Vehicle[]> => {
    const response = await httpService.get("/vehicles/available");
    return response.data.data || response.data;
  },
};

