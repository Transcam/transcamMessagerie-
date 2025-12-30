import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateShipment } from "@/hooks/use-shipments";
import { SHIPMENT_TYPE_LABELS } from "@/services/shipment.service";

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
  nature: z.enum(["colis", "courrier"]).default("colis"),
  type: z.enum(["express", "standard"]).default("standard"),
});

type ShipmentFormValues = z.infer<typeof shipmentSchema>;

export default function NewShipmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const createShipment = useCreateShipment();

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
      weight: 0,
      declared_value: 0,
      price: 0,
      route: "",
      nature: defaultNature,
      type: "standard",
    },
  });

  const onSubmit = async (data: ShipmentFormValues) => {
    try {
      const shipment = await createShipment.mutateAsync({
        ...data,
        declared_value: data.declared_value || 0,
      });
      // Navigate back to the filtered list page if we came from one
      const fromNature = (location.state as { nature?: "colis" | "courrier" })?.nature;
      if (fromNature) {
        navigate(`/shipments/${fromNature}`);
      } else {
        navigate(`/shipments/${shipment.id}`);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
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
                        defaultValue={field.value}
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
                        {language === "fr" ? "Type d'expédition" : "Shipment Type"}
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
    </DashboardLayout>
  );
}
