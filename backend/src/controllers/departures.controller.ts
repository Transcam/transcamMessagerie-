/// <reference path="../types/express.d.ts" />
import { Request, Response } from "express";
import { DepartureService } from "../services/departure.service";
import { DepartureStatus } from "../entities/departure.entity";
import * as fs from "fs";
import * as path from "path";

export class DeparturesController {
  private service: DepartureService;

  constructor() {
    this.service = new DepartureService();
  }

  list = async (req: Request, res: Response) => {
    try {
      // Parse dateFrom (start of day in local timezone)
      let dateFrom: Date | undefined;
      if (req.query.dateFrom) {
        const dateStr = req.query.dateFrom as string;
        const [year, month, day] = dateStr.split('-').map(Number);
        dateFrom = new Date(year, month - 1, day, 0, 0, 0, 0);
      }

      // Parse dateTo (end of day in local timezone)
      let dateTo: Date | undefined;
      if (req.query.dateTo) {
        const dateStr = req.query.dateTo as string;
        const [year, month, day] = dateStr.split('-').map(Number);
        dateTo = new Date(year, month - 1, day, 23, 59, 59, 999);
      }

      const filters = {
        status: req.query.status as DepartureStatus | undefined,
        route: req.query.route as string | undefined,
        dateFrom,
        dateTo,
        generalWaybillNumber: req.query.generalWaybillNumber as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const [departures, total] = await this.service.list(filters, req.user);

      res.json({
        data: departures,
        pagination: {
          total,
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(total / (filters.limit || 20)),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getOne = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const departure = await this.service.getOne(id, req.user);
      res.json({ data: departure });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const departure = await this.service.create(req.body, req.user);
      res.status(201).json({ data: departure });
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
      const departure = await this.service.update(id, req.body, req.user);
      res.json({ data: departure });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  assignShipments = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const { shipment_ids } = req.body;

      if (!Array.isArray(shipment_ids) || shipment_ids.length === 0) {
        return res.status(400).json({ error: "shipment_ids array is required" });
      }

      const result = await this.service.assignShipments(id, shipment_ids, req.user);
      res.json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  removeShipment = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const shipmentId = parseInt(req.params.shipmentId);

      const departure = await this.service.removeShipment(id, shipmentId, req.user);
      res.json({ data: departure });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  seal = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const result = await this.service.seal(id, req.user);
      res.json({
        data: result.departure,
        general_waybill_number: result.general_waybill_number,
        pdf_url: `/api/departures/${id}/general-waybill`,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  close = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const departure = await this.service.close(id, req.user);
      res.json({ data: departure });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getGeneralWaybill = async (req: Request, res: Response) => {
    try {
      console.log(`🌐 [CONTROLLER] Requête de téléchargement PDF reçue pour départ #${req.params.id}`);
      const id = parseInt(req.params.id);
      console.log(`🔍 [CONTROLLER] ID parsé: ${id}`);
      
      const pdfPath = await this.service.getPDFPath(id);
      console.log(`📂 [CONTROLLER] Chemin PDF obtenu: ${pdfPath}`);

      if (!fs.existsSync(pdfPath)) {
        console.error(`❌ [CONTROLLER] Fichier PDF introuvable: ${pdfPath}`);
        return res.status(404).json({ error: "PDF file not found" });
      }

      const filename = path.basename(pdfPath);
      console.log(`📤 [CONTROLLER] Envoi du fichier: ${filename}`);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      const fileStream = fs.createReadStream(pdfPath);
      
      // Handle stream errors to prevent server crash
      fileStream.on("error", (error) => {
        console.error(`❌ [CONTROLLER] Erreur lors de la lecture du fichier: ${error.message}`);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error reading PDF file" });
        }
      });
      
      // Handle successful completion
      fileStream.on("end", () => {
        console.log(`✅ [CONTROLLER] Fichier envoyé avec succès`);
      });
      
      // Pipe the stream to response
      fileStream.pipe(res);
      
      // Handle response errors
      res.on("error", (error) => {
        console.error(`❌ [CONTROLLER] Erreur lors de l'envoi de la réponse: ${error.message}`);
        fileStream.destroy();
      });
      
      // Handle client disconnect
      res.on("close", () => {
        if (!res.writableEnded) {
          console.log(`⚠️ [CONTROLLER] Client a fermé la connexion avant la fin du téléchargement`);
          fileStream.destroy();
        }
      });
    } catch (error: any) {
      console.error(`❌ [CONTROLLER] Erreur lors du téléchargement: ${error.message}`);
      if (!res.headersSent) {
        res.status(404).json({ error: error.message });
      }
    }
  };

  getSummary = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const summary = await this.service.getSummary(id, req.user);
      res.json({ data: summary });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      await this.service.delete(id, req.user);
      res.json({ message: "Departure deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

