import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  settingsService,
  UpdateSettingsDTO,
} from "@/services/settings.service";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export const settingsKeys = {
  all: ["settings"] as const,
  detail: () => [...settingsKeys.all, "detail"] as const,
};

export function useSettings() {
  const { toast } = useToast();
  const { language } = useLanguage();

  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: () => settingsService.get(),
    // En production, plus de retries avec des délais plus longs pour gérer la latence réseau
    retry: (failureCount, error: any) => {
      // Ne pas retry sur les erreurs 401/403 (authentification)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      // Retry jusqu'à 3 fois en production, 2 fois en dev
      return import.meta.env.PROD ? failureCount < 3 : failureCount < 2;
    },
    retryDelay: (attemptIndex) => {
      // En production, délais plus longs pour la latence réseau
      const baseDelay = import.meta.env.PROD ? 2000 : 1000;
      return Math.min(baseDelay * 2 ** attemptIndex, import.meta.env.PROD ? 10000 : 3000);
    },
    staleTime: 5 * 60 * 1000, // Considérer les données comme fraîches pendant 5 minutes
    // En production, garder les données en cache plus longtemps même si elles sont considérées comme stale
    gcTime: import.meta.env.PROD ? 10 * 60 * 1000 : 5 * 60 * 1000, // 10 min en prod, 5 min en dev
    onError: (error: any) => {
      // Ne pas afficher d'erreur pour les 404 si c'est juste une initialisation
      // Les erreurs 503 (Service Unavailable) sont gérées automatiquement par React Query
      if (error.response?.status === 503) {
        // Erreur de connexion à la base de données - React Query va réessayer automatiquement
        console.warn("⚠️ [SETTINGS] Service temporairement indisponible, nouvelle tentative en cours...");
        return;
      }
      
      // Pour les autres erreurs, afficher un message seulement après tous les retries
      if (error.response?.status !== 404 && error.response?.status !== 401) {
        // Attendre un peu avant d'afficher l'erreur pour éviter le spam pendant les retries
        setTimeout(() => {
          toast({
            title: language === "fr" ? "Erreur" : "Error",
            description:
              error.response?.data?.error ||
              error.response?.data?.message ||
              (language === "fr"
                ? "Impossible de charger les paramètres. Veuillez réessayer."
                : "Failed to load settings. Please try again."),
            variant: "destructive",
          });
        }, 5000); // Attendre 5 secondes (après les retries)
      }
    },
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
          (language === "fr"
            ? "Impossible de mettre à jour les paramètres"
            : "Failed to update settings"),
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
      // Invalider le cache et forcer le rechargement immédiat
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      queryClient.refetchQueries({ queryKey: settingsKeys.all });
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
          (language === "fr"
            ? "Impossible de télécharger le logo"
            : "Failed to upload logo"),
        variant: "destructive",
      });
    },
  });
}
