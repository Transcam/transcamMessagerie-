/// <reference path="../types/express.d.ts" />
import { Request, Response } from "express";
import { ShipmentService } from "../services/shipment.service";
import { ShipmentStatus, ShipmentNature } from "../entities/shipment.entity";

export class ShipmentsController {
  private service: ShipmentService;

  constructor() {
    this.service = new ShipmentService();
  }

  list = async (req: Request, res: Response) => {
    try {
      const filters = {
        status: req.query.status as ShipmentStatus | undefined,
        route: req.query.route as string | undefined,
        dateFrom: req.query.dateFrom
          ? new Date(req.query.dateFrom as string)
          : undefined,
        dateTo: req.query.dateTo
          ? new Date(req.query.dateTo as string)
          : undefined,
        waybillNumber: req.query.waybillNumber as string | undefined,
        nature: req.query.nature as ShipmentNature | undefined,
        includeCancelled: req.query.includeCancelled === "true",
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const [shipments, total] = await this.service.list(filters);

      // Remove price field for STAFF role
      const userRole = req.user?.role;
      const sanitizedShipments = shipments.map((shipment: any) => {
        if (userRole === "staff") {
          const { price, ...shipmentWithoutPrice } = shipment;
          return shipmentWithoutPrice;
        }
        return shipment;
      });

      res.json({
        data: sanitizedShipments,
        pagination: {
          total,
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(total / filters.limit!),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getOne = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const shipment = await this.service.getOne(id);

      // Remove price field for STAFF role
      const userRole = req.user?.role;
      let sanitizedShipment = shipment;
      if (userRole === "staff") {
        const { price, ...shipmentWithoutPrice } = shipment as any;
        sanitizedShipment = shipmentWithoutPrice;
      }

      res.json({ data: sanitizedShipment });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const {
        sender_name,
        sender_phone,
        receiver_name,
        receiver_phone,
        weight,
        price,
        route,
        nature,
      } = req.body;

      if (!sender_name || !sender_phone || !receiver_name || !receiver_phone) {
        return res
          .status(400)
          .json({ error: "Sender and receiver information are required" });
      }

      if (!weight || weight <= 0) {
        return res
          .status(400)
          .json({ error: "Weight is required and must be greater than 0" });
      }

      if (!price || price <= 0) {
        return res
          .status(400)
          .json({ error: "Price is required and must be greater than 0" });
      }

      if (!route) {
        return res.status(400).json({ error: "Route is required" });
      }

      const shipment = await this.service.create(req.body, req.user);
      res.status(201).json({ data: shipment });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  confirm = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const shipment = await this.service.confirm(id, req.user);
      res.json({ data: shipment });
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
      const shipment = await this.service.update(id, req.body, req.user);
      res.json({ data: shipment });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  cancel = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const { reason } = req.body;

      if (!reason) {
        return res
          .status(400)
          .json({ error: "Cancellation reason is required" });
      }

      const shipment = await this.service.cancel(id, reason, req.user);
      res.json({ data: shipment });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  generateWaybill = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const pdfBuffer = await this.service.generateWaybillPDF(id);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="bordereau-${id}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  generateReceipt = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const shipment = await this.service.getOne(id);
      res.json({
        message: "Receipt generation - to be implemented",
        data: shipment,
      });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  getStatistics = async (req: Request, res: Response) => {
    try {
      const filters = {
        nature: req.query.nature as ShipmentNature | undefined,
      };

      const statistics = await this.service.getStatistics(filters);

      // Remove price-related fields for STAFF role
      const userRole = req.user?.role;
      let sanitizedStatistics = statistics;
      if (userRole === "staff") {
        const { totalPrice, monthRevenue, ...statsWithoutPrice } =
          statistics as any;
        sanitizedStatistics = {
          ...statsWithoutPrice,
          totalPrice: 0,
          monthRevenue: 0,
        };
      }

      res.json({ data: sanitizedStatistics });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
