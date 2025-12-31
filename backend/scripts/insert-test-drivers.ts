import "reflect-metadata";
import { AppDataSource, initializeDatabase } from "../db";
import { Driver, DriverStatus } from "../src/entities/driver.entity";
import { User } from "../src/entities/user.entity";

async function generateTestDrivers() {
  try {
    console.log("🔄 Connexion à la base de données...");
    await initializeDatabase();
    console.log("✅ TypeORM Data Source has been initialized!");
    console.log("✅ Base de données connectée");

    const driverRepo = AppDataSource.getRepository(Driver);
    const userRepo = AppDataSource.getRepository(User);

    const users = await userRepo.find();
    if (users.length === 0) {
      console.error("❌ Aucun utilisateur trouvé. Veuillez créer des utilisateurs avant de générer des chauffeurs.");
      process.exit(1);
    }

    const driversToCreate = [
      { first_name: "Jean", last_name: "Dupont", phone: "+237 677 123 456", license_number: "LIC001234", email: "jean.dupont@example.com", address: "Yaoundé, Cameroun", status: DriverStatus.ACTIF },
      { first_name: "Pierre", last_name: "Mbarga", phone: "+237 677 234 567", license_number: "LIC002345", email: "pierre.mbarga@example.com", address: "Douala, Cameroun", status: DriverStatus.ACTIF },
      { first_name: "Michel", last_name: "Ngomo", phone: "+237 677 345 678", license_number: "LIC003456", email: null, address: "Bafoussam, Cameroun", status: DriverStatus.ACTIF },
      { first_name: "François", last_name: "Tchakoute", phone: "+237 677 456 789", license_number: "LIC004567", email: "francois.tchakoute@example.com", address: null, status: DriverStatus.ACTIF },
      { first_name: "André", last_name: "Nkom", phone: "+237 677 567 890", license_number: "LIC005678", email: null, address: "Kribi, Cameroun", status: DriverStatus.ACTIF },
      { first_name: "Louis", last_name: "Kengne", phone: "+237 677 678 901", license_number: "LIC006789", email: "louis.kengne@example.com", address: "Yaoundé, Cameroun", status: DriverStatus.ACTIF },
      { first_name: "Antoine", last_name: "Fotso", phone: "+237 677 789 012", license_number: "LIC007890", email: null, address: "Douala, Cameroun", status: DriverStatus.ACTIF },
      { first_name: "Bernard", last_name: "Njomou", phone: "+237 677 890 123", license_number: "LIC008901", email: "bernard.njomou@example.com", address: "Bafoussam, Cameroun", status: DriverStatus.ACTIF },
      { first_name: "Robert", last_name: "Ndoumbé", phone: "+237 677 901 234", license_number: "LIC009012", email: null, address: null, status: DriverStatus.INACTIF },
      { first_name: "Henri", last_name: "Mouelle", phone: "+237 677 012 345", license_number: "LIC010123", email: "henri.mouelle@example.com", address: "Yaoundé, Cameroun", status: DriverStatus.INACTIF },
    ];

    let createdCount = 0;
    let ignoredCount = 0;

    console.log(`📝 Création de ${driversToCreate.length} chauffeurs...`);

    for (let i = 0; i < driversToCreate.length; i++) {
      const driverData = driversToCreate[i];
      const user = users[i % users.length]; // Cycle through available users

      const existingDriver = await driverRepo.findOne({
        where: { license_number: driverData.license_number },
      });

      if (existingDriver) {
        console.log(`⚠️  Chauffeur ignoré (permis existant): ${driverData.license_number}`);
        ignoredCount++;
        continue;
      }

      const driver = driverRepo.create({
        ...driverData,
        created_by: user,
        created_by_id: user.id,
      });

      await driverRepo.save(driver);
      console.log(`✅ Chauffeur créé: ${driver.first_name} ${driver.last_name} (${driver.license_number})`);
      createdCount++;
    }

    console.log("\n📊 Résumé:");
    console.log(`   ✅ ${createdCount} chauffeur(s) créé(s)`);
    console.log(`   ⏭️  ${ignoredCount} chauffeur(s) ignoré(s)`);

    console.log("\n✨ Terminé !");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erreur lors de la génération des chauffeurs de test:", error);
    process.exit(1);
  }
}

generateTestDrivers();

