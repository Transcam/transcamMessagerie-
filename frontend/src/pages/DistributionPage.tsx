import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  useDriverDistributions,
  useMinistryDistribution,
  useDistributionSummary,
} from "@/hooks/use-distributions";
import { Skeleton } from "@/components/ui/skeleton";
import { SHIPMENT_TYPE_LABELS } from "@/services/shipment.service";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange, getDateRangeForPreset, formatDateDisplay } from "@/lib/date-utils";

type DistributionView = "chauffeur" | "ministere";

export default function DistributionPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [view, setView] = useState<DistributionView>("chauffeur");
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeForPreset("today"));

  const filters = {
    dateFrom: dateRange.startDate,
    dateTo: dateRange.endDate,
  };

  const { data: summary, isLoading: isLoadingSummary } = useDistributionSummary(filters);
  const { data: driverDistributions, isLoading: isLoadingDrivers } =
    useDriverDistributions(filters);
  const { data: ministryDistribution, isLoading: isLoadingMinistry } =
    useMinistryDistribution(filters);

  const canSeeAmount = user?.role !== "staff";

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || !canSeeAmount) return "-";
    return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const clearFilters = () => {
    setDateRange(getDateRangeForPreset("today"));
  };

  if (isLoadingSummary) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {language === "fr" ? "Répartitions" : "Distributions"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "fr"
                ? "Consultez les répartitions des revenus"
                : "View revenue distributions"}
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === "fr" ? "Répartitions Chauffeurs" : "Driver Distributions"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.total_driver_distributions)}</div>
                <p className="text-xs text-muted-foreground">
                  {language === "fr" ? "60% des colis ≤ 40kg" : "60% of parcels ≤ 40kg"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === "fr" ? "Répartition Ministère" : "Ministry Distribution"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.total_ministry_distribution)}</div>
                <p className="text-xs text-muted-foreground">
                  {language === "fr" ? "5% du CA éligible" : "5% of eligible revenue"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === "fr" ? "Montant Agence" : "Agency Amount"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.total_agency_amount)}</div>
                <p className="text-xs text-muted-foreground">
                  {language === "fr" ? "Solde après déductions" : "Balance after deductions"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === "fr" ? "CA Total" : "Total Revenue"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.total_revenue_concerned)}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.total_shipments_concerned}{" "}
                  {language === "fr" ? "expéditions" : "shipments"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and View Selection */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "fr" ? "Filtres et Affichage" : "Filters and Display"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">
                  {language === "fr" ? "Affichage" : "View"}
                </label>
                <Select value={view} onValueChange={(value) => setView(value as DistributionView)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chauffeur">
                      {language === "fr" ? "Chauffeur" : "Driver"}
                    </SelectItem>
                    <SelectItem value="ministere">
                      {language === "fr" ? "Ministère" : "Ministry"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {language === "fr" ? "Période" : "Period"}
                </label>
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters}>
                  {language === "fr" ? "Réinitialiser" : "Reset"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Distributions View */}
        {view === "chauffeur" && (
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "fr" ? "Répartitions par Chauffeur" : "Driver Distributions"}
              </CardTitle>
              <CardDescription>
                {language === "fr"
                  ? "60% du montant des colis ≤ 40kg transportés"
                  : "60% of amount for parcels ≤ 40kg transported"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDrivers ? (
                <Skeleton className="h-[400px]" />
              ) : driverDistributions && driverDistributions.length > 0 ? (
                <div className="space-y-6">
                  {driverDistributions.map((distribution) => (
                    <div key={distribution.driver.id} className="space-y-2">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div>
                          <h3 className="font-semibold">
                            {distribution.driver.first_name} {distribution.driver.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {distribution.shipment_count}{" "}
                            {language === "fr" ? "expéditions" : "shipments"} •{" "}
                            {formatCurrency(distribution.total_amount)}
                          </p>
                        </div>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              {language === "fr" ? "Bordereau" : "Waybill"}
                            </TableHead>
                            <TableHead>
                              {language === "fr" ? "Poids (kg)" : "Weight (kg)"}
                            </TableHead>
                            <TableHead>
                              {language === "fr" ? "Prix" : "Price"}
                            </TableHead>
                            <TableHead>
                              {language === "fr" ? "Répartition (60%)" : "Distribution (60%)"}
                            </TableHead>
                            <TableHead>
                              {language === "fr" ? "Date scellement" : "Sealed Date"}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {distribution.shipments.map((shipment) => (
                            <TableRow key={shipment.shipment_id}>
                              <TableCell className="font-medium">
                                {shipment.waybill_number}
                              </TableCell>
                              <TableCell>{shipment.weight}</TableCell>
                              <TableCell>{formatCurrency(shipment.price)}</TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(shipment.driver_amount)}
                              </TableCell>
                              <TableCell>{formatDateDisplay(shipment.sealed_at, language)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {language === "fr"
                    ? "Aucune répartition chauffeur trouvée"
                    : "No driver distributions found"}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ministry Distribution View */}
        {view === "ministere" && (
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "fr" ? "Répartition Ministère" : "Ministry Distribution"}
              </CardTitle>
              <CardDescription>
                {language === "fr"
                  ? "5% du chiffre d'affaires des expéditions éligibles"
                  : "5% of revenue from eligible shipments"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMinistry ? (
                <Skeleton className="h-[400px]" />
              ) : ministryDistribution ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3 border-b pb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === "fr" ? "CA Total" : "Total Revenue"}
                      </p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(ministryDistribution.total_revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === "fr" ? "Répartition (5%)" : "Distribution (5%)"}
                      </p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(ministryDistribution.ministry_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === "fr" ? "Nombre d'expéditions" : "Number of shipments"}
                      </p>
                      <p className="text-2xl font-bold">
                        {ministryDistribution.shipment_count}
                      </p>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {language === "fr" ? "Bordereau" : "Waybill"}
                        </TableHead>
                        <TableHead>
                          {language === "fr" ? "Nature" : "Nature"}
                        </TableHead>
                        <TableHead>
                          {language === "fr" ? "Type" : "Type"}
                        </TableHead>
                        <TableHead>
                          {language === "fr" ? "Poids (kg)" : "Weight (kg)"}
                        </TableHead>
                        <TableHead>
                          {language === "fr" ? "Prix" : "Price"}
                        </TableHead>
                        <TableHead>
                          {language === "fr" ? "Date scellement" : "Sealed Date"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ministryDistribution.shipments.map((shipment) => (
                        <TableRow key={shipment.shipment_id}>
                          <TableCell className="font-medium">
                            {shipment.waybill_number}
                          </TableCell>
                          <TableCell>
                            {shipment.nature === "colis"
                              ? language === "fr"
                                ? "Colis"
                                : "Parcel"
                              : language === "fr"
                              ? "Courrier"
                              : "Mail"}
                          </TableCell>
                          <TableCell>
                            {SHIPMENT_TYPE_LABELS[shipment.type][language]}
                          </TableCell>
                          <TableCell>{shipment.weight}</TableCell>
                          <TableCell>{formatCurrency(shipment.price)}</TableCell>
                          <TableCell>{formatDateDisplay(shipment.sealed_at, language)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {language === "fr"
                    ? "Aucune répartition ministère trouvée"
                    : "No ministry distribution found"}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

