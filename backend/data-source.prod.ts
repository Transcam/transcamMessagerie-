import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// Production data source - uses compiled JS files
// This file compiles to dist/data-source.prod.js, so __dirname is dist/
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [path.join(__dirname, "src/entities/**/*.js")],
  migrations: [path.join(__dirname, "src/migrations/**/*.js")],
  subscribers: [path.join(__dirname, "src/subscribers/**/*.js")],
  // Configuration du pool de connexions optimisée pour la production
  // Timeouts plus longs pour gérer la latence réseau vers la base de données distante
  extra: {
    max: parseInt(process.env.DB_POOL_MAX || "30"), // Plus de connexions en production
    min: parseInt(process.env.DB_POOL_MIN || "10"), // Plus de connexions maintenues
    idleTimeoutMillis: 60000, // 60 secondes avant de fermer une connexion inactive (latence réseau)
    connectionTimeoutMillis: 30000, // 30 secondes timeout pour obtenir une connexion (latence réseau)
    // Réessayer automatiquement en cas de perte de connexion
    maxUses: 7500, // Nombre max d'utilisations avant recyclage de la connexion
    // Keep-alive pour maintenir les connexions actives
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000, // Démarrer le keep-alive après 10 secondes
  },
  // Gestion des erreurs de connexion
  poolErrorHandler: (err: Error) => {
    console.error("❌ [DB] Erreur de pool de connexions:", err.message);
  },
});
