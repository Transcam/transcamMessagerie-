import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useDeparture, useUpdateDeparture } from "@/hooks/use-departures";
import { useAvailableVehicles } from "@/hooks/use-vehicles";
import { useAvailableDrivers } from "@/hooks/use-drivers";
import { Skeleton } from "@/components/ui/skeleton";

const routes = [
  "Yaoundé → Douala",
  "Douala → Yaoundé",
  "Douala → Bafoussam",
  "Yaoundé → Kribi",
  "Bafoussam → Douala",
];

// Form validation schema
const departureSchema = z.object({
  route: z.string().min(1, "Route is required"),
  vehicle_id: z.number().min(1, "Vehicle is required"),
  driver_id: z.number().min(1, "Driver is required"),
  notes: z.string().optional(),
});

type DepartureFormValues = z.infer<typeof departureSchema>;

export default function EditDeparturePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const departureId = id ? parseInt(id) : 0;
  const { data: departure, isLoading, error } = useDeparture(departureId);
  const updateDeparture = useUpdateDeparture();
  const { data: availableVehicles, isLoading: vehiclesLoading } = useAvailableVehicles();
  const { data: availableDrivers, isLoading: driversLoading } = useAvailableDrivers();

  const form = useForm<DepartureFormValues>({
    resolver: zodResolver(departureSchema),
    defaultValues: {
      route: "",
      vehicle_id: undefined,
      driver_id: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (departure) {
      form.reset({
        route: departure.route || "",
        vehicle_id: departure.vehicle_id || undefined,
        driver_id: departure.driver_id || undefined,
        notes: departure.notes || "",
      });
    }
  }, [departure, form]);

  const onSubmit = async (data: DepartureFormValues) => {
    if (!departure) return;
    try {
      await updateDeparture.mutateAsync({ id: departure.id, data });
      navigate(`/departures/${departure.id}`);
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
              onClick={() => navigate("/departures")}
              className="mt-4"
            >
              {language === "fr" ? "Retour" : "Back"}
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
          <Button variant="ghost" size="icon" onClick={() => navigate(`/departures/${departure.id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {language === "fr" ? "Modifier le départ" : "Edit Departure"}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "fr" ? "Informations du départ" : "Departure Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="route"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr" ? "Route" : "Route"} *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                language === "fr" ? "Sélectionner une route" : "Select a route"
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
                  name="vehicle_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr" ? "Véhicule" : "Vehicle"} *
                      </FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                        disabled={vehiclesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                vehiclesLoading
                                  ? (language === "fr" ? "Chargement..." : "Loading...")
                                  : (language === "fr" ? "Sélectionner un véhicule" : "Select a vehicle")
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableVehicles && availableVehicles.length > 0 ? (
                            availableVehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                {vehicle.name} ({vehicle.registration_number})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              {language === "fr" ? "Aucun véhicule disponible" : "No vehicles available"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driver_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr" ? "Chauffeur" : "Driver"} *
                      </FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                        disabled={driversLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                driversLoading
                                  ? (language === "fr" ? "Chargement..." : "Loading...")
                                  : (language === "fr" ? "Sélectionner un chauffeur" : "Select a driver")
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableDrivers && availableDrivers.length > 0 ? (
                            availableDrivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id.toString()}>
                                {driver.first_name} {driver.last_name} ({driver.phone})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              {language === "fr" ? "Aucun chauffeur disponible" : "No drivers available"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "fr" ? "Remarques" : "Notes"} (optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={language === "fr" ? "Notes supplémentaires..." : "Additional notes..."}
                          rows={4}
                          {...field}
                        />
                      </FormControl>
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
                onClick={() => navigate(`/departures/${departure.id}`)}
              >
                {language === "fr" ? "Annuler" : "Cancel"}
              </Button>
              <Button type="submit" disabled={updateDeparture.isPending}>
                {updateDeparture.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "fr" ? "Mise à jour..." : "Updating..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {language === "fr" ? "Mettre à jour" : "Update Departure"}
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
