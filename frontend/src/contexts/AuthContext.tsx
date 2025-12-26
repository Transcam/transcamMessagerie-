import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'staff' | 'operational_accountant' | 'supervisor';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    'view_dashboard',
    'create_shipment',
    'edit_shipment',
    'delete_shipment',
    'view_shipments',
    'create_departure',
    'validate_departure',
    'view_finance',
    'view_distribution',
    'edit_distribution',
    'view_reports',
    'export_data',
    'manage_users',
  ],
  staff: [
    'view_dashboard',
    'create_shipment',
    'view_shipments',
    'print_waybill',
    'print_receipt',
  ],
  operational_accountant: [
    'view_dashboard',
    'view_shipments',
    'view_finance',
    'export_data',
  ],
  supervisor: [
    'view_dashboard',
    'view_finance',
    'view_distribution',
    'view_reports',
  ],
};

// Mock users for demo
const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@transcam.cm': {
    password: 'admin123',
    user: {
      id: '1',
      name: 'Jean-Pierre Mbarga',
      email: 'admin@transcam.cm',
      role: 'admin',
    },
  },
  'staff@transcam.cm': {
    password: 'staff123',
    user: {
      id: '2',
      name: 'Marie Essono',
      email: 'staff@transcam.cm',
      role: 'staff',
    },
  },
  'comptable@transcam.cm': {
    password: 'compta123',
    user: {
      id: '3',
      name: 'Paul Nkomo',
      email: 'comptable@transcam.cm',
      role: 'operational_accountant',
    },
  },
  'superviseur@transcam.cm': {
    password: 'super123',
    user: {
      id: '4',
      name: 'Claire Atangana',
      email: 'superviseur@transcam.cm',
      role: 'supervisor',
    },
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockUser = mockUsers[email.toLowerCase()];
    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user);
      return true;
    }
    return false;
  };

  const logout = () => {
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
