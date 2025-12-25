import "reflect-metadata";
import express, { Request, Response } from "express";
import { AppDataSource, initializeDatabase } from "../db";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from Express with TypeORM!" });
});

// Test route with database
// app.get("/", async (req: Request, res: Response) => {
//   try {
//     const userRepository = AppDataSource.getRepository(User);
//     const userCount = await userRepository.count();

//     res.json({
//       message: "Hello from Express with TypeORM!",
//       database: "Connected",
//       usersCount: userCount
//     });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT} 🚀!`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
