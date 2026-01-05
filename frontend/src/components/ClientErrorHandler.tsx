"use client";

import { useChunkErrorHandler } from "@/hooks/use-chunk-error-handler";
import { ReactNode } from "react";

interface ClientErrorHandlerProps {
  children: ReactNode;
}

export function ClientErrorHandler({ children }: ClientErrorHandlerProps) {
  // Détecter les ChunkLoadError globalement
  useChunkErrorHandler();

  return <>{children}</>;
}

