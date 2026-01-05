"use client";

import { useEffect } from "react";

export function useChunkErrorHandler() {
  useEffect(() => {
    // Vérifier que nous sommes côté client
    if (typeof window === "undefined") return;

    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message || "";
      const errorString = String(error);

      // Détecter les erreurs de chargement de chunks
      const isChunkError =
        errorString.includes("ChunkLoadError") ||
        errorString.includes("Loading chunk") ||
        errorString.includes("Failed to fetch dynamically imported module") ||
        errorString.includes("Loading CSS chunk") ||
        event.message?.includes("chunk") ||
        event.filename?.includes("chunk");

      if (isChunkError) {
        console.warn("ChunkLoadError détecté, rechargement automatique...", error);
        
        // Nettoyer le cache avant de recharger
        if ("caches" in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              caches.delete(name);
            });
          });
        }

        // Recharger après un court délai
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    // Écouter les erreurs globales
    window.addEventListener("error", handleError, true);

    // Écouter les promesses rejetées non gérées
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = String(event.reason || "");
      
      if (
        error.includes("ChunkLoadError") ||
        error.includes("Loading chunk") ||
        error.includes("Failed to fetch dynamically imported module")
      ) {
        console.warn("ChunkLoadError dans une promesse, rechargement automatique...", event.reason);
        
        if ("caches" in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              caches.delete(name);
            });
          });
        }

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);
}

