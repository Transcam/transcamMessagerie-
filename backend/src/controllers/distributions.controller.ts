import { Request, Response } from "express";
import { DistributionService, DistributionFiltersDTO } from "../services/distribution.service";

export class DistributionsController {
  private service: DistributionService;

  constructor() {
    this.service = new DistributionService();
  }

  /**
   * Get driver distributions (all drivers or specific driver)
   * GET /api/distributions/drivers?driverId=1&dateFrom=2024-01-01&dateTo=2024-01-31
   */
  listDrivers = async (req: Request, res: Response) => {
    try {
      const filters: DistributionFiltersDTO = {
        driverId: req.query.driverId ? parseInt(req.query.driverId as string) : undefined,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      const distributions = await this.service.calculateDriverDistribution(filters);
      res.json({ data: distributions });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Get ministry distribution
   * GET /api/distributions/ministry?dateFrom=2024-01-01&dateTo=2024-01-31
   */
  getMinistry = async (req: Request, res: Response) => {
    try {
      const filters: DistributionFiltersDTO = {
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      const distribution = await this.service.calculateMinistryDistribution(filters);
      res.json({ data: distribution });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Get agency distribution
   * GET /api/distributions/agency?dateFrom=2024-01-01&dateTo=2024-01-31
   */
  getAgency = async (req: Request, res: Response) => {
    try {
      const filters: DistributionFiltersDTO = {
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      const distribution = await this.service.calculateAgencyDistribution(filters);
      res.json({ data: distribution });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Get distribution summary (global statistics)
   * GET /api/distributions/summary?dateFrom=2024-01-01&dateTo=2024-01-31
   */
  getSummary = async (req: Request, res: Response) => {
    try {
      const filters: DistributionFiltersDTO = {
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      const summary = await this.service.getDistributionSummary(filters);
      res.json({ data: summary });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}


