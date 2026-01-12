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
      // Parse dateFrom (start of day)
      let dateFrom: Date | undefined;
      if (req.query.dateFrom) {
        dateFrom = new Date(req.query.dateFrom as string);
        dateFrom.setHours(0, 0, 0, 0);
      }

      // Parse dateTo (end of day - 23:59:59.999)
      let dateTo: Date | undefined;
      if (req.query.dateTo) {
        dateTo = new Date(req.query.dateTo as string);
        dateTo.setHours(23, 59, 59, 999);
      }

      const filters = {
        status: req.query.status as ShipmentStatus | undefined,
        route: req.query.route as string | undefined,
        dateFrom,
        dateTo,
        waybillNumber: req.query.waybillNumber as string | undefined,
        nature: req.query.nature as ShipmentNature | undefined,
        includeCancelled: req.query.includeCancelled === "true",
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const [shipments, total] = await this.service.list(filters);

      // Remove price field for STAFF role, except for their own shipments
      const userRole = req.user?.role;
      const userId = req.user?.id;
      const sanitizedShipments = shipments.map((shipment: any) => {
        if (userRole === "staff") {
          // STAFF can see price of their own shipments only
          const isOwnShipment = 
            shipment.created_by?.id === userId || 
            shipment.created_by_id === userId;
          
          if (isOwnShipment) {
            return shipment; // Keep price for own shipments
          }
          
          // Remove price for shipments created by others
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

      // Remove price field for STAFF role, except for their own shipments
      const userRole = req.user?.role;
      const userId = req.user?.id;
      let sanitizedShipment = shipment;
      if (userRole === "staff") {
        // STAFF can see price of their own shipments only
        const isOwnShipment = 
          shipment.created_by?.id === userId || 
          (shipment as any).created_by_id === userId;
        
        if (!isOwnShipment) {
          // Remove price for shipments created by others
          const { price, ...shipmentWithoutPrice } = shipment as any;
          sanitizedShipment = shipmentWithoutPrice;
        }
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
        is_free,
        route,
        nature,
        created_at, // New field for historical dates
        is_manual,
      } = req.body;

      if (!sender_name || !sender_phone || !receiver_name || !receiver_phone) {
        return res
          .status(400)
          .json({ error: "Sender and receiver information are required" });
      }

      // Weight is now optional - no validation needed
      
      // Validation du prix : si is_free est true, price peut être 0, sinon price doit être > 0
      const isFree = is_free === true || is_free === "true";
      
      if (isFree) {
        // Envoi gratuit : price doit être 0 ou null/undefined
        if (price !== undefined && price !== null && price !== 0) {
          return res.status(400).json({ 
            error: "Price must be 0 for free shipments" 
          });
        }
      } else {
        // Envoi payant : price doit être > 0
        if (!price || price <= 0) {
          return res
            .status(400)
            .json({ error: "Price is required and must be greater than 0" });
        }
      }

      if (!route) {
        return res.status(400).json({ error: "Route is required" });
      }

      // Handle optional manual/historical date
      let parsedCreatedAt: Date | undefined;
      if (created_at) {
        parsedCreatedAt = new Date(created_at);
        // Validate date format
        if (isNaN(parsedCreatedAt.getTime())) {
          return res.status(400).json({ error: "Invalid date format for created_at" });
        }
        // Validate date is not in future
        if (parsedCreatedAt > new Date()) {
          return res.status(400).json({ error: "Cannot create shipment with future date" });
        }
      }

      // S'assurer que price est défini (0 si gratuit)
      const finalPrice = isFree ? 0 : price;

      const shipment = await this.service.create({
        ...req.body,
        price: finalPrice,
        is_free: isFree,
        created_at: parsedCreatedAt,
        is_manual: is_manual || !!parsedCreatedAt, // Mark as manual if date provided
      }, req.user);
      res.status(201).json({ data: shipment });
    } catch (error: any) {
      // Gérer l'erreur de colis similaire
      if (error.code === "DUPLICATE_SHIPMENT") {
        return res.status(409).json({
          error: "DUPLICATE_SHIPMENT",
          message: "Un colis similaire a déjà été enregistré",
          existingShipment: error.existingShipment,
        });
      }
      res.status(400).json({ error: error.message });
    }
  };

  deleteAndCreate = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const existingId = parseInt(req.body.existingId);
      if (!existingId || isNaN(existingId)) {
        return res.status(400).json({ error: "existingId is required and must be a valid number" });
      }

      const shipment = await this.service.deleteAndCreate(existingId, req.body, req.user);
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
      const { price, is_free, ...otherData } = req.body;

      // Validation du prix si fourni
      if (price !== undefined || is_free !== undefined) {
        const isFree = is_free === true || is_free === "true" || (is_free === undefined && req.body.is_free === true);
        
        if (isFree) {
          // Envoi gratuit : price doit être 0 ou null/undefined
          if (price !== undefined && price !== null && price !== 0) {
            return res.status(400).json({ 
              error: "Price must be 0 for free shipments" 
            });
          }
          otherData.price = 0;
          otherData.is_free = true;
        } else {
          // Envoi payant : price doit être > 0
          if (price !== undefined && (!price || price <= 0)) {
            return res.status(400).json({ 
              error: "Price must be greater than 0 for paid shipments" 
            });
          }
          otherData.price = price;
          otherData.is_free = false;
        }
      }

      const shipment = await this.service.update(id, otherData, req.user);
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

      // Log important pour analyser les PDFs blancs en production
      console.log(
        "📄 [PDF] Waybill buffer length:",
        pdfBuffer?.length,
        "bytes for shipment",
        id
      );

      // Headers pour empêcher la compression et garantir l'intégrité du PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length.toString());
      res.setHeader("Content-Encoding", "identity"); // Empêche la compression proxy
      res.setHeader("Cache-Control", "no-transform"); // Empêche toute transformation
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="bordereau-${id}.pdf"`
      );

      // Log des headers envoyés pour debug
      console.log("📄 [PDF] Headers sent:", {
        "Content-Type": res.getHeader("Content-Type"),
        "Content-Length": res.getHeader("Content-Length"),
        "Content-Encoding": res.getHeader("Content-Encoding"),
        "Content-Disposition": res.getHeader("Content-Disposition"),
      });

      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  generateReceipt = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const pdfBuffer = await this.service.generateReceiptPDF(id);

      // Log important pour analyser les PDFs blancs en production
      console.log(
        "📄 [PDF] Receipt buffer length:",
        pdfBuffer?.length,
        "bytes for shipment",
        id
      );

      // Headers pour empêcher la compression et garantir l'intégrité du PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length.toString());
      res.setHeader("Content-Encoding", "identity"); // Empêche la compression proxy
      res.setHeader("Cache-Control", "no-transform"); // Empêche toute transformation
      res.setHeader(
        "Content-Disposition",
        `inline; filename="recu-${id}.pdf"`
      );

      // Log des headers envoyés pour debug
      console.log("📄 [PDF] Headers sent:", {
        "Content-Type": res.getHeader("Content-Type"),
        "Content-Length": res.getHeader("Content-Length"),
        "Content-Encoding": res.getHeader("Content-Encoding"),
        "Content-Disposition": res.getHeader("Content-Disposition"),
      });

      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  getStatistics = async (req: Request, res: Response) => {
    try {
      const filters: {
        nature?: ShipmentNature;
        dateFrom?: Date;
        dateTo?: Date;
      } = {
        nature: req.query.nature as ShipmentNature | undefined,
      };

      // Add date filters if provided
      if (req.query.dateFrom) {
        const date = new Date(req.query.dateFrom as string);
        date.setHours(0, 0, 0, 0); // Start of day
        filters.dateFrom = date;
      }
      if (req.query.dateTo) {
        const date = new Date(req.query.dateTo as string);
        date.setHours(23, 59, 59, 999); // End of day
        filters.dateTo = date;
      }

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

  searchContacts = async (req: Request, res: Response) => {
    try {
      const { q, type } = req.query;
      
      // Si q est vide ou manquant, retourner un tableau vide au lieu d'une erreur
      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.json({ data: [] });
      }
      
      if (type !== 'sender' && type !== 'receiver') {
        return res.status(400).json({ error: "Type must be 'sender' or 'receiver'" });
      }
      
      const contacts = await this.service.searchContacts(q.trim(), type as 'sender' | 'receiver');
      res.json({ data: contacts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
