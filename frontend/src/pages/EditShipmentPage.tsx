import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShipment, useUpdateShipment } from "@/hooks/use-shipments";
import { Skeleton } from "@/components/ui/skeleton";
import { SHIPMENT_TYPE_LABELS } from "@/services/shipment.service";
import { ContactAutocomplete } from "@/components/ui/contact-autocomplete";
import {
  CAMEROON_PHONE_REGEX,
  PHONE_VALIDATION_ERROR_MESSAGE,
} from "@/lib/phone-utils";

const routes = ["Yaoundé → Kribi"];

// Form validation schema
const shipmentSchema = z
  .object({
    sender_name: z.string().min(1, "Sender name is required"),
    sender_phone: z
      .string()
      .min(1, "Sender phone is required")
      .regex(CAMEROON_PHONE_REGEX, PHONE_VALIDATION_ERROR_MESSAGE),
    receiver_name: z.string().min(1, "Receiver name is required"),
    receiver_phone: z
      .string()
      .min(1, "Receiver phone is required")
      .regex(CAMEROON_PHONE_REGEX, PHONE_VALIDATION_ERROR_MESSAGE),
    description: z.string().optional(),
    weight: z.number().min(0.1, "Weight must be greater than 0").optional(),
    declared_value: z.number().min(0).optional(),
    price: z.number().min(0, "Price must be >= 0"),
    is_free: z.boolean().default(false),
    route: z.string().min(1, "Route is required"),
    nature: z.enum(["colis", "courrier"]).default("colis"),
    type: z.enum(["express", "standard"]).default("standard"),
  })
  .refine(
    (data) => {
      // Si gratuit, price doit être 0
      if (data.is_free && data.price !== 0) {
        return false;
      }
      // Si payant, price doit être > 0
      if (!data.is_free && data.price <= 0) {
        return false;
      }
      return true;
    },
    {
      message: "Price must be 0 for free shipments and > 0 for paid shipments",
      path: ["price"],
    }
  );

type ShipmentFormValues = z.infer<typeof shipmentSchema>;

export default function EditShipmentPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const shipmentId = id ? parseInt(id, 10) : 0;
  const { data: shipment, isLoading: isLoadingShipment } =
    useShipment(shipmentId);
  const updateShipment = useUpdateShipment();

  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      sender_name: "",
      sender_phone: "",
      receiver_name: "",
      receiver_phone: "",
      description: "",
      weight: 0,
      declared_value: 0,
      price: 0,
      is_free: false,
      route: "Yaoundé → Kribi",
      nature: "colis",
      type: "standard",
    },
  });

  // Update form when shipment data loads
  useEffect(() => {
    if (shipment) {
      form.reset({
        sender_name: shipment.sender_name,
        sender_phone: shipment.sender_phone,
        receiver_name: shipment.receiver_name,
        receiver_phone: shipment.receiver_phone,
        description: shipment.description || "",
        weight: shipment.weight,
        declared_value: shipment.declared_value || 0,
        price: shipment.price,
        is_free: shipment.is_free || false,
        route: "Yaoundé → Kribi",
        nature: shipment.nature || "colis",
        type: shipment.type || "standard",
      });
    }
  }, [shipment, form]);

  const onSubmit = async (data: ShipmentFormValues) => {
    if (!shipmentId) return;

    try {
      await updateShipment.mutateAsync({
        id: shipmentId,
        data: {
          ...data,
          declared_value: data.declared_value || 0,
        },
      });
      // Navigate to shipment detail page
      navigate(`/shipments/${shipmentId}`);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (isLoadingShipment) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!shipment) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-destructive">
                {language === "fr" ? "Envoi non trouvé" : "Shipment not found"}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Shipments are now created as confirmed, but can still be edited by users with edit_shipment permission
  // No need to block editing based on confirmation status

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {language === "fr" ? "Modifier l'envoi" : "Edit Shipment"}
          </h1>
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
                          placeholder={
                            language === "fr"
                              ? "Nom de l'expéditeur"
                              : "Sender name"
                          }
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
                        <Input placeholder="6XX XXX XXX" {...field} />
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
                          placeholder={
                            language === "fr"
                              ? "Nom du destinataire"
                              : "Receiver name"
                          }
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
                        <Input placeholder="6XX XXX XXX" {...field} />
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
                                field.onChange(
                                  value === ""
                                    ? undefined
                                    : parseFloat(value) || undefined
                                );
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
                                field.onChange(
                                  value === "" ? 0 : parseFloat(value) || 0
                                );
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
                        <FormLabel>{t("shipment.price")} (FCFA) *</FormLabel>
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
                                field.onChange(
                                  value === "" ? 0 : parseFloat(value) || 0
                                );
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
                            {language === "fr"
                              ? "Envoi gratuit"
                              : "Free shipment"}
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

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate(-1)}
              >
                {language === "fr" ? "Annuler" : "Cancel"}
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={updateShipment.isPending}
              >
                {updateShipment.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "fr" ? "Mise à jour..." : "Updating..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {language === "fr" ? "Enregistrer" : "Save"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
