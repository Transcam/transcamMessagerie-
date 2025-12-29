import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Filter, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
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
import {
  useDrivers,
  useDeleteDriver,
  Driver,
  DriverStatus,
  DRIVER_STATUS_LABELS,
} from "@/hooks/use-drivers";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function DriverListPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { hasPermission } = useAuth();

  const [filters, setFilters] = useState({
    status: "" as DriverStatus | "",
    search: "",
    page: 1,
    limit: 20,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

  const { data, isLoading, error } = useDrivers(filters);
  const deleteDriver = useDeleteDriver();

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
      search: "",
      page: 1,
      limit: 20,
    });
  };

  const handleDelete = (driver: Driver) => {
    setDriverToDelete(driver);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!driverToDelete) return;
    try {
      await deleteDriver.mutateAsync(driverToDelete.id);
      setDeleteDialogOpen(false);
      setDriverToDelete(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const canEdit = hasPermission("edit_driver");
  const canDelete = hasPermission("delete_driver");

  if (error) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {language === "fr"
                ? "Erreur lors du chargement des chauffeurs"
                : "Error loading drivers"}
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
              {language === "fr" ? "Chauffeurs" : "Drivers"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "fr"
                ? "Gérez votre équipe de chauffeurs"
                : "Manage your driver team"}
            </p>
          </div>
          {hasPermission("create_driver") && (
            <Button onClick={() => navigate("/drivers/new")}>
              <Plus className="mr-2 h-4 w-4" />
              {language === "fr" ? "Nouveau chauffeur" : "New Driver"}
            </Button>
          )}
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
            <div className="grid gap-4 md:grid-cols-3">
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
                    <SelectItem value={DriverStatus.ACTIF}>
                      {DRIVER_STATUS_LABELS[DriverStatus.ACTIF][language]}
                    </SelectItem>
                    <SelectItem value={DriverStatus.INACTIF}>
                      {DRIVER_STATUS_LABELS[DriverStatus.INACTIF][language]}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "fr" ? "Recherche" : "Search"}
                </label>
                <Input
                  placeholder={language === "fr" ? "Nom, téléphone, permis..." : "Name, phone, license..."}
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
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

        {/* Drivers Table */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "fr" ? "Liste des chauffeurs" : "Drivers List"}</CardTitle>
            <CardDescription>
              {data?.pagination.total || 0}{" "}
              {language === "fr" ? "chauffeurs trouvés" : "drivers found"}
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
                    ? "Aucun chauffeur trouvé"
                    : "No drivers found"}
                </p>
                {hasPermission("create_driver") && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/drivers/new")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {language === "fr" ? "Nouveau chauffeur" : "New Driver"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "fr" ? "Nom complet" : "Full Name"}</TableHead>
                      <TableHead>{language === "fr" ? "Téléphone" : "Phone"}</TableHead>
                      <TableHead>{language === "fr" ? "Numéro de permis" : "License Number"}</TableHead>
                      <TableHead>{language === "fr" ? "Email" : "Email"}</TableHead>
                      <TableHead>{language === "fr" ? "Statut" : "Status"}</TableHead>
                      <TableHead>{language === "fr" ? "Créé par" : "Created by"}</TableHead>
                      <TableHead>{language === "fr" ? "Date" : "Date"}</TableHead>
                      <TableHead className="w-12 text-right">
                        {language === "fr" ? "Actions" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((driver) => (
                      <TableRow
                        key={driver.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/drivers/${driver.id}`)}
                      >
                        <TableCell className="font-medium">
                          {driver.first_name} {driver.last_name}
                        </TableCell>
                        <TableCell>{driver.phone}</TableCell>
                        <TableCell className="font-mono">{driver.license_number}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {driver.email || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={driver.status === DriverStatus.ACTIF ? "default" : "secondary"}
                          >
                            {DRIVER_STATUS_LABELS[driver.status][language]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {driver.created_by?.username || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(driver.created_at)}
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
                                onClick={() => navigate(`/drivers/${driver.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {language === "fr" ? "Voir" : "View"}
                              </DropdownMenuItem>
                              {canEdit && (
                                <DropdownMenuItem
                                  onClick={() => navigate(`/drivers/${driver.id}/edit`)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  {language === "fr" ? "Modifier" : "Edit"}
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(driver)}
                                    className="text-destructive"
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
                ? `Êtes-vous sûr de vouloir supprimer le chauffeur "${driverToDelete?.first_name} ${driverToDelete?.last_name}" ? Cette action est irréversible.`
                : `Are you sure you want to delete driver "${driverToDelete?.first_name} ${driverToDelete?.last_name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "fr" ? "Annuler" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteDriver.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDriver.isPending
                ? (language === "fr" ? "Suppression..." : "Deleting...")
                : (language === "fr" ? "Supprimer" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

