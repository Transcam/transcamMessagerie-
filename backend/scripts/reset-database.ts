import "reflect-metadata";
import { AppDataSource } from "../db";
import dotenv from "dotenv";

dotenv.config();

async function resetDatabase() {
  try {
    console.log("🔄 Connecting to database...");
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    console.log("⚠️  WARNING: This will delete ALL data!");
    console.log("🔄 Dropping all tables...");
    
    // Drop all tables
    await AppDataSource.dropDatabase();
    console.log("✅ All tables dropped");

    console.log("🔄 Running migrations from scratch...");
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log("⚠️  No migrations to run");
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach((migration) => {
        console.log(`   - ${migration.name}`);
      });
    }

    console.log("✅ Database reset completed!");
    console.log("💡 You may want to run: npm run seed:admin");

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  }
}

resetDatabase();
