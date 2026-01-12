import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Search, Filter, Eye, Printer, Download, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useShipments, useCancelShipment, useGenerateReceipt, useDownloadReceipt, useDeleteMultipleShipments } from "@/hooks/use-shipments";
import { useToast } from "@/hooks/use-toast";
import { shipmentService } from "@/services/shipment.service";
import { ShipmentStatusBadge } from "@/components/shipments/ShipmentStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Shipment } from "@/services/shipment.service";
import { ShipmentStats } from "@/components/shipments/ShipmentStats";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange, getDateRangeForPreset } from "@/lib/date-utils";

const routes = [
  "Yaoundé → Douala",
  "Douala → Yaoundé",
  "Douala → Bafoussam",
  "Yaoundé → Kribi",
  "Bafoussam → Douala",
];

export default function ShipmentListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { hasPermission, user } = useAuth();
  const canDeleteShipments = hasPermission("delete_shipment");
  
  // Détecter la nature depuis l'URL
  const getNatureFromPath = () => {
    if (location.pathname === "/shipments/courrier") return "courrier";
    if (location.pathname === "/shipments/colis") return "colis";
    return "";
  };

  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeForPreset("today"));
  
  const [filters, setFilters] = useState({
    status: "",
    route: "",
    waybillNumber: "",
    nature: getNatureFromPath(),
    dateFrom: dateRange.startDate,
    dateTo: dateRange.endDate,
    page: 1,
    limit: 20,
  });

  // Mettre à jour le filtre nature quand l'URL change
  useEffect(() => {
    const nature = getNatureFromPath();
    setFilters((prev) => ({ ...prev, nature, page: 1 }));
  }, [location.pathname]);
  
  // Mettre à jour les filtres quand la plage de dates change
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      dateFrom: dateRange.startDate,
      dateTo: dateRange.endDate,
      page: 1,
    }));
  }, [dateRange]);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] = useState<Shipment | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [selectedShipments, setSelectedShipments] = useState<number[]>([]);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  const { data, isLoading, error } = useShipments(filters);
  const cancelShipment = useCancelShipment();
  const generateReceipt = useGenerateReceipt();
  const downloadReceipt = useDownloadReceipt();
  const deleteMultipleShipments = useDeleteMultipleShipments();
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US");
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    const nature = getNatureFromPath();
    const defaultDateRange = getDateRangeForPreset("today");
    setDateRange(defaultDateRange);
    setFilters({
      status: "",
      route: "",
      waybillNumber: "",
      nature: nature,
      dateFrom: defaultDateRange.startDate,
      dateTo: defaultDateRange.endDate,
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
    
    // Reason is optional for hard delete
    const reason = deleteReason || undefined;
    
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

  const handleDownloadReceipt = async (shipmentId: number, waybillNumber?: string) => {
    try {
      await downloadReceipt.mutateAsync({ id: shipmentId, waybillNumber });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handlePrintReceipt = async (shipmentId: number, waybillNumber?: string) => {
    try {
      await generateReceipt.mutateAsync({ id: shipmentId, waybillNumber });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEdit = (shipment: Shipment) => {
    // Navigate to edit page (we'll create this or use detail page with edit mode)
    navigate(`/shipments/${shipment.id}/edit`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedShipments(data?.data.map(s => s.id) || []);
    } else {
      setSelectedShipments([]);
    }
  };

  const handleSelectShipment = (shipmentId: number, checked: boolean) => {
    if (checked) {
      setSelectedShipments(prev => [...prev, shipmentId]);
    } else {
      setSelectedShipments(prev => prev.filter(id => id !== shipmentId));
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedShipments.length === 0) return;
    
    setIsDeletingMultiple(true);
    try {
      // Utiliser l'endpoint batch pour supprimer tous les envois en une seule requête
      const result = await deleteMultipleShipments.mutateAsync(selectedShipments);
      
      // Retirer les envois supprimés de la sélection
      // Garder seulement ceux qui ont eu une erreur ou qui ont été ignorés (mais on les retire quand même)
      setSelectedShipments(prev => prev.filter(id => 
        result.errors.some(e => e.id === id)
      ));
      
      // Si tous les envois ont été supprimés ou ignorés, vider la sélection
      if (result.deleted + result.skipped === selectedShipments.length) {
        setSelectedShipments([]);
      }
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  const isAllSelected = data?.data.length > 0 && selectedShipments.length === data.data.length;
  const isIndeterminate = selectedShipments.length > 0 && selectedShipments.length < (data?.data.length || 0);

  if (error) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {language === "fr"
                ? "Erreur lors du chargement des envois"
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
              {filters.nature === "courrier"
                ? language === "fr"
                  ? "Envois - Courrier"
                  : "Shipments - Mail"
                : filters.nature === "colis"
                ? language === "fr"
                  ? "Envois - Colis"
                  : "Shipments - Parcel"
                : t("shipment.list")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "fr"
                ? filters.nature
                  ? `Gérez tous les envois de type ${filters.nature === "courrier" ? "courrier" : "colis"}`
                  : "Gérez tous vos envois"
                : filters.nature
                ? `Manage all ${filters.nature === "courrier" ? "mail" : "parcel"} shipments`
                : "Manage all your shipments"}
            </p>
          </div>
          {hasPermission("create_shipment") && (
            <Button
              onClick={() =>
                navigate("/shipments/new", {
                  state: filters.nature ? { nature: filters.nature } : undefined,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("shipment.new")}
            </Button>
          )}
        </div>

        {/* Statistics */}
        <ShipmentStats
          nature={
            filters.nature === "colis" || filters.nature === "courrier"
              ? filters.nature
              : undefined
          }
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
        />

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
                  onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === "fr" ? "Tous" : "All"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "fr" ? "Tous" : "All"}</SelectItem>
                    <SelectItem value="pending">{t("shipment.pending")}</SelectItem>
                    <SelectItem value="confirmed">{t("shipment.confirmed")}</SelectItem>
                    <SelectItem value="assigned">{t("shipment.assigned")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("shipment.route")}</label>
                <Select
                  value={filters.route || "all"}
                  onValueChange={(value) => handleFilterChange("route", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === "fr" ? "Toutes" : "All"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "fr" ? "Toutes" : "All"}</SelectItem>
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
                    placeholder={language === "fr" ? "Rechercher..." : "Search..."}
                    value={filters.waybillNumber}
                    onChange={(e) =>
                      handleFilterChange("waybillNumber", e.target.value)
                    }
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "fr" ? "Période" : "Period"}
                </label>
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                />
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
              {language === "fr" ? "envois trouvés" : "shipments found"}
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
                    ? "Aucun envoi trouvé"
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
                      {canDeleteShipments && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            ref={(el) => {
                              if (el) {
                                el.indeterminate = isIndeterminate;
                              }
                            }}
                          />
                        </TableHead>
                      )}
                      <TableHead>{t("waybill.number")}</TableHead>
                      <TableHead>{t("shipment.sender")}</TableHead>
                      <TableHead>{t("shipment.receiver")}</TableHead>
                      <TableHead>{t("shipment.route")}</TableHead>
                      <TableHead>{language === "fr" ? "Nature" : "Nature"}</TableHead>
                      {user?.role !== "staff" && (
                        <TableHead className="text-right">{t("common.amount")}</TableHead>
                      )}
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
                        className={`cursor-pointer hover:bg-muted/50 ${selectedShipments.includes(shipment.id) ? 'bg-muted' : ''}`}
                        onClick={() => navigate(`/shipments/${shipment.id}`)}
                      >
                        {canDeleteShipments && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedShipments.includes(shipment.id)}
                              onCheckedChange={(checked) => handleSelectShipment(shipment.id, !!checked)}
                            />
                          </TableCell>
                        )}
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
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {shipment.nature === "colis"
                              ? (language === "fr" ? "Colis" : "Parcel")
                              : (language === "fr" ? "Courrier" : "Mail")}
                          </span>
                        </TableCell>
                        {user?.role !== "staff" && (
                          <TableCell className="text-right font-medium">
                            {shipment.is_free ? (
                              <Badge variant="secondary">
                                {language === "fr" ? "Gratuit" : "Free"}
                              </Badge>
                            ) : shipment.price ? (
                              `${formatCurrency(shipment.price)} FCFA`
                            ) : (
                              "-"
                            )}
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
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* View - Always visible */}
                              <DropdownMenuItem
                                onClick={() => navigate(`/shipments/${shipment.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {t("common.view") || (language === "fr" ? "Voir" : "View")}
                              </DropdownMenuItem>
                              
                              {/* Edit - Always visible for now */}
                              <DropdownMenuItem
                                onClick={() => handleEdit(shipment)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {language === "fr" ? "Modifier" : "Edit"}
                              </DropdownMenuItem>
                              
                              {/* Download Receipt - Always visible */}
                              {hasPermission("print_receipt") && (
                                <DropdownMenuItem
                                  onClick={() => handleDownloadReceipt(shipment.id, shipment.waybill_number)}
                                  disabled={downloadReceipt.isPending}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  {language === "fr" ? "Télécharger Reçu" : "Download Receipt"}
                                </DropdownMenuItem>
                              )}
                              {/* Print Receipt - Always visible */}
                              {hasPermission("print_receipt") && (
                                <DropdownMenuItem
                                  onClick={() => handlePrintReceipt(shipment.id, shipment.waybill_number)}
                                  disabled={generateReceipt.isPending}
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  {language === "fr" ? "Imprimer Reçu" : "Print Receipt"}
                                </DropdownMenuItem>
                              )}
                              
                              {/* Delete - Only for admin and supervisor */}
                              {canDeleteShipments && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(shipment)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {language === "fr" ? "Supprimer" : "Delete"}
                                  </DropdownMenuItem>
                                </>
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
              {language === "fr" ? "Confirmer la suppression" : "Confirm Deletion"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "fr" 
                ? `Êtes-vous sûr de vouloir supprimer l'envoi ${shipmentToDelete?.waybill_number} ? Cette action est irréversible.`
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
              placeholder={language === "fr" ? "Raison de la suppression..." : "Reason for deletion..."}
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
                ? (language === "fr" ? "Suppression..." : "Deleting...")
                : (language === "fr" ? "Supprimer" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating action bar for multiple selection - Only for admin and supervisor */}
      {canDeleteShipments && selectedShipments.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="shadow-lg border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium">
                  {language === "fr" 
                    ? `${selectedShipments.length} envoi(s) sélectionné(s)`
                    : `${selectedShipments.length} shipment(s) selected`}
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDeleteMultiple}
                  disabled={isDeletingMultiple}
                >
                  {isDeletingMultiple ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === "fr" ? "Suppression..." : "Deleting..."}
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {language === "fr" ? "Supprimer" : "Delete"}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedShipments([])}
                >
                  {language === "fr" ? "Annuler" : "Cancel"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}


