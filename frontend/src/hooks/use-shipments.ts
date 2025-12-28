import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  shipmentService,
  Shipment,
  CreateShipmentDTO,
  UpdateShipmentDTO,
  ShipmentFilters,
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
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      toast({
        title: language === "fr" ? "Expédition créée" : "Shipment created",
        description:
          language === "fr"
            ? `Bordereau N° ${data.waybill_number} créé`
            : `Waybill No. ${data.waybill_number} created`,
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          error.response?.data?.error ||
          (language === "fr"
            ? "Impossible de créer l'expédition"
            : "Failed to create shipment"),
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
        title: language === "fr" ? "Expédition confirmée" : "Shipment confirmed",
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
            ? "Impossible de confirmer l'expédition"
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
        title: language === "fr" ? "Expédition mise à jour" : "Shipment updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          error.response?.data?.error ||
          (language === "fr"
            ? "Impossible de mettre à jour l'expédition"
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
        title: language === "fr" ? "Expédition annulée" : "Shipment cancelled",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          error.response?.data?.error ||
          (language === "fr"
            ? "Impossible d'annuler l'expédition"
            : "Failed to cancel shipment"),
        variant: "destructive",
      });
    },
  });
}


