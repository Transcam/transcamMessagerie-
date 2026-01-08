import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useShipmentStatistics } from "@/hooks/use-shipments";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package,
  DollarSign,
  Weight,
  Calendar,
} from "lucide-react";

interface ShipmentStatsProps {
  nature?: "colis" | "courrier";
  dateFrom?: string;
  dateTo?: string;
}

export function ShipmentStats({ nature, dateFrom, dateTo }: ShipmentStatsProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: stats, isLoading, error } = useShipmentStatistics(nature, {
    dateFrom,
    dateTo,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(
      num
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">
            {language === "fr"
              ? "Erreur lors du chargement des statistiques"
              : "Error loading statistics"}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className={`grid gap-4 ${user?.role === "staff" ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4"}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "fr" ? "Total Envois" : "Total Shipments"}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total)}</div>
            <p className="text-xs text-muted-foreground">
              {language === "fr"
                ? "Tous les envois"
                : "All shipments"}
            </p>
          </CardContent>
        </Card>

        {user?.role !== "staff" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "fr" ? "Revenu Total" : "Total Revenue"}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalPrice)} FCFA
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "fr"
                  ? "Montant total"
                  : "Total amount"}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "fr" ? "Poids Total" : "Total Weight"}
            </CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats.totalWeight)} kg
            </div>
            <p className="text-xs text-muted-foreground">
              {language === "fr"
                ? "Poids cumulé"
                : "Cumulative weight"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "fr" ? "Aujourd'hui" : "Today"}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats.todayCount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === "fr"
                ? "Envois créés"
                : "Shipments created"}
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Nature Breakdown (only if not filtered by nature) */}
      {stats.byNature && !nature && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              {language === "fr" ? "Par Nature" : "By Nature"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">
                    {language === "fr" ? "Colis" : "Parcels"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "fr"
                      ? "Envois de colis"
                      : "Parcel shipments"}
                  </p>
                </div>
                <div className="text-2xl font-bold">
                  {formatNumber(stats.byNature.colis)}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">
                    {language === "fr" ? "Courrier" : "Mail"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "fr"
                      ? "Envois de courrier"
                      : "Mail shipments"}
                  </p>
                </div>
                <div className="text-2xl font-bold">
                  {formatNumber(stats.byNature.courrier)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

