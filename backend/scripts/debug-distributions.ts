import "reflect-metadata";
import { AppDataSource, initializeDatabase } from "../db";
import { Departure, DepartureStatus } from "../src/entities/departure.entity";
import { Shipment, ShipmentNature, ShipmentType } from "../src/entities/shipment.entity";

async function debugDistributions() {
  try {
    await initializeDatabase();
    console.log("✅ Database connected\n");

    const departureRepo = AppDataSource.getRepository(Departure);
    const shipmentRepo = AppDataSource.getRepository(Shipment);

    // 1. Vérifier les départs CLOSED
    const closedDepartures = await departureRepo.find({
      where: { status: DepartureStatus.CLOSED },
      relations: ["driver", "shipments"],
      order: { sealed_at: "DESC" },
    });

    console.log(`📊 Départs CLOSED trouvés: ${closedDepartures.length}\n`);

    if (closedDepartures.length === 0) {
      console.log("❌ Aucun départ CLOSED trouvé !");
      return;
    }

    // 2. Vérifier la date sealed_at pour chaque départ
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    console.log(`📅 Date d'aujourd'hui (début): ${todayStart.toISOString()}`);
    console.log(`📅 Date d'aujourd'hui (fin): ${todayEnd.toISOString()}\n`);

    let departuresToday = 0;
    for (const dep of closedDepartures) {
      console.log(`\n📦 Départ ID ${dep.id}:`);
      console.log(`   - Status: ${dep.status}`);
      console.log(`   - sealed_at: ${dep.sealed_at?.toISOString() || "NULL"}`);
      console.log(`   - closed_at: ${dep.closed_at?.toISOString() || "NULL"}`);
      console.log(`   - Driver ID: ${dep.driver_id || "NULL"}`);
      console.log(`   - Shipments count: ${dep.shipments?.length || 0}`);

      if (dep.sealed_at) {
        const sealedDate = new Date(dep.sealed_at);
        if (sealedDate >= todayStart && sealedDate <= todayEnd) {
          departuresToday++;
          console.log(`   ✅ Date sealed_at correspond à aujourd'hui`);
        } else {
          console.log(`   ⚠️  Date sealed_at ne correspond PAS à aujourd'hui`);
          console.log(`      Différence: ${Math.round((sealedDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60))} heures`);
        }
      } else {
        console.log(`   ❌ sealed_at est NULL !`);
      }
    }

    console.log(`\n📊 Départs CLOSED avec sealed_at = aujourd'hui: ${departuresToday}\n`);

    // 3. Tester la requête exacte utilisée par le service
    console.log("\n🔍 Test de la requête de distribution (comme dans le service):\n");

    const dateFrom = new Date(todayStart);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(todayEnd);
    dateTo.setHours(23, 59, 59, 999);

    console.log(`DateFrom: ${dateFrom.toISOString()}`);
    console.log(`DateTo: ${dateTo.toISOString()}\n`);

    const query = shipmentRepo
      .createQueryBuilder("shipment")
      .innerJoinAndSelect("shipment.departure", "departure")
      .innerJoinAndSelect("departure.driver", "driver")
      .where("departure.status = :status", { status: DepartureStatus.CLOSED })
      .andWhere("shipment.departure_id IS NOT NULL")
      .andWhere("shipment.is_cancelled = false")
      .andWhere("shipment.nature = :nature", { nature: ShipmentNature.COLS })
      .andWhere("shipment.weight <= :maxWeight", { maxWeight: 40 })
      .andWhere("departure.sealed_at >= :dateFrom", { dateFrom })
      .andWhere("departure.sealed_at <= :dateTo", { dateTo });

    const sql = query.getSql();
    const params = query.getParameters();
    
    console.log("SQL généré:");
    console.log(sql);
    console.log("\nParamètres:");
    console.log(JSON.stringify(params, null, 2));
    console.log("\n");

    const shipments = await query.getMany();
    console.log(`✅ Envois trouvés: ${shipments.length}\n`);

    if (shipments.length === 0) {
      console.log("❌ Aucun envoi trouvé avec cette requête !\n");
      
      // Vérifier sans les filtres de date
      console.log("🔍 Test sans les filtres de date:\n");
      const queryNoDate = shipmentRepo
        .createQueryBuilder("shipment")
        .innerJoinAndSelect("shipment.departure", "departure")
        .innerJoinAndSelect("departure.driver", "driver")
        .where("departure.status = :status", { status: DepartureStatus.CLOSED })
        .andWhere("shipment.departure_id IS NOT NULL")
        .andWhere("shipment.is_cancelled = false")
        .andWhere("shipment.nature = :nature", { nature: ShipmentNature.COLS })
        .andWhere("shipment.weight <= :maxWeight", { maxWeight: 40 });

      const shipmentsNoDate = await queryNoDate.getMany();
      console.log(`Envois trouvés SANS filtre de date: ${shipmentsNoDate.length}\n`);
      
      if (shipmentsNoDate.length > 0) {
        console.log("⚠️  Le problème est dans le filtre de date !");
        console.log("\nDétails des envois trouvés (sans filtre de date):");
        for (const ship of shipmentsNoDate.slice(0, 5)) {
          console.log(`  - Shipment ${ship.id}: sealed_at = ${ship.departure?.sealed_at?.toISOString() || "NULL"}`);
        }
      }
    } else {
      console.log("✅ Envois trouvés avec les filtres de date !\n");
      for (const ship of shipments.slice(0, 5)) {
        console.log(`  - Shipment ${ship.id}: weight=${ship.weight}, price=${ship.price}, sealed_at=${ship.departure?.sealed_at?.toISOString() || "NULL"}`);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

debugDistributions();

