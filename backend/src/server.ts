import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";
import { AppDataSource, initializeDatabase } from "../db";
import dotenv from "dotenv";
import shipmentsRoutes from "./routes/shipments.routes";
import departuresRoutes from "./routes/departures.routes";
import { User } from "./entities/user.entity";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware - must be before other middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8080",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Transcam API Server" });
});

// TEMPORARY: Mock auth middleware for testing
// TODO: Replace with your colleague's real auth middleware
// This middleware ensures a test user exists in the database
app.use("/api/shipments", async (req: Request, res: Response, next: any) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    
    // Try to find existing test user by email or username
    let testUser = await userRepo.findOne({ 
      where: [
        { email: "test@transcam.cm" },
        { username: "test_user" }
      ]
    });
    
    if (!testUser) {
      // Create test user if it doesn't exist
      testUser = userRepo.create({
        username: "test_user",
        email: "test@transcam.cm",
        password: "test_password_hash", // This is just for testing
      });
      testUser = await userRepo.save(testUser);
    }
    
    // Add role property (will be added by colleague later)
    (req as any).user = {
      ...testUser,
      role: "staff", // Change to "agency_admin" to test admin features
    };
    
    next();
  } catch (error: any) {
    console.error("Mock auth middleware error:", error);
    res.status(500).json({ error: "Failed to initialize test user" });
  }
});

app.use("/api/shipments", shipmentsRoutes);

// TEMPORARY: Mock auth middleware for departures
// TODO: Replace with your colleague's real auth middleware
app.use("/api/departures", async (req: Request, res: Response, next: any) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    
    // Try to find existing test user by email or username
    let testUser = await userRepo.findOne({ 
      where: [
        { email: "test@transcam.cm" },
        { username: "test_user" }
      ]
    });
    
    if (!testUser) {
      // Create test user if it doesn't exist
      testUser = userRepo.create({
        username: "test_user",
        email: "test@transcam.cm",
        password: "test_password_hash", // This is just for testing
      });
      testUser = await userRepo.save(testUser);
    }
    
    // Add role property (will be added by colleague later)
    (req as any).user = {
      ...testUser,
      role: "agency_admin", // Change to "agency_admin" to test admin features (seal/close)
    };
    
    next();
  } catch (error: any) {
    console.error("Mock auth middleware error:", error);
    res.status(500).json({ error: "Failed to initialize test user" });
  }
});

app.use("/api/departures", departuresRoutes);

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
      console.log(`✅ [SERVER] Server is running on http://localhost:${PORT} 🚀!`);
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
