import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Save, ArrowLeft, Loader2, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateShipment, useDeleteAndCreateShipment } from "@/hooks/use-shipments";
import { SHIPMENT_TYPE_LABELS } from "@/services/shipment.service";
import { ContactAutocomplete } from "@/components/ui/contact-autocomplete";

const routes = [
  "Yaoundé → Kribi",
];

// Form validation schema
const shipmentSchema = z.object({
  sender_name: z.string().min(1, "Sender name is required"),
  sender_phone: z.string().min(1, "Sender phone is required"),
  receiver_name: z.string().min(1, "Receiver name is required"),
  receiver_phone: z.string().min(1, "Receiver phone is required"),
  description: z.string().optional(),
  weight: z.number().min(0.1, "Weight must be greater than 0").optional(),
  declared_value: z.number().min(0).optional(),
  price: z.number().min(0, "Price must be >= 0"),
  is_free: z.boolean().default(false),
  route: z.string().min(1, "Route is required"),
  nature: z.enum(["colis", "courrier"]).default("colis"),
  type: z.enum(["express", "standard"]).default("standard"),
  created_at: z.string().optional(),
  is_manual: z.boolean().optional(),
}).refine((data) => {
  // Si gratuit, price doit être 0
  if (data.is_free && data.price !== 0) {
    return false;
  }
  // Si payant, price doit être > 0
  if (!data.is_free && data.price <= 0) {
    return false;
  }
  return true;
}, {
  message: "Price must be 0 for free shipments and > 0 for paid shipments",
  path: ["price"],
}).refine((data) => {
  // Validate created_at if provided
  if (data.created_at) {
    const date = new Date(data.created_at);
    if (isNaN(date.getTime())) {
      return false;
    }
    if (date > new Date()) {
      return false;
    }
  }
  return true;
}, {
  message: "Date must be valid and not in the future",
  path: ["created_at"],
});

type ShipmentFormValues = z.infer<typeof shipmentSchema>;

export default function NewShipmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const createShipment = useCreateShipment();
  const deleteAndCreateShipment = useDeleteAndCreateShipment();

  // États pour le dialog de colis similaire
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [existingShipment, setExistingShipment] = useState<any>(null);
  const [pendingFormData, setPendingFormData] = useState<ShipmentFormValues | null>(null);
  
  // State for manual registration toggle
  const [isManualRegistration, setIsManualRegistration] = useState(false);

  // Récupérer la nature depuis le state de navigation si disponible
  const defaultNature = (location.state as { nature?: "colis" | "courrier" })?.nature || "colis";

  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      sender_name: "",
      sender_phone: "",
      receiver_name: "",
      receiver_phone: "",
      description: "",
      weight: undefined,
      declared_value: 0,
      price: 0,
      is_free: false,
      route: "Yaoundé → Kribi",
      nature: defaultNature,
      type: "standard",
      created_at: undefined,
      is_manual: false,
    },
  });

  const navigateToSuccess = (shipment: any) => {
    const fromNature = (location.state as { nature?: "colis" | "courrier" })?.nature;
    if (fromNature) {
      navigate(`/shipments/${fromNature}`);
    } else {
      navigate(`/shipments/${shipment.id}`);
    }
  };

  const onSubmit = async (data: ShipmentFormValues) => {
    try {
      setPendingFormData(data);
      const shipment = await createShipment.mutateAsync({
        ...data,
        declared_value: data.declared_value || 0,
        created_at: data.created_at || undefined,
        is_manual: data.is_manual || false,
      });
      navigateToSuccess(shipment);
    } catch (error: any) {
      // Gérer l'erreur de colis similaire
      if (error.response?.status === 409 && error.response?.data?.existingShipment) {
        setExistingShipment(error.response.data.existingShipment);
        setDuplicateDialogOpen(true);
      }
    }
  };

  const handleDeleteExisting = async () => {
    if (!existingShipment || !pendingFormData) return;
    
    try {
      const shipment = await deleteAndCreateShipment.mutateAsync({
        existingId: existingShipment.id,
        data: {
          ...pendingFormData,
          declared_value: pendingFormData.declared_value || 0,
          created_at: pendingFormData.created_at || undefined,
          is_manual: pendingFormData.is_manual || false,
        },
      });
      setDuplicateDialogOpen(false);
      setExistingShipment(null);
      setPendingFormData(null);
      navigateToSuccess(shipment);
    } catch (error) {
      // Erreur gérée par le hook
    }
  };

  const handleCancel = () => {
    setDuplicateDialogOpen(false);
    setExistingShipment(null);
    setPendingFormData(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{t("shipment.new")}</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Sender Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t("shipment.sender")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sender_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("shipment.senderName")}</FormLabel>
                      <FormControl>
                        <ContactAutocomplete
                          value={field.value}
                          onValueChange={(name) => {
                            field.onChange(name);
                          }}
                          onPhoneChange={(phone) => {
                            form.setValue("sender_phone", phone);
                          }}
                          type="sender"
                          placeholder={language === "fr" ? "Nom de l'expéditeur" : "Sender name"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sender_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("shipment.senderPhone")}</FormLabel>
                      <FormControl>
                        <Input placeholder="+237 6XX XXX XXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Receiver Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t("shipment.receiver")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="receiver_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("shipment.receiverName")}</FormLabel>
                      <FormControl>
                        <ContactAutocomplete
                          value={field.value}
                          onValueChange={(name) => {
                            field.onChange(name);
                          }}
                          onPhoneChange={(phone) => {
                            form.setValue("receiver_phone", phone);
                          }}
                          type="receiver"
                          placeholder={language === "fr" ? "Nom du destinataire" : "Receiver name"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receiver_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("shipment.receiverPhone")}</FormLabel>
                      <FormControl>
                        <Input placeholder="+237 6XX XXX XXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Parcel Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t("shipment.parcel")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <FormField
                  control={form.control}
                  name="route"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("shipment.route")}</FormLabel>
                      <FormControl>
                        <Input 
                          value={field.value || "Yaoundé → Kribi"} 
                          disabled 
                          readOnly
                          className="bg-muted cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr" ? "Nature" : "Nature"}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                language === "fr"
                                  ? "Sélectionner la nature"
                                  : "Select nature"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="colis">
                            {language === "fr" ? "Colis" : "Parcel"}
                          </SelectItem>
                          <SelectItem value="courrier">
                            {language === "fr" ? "Courrier" : "Mail"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr" ? "Type d'envoi" : "Shipment Type"}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                language === "fr"
                                  ? "Sélectionner le type"
                                  : "Select type"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">
                            {SHIPMENT_TYPE_LABELS.standard[language]}
                          </SelectItem>
                          <SelectItem value="express">
                            {SHIPMENT_TYPE_LABELS.express[language]}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("shipment.description")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            language === "fr"
                              ? "Description du colis..."
                              : "Parcel description..."
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("shipment.weight") || "Weight"} (kg)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="5.5"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                field.onChange(value === "" ? undefined : (parseFloat(value) || undefined));
                              }
                            }}
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="declared_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("shipment.declaredValue")} (FCFA)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                              }
                            }}
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("shipment.price")} (FCFA) *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="25000"
                            {...field}
                            value={field.value || ""}
                            disabled={form.watch("is_free")}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                              }
                            }}
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_free"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              // Si on coche gratuit, mettre price à 0
                              if (checked) {
                                form.setValue("price", 0);
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {language === "fr" ? "Envoi gratuit" : "Free shipment"}
                          </FormLabel>
                          <FormDescription>
                            {language === "fr" 
                              ? "Cocher si l'envoi est gratuit (prix = 0)" 
                              : "Check if the shipment is free (price = 0)"}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Manual Registration Section */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "fr" 
                    ? "Enregistrement manuel/historique" 
                    : "Manual/Historical Registration"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_manual"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            setIsManualRegistration(!!checked);
                            // Reset created_at when disabling manual mode
                            if (!checked) {
                              form.setValue("created_at", undefined);
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          {language === "fr" 
                            ? "Enregistrement manuel/historique" 
                            : "Manual/Historical Registration"}
                        </FormLabel>
                        <FormDescription>
                          {language === "fr"
                            ? "Activez pour enregistrer des envois datés d'une période où le système était hors service"
                            : "Enable to register shipments from when the system was down"}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {isManualRegistration && (
                  <FormField
                    control={form.control}
                    name="created_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "fr" ? "Date de l'envoi" : "Shipment Date"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            max={new Date().toISOString().slice(0, 16)}
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                            onChange={(e) => {
                              if (e.target.value) {
                                const date = new Date(e.target.value);
                                field.onChange(date.toISOString());
                              } else {
                                field.onChange(undefined);
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          {language === "fr"
                            ? "Sélectionnez la date et l'heure de l'envoi (du 1er janvier jusqu'à aujourd'hui)"
                            : "Select the date and time of the shipment (from January 1st until today)"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={createShipment.isPending}
              >
                {createShipment.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "fr" ? "Création..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("shipment.confirm")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Dialog pour colis similaire */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "fr" ? "Envoi similaire détecté" : "Similar shipment detected"}
            </DialogTitle>
            <DialogDescription>
              {existingShipment && (
                <>
                  {language === "fr" 
                    ? `Un colis similaire a déjà été créé le ${new Date(existingShipment.created_at).toLocaleDateString('fr-FR')} à ${new Date(existingShipment.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} avec le bordereau ${existingShipment.waybill_number}. Voulez-vous supprimer l'ancien et créer un nouveau ?`
                    : `A similar shipment was already created on ${new Date(existingShipment.created_at).toLocaleDateString()} at ${new Date(existingShipment.created_at).toLocaleTimeString({ hour: '2-digit', minute: '2-digit' })} with waybill ${existingShipment.waybill_number}. Do you want to delete the old one and create a new one?`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {existingShipment && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                {language === "fr" 
                  ? `Expéditeur: ${existingShipment.sender_name} - Destinataire: ${existingShipment.receiver_name}`
                  : `Sender: ${existingShipment.sender_name} - Receiver: ${existingShipment.receiver_name}`}
              </p>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={handleDeleteExisting}
              disabled={deleteAndCreateShipment.isPending}
              className="w-full sm:w-auto"
            >
              {deleteAndCreateShipment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "fr" ? "Suppression..." : "Deleting..."}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {language === "fr" ? "Supprimer l'ancien" : "Delete existing"}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              <X className="mr-2 h-4 w-4" />
              {language === "fr" ? "Annuler" : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
