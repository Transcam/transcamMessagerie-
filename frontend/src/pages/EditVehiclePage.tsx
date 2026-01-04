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
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useVehicle, useUpdateVehicle, VehicleType, VehicleStatus, VEHICLE_TYPE_LABELS, VEHICLE_STATUS_LABELS } from "@/hooks/use-vehicles";
import { Skeleton } from "@/components/ui/skeleton";

// Form validation schema
const vehicleSchema = z.object({
  registration_number: z.string().min(1, "Registration number is required"),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["bus", "coaster", "minibus"]),
  status: z.enum(["actif", "inactif"]),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export default function EditVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const vehicleId = id ? parseInt(id) : 0;
  const { data: vehicle, isLoading, error } = useVehicle(vehicleId);
  const updateVehicle = useUpdateVehicle();

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registration_number: "",
      name: "",
      type: VehicleType.BUS,
      status: VehicleStatus.ACTIF,
    },
  });

  useEffect(() => {
    if (vehicle) {
      form.reset({
        registration_number: vehicle.registration_number,
        name: vehicle.name,
        type: vehicle.type,
        status: vehicle.status,
      });
    }
  }, [vehicle, form]);

  const onSubmit = async (data: VehicleFormValues) => {
    if (!vehicle) return;
    try {
      await updateVehicle.mutateAsync({ id: vehicle.id, data });
      navigate(`/vehicles/${vehicle.id}`);
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
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/vehicles/${vehicle.id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {language === "fr" ? "Modifier le véhicule" : "Edit Vehicle"}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "fr" ? "Informations du véhicule" : "Vehicle Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="registration_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr" ? "Immatriculation" : "Registration Number"} *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={language === "fr" ? "LT-234-AB" : "LT-234-AB"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr" ? "Nom / Code du véhicule" : "Name / Code"} *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={language === "fr" ? "Bus 003, Coaster Kribi" : "Bus 003, Coaster Kribi"}
                          {...field}
                        />
                      </FormControl>
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
                        {language === "fr" ? "Type de véhicule" : "Vehicle Type"} *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                language === "fr" ? "Sélectionner un type" : "Select a type"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={VehicleType.BUS}>
                            {VEHICLE_TYPE_LABELS[VehicleType.BUS]}
                          </SelectItem>
                          <SelectItem value={VehicleType.COASTER}>
                            {VEHICLE_TYPE_LABELS[VehicleType.COASTER]}
                          </SelectItem>
                          <SelectItem value={VehicleType.MINIBUS}>
                            {VEHICLE_TYPE_LABELS[VehicleType.MINIBUS]}
                          </SelectItem>
                        </SelectContent>
                      </Select>
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
                                language === "fr" ? "Sélectionner un statut" : "Select a status"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={VehicleStatus.ACTIF}>
                            {VEHICLE_STATUS_LABELS[VehicleStatus.ACTIF]}
                          </SelectItem>
                          <SelectItem value={VehicleStatus.INACTIF}>
                            {VEHICLE_STATUS_LABELS[VehicleStatus.INACTIF]}
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
                onClick={() => navigate(`/vehicles/${vehicle.id}`)}
              >
                {language === "fr" ? "Annuler" : "Cancel"}
              </Button>
              <Button type="submit" disabled={updateVehicle.isPending}>
                {updateVehicle.isPending ? (
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


