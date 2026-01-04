import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateUser } from "@/hooks/use-users";
import { useSettings, useUploadLogo } from "@/hooks/use-settings";
import { UserRole } from "@/types/role";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, UserPlus } from "lucide-react";

const roleLabels: Record<UserRole, { fr: string; en: string }> = {
  [UserRole.ADMIN]: { fr: "Administrateur", en: "Administrator" },
  [UserRole.STAFF]: { fr: "Personnel", en: "Staff" },
  [UserRole.OPERATIONAL_ACCOUNTANT]: {
    fr: "Comptable Opérationnel",
    en: "Operational Accountant",
  },
  [UserRole.SUPERVISOR]: { fr: "Superviseur", en: "Supervisor" },
};

export default function SettingsPage() {
  const { t, language } = useLanguage();
  const { user: currentUser } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const uploadLogo = useUploadLogo();
  const createUser = useCreateUser();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
    username: "",
    password: "",
    role: UserRole.STAFF as UserRole,
  });

  const getAvailableRoles = (): UserRole[] => {
    const allRoles = Object.values(UserRole);
    if (currentUser?.role === UserRole.SUPERVISOR) {
      return allRoles.filter((role) => role !== UserRole.ADMIN);
    }
    return allRoles;
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = () => {
    if (logoFile) {
      uploadLogo.mutate(logoFile, {
        onSuccess: () => {
          setLogoFile(null);
          setLogoPreview(null);
        },
      });
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(userFormData, {
      onSuccess: () => {
        setUserFormData({
          username: "",
          password: "",
          role: UserRole.STAFF,
        });
      },
    });
  };

  const currentLogoUrl = logoPreview || settings?.company_logo_url || "/assets/images/Logo-Transcam.png";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.settings")}</h1>
          <p className="text-muted-foreground mt-1">
            {language === "fr"
              ? "Gérer les paramètres de l'entreprise et créer des utilisateurs"
              : "Manage company settings and create users"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Section Logo */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "fr" ? "Logo de l'entreprise" : "Company Logo"}
              </CardTitle>
              <CardDescription>
                {language === "fr"
                  ? "Modifiez le logo affiché dans la sidebar et le favicon"
                  : "Change the logo displayed in the sidebar and favicon"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settingsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className="border-2 border-dashed rounded-lg p-4">
                      <img
                        src={currentLogoUrl}
                        alt="Logo preview"
                        className="max-h-32 max-w-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo-upload">
                      {language === "fr" ? "Sélectionner un nouveau logo" : "Select a new logo"}
                    </Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  </div>
                  {logoFile && (
                    <Button
                      onClick={handleLogoUpload}
                      disabled={uploadLogo.isPending}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadLogo.isPending
                        ? language === "fr" ? "Téléchargement..." : "Uploading..."
                        : language === "fr" ? "Télécharger le logo" : "Upload Logo"}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Section Création d'utilisateur */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "fr" ? "Créer un utilisateur" : "Create User"}
              </CardTitle>
              <CardDescription>
                {language === "fr"
                  ? "Ajouter un nouveau utilisateur au système"
                  : "Add a new user to the system"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">
                    {language === "fr" ? "Nom d'utilisateur" : "Username"}
                  </Label>
                  <Input
                    id="username"
                    value={userFormData.username}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, username: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {language === "fr" ? "Mot de passe" : "Password"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={userFormData.password}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, password: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">
                    {language === "fr" ? "Rôle" : "Role"}
                  </Label>
                  <Select
                    value={userFormData.role}
                    onValueChange={(value) =>
                      setUserFormData({ ...userFormData, role: value as UserRole })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles().map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role]?.[language] || role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={createUser.isPending} className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  {createUser.isPending
                    ? language === "fr" ? "Création..." : "Creating..."
                    : language === "fr" ? "Créer l'utilisateur" : "Create User"}
                  </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

