import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { UserRole } from "@/types/role";
import { authService } from "@/services/auth.service";

interface User {
  id: number;
  username: string;
  role: UserRole;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

// Permission mappings for each role - must match backend src/types/permissions.ts
const rolePermissions: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    "view_dashboard",
    "create_shipment",
    "edit_shipment",
    "delete_shipment",
    "view_shipments",
    "create_departure",
    "validate_departure",
    "view_finance",
    "view_distribution",
    "edit_distribution",
    "view_reports",
    "export_data",
    "manage_users",
    "print_waybill",
    "print_receipt",
    "create_expense",
    "view_expenses",
    "view_expense_amount",
    "edit_expense",
    "delete_expense",
  ],
  [UserRole.STAFF]: [
    "view_dashboard",
    "create_shipment",
    "view_shipments",
    "print_waybill",
    "print_receipt",
    "create_expense",
    "view_expenses",
    "create_departure",
    "validate_departure",
  ],
  [UserRole.OPERATIONAL_ACCOUNTANT]: [
    "view_dashboard",
    "view_shipments",
    "view_finance",
    "export_data",
    "create_expense",
    "view_expenses",
    "view_expense_amount",
    "edit_expense",
  ],
  [UserRole.SUPERVISOR]: [
    "view_dashboard",
    "create_shipment",
    "edit_shipment",
    "delete_shipment",
    "view_shipments",
    "create_departure",
    "validate_departure",
    "view_finance",
    "view_distribution",
    "edit_distribution",
    "view_reports",
    "export_data",
    "manage_users",
    "print_waybill",
    "print_receipt",
    "create_expense",
    "view_expenses",
    "view_expense_amount",
    "edit_expense",
    "delete_expense",
  ],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await authService.login({ username, password });
      const { token, user: userData } = response;

      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return rolePermissions[user.role].includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
