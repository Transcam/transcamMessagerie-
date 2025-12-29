import { Request, Response } from "express";
import { VehicleService, CreateVehicleDTO, UpdateVehicleDTO, VehicleFilters } from "../services/vehicle.service";
import { VehicleStatus, VehicleType } from "../entities/vehicle.entity";

export class VehiclesController {
  private service: VehicleService;

  constructor() {
    this.service = new VehicleService();
  }

  list = async (req: Request, res: Response) => {
    try {
      const filters: VehicleFilters = {
        status: req.query.status as VehicleStatus | undefined,
        type: req.query.type as VehicleType | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const [vehicles, total] = await this.service.list(filters);
      const totalPages = Math.ceil(total / (filters.limit || 20));

      res.json({
        data: vehicles,
        pagination: {
          total,
          page: filters.page || 1,
          limit: filters.limit || 20,
          totalPages,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getOne = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await this.service.getOne(id);
      res.json({ data: vehicle });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const vehicle = await this.service.create(req.body as CreateVehicleDTO, req.user);
      res.status(201).json({ data: vehicle });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const vehicle = await this.service.update(id, req.body as UpdateVehicleDTO, req.user);
      res.json({ data: vehicle });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      await this.service.delete(id, req.user);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getAvailable = async (req: Request, res: Response) => {
    try {
      const vehicles = await this.service.getAvailable();
      res.json({ data: vehicles });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

