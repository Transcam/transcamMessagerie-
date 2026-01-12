import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useDriver,
  useUpdateDriver,
  DriverStatus,
  DRIVER_STATUS_LABELS,
} from "@/hooks/use-drivers";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CAMEROON_PHONE_REGEX,
  PHONE_VALIDATION_ERROR_MESSAGE,
} from "@/lib/phone-utils";

// Form validation schema
const driverSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(CAMEROON_PHONE_REGEX, PHONE_VALIDATION_ERROR_MESSAGE),
  license_number: z.string().min(1, "License number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  status: z.enum(["actif", "inactif"]),
});

type DriverFormValues = z.infer<typeof driverSchema>;

export default function EditDriverPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const driverId = id ? parseInt(id) : 0;
  const { data: driver, isLoading, error } = useDriver(driverId);
  const updateDriver = useUpdateDriver();

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      license_number: "",
      email: "",
      address: "",
      status: DriverStatus.ACTIF,
    },
  });

  useEffect(() => {
    if (driver) {
      form.reset({
        first_name: driver.first_name,
        last_name: driver.last_name,
        phone: driver.phone,
        license_number: driver.license_number,
        email: driver.email || "",
        address: driver.address || "",
        status: driver.status,
      });
    }
  }, [driver, form]);

  const onSubmit = async (data: DriverFormValues) => {
    if (!driver) return;
    try {
      const driverData = {
        ...data,
        email: data.email || undefined,
        address: data.address || undefined,
      };
      await updateDriver.mutateAsync({ id: driver.id, data: driverData });
      navigate(`/drivers/${driver.id}`);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
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
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/drivers/${driver.id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {language === "fr" ? "Modifier le chauffeur" : "Edit Driver"}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "fr"
                    ? "Informations du chauffeur"
                    : "Driver Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "fr" ? "Prénom" : "First Name"} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={language === "fr" ? "Jean" : "Jean"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "fr" ? "Nom" : "Last Name"} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              language === "fr" ? "Dupont" : "Dupont"
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr" ? "Téléphone" : "Phone"} *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            language === "fr" ? "6XX XXX XXX" : "6XX XXX XXX"
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="license_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr"
                          ? "Numéro de permis"
                          : "License Number"}{" "}
                        *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            language === "fr" ? "1234567890" : "1234567890"
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr" ? "Email" : "Email"} (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={
                            language === "fr"
                              ? "jean.dupont@example.com"
                              : "jean.dupont@example.com"
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr" ? "Adresse" : "Address"} (optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            language === "fr"
                              ? "Adresse complète..."
                              : "Full address..."
                          }
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr" ? "Statut" : "Status"} *
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
                                  ? "Sélectionner un statut"
                                  : "Select a status"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={DriverStatus.ACTIF}>
                            {DRIVER_STATUS_LABELS[DriverStatus.ACTIF][language]}
                          </SelectItem>
                          <SelectItem value={DriverStatus.INACTIF}>
                            {
                              DRIVER_STATUS_LABELS[DriverStatus.INACTIF][
                                language
                              ]
                            }
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/drivers/${driver.id}`)}
              >
                {language === "fr" ? "Annuler" : "Cancel"}
              </Button>
              <Button type="submit" disabled={updateDriver.isPending}>
                {updateDriver.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "fr" ? "Modification..." : "Updating..."}
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
