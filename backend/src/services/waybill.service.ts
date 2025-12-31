import { Repository } from "typeorm";
import { AppDataSource } from "../../db";
import { Shipment } from "../entities/shipment.entity";

export class WaybillService {
  private shipmentRepo: Repository<Shipment>;

  constructor() {
    this.shipmentRepo = AppDataSource.getRepository(Shipment);
  }

  async generateNext(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `TC-${currentYear}-`;

    const lastShipment = await this.shipmentRepo
      .createQueryBuilder("shipment")
      .where("shipment.waybill_number LIKE :prefix", { prefix: `${prefix}%` })
      .orderBy("shipment.waybill_number", "DESC")
      .getOne();

    let nextNumber = 1;

    if (lastShipment) {
      const match = lastShipment.waybill_number.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0], 10) + 1;
      }
    }

    return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
  }
}




