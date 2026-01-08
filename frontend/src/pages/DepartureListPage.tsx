import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Eye, Lock, LockOpen, Download, Printer, MoreHorizontal, Edit, Trash2 } from "lucide-react";
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
import { useDepartures, useSealDeparture, useCloseDeparture, useDeleteDeparture } from "@/hooks/use-departures";
import { departureService } from "@/services/departure.service";
import { DepartureStatusBadge } from "@/components/departures/DepartureStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Departure } from "@/services/departure.service";
import { UserRole } from "@/types/role";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange, getDateRangeForPreset } from "@/lib/date-utils";

export default function DepartureListPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, hasPermission } = useAuth();
  const [filters, setFilters] = useState({
    status: "",
    route: "",
    generalWaybillNumber: "",
    dateRange: getDateRangeForPreset("thisMonth"),
    page: 1,
    limit: 20,
  });
  const [sealDialogOpen, setSealDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departureToSeal, setDepartureToSeal] = useState<Departure | null>(null);
  const [departureToClose, setDepartureToClose] = useState<Departure | null>(null);
  const [departureToDelete, setDepartureToDelete] = useState<Departure | null>(null);

  const { data, isLoading, error } = useDepartures({
    ...filters,
    dateFrom: filters.dateRange.startDate,
    dateTo: filters.dateRange.endDate,
  });
  const sealDeparture = useSealDeparture();
  const closeDeparture = useCloseDeparture();
  const deleteDeparture = useDeleteDeparture();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US");
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      route: "",
      generalWaybillNumber: "",
      dateRange: getDateRangeForPreset("thisMonth"),
      page: 1,
      limit: 20,
    });
  };

  const handleSeal = (departure: Departure) => {
    setDepartureToSeal(departure);
    setSealDialogOpen(true);
  };

  const confirmSeal = async () => {
    if (!departureToSeal) return;
    
    try {
      await sealDeparture.mutateAsync(departureToSeal.id);
      setSealDialogOpen(false);
      setDepartureToSeal(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleClose = (departure: Departure) => {
    setDepartureToClose(departure);
    setCloseDialogOpen(true);
  };

  const confirmClose = async () => {
    if (!departureToClose) return;
    
    try {
      await closeDeparture.mutateAsync(departureToClose.id);
      setCloseDialogOpen(false);
      setDepartureToClose(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = (departure: Departure) => {
    setDepartureToDelete(departure);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!departureToDelete) return;
    
    try {
      await deleteDeparture.mutateAsync(departureToDelete.id);
      setDeleteDialogOpen(false);
      setDepartureToDelete(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDownloadPDF = async (id: number) => {
    try {
      await departureService.downloadPDF(id);
    } catch (error: any) {
      console.error("Failed to download PDF:", error);
    }
  };

  const handlePrintPDF = async (id: number) => {
    try {
      await departureService.printPDF(id);
    } catch (error: any) {
      console.error("Failed to print PDF:", error);
    }
  };

  const canSeal = (departure: Departure) => hasPermission("validate_departure") && departure.status === "open";
  const canClose = (departure: Departure) => hasPermission("validate_departure") && departure.status === "sealed";
  const canEdit = (departure: Departure) => hasPermission("create_departure") && departure.status === "open";
  const canDelete = (departure: Departure) => {
    if (!hasPermission("delete_departure")) return false;
    // ADMIN and SUPERVISOR can delete even closed departures
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERVISOR) {
      return true;
    }
    // Others can only delete OPEN departures
    return departure.status === "open";
  };
  const canDownloadPDF = (departure: Departure) => hasPermission("print_waybill") && (departure.status === "sealed" || departure.status === "closed");

  // Calculate totals for a departure
  const getDepartureTotals = (departure: Departure) => {
    if (!departure.shipments || departure.shipments.length === 0) {
      return { count: 0, total: null };
    }
    const count = departure.shipments.length;
    const canSeeAmount = hasPermission("view_finance"); // Use view_finance to check if user can see financial data
    if (!canSeeAmount) {
      return { count, total: null };
    }
    const total = departure.shipments.reduce((sum: number, s: any) => {
      const price = s.price !== null && s.price !== undefined ? Number(s.price) : 0;
      return sum + price;
    }, 0);
    return { count, total };
  };

  if (error) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {language === "fr"
                ? "Erreur lors du chargement des départs"
                : "Error loading departures"}
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
              {language === "fr" ? "Départs" : "Departures"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "fr"
                ? "Gérez tous vos départs"
                : "Manage all your departures"}
            </p>
          </div>
          <Button onClick={() => navigate("/departures/new")}>
            <Plus className="mr-2 h-4 w-4" />
            {language === "fr" ? "Nouveau départ" : "New Departure"}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {language === "fr" ? "Filtres" : "Filters"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "fr" ? "Statut" : "Status"}
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
                    <SelectItem value="open">{language === "fr" ? "Ouvert" : "Open"}</SelectItem>
                    <SelectItem value="sealed">{language === "fr" ? "Scellé" : "Sealed"}</SelectItem>
                    <SelectItem value="closed">{language === "fr" ? "Fermé" : "Closed"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "fr" ? "Route" : "Route"}
                </label>
                <Input
                  placeholder={language === "fr" ? "Filtrer par route..." : "Filter by route..."}
                  value={filters.route}
                  onChange={(e) => handleFilterChange("route", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "fr" ? "N° Bordereau Général" : "General Waybill Number"}
                </label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === "fr" ? "Rechercher..." : "Search..."}
                    value={filters.generalWaybillNumber}
                    onChange={(e) =>
                      handleFilterChange("generalWaybillNumber", e.target.value)
                    }
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "fr" ? "Période" : "Period"}
                </label>
                <DateRangePicker
                  value={filters.dateRange}
                  onChange={(range) => handleFilterChange("dateRange", range)}
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

        {/* Departures Table */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "fr" ? "Liste des départs" : "Departures List"}</CardTitle>
            <CardDescription>
              {data?.pagination.total || 0}{" "}
              {language === "fr" ? "départs trouvés" : "departures found"}
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
                    ? "Aucun départ trouvé"
                    : "No departures found"}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/departures/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {language === "fr" ? "Nouveau départ" : "New Departure"}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>{language === "fr" ? "N° Bordereau" : "Waybill #"}</TableHead>
                      <TableHead>{language === "fr" ? "Route" : "Route"}</TableHead>
                      <TableHead>{language === "fr" ? "Véhicule" : "Vehicle"}</TableHead>
                      <TableHead>{language === "fr" ? "Chauffeur" : "Driver"}</TableHead>
                      <TableHead>{language === "fr" ? "Colis" : "Shipments"}</TableHead>
                      <TableHead className="text-right">{language === "fr" ? "Montant" : "Amount"}</TableHead>
                      <TableHead>{language === "fr" ? "Statut" : "Status"}</TableHead>
                      <TableHead>{language === "fr" ? "Date" : "Date"}</TableHead>
                      <TableHead className="w-12 text-right">
                        {language === "fr" ? "Actions" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((departure) => {
                      const totals = getDepartureTotals(departure);
                      return (
                        <TableRow
                          key={departure.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/departures/${departure.id}`)}
                        >
                          <TableCell className="font-medium">
                            #{departure.id}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {departure.general_waybill_number || "-"}
                          </TableCell>
                          <TableCell>{departure.route || "-"}</TableCell>
                          <TableCell>
                            {departure.vehicle
                              ? `${departure.vehicle.name} (${departure.vehicle.registration_number})`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {departure.driver
                              ? `${departure.driver.first_name} ${departure.driver.last_name}`
                              : "-"}
                          </TableCell>
                          <TableCell>{totals.count}</TableCell>
                          <TableCell className="text-right font-medium">
                            {totals.total !== null && totals.total !== undefined && totals.total > 0
                              ? `${formatCurrency(totals.total)} FCFA`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <DepartureStatusBadge status={departure.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(departure.created_at)}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => navigate(`/departures/${departure.id}`)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  {language === "fr" ? "Voir" : "View"}
                                </DropdownMenuItem>
                                
                                {canEdit(departure) && (
                                  <DropdownMenuItem
                                    onClick={() => navigate(`/departures/${departure.id}/edit`)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    {language === "fr" ? "Modifier" : "Edit"}
                                  </DropdownMenuItem>
                                )}
                                
                                {canSeal(departure) && (
                                  <DropdownMenuItem
                                    onClick={() => handleSeal(departure)}
                                  >
                                    <Lock className="mr-2 h-4 w-4" />
                                    {language === "fr" ? "Sceller" : "Seal"}
                                  </DropdownMenuItem>
                                )}
                                
                                {canClose(departure) && (
                                  <DropdownMenuItem
                                    onClick={() => handleClose(departure)}
                                  >
                                    <LockOpen className="mr-2 h-4 w-4" />
                                    {language === "fr" ? "Fermer" : "Close"}
                                  </DropdownMenuItem>
                                )}
                                
                                {canDelete(departure) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(departure)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      {language === "fr" ? "Supprimer" : "Delete"}
                                    </DropdownMenuItem>
                                  </>
                                )}
                                
                                {canDownloadPDF(departure) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDownloadPDF(departure.id)}
                                    >
                                      <Download className="mr-2 h-4 w-4" />
                                      {language === "fr" ? "Télécharger PDF" : "Download PDF"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handlePrintPDF(departure.id)}
                                    >
                                      <Printer className="mr-2 h-4 w-4" />
                                      {language === "fr" ? "Imprimer Bordereau" : "Print Waybill"}
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

      {/* Seal Confirmation Dialog */}
      <AlertDialog open={sealDialogOpen} onOpenChange={setSealDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "fr" ? "Confirmer le scellage" : "Confirm Sealing"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "fr"
                ? `Êtes-vous sûr de vouloir sceller le départ #${departureToSeal?.id} ? Cette action générera le Bordereau Général et verrouillera tous les colis.`
                : `Are you sure you want to seal departure #${departureToSeal?.id}? This will generate the General Waybill and lock all shipments.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "fr" ? "Annuler" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSeal}
              disabled={sealDeparture.isPending}
            >
              {sealDeparture.isPending
                ? (language === "fr" ? "Scellage..." : "Sealing...")
                : (language === "fr" ? "Sceller" : "Seal")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Confirmation Dialog */}
      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "fr" ? "Confirmer la fermeture" : "Confirm Closing"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "fr"
                ? `Êtes-vous sûr de vouloir fermer le départ #${departureToClose?.id} ? Cette action est irréversible.`
                : `Are you sure you want to close departure #${departureToClose?.id}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "fr" ? "Annuler" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClose}
              disabled={closeDeparture.isPending}
            >
              {closeDeparture.isPending
                ? (language === "fr" ? "Fermeture..." : "Closing...")
                : (language === "fr" ? "Fermer" : "Close")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "fr" ? "Confirmer la suppression" : "Confirm Deletion"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "fr"
                ? `Êtes-vous sûr de vouloir supprimer le départ #${departureToDelete?.id} ? Cette action est irréversible et libérera tous les colis assignés.`
                : `Are you sure you want to delete departure #${departureToDelete?.id}? This action cannot be undone and will release all assigned shipments.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "fr" ? "Annuler" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteDeparture.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDeparture.isPending
                ? (language === "fr" ? "Suppression..." : "Deleting...")
                : (language === "fr" ? "Supprimer" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

