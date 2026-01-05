import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV === "development",
  entities: [path.join(__dirname, "src/entities/**/*.{ts,js}")],
  migrations: [path.join(__dirname, "src/migrations/**/*.{ts,js}")],
  subscribers: [path.join(__dirname, "src/subscribers/**/*.{ts,js}")],
  // Configuration du pool de connexions pour éviter les erreurs intermittentes
  // En production, les timeouts sont plus longs pour gérer la latence réseau
  extra: {
    max: parseInt(process.env.DB_POOL_MAX || (process.env.NODE_ENV === "production" ? "30" : "20")), // Plus de connexions en production
    min: parseInt(process.env.DB_POOL_MIN || (process.env.NODE_ENV === "production" ? "10" : "5")), // Plus de connexions maintenues en production
    idleTimeoutMillis: process.env.NODE_ENV === "production" ? 60000 : 30000, // 60s en prod, 30s en dev
    connectionTimeoutMillis: process.env.NODE_ENV === "production" ? 30000 : 10000, // 30s en prod pour latence réseau, 10s en dev
    // Réessayer automatiquement en cas de perte de connexion
    maxUses: 7500, // Nombre max d'utilisations avant recyclage de la connexion
    // Keep-alive pour maintenir les connexions actives en production
    keepAlive: process.env.NODE_ENV === "production",
    keepAliveInitialDelayMillis: process.env.NODE_ENV === "production" ? 10000 : 0,
  },
  // Gestion des erreurs de connexion
  poolErrorHandler: (err: Error) => {
    console.error("❌ [DB] Erreur de pool de connexions:", err.message);
  },
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("✅ TypeORM Data Source has been initialized!");
    
    // En production, surveiller la connexion et reconnecter automatiquement si nécessaire
    if (process.env.NODE_ENV === "production") {
      // Écouter les erreurs du pool
      if (AppDataSource.driver.pool) {
        AppDataSource.driver.pool.on("error", (err: Error) => {
          console.error("❌ [DB] Erreur de pool détectée:", err.message);
          // Le pool gère automatiquement la reconnexion, mais on log pour monitoring
        });
      }
      
      // Vérifier périodiquement que la connexion est toujours active
      // Utiliser une fonction wrapper pour éviter les problèmes avec setInterval et async
      const checkConnection = () => {
        if (!AppDataSource.isInitialized) {
          console.warn("⚠️ [DB] Connexion perdue, tentative de reconnexion...");
          AppDataSource.initialize()
            .then(() => {
              console.log("✅ [DB] Reconnexion réussie!");
            })
            .catch((error) => {
              console.error("❌ [DB] Échec de la reconnexion:", error);
            });
        }
      };
      
      // Vérifier toutes les 60 secondes en production
      setInterval(checkConnection, 60000);
    }
  } catch (error) {
    console.error("❌ Error during Data Source initialization:", error);
    throw error;
  }
};
