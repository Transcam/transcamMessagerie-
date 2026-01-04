import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  vehicleService,
  Vehicle,
  CreateVehicleDTO,
  UpdateVehicleDTO,
  VehicleFilters,
} from "@/services/vehicle.service";
import { useToast } from "@/hooks/use-toast";

// Re-export types for convenience
export type { Vehicle, CreateVehicleDTO, UpdateVehicleDTO, VehicleFilters };
export { VehicleType, VehicleStatus, VEHICLE_TYPE_LABELS, VEHICLE_STATUS_LABELS } from "@/services/vehicle.service";

export function useVehicles(filters?: VehicleFilters) {
  return useQuery({
    queryKey: ["vehicles", filters],
    queryFn: () => vehicleService.list(filters),
  });
}

export function useVehicle(id: number) {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => vehicleService.getOne(id),
    enabled: !!id,
  });
}

export function useAvailableVehicles() {
  return useQuery({
    queryKey: ["vehicles", "available"],
    queryFn: () => vehicleService.getAvailable(),
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateVehicleDTO) => vehicleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast({
        title: "Succès",
        description: "Véhicule créé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de la création du véhicule",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVehicleDTO }) =>
      vehicleService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", variables.id] });
      toast({
        title: "Succès",
        description: "Véhicule modifié avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de la modification du véhicule",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => vehicleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast({
        title: "Succès",
        description: "Véhicule supprimé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de la suppression du véhicule",
        variant: "destructive",
      });
    },
  });
}


