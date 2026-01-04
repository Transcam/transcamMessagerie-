import { Request, Response } from "express";
import { AppDataSource } from "../../db";
import { Settings } from "../entities/settings.entity";
import * as fs from "fs";
import * as path from "path";

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settingsRepo = AppDataSource.getRepository(Settings);
    let settings = await settingsRepo.findOne({ where: { id: "company" } });

    if (!settings) {
      // Create default settings
      settings = new Settings();
      settings.id = "company";
      settings.company_logo_url = "/assets/images/LogoTranscam.jpg";
      settings = await settingsRepo.save(settings);
    }

    res.json({ data: settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { company_logo_url } = req.body;
    const settingsRepo = AppDataSource.getRepository(Settings);

    let settings = await settingsRepo.findOne({ where: { id: "company" } });

    if (!settings) {
      settings = new Settings();
      settings.id = "company";
    }

    if (company_logo_url !== undefined) {
      settings.company_logo_url = company_logo_url;
    }

    settings.updated_at = new Date();
    const savedSettings = await settingsRepo.save(settings);

    res.json({
      data: savedSettings,
      message: "Settings updated successfully",
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const uploadLogo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const settingsRepo = AppDataSource.getRepository(Settings);

    // Récupérer les settings AVANT de déplacer le fichier
    let settings = await settingsRepo.findOne({ where: { id: "company" } });
    const oldLogoUrl = settings?.company_logo_url;

    // Path to frontend public images directory
    const frontendPublicPath = path.join(
      process.cwd(),
      "..",
      "frontend",
      "public",
      "assets",
      "images"
    );

    // Ensure directory exists
    if (!fs.existsSync(frontendPublicPath)) {
      fs.mkdirSync(frontendPublicPath, { recursive: true });
    }

    // Generate unique filename
    const fileExt = path.extname(req.file.originalname);
    const fileName = `company-logo-${Date.now()}${fileExt}`;
    const destinationPath = path.join(frontendPublicPath, fileName);

    // Move file from temp to destination
    fs.renameSync(req.file.path, destinationPath);

    // Delete old logo if exists (except default logo)
    if (oldLogoUrl && oldLogoUrl !== "/assets/images/LogoTranscam.jpg") {
      const oldLogoPath = path.join(
        process.cwd(),
        "..",
        "frontend",
        "public",
        oldLogoUrl
      );
      if (fs.existsSync(oldLogoPath)) {
        try {
          fs.unlinkSync(oldLogoPath);
          console.log(`🗑️  [SETTINGS] Ancien logo supprimé: ${oldLogoPath}`);
        } catch (err) {
          console.error(
            "❌ [SETTINGS] Erreur lors de la suppression de l'ancien logo:",
            err
          );
        }
      }
    }

    // Update settings
    if (!settings) {
      settings = new Settings();
      settings.id = "company";
    }

    const logoUrl = `/assets/images/${fileName}`;
    settings.company_logo_url = logoUrl;
    settings.updated_at = new Date();
    await settingsRepo.save(settings);

    res.json({
      data: { company_logo_url: logoUrl },
      message: "Logo uploaded successfully",
    });
  } catch (error: any) {
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up temp file:", cleanupError);
      }
    }
    res.status(400).json({ error: error.message });
  }
};
