import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpenseStatistics } from "@/hooks/use-expenses";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Receipt, DollarSign, TrendingUp, Calendar } from "lucide-react";

export function ExpenseStats() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: stats, isLoading, error } = useExpenseStatistics();

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

  const canSeeAmount = user?.role !== "staff";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {language === "fr" ? "Total Dépenses" : "Total Expenses"}
          </CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.total)}</div>
          <p className="text-xs text-muted-foreground">
            {language === "fr"
              ? "Toutes les dépenses"
              : "All expenses"}
          </p>
        </CardContent>
      </Card>

      {canSeeAmount && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "fr" ? "Montant Total" : "Total Amount"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalAmount !== null
                ? `${formatCurrency(stats.totalAmount)} FCFA`
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === "fr"
                ? "Montant total des dépenses"
                : "Total expense amount"}
            </p>
          </CardContent>
        </Card>
      )}

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
            {canSeeAmount && stats.todayAmount !== null
              ? `${formatCurrency(stats.todayAmount)} FCFA`
              : language === "fr"
              ? "Dépenses aujourd'hui"
              : "Expenses today"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {language === "fr" ? "Ce Mois" : "This Month"}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(stats.monthCount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {canSeeAmount && stats.monthAmount !== null
              ? `${formatCurrency(stats.monthAmount)} FCFA`
              : language === "fr"
              ? "Dépenses ce mois"
              : "Expenses this month"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

