import { httpService } from "./http-service";

export interface Departure {
  id: number;
  general_waybill_number: string | null;
  pdf_path: string | null;
  status: "open" | "sealed" | "closed";
  route: string | null;
  vehicle: { id: number; registration_number: string; name: string; type: string; status: string } | null;
  vehicle_id: number | null;
  driver: { id: number; first_name: string; last_name: string; phone: string; license_number: string } | null;
  driver_id: number | null;
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
  driver_id?: number;
  notes?: string;
}

export interface UpdateDepartureDTO {
  route?: string;
  vehicle_id?: number;
  driver_id?: number;
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

  // Delete departure
  delete: async (id: number): Promise<void> => {
    await httpService.delete(`/departures/${id}`);
  },

  // Get departure summary with totals
  getSummary: async (id: number): Promise<DepartureSummary> => {
    const response = await httpService.get(`/departures/${id}/summary`);
    return response.data.data;
  },

  // Download General Waybill PDF
  downloadPDF: async (id: number): Promise<void> => {
    // IMPORTANT: Utiliser fetch au lieu d'Axios pour les PDFs
    // fetch gère mieux les données binaires cross-origin et ne convertit pas en string
    const apiBaseURL = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`;
    const token = localStorage.getItem("auth_token");
    
    const response = await fetch(`${apiBaseURL}/departures/${id}/general-waybill`, {
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
    link.setAttribute("download", `general-waybill-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Print General Waybill PDF directly (ouvre le dialogue d'impression)
  printPDF: async (id: number): Promise<void> => {
    try {
      // IMPORTANT: Utiliser fetch au lieu d'Axios pour les PDFs
      // fetch gère mieux les données binaires cross-origin et ne convertit pas en string
      const apiBaseURL = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`;
      const token = localStorage.getItem("auth_token");
      
      const response = await fetch(`${apiBaseURL}/departures/${id}/general-waybill`, {
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
      
      // Fonction pour créer un wrapper HTML avec CSS @page pour forcer le format A4
      const createPrintWindow = (pdfUrl: string): Window | null => {
        const printWindow = window.open('', '_blank', 'noopener,noreferrer');
        if (!printWindow) return null;
        
        // Créer le HTML avec CSS @page pour forcer le format A4
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Bordereau Général - Impression</title>
              <style>
                @page {
                  size: A4;
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
            cleanup();
          }
        }, 2000);
      } else {
        // Fallback: utiliser iframe si popup bloquée
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
        
        const cleanupIframe = () => {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            cleanup();
          }, 3000);
        };
        
        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
              cleanupIframe();
            } catch (error) {
              console.error("Error printing via iframe:", error);
              cleanupIframe();
            }
          }, 1500);
        };
        
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            try {
              iframe.contentWindow?.print();
              cleanupIframe();
            } catch (error) {
              console.error("Error printing via iframe timeout:", error);
              cleanupIframe();
            }
          }
        }, 3000);
        
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            cleanupIframe();
          }
        }, 10000);
      }
      
    } catch (error) {
      console.error("Error downloading waybill:", error);
      throw error;
    }
  },
};

