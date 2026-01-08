import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { offlineQueue, QueuedRequest } from "@/services/offline-queue";
import { axiosInstance } from "@/services/http-service";
import { useToast } from "@/hooks/use-toast";

interface OfflineContextType {
  isOnline: boolean;
  queuedCount: number;
  isRetrying: boolean;
  retryQueue: () => Promise<void>;
  clearQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [queuedCount, setQueuedCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();

  // Update queued count when online status changes
  const updateQueuedCount = useCallback(async () => {
    try {
      const count = await offlineQueue.getQueueCount();
      setQueuedCount(count);
    } catch (error) {
      console.error("Failed to get queue count:", error);
    }
  }, []);

  // Check queue count periodically
  useEffect(() => {
    updateQueuedCount();
    const interval = setInterval(updateQueuedCount, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [updateQueuedCount]);

  // Retry queued requests when back online
  const retryQueue = useCallback(async () => {
    if (!isOnline || isRetrying) {
      return;
    }

    setIsRetrying(true);

    try {
      const queuedRequests = await offlineQueue.getQueuedRequests();

      if (queuedRequests.length === 0) {
        setIsRetrying(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;
      const maxRetries = 3;

      // Sort by timestamp to retry oldest first
      const sortedRequests = queuedRequests.sort(
        (a, b) => a.timestamp - b.timestamp
      );

      for (const request of sortedRequests) {
        try {
          // Skip if already retried too many times
          if (request.retryCount >= maxRetries) {
            console.warn(
              `Request ${request.id} exceeded max retries, removing from queue`
            );
            await offlineQueue.removeRequest(request.id);
            failCount++;
            continue;
          }

          // Prepare request config
          const config: {
            url: string;
            method: string;
            headers: Record<string, string>;
            params?: Record<string, unknown>;
            data?: unknown;
          } = {
            url: request.url,
            method: request.method.toLowerCase(),
            headers: {
              ...request.headers,
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
            params: request.params,
          };

          // Make the request
          let response;
          if (request.method === "GET" || request.method === "DELETE") {
            response = await axiosInstance.request(config);
          } else {
            response = await axiosInstance.request({
              ...config,
              data: request.data,
            });
          }

          // Request succeeded, remove from queue
          await offlineQueue.removeRequest(request.id);
          successCount++;

          // Small delay between retries to avoid overwhelming the server
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error: unknown) {
          // Request failed, increment retry count
          const newRetryCount = request.retryCount + 1;
          await offlineQueue.updateRetryCount(request.id, newRetryCount);

          // If still have retries left, keep in queue
          if (newRetryCount < maxRetries) {
            console.log(
              `Request ${request.id} failed, retry count: ${newRetryCount}/${maxRetries}`
            );
          } else {
            // Max retries exceeded, remove from queue
            await offlineQueue.removeRequest(request.id);
            failCount++;
            console.error(
              `Request ${request.id} failed after ${maxRetries} retries`
            );
          }
        }
      }

      // Update count
      await updateQueuedCount();

      // Show toast notification
      if (successCount > 0 || failCount > 0) {
        const messages: string[] = [];
        if (successCount > 0) {
          messages.push(`${successCount} request(s) synchronized successfully`);
        }
        if (failCount > 0) {
          messages.push(`${failCount} request(s) failed after retries`);
        }
        toast({
          title: "Offline Queue Processed",
          description: messages.join(". "),
          variant:
            successCount > 0 && failCount === 0 ? "default" : "destructive",
        });
      }
    } catch (error) {
      console.error("Error retrying queue:", error);
      toast({
        title: "Error",
        description: "Failed to process queued requests",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  }, [isOnline, isRetrying, toast, updateQueuedCount]);

  // Auto-retry when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && queuedCount > 0) {
      // Wait a bit for network to stabilize
      const timer = setTimeout(() => {
        retryQueue();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, queuedCount, retryQueue]);

  // Also retry on visibility change (when user comes back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        isOnline &&
        queuedCount > 0
      ) {
        retryQueue();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isOnline, queuedCount, retryQueue]);

  const clearQueue = useCallback(async () => {
    try {
      await offlineQueue.clearAll();
      await updateQueuedCount();
      toast({
        title: "Queue Cleared",
        description: "All queued requests have been cleared",
      });
    } catch (error) {
      console.error("Failed to clear queue:", error);
      toast({
        title: "Error",
        description: "Failed to clear queue",
        variant: "destructive",
      });
    }
  }, [toast, updateQueuedCount]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        queuedCount,
        isRetrying,
        retryQueue,
        clearQueue,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
};
