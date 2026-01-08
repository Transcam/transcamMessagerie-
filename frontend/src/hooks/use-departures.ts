import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  departureService,
  Departure,
  CreateDepartureDTO,
  UpdateDepartureDTO,
  DepartureFilters,
} from "@/services/departure.service";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

// Query key factory
export const departureKeys = {
  all: ["departures"] as const,
  lists: () => [...departureKeys.all, "list"] as const,
  list: (filters?: DepartureFilters) => [...departureKeys.lists(), filters] as const,
  details: () => [...departureKeys.all, "detail"] as const,
  detail: (id: number) => [...departureKeys.details(), id] as const,
  summary: (id: number) => [...departureKeys.detail(id), "summary"] as const,
};

// List departures hook
export function useDepartures(filters?: DepartureFilters) {
  return useQuery({
    queryKey: departureKeys.list(filters),
    queryFn: () => departureService.list(filters),
  });
}

// Get single departure hook
export function useDeparture(id: number) {
  return useQuery({
    queryKey: departureKeys.detail(id),
    queryFn: () => departureService.getOne(id),
    enabled: !!id,
  });
}

// Get departure summary hook
export function useDepartureSummary(id: number) {
  return useQuery({
    queryKey: departureKeys.summary(id),
    queryFn: () => departureService.getSummary(id),
    enabled: !!id,
  });
}

// Create departure mutation
export function useCreateDeparture() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: (data: CreateDepartureDTO) => departureService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departureKeys.lists() });
      toast({
        title: language === "fr" ? "Départ créé" : "Departure created",
        description: language === "fr" 
          ? "Le départ a été créé avec succès" 
          : "Departure created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: error.response?.data?.error || 
          (language === "fr" 
            ? "Impossible de créer le départ" 
            : "Failed to create departure"),
        variant: "destructive",
      });
    },
  });
}

// Update departure mutation
export function useUpdateDeparture() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDepartureDTO }) =>
      departureService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departureKeys.all });
      toast({
        title: language === "fr" ? "Départ mis à jour" : "Departure updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: error.response?.data?.error || 
          (language === "fr" 
            ? "Impossible de mettre à jour le départ" 
            : "Failed to update departure"),
        variant: "destructive",
      });
    },
  });
}

// Assign shipments mutation
export function useAssignShipments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: ({ id, shipmentIds }: { id: number; shipmentIds: number[] }) =>
      departureService.assignShipments(id, shipmentIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: departureKeys.all });
      toast({
        title: language === "fr" ? "Colis assignés" : "Shipments assigned",
        description: language === "fr" 
          ? `${data.assigned_count} colis assigné(s)` 
          : `${data.assigned_count} shipment(s) assigned`,
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: error.response?.data?.error || 
          (language === "fr" 
            ? "Impossible d'assigner les colis" 
            : "Failed to assign shipments"),
        variant: "destructive",
      });
    },
  });
}

// Remove shipment mutation
export function useRemoveShipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: ({ id, shipmentId }: { id: number; shipmentId: number }) =>
      departureService.removeShipment(id, shipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departureKeys.all });
      toast({
        title: language === "fr" ? "Colis retiré" : "Shipment removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: error.response?.data?.error || 
          (language === "fr" 
            ? "Impossible de retirer le colis" 
            : "Failed to remove shipment"),
        variant: "destructive",
      });
    },
  });
}

// Seal departure mutation
export function useSealDeparture() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: (id: number) => departureService.seal(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: departureKeys.all });
      toast({
        title: language === "fr" ? "Départ scellé" : "Departure sealed",
        description: language === "fr"
          ? `Bordereau Général ${data.general_waybill_number} généré`
          : `General Waybill ${data.general_waybill_number} generated`,
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: error.response?.data?.error || 
          (language === "fr" 
            ? "Impossible de sceller le départ" 
            : "Failed to seal departure"),
        variant: "destructive",
      });
    },
  });
}

// Close departure mutation
export function useCloseDeparture() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: (id: number) => departureService.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departureKeys.all });
      toast({
        title: language === "fr" ? "Départ fermé" : "Departure closed",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: error.response?.data?.error || 
          (language === "fr" 
            ? "Impossible de fermer le départ" 
            : "Failed to close departure"),
        variant: "destructive",
      });
    },
  });
}

// Delete departure mutation
export function useDeleteDeparture() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: (id: number) => departureService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departureKeys.all });
      toast({
        title: language === "fr" ? "Départ supprimé" : "Departure deleted",
        description: language === "fr" 
          ? "Le départ a été supprimé avec succès" 
          : "Departure deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: error.response?.data?.error || 
          (language === "fr" 
            ? "Impossible de supprimer le départ" 
            : "Failed to delete departure"),
        variant: "destructive",
      });
    },
  });
}