import { Request, Response } from "express";
import { DriverService, CreateDriverDTO, UpdateDriverDTO, DriverFilters } from "../services/driver.service";
import { DriverStatus } from "../entities/driver.entity";

export class DriversController {
  private service: DriverService;

  constructor() {
    this.service = new DriverService();
  }

  list = async (req: Request, res: Response) => {
    try {
      const filters: DriverFilters = {
        status: req.query.status as DriverStatus | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const [drivers, total] = await this.service.list(filters);
      const totalPages = Math.ceil(total / (filters.limit || 20));

      res.json({
        data: drivers,
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
      const driver = await this.service.getOne(id);
      res.json({ data: driver });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const driver = await this.service.create(req.body as CreateDriverDTO, req.user);
      res.status(201).json({ data: driver });
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
      const driver = await this.service.update(id, req.body as UpdateDriverDTO, req.user);
      res.json({ data: driver });
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
      const drivers = await this.service.getAvailable();
      res.json({ data: drivers });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

