import { httpService } from "./http-service";

export interface Departure {
  id: number;
  general_waybill_number: string | null;
  pdf_path: string | null;
  status: "open" | "sealed" | "closed";
  route: string | null;
  vehicle: { id: number; registration_number: string; name: string; type: string; status: string } | null;
  vehicle_id: number | null;
  driver_name: string | null;
  notes: string | null;
  sealed_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  shipments?: any[];
  created_by?: { id: number; username: string; email: string };
  sealed_by?: { id: number; username: string; email: string };
  closed_by?: { id: number; username: string; email: string };
}

export interface CreateDepartureDTO {
  route?: string;
  vehicle_id?: number;
  driver_name?: string;
  notes?: string;
}

export interface UpdateDepartureDTO {
  route?: string;
  vehicle_id?: number;
  driver_name?: string;
  notes?: string;
}

export interface DepartureFilters {
  status?: string;
  route?: string;
  dateFrom?: string;
  dateTo?: string;
  generalWaybillNumber?: string;
  page?: number;
  limit?: number;
}

export interface DepartureListResponse {
  data: Departure[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DepartureSummary {
  departure: Departure;
  shipment_count: number;
  total_price: number;
  total_weight: number;
  total_declared_value: number;
}

export const departureService = {
  // List departures with filters
  list: async (filters?: DepartureFilters): Promise<DepartureListResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.route) params.append("route", filters.route);
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);
    if (filters?.generalWaybillNumber) params.append("generalWaybillNumber", filters.generalWaybillNumber);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await httpService.get(`/departures?${params.toString()}`);
    return response.data;
  },

  // Get single departure
  getOne: async (id: number): Promise<Departure> => {
    const response = await httpService.get(`/departures/${id}`);
    return response.data.data;
  },

  // Create departure
  create: async (data: CreateDepartureDTO): Promise<Departure> => {
    const response = await httpService.post("/departures", data);
    return response.data.data;
  },

  // Update departure
  update: async (id: number, data: UpdateDepartureDTO): Promise<Departure> => {
    const response = await httpService.patch(`/departures/${id}`, data);
    return response.data.data;
  },

  // Assign shipments to departure
  assignShipments: async (id: number, shipmentIds: number[]): Promise<{ departure: Departure; assigned_count: number }> => {
    const response = await httpService.post(`/departures/${id}/shipments`, { shipment_ids: shipmentIds });
    return response.data.data;
  },

  // Remove shipment from departure
  removeShipment: async (id: number, shipmentId: number): Promise<Departure> => {
    const response = await httpService.delete(`/departures/${id}/shipments/${shipmentId}`);
    return response.data.data;
  },

  // Seal departure and generate General Waybill
  seal: async (id: number): Promise<{ departure: Departure; general_waybill_number: string; pdf_url: string }> => {
    const response = await httpService.post(`/departures/${id}/seal`);
    return response.data;
  },

  // Close departure
  close: async (id: number): Promise<Departure> => {
    const response = await httpService.post(`/departures/${id}/close`);
    return response.data.data;
  },

  // Get departure summary with totals
  getSummary: async (id: number): Promise<DepartureSummary> => {
    const response = await httpService.get(`/departures/${id}/summary`);
    return response.data.data;
  },

  // Download General Waybill PDF
  downloadPDF: async (id: number): Promise<void> => {
    const response = await httpService.get(`/departures/${id}/general-waybill`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `general-waybill-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

