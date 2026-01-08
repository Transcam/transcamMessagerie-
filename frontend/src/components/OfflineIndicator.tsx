import { useOffline } from "@/contexts/OfflineContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { WifiOff, Wifi, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function OfflineIndicator() {
  const { isOnline, queuedCount, isRetrying, retryQueue, clearQueue } =
    useOffline();
  const { t, language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  // Don't show anything if online and no queued requests, or if dismissed
  const shouldShow = !dismissed && (!isOnline || queuedCount > 0);

  // Update body padding when indicator is shown/hidden
  useEffect(() => {
    if (shouldShow) {
      document.body.style.paddingTop = "56px"; // Height of the banner
    } else {
      document.body.style.paddingTop = "0";
    }
    return () => {
      document.body.style.paddingTop = "0";
    };
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full px-4 py-3 border-b h-14",
        "flex items-center justify-between gap-4",
        !isOnline && "bg-yellow-50 dark:bg-yellow-950 border-yellow-500",
        isOnline &&
          queuedCount > 0 &&
          "bg-blue-50 dark:bg-blue-950 border-blue-500"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0">
          {!isOnline ? (
            <WifiOff className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          ) : isRetrying ? (
            <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
          ) : (
            <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-semibold",
                !isOnline && "text-yellow-900 dark:text-yellow-100",
                isOnline &&
                  queuedCount > 0 &&
                  "text-blue-900 dark:text-blue-100"
              )}
            >
              {!isOnline
                ? t("offline.title")
                : isRetrying
                ? t("offline.syncing")
                : `${queuedCount} ${
                    queuedCount !== 1
                      ? t("offline.queuedPlural")
                      : t("offline.queued")
                  }`}
            </span>
            {!isOnline && (
              <span
                className={cn(
                  "text-sm",
                  "text-yellow-700 dark:text-yellow-300"
                )}
              >
                - {t("offline.willBeSent")}
              </span>
            )}
            {isOnline && isRetrying && (
              <span
                className={cn("text-sm", "text-blue-700 dark:text-blue-300")}
              >
                - {t("offline.processing")}
              </span>
            )}
            {isOnline && queuedCount > 0 && !isRetrying && (
              <span
                className={cn("text-sm", "text-blue-700 dark:text-blue-300")}
              >
                - {t("offline.waiting")}
              </span>
            )}
          </div>
        </div>
      </div>
      {isOnline && queuedCount > 0 && !isRetrying && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="default"
            onClick={() => retryQueue()}
            className="h-8 text-xs"
          >
            {t("offline.syncNow")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => clearQueue()}
            className="h-8 text-xs"
          >
            {t("offline.clearQueue")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {!isOnline && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDismissed(true)}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
