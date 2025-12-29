import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  driverService,
  Driver,
  CreateDriverDTO,
  UpdateDriverDTO,
  DriverFilters,
  DriverStatus,
  DRIVER_STATUS_LABELS,
} from "@/services/driver.service";
import { useToast } from "@/hooks/use-toast";

// Re-export types for convenience
export type { Driver, CreateDriverDTO, UpdateDriverDTO, DriverFilters };
export { DriverStatus, DRIVER_STATUS_LABELS };

export function useDrivers(filters?: DriverFilters) {
  return useQuery({
    queryKey: ["drivers", filters],
    queryFn: () => driverService.list(filters),
  });
}

export function useDriver(id: number) {
  return useQuery({
    queryKey: ["driver", id],
    queryFn: () => driverService.getOne(id),
    enabled: !!id,
  });
}

export function useAvailableDrivers() {
  return useQuery({
    queryKey: ["drivers", "available"],
    queryFn: () => driverService.getAvailable(),
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateDriverDTO) => driverService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({
        title: "Succès",
        description: "Chauffeur créé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de la création du chauffeur",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDriverDTO }) =>
      driverService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["driver", variables.id] });
      toast({
        title: "Succès",
        description: "Chauffeur modifié avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de la modification du chauffeur",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => driverService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({
        title: "Succès",
        description: "Chauffeur supprimé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de la suppression du chauffeur",
        variant: "destructive",
      });
    },
  });
}

