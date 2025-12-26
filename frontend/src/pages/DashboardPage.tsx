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
import { Badge } from "@/components/ui/badge";
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

interface StatCard {
  titleKey: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: "primary" | "success" | "info" | "warning";
}

const stats: StatCard[] = [
  {
    titleKey: "dashboard.todayShipments",
    value: "47",
    change: 12.5,
    icon: Package,
    color: "primary",
  },
  {
    titleKey: "dashboard.monthShipments",
    value: "1,284",
    change: 8.2,
    icon: TrendingUp,
    color: "success",
  },
  {
    titleKey: "dashboard.totalRevenue",
    value: "4,850,000",
    change: 15.3,
    icon: DollarSign,
    color: "warning",
  },
  {
    titleKey: "dashboard.totalDepartures",
    value: "23",
    change: -2.4,
    icon: Truck,
    color: "info",
  },
];

interface Shipment {
  id: string;
  waybillNo: string;
  sender: string;
  receiver: string;
  route: string;
  amount: number;
  status: "confirmed" | "pending" | "assigned";
  date: string;
}

const recentShipments: Shipment[] = [
  {
    id: "1",
    waybillNo: "TC-2024-0047",
    sender: "Jean Mbarga",
    receiver: "Paul Atangana",
    route: "Yaoundé → Douala",
    amount: 25000,
    status: "confirmed",
    date: "25/12/2024",
  },
  {
    id: "2",
    waybillNo: "TC-2024-0046",
    sender: "Marie Essono",
    receiver: "Claire Nkomo",
    route: "Douala → Bafoussam",
    amount: 35000,
    status: "assigned",
    date: "25/12/2024",
  },
  {
    id: "3",
    waybillNo: "TC-2024-0045",
    sender: "Pierre Fouda",
    receiver: "Sophie Ewane",
    route: "Yaoundé → Kribi",
    amount: 18000,
    status: "pending",
    date: "25/12/2024",
  },
  {
    id: "4",
    waybillNo: "TC-2024-0044",
    sender: "Emmanuel Tabi",
    receiver: "Anne Biya",
    route: "Douala → Yaoundé",
    amount: 42000,
    status: "confirmed",
    date: "24/12/2024",
  },
  {
    id: "5",
    waybillNo: "TC-2024-0043",
    sender: "Francoise Bella",
    receiver: "Michel Ondo",
    route: "Bafoussam → Douala",
    amount: 28000,
    status: "confirmed",
    date: "24/12/2024",
  },
];

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
};

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(amount);
  };

  const getStatusBadge = (status: Shipment["status"]) => {
    const variants = {
      confirmed: "confirmed",
      pending: "pending",
      assigned: "assigned",
    } as const;

    const labels = {
      confirmed: t("shipment.confirmed"),
      pending: t("shipment.pending"),
      assigned: t("shipment.assigned"),
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

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
          <Button variant="glow" className="w-full md:w-auto">
            <Package className="mr-2 h-4 w-4" />
            {t("shipment.new")}
          </Button>
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
                            {formatCurrency(parseInt(stat.value.replace(/,/g, "")))}
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              FCFA
                            </span>
                          </>
                        ) : (
                          stat.value
                        )}
                      </p>
                    </div>
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
            <Button variant="outline" size="sm">
              {t("common.view")} {language === "fr" ? "tout" : "all"}
            </Button>
          </CardHeader>
          <CardContent>
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
                      className="animate-fade-in"
                      style={{ animationDelay: `${(index + 4) * 50}ms` }}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {shipment.waybillNo}
                      </TableCell>
                      <TableCell>{shipment.sender}</TableCell>
                      <TableCell>{shipment.receiver}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm">
                          {shipment.route}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(shipment.amount)} FCFA
                      </TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {shipment.date}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              {t("common.view")}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Printer className="mr-2 h-4 w-4" />
                              {t("shipment.print")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
