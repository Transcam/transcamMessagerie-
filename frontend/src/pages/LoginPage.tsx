import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logo from "../../public/assets/images/Logo-Transcam.png";

export default function LoginPage() {
  const [username, setUsername] = useState("");
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
      // Trim whitespace from username and password
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();

      const success = await login(trimmedUsername, trimmedPassword);
      if (success) {
        toast({
          title: language === "fr" ? "Connexion réussie" : "Login successful",
          description:
            language === "fr"
              ? "Bienvenue sur Transcam"
              : "Welcome to Transcam",
        });
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const error = err as {
        response?: {
          status?: number;
          data?: { error?: string; message?: string };
        };
        message?: string;
      };

      // Check if it's a rate limit error (429)
      if (error?.response?.status === 429) {
        const rateLimitMessage =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          (language === "fr"
            ? "Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes."
            : "Too many login attempts. Please try again in 15 minutes.");

        toast({
          title: language === "fr" ? "Trop de tentatives" : "Too many attempts",
          description: rateLimitMessage,
          variant: "destructive",
        });
      } else {
        // Regular login error
        const errorMessage =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          (language === "fr"
            ? "Nom d'utilisateur ou mot de passe incorrect"
            : "Invalid username or password");

        toast({
          title: language === "fr" ? "Erreur de connexion" : "Login error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Language Toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm text-foreground hover:text-primary hover:bg-primary/10 border border-border/50 shadow-md font-medium px-4 py-2 z-20"
        onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
      >
        {language === "fr" ? "English" : "Français"}
      </Button>

      <Card
        variant="elevated"
        className="w-full max-w-md relative z-10 animate-fade-in"
      >
        <CardHeader className="text-center space-y-4">
          <div>
            <img
              src={logo}
              alt="Transcam"
              width={200}
              height={200}
              className="mx-auto bg-rose-500"
            />
          </div>
          <CardDescription className="mt-2">
            {t("login.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">
                {language === "fr" ? "Nom d'utilisateur" : "Username"}
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-right">
              <Button
                variant="link"
                type="button"
                className="text-sm p-0 h-auto"
              >
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
              {language === "fr" ? "Note:" : "Note:"}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              {language === "fr"
                ? "Utilisez votre nom d'utilisateur et mot de passe pour vous connecter"
                : "Use your username and password to login"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
