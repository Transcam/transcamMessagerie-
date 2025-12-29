import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, CreditCard } from "lucide-react";
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
import { useDriver, useDeleteDriver, DRIVER_STATUS_LABELS, DriverStatus } from "@/hooks/use-drivers";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const driverId = id ? parseInt(id) : 0;
  const { data: driver, isLoading, error } = useDriver(driverId);
  const deleteDriver = useDeleteDriver();

  const canEdit = hasPermission("edit_driver");
  const canDelete = hasPermission("delete_driver");

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
    if (!driver) return;
    try {
      await deleteDriver.mutateAsync(driver.id);
      setDeleteDialogOpen(false);
      navigate("/drivers");
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

  if (error || !driver) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {language === "fr"
                ? "Erreur lors du chargement du chauffeur"
                : "Error loading driver"}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/drivers")}
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
              onClick={() => navigate("/drivers")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {driver.first_name} {driver.last_name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === "fr" ? "Chauffeur" : "Driver"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => navigate(`/drivers/${driver.id}/edit`)}
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

        {/* Driver Information */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "fr" ? "Informations du chauffeur" : "Driver Information"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Prénom" : "First Name"}
                </label>
                <p className="text-lg mt-1 font-semibold">{driver.first_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Nom" : "Last Name"}
                </label>
                <p className="text-lg mt-1 font-semibold">{driver.last_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {language === "fr" ? "Téléphone" : "Phone"}
                </label>
                <p className="text-lg mt-1">{driver.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {language === "fr" ? "Numéro de permis" : "License Number"}
                </label>
                <p className="text-lg mt-1 font-mono">{driver.license_number}</p>
              </div>
              {driver.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {language === "fr" ? "Email" : "Email"}
                  </label>
                  <p className="text-lg mt-1">{driver.email}</p>
                </div>
              )}
              {driver.address && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {language === "fr" ? "Adresse" : "Address"}
                  </label>
                  <p className="text-lg mt-1">{driver.address}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Statut" : "Status"}
                </label>
                <div className="mt-1">
                  <Badge
                    variant={driver.status === DriverStatus.ACTIF ? "default" : "secondary"}
                    className="text-sm"
                  >
                    {DRIVER_STATUS_LABELS[driver.status][language]}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Date de création" : "Created Date"}
                </label>
                <p className="text-lg mt-1">{formatDate(driver.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Créé par" : "Created by"}
                </label>
                <p className="text-lg mt-1">
                  {driver.created_by?.username || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departures History (optional - can be added later) */}
        {driver.departures && driver.departures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "fr" ? "Historique des départs" : "Departures History"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {language === "fr"
                  ? `${driver.departures.length} départ(s) enregistré(s)`
                  : `${driver.departures.length} departure(s) recorded`}
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
                ? `Êtes-vous sûr de vouloir supprimer ce chauffeur ? Cette action est irréversible.`
                : `Are you sure you want to delete this driver? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "fr" ? "Annuler" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

