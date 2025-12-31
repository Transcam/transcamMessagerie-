import { httpService } from "./http-service";

export type ShipmentType = "express" | "standard";
export type ShipmentNature = "colis" | "courrier";

export const SHIPMENT_TYPE_LABELS: Record<ShipmentType, { fr: string; en: string }> = {
  express: { fr: "Express", en: "Express" },
  standard: { fr: "Standard", en: "Standard" },
};

export interface Shipment {
  id: number;
  waybill_number: string;
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  description?: string;
  weight: number;
  declared_value: number;
  price: number;
  route: string;
  nature: ShipmentNature;
  type: ShipmentType;
  status: "pending" | "confirmed" | "assigned" | "cancelled";
  is_confirmed: boolean;
  is_cancelled: boolean;
  confirmed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  created_by?: { id: number; name: string; username: string; email: string };
  confirmed_by?: { id: number; name: string; username: string; email: string };
  cancelled_by?: { id: number; name: string; username: string; email: string };
}

export interface CreateShipmentDTO {
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  description?: string;
  weight: number;
  declared_value?: number;
  price: number;
  route: string;
  nature?: ShipmentNature;
  type?: ShipmentType;
}

export interface UpdateShipmentDTO {
  sender_name?: string;
  sender_phone?: string;
  receiver_name?: string;
  receiver_phone?: string;
  description?: string;
  weight?: number;
  declared_value?: number;
  price?: number;
  route?: string;
  nature?: ShipmentNature;
  type?: ShipmentType;
}

export interface ShipmentFilters {
  status?: string;
  route?: string;
  dateFrom?: string;
  dateTo?: string;
  waybillNumber?: string;
  nature?: string;
  includeCancelled?: boolean;
  page?: number;
  limit?: number;
}

export interface ShipmentListResponse {
  data: Shipment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ShipmentStatistics {
  total: number;
  totalPrice: number;
  totalWeight: number;
  byStatus: { [key: string]: number };
  byNature?: { colis: number; courrier: number };
  todayCount: number;
  monthCount: number;
  monthRevenue: number;
}

export const shipmentService = {
  // List shipments with filters
  list: async (filters?: ShipmentFilters): Promise<ShipmentListResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.route) params.append("route", filters.route);
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);
    if (filters?.waybillNumber) params.append("waybillNumber", filters.waybillNumber);
    if (filters?.nature) params.append("nature", filters.nature);
    if (filters?.includeCancelled) params.append("includeCancelled", "true");
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await httpService.get(`/shipments?${params.toString()}`);
    return response.data;
  },

  // Get single shipment
  getOne: async (id: number): Promise<Shipment> => {
    const response = await httpService.get(`/shipments/${id}`);
    return response.data.data;
  },

  // Create shipment
  create: async (data: CreateShipmentDTO): Promise<Shipment> => {
    const response = await httpService.post("/shipments", data);
    return response.data.data;
  },

  // Confirm shipment
  confirm: async (id: number): Promise<Shipment> => {
    const response = await httpService.patch(`/shipments/${id}/confirm`);
    return response.data.data;
  },

  // Update shipment
  update: async (id: number, data: UpdateShipmentDTO): Promise<Shipment> => {
    const response = await httpService.patch(`/shipments/${id}`, data);
    return response.data.data;
  },

  // Cancel shipment
  cancel: async (id: number, reason: string): Promise<Shipment> => {
    const response = await httpService.delete(`/shipments/${id}`, {
      data: { reason },
    });
    return response.data.data;
  },

  // Generate waybill (download PDF)
  generateWaybill: async (id: number, waybillNumber?: string): Promise<void> => {
    const response = await httpService.get(`/shipments/${id}/waybill`, {
      responseType: "blob",
    } as any);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `bordereau-${waybillNumber || id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Generate receipt (placeholder)
  downloadReceipt: async (id: number, waybillNumber?: string): Promise<void> => {
    const response = await httpService.get(`/shipments/${id}/receipt`, {
      responseType: "blob",
    } as any);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `recu-${waybillNumber || id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getStatistics: async (
    nature?: "colis" | "courrier",
    filters?: {
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<ShipmentStatistics> => {
    const params = new URLSearchParams();
    if (nature) params.append("nature", nature);
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);
    const response = await httpService.get(`/shipments/statistics?${params.toString()}`);
    return response.data.data;
  },
};


