import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  LockOpen,
  Download,
  Edit,
  Package,
  Loader2,
  X,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  useDeparture,
  useDepartureSummary,
  useSealDeparture,
  useCloseDeparture,
  useRemoveShipment,
  useAssignShipments,
} from "@/hooks/use-departures";
import { useShipments } from "@/hooks/use-shipments";
import { DepartureStatusBadge } from "@/components/departures/DepartureStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { departureService } from "@/services/departure.service";
import { shipmentService } from "@/services/shipment.service";

export default function DepartureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [sealDialogOpen, setSealDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [removeShipmentDialogOpen, setRemoveShipmentDialogOpen] = useState(false);
  const [shipmentToRemove, setShipmentToRemove] = useState<number | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedShipments, setSelectedShipments] = useState<number[]>([]);
  const [downloadingWaybills, setDownloadingWaybills] = useState(false);

  const departureId = id ? parseInt(id) : 0;
  const { data: departure, isLoading, error } = useDeparture(departureId);
  const { data: summary } = useDepartureSummary(departureId);
  const sealDeparture = useSealDeparture();
  const closeDeparture = useCloseDeparture();
  const removeShipment = useRemoveShipment();
  const assignShipments = useAssignShipments();

  // Fetch available shipments (both pending and confirmed, not cancelled)
  // Don't filter by status - we'll filter in the component to show all available
  const { data: availableShipmentsData } = useShipments({
    includeCancelled: false,
    limit: 1000, // Get all available shipments
  });

  // TODO: When roles are implemented, uncomment the line below
  // const isAgencyAdmin = user?.role === "agency_admin";
  // For now, allow all authenticated users (roles not yet implemented)
  const isAgencyAdmin = true;
  const canEdit = departure && departure.status === "open";
  const canSeal = isAgencyAdmin && departure && departure.status === "open";
  const canClose = isAgencyAdmin && departure && departure.status === "sealed";
  const canDownloadPDF = departure && (departure.status === "sealed" || departure.status === "closed");
  const canAssignShipments = departure && departure.status === "open";
  const canRemoveShipments = departure && departure.status === "open";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(amount);
  };

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

  const handleSeal = async () => {
    if (!departure) return;
    try {
      await sealDeparture.mutateAsync(departure.id);
      setSealDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleClose = async () => {
    if (!departure) return;
    try {
      await closeDeparture.mutateAsync(departure.id);
      setCloseDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDownloadPDF = async () => {
    if (!departure) return;
    try {
      await departureService.downloadPDF(departure.id);
      toast({
        title: language === "fr" ? "Téléchargement démarré" : "Download started",
        description: language === "fr"
          ? "Le PDF est en cours de téléchargement"
          : "PDF is downloading",
      });
    } catch (error: any) {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: error.response?.data?.error || 
          (language === "fr" ? "Impossible de télécharger le PDF" : "Failed to download PDF"),
        variant: "destructive",
      });
    }
  };

  const handleRemoveShipment = async () => {
    if (!departure || !shipmentToRemove) return;
    try {
      await removeShipment.mutateAsync({
        id: departure.id,
        shipmentId: shipmentToRemove,
      });
      setRemoveShipmentDialogOpen(false);
      setShipmentToRemove(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Filter available shipments: not cancelled, not already assigned to another departure
  const availableShipments = availableShipmentsData?.data?.filter((shipment: any) => {
    // Exclude cancelled shipments
    if (shipment.is_cancelled || shipment.status === "cancelled") return false;
    // Exclude shipments already assigned to another departure
    if (shipment.departure_id && shipment.departure_id !== departureId) return false;
    // Exclude shipments already assigned to THIS departure (they're already in the list)
    if (shipment.departure_id === departureId) return false;
    // Show all shipments regardless of route (user can choose)
    // If you want to filter by route, uncomment the line below:
    // if (departure?.route && shipment.route !== departure.route) return false;
    return true;
  }) || [];

  const handleToggleShipment = (shipmentId: number) => {
    setSelectedShipments((prev) =>
      prev.includes(shipmentId)
        ? prev.filter((id) => id !== shipmentId)
        : [...prev, shipmentId]
    );
  };

  const handleAssignShipments = () => {
    if (selectedShipments.length === 0) {
      toast({
        title: language === "fr" ? "Aucun colis sélectionné" : "No shipments selected",
        description: language === "fr"
          ? "Veuillez sélectionner au moins un colis"
          : "Please select at least one shipment",
        variant: "destructive",
      });
      return;
    }

    assignShipments.mutate(
      { id: departureId, shipmentIds: selectedShipments },
      {
        onSuccess: () => {
          setAssignDialogOpen(false);
          setSelectedShipments([]);
        },
      }
    );
  };

  const handleDownloadWaybills = async () => {
    if (!departure || !departure.shipments || departure.shipments.length === 0) {
      toast({
        title: language === "fr" ? "Aucun colis" : "No shipments",
        description: language === "fr"
          ? "Aucun colis à télécharger"
          : "No shipments to download",
        variant: "destructive",
      });
      return;
    }

    setDownloadingWaybills(true);
    try {
      // Download waybills for all shipments in the departure
      // Add a small delay between downloads to avoid browser blocking multiple downloads
      for (let i = 0; i < departure.shipments.length; i++) {
        const shipment = departure.shipments[i];
        try {
          await shipmentService.generateWaybill(shipment.id, shipment.waybill_number);
          // Add a small delay between downloads (except for the last one)
          if (i < departure.shipments.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error: any) {
          console.error(`Error downloading waybill for shipment ${shipment.id}:`, error);
          // Continue with other shipments even if one fails
        }
      }
      toast({
        title: language === "fr" ? "Téléchargement terminé" : "Download completed",
        description: language === "fr"
          ? `${departure.shipments.length} bordereau(x) téléchargé(s)`
          : `${departure.shipments.length} waybill(s) downloaded`,
      });
    } catch (error: any) {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: error.response?.data?.error || 
          (language === "fr" ? "Impossible de télécharger les bordereaux" : "Failed to download waybills"),
        variant: "destructive",
      });
    } finally {
      setDownloadingWaybills(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !departure) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {language === "fr"
                ? "Erreur lors du chargement du départ"
                : "Error loading departure"}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/departures")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === "fr" ? "Retour à la liste" : "Back to list"}
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const shipments = departure.shipments || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/departures")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {language === "fr" ? "Départ" : "Departure"} #{departure.id}
                </h1>
                <DepartureStatusBadge status={departure.status} />
              </div>
              {departure.general_waybill_number && (
                <p className="text-muted-foreground mt-1 font-mono">
                  {language === "fr" ? "Bordereau Général:" : "General Waybill:"}{" "}
                  {departure.general_waybill_number}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => navigate(`/departures/${departure.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {language === "fr" ? "Modifier" : "Edit"}
              </Button>
            )}
            {shipments.length > 0 && (
              <Button
                variant="outline"
                onClick={handleDownloadWaybills}
                disabled={downloadingWaybills}
              >
                {downloadingWaybills ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "fr" ? "Téléchargement..." : "Downloading..."}
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    {language === "fr" ? "Télécharger Bordereaux" : "Download Waybills"}
                  </>
                )}
              </Button>
            )}
            {canSeal && (
              <Button onClick={() => setSealDialogOpen(true)}>
                <Lock className="mr-2 h-4 w-4" />
                {language === "fr" ? "Sceller" : "Seal"}
              </Button>
            )}
            {canClose && (
              <Button onClick={() => setCloseDialogOpen(true)}>
                <LockOpen className="mr-2 h-4 w-4" />
                {language === "fr" ? "Fermer" : "Close"}
              </Button>
            )}
            {canDownloadPDF && (
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                {language === "fr" ? "Télécharger PDF" : "Download PDF"}
              </Button>
            )}
          </div>
        </div>

        {/* Summary Card */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Nombre de colis" : "Shipments"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.shipment_count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Montant total" : "Total Amount"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.total_price)} FCFA
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Poids total" : "Total Weight"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.total_weight.toFixed(2)} kg
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Valeur déclarée" : "Declared Value"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.total_declared_value)} FCFA
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Departure Information */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "fr" ? "Informations du départ" : "Departure Information"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Route" : "Route"}
                </label>
                <p className="text-lg">{departure.route || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Véhicule" : "Vehicle"}
                </label>
                <p className="text-lg">{departure.vehicle || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Chauffeur" : "Driver"}
                </label>
                <p className="text-lg">{departure.driver_name || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "fr" ? "Date de création" : "Created Date"}
                </label>
                <p className="text-lg">{formatDate(departure.created_at)}</p>
              </div>
              {departure.sealed_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {language === "fr" ? "Date de scellage" : "Sealed Date"}
                  </label>
                  <p className="text-lg">{formatDate(departure.sealed_at)}</p>
                </div>
              )}
              {departure.closed_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {language === "fr" ? "Date de fermeture" : "Closed Date"}
                  </label>
                  <p className="text-lg">{formatDate(departure.closed_at)}</p>
                </div>
              )}
              {departure.notes && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {language === "fr" ? "Remarques" : "Notes"}
                  </label>
                  <p className="text-lg">{departure.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shipments Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {language === "fr" ? "Colis assignés" : "Assigned Shipments"}
              </CardTitle>
              <CardDescription>
                {shipments.length}{" "}
                {language === "fr" ? "colis dans ce départ" : "shipments in this departure"}
              </CardDescription>
            </div>
            {canAssignShipments && (
              <Button
                variant="outline"
                onClick={() => setAssignDialogOpen(true)}
              >
                <Package className="mr-2 h-4 w-4" />
                {language === "fr" ? "Assigner des colis" : "Assign Shipments"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {shipments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {language === "fr"
                    ? "Aucun colis assigné à ce départ"
                    : "No shipments assigned to this departure"}
                </p>
                {canAssignShipments && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setAssignDialogOpen(true)}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    {language === "fr" ? "Assigner des colis" : "Assign Shipments"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "fr" ? "N° Bordereau" : "Waybill #"}</TableHead>
                      <TableHead>{language === "fr" ? "Expéditeur" : "Sender"}</TableHead>
                      <TableHead>{language === "fr" ? "Destinataire" : "Receiver"}</TableHead>
                      <TableHead>{language === "fr" ? "Description" : "Description"}</TableHead>
                      <TableHead className="text-right">{language === "fr" ? "Poids" : "Weight"}</TableHead>
                      <TableHead className="text-right">{language === "fr" ? "Montant" : "Amount"}</TableHead>
                      {canRemoveShipments && <TableHead className="w-12"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment: any) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-mono text-sm">
                          {shipment.waybill_number}
                        </TableCell>
                        <TableCell>{shipment.sender_name}</TableCell>
                        <TableCell>{shipment.receiver_name}</TableCell>
                        <TableCell>{shipment.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          {parseFloat(shipment.weight.toString()).toFixed(2)} kg
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(parseFloat(shipment.price.toString()))} FCFA
                        </TableCell>
                        {canRemoveShipments && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setShipmentToRemove(shipment.id);
                                setRemoveShipmentDialogOpen(true);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                ? `Êtes-vous sûr de vouloir sceller ce départ ? Cette action générera le Bordereau Général (${departure.general_waybill_number || "sera généré"}) et verrouillera tous les colis. Cette action est irréversible.`
                : `Are you sure you want to seal this departure? This will generate the General Waybill (${departure.general_waybill_number || "will be generated"}) and lock all shipments. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "fr" ? "Annuler" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSeal}
              disabled={sealDeparture.isPending}
            >
              {sealDeparture.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "fr" ? "Scellage..." : "Sealing..."}
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  {language === "fr" ? "Sceller" : "Seal"}
                </>
              )}
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
                ? `Êtes-vous sûr de vouloir fermer ce départ ? Cette action est irréversible.`
                : `Are you sure you want to close this departure? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "fr" ? "Annuler" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClose}
              disabled={closeDeparture.isPending}
            >
              {closeDeparture.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "fr" ? "Fermeture..." : "Closing..."}
                </>
              ) : (
                <>
                  <LockOpen className="mr-2 h-4 w-4" />
                  {language === "fr" ? "Fermer" : "Close"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Shipment Confirmation Dialog */}
      <AlertDialog open={removeShipmentDialogOpen} onOpenChange={setRemoveShipmentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "fr" ? "Retirer le colis" : "Remove Shipment"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "fr"
                ? `Êtes-vous sûr de vouloir retirer ce colis du départ ?`
                : `Are you sure you want to remove this shipment from the departure?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "fr" ? "Annuler" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveShipment}
              disabled={removeShipment.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeShipment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "fr" ? "Retrait..." : "Removing..."}
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  {language === "fr" ? "Retirer" : "Remove"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Shipments Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "fr" ? "Assigner des colis" : "Assign Shipments"}
            </DialogTitle>
            <DialogDescription>
              {language === "fr"
                ? `Sélectionnez les colis à assigner au départ #${departure?.id}`
                : `Select shipments to assign to departure #${departure?.id}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {availableShipments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === "fr"
                  ? "Aucun colis disponible pour assignation"
                  : "No shipments available for assignment"}
              </div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  {language === "fr"
                    ? `${selectedShipments.length} colis sélectionné(s) sur ${availableShipments.length} disponible(s)`
                    : `${selectedShipments.length} shipment(s) selected out of ${availableShipments.length} available`}
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>{language === "fr" ? "N° Bordereau" : "Waybill #"}</TableHead>
                        <TableHead>{language === "fr" ? "Expéditeur" : "Sender"}</TableHead>
                        <TableHead>{language === "fr" ? "Destinataire" : "Receiver"}</TableHead>
                        <TableHead>{language === "fr" ? "Route" : "Route"}</TableHead>
                        <TableHead className="text-right">{language === "fr" ? "Poids" : "Weight"}</TableHead>
                        <TableHead className="text-right">{language === "fr" ? "Montant" : "Amount"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableShipments.map((shipment: any) => (
                        <TableRow
                          key={shipment.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleToggleShipment(shipment.id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedShipments.includes(shipment.id)}
                              onCheckedChange={() => handleToggleShipment(shipment.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {shipment.waybill_number}
                          </TableCell>
                          <TableCell>{shipment.sender_name}</TableCell>
                          <TableCell>{shipment.receiver_name}</TableCell>
                          <TableCell>{shipment.route}</TableCell>
                          <TableCell className="text-right">
                            {parseFloat(shipment.weight.toString()).toFixed(2)} kg
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(parseFloat(shipment.price.toString()))} FCFA
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false);
                setSelectedShipments([]);
              }}
            >
              {language === "fr" ? "Annuler" : "Cancel"}
            </Button>
            <Button
              onClick={handleAssignShipments}
              disabled={assignShipments.isPending || selectedShipments.length === 0}
            >
              {assignShipments.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "fr" ? "Assignation..." : "Assigning..."}
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  {language === "fr"
                    ? `Assigner ${selectedShipments.length} colis`
                    : `Assign ${selectedShipments.length} shipment(s)`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

