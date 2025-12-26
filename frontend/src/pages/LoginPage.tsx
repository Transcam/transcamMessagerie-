import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: language === "fr" ? "Connexion réussie" : "Login successful",
          description: language === "fr" ? "Bienvenue sur Transcam" : "Welcome to Transcam",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: language === "fr" ? "Erreur de connexion" : "Login error",
          description: language === "fr" ? "Email ou mot de passe incorrect" : "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: language === "fr" ? "Une erreur est survenue" : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Language Toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 text-muted-foreground hover:text-primary-foreground"
        onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
      >
        {language === "fr" ? "English" : "Français"}
      </Button>

      <Card variant="elevated" className="w-full max-w-md relative z-10 animate-fade-in">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow">
            <Package className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">
              <span className="text-gradient">Transcam</span>
            </CardTitle>
            <CardDescription className="mt-2">{t("login.subtitle")}</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@transcam.cm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="text-right">
              <Button variant="link" type="button" className="text-sm p-0 h-auto">
                {t("login.forgotPassword")}
              </Button>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "fr" ? "Connexion..." : "Signing in..."}
                </>
              ) : (
                t("login.submit")
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground text-center mb-2">
              {language === "fr" ? "Comptes de démonstration:" : "Demo accounts:"}
            </p>
            <div className="text-xs space-y-1 text-muted-foreground">
              <p><strong>Admin:</strong> admin@transcam.cm / admin123</p>
              <p><strong>Staff:</strong> staff@transcam.cm / staff123</p>
              <p><strong>Comptable:</strong> comptable@transcam.cm / compta123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
