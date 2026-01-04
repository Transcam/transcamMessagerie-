import { Repository } from "typeorm";
import { AppDataSource } from "../../db";
import {
  Shipment,
  ShipmentStatus,
  ShipmentNature,
} from "../entities/shipment.entity";
import { User } from "../entities/user.entity";
import { AuditLog } from "../entities/audit-log.entity";
import { WaybillService } from "./waybill.service";
import { IndividualWaybillService } from "./individual-waybill.service";
import { ReceiptService } from "./receipt.service";
import { UserRole } from "../types/roles";

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
  nature?: ShipmentNature;
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
  nature?: ShipmentNature;
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
  private receiptService: ReceiptService;

  constructor() {
    this.shipmentRepo = AppDataSource.getRepository(Shipment);
    this.auditRepo = AppDataSource.getRepository(AuditLog);
    this.waybillService = new WaybillService();
    this.individualWaybillService = new IndividualWaybillService();
    this.receiptService = new ReceiptService();
  }

  async create(data: CreateShipmentDTO, user: User): Promise<Shipment> {
    const waybillNumber = await this.waybillService.generateNext();

    const shipment = this.shipmentRepo.create({
      ...data,
      waybill_number: waybillNumber,
      nature: data.nature || ShipmentNature.COLS,
      status: ShipmentStatus.CONFIRMED,
      is_confirmed: true,
      confirmed_at: new Date(),
      confirmed_by: user,
      confirmed_by_id: user.id,
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

    // Authorization is handled at route level with authorize("edit_shipment")
    // Since shipments are now created directly as CONFIRMED, users with edit_shipment permission can modify them
    // No additional restriction needed here - the route-level authorization is sufficient

    const oldValues = { ...shipment };
    Object.assign(shipment, data);
    const saved = await this.shipmentRepo.save(shipment);

    await this.logAction("update", saved.id, user, oldValues, saved);

    return saved;
  }

  /**
   * Cancel shipment
   * Authorization is handled at route level with authorize("delete_shipment")
   */
  async cancel(
    shipmentId: number,
    reason: string,
    user: User
  ): Promise<Shipment> {
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
      relations: ["created_by"],
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    return await this.individualWaybillService.generatePDF(shipment);
  }

  /**
   * Generate Receipt PDF
   */
  async generateReceiptPDF(shipmentId: number): Promise<Buffer> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId },
      relations: ["created_by"],
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    return await this.receiptService.generatePDF(shipment);
  }

  /**
   * Get shipment statistics
   */
  async getStatistics(filters: {
    nature?: ShipmentNature;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    total: number;
    totalPrice: number;
    totalWeight: number;
    byStatus: { [key: string]: number };
    byNature?: { colis: number; courrier: number };
    todayCount: number;
    monthCount: number;
    monthRevenue: number;
  }> {
    const query = this.shipmentRepo.createQueryBuilder("shipment");

    // Exclude cancelled shipments by default
    query.andWhere("shipment.is_cancelled = false");

    // Apply filters
    if (filters.nature) {
      query.andWhere("shipment.nature = :nature", { nature: filters.nature });
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

    const shipments = await query.getMany();

    // Calculate totals
    const total = shipments.length;
    const totalPrice = shipments.reduce(
      (sum, s) => sum + parseFloat(s.price.toString()),
      0
    );
    const totalWeight = shipments.reduce(
      (sum, s) => sum + parseFloat(s.weight.toString()),
      0
    );

    // Group by status
    const byStatus: { [key: string]: number } = {};
    shipments.forEach((s) => {
      const status = s.status;
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    // Group by nature
    const byNature: { colis: number; courrier: number } = {
      colis: 0,
      courrier: 0,
    };
    shipments.forEach((s) => {
      if (s.nature === ShipmentNature.COLS) {
        byNature.colis += 1;
      } else if (s.nature === ShipmentNature.COURRIER) {
        byNature.courrier += 1;
      }
    });

    // Calculate today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayShipments = shipments.filter((s) => {
      const createdDate = new Date(s.created_at);
      createdDate.setHours(0, 0, 0, 0);
      return createdDate.getTime() === today.getTime();
    });
    const todayCount = todayShipments.length;

    // Calculate month's statistics
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthShipments = shipments.filter((s) => {
      const createdDate = new Date(s.created_at);
      return createdDate >= monthStart;
    });
    const monthCount = monthShipments.length;
    const monthRevenue = monthShipments.reduce(
      (sum, s) => sum + parseFloat(s.price.toString()),
      0
    );

    return {
      total,
      totalPrice,
      totalWeight,
      byStatus,
      byNature,
      todayCount,
      monthCount,
      monthRevenue,
    };
  }
}
