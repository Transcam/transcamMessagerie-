import "reflect-metadata";
import { AppDataSource, initializeDatabase } from "../db";
import { Vehicle, VehicleType, VehicleStatus } from "../src/entities/vehicle.entity";
import { User } from "../src/entities/user.entity";

async function insertTestVehicles() {
  try {
    console.log("🔄 Connexion à la base de données...");
    await initializeDatabase();
    console.log("✅ Base de données connectée");

    const vehicleRepo = AppDataSource.getRepository(Vehicle);
    const userRepo = AppDataSource.getRepository(User);

    // Get some users to assign as creators
    const users = await userRepo.find({ take: 3 });
    if (users.length === 0) {
      throw new Error("Aucun utilisateur trouvé dans la base de données");
    }

    // Test vehicles data
    const vehiclesData = [
      {
        registration_number: "LT-001-AB",
        name: "Bus 001",
        type: VehicleType.BUS,
        status: VehicleStatus.ACTIF,
        created_by: users[0],
      },
      {
        registration_number: "LT-002-CD",
        name: "Bus 002",
        type: VehicleType.BUS,
        status: VehicleStatus.ACTIF,
        created_by: users[0],
      },
      {
        registration_number: "LT-103-EF",
        name: "Coaster Douala",
        type: VehicleType.COASTER,
        status: VehicleStatus.ACTIF,
        created_by: users[0],
      },
      {
        registration_number: "LT-104-GH",
        name: "Coaster Kribi",
        type: VehicleType.COASTER,
        status: VehicleStatus.ACTIF,
        created_by: users[1] || users[0],
      },
      {
        registration_number: "LT-205-IJ",
        name: "Minibus Express",
        type: VehicleType.MINIBUS,
        status: VehicleStatus.ACTIF,
        created_by: users[1] || users[0],
      },
      {
        registration_number: "LT-206-KL",
        name: "Minibus Rapide",
        type: VehicleType.MINIBUS,
        status: VehicleStatus.ACTIF,
        created_by: users[1] || users[0],
      },
      {
        registration_number: "LT-307-MN",
        name: "Bus 003",
        type: VehicleType.BUS,
        status: VehicleStatus.ACTIF,
        created_by: users[2] || users[0],
      },
      {
        registration_number: "LT-308-OP",
        name: "Coaster Bafoussam",
        type: VehicleType.COASTER,
        status: VehicleStatus.ACTIF,
        created_by: users[2] || users[0],
      },
      {
        registration_number: "LT-409-QR",
        name: "Bus 004",
        type: VehicleType.BUS,
        status: VehicleStatus.INACTIF,
        created_by: users[0],
      },
      {
        registration_number: "LT-410-ST",
        name: "Minibus Urbain",
        type: VehicleType.MINIBUS,
        status: VehicleStatus.INACTIF,
        created_by: users[1] || users[0],
      },
    ];

    console.log(`📝 Création de ${vehiclesData.length} véhicules...`);

    // Check if vehicles already exist
    const existingVehicles = await vehicleRepo.find();
    if (existingVehicles.length > 0) {
      console.log(`⚠️  ${existingVehicles.length} véhicule(s) existent déjà dans la base de données`);
      console.log("Voulez-vous continuer ? Les véhicules avec les mêmes immatriculations seront ignorés.");
    }

    let created = 0;
    let skipped = 0;

    for (const vehicleData of vehiclesData) {
      try {
        // Check if vehicle with this registration number already exists
        const existing = await vehicleRepo.findOne({
          where: { registration_number: vehicleData.registration_number },
        });

        if (existing) {
          console.log(`⏭️  Véhicule ${vehicleData.registration_number} existe déjà, ignoré`);
          skipped++;
          continue;
        }

        const vehicle = vehicleRepo.create({
          registration_number: vehicleData.registration_number,
          name: vehicleData.name,
          type: vehicleData.type,
          status: vehicleData.status,
          created_by: vehicleData.created_by,
          created_by_id: vehicleData.created_by.id,
        });

        await vehicleRepo.save(vehicle);
        console.log(`✅ Véhicule créé: ${vehicle.name} (${vehicle.registration_number})`);
        created++;
      } catch (error: any) {
        console.error(`❌ Erreur lors de la création du véhicule ${vehicleData.registration_number}:`, error.message);
      }
    }

    console.log("\n📊 Résumé:");
    console.log(`   ✅ ${created} véhicule(s) créé(s)`);
    console.log(`   ⏭️  ${skipped} véhicule(s) ignoré(s)`);
    console.log("\n✨ Terminé !");
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the script
insertTestVehicles();


