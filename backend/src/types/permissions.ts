import { UserRole } from "./roles";

export type Permission =
  | "view_dashboard"
  | "create_shipment"
  | "edit_shipment"
  | "delete_shipment"
  | "view_shipments"
  | "create_departure"
  | "validate_departure"
  | "view_finance"
  | "view_distribution"
  | "edit_distribution"
  | "view_reports"
  | "export_data"
  | "manage_users"
  | "print_waybill"
  | "print_receipt"
  | "create_expense"
  | "view_expenses"
  | "view_expense_amount"
  | "edit_expense"
  | "delete_expense";

// Permission mappings for each role - matches frontend
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
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
