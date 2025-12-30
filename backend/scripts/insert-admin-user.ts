import "reflect-metadata";
import { AppDataSource, initializeDatabase } from "../db";
import { User } from "../src/entities/user.entity";
import { UserRole } from "../src/types/roles";
import bcrypt from "bcrypt";

async function createAdminUser() {
  try {
    console.log("🔄 Connecting to database...");
    await initializeDatabase();
    console.log("✅ Database connected");

    const userRepo = AppDataSource.getRepository(User);

    // Default admin credentials (change these!)
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    // Check if admin user already exists
    const existingAdmin = await userRepo.findOne({
      where: { username: adminUsername },
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin user "${adminUsername}" already exists!`);
      console.log("   To change the password, update it through the API or delete the user first.");
      process.exit(0);
    }

    // Hash the password
    console.log(`🔐 Creating admin user "${adminUsername}"...`);
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const adminUser = userRepo.create({
      username: adminUsername,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    await userRepo.save(adminUser);

    console.log("\n✅ Admin user created successfully!");
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log("\n⚠️  IMPORTANT: Change the default password after first login!");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();

