"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Détecter spécifiquement les ChunkLoadError
    if (
      error.message.includes("ChunkLoadError") ||
      error.message.includes("Loading chunk") ||
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.name === "ChunkLoadError"
    ) {
      // Recharger automatiquement en cas de ChunkLoadError
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  handleReload = () => {
    // Nettoyer le cache avant de recharger
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">Une mise à jour est disponible.</h1>
            <p className="text-muted-foreground">
              Veuillez recharger la page pour continuer.
            </p>
            <Button onClick={this.handleReload} className="w-full">
              Recharger
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

