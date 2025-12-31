import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";
import { AppDataSource, initializeDatabase } from "../db";
import dotenv from "dotenv";
import shipmentsRoutes from "./routes/shipments.routes";
import departuresRoutes from "./routes/departures.routes";
import userRoutes from "./routes/user.routes";
import expensesRoutes from "./routes/expenses.routes";
import vehiclesRoutes from "./routes/vehicles.routes";
import driversRoutes from "./routes/drivers.routes";
import distributionsRoutes from "./routes/distributions.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware - must be before other middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Transcam API Server" });
});

// API Routes
// All routes use authenticate middleware and role-based authorization
// See individual route files for specific permission requirements
app.use("/api/shipments", shipmentsRoutes);
app.use("/api/departures", departuresRoutes);
app.use("/api/users", userRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/vehicles", vehiclesRoutes);
app.use("/api/drivers", driversRoutes);
app.use("/api/distributions", distributionsRoutes);

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
    console.log("🔄 [SERVER] Initialisation de la base de données...");
    await initializeDatabase();
    console.log("✅ [SERVER] Base de données initialisée");

    console.log(`🚀 [SERVER] Démarrage du serveur sur le port ${PORT}...`);
    const server = app.listen(PORT, () => {
      console.log(
        `✅ [SERVER] Server is running on http://localhost:${PORT} 🚀!`
      );
      console.log(`📡 [SERVER] Le serveur est prêt à recevoir des requêtes`);
    });

    // Keep server alive
    server.on("error", (error: any) => {
      console.error("❌ [SERVER] Erreur du serveur:", error);
    });

    // Prevent process from exiting
    process.on("SIGTERM", () => {
      console.log("⚠️ [SERVER] SIGTERM reçu, arrêt du serveur...");
      server.close(() => {
        console.log("✅ [SERVER] Serveur arrêté proprement");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("⚠️ [SERVER] SIGINT reçu, arrêt du serveur...");
      server.close(() => {
        console.log("✅ [SERVER] Serveur arrêté proprement");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ [SERVER] Failed to start server:", error);
    process.exit(1);
  }
};

console.log("🎬 [SERVER] Démarrage de l'application...");
startServer();
