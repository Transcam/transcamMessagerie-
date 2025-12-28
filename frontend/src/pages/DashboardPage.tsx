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
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useShipments } from "@/hooks/use-shipments";
import { ShipmentStatusBadge } from "@/components/shipments/ShipmentStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

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

  // Fetch recent shipments (last 20, not cancelled)
  const { data: shipmentsData, isLoading } = useShipments({
    limit: 20,
    includeCancelled: false,
  });

  // Calculate stats from real data
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayShipments = shipments.filter((s) => {
      const createdDate = new Date(s.created_at);
      createdDate.setHours(0, 0, 0, 0);
      return createdDate.getTime() === today.getTime();
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthShipments = shipments.filter((s) => {
      const createdDate = new Date(s.created_at);
      return createdDate >= thisMonth;
    });

    const totalRevenue = shipments
      .filter((s) => !s.is_cancelled)
      .reduce((sum, s) => sum + Number(s.price), 0);

    return [
      {
        titleKey: "dashboard.todayShipments",
        value: todayShipments.length.toString(),
        change: 0, // TODO: Calculate change from previous day
        icon: Package,
        color: "primary" as const,
      },
      {
        titleKey: "dashboard.monthShipments",
        value: monthShipments.length.toString(),
        change: 0, // TODO: Calculate change from previous month
        icon: TrendingUp,
        color: "success" as const,
      },
      {
        titleKey: "dashboard.totalRevenue",
        value: totalRevenue.toString(),
        change: 0, // TODO: Calculate change from previous period
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
    return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(amount);
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
            <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("dashboard.welcome")}, {user?.name}
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
                      <TableHead className="text-right">{t("common.amount")}</TableHead>
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
                        <TableCell className="text-right font-medium">
                          {formatCurrency(shipment.price)} FCFA
                        </TableCell>
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
                                onClick={() => navigate(`/shipments/${shipment.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {t("common.view")}
                              </DropdownMenuItem>
                              {hasPermission("print_waybill") && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    // TODO: Implement print waybill
                                    console.log("Print waybill", shipment.id);
                                  }}
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  {t("shipment.print")}
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
