import { NextFunction, Request, Response } from "express";
import { UserRole } from "../types/roles";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.STAFF]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.SUPERADMIN]: 3,
};

export const authorize = (minRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userRole = req.user.role;

    if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minRole]) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};
