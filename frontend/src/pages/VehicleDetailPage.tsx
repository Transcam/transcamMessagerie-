import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useVehicle, useDeleteVehicle, VEHICLE_TYPE_LABELS, VEHICLE_STATUS_LABELS, VehicleStatus } from "@/hooks/use-vehicles";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const vehicleId = id ? parseInt(id) : 0;
  const { data: vehicle, isLoading, error } = useVehicle(vehicleId);
  const deleteVehicle = useDeleteVehicle();

  const canEdit = hasPermission("edit_vehicle");
  const canDelete = hasPermission("delete_vehicle");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async () => {
    if (!vehicle) return;
    try {
      await deleteVehicle.mutateAsync(vehicle.id);
      setDeleteDialogOpen(false);
      navigate("/vehicles");
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !vehicle) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {language === "fr"
                ? "Erreur lors du chargement du véhicule"
                : "Error loading vehicle"}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/vehicles")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === "fr" ? "Retour à la liste" : "Back to list"}
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/vehicles")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {vehicle.name}
              </h1>
              <p className="text-muted-foreground mt-1 font-mono">
                {vehicle.registration_number}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {language === "fr" ? "Modifier" : "Edit"}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {language === "fr" ? "Supprimer" : "Delete"}
              </Button>
            )}
          </div>
        </div>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "fr" ? "Informations du véhicule" : "Vehicle Information"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Immatriculation" : "Registration Number"}
                </label>
                <p className="text-lg mt-1 font-mono font-medium">
                  {vehicle.registration_number}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Nom / Code" : "Name / Code"}
                </label>
                <p className="text-lg mt-1 font-semibold">{vehicle.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Type" : "Type"}
                </label>
                <div className="mt-1">
                  <Badge variant="secondary" className="text-sm">
                    {VEHICLE_TYPE_LABELS[vehicle.type]}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Statut" : "Status"}
                </label>
                <div className="mt-1">
                  <Badge
                    variant={vehicle.status === VehicleStatus.ACTIF ? "default" : "secondary"}
                    className="text-sm"
                  >
                    {VEHICLE_STATUS_LABELS[vehicle.status]}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Date de création" : "Created Date"}
                </label>
                <p className="text-lg mt-1">{formatDate(vehicle.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Créé par" : "Created by"}
                </label>
                <p className="text-lg mt-1">
                  {vehicle.created_by?.username || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departures History (optional - can be added later) */}
        {vehicle.departures && vehicle.departures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "fr" ? "Historique des départs" : "Departures History"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {language === "fr"
                  ? `${vehicle.departures.length} départ(s) enregistré(s)`
                  : `${vehicle.departures.length} departure(s) recorded`}
              </p>
            </CardContent>
          </Card>
        )}
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
                ? `Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible.`
                : `Are you sure you want to delete this vehicle? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "fr" ? "Annuler" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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


