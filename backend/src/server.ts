import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";
import { AppDataSource, initializeDatabase } from "../db";
import dotenv from "dotenv";
import shipmentsRoutes from "./routes/shipments.routes";
import departuresRoutes from "./routes/departures.routes";
import userRoutes from "./routes/user.routes";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import settingsRoutes from "./routes/settings.routes";
import vehiclesRoutes from "./routes/vehicles.routes";
import driversRoutes from "./routes/drivers.routes";
import expensesRoutes from "./routes/expenses.routes";
import distributionRoutes from "./routes/distributions.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  helmet({
    // Allow CORS to work with Helmet
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5173",
      "http://10.5.0.2:5173",
    ],
    credentials: true,
  })
);

// Check if we're in development/test mode
const isDevelopment =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

// General rate limiter - tracks by user ID for authenticated requests, IP for unauthenticated
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || "1000"),
  message: {
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Track by user ID if authenticated, otherwise by IP
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated (from auth middleware)
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    // Fall back to IP for unauthenticated requests
    return req.ip || req.socket.remoteAddress || "unknown";
  },
  // Optionally disable in development if needed
  skip: () => process.env.DISABLE_RATE_LIMIT === "true",
});

// Login rate limiter - keeps IP-based since user isn't authenticated yet
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(
    process.env.LOGIN_RATE_LIMIT_MAX || (isDevelopment ? "20" : "5")
  ),
  message: {
    error: "Too many login attempts, please try again after 15 minutes.",
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  // Keep IP-based for login (user not authenticated yet)
  // No keyGenerator needed - defaults to IP
});

app.use("/api/", generalLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware - logs all HTTP requests with user info
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Log request
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);

  // Log user if authenticated
  if (req.user) {
    console.log(
      `  └─ User: ${req.user.username} (ID: ${req.user.id}, Role: ${req.user.role})`
    );
  }

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusColor =
      res.statusCode >= 400 ? "❌" : res.statusCode >= 300 ? "⚠️" : "✅";
    console.log(
      `[${timestamp}] ${statusColor} ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
});

// Route de health check pour Render
app.get("/health", async (req: Request, res: Response) => {
  try {
    // Vérifier que la base de données est connectée
    if (AppDataSource.isInitialized) {
      // Test simple de connexion (requête rapide)
      await AppDataSource.query("SELECT 1");
      res.status(200).json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: "unhealthy",
        database: "disconnected",
      });
    }
  } catch (error: any) {
    console.error("❌ [HEALTH] Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      database: "error",
      error: error.message,
    });
  }
});

// Route racine améliorée
app.get("/", async (req: Request, res: Response) => {
  try {
    const dbStatus = AppDataSource.isInitialized ? "connected" : "disconnected";
    res.json({
      message: "Transcam API Server",
      status: "running",
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Transcam API Server",
      status: "error",
      error: error.message,
    });
  }
});

app.use("/api/users/login", loginLimiter);

// API Routes
app.use("/api/shipments", shipmentsRoutes);
app.use("/api/departures", departuresRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/vehicles", vehiclesRoutes);
app.use("/api/drivers", driversRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/distributions", distributionRoutes);

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
