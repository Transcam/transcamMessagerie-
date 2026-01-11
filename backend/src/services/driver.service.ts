import { Repository } from "typeorm";
import { AppDataSource } from "../../db";
import { Driver, DriverStatus } from "../entities/driver.entity";
import { Departure } from "../entities/departure.entity";
import { User } from "../entities/user.entity";
import { AuditLog } from "../entities/audit-log.entity";

export interface CreateDriverDTO {
  first_name: string;
  last_name: string;
  phone: string;
  license_number: string;
  email?: string;
  address?: string;
  status?: DriverStatus;
}

export interface UpdateDriverDTO {
  first_name?: string;
  last_name?: string;
  phone?: string;
  license_number?: string;
  email?: string;
  address?: string;
  status?: DriverStatus;
}

export interface DriverFilters {
  status?: DriverStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export class DriverService {
  private driverRepo: Repository<Driver>;
  private departureRepo: Repository<Departure>;
  private auditLogRepo: Repository<AuditLog>;

  constructor() {
    this.driverRepo = AppDataSource.getRepository(Driver);
    this.departureRepo = AppDataSource.getRepository(Departure);
    this.auditLogRepo = AppDataSource.getRepository(AuditLog);
  }

  /**
   * Create a new driver
   */
  async create(data: CreateDriverDTO, user: User): Promise<Driver> {
    // Check if license number already exists
    const existing = await this.driverRepo.findOne({
      where: { license_number: data.license_number },
    });

    if (existing) {
      throw new Error("Un chauffeur avec ce numéro de permis existe déjà");
    }

    const driver = this.driverRepo.create({
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      license_number: data.license_number,
      email: data.email || null,
      address: data.address || null,
      status: data.status || DriverStatus.ACTIF,
      created_by_id: user.id,
    });

    const saved = await this.driverRepo.save(driver);
    await this.logAction("create", saved.id, user, null, saved);

    return saved;
  }

  /**
   * List drivers with filters
   */
  async list(filters: DriverFilters = {}): Promise<[Driver[], number]> {
    const query = this.driverRepo
      .createQueryBuilder("driver")
      .leftJoinAndSelect("driver.created_by", "created_by");

    if (filters.status) {
      query.andWhere("driver.status = :status", { status: filters.status });
    }

    if (filters.search) {
      query.andWhere(
        "(driver.first_name ILIKE :search OR driver.last_name ILIKE :search OR driver.phone ILIKE :search OR driver.license_number ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    query.skip((page - 1) * limit).take(limit);
    query.orderBy("driver.created_at", "DESC");

    return query.getManyAndCount();
  }

  /**
   * Get single driver
   */
  async getOne(id: number): Promise<Driver> {
    const driver = await this.driverRepo.findOne({
      where: { id },
      relations: ["created_by", "departures"],
    });

    if (!driver) {
      throw new Error("Chauffeur non trouvé");
    }

    return driver;
  }

  /**
   * Update driver
   */
  async update(id: number, data: UpdateDriverDTO, user: User): Promise<Driver> {
    const driver = await this.getOne(id);
    const oldValues = { ...driver };

    // Check if license number is being changed and if it already exists
    if (data.license_number && data.license_number !== driver.license_number) {
      const existing = await this.driverRepo.findOne({
        where: { license_number: data.license_number },
      });

      if (existing) {
        throw new Error("Un chauffeur avec ce numéro de permis existe déjà");
      }
    }

    Object.assign(driver, data);
    const saved = await this.driverRepo.save(driver);
    await this.logAction("update", saved.id, user, oldValues, saved);

    return saved;
  }

  /**
   * Delete driver
   */
  async delete(id: number, user: User): Promise<void> {
    const driver = await this.getOne(id);

    // Check if driver is used in any departures
    const departuresCount = await this.departureRepo
      .createQueryBuilder("departure")
      .where("departure.driver_id = :id", { id })
      .getCount();

    if (departuresCount > 0) {
      throw new Error(
        "Ce chauffeur ne peut pas être supprimé car il est utilisé dans des départs"
      );
    }

    await this.driverRepo.remove(driver);
    await this.logAction("delete", id, user, driver, null);
  }

  /**
   * Get available drivers (ACTIF status)
   */
  async getAvailable(): Promise<Driver[]> {
    return this.driverRepo.find({
      where: { status: DriverStatus.ACTIF },
      order: { last_name: "ASC", first_name: "ASC" },
    });
  }

  /**
   * Log action to audit log
   */
  private async logAction(
    action: string,
    driverId: number,
    user: User,
    oldValues: any,
    newValues: any
  ): Promise<void> {
    const log = this.auditLogRepo.create({
      entity_type: "driver",
      entity_id: driverId,
      action,
      old_values: oldValues,
      new_values: newValues,
      user,
      user_id: user.id,
    });

    await this.auditLogRepo.save(log);
  }
}
