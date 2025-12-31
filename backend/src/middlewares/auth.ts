import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types/roles";
import { User } from "../entities/user.entity";
import { AppDataSource } from "../../db";
import dotenv from "dotenv";
dotenv.config();

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number;
      role: UserRole;
    };

    // Fetch the full user entity from database since services need it
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: payload.userId } });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    // Handle JWT verification errors or database errors
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};
