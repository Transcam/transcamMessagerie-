import { Repository } from "typeorm";
import { AppDataSource } from "../../db";
import { Shipment, ShipmentStatus } from "../entities/shipment.entity";
import { User } from "../entities/user.entity";
import { AuditLog } from "../entities/audit-log.entity";
import { WaybillService } from "./waybill.service";
import { IndividualWaybillService } from "./individual-waybill.service";

export interface CreateShipmentDTO {
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  description?: string;
  weight: number;
  declared_value?: number;
  price: number;
  route: string;
}

export interface UpdateShipmentDTO {
  sender_name?: string;
  sender_phone?: string;
  receiver_name?: string;
  receiver_phone?: string;
  description?: string;
  weight?: number;
  declared_value?: number;
  price?: number;
  route?: string;
}

export interface ShipmentFiltersDTO {
  status?: ShipmentStatus;
  route?: string;
  dateFrom?: Date;
  dateTo?: Date;
  waybillNumber?: string;
  includeCancelled?: boolean;
  page?: number;
  limit?: number;
}

export class ShipmentService {
  private shipmentRepo: Repository<Shipment>;
  private auditRepo: Repository<AuditLog>;
  private waybillService: WaybillService;
  private individualWaybillService: IndividualWaybillService;

  constructor() {
    this.shipmentRepo = AppDataSource.getRepository(Shipment);
    this.auditRepo = AppDataSource.getRepository(AuditLog);
    this.waybillService = new WaybillService();
    this.individualWaybillService = new IndividualWaybillService();
  }

  async create(data: CreateShipmentDTO, user: User): Promise<Shipment> {
    const waybillNumber = await this.waybillService.generateNext();

    const shipment = this.shipmentRepo.create({
      ...data,
      waybill_number: waybillNumber,
      status: ShipmentStatus.PENDING,
      is_confirmed: false,
      created_by: user,
      created_by_id: user.id,
    });

    const saved = await this.shipmentRepo.save(shipment);
    await this.logAction("create", saved.id, user, null, saved);

    return saved;
  }

  async confirm(shipmentId: number, user: User): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    if (shipment.is_confirmed) {
      throw new Error("Shipment already confirmed");
    }

    const oldValues = { ...shipment };

    shipment.is_confirmed = true;
    shipment.status = ShipmentStatus.CONFIRMED;
    shipment.confirmed_at = new Date();
    shipment.confirmed_by = user;
    shipment.confirmed_by_id = user.id;

    const saved = await this.shipmentRepo.save(shipment);
    await this.logAction("confirm", saved.id, user, oldValues, saved);

    return saved;
  }

  async update(
    shipmentId: number,
    data: UpdateShipmentDTO,
    user: User
  ): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    const isAdmin = (user as any).role === "agency_admin";

    if (shipment.is_confirmed && !isAdmin) {
      throw new Error("Cannot edit confirmed shipment. Only Admin can modify.");
    }

    const oldValues = { ...shipment };
    Object.assign(shipment, data);
    const saved = await this.shipmentRepo.save(shipment);

    await this.logAction("update", saved.id, user, oldValues, saved);

    return saved;
  }

  async cancel(
    shipmentId: number,
    reason: string,
    user: User
  ): Promise<Shipment> {
    const isAdmin = (user as any).role === "agency_admin";

    if (!isAdmin) {
      throw new Error("Only Agency Admin can cancel shipments");
    }

    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    if (shipment.is_cancelled) {
      throw new Error("Shipment already cancelled");
    }

    const oldValues = { ...shipment };

    shipment.is_cancelled = true;
    shipment.status = ShipmentStatus.CANCELLED;
    shipment.cancelled_at = new Date();
    shipment.cancelled_by = user;
    shipment.cancelled_by_id = user.id;
    shipment.cancellation_reason = reason;

    const saved = await this.shipmentRepo.save(shipment);
    await this.logAction("cancel", saved.id, user, oldValues, saved, reason);

    return saved;
  }

  async list(filters: ShipmentFiltersDTO): Promise<[Shipment[], number]> {
    const query = this.shipmentRepo
      .createQueryBuilder("shipment")
      .leftJoinAndSelect("shipment.created_by", "created_by")
      .leftJoinAndSelect("shipment.confirmed_by", "confirmed_by")
      .leftJoinAndSelect("shipment.cancelled_by", "cancelled_by");

    if (filters.status) {
      query.andWhere("shipment.status = :status", { status: filters.status });
    }

    if (filters.route) {
      query.andWhere("shipment.route = :route", { route: filters.route });
    }

    if (filters.dateFrom) {
      query.andWhere("shipment.created_at >= :dateFrom", {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters.dateTo) {
      query.andWhere("shipment.created_at <= :dateTo", {
        dateTo: filters.dateTo,
      });
    }

    if (filters.waybillNumber) {
      query.andWhere("shipment.waybill_number ILIKE :waybill", {
        waybill: `%${filters.waybillNumber}%`,
      });
    }

    if (!filters.includeCancelled) {
      query.andWhere("shipment.is_cancelled = false");
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    query.skip((page - 1) * limit).take(limit);
    query.orderBy("shipment.created_at", "DESC");

    return query.getManyAndCount();
  }

  async getOne(id: number): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id },
      relations: ["created_by", "confirmed_by", "cancelled_by"],
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    return shipment;
  }

  private async logAction(
    action: string,
    entityId: number,
    user: User,
    oldValues: any,
    newValues: any,
    reason?: string
  ): Promise<void> {
    const log = this.auditRepo.create({
      entity_type: "shipment",
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

  /**
   * Generate Individual Waybill PDF
   */
  async generateWaybillPDF(shipmentId: number): Promise<Buffer> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    return await this.individualWaybillService.generatePDF(shipment);
  }
}
