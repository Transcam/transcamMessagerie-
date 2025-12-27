import { Request, Response } from "express";
import { User } from "../entities/user.entity";
import { AppDataSource } from "../../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = new User();

  const hashedPassword = await bcrypt.hash(password, 10);
  user.username = username;
  user.password = hashedPassword;
  await AppDataSource.getRepository(User).save(user);
  res.status(201).json({ user, message: "User created successfully" });
};

export const loginUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await AppDataSource.getRepository(User).findOne({
    where: { username },
  });
  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);

  const token = jwt.sign(
    { userId: user.id, role: user.role, username: user.username },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1h",
    }
  );

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  res.status(200).json({ token, user });
};
