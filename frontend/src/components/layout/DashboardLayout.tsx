import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto lg:ml-72 transition-all duration-300">
        <div className="container mx-auto p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
