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
  weight: number | null;
  declared_value: number;
  price: number;
  is_free?: boolean;
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
  weight?: number;
  declared_value?: number;
  price: number;
  is_free?: boolean;
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
  is_free?: boolean;
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

  // Delete existing shipment and create new one
  deleteAndCreate: async (existingId: number, data: CreateShipmentDTO): Promise<Shipment> => {
    const response = await httpService.post("/shipments/delete-and-create", {
      existingId,
      ...data,
    });
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

  // Search contacts (senders/receivers)
  searchContacts: async (query: string, type: 'sender' | 'receiver'): Promise<Array<{ name: string; phone: string; count: number }>> => {
    const response = await httpService.get("/shipments/contacts/search", {
      params: { q: query, type },
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

  // Generate receipt and print directly
  downloadReceipt: async (id: number, waybillNumber?: string): Promise<void> => {
    // Fallback method using iframe (for popup blockers)
    const fallbackPrintMethod = (url: string, receiptId: number, receiptWaybillNumber?: string) => {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.opacity = "0";
      iframe.src = url;
      document.body.appendChild(iframe);
      
      const cleanup = () => {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          window.URL.revokeObjectURL(url);
        }, 2000);
      };
      
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            cleanup();
          } catch (error) {
            console.error("Error printing via iframe:", error);
            // Last resort: open download link
            const link = document.createElement("a");
            link.href = url;
            link.download = `recu-${receiptWaybillNumber || receiptId}.pdf`;
            link.click();
            cleanup();
          }
        }, 1000);
      };
      
      // Fallback timeout in case onload doesn't fire
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          try {
            iframe.contentWindow?.print();
            cleanup();
          } catch (error) {
            console.error("Error printing via iframe timeout:", error);
            cleanup();
          }
        }
      }, 2000);
    };

    try {
      const response = await httpService.get(`/shipments/${id}/receipt`, {
        responseType: "blob",
      } as any);
      
      // Vérification du blob reçu côté frontend
      console.log("📄 [Frontend] Response data type:", typeof response.data);
      console.log("📄 [Frontend] Response data size:", response.data?.size || response.data?.byteLength || "unknown");
      console.log("📄 [Frontend] Content-Type:", response.headers["content-type"]);
      console.log("📄 [Frontend] Content-Length:", response.headers["content-length"]);
      
      const blob = new Blob([response.data], { type: "application/pdf" });
      
      // Vérification que le blob n'est pas vide
      if (blob.size === 0) {
        console.error("❌ [Frontend] Blob PDF vide!");
        throw new Error("Le PDF reçu est vide");
      }
      
      console.log("📄 [Frontend] Blob créé, taille:", blob.size, "bytes");
      
      const url = window.URL.createObjectURL(blob);
      
      // Improved print handling for production environments
      // Method 1: Try opening in new window with print dialog
      const printWindow = window.open(url, '_blank', 'noopener,noreferrer');
      
      if (printWindow) {
        // Wait for PDF to load, then trigger print dialog
        // Increased timeout for production environments where PDFs may take longer to load
        const printTimeout = setTimeout(() => {
          try {
            if (printWindow && !printWindow.closed) {
              printWindow.focus();
              printWindow.print();
              // Clean up URL after print dialog opens
              setTimeout(() => {
                window.URL.revokeObjectURL(url);
              }, 1000);
            }
          } catch (error) {
            console.error("Error printing:", error);
            window.URL.revokeObjectURL(url);
            // Fallback: close window and try iframe method
            if (printWindow && !printWindow.closed) {
              printWindow.close();
            }
            fallbackPrintMethod(url, id, waybillNumber);
          }
        }, 1000); // Increased timeout for production
        
        // Also listen for window close to clean up
        const checkClosed = setInterval(() => {
          if (printWindow.closed) {
            clearInterval(checkClosed);
            clearTimeout(printTimeout);
            window.URL.revokeObjectURL(url);
          }
        }, 500);
      } else {
        // Popup blocked - use iframe fallback
        fallbackPrintMethod(url, id, waybillNumber);
      }
    } catch (error) {
      console.error("Error downloading receipt:", error);
      throw error;
    }
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


