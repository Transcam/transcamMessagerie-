import { useNavigate } from "react-router-dom";
import {
  Package,
  TrendingUp,
  Truck,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Printer,
  Download,
  MoreHorizontal,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useShipments, useGenerateReceipt, useDownloadReceipt } from "@/hooks/use-shipments";
import { ShipmentStatusBadge } from "@/components/shipments/ShipmentStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange, getDateRangeForPreset, parseInputDate } from "@/lib/date-utils";

interface StatCard {
  titleKey: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: "primary" | "success" | "info" | "warning";
}

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, hasPermission } = useAuth();
  const isStaff = user?.role === "staff";
  
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeForPreset("today"));

  // Fetch shipments with date filters
  const { data: shipmentsData, isLoading } = useShipments({
    dateFrom: dateRange.startDate,
    dateTo: dateRange.endDate,
    includeCancelled: false,
  });
  const generateReceipt = useGenerateReceipt();
  const downloadReceipt = useDownloadReceipt();

  // Calculate stats from real data filtered by date range
  const stats = useMemo(() => {
    if (!shipmentsData?.data) {
      return [
        {
          titleKey: "dashboard.todayShipments",
          value: "0",
          change: 0,
          icon: Package,
          color: "primary" as const,
        },
        {
          titleKey: "dashboard.monthShipments",
          value: "0",
          change: 0,
          icon: TrendingUp,
          color: "success" as const,
        },
        {
          titleKey: "dashboard.totalRevenue",
          value: "0",
          change: 0,
          icon: DollarSign,
          color: "warning" as const,
        },
        {
          titleKey: "dashboard.totalDepartures",
          value: "0",
          change: 0,
          icon: Truck,
          color: "info" as const,
        },
      ];
    }

    const shipments = shipmentsData.data;
    const startDate = parseInputDate(dateRange.startDate);
    const endDate = parseInputDate(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999); // Include the full end date

    // Filter shipments by date range
    const filteredShipments = shipments.filter((s) => {
      const createdDate = new Date(s.created_at);
      return createdDate >= startDate && createdDate <= endDate;
    });

    const totalRevenue = filteredShipments
      .filter((s) => !s.is_cancelled)
      .reduce((sum, s) => sum + Number(s.price), 0);

    return [
      {
        titleKey: "dashboard.todayShipments",
        value: filteredShipments.length.toString(),
        change: 0,
        icon: Package,
        color: "primary" as const,
      },
      {
        titleKey: "dashboard.monthShipments",
        value: filteredShipments.filter((s) => !s.is_cancelled).length.toString(),
        change: 0,
        icon: TrendingUp,
        color: "success" as const,
      },
      {
        titleKey: "dashboard.totalRevenue",
        value: totalRevenue.toString(),
        change: 0,
        icon: DollarSign,
        color: "warning" as const,
      },
      {
        titleKey: "dashboard.totalDepartures",
        value: "0", // TODO: Calculate from departures when implemented
        change: 0,
        icon: Truck,
        color: "info" as const,
      },
    ];
  }, [shipmentsData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(
      amount
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US");
  };

  const recentShipments = shipmentsData?.data?.slice(0, 5) || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("dashboard.title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("dashboard.welcome")}, {user?.username}
            </p>
          </div>
          {hasPermission("create_shipment") && (
            <Button
              variant="glow"
              className="w-full md:w-auto"
              onClick={() => navigate("/shipments/new")}
            >
              <Package className="mr-2 h-4 w-4" />
              {t("shipment.new")}
            </Button>
          )}
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "fr" ? "Filtre de période" : "Date Range Filter"}</CardTitle>
            <CardDescription>
              {language === "fr" 
                ? "Sélectionnez une période pour voir les statistiques correspondantes"
                : "Select a date range to view corresponding statistics"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.titleKey}
                variant="stat"
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t(stat.titleKey)}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${colorClasses[stat.color]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {stat.titleKey.includes("Revenue") ? (
                          <>
                            {formatCurrency(parseInt(stat.value) || 0)}
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              FCFA
                            </span>
                          </>
                        ) : (
                          stat.value
                        )}
                      </p>
                    </div>
                    {stat.change !== 0 && (
                      <div
                        className={`flex items-center gap-1 text-sm ${
                          stat.change >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {stat.change >= 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        <span>{Math.abs(stat.change)}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Shipments Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("dashboard.recentShipments")}</CardTitle>
              <CardDescription>
                {language === "fr"
                  ? "Les dernières expéditions enregistrées"
                  : "Latest registered shipments"}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/shipments")}
            >
              {t("common.view")} {language === "fr" ? "tout" : "all"}
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentShipments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {language === "fr"
                    ? "Aucune expédition récente"
                    : "No recent shipments"}
                </p>
                {hasPermission("create_shipment") && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/shipments/new")}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    {t("shipment.new")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("waybill.number")}</TableHead>
                      <TableHead>{t("shipment.sender")}</TableHead>
                      <TableHead>{t("shipment.receiver")}</TableHead>
                      <TableHead>{t("shipment.route")}</TableHead>
                      {!isStaff && (
                        <TableHead className="text-right">
                          {t("common.amount")}
                        </TableHead>
                      )}
                      <TableHead>{t("shipment.status")}</TableHead>
                      <TableHead>{t("common.date")}</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentShipments.map((shipment, index) => (
                      <TableRow
                        key={shipment.id}
                        className="cursor-pointer hover:bg-muted/50 animate-fade-in"
                        style={{ animationDelay: `${(index + 4) * 50}ms` }}
                        onClick={() => navigate(`/shipments/${shipment.id}`)}
                      >
                        <TableCell className="font-mono text-sm font-medium">
                          {shipment.waybill_number}
                        </TableCell>
                        <TableCell>{shipment.sender_name}</TableCell>
                        <TableCell>{shipment.receiver_name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 text-sm">
                            {shipment.route}
                          </span>
                        </TableCell>
                        {!isStaff && (
                          <TableCell className="text-right font-medium">
                            {shipment.price ? `${formatCurrency(shipment.price)} FCFA` : "-"}
                          </TableCell>
                        )}
                        <TableCell>
                          <ShipmentStatusBadge
                            status={shipment.status}
                            isCancelled={shipment.is_cancelled}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(shipment.created_at)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/shipments/${shipment.id}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {t("common.view")}
                              </DropdownMenuItem>
                              {hasPermission("print_receipt") && (
                                <DropdownMenuItem
                                  onClick={() => downloadReceipt.mutate({ id: shipment.id, waybillNumber: shipment.waybill_number })}
                                  disabled={downloadReceipt.isPending}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  {language === "fr" ? "Télécharger Reçu" : "Download Receipt"}
                                </DropdownMenuItem>
                              )}
                              {hasPermission("print_receipt") && (
                                <DropdownMenuItem
                                  onClick={() => generateReceipt.mutate({ id: shipment.id, waybillNumber: shipment.waybill_number })}
                                  disabled={generateReceipt.isPending}
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  {language === "fr" ? "Imprimer Reçu" : "Print Receipt"}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
