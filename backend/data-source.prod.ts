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
});
