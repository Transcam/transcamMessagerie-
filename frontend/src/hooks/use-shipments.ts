import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  shipmentService,
  Shipment,
  CreateShipmentDTO,
  UpdateShipmentDTO,
  ShipmentFilters,
  ShipmentStatistics,
} from "@/services/shipment.service";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

// Query key factory
export const shipmentKeys = {
  all: ["shipments"] as const,
  lists: () => [...shipmentKeys.all, "list"] as const,
  list: (filters?: ShipmentFilters) => [...shipmentKeys.lists(), filters] as const,
  details: () => [...shipmentKeys.all, "detail"] as const,
  detail: (id: number) => [...shipmentKeys.details(), id] as const,
};

// List shipments hook
export function useShipments(filters?: ShipmentFilters) {
  return useQuery({
    queryKey: shipmentKeys.list(filters),
    queryFn: () => shipmentService.list(filters),
  });
}

// Get single shipment hook
export function useShipment(id: number) {
  return useQuery({
    queryKey: shipmentKeys.detail(id),
    queryFn: () => shipmentService.getOne(id),
    enabled: !!id,
  });
}

// Create shipment mutation
export function useCreateShipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: (data: CreateShipmentDTO) => shipmentService.create(data),
    onSuccess: (data) => {
      // Invalider toutes les queries de shipments (comme les autres mutations)
      queryClient.invalidateQueries({ queryKey: shipmentKeys.all });
      // Invalider aussi les statistiques
      queryClient.invalidateQueries({ queryKey: ["shipment-statistics"] });
      toast({
        title: language === "fr" ? "Envoi créé" : "Shipment created",
        description:
          language === "fr"
            ? `Bordereau N° ${data.waybill_number} créé`
            : `Waybill No. ${data.waybill_number} created`,
      });
    },
    onError: (error: any) => {
      // Ne pas afficher de toast pour DUPLICATE_SHIPMENT (409), on gère ça dans le composant
      if (error.response?.status === 409) {
        throw error; // Re-lancer l'erreur pour que le composant puisse la gérer
      }
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          error.response?.data?.error ||
          (language === "fr"
            ? "Impossible de créer l'envoi"
            : "Failed to create shipment"),
        variant: "destructive",
      });
    },
  });
}

// Delete existing shipment and create new one mutation
export function useDeleteAndCreateShipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: ({ existingId, data }: { existingId: number; data: CreateShipmentDTO }) =>
      shipmentService.deleteAndCreate(existingId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["shipment-statistics"] });
      toast({
        title: language === "fr" ? "Envoi créé" : "Shipment created",
        description:
          language === "fr"
            ? `L'ancien colis a été supprimé et le nouveau bordereau N° ${data.waybill_number} a été créé`
            : `Old shipment deleted and new waybill No. ${data.waybill_number} created`,
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          error.response?.data?.error ||
          (language === "fr"
            ? "Impossible de supprimer l'ancien et créer le nouveau colis"
            : "Failed to delete old and create new shipment"),
        variant: "destructive",
      });
    },
  });
}

// Confirm shipment mutation
export function useConfirmShipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: (id: number) => shipmentService.confirm(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.all });
      toast({
        title: language === "fr" ? "Envoi confirmé" : "Shipment confirmed",
        description:
          language === "fr"
            ? `Bordereau N° ${data.waybill_number} confirmé`
            : `Waybill No. ${data.waybill_number} confirmed`,
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          error.response?.data?.error ||
          (language === "fr"
            ? "Impossible de confirmer l'envoi"
            : "Failed to confirm shipment"),
        variant: "destructive",
      });
    },
  });
}

// Update shipment mutation
export function useUpdateShipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShipmentDTO }) =>
      shipmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.all });
      toast({
        title: language === "fr" ? "Envoi mis à jour" : "Shipment updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          error.response?.data?.error ||
          (language === "fr"
            ? "Impossible de mettre à jour l'envoi"
            : "Failed to update shipment"),
        variant: "destructive",
      });
    },
  });
}

// Cancel shipment mutation
export function useCancelShipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      shipmentService.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.all });
      toast({
        title: language === "fr" ? "Envoi annulé" : "Shipment cancelled",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          error.response?.data?.error ||
          (language === "fr"
            ? "Impossible d'annuler l'envoi"
            : "Failed to cancel shipment"),
        variant: "destructive",
      });
    },
  });
}

// Download receipt mutation (télécharge le PDF)
export function useDownloadReceipt() {
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: ({ id, waybillNumber }: { id: number; waybillNumber?: string }) =>
      shipmentService.generateWaybill(id, waybillNumber),
    onSuccess: () => {
      toast({
        title: language === "fr" ? "Téléchargement démarré" : "Download started",
        description:
          language === "fr"
            ? "Le reçu est en cours de téléchargement"
            : "Receipt is downloading",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          error.response?.data?.error ||
          (language === "fr"
            ? "Impossible de télécharger le reçu"
            : "Failed to download receipt"),
        variant: "destructive",
      });
    },
  });
}

// Generate receipt mutation (imprime directement)
export function useGenerateReceipt() {
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: ({ id, waybillNumber }: { id: number; waybillNumber?: string }) =>
      shipmentService.downloadReceipt(id, waybillNumber),
    onSuccess: () => {
      toast({
        title: language === "fr" ? "Impression démarrée" : "Print started",
        description:
          language === "fr"
            ? "Le reçu est en cours d'impression"
            : "Receipt is printing",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          error.response?.data?.error ||
          (language === "fr"
            ? "Impossible d'imprimer le reçu"
            : "Failed to print receipt"),
        variant: "destructive",
      });
    },
  });
}

// Shipment statistics hook
export function useShipmentStatistics(
  nature?: "colis" | "courrier",
  filters?: {
    dateFrom?: string;
    dateTo?: string;
  }
) {
  return useQuery<ShipmentStatistics>({
    queryKey: ["shipment-statistics", nature, filters],
    queryFn: () => shipmentService.getStatistics(nature, filters),
  });
}

// Search contacts hook
export function useSearchContacts(query: string, type: 'sender' | 'receiver', enabled: boolean = true) {
  const isValidQuery = query && typeof query === 'string' && query.trim().length >= 2;
  const isValidType = type === 'sender' || type === 'receiver';
  
  return useQuery({
    queryKey: ['contacts', query, type],
    queryFn: () => shipmentService.searchContacts(query.trim(), type),
    enabled: enabled && isValidQuery && isValidType, // Vérifications supplémentaires
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Ne pas réessayer en cas d'erreur 400
  });
}


