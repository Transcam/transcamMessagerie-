import { Request, Response } from "express";
import { User } from "../entities/user.entity";
import { AppDataSource } from "../../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRole } from "../types/roles";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const userRepo = AppDataSource.getRepository(User);

    const existingUser = await userRepo.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const user = new User();
    const hashedPassword = await bcrypt.hash(password, 10);
    user.username = username;
    user.password = hashedPassword;
    user.role = role || UserRole.STAFF;

    const savedUser = await userRepo.save(user);
    const { password: _, ...userWithoutPassword } = savedUser;

    res.status(201).json({
      data: userWithoutPassword,
      message: "User created successfully",
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const users = await userRepo.find({
      order: { created_at: "DESC" },
    });

    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    res.json({ data: usersWithoutPasswords });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo.findOne({ where: { id: parseInt(id) } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({ data: userWithoutPassword });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;
    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo.findOne({ where: { id: parseInt(id) } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username && username !== user.username) {
      const existingUser = await userRepo.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      user.username = username;
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    if (role) {
      user.role = role;
    }

    const updatedUser = await userRepo.save(user);
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      data: userWithoutPassword,
      message: "User updated successfully",
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo.findOne({ where: { id: parseInt(id) } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user && req.user.id === parseInt(id)) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    await userRepo.remove(user);

    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    console.log("username", username);
    console.log("password", password);

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const user = await AppDataSource.getRepository(User).findOne({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1h",
      }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ token, user: userWithoutPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
