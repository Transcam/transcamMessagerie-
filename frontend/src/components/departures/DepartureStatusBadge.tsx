import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface DepartureStatusBadgeProps {
  status: "open" | "sealed" | "closed";
}

export function DepartureStatusBadge({ status }: DepartureStatusBadgeProps) {
  const { language } = useLanguage();

  const statusConfig = {
    open: {
      label: language === "fr" ? "Ouvert" : "Open",
      variant: "default" as const,
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
    sealed: {
      label: language === "fr" ? "Scellé" : "Sealed",
      variant: "secondary" as const,
      className: "bg-orange-500 hover:bg-orange-600 text-white",
    },
    closed: {
      label: language === "fr" ? "Fermé" : "Closed",
      variant: "outline" as const,
      className: "bg-green-500 hover:bg-green-600 text-white border-green-600",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

