import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Printer, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

const routes = [
  "Yaoundé → Douala",
  "Douala → Yaoundé", 
  "Douala → Bafoussam",
  "Yaoundé → Kribi",
  "Bafoussam → Douala",
];

export default function NewShipmentPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmed(true);
    toast({
      title: language === "fr" ? "Expédition confirmée" : "Shipment confirmed",
      description: language === "fr" ? "Bordereau N° TC-2024-0048 créé" : "Waybill No. TC-2024-0048 created",
    });
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

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            {/* Sender Info */}
            <Card>
              <CardHeader><CardTitle>{t("shipment.sender")}</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("shipment.senderName")}</Label>
                  <Input placeholder="Jean Mbarga" required disabled={isConfirmed} />
                </div>
                <div className="space-y-2">
                  <Label>{t("shipment.senderPhone")}</Label>
                  <Input placeholder="+237 6XX XXX XXX" required disabled={isConfirmed} />
                </div>
              </CardContent>
            </Card>

            {/* Receiver Info */}
            <Card>
              <CardHeader><CardTitle>{t("shipment.receiver")}</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("shipment.receiverName")}</Label>
                  <Input placeholder="Paul Atangana" required disabled={isConfirmed} />
                </div>
                <div className="space-y-2">
                  <Label>{t("shipment.receiverPhone")}</Label>
                  <Input placeholder="+237 6XX XXX XXX" required disabled={isConfirmed} />
                </div>
              </CardContent>
            </Card>

            {/* Parcel Info */}
            <Card>
              <CardHeader><CardTitle>{t("shipment.parcel")}</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-2">
                  <Label>{t("shipment.route")}</Label>
                  <Select disabled={isConfirmed}>
                    <SelectTrigger><SelectValue placeholder={language === "fr" ? "Sélectionner" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route} value={route}>{route}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("shipment.description")}</Label>
                  <Textarea placeholder={language === "fr" ? "Description du colis..." : "Parcel description..."} disabled={isConfirmed} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("shipment.declaredValue")} (FCFA)</Label>
                    <Input type="number" placeholder="0" disabled={isConfirmed} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("shipment.price")} (FCFA) *</Label>
                    <Input type="number" placeholder="25000" required disabled={isConfirmed} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              {!isConfirmed ? (
                <Button type="submit" size="lg">
                  <Save className="mr-2 h-4 w-4" />
                  {t("shipment.confirm")}
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate("/waybills/1")}>
                    <Printer className="mr-2 h-4 w-4" />
                    {t("waybill.individual")}
                  </Button>
                  <Button onClick={() => navigate("/shipments")}>
                    {language === "fr" ? "Nouvelle expédition" : "New Shipment"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
