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
    // IMPORTANT: Utiliser fetch au lieu d'Axios pour les PDFs
    // fetch gère mieux les données binaires cross-origin et ne convertit pas en string
    const apiBaseURL = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`;
    const token = localStorage.getItem("auth_token");
    
    const response = await fetch(`${apiBaseURL}/shipments/${id}/waybill`, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
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
    // Note: Les PDFs dans les iframes héritent du format du PDF lui-même
    // mais le navigateur peut utiliser ses paramètres par défaut
    const fallbackPrintMethod = (url: string, receiptId: number, receiptWaybillNumber?: string) => {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
      iframe.src = url;
      document.body.appendChild(iframe);
      
      const cleanup = () => {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          window.URL.revokeObjectURL(url);
        }, 3000);
      };
      
      iframe.onload = () => {
        // Délai augmenté pour s'assurer que le PDF est complètement chargé
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
        }, 1500);
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
      }, 3000);
      
      // Timeout final pour nettoyer
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          cleanup();
        }
      }, 10000);
    };

    try {
      // IMPORTANT: Utiliser fetch au lieu d'Axios pour les PDFs
      // fetch gère mieux les données binaires cross-origin et ne convertit pas en string
      // Utiliser la même logique que getBaseURL() pour construire l'URL correctement
      const apiBaseURL = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`;
      const token = localStorage.getItem("auth_token");
      
      const response = await fetch(`${apiBaseURL}/shipments/${id}/receipt`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Récupérer l'ArrayBuffer directement depuis fetch
      const arrayBuffer = await response.arrayBuffer();
      
      // Vérification du blob reçu côté frontend
      console.log("📄 [Frontend] Response data type:", typeof arrayBuffer);
      console.log("📄 [Frontend] Response data is ArrayBuffer:", arrayBuffer instanceof ArrayBuffer);
      console.log("📄 [Frontend] ArrayBuffer byteLength:", arrayBuffer.byteLength);
      console.log("📄 [Frontend] Content-Type:", response.headers.get("content-type"));
      console.log("📄 [Frontend] Content-Length:", response.headers.get("content-length"));
      
      // Créer le blob depuis l'ArrayBuffer directement
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      
      // Vérification que le blob n'est pas vide
      if (blob.size === 0) {
        console.error("❌ [Frontend] Blob PDF vide!");
        throw new Error("Le PDF reçu est vide");
      }
      
      // Vérifier que la taille correspond au Content-Length
      const expectedSize = parseInt(response.headers.get("content-length") || "0", 10);
      if (expectedSize > 0 && blob.size !== expectedSize) {
        console.warn(`⚠️ [Frontend] Taille blob (${blob.size}) != Content-Length (${expectedSize})`);
      }
      
      console.log("📄 [Frontend] Blob créé, taille:", blob.size, "bytes");
      
      const url = window.URL.createObjectURL(blob);
      
      // Fonction pour créer un wrapper HTML avec CSS @page pour forcer le format 80mm (ticket)
      const createPrintWindow = (pdfUrl: string): Window | null => {
        const printWindow = window.open('', '_blank', 'noopener,noreferrer');
        if (!printWindow) return null;
        
        // Créer le HTML avec CSS @page pour forcer le format ticket 80mm
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Reçu - Impression</title>
              <style>
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                html, body {
                  width: 100%;
                  height: 100%;
                  overflow: hidden;
                }
                iframe {
                  width: 100%;
                  height: 100%;
                  border: none;
                  display: block;
                }
              </style>
            </head>
            <body>
              <iframe src="${pdfUrl}" type="application/pdf"></iframe>
            </body>
          </html>
        `);
        printWindow.document.close();
        
        return printWindow;
      };
      
      // Fonction de nettoyage
      const cleanup = () => {
        window.URL.revokeObjectURL(url);
      };
      
      // Essayer d'ouvrir dans une nouvelle fenêtre avec wrapper HTML
      const printWindow = createPrintWindow(url);
      
      if (printWindow) {
        // Attendre que le PDF soit chargé
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
            
            // Nettoyer après l'impression
            setTimeout(() => {
              printWindow.close();
              cleanup();
            }, 1000);
          } catch (error) {
            console.error("Error printing:", error);
            printWindow.close();
            // Fallback: utiliser la méthode fallback existante
            fallbackPrintMethod(url, id, waybillNumber);
          }
        }, 2000);
      } else {
        // Popup bloquée: utiliser la méthode fallback existante
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


