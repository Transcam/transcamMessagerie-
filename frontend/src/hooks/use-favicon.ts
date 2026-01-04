import { useEffect } from "react";
import { useSettings } from "./use-settings";

export function useFavicon() {
  const { data: settings } = useSettings();

  useEffect(() => {
    const faviconUrl = settings?.company_logo_url || "/assets/images/Logo-Transcam.png";
    
    // Find existing favicon link or create a new one
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    
    link.href = faviconUrl;
  }, [settings?.company_logo_url]);
}

