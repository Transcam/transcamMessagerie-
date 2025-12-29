import { UserRole } from "../types/roles";
import { Permission, ROLE_PERMISSIONS } from "../types/permissions";

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function roleHasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}

export function roleHasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  const rolePermissions = getPermissionsForRole(role);
  return permissions.some((permission) => rolePermissions.includes(permission));
}

export function roleHasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  const rolePermissions = getPermissionsForRole(role);
  return permissions.every((permission) =>
    rolePermissions.includes(permission)
  );
}
