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
  useVehicles,
  useDeleteVehicle,
  Vehicle,
  VehicleType,
  VehicleStatus,
  VEHICLE_TYPE_LABELS,
  VEHICLE_STATUS_LABELS,
} from "@/hooks/use-vehicles";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function VehicleListPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { hasPermission } = useAuth();

  const [filters, setFilters] = useState({
    status: "" as VehicleStatus | "",
    type: "" as VehicleType | "",
    search: "",
    page: 1,
    limit: 20,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const { data, isLoading, error } = useVehicles(filters);
  const deleteVehicle = useDeleteVehicle();

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
      type: "",
      search: "",
      page: 1,
      limit: 20,
    });
  };

  const handleDelete = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;
    try {
      await deleteVehicle.mutateAsync(vehicleToDelete.id);
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const canEdit = hasPermission("edit_vehicle");
  const canDelete = hasPermission("delete_vehicle");

  if (error) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {language === "fr"
                ? "Erreur lors du chargement des véhicules"
                : "Error loading vehicles"}
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
              {language === "fr" ? "Véhicules" : "Vehicles"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "fr"
                ? "Gérez votre flotte de véhicules"
                : "Manage your vehicle fleet"}
            </p>
          </div>
          {hasPermission("create_vehicle") && (
            <Button onClick={() => navigate("/vehicles/new")}>
              <Plus className="mr-2 h-4 w-4" />
              {language === "fr" ? "Nouveau véhicule" : "New Vehicle"}
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
            <div className="grid gap-4 md:grid-cols-4">
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
                    <SelectItem value={VehicleStatus.ACTIF}>
                      {VEHICLE_STATUS_LABELS[VehicleStatus.ACTIF]}
                    </SelectItem>
                    <SelectItem value={VehicleStatus.INACTIF}>
                      {VEHICLE_STATUS_LABELS[VehicleStatus.INACTIF]}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "fr" ? "Type" : "Type"}
                </label>
                <Select
                  value={filters.type || "all"}
                  onValueChange={(value) => handleFilterChange("type", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === "fr" ? "Tous" : "All"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "fr" ? "Tous" : "All"}</SelectItem>
                    <SelectItem value={VehicleType.BUS}>
                      {VEHICLE_TYPE_LABELS[VehicleType.BUS]}
                    </SelectItem>
                    <SelectItem value={VehicleType.COASTER}>
                      {VEHICLE_TYPE_LABELS[VehicleType.COASTER]}
                    </SelectItem>
                    <SelectItem value={VehicleType.MINIBUS}>
                      {VEHICLE_TYPE_LABELS[VehicleType.MINIBUS]}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "fr" ? "Recherche" : "Search"}
                </label>
                <Input
                  placeholder={language === "fr" ? "Immatriculation ou nom..." : "Registration or name..."}
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

        {/* Vehicles Table */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "fr" ? "Liste des véhicules" : "Vehicles List"}</CardTitle>
            <CardDescription>
              {data?.pagination.total || 0}{" "}
              {language === "fr" ? "véhicules trouvés" : "vehicles found"}
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
                    ? "Aucun véhicule trouvé"
                    : "No vehicles found"}
                </p>
                {hasPermission("create_vehicle") && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/vehicles/new")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {language === "fr" ? "Nouveau véhicule" : "New Vehicle"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "fr" ? "Immatriculation" : "Registration"}</TableHead>
                      <TableHead>{language === "fr" ? "Nom/Code" : "Name/Code"}</TableHead>
                      <TableHead>{language === "fr" ? "Type" : "Type"}</TableHead>
                      <TableHead>{language === "fr" ? "Statut" : "Status"}</TableHead>
                      <TableHead>{language === "fr" ? "Créé par" : "Created by"}</TableHead>
                      <TableHead>{language === "fr" ? "Date" : "Date"}</TableHead>
                      <TableHead className="w-12 text-right">
                        {language === "fr" ? "Actions" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((vehicle) => (
                      <TableRow
                        key={vehicle.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                      >
                        <TableCell className="font-mono font-medium">
                          {vehicle.registration_number}
                        </TableCell>
                        <TableCell className="font-medium">{vehicle.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {VEHICLE_TYPE_LABELS[vehicle.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={vehicle.status === VehicleStatus.ACTIF ? "default" : "secondary"}
                          >
                            {VEHICLE_STATUS_LABELS[vehicle.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {vehicle.created_by?.username || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(vehicle.created_at)}
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
                                onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {language === "fr" ? "Voir" : "View"}
                              </DropdownMenuItem>
                              {canEdit && (
                                <DropdownMenuItem
                                  onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  {language === "fr" ? "Modifier" : "Edit"}
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(vehicle)}
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
                ? `Êtes-vous sûr de vouloir supprimer le véhicule "${vehicleToDelete?.name}" (${vehicleToDelete?.registration_number}) ? Cette action est irréversible.`
                : `Are you sure you want to delete vehicle "${vehicleToDelete?.name}" (${vehicleToDelete?.registration_number})? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "fr" ? "Annuler" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteVehicle.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteVehicle.isPending
                ? (language === "fr" ? "Suppression..." : "Deleting...")
                : (language === "fr" ? "Supprimer" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

