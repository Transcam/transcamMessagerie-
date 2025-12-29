import { Repository, In } from "typeorm";
import { AppDataSource } from "../../db";
import { Departure, DepartureStatus } from "../entities/departure.entity";
import { Shipment, ShipmentStatus } from "../entities/shipment.entity";
import { User } from "../entities/user.entity";
import { AuditLog } from "../entities/audit-log.entity";
import { GeneralWaybillService } from "./general-waybill.service";
import { UserRole } from "../types/roles";

export interface CreateDepartureDTO {
  route?: string;
  vehicle?: string;
  driver_name?: string;
  notes?: string;
}

export interface UpdateDepartureDTO {
  route?: string;
  vehicle?: string;
  driver_name?: string;
  notes?: string;
}

export interface DepartureFiltersDTO {
  status?: DepartureStatus;
  route?: string;
  dateFrom?: Date;
  dateTo?: Date;
  generalWaybillNumber?: string;
  page?: number;
  limit?: number;
}

export class DepartureService {
  private departureRepo: Repository<Departure>;
  private shipmentRepo: Repository<Shipment>;
  private auditRepo: Repository<AuditLog>;
  private generalWaybillService: GeneralWaybillService;

  constructor() {
    this.departureRepo = AppDataSource.getRepository(Departure);
    this.shipmentRepo = AppDataSource.getRepository(Shipment);
    this.auditRepo = AppDataSource.getRepository(AuditLog);
    this.generalWaybillService = new GeneralWaybillService();
  }


  /**
   * Create a new departure
   */
  async create(data: CreateDepartureDTO, user: User): Promise<Departure> {
    const departure = this.departureRepo.create({
      ...data,
      status: DepartureStatus.OPEN,
      created_by: user,
      created_by_id: user.id,
    });

    const saved = await this.departureRepo.save(departure);
    await this.logAction("create", saved.id, user, null, saved);

    return saved;
  }

  /**
   * Get single departure with shipments
   */
  async getOne(id: number, user?: User): Promise<Departure> {
    const departure = await this.departureRepo.findOne({
      where: { id },
      relations: [
        "shipments",
        "created_by",
        "sealed_by",
        "closed_by",
      ],
    });

    if (!departure) {
      throw new Error("Departure not found");
    }

    // Mask shipment prices for STAFF role
    if (user?.role === UserRole.STAFF && departure.shipments) {
      departure.shipments.forEach((shipment) => {
        (shipment as any).price = null;
        (shipment as any).declared_value = null;
      });
    }

    return departure;
  }

  /**
   * List departures with filters
   */
  async list(filters: DepartureFiltersDTO, user?: User): Promise<[Departure[], number]> {
    const query = this.departureRepo
      .createQueryBuilder("departure")
      .leftJoinAndSelect("departure.created_by", "created_by")
      .leftJoinAndSelect("departure.sealed_by", "sealed_by")
      .leftJoinAndSelect("departure.closed_by", "closed_by")
      .leftJoinAndSelect("departure.shipments", "shipments");

    if (filters.status) {
      query.andWhere("departure.status = :status", { status: filters.status });
    }

    if (filters.route) {
      query.andWhere("departure.route = :route", { route: filters.route });
    }

    if (filters.dateFrom) {
      query.andWhere("departure.created_at >= :dateFrom", {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters.dateTo) {
      query.andWhere("departure.created_at <= :dateTo", {
        dateTo: filters.dateTo,
      });
    }

    if (filters.generalWaybillNumber) {
      query.andWhere("departure.general_waybill_number ILIKE :waybill", {
        waybill: `%${filters.generalWaybillNumber}%`,
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    query.skip((page - 1) * limit).take(limit);
    query.orderBy("departure.created_at", "DESC");

    return query.getManyAndCount();
  }

  /**
   * Update departure (only when OPEN)
   */
  async update(
    id: number,
    data: UpdateDepartureDTO,
    user: User
  ): Promise<Departure> {
    const departure = await this.departureRepo.findOne({
      where: { id },
    });

    if (!departure) {
      throw new Error("Departure not found");
    }

    if (departure.status !== DepartureStatus.OPEN) {
      throw new Error("Cannot update departure that is not OPEN");
    }

    const oldValues = { ...departure };
    Object.assign(departure, data);
    const saved = await this.departureRepo.save(departure);

    await this.logAction("update", saved.id, user, oldValues, saved);

    return saved;
  }

  /**
   * Assign shipments to departure
   */
  async assignShipments(
    departureId: number,
    shipmentIds: number[],
    user: User
  ): Promise<{ departure: Departure; assigned_count: number }> {
    const departure = await this.departureRepo.findOne({
      where: { id: departureId },
    });

    if (!departure) {
      throw new Error("Departure not found");
    }

    if (departure.status !== DepartureStatus.OPEN) {
      throw new Error("Can only assign shipments to OPEN departures");
    }

    // Load shipments
    const shipments = await this.shipmentRepo.find({
      where: { id: In(shipmentIds) },
    });

    if (shipments.length !== shipmentIds.length) {
      throw new Error("Some shipments not found");
    }

    // Validate shipments
    for (const shipment of shipments) {
      if (shipment.is_cancelled || shipment.status === ShipmentStatus.CANCELLED) {
        throw new Error(`Shipment ${shipment.id} is cancelled`);
      }

      if (shipment.departure_id && shipment.departure_id !== departureId) {
        throw new Error(`Shipment ${shipment.id} is already assigned to another departure`);
      }
    }

    // Assign shipments
    for (const shipment of shipments) {
      shipment.departure_id = departureId;
      shipment.status = ShipmentStatus.ASSIGNED;
      await this.shipmentRepo.save(shipment);
    }

    const updated = await this.getOne(departureId);
    await this.logAction("assign_shipments", departureId, user, null, {
      shipment_ids: shipmentIds,
    });

    return { departure: updated, assigned_count: shipments.length };
  }

  /**
   * Remove shipment from departure
   */
  async removeShipment(
    departureId: number,
    shipmentId: number,
    user: User
  ): Promise<Departure> {
    const departure = await this.departureRepo.findOne({
      where: { id: departureId },
    });

    if (!departure) {
      throw new Error("Departure not found");
    }

    if (departure.status !== DepartureStatus.OPEN) {
      throw new Error("Can only remove shipments from OPEN departures");
    }

    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    if (shipment.departure_id !== departureId) {
      throw new Error("Shipment is not assigned to this departure");
    }

    shipment.departure_id = null;
    shipment.status = ShipmentStatus.CONFIRMED; // Revert to confirmed
    await this.shipmentRepo.save(shipment);

    const updated = await this.getOne(departureId);
    await this.logAction("remove_shipment", departureId, user, null, {
      shipment_id: shipmentId,
    });

    return updated;
  }

  /**
   * Seal departure and generate General Waybill
   */
  /**
   * Seal departure - generates General Waybill and locks shipments
   * Authorization is handled at route level with authorize("validate_departure")
   */
  async seal(departureId: number, user: User): Promise<{
    departure: Departure;
    general_waybill_number: string;
    pdf_path: string;
  }> {
    const departure = await this.departureRepo.findOne({
      where: { id: departureId },
      relations: ["shipments"],
    });

    if (!departure) {
      throw new Error("Departure not found");
    }

    if (departure.status !== DepartureStatus.OPEN) {
      throw new Error("Can only seal OPEN departures");
    }

    if (!departure.shipments || departure.shipments.length === 0) {
      throw new Error("Cannot seal departure without shipments");
    }

    // Validate all shipments are not cancelled
    for (const shipment of departure.shipments) {
      if (shipment.is_cancelled || shipment.status === ShipmentStatus.CANCELLED) {
        throw new Error(`Cannot seal departure with cancelled shipment ${shipment.id}`);
      }
    }

    // Start transaction-like operations
    const oldValues = { ...departure };

    // Generate General Waybill Number
    const generalWaybillNumber = await this.generalWaybillService.generateNext();

    // Lock shipments by setting status to CONFIRMED (if not already)
    for (const shipment of departure.shipments) {
      if (shipment.status !== ShipmentStatus.CONFIRMED) {
        shipment.status = ShipmentStatus.CONFIRMED;
        await this.shipmentRepo.save(shipment);
      }
    }

    // Generate PDF
    const pdfPath = await this.generalWaybillService.generatePDF(
      departure,
      departure.shipments
    );

    // Update departure
    departure.general_waybill_number = generalWaybillNumber;
    departure.pdf_path = pdfPath;
    departure.status = DepartureStatus.SEALED;
    departure.sealed_at = new Date();
    departure.sealed_by = user;
    departure.sealed_by_id = user.id;

    const saved = await this.departureRepo.save(departure);
    await this.logAction("seal", saved.id, user, oldValues, saved);

    return {
      departure: saved,
      general_waybill_number: generalWaybillNumber,
      pdf_path: pdfPath,
    };
  }

  /**
   * Close departure
   * Authorization is handled at route level with authorize("validate_departure")
   */
  async close(departureId: number, user: User): Promise<Departure> {
    const departure = await this.departureRepo.findOne({
      where: { id: departureId },
    });

    if (!departure) {
      throw new Error("Departure not found");
    }

    if (departure.status !== DepartureStatus.SEALED) {
      throw new Error("Can only close SEALED departures");
    }

    const oldValues = { ...departure };

    departure.status = DepartureStatus.CLOSED;
    departure.closed_at = new Date();
    departure.closed_by = user;
    departure.closed_by_id = user.id;

    const saved = await this.departureRepo.save(departure);
    await this.logAction("close", saved.id, user, oldValues, saved);

    return saved;
  }

  /**
   * Get departure summary with totals
   */
  async getSummary(id: number, user?: User): Promise<{
    departure: Departure;
    shipment_count: number;
    total_price: number | null;
    total_weight: number;
    total_declared_value: number | null;
  }> {
    const departure = await this.getOne(id, user);

    const shipments = departure.shipments || [];

    const totals = shipments.reduce(
      (acc, shipment) => {
        if (user?.role !== UserRole.STAFF && shipment.price !== null && shipment.price !== undefined) {
          acc.total_price += parseFloat(shipment.price.toString());
        }
        if (user?.role !== UserRole.STAFF && shipment.declared_value !== null && shipment.declared_value !== undefined) {
          acc.total_declared_value += parseFloat(shipment.declared_value.toString());
        }
        acc.total_weight += parseFloat(shipment.weight.toString());
        return acc;
      },
      { total_price: 0, total_weight: 0, total_declared_value: 0 }
    );

    return {
      departure,
      shipment_count: shipments.length,
      total_price: user?.role === UserRole.STAFF ? null : totals.total_price,
      total_weight: totals.total_weight,
      total_declared_value: user?.role === UserRole.STAFF ? null : totals.total_declared_value,
    };
  }

  /**
   * Get PDF file path for departure (regenerates PDF if needed)
   */
  async getPDFPath(id: number): Promise<string> {
    console.log(`📥 [DEPARTURE] Demande de téléchargement PDF pour le départ #${id}`);
    
    const departure = await this.departureRepo.findOne({
      where: { id },
      relations: ["shipments"],
    });

    if (!departure) {
      throw new Error("Departure not found");
    }

    if (departure.status === DepartureStatus.OPEN) {
      throw new Error("General Waybill PDF is only available for SEALED or CLOSED departures");
    }

    // Regenerate PDF if departure is sealed/closed (ensures latest template is used)
    // This allows downloading the PDF multiple times with the latest design
    if (departure.shipments && departure.shipments.length > 0) {
      console.log(`🔄 [DEPARTURE] Régénération du PDF pour le départ #${id} (${departure.shipments.length} colis)`);
      
      const pdfPath = await this.generalWaybillService.generatePDF(
        departure,
        departure.shipments
      );
      
      // Update the PDF path in database (in case filename changed)
      departure.pdf_path = pdfPath;
      await this.departureRepo.save(departure);
      
      console.log(`✅ [DEPARTURE] PDF régénéré avec succès: ${pdfPath}`);
      return pdfPath;
    }

    if (!departure.pdf_path) {
      throw new Error("PDF not found for this departure");
    }

    return departure.pdf_path;
  }

  /**
   * Log audit action
   */
  private async logAction(
    action: string,
    entityId: number,
    user: User,
    oldValues: any,
    newValues: any,
    reason?: string
  ): Promise<void> {
    const log = this.auditRepo.create({
      entity_type: "departure",
      entity_id: entityId,
      action,
      old_values: oldValues,
      new_values: newValues,
      user,
      user_id: user.id,
      reason,
    });

    await this.auditRepo.save(log);
  }
}

