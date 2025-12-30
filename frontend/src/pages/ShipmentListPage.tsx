import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Printer,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  useShipments,
  useCancelShipment,
  useUpdateShipment,
} from "@/hooks/use-shipments";
import { shipmentService } from "@/services/shipment.service";
import { ShipmentStatusBadge } from "@/components/shipments/ShipmentStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shipment } from "@/services/shipment.service";

const routes = [
  "Yaoundé → Douala",
  "Douala → Yaoundé",
  "Douala → Bafoussam",
  "Yaoundé → Kribi",
  "Bafoussam → Douala",
];

export default function ShipmentListPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { hasPermission } = useAuth();
  const [filters, setFilters] = useState({
    status: "",
    route: "",
    waybillNumber: "",
    page: 1,
    limit: 20,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] = useState<Shipment | null>(
    null
  );
  const [deleteReason, setDeleteReason] = useState("");

  const { data, isLoading, error } = useShipments(filters);
  const cancelShipment = useCancelShipment();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(
      amount
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US");
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      route: "",
      waybillNumber: "",
      page: 1,
      limit: 20,
    });
  };

  const handleDelete = (shipment: Shipment) => {
    setShipmentToDelete(shipment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!shipmentToDelete) return;

    const reason =
      deleteReason ||
      (language === "fr"
        ? "Annulation par l'utilisateur"
        : "Cancelled by user");

    try {
      await cancelShipment.mutateAsync({
        id: shipmentToDelete.id,
        reason,
      });
      setDeleteDialogOpen(false);
      setShipmentToDelete(null);
      setDeleteReason("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handlePrintWaybill = async (shipmentId: number) => {
    try {
      const response = await shipmentService.generateWaybill(shipmentId);
      // If backend returns a URL or blob, open it in a new window
      if (response.url) {
        window.open(response.url, "_blank");
      } else if (response.data) {
        // If it's a blob, create a blob URL
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
      } else {
        // Fallback: open the endpoint directly
        const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3001";
        window.open(`${baseURL}/api/shipments/${shipmentId}/waybill`, "_blank");
      }
    } catch (error) {
      console.error("Failed to print waybill:", error);
    }
  };

  const handleEdit = (shipment: Shipment) => {
    // Navigate to edit page (we'll create this or use detail page with edit mode)
    navigate(`/shipments/${shipment.id}/edit`);
  };

  if (error) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {language === "fr"
                ? "Erreur lors du chargement des expéditions"
                : "Error loading shipments"}
            </p>
          </CardContent>
        </Card>
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
              {t("shipment.list")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "fr"
                ? "Gérez toutes vos expéditions"
                : "Manage all your shipments"}
            </p>
          </div>
          {hasPermission("create_shipment") && (
            <Button onClick={() => navigate("/shipments/new")}>
              <Plus className="mr-2 h-4 w-4" />
              {t("shipment.new")}
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t("common.filter")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("shipment.status")}
                </label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("status", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={language === "fr" ? "Tous" : "All"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {language === "fr" ? "Tous" : "All"}
                    </SelectItem>
                    <SelectItem value="pending">
                      {t("shipment.pending")}
                    </SelectItem>
                    <SelectItem value="confirmed">
                      {t("shipment.confirmed")}
                    </SelectItem>
                    <SelectItem value="assigned">
                      {t("shipment.assigned")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("shipment.route")}
                </label>
                <Select
                  value={filters.route || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("route", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={language === "fr" ? "Toutes" : "All"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {language === "fr" ? "Toutes" : "All"}
                    </SelectItem>
                    {routes.map((route) => (
                      <SelectItem key={route} value={route}>
                        {route}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("waybill.number")}
                </label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={
                      language === "fr" ? "Rechercher..." : "Search..."
                    }
                    value={filters.waybillNumber}
                    onChange={(e) =>
                      handleFilterChange("waybillNumber", e.target.value)
                    }
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  {language === "fr" ? "Effacer" : "Clear"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipments Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentShipments")}</CardTitle>
            <CardDescription>
              {data?.pagination.total || 0}{" "}
              {language === "fr" ? "expéditions trouvées" : "shipments found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !data?.data || data.data.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {language === "fr"
                    ? "Aucune expédition trouvée"
                    : "No shipments found"}
                </p>
                {hasPermission("create_shipment") && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/shipments/new")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
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
                      <TableHead className="text-right">
                        {t("common.amount")}
                      </TableHead>
                      <TableHead>{t("shipment.status")}</TableHead>
                      <TableHead>{t("common.date")}</TableHead>
                      <TableHead className="w-12 text-right">
                        {language === "fr" ? "Actions" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((shipment) => (
                      <TableRow
                        key={shipment.id}
                        className="cursor-pointer hover:bg-muted/50"
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
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* View - Always visible */}
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/shipments/${shipment.id}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {t("common.view") ||
                                  (language === "fr" ? "Voir" : "View")}
                              </DropdownMenuItem>

                              {/* Edit - Always visible for now */}
                              <DropdownMenuItem
                                onClick={() => handleEdit(shipment)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {language === "fr" ? "Modifier" : "Edit"}
                              </DropdownMenuItem>

                              {/* Print - Always visible */}
                              <DropdownMenuItem
                                onClick={() => handlePrintWaybill(shipment.id)}
                              >
                                <Printer className="mr-2 h-4 w-4" />
                                {t("shipment.print") ||
                                  (language === "fr" ? "Imprimer" : "Print")}
                              </DropdownMenuItem>

                              {/* Delete - Always visible for now */}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(shipment)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {language === "fr" ? "Supprimer" : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {language === "fr"
                    ? `Page ${data.pagination.page} sur ${data.pagination.totalPages}`
                    : `Page ${data.pagination.page} of ${data.pagination.totalPages}`}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page === 1}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                  >
                    {language === "fr" ? "Précédent" : "Previous"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page >= data.pagination.totalPages}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                  >
                    {language === "fr" ? "Suivant" : "Next"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "fr"
                ? "Confirmer la suppression"
                : "Confirm Deletion"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "fr"
                ? `Êtes-vous sûr de vouloir supprimer l'expédition ${shipmentToDelete?.waybill_number} ? Cette action est irréversible.`
                : `Are you sure you want to delete shipment ${shipmentToDelete?.waybill_number}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">
              {language === "fr" ? "Raison (optionnel)" : "Reason (optional)"}
            </label>
            <Input
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder={
                language === "fr"
                  ? "Raison de la suppression..."
                  : "Reason for deletion..."
              }
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "fr" ? "Annuler" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelShipment.isPending}
            >
              {cancelShipment.isPending
                ? language === "fr"
                  ? "Suppression..."
                  : "Deleting..."
                : language === "fr"
                ? "Supprimer"
                : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
