import { Badge } from "@/components/ui/badge";
import { Shipment } from "@/services/shipment.service";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShipmentStatusBadgeProps {
  status: Shipment["status"];
  isCancelled?: boolean;
}

export function ShipmentStatusBadge({
  status,
  isCancelled = false,
}: ShipmentStatusBadgeProps) {
  const { t } = useLanguage();

  if (isCancelled) {
    return <Badge variant="destructive">{t("shipment.cancelled") || "Cancelled"}</Badge>;
  }

  const statusMap = {
    pending: { variant: "secondary" as const, label: t("shipment.pending") },
    confirmed: { variant: "default" as const, label: t("shipment.confirmed") },
    assigned: { variant: "outline" as const, label: t("shipment.assigned") },
    cancelled: { variant: "destructive" as const, label: t("shipment.cancelled") || "Cancelled" },
  };

  const statusInfo = statusMap[status] || statusMap.pending;

  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
}


