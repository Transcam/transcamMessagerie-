import { useNavigate } from "react-router-dom";
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
import { useCreateDriver, DriverStatus, DRIVER_STATUS_LABELS } from "@/hooks/use-drivers";

// Form validation schema
const driverSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  license_number: z.string().min(1, "License number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  status: z.enum(["actif", "inactif"]),
});

type DriverFormValues = z.infer<typeof driverSchema>;

export default function NewDriverPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const createDriver = useCreateDriver();

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

  const onSubmit = async (data: DriverFormValues) => {
    try {
      const driverData = {
        ...data,
        email: data.email || undefined,
        address: data.address || undefined,
      };
      await createDriver.mutateAsync(driverData);
      navigate("/drivers");
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/drivers")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {language === "fr" ? "Nouveau chauffeur" : "New Driver"}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "fr" ? "Informations du chauffeur" : "Driver Information"}
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
                            placeholder={language === "fr" ? "Dupont" : "Dupont"}
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
                          placeholder={language === "fr" ? "+237 6XX XXX XXX" : "+237 6XX XXX XXX"}
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
                        {language === "fr" ? "Numéro de permis" : "License Number"} *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={language === "fr" ? "1234567890" : "1234567890"}
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
                          placeholder={language === "fr" ? "jean.dupont@example.com" : "jean.dupont@example.com"}
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
                          placeholder={language === "fr" ? "Adresse complète..." : "Full address..."}
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
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                language === "fr" ? "Sélectionner un statut" : "Select a status"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={DriverStatus.ACTIF}>
                            {DRIVER_STATUS_LABELS[DriverStatus.ACTIF][language]}
                          </SelectItem>
                          <SelectItem value={DriverStatus.INACTIF}>
                            {DRIVER_STATUS_LABELS[DriverStatus.INACTIF][language]}
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
                onClick={() => navigate("/drivers")}
              >
                {language === "fr" ? "Annuler" : "Cancel"}
              </Button>
              <Button type="submit" disabled={createDriver.isPending}>
                {createDriver.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "fr" ? "Création..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {language === "fr" ? "Créer le chauffeur" : "Create Driver"}
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

