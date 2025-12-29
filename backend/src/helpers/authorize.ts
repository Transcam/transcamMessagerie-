import { NextFunction, Request, Response } from "express";
import { Permission } from "../types/permissions";
import { roleHasPermission, roleHasAnyPermission } from "./permissions";

export const authorize = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
        error: "You must be logged in to access this resource",
      });
    }

    const userRole = req.user.role;

    if (!roleHasPermission(userRole, requiredPermission)) {
      return res.status(403).json({
        message: "Permission denied",
        error: `Your role (${userRole}) does not have permission to perform this action. Required permission: ${requiredPermission}`,
        requiredPermission,
        userRole,
      });
    }

    next();
  };
};

export const authorizeAny = (requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
        error: "You must be logged in to access this resource",
      });
    }

    const userRole = req.user.role;

    if (!roleHasAnyPermission(userRole, requiredPermissions)) {
      return res.status(403).json({
        message: "Permission denied",
        error: `Your role (${userRole}) does not have permission to perform this action. Required permissions: ${requiredPermissions.join(
          ", "
        )}`,
        requiredPermission: requiredPermissions,
        userRole,
      });
    }

    next();
  };
};
