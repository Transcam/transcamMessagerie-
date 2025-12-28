import "reflect-metadata";
import { AppDataSource, initializeDatabase } from "../db";
import { Shipment, ShipmentStatus } from "../src/entities/shipment.entity";
import { User } from "../src/entities/user.entity";
import { Departure } from "../src/entities/departure.entity";
import { WaybillService } from "../src/services/waybill.service";

// Sample data for generating varied shipments
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

const route = "Yaoundé - Kribi";

const descriptions = [
  "Documents importants", "Colis fragile", "Vêtements", "Électronique",
  "Livres", "Médicaments", "Nourriture", "Outils", "Matériel informatique",
  "Accessoires", "Équipement", "Fournitures de bureau", "Articles personnels"
];

const phoneNumbers = [
  "677123456", "677234567", "677345678", "677456789", "677567890",
  "677678901", "677789012", "677890123", "677901234", "677012345"
];

async function generateTestShipments() {
  try {
    console.log("🚀 Starting test shipment generation...");

    // Initialize database
    await initializeDatabase();
    console.log("✅ Database connected");

    // Get repositories
    const shipmentRepo = AppDataSource.getRepository(Shipment);
    const userRepo = AppDataSource.getRepository(User);
    const departureRepo = AppDataSource.getRepository(Departure);
    const waybillService = new WaybillService();

    // Get or create test user
    let testUser = await userRepo.findOne({
      where: [
        { email: "test@transcam.cm" },
        { username: "test_user" }
      ]
    });

    if (!testUser) {
      testUser = userRepo.create({
        username: "test_user",
        email: "test@transcam.cm",
        password: "test_password_hash",
      });
      testUser = await userRepo.save(testUser);
      console.log("✅ Test user created");
    } else {
      console.log("✅ Test user found");
    }

    // Get existing departure (optional - can assign shipments to it)
    const departure = await departureRepo.findOne({
      where: { id: 1 }
    });

    if (departure) {
      console.log(`✅ Found departure ID ${departure.id} (Status: ${departure.status})`);
    } else {
      console.log("ℹ️  No departure found - shipments will be created without departure assignment");
    }

    // Generate 40 shipments
    const shipments = [];
    const count = 40;

    console.log(`\n📦 Generating ${count} test shipments...`);

    // Get the last waybill number to start from the next one
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

    for (let i = 0; i < count; i++) {
      // Random data selection
      const senderName = senderNames[Math.floor(Math.random() * senderNames.length)];
      const receiverName = receiverNames[Math.floor(Math.random() * receiverNames.length)];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      const senderPhone = phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)];
      const receiverPhone = phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)];

      // Generate varied weights (0.5 to 50 kg)
      const weight = parseFloat((Math.random() * 49.5 + 0.5).toFixed(2));

      // Generate varied prices (1000 to 50000 FCFA)
      const price = parseFloat((Math.random() * 49000 + 1000).toFixed(2));

      // Generate declared value (0 to 200000 FCFA)
      const declaredValue = parseFloat((Math.random() * 200000).toFixed(2));

      // Generate sequential waybill number
      const waybillNumber = `${prefix}${(nextNumber + i).toString().padStart(4, "0")}`;

      // Create shipment
      const isConfirmed = departure !== null && departure.status === "open";
      const shipment = shipmentRepo.create({
        waybill_number: waybillNumber,
        sender_name: senderName,
        sender_phone: `+237${senderPhone}`,
        receiver_name: receiverName,
        receiver_phone: `+237${receiverPhone}`,
        description: description,
        weight: weight,
        declared_value: declaredValue,
        price: price,
        route: route,
        status: isConfirmed ? ShipmentStatus.CONFIRMED : ShipmentStatus.PENDING,
        is_confirmed: isConfirmed,
        created_by: testUser,
        created_by_id: testUser.id,
        departure_id: isConfirmed && departure ? departure.id : null,
      });

      shipments.push(shipment);
    }

    // Save all shipments
    console.log("💾 Saving shipments to database...");
    const savedShipments = await shipmentRepo.save(shipments);

    console.log(`\n✅ Successfully created ${savedShipments.length} shipments!`);
    console.log("\n📊 Summary:");
    console.log(`   - Total shipments: ${savedShipments.length}`);
    
    if (departure && departure.status === "open") {
      const assignedCount = savedShipments.filter((s: Shipment) => s.departure_id === departure.id).length;
      console.log(`   - Assigned to departure ${departure.id}: ${assignedCount}`);
    } else {
      console.log(`   - Assigned to departure: 0 (departure not found or not OPEN)`);
    }

    // Show sample of created shipments
    console.log("\n📋 Sample shipments (first 5):");
    savedShipments.slice(0, 5).forEach((shipment: Shipment, index: number) => {
      console.log(`   ${index + 1}. ${shipment.waybill_number} - ${shipment.sender_name} → ${shipment.receiver_name}`);
      console.log(`      Route: ${shipment.route}, Weight: ${shipment.weight}kg, Price: ${shipment.price} FCFA`);
    });

    console.log("\n✨ Done!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error generating test shipments:", error);
    process.exit(1);
  }
}

// Run the script
generateTestShipments();

