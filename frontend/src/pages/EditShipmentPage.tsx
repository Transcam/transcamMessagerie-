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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShipment, useUpdateShipment } from "@/hooks/use-shipments";
import { Skeleton } from "@/components/ui/skeleton";

const routes = [
  "Yaoundé → Douala",
  "Douala → Yaoundé",
  "Douala → Bafoussam",
  "Yaoundé → Kribi",
  "Bafoussam → Douala",
];

// Form validation schema
const shipmentSchema = z.object({
  sender_name: z.string().min(1, "Sender name is required"),
  sender_phone: z.string().min(1, "Sender phone is required"),
  receiver_name: z.string().min(1, "Receiver name is required"),
  receiver_phone: z.string().min(1, "Receiver phone is required"),
  description: z.string().optional(),
  weight: z.number().min(0.1, "Weight must be greater than 0"),
  declared_value: z.number().min(0).optional(),
  price: z.number().min(1, "Price must be greater than 0"),
  route: z.string().min(1, "Route is required"),
});

type ShipmentFormValues = z.infer<typeof shipmentSchema>;

export default function EditShipmentPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const shipmentId = id ? parseInt(id, 10) : 0;
  const { data: shipment, isLoading: isLoadingShipment } = useShipment(shipmentId);
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
      route: "",
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
        route: shipment.route,
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
                {language === "fr"
                  ? "Expédition non trouvée"
                  : "Shipment not found"}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (shipment.is_confirmed) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-destructive">
                {language === "fr"
                  ? "Cette expédition est confirmée et ne peut pas être modifiée"
                  : "This shipment is confirmed and cannot be edited"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate(`/shipments/${shipmentId}`)}
              >
                {language === "fr" ? "Retour" : "Back"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {language === "fr" ? "Modifier l'expédition" : "Edit Shipment"}
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
                        <Input placeholder="Jean Mbarga" {...field} />
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
                        <Input placeholder="Paul Atangana" {...field} />
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                language === "fr" ? "Sélectionner" : "Select"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {routes.map((route) => (
                            <SelectItem key={route} value={route}>
                              {route}
                            </SelectItem>
                          ))}
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
                          {t("shipment.weight") || "Weight"} (kg) *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="5.5"
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

