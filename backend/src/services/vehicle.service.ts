import { Repository } from "typeorm";
import { AppDataSource } from "../../db";
import { Vehicle, VehicleType, VehicleStatus } from "../entities/vehicle.entity";
import { Departure } from "../entities/departure.entity";
import { User } from "../entities/user.entity";
import { AuditLog } from "../entities/audit-log.entity";

export interface CreateVehicleDTO {
  registration_number: string;
  name: string;
  type: VehicleType;
  status?: VehicleStatus;
}

export interface UpdateVehicleDTO {
  registration_number?: string;
  name?: string;
  type?: VehicleType;
  status?: VehicleStatus;
}

export interface VehicleFilters {
  status?: VehicleStatus;
  type?: VehicleType;
  search?: string;
  page?: number;
  limit?: number;
}

export class VehicleService {
  private vehicleRepo: Repository<Vehicle>;
  private departureRepo: Repository<Departure>;
  private auditLogRepo: Repository<AuditLog>;

  constructor() {
    this.vehicleRepo = AppDataSource.getRepository(Vehicle);
    this.departureRepo = AppDataSource.getRepository(Departure);
    this.auditLogRepo = AppDataSource.getRepository(AuditLog);
  }

  /**
   * Create a new vehicle
   */
  async create(data: CreateVehicleDTO, user: User): Promise<Vehicle> {
    // Check if registration number already exists
    const existing = await this.vehicleRepo.findOne({
      where: { registration_number: data.registration_number },
    });

    if (existing) {
      throw new Error("Un véhicule avec cette immatriculation existe déjà");
    }

    const vehicle = this.vehicleRepo.create({
      registration_number: data.registration_number,
      name: data.name,
      type: data.type,
      status: data.status || VehicleStatus.ACTIF,
      created_by_id: user.id,
    });

    const saved = await this.vehicleRepo.save(vehicle);
    await this.logAction("create", saved.id, user, null, saved);

    return saved;
  }

  /**
   * List vehicles with filters
   */
  async list(filters: VehicleFilters = {}): Promise<[Vehicle[], number]> {
    const query = this.vehicleRepo
      .createQueryBuilder("vehicle")
      .leftJoinAndSelect("vehicle.created_by", "created_by");

    if (filters.status) {
      query.andWhere("vehicle.status = :status", { status: filters.status });
    }

    if (filters.type) {
      query.andWhere("vehicle.type = :type", { type: filters.type });
    }

    if (filters.search) {
      query.andWhere(
        "(vehicle.registration_number ILIKE :search OR vehicle.name ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    query.skip((page - 1) * limit).take(limit);
    query.orderBy("vehicle.created_at", "DESC");

    return query.getManyAndCount();
  }

  /**
   * Get single vehicle
   */
  async getOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id },
      relations: ["created_by", "departures"],
    });

    if (!vehicle) {
      throw new Error("Véhicule non trouvé");
    }

    return vehicle;
  }

  /**
   * Update vehicle
   */
  async update(id: number, data: UpdateVehicleDTO, user: User): Promise<Vehicle> {
    const vehicle = await this.getOne(id);
    const oldValues = { ...vehicle };

    // Check if registration number is being changed and if it already exists
    if (data.registration_number && data.registration_number !== vehicle.registration_number) {
      const existing = await this.vehicleRepo.findOne({
        where: { registration_number: data.registration_number },
      });

      if (existing) {
        throw new Error("Un véhicule avec cette immatriculation existe déjà");
      }
    }

    Object.assign(vehicle, data);
    const saved = await this.vehicleRepo.save(vehicle);
    await this.logAction("update", saved.id, user, oldValues, saved);

    return saved;
  }

  /**
   * Delete vehicle
   */
  async delete(id: number, user: User): Promise<void> {
    const vehicle = await this.getOne(id);

    // Check if vehicle is used in any departures
    const departuresCount = await this.departureRepo
      .createQueryBuilder("departure")
      .where("departure.vehicle_id = :id", { id })
      .getCount();

    if (departuresCount > 0) {
      throw new Error(
        "Ce véhicule ne peut pas être supprimé car il est utilisé dans des départs"
      );
    }

    await this.vehicleRepo.remove(vehicle);
    await this.logAction("delete", id, user, vehicle, null);
  }

  /**
   * Get available vehicles (ACTIF status)
   */
  async getAvailable(): Promise<Vehicle[]> {
    return this.vehicleRepo.find({
      where: { status: VehicleStatus.ACTIF },
      order: { name: "ASC" },
    });
  }

  /**
   * Log action to audit log
   */
  private async logAction(
    action: string,
    vehicleId: number,
    user: User,
    oldValues: any,
    newValues: any
  ): Promise<void> {
    const log = this.auditLogRepo.create({
      entity_type: "vehicle",
      entity_id: vehicleId,
      action,
      old_values: oldValues,
      new_values: newValues,
      user,
      user_id: user.id,
    });

    await this.auditLogRepo.save(log);
  }
}

