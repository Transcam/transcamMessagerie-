import { Repository } from "typeorm";
import { AppDataSource } from "../../db";
import { Shipment, ShipmentNature, ShipmentType } from "../entities/shipment.entity";
import { Departure, DepartureStatus } from "../entities/departure.entity";
import { Driver } from "../entities/driver.entity";

export interface DistributionFiltersDTO {
  dateFrom?: Date;
  dateTo?: Date;
  driverId?: number;
}

export interface DriverDistributionShipment {
  shipment_id: number;
  waybill_number: string;
  weight: number;
  price: number;
  driver_amount: number; // 60% of price
  departure_id: number;
  sealed_at: Date;
}

export interface DriverDistribution {
  driver: {
    id: number;
    first_name: string;
    last_name: string;
  };
  total_amount: number;
  shipment_count: number;
  shipments: DriverDistributionShipment[];
}

export interface MinistryDistributionShipment {
  shipment_id: number;
  waybill_number: string;
  nature: ShipmentNature;
  type: ShipmentType;
  weight: number;
  price: number;
  departure_id: number;
  sealed_at: Date;
}

export interface MinistryDistribution {
  total_revenue: number; // CA total
  ministry_amount: number; // 5% du CA
  shipment_count: number;
  shipments: MinistryDistributionShipment[];
}

export interface AgencyDistribution {
  total_revenue: number;
  total_driver_distributions: number;
  total_ministry_distribution: number;
  agency_amount: number; // Solde après déductions
  shipment_count: number;
}

export interface DistributionSummary {
  total_driver_distributions: number;
  total_ministry_distribution: number;
  total_agency_amount: number;
  total_revenue_concerned: number;
  total_shipments_concerned: number;
}

export class DistributionService {
  private shipmentRepo: Repository<Shipment>;
  private departureRepo: Repository<Departure>;
  private driverRepo: Repository<Driver>;

  constructor() {
    this.shipmentRepo = AppDataSource.getRepository(Shipment);
    this.departureRepo = AppDataSource.getRepository(Departure);
    this.driverRepo = AppDataSource.getRepository(Driver);
  }

  /**
   * Calculate driver distribution for a specific driver or all drivers
   * Rules: 60% of price for colis <= 40kg
   */
  async calculateDriverDistribution(
    filters: DistributionFiltersDTO = {}
  ): Promise<DriverDistribution[]> {
    // Build query for shipments eligible for driver distribution
    const query = this.shipmentRepo
      .createQueryBuilder("shipment")
      .innerJoinAndSelect("shipment.departure", "departure")
      .innerJoinAndSelect("departure.driver", "driver")
      .where("departure.status = :status", { status: DepartureStatus.CLOSED })
      .andWhere("shipment.departure_id IS NOT NULL")
      .andWhere("shipment.is_cancelled = false")
      .andWhere("shipment.nature = :nature", { nature: ShipmentNature.COLS })
      .andWhere("shipment.weight <= :maxWeight", { maxWeight: 40 });

    // Apply date filters
    if (filters.dateFrom) {
      query.andWhere("departure.sealed_at >= :dateFrom", {
        dateFrom: filters.dateFrom,
      });
    }
    if (filters.dateTo) {
      query.andWhere("departure.sealed_at <= :dateTo", {
        dateTo: filters.dateTo,
      });
    }

    // Filter by driver if specified
    if (filters.driverId) {
      query.andWhere("driver.id = :driverId", { driverId: filters.driverId });
    }

    query.orderBy("departure.sealed_at", "DESC");

    const shipments = await query.getMany();

    // Group by driver and calculate totals
    const driverMap = new Map<number, DriverDistribution>();

    for (const shipment of shipments) {
      if (!shipment.departure || !shipment.departure.driver) continue;

      const driver = shipment.departure.driver;
      const driverId = driver.id;
      const price = parseFloat(shipment.price.toString());
      const driverAmount = price * 0.6; // 60%

      if (!driverMap.has(driverId)) {
        driverMap.set(driverId, {
          driver: {
            id: driver.id,
            first_name: driver.first_name,
            last_name: driver.last_name,
          },
          total_amount: 0,
          shipment_count: 0,
          shipments: [],
        });
      }

      const distribution = driverMap.get(driverId)!;
      distribution.total_amount += driverAmount;
      distribution.shipment_count += 1;
      distribution.shipments.push({
        shipment_id: shipment.id,
        waybill_number: shipment.waybill_number,
        weight: parseFloat(shipment.weight.toString()),
        price: price,
        driver_amount: driverAmount,
        departure_id: shipment.departure.id,
        sealed_at: shipment.departure.sealed_at!,
      });
    }

    return Array.from(driverMap.values());
  }

  /**
   * Calculate ministry distribution
   * Rules: 5% of CA for shipments matching criteria:
   * - Colis <= 50kg
   * - Courrier Standard <= 100g
   * - Courrier Express between 100g and 2kg
   */
  async calculateMinistryDistribution(
    filters: DistributionFiltersDTO = {}
  ): Promise<MinistryDistribution> {
    const query = this.shipmentRepo
      .createQueryBuilder("shipment")
      .innerJoinAndSelect("shipment.departure", "departure")
      .where("departure.status = :status", { status: DepartureStatus.CLOSED })
      .andWhere("shipment.departure_id IS NOT NULL")
      .andWhere("shipment.is_cancelled = false")
      .andWhere(
        // Critère 1: Colis <= 50kg
        "(shipment.nature = :natureColis AND shipment.weight <= :weight50) OR " +
          // Critère 2: Courrier Standard <= 100g
          "(shipment.nature = :natureCourrier AND shipment.type = :typeStandard AND shipment.weight <= :weight100g) OR " +
          // Critère 3: Courrier Express entre 100g et 2kg
          "(shipment.nature = :natureCourrier2 AND shipment.type = :typeExpress AND shipment.weight > :weight100g AND shipment.weight <= :weight2kg)",
        {
          natureColis: ShipmentNature.COLS,
          weight50: 50,
          natureCourrier: ShipmentNature.COURRIER,
          typeStandard: ShipmentType.STANDARD,
          weight100g: 0.1,
          natureCourrier2: ShipmentNature.COURRIER,
          typeExpress: ShipmentType.EXPRESS,
          weight2kg: 2,
        }
      );

    // Apply date filters
    if (filters.dateFrom) {
      query.andWhere("departure.sealed_at >= :dateFrom", {
        dateFrom: filters.dateFrom,
      });
    }
    if (filters.dateTo) {
      query.andWhere("departure.sealed_at <= :dateTo", {
        dateTo: filters.dateTo,
      });
    }

    query.orderBy("departure.sealed_at", "DESC");

    const shipments = await query.getMany();

    let totalRevenue = 0;
    const ministryShipments: MinistryDistributionShipment[] = [];

    for (const shipment of shipments) {
      if (!shipment.departure) continue;

      const price = parseFloat(shipment.price.toString());
      totalRevenue += price;

      ministryShipments.push({
        shipment_id: shipment.id,
        waybill_number: shipment.waybill_number,
        nature: shipment.nature,
        type: shipment.type,
        weight: parseFloat(shipment.weight.toString()),
        price: price,
        departure_id: shipment.departure.id,
        sealed_at: shipment.departure.sealed_at!,
      });
    }

    const ministryAmount = totalRevenue * 0.05; // 5%

    return {
      total_revenue: totalRevenue,
      ministry_amount: ministryAmount,
      shipment_count: ministryShipments.length,
      shipments: ministryShipments,
    };
  }

  /**
   * Calculate agency distribution (remaining after driver and ministry deductions)
   */
  async calculateAgencyDistribution(
    filters: DistributionFiltersDTO = {}
  ): Promise<AgencyDistribution> {
    // Get all shipments from closed departures
    const query = this.shipmentRepo
      .createQueryBuilder("shipment")
      .innerJoinAndSelect("shipment.departure", "departure")
      .where("departure.status = :status", { status: DepartureStatus.CLOSED })
      .andWhere("shipment.departure_id IS NOT NULL")
      .andWhere("shipment.is_cancelled = false");

    // Apply date filters
    if (filters.dateFrom) {
      query.andWhere("departure.sealed_at >= :dateFrom", {
        dateFrom: filters.dateFrom,
      });
    }
    if (filters.dateTo) {
      query.andWhere("departure.sealed_at <= :dateTo", {
        dateTo: filters.dateTo,
      });
    }

    const shipments = await query.getMany();

    let totalRevenue = 0;
    let totalDriverDistributions = 0;
    let totalMinistryDistribution = 0;

    for (const shipment of shipments) {
      if (!shipment.departure) continue;

      const price = parseFloat(shipment.price.toString());
      const weight = parseFloat(shipment.weight.toString());
      const nature = shipment.nature;
      const type = shipment.type;

      totalRevenue += price;

      // Calculate driver distribution (60% for colis <= 40kg)
      if (nature === ShipmentNature.COLS && weight <= 40 && shipment.departure.driver_id) {
        totalDriverDistributions += price * 0.6;
      }

      // Calculate ministry distribution (5% for eligible shipments)
      const isMinistryEligible =
        (nature === ShipmentNature.COLS && weight <= 50) ||
        (nature === ShipmentNature.COURRIER &&
          type === ShipmentType.STANDARD &&
          weight <= 0.1) ||
        (nature === ShipmentNature.COURRIER &&
          type === ShipmentType.EXPRESS &&
          weight > 0.1 &&
          weight <= 2);

      if (isMinistryEligible) {
        totalMinistryDistribution += price * 0.05;
      }
    }

    const agencyAmount = totalRevenue - totalDriverDistributions - totalMinistryDistribution;

    return {
      total_revenue: totalRevenue,
      total_driver_distributions: totalDriverDistributions,
      total_ministry_distribution: totalMinistryDistribution,
      agency_amount: agencyAmount,
      shipment_count: shipments.length,
    };
  }

  /**
   * Get distribution summary (global statistics)
   */
  async getDistributionSummary(
    filters: DistributionFiltersDTO = {}
  ): Promise<DistributionSummary> {
    // Get all driver distributions
    const driverDistributions = await this.calculateDriverDistribution(filters);
    const totalDriverDistributions = driverDistributions.reduce(
      (sum, dist) => sum + dist.total_amount,
      0
    );

    // Get ministry distribution
    const ministryDistribution = await this.calculateMinistryDistribution(filters);

    // Get agency distribution
    const agencyDistribution = await this.calculateAgencyDistribution(filters);

    return {
      total_driver_distributions: totalDriverDistributions,
      total_ministry_distribution: ministryDistribution.ministry_amount,
      total_agency_amount: agencyDistribution.agency_amount,
      total_revenue_concerned: agencyDistribution.total_revenue,
      total_shipments_concerned: agencyDistribution.shipment_count,
    };
  }
}

