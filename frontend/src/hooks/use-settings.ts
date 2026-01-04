import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService, UpdateSettingsDTO } from "@/services/settings.service";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export const settingsKeys = {
  all: ["settings"] as const,
  detail: () => [...settingsKeys.all, "detail"] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: () => settingsService.get(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: (data: UpdateSettingsDTO) => settingsService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      toast({
        title: language === "fr" ? "Paramètres mis à jour" : "Settings updated",
        description:
          language === "fr"
            ? "Les paramètres ont été mis à jour avec succès"
            : "Settings have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          error.response?.data?.error ||
          error.response?.data?.message ||
          (language === "fr" ? "Impossible de mettre à jour les paramètres" : "Failed to update settings"),
        variant: "destructive",
      });
    },
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: (file: File) => settingsService.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      toast({
        title: language === "fr" ? "Logo téléchargé" : "Logo uploaded",
        description:
          language === "fr"
            ? "Le logo a été téléchargé avec succès"
            : "Logo has been uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          error.response?.data?.error ||
          error.response?.data?.message ||
          (language === "fr" ? "Impossible de télécharger le logo" : "Failed to upload logo"),
        variant: "destructive",
      });
    },
  });
}

