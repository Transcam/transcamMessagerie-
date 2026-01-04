import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Truck,
  PieChart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Globe,
  User,
  Users,
  Receipt,
  Car,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import logo from "../../../public/assets/images/Logo-Transcam.png";

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  href: string;
  permission?: string;
  children?: { labelKey: string; href: string; permission?: string }[];
}

const navItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    labelKey: "nav.dashboard",
    href: "/dashboard",
    permission: "view_dashboard",
  },
  {
    icon: Users,
    labelKey: "nav.users",
    href: "/users",
    permission: "manage_users",
  },
  {
    icon: Package,
    labelKey: "nav.shipments",
    href: "/shipments",
    permission: "view_shipments",
    children: [
      {
        labelKey: "nav.shipments.courrier",
        href: "/shipments/courrier",
        permission: "view_shipments",
      },
      {
        labelKey: "nav.shipments.colis",
        href: "/shipments/colis",
        permission: "view_shipments",
      },
    ],
  },
  {
    icon: Truck,
    labelKey: "nav.departures",
    href: "/departures",
    permission: "view_dashboard",
  },
  {
    icon: Car,
    labelKey: "nav.vehicles",
    href: "/vehicles",
    permission: "view_vehicles",
  },
  {
    icon: UserCircle,
    labelKey: "nav.drivers",
    href: "/drivers",
    permission: "view_drivers",
  },
  {
    icon: Receipt,
    labelKey: "nav.expenses",
    href: "/expenses",
    permission: "view_expenses",
  },
  {
    icon: PieChart,
    labelKey: "nav.distribution",
    href: "/distribution",
    permission: "view_distribution",
  },
  {
    icon: BarChart3,
    labelKey: "nav.reports",
    href: "/reports",
    permission: "view_reports",
  },
];

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { user, logout, hasPermission } = useAuth();

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href)
        ? prev.filter((item) => item !== href)
        : [...prev, href]
    );
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4 py-10">
        <Link to="/dashboard" className="flex items-center gap-3">
          {!isCollapsed && (
            <div>
              <img
                src={logo}
                alt="Transcam"
                width={75}
                height={75}
                className="object-cover rounded-lg"
              />
            </div>
          )}
          {!isCollapsed && (
            <span className="text-xl font-bold text-sidebar-primary-foreground">
              Transcam
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          className="hidden lg:flex text-sidebar-foreground hover:text-sidebar-primary-foreground hover:bg-sidebar-accent"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* User Info */}
      {user && !isCollapsed && (
        <div className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-primary-foreground truncate">
                {user.username}
              </p>
              <p className="text-xs text-sidebar-foreground/70 capitalize">
                {user.role.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              location.pathname.startsWith(item.href + "/");
            const isExpanded = expandedItems.includes(item.href);
            const Icon = item.icon;

            const filteredChildren = item.children?.filter(
              (child) => !child.permission || hasPermission(child.permission)
            );

            return (
              <li key={item.href}>
                <div
                  className={cn(
                    "flex items-center justify-between rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Link
                    to={item.href}
                    className={cn(
                      "flex flex-1 items-center gap-3 px-3 py-2.5",
                      isCollapsed && "justify-center"
                    )}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">
                        {t(item.labelKey)}
                      </span>
                    )}
                  </Link>
                  {filteredChildren &&
                    filteredChildren.length > 0 &&
                    !isCollapsed && (
                      <button
                        onClick={() => toggleExpanded(item.href)}
                        className="p-2 hover:bg-sidebar-accent/50 rounded-lg mr-1"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                    )}
                </div>
                {filteredChildren &&
                  filteredChildren.length > 0 &&
                  isExpanded &&
                  !isCollapsed && (
                    <ul className="mt-1 ml-4 space-y-1 border-l-2 border-sidebar-border pl-4">
                      {filteredChildren.map((child) => (
                        <li key={child.href}>
                          <Link
                            to={child.href}
                            className={cn(
                              "block rounded-lg px-3 py-2 text-sm transition-all duration-200",
                              location.pathname === child.href
                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                            onClick={() => setIsMobileOpen(false)}
                          >
                            {t(child.labelKey)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground hover:text-sidebar-primary-foreground hover:bg-sidebar-accent",
            isCollapsed && "justify-center"
          )}
          onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
        >
          <Globe className="h-5 w-5" />
          {!isCollapsed && (
            <span className="text-sm">
              {language === "fr" ? "English" : "Français"}
            </span>
          )}
        </Button>

        {/* Settings */}
        <Link to="/settings">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start gap-3 text-sidebar-foreground hover:text-sidebar-primary-foreground hover:bg-sidebar-accent",
              isCollapsed && "justify-center"
            )}
          >
            <Settings className="h-5 w-5" />
            {!isCollapsed && (
              <span className="text-sm">{t("nav.settings")}</span>
            )}
          </Button>
        </Link>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground hover:text-destructive hover:bg-destructive/10",
            isCollapsed && "justify-center"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="text-sm">{t("nav.logout")}</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 transform transition-transform duration-300 lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden h-screen lg:block lg:fixed lg:left-0 lg:top-0 lg:z-40 transition-all duration-300",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
