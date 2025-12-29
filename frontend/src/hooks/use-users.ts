import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  userService,
  User,
  CreateUserDTO,
  UpdateUserDTO,
} from "@/services/user.service";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => userService.list(),
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getOne(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: (data: CreateUserDTO) => userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast({
        title: language === "fr" ? "Utilisateur créé" : "User created",
        description:
          language === "fr"
            ? "L'utilisateur a été créé avec succès"
            : "User has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          error.response?.data?.error ||
          error.response?.data?.message ||
          (language === "fr"
            ? "Impossible de créer l'utilisateur"
            : "Failed to create user"),
        variant: "destructive",
      });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserDTO }) =>
      userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast({
        title: language === "fr" ? "Utilisateur mis à jour" : "User updated",
        description:
          language === "fr"
            ? "L'utilisateur a été mis à jour avec succès"
            : "User has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          error.response?.data?.error ||
          error.response?.data?.message ||
          (language === "fr"
            ? "Impossible de mettre à jour l'utilisateur"
            : "Failed to update user"),
        variant: "destructive",
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast({
        title: language === "fr" ? "Utilisateur supprimé" : "User deleted",
        description:
          language === "fr"
            ? "L'utilisateur a été supprimé avec succès"
            : "User has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          error.response?.data?.error ||
          error.response?.data?.message ||
          (language === "fr"
            ? "Impossible de supprimer l'utilisateur"
            : "Failed to delete user"),
        variant: "destructive",
      });
    },
  });
}

