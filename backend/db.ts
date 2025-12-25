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
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("✅ TypeORM Data Source has been initialized!");
  } catch (error) {
    console.error("❌ Error during Data Source initialization:", error);
    throw error;
  }
};
