import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Download,
  Edit,
  X,
  Loader2,
} from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useShipment, useCancelShipment, useGenerateReceipt, useDownloadReceipt } from "@/hooks/use-shipments";
import { ShipmentStatusBadge } from "@/components/shipments/ShipmentStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const shipmentId = id ? parseInt(id) : 0;
  const { data: shipment, isLoading, error } = useShipment(shipmentId);
  const cancelShipment = useCancelShipment();
  const generateReceipt = useGenerateReceipt();
  const downloadReceipt = useDownloadReceipt();

  const canEdit = hasPermission("edit_shipment") && shipment && !shipment.is_cancelled;
  const canCancel = hasPermission("delete_shipment") && shipment && !shipment.is_cancelled;
  const canPrintReceipt = hasPermission("print_receipt") && shipment;

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


  const handleCancel = async () => {
    if (!shipment || !cancelReason.trim()) {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          language === "fr"
            ? "La raison d'annulation est requise"
            : "Cancellation reason is required",
        variant: "destructive",
      });
      return;
    }
    try {
      await cancelShipment.mutateAsync({
        id: shipment.id,
        reason: cancelReason,
      });
      setShowCancelDialog(false);
      setCancelReason("");
    } catch (error) {
      // Error handled in hook
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

  if (error || !shipment) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {language === "fr"
                ? "Envoi introuvable"
                : "Shipment not found"}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/shipments")}
            >
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{shipment.waybill_number}</h1>
              <p className="text-muted-foreground text-sm">
                {formatDate(shipment.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShipmentStatusBadge
              status={shipment.status}
              isCancelled={shipment.is_cancelled}
            />
            {canPrintReceipt && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadReceipt.mutate({ id: shipment.id, waybillNumber: shipment.waybill_number })}
                  disabled={downloadReceipt.isPending}
                >
                  {downloadReceipt.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === "fr" ? "Téléchargement..." : "Downloading..."}
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      {language === "fr" ? "Télécharger Reçu" : "Download Receipt"}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateReceipt.mutate({ id: shipment.id, waybillNumber: shipment.waybill_number })}
                  disabled={generateReceipt.isPending}
                >
                  {generateReceipt.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === "fr" ? "Impression..." : "Printing..."}
                    </>
                  ) : (
                    <>
                      <Printer className="mr-2 h-4 w-4" />
                      {language === "fr" ? "Imprimer Reçu" : "Print Receipt"}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => navigate(`/shipments/${shipment.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              {t("common.edit")}
            </Button>
          )}
          {canCancel && (
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <X className="mr-2 h-4 w-4" />
                  {language === "fr" ? "Annuler" : "Cancel"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {language === "fr"
                      ? "Annuler l'envoi"
                      : "Cancel Shipment"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {language === "fr"
                      ? "Veuillez fournir une raison pour l'annulation de cet envoi."
                      : "Please provide a reason for cancelling this shipment."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>
                      {language === "fr" ? "Raison" : "Reason"} *
                    </Label>
                    <Textarea
                      placeholder={
                        language === "fr"
                          ? "Raison de l'annulation..."
                          : "Cancellation reason..."
                      }
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("common.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    disabled={!cancelReason.trim() || cancelShipment.isPending}
                  >
                    {cancelShipment.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {language === "fr" ? "Annulation..." : "Cancelling..."}
                      </>
                    ) : (
                      language === "fr" ? "Confirmer l'annulation" : "Confirm Cancellation"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Shipment Details */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Sender Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("shipment.sender")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("shipment.senderName")}
                </p>
                <p className="font-medium">{shipment.sender_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("shipment.senderPhone")}
                </p>
                <p className="font-medium">{shipment.sender_phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Receiver Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("shipment.receiver")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("shipment.receiverName")}
                </p>
                <p className="font-medium">{shipment.receiver_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("shipment.receiverPhone")}
                </p>
                <p className="font-medium">{shipment.receiver_phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Parcel Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("shipment.parcel")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("shipment.route")}
                </p>
                <p className="font-medium">{shipment.route}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "fr" ? "Nature" : "Nature"}
                </p>
                <p className="font-medium">
                  {shipment.nature === "colis"
                    ? (language === "fr" ? "Colis" : "Parcel")
                    : (language === "fr" ? "Courrier" : "Mail")}
                </p>
              </div>
              {shipment.description && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("shipment.description")}
                  </p>
                  <p className="font-medium">{shipment.description}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("shipment.weight")}
                  </p>
                  <p className="font-medium">
                    {shipment.weight !== null && shipment.weight !== undefined 
                      ? `${shipment.weight} kg` 
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("shipment.declaredValue")}
                  </p>
                  <p className="font-medium">
                    {formatCurrency(shipment.declared_value)} FCFA
                  </p>
                </div>
                {user?.role !== "staff" && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("shipment.price")}
                    </p>
                    <p className="font-medium font-semibold">
                      {formatCurrency(shipment.price)} FCFA
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status & Audit Information */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "fr" ? "Informations" : "Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("shipment.status")}
                </p>
                <div className="mt-1">
                  <ShipmentStatusBadge
                    status={shipment.status}
                    isCancelled={shipment.is_cancelled}
                  />
                </div>
              </div>
              {shipment.confirmed_at && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "fr" ? "Confirmé le" : "Confirmed on"}
                  </p>
                  <p className="font-medium">
                    {formatDate(shipment.confirmed_at)}
                  </p>
                  {shipment.confirmed_by && (
                    <p className="text-xs text-muted-foreground">
                      {language === "fr" ? "Par" : "By"}: {shipment.confirmed_by.name || shipment.confirmed_by.username}
                    </p>
                  )}
                </div>
              )}
              {shipment.cancelled_at && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "fr" ? "Annulé le" : "Cancelled on"}
                  </p>
                  <p className="font-medium">
                    {formatDate(shipment.cancelled_at)}
                  </p>
                  {shipment.cancellation_reason && (
                    <p className="text-sm mt-1">
                      <span className="text-muted-foreground">
                        {language === "fr" ? "Raison" : "Reason"}:{" "}
                      </span>
                      {shipment.cancellation_reason}
                    </p>
                  )}
                </div>
              )}
              {shipment.created_by && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "fr" ? "Créé par" : "Created by"}
                  </p>
                  <p className="font-medium">
                    {shipment.created_by.name || shipment.created_by.username}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}


