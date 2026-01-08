import PDFDocument from "pdfkit";
import { Shipment } from "../entities/shipment.entity";
import { GENERAL_CONDITIONS_LINES } from "./receipt.service";
import { Repository } from "typeorm";
import { AppDataSource } from "../../db";
import { Settings } from "../entities/settings.entity";
import * as fs from "fs";
import * as path from "path";

export class IndividualWaybillService {
  private settingsRepo: Repository<Settings>;

  constructor() {
    this.settingsRepo = AppDataSource.getRepository(Settings);
  }

  /**
   * Calculate total height needed for the receipt PDF
   */
  private calculateTotalHeight(
    shipment: Shipment,
    hasLogo: boolean = false
  ): number {
    let height = 10; // Initial yPos

    // Logo height if present
    if (hasLogo) {
      height += 30 + 8; // Logo height (30) + space after (8)
    }

    // Header section
    height += 18 + 12 + 12 + 12; // Company name, address, phone, line

    // Receipt number
    height += 15 + 15 + 12; // Title, number, line

    // Sender information
    height += 12 + 11 + 12 + 12; // Label, name, phone, line

    // Receiver information
    height += 12 + 11 + 12 + 12; // Label, name, phone, line

    // Shipment details
    height += 11 + 11 + 11 + 11 + 11; // Route, nature, weight, value, amount
    if (shipment.description) {
      height += 11; // Description line
    }
    height += 12; // Line after details

    // Date and status
    height += 11 + 11 + 12 + 12; // Date, created by, status, line

    // General conditions
    height += 12; // Title
    height += GENERAL_CONDITIONS_LINES.length * 10; // 5 lines * 10

    // Thank you message
    height += 12 + 12; // Thank you + reference message

    // Add height of last text line (fontSize 7 ≈ 7 points) + bottom margin
    height += 7 + 10;

    return Math.ceil(height);
  }

  /**
   * Generate Individual Waybill PDF for a shipment (Ticket 80mm format)
   */
  async generatePDF(shipment: Shipment): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Récupérer les settings pour le logo
        let settings = await this.settingsRepo.findOne({
          where: { id: "company" },
        });
        const logoUrl =
          settings?.company_logo_url || "/assets/images/LogoTranscam.jpg";

        // Retirer le "/" initial du logoUrl pour éviter les problèmes avec path.join
        const logoUrlClean = logoUrl.startsWith("/")
          ? logoUrl.substring(1)
          : logoUrl;

        // Chemin physique du logo
        const logoPath = path.join(
          process.cwd(),
          "..",
          "frontend",
          "public",
          logoUrlClean
        );
        const logoExists = fs.existsSync(logoPath);

        if (!logoExists) {
          console.warn(`⚠️ [PDF] Logo non trouvé à: ${logoPath}`);
        }

        // Ticket 80mm format: 80mm width = 226.77 points
        const ticketWidth = 226.77; // 80mm in points
        const margin = 10; // Smaller margin for ticket
        const pageWidth = ticketWidth - margin * 2; // 206.77 points usable width

        // Calculate dynamic height (ajusté pour logo si présent)
        const calculatedHeight = this.calculateTotalHeight(
          shipment,
          logoExists
        );

        const doc = new PDFDocument({
          margin: margin,
          size: [ticketWidth, calculatedHeight], // Width: 80mm, Height: calculated
        });
        const chunks: Buffer[] = [];

        // Collect PDF data
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        let yPos = 10;

        // ============================================
        // HEADER SECTION
        // ============================================

        // Logo (si disponible)
        if (logoExists) {
          try {
            // Logo centré, largeur max 40 points pour ticket 80mm
            const logoWidth = 40;
            const logoHeight = 30; // Ratio 4:3 approximatif
            const logoX = (ticketWidth - logoWidth) / 2; // Centré horizontalement

            doc.image(logoPath, logoX, yPos, {
              width: logoWidth,
              height: logoHeight,
              fit: [logoWidth, logoHeight], // Conserver proportions
            });
            yPos += logoHeight + 8; // Espace après le logo
          } catch (error) {
            console.warn("⚠️ [PDF] Erreur lors du chargement du logo:", error);
            // Continue sans logo si erreur
          }
        }

        // Company name
        doc.fontSize(12).font("Helvetica-Bold").fillColor("#000000");
        doc.text("TRANSCAM COLIS ET COURRIER", margin, yPos, {
          align: "center",
          width: pageWidth,
        });
        yPos += 18;

        // Company address and contact
        doc.fontSize(7).font("Helvetica").fillColor("#000000");
        doc.text("Siège social: Mvan B.P 5633 Yaoundé", margin, yPos, {
          align: "center",
          width: pageWidth,
        });
        yPos += 12;

        doc.fontSize(7).font("Helvetica").fillColor("#000000");
        doc.text("Tel: 677 891 404 / 697 06 63 50", margin, yPos, {
          align: "center",
          width: pageWidth,
        });
        yPos += 12;

        // Horizontal line
        doc
          .moveTo(margin, yPos)
          .lineTo(margin + pageWidth, yPos)
          .stroke();
        yPos += 12;

        // ============================================
        // RECEIPT NUMBER
        // ============================================

        doc.fontSize(10).font("Helvetica-Bold").fillColor("#000000");
        doc.text("RECU EXPEDITION N°", margin, yPos, {
          align: "center",
          width: pageWidth,
        });
        yPos += 15;

        doc.fontSize(11).font("Helvetica-Bold").fillColor("#000000");
        doc.text(shipment.waybill_number, margin, yPos, {
          align: "center",
          width: pageWidth,
        });
        yPos += 15;

        // Horizontal line
        doc
          .moveTo(margin, yPos)
          .lineTo(margin + pageWidth, yPos)
          .stroke();
        yPos += 12;

        // ============================================
        // SENDER INFORMATION
        // ============================================

        doc.fontSize(8).font("Helvetica-Bold").fillColor("#000000");
        doc.text("EXPEDITEUR:", margin, yPos);
        yPos += 12;

        doc.fontSize(7).font("Helvetica").fillColor("#000000");
        doc.text(`Nom: ${shipment.sender_name}`, margin, yPos);
        yPos += 11;

        doc.fontSize(7).font("Helvetica").fillColor("#000000");
        doc.text(`Tel: ${shipment.sender_phone}`, margin, yPos);
        yPos += 12;

        // Horizontal line
        doc
          .moveTo(margin, yPos)
          .lineTo(margin + pageWidth, yPos)
          .stroke();
        yPos += 12;

        // ============================================
        // RECEIVER INFORMATION
        // ============================================

        doc.fontSize(8).font("Helvetica-Bold").fillColor("#000000");
        doc.text("DESTINATAIRE:", margin, yPos);
        yPos += 12;

        doc.fontSize(7).font("Helvetica").fillColor("#000000");
        doc.text(`Nom: ${shipment.receiver_name}`, margin, yPos);
        yPos += 11;

        doc.fontSize(7).font("Helvetica").fillColor("#000000");
        doc.text(`Tel: ${shipment.receiver_phone}`, margin, yPos);
        yPos += 12;

        // Horizontal line
        doc
          .moveTo(margin, yPos)
          .lineTo(margin + pageWidth, yPos)
          .stroke();
        yPos += 12;

        // ============================================
        // SHIPMENT DETAILS
        // ============================================

        doc.fontSize(7).font("Helvetica").fillColor("#000000");
        doc.text(`DESTINATION: Kribi`, margin, yPos);
        yPos += 11;

        const natureLabel = shipment.nature === "colis" ? "Colis" : "Courrier";
        doc.fontSize(7).font("Helvetica").fillColor("#000000");
        doc.text(`NATURE: ${natureLabel}`, margin, yPos);
        yPos += 11;

        doc.fontSize(7).font("Helvetica").fillColor("#000000");
        const weightText =
          shipment.weight !== null && shipment.weight !== undefined
            ? `${parseFloat(shipment.weight.toString()).toFixed(2)} kg`
            : "N/A";
        doc.text(`POIDS: ${weightText}`, margin, yPos);
        yPos += 11;

        doc.fontSize(7).font("Helvetica").fillColor("#000000");
        doc.text(
          `VALEUR DECLAREE: ${parseFloat(
            shipment.declared_value.toString()
          ).toFixed(2)} FCFA`,
          margin,
          yPos
        );
        yPos += 11;

        doc.fontSize(7).font("Helvetica-Bold").fillColor("#000000");
        doc.text(
          `MONTANT: ${parseFloat(shipment.price.toString()).toFixed(2)} FCFA`,
          margin,
          yPos
        );
        yPos += 11;

        if (shipment.description) {
          doc.fontSize(7).font("Helvetica").fillColor("#000000");
          doc.text(`DESCRIPTION: ${shipment.description}`, margin, yPos, {
            width: pageWidth,
          });
          yPos += 11;
        }

        // Horizontal line
        doc
          .moveTo(margin, yPos)
          .lineTo(margin + pageWidth, yPos)
          .stroke();
        yPos += 12;

        // ============================================
        // DATE AND STATUS INFORMATION
        // ============================================

        const createdDate = shipment.created_at
          ? new Date(shipment.created_at).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
          : "N/A";
        doc.fontSize(7).font("Helvetica").fillColor("#000000");
        doc.text(`Date de depart: ${createdDate}`, margin, yPos);
        yPos += 11;

        const createdByUsername = shipment.created_by?.username || "N/A";
        doc.fontSize(7).font("Helvetica").fillColor("#000000");
        doc.text(`Créé par: ${createdByUsername}`, margin, yPos);
        yPos += 11;

        const statusLabels: { [key: string]: string } = {
          pending: "En attente",
          confirmed: "Confirmé",
          assigned: "Assigné",
          cancelled: "Annulé",
        };
        const statusLabel = statusLabels[shipment.status] || shipment.status;
        doc.fontSize(7).font("Helvetica").fillColor("#000000");
        doc.text(`Statut: ${statusLabel}`, margin, yPos);
        yPos += 12;

        // Horizontal line
        doc
          .moveTo(margin, yPos)
          .lineTo(margin + pageWidth, yPos)
          .stroke();
        yPos += 12;

        // ============================================
        // GENERAL CONDITIONS
        // ============================================

        doc.fontSize(7).font("Helvetica-Bold").fillColor("#000000");
        doc.text("CONDITIONS GENERALES:", margin, yPos);
        yPos += 12;

        doc.fontSize(6).font("Helvetica").fillColor("#000000");
        GENERAL_CONDITIONS_LINES.forEach((line) => {
          doc.text(line, margin, yPos, {
            width: pageWidth,
          });
          yPos += 10;
        });

        // ============================================
        // THANK YOU MESSAGE
        // ============================================

        doc.fontSize(8).font("Helvetica-Bold").fillColor("#000000");
        doc.text("Merci de votre confiance!", margin, yPos, {
          align: "center",
          width: pageWidth,
        });
        yPos += 12;

        doc.fontSize(7).font("Helvetica").fillColor("#000000");
        doc.text("Conserver ce reçu pour référence.", margin, yPos, {
          align: "center",
          width: pageWidth,
        });

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
