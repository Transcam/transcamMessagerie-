import { useEffect } from "react";
import { useSettings } from "./use-settings";

export function useFavicon() {
  const { data: settings } = useSettings();

  useEffect(() => {
    const faviconUrl = settings?.company_logo_url || "/assets/images/Logo-Transcam.png";
    
    // Supprimer tous les liens favicon existants pour forcer la mise à jour
    const existingLinks = document.querySelectorAll("link[rel~='icon']");
    existingLinks.forEach(link => link.remove());
    
    // Créer un nouveau lien avec un timestamp pour éviter le cache
    const link = document.createElement("link");
    link.rel = "icon";
    const timestamp = settings?.updated_at ? new Date(settings.updated_at).getTime() : Date.now();
    link.href = `${faviconUrl}?v=${timestamp}`;
    document.head.appendChild(link);
  }, [settings?.company_logo_url, settings?.updated_at]);
}

