import "reflect-metadata";
import { AppDataSource } from "../../data-source.prod";
import dotenv from "dotenv";

dotenv.config();

async function runMigrations() {
  try {
    console.log("🔄 Connecting to database...");
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    console.log("🔄 Running migrations...");
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log("✅ No pending migrations");
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach((migration) => {
        console.log(`   - ${migration.name}`);
      });
    }

    await AppDataSource.destroy();
    console.log("✅ Migration process completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error running migrations:", error);
    process.exit(1);
  }
}

runMigrations();

