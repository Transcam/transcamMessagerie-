import "reflect-metadata";
import { AppDataSource, initializeDatabase } from "../db";
import { Shipment, ShipmentStatus, ShipmentNature, ShipmentType } from "../src/entities/shipment.entity";
import { Departure, DepartureStatus } from "../src/entities/departure.entity";
import { User } from "../src/entities/user.entity";
import { Vehicle } from "../src/entities/vehicle.entity";
import { Driver } from "../src/entities/driver.entity";
import { DepartureService } from "../src/services/departure.service";
import { In } from "typeorm";

// Sample data
const senderNames = [
  "Jean Dupont", "Marie Martin", "Pierre Durand", "Sophie Bernard",
  "Luc Moreau", "Isabelle Petit", "Antoine Roux", "Camille Simon",
  "Nicolas Michel", "Julie Garcia", "Thomas Leroy", "Emma Rousseau",
  "Lucas Vincent", "Chloé Fournier", "Hugo Girard", "Léa Lefebvre",
  "Louis Bonnet", "Manon Martinez", "Alexandre Dubois", "Sarah Laurent"
];

const receiverNames = [
  "Paul Lambert", "Anna Dubois", "Marc Lefevre", "Julie Girard",
  "David Moreau", "Laura Bernard", "Julien Roux", "Emma Martin",
  "Maxime Simon", "Clara Petit", "Romain Durand", "Léa Rousseau",
  "Nicolas Vincent", "Sophie Fournier", "Antoine Garcia", "Marie Leroy",
  "Thomas Martinez", "Camille Bonnet", "Hugo Laurent", "Isabelle Michel"
];

const routes = [
  "Yaoundé → Douala",
  "Yaoundé → Bafoussam",
  "Douala → Kribi",
  "Yaoundé → Garoua"
];

const descriptions = [
  "Documents importants", "Colis fragile", "Vêtements", "Électronique",
  "Livres", "Médicaments", "Nourriture", "Outils", "Matériel informatique",
  "Accessoires", "Équipement", "Fournitures de bureau", "Articles personnels"
];

const phoneNumbers = [
  "677123456", "677234567", "677345678", "677456789", "677567890", "677012345"
];

interface ShipmentConfig {
  nature: ShipmentNature;
  type?: ShipmentType;
  weight: number; // en kg
  price: number; // en FCFA
}

// Configuration des expéditions pour tester les répartitions
// Pour chaque départ, on crée 10 expéditions avec des poids variés
const shipmentConfigs: ShipmentConfig[] = [
  // Colis ≤ 40kg (éligible chauffeur + ministère)
  { nature: ShipmentNature.COLS, weight: 15, price: 15000 },
  { nature: ShipmentNature.COLS, weight: 25, price: 20000 },
  { nature: ShipmentNature.COLS, weight: 35, price: 25000 },
  { nature: ShipmentNature.COLS, weight: 40, price: 30000 },
  
  // Colis entre 40kg et 50kg (éligible ministère seulement)
  { nature: ShipmentNature.COLS, weight: 45, price: 35000 },
  { nature: ShipmentNature.COLS, weight: 50, price: 40000 },
  
  // Courrier Standard ≤ 100g (éligible ministère)
  { nature: ShipmentNature.COURRIER, type: ShipmentType.STANDARD, weight: 0.05, price: 5000 },
  { nature: ShipmentNature.COURRIER, type: ShipmentType.STANDARD, weight: 0.1, price: 6000 },
  
  // Courrier Express entre 100g et 2kg (éligible ministère)
  { nature: ShipmentNature.COURRIER, type: ShipmentType.EXPRESS, weight: 0.5, price: 8000 },
  { nature: ShipmentNature.COURRIER, type: ShipmentType.EXPRESS, weight: 1.5, price: 12000 },
];

async function generateTestDistributions() {
  try {
    console.log("🚀 Starting test distribution data generation...");

    // Initialize database
    await initializeDatabase();
    console.log("✅ Database connected");

    // Get repositories
    const shipmentRepo = AppDataSource.getRepository(Shipment);
    const departureRepo = AppDataSource.getRepository(Departure);
    const userRepo = AppDataSource.getRepository(User);
    const vehicleRepo = AppDataSource.getRepository(Vehicle);
    const driverRepo = AppDataSource.getRepository(Driver);
    const departureService = new DepartureService();

    // Get or create test user
    let testUser = await userRepo.findOne({
      where: { username: "test_user" }
    });

    if (!testUser) {
      // Try to get any user
      const users = await userRepo.find({ take: 1 });
      if (users.length === 0) {
        throw new Error("Aucun utilisateur trouvé. Veuillez créer un utilisateur d'abord.");
      }
      testUser = users[0];
      console.log("✅ Using existing user:", testUser.username);
    } else {
      console.log("✅ Test user found");
    }

    // Get vehicles and drivers
    const vehicles = await vehicleRepo.find({ take: 4 });
    const drivers = await driverRepo.find({ take: 4 });

    if (vehicles.length < 4) {
      throw new Error("Il faut au moins 4 véhicules. Exécutez: npm run seed:vehicles");
    }

    if (drivers.length < 4) {
      throw new Error("Il faut au moins 4 chauffeurs. Exécutez: npm run seed:drivers");
    }

    console.log(`✅ Found ${vehicles.length} vehicles and ${drivers.length} drivers`);

    // Get the last waybill number
    const lastShipment = await shipmentRepo
      .createQueryBuilder("shipment")
      .orderBy("shipment.waybill_number", "DESC")
      .getOne();

    let nextNumber = 1;
    if (lastShipment) {
      const match = lastShipment.waybill_number.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0], 10) + 1;
      }
    }

    const currentYear = new Date().getFullYear();
    const prefix = `TC-${currentYear}-`;

    // Create 4 departures with 10 shipments each
    const departures = [];
    let shipmentNumber = nextNumber;

    for (let depIndex = 0; depIndex < 4; depIndex++) {
      console.log(`\n📦 Creating departure ${depIndex + 1}/4...`);

      // Create departure
      const departure = departureRepo.create({
        route: routes[depIndex],
        vehicle: vehicles[depIndex],
        vehicle_id: vehicles[depIndex].id,
        driver: drivers[depIndex],
        driver_id: drivers[depIndex].id,
        status: DepartureStatus.OPEN,
        created_by: testUser,
        created_by_id: testUser.id,
        notes: `Départ de test pour répartitions - ${routes[depIndex]}`,
      });

      const savedDeparture = await departureRepo.save(departure);
      console.log(`✅ Departure ${savedDeparture.id} created: ${routes[depIndex]}`);

      // Create 10 shipments for this departure
      const shipments = [];
      for (let shipIndex = 0; shipIndex < 10; shipIndex++) {
        const config = shipmentConfigs[shipIndex];
        const senderName = senderNames[Math.floor(Math.random() * senderNames.length)];
        const receiverName = receiverNames[Math.floor(Math.random() * receiverNames.length)];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        const senderPhone = phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)];
        const receiverPhone = phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)];

        const waybillNumber = `${prefix}${shipmentNumber.toString().padStart(4, "0")}`;
        shipmentNumber++;

        const declaredValue = parseFloat((config.price * 2 + Math.random() * 50000).toFixed(2));

        const shipment = shipmentRepo.create({
          waybill_number: waybillNumber,
          sender_name: senderName,
          sender_phone: `+237${senderPhone}`,
          receiver_name: receiverName,
          receiver_phone: `+237${receiverPhone}`,
          description: description,
          weight: config.weight,
          declared_value: declaredValue,
          price: config.price,
          route: routes[depIndex],
          nature: config.nature,
          type: config.type || ShipmentType.STANDARD,
          status: ShipmentStatus.CONFIRMED,
          is_confirmed: true,
          confirmed_at: new Date(),
          confirmed_by: testUser,
          confirmed_by_id: testUser.id,
          created_by: testUser,
          created_by_id: testUser.id,
          departure_id: savedDeparture.id,
        });

        shipments.push(shipment);
      }

      // Save shipments
      const savedShipments = await shipmentRepo.save(shipments);
      console.log(`✅ Created ${savedShipments.length} shipments for departure ${savedDeparture.id}`);

      // Reload departure with shipments
      const departureWithShipments = await departureRepo.findOne({
        where: { id: savedDeparture.id },
        relations: ["shipments", "vehicle", "driver"],
      });

      if (!departureWithShipments) {
        throw new Error(`Failed to reload departure ${savedDeparture.id}`);
      }

      // Seal departure
      console.log(`🔒 Sealing departure ${savedDeparture.id}...`);
      await departureService.seal(savedDeparture.id, testUser);
      console.log(`✅ Departure ${savedDeparture.id} sealed`);

      // Close departure
      console.log(`🔐 Closing departure ${savedDeparture.id}...`);
      await departureService.close(savedDeparture.id, testUser);
      console.log(`✅ Departure ${savedDeparture.id} closed`);

      departures.push(departureWithShipments);
    }

    console.log("\n✅ Successfully created test distribution data!");
    console.log("\n📊 Summary:");
    console.log(`   - Total departures: ${departures.length}`);
    console.log(`   - Total shipments: ${departures.length * 10}`);

    // Show breakdown by eligibility
    console.log("\n📋 Breakdown by distribution eligibility:");
    
    const departureIds = departures.map(d => d.id);
    const allShipments = await shipmentRepo.find({
      where: { departure_id: In(departureIds) },
      relations: ["departure"],
    });

    let driverEligible = 0; // Colis ≤ 40kg
    let ministryEligible = 0; // Colis ≤ 50kg OR Courrier Standard ≤ 100g OR Courrier Express 100g-2kg
    let totalRevenue = 0;

    for (const shipment of allShipments) {
      const weight = parseFloat(shipment.weight.toString());
      const price = parseFloat(shipment.price.toString());
      totalRevenue += price;

      // Driver eligible: Colis ≤ 40kg
      if (shipment.nature === ShipmentNature.COLS && weight <= 40) {
        driverEligible++;
      }

      // Ministry eligible
      const isMinistryEligible =
        (shipment.nature === ShipmentNature.COLS && weight <= 50) ||
        (shipment.nature === ShipmentNature.COURRIER &&
          shipment.type === ShipmentType.STANDARD &&
          weight <= 0.1) ||
        (shipment.nature === ShipmentNature.COURRIER &&
          shipment.type === ShipmentType.EXPRESS &&
          weight > 0.1 &&
          weight <= 2);

      if (isMinistryEligible) {
        ministryEligible++;
      }
    }

    console.log(`   - Éligibles répartition chauffeur (Colis ≤ 40kg): ${driverEligible}`);
    console.log(`   - Éligibles répartition ministère: ${ministryEligible}`);
    console.log(`   - CA total: ${totalRevenue.toFixed(2)} FCFA`);

    console.log("\n✨ Done! You can now test the distribution page.");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error generating test distribution data:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

generateTestDistributions();

