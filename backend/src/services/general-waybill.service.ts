import { Repository } from "typeorm";
import { AppDataSource } from "../../db";
import { Departure } from "../entities/departure.entity";
import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

export class GeneralWaybillService {
  private departureRepo: Repository<Departure>;
  private storagePath: string;

  constructor() {
    this.departureRepo = AppDataSource.getRepository(Departure);
    // Storage path for PDFs
    this.storagePath = path.join(process.cwd(), "storage", "waybills");
    
    // Ensure storage directory exists
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * Generate next General Waybill Number in format: BG-YYYY-NNNN
   */
  async generateNext(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `BG-${currentYear}-`;

    const lastDeparture = await this.departureRepo
      .createQueryBuilder("departure")
      .where("departure.general_waybill_number LIKE :prefix", {
        prefix: `${prefix}%`,
      })
      .orderBy("departure.general_waybill_number", "DESC")
      .getOne();

    let nextNumber = 1;

    if (lastDeparture && lastDeparture.general_waybill_number) {
      const match = lastDeparture.general_waybill_number.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0], 10) + 1;
      }
    }

    return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
  }

  /**
   * Generate General Waybill PDF
   */
  async generatePDF(
    departure: Departure,
    shipments: any[]
  ): Promise<string> {
    console.log(`🔄 [PDF] Génération du nouveau PDF pour le départ #${departure.id} avec le nouveau design`);
    
    // Delete old PDF file if it exists to avoid cache issues
    if (departure.pdf_path && fs.existsSync(departure.pdf_path)) {
      try {
        fs.unlinkSync(departure.pdf_path);
        console.log(`🗑️  [PDF] Ancien fichier supprimé: ${departure.pdf_path}`);
      } catch (error) {
        console.warn(`⚠️  [PDF] Impossible de supprimer l'ancien fichier: ${error}`);
      }
    }
    
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const filename = `general-waybill-${departure.id}-${Date.now()}.pdf`;
    const filepath = path.join(this.storagePath, filename);
    
    console.log(`📄 [PDF] Création du nouveau fichier: ${filename}`);

    // Create write stream
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // ============================================
    // HEADER SECTION - Official Transport Document Style
    // ============================================
    let yPos = 50;

    // 1. COMPANY IDENTITY (Top Center)
    const pageWidth = 500; // A4 width minus margins (50*2 each side)
    
    // Company name in uppercase, centered, bold
    doc.fontSize(18).font("Helvetica-Bold").fillColor("#000000");
    const companyName = "TRANSCAM COLIS ET COURRIERS";
    doc.text(companyName, 50, yPos, { align: "center", width: pageWidth });
    
    yPos += 22;

    // Activity description line
    doc.fontSize(9).font("Helvetica").fillColor("#000000");
    const activityDesc = "Collecte – Traitement – Acheminement et Distribution de Colis et Courriers";
    doc.text(activityDesc, 50, yPos, { align: "center", width: pageWidth });
    
    yPos += 12;

    // Company address and contact (exact text as specified)
    doc.fontSize(7).font("Helvetica").fillColor("#000000");
    const companyInfo = "Siège social Mvan B.P 5633 Yaoundé - Tél : 677 891 404 / 697 06 63 50";
    doc.text(companyInfo, 50, yPos, { align: "center", width: pageWidth });
    
    yPos += 10;
    
    doc.fontSize(7).font("Helvetica").fillColor("#000000");
    const taxInfo = "N° contribuable : M0818164445-46P";
    doc.text(taxInfo, 50, yPos, { align: "center", width: pageWidth });
    
    yPos += 15;

    // 2. DOCUMENT TITLE (Centered, Bold)
    doc.fontSize(16).font("Helvetica-Bold").fillColor("#000000");
    doc.text("BORDEREAU D'EXPÉDITION", 50, yPos, { align: "center", width: pageWidth });
    
    yPos += 18;

    // General Waybill Number below title
    doc.fontSize(11).font("Helvetica").fillColor("#000000");
    const waybillNumber = departure.general_waybill_number || "N/A";
    doc.text(`N° : ${waybillNumber}`, 50, yPos, { align: "center", width: pageWidth });
    
    yPos += 20;

    // 3. DEPARTURE INFORMATION BLOCK (Three columns: Row 1 and Row 2)
    const infoBoxY = yPos;
    const infoBoxHeight = 50;
    const leftColX = 50;
    const labelValueGap = 3; // Petit espace entre label et valeur
    const rowHeight = 22;
    const underlineYOffset = 10; // Position of underline below value
    const columnGap = 10; // Espace réduit entre les colonnes pour tenir dans 500px
    const valueZoneWidth = 85; // Largeur réduite de la zone pour centrer les valeurs
    const infoBoxWidth = 500; // Même largeur que la table des détails (500 pixels)
    const rightBoundary = leftColX + infoBoxWidth; // Limite droite du rectangle (550)

    // Rectangle border removed - keeping same layout style without visible border

    // Extract values
    const departureDate = departure.sealed_at
      ? new Date(departure.sealed_at).toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "";
    
    const departureOffice = departure.route 
      ? departure.route.split("→")[0]?.trim() || departure.route.split("-")[0]?.trim() || "Yaoundé"
      : "Yaoundé";
    
    const destinationOffice = departure.route 
      ? (departure.route.includes("→") 
          ? departure.route.split("→")[1]?.trim() 
          : departure.route.split("-").pop()?.trim()) || ""
      : "";

    // Helper function to calculate text width (approximate)
    const getTextWidth = (text: string, fontSize: number) => {
      return text.length * (fontSize * 0.6); // Approximate width
    };

    // ROW 1: BUREAU DE DÉPART | BUREAU DESTINATAIRE | VÉHICULE
    let currentY = infoBoxY + 8;
    let currentX = leftColX;
    
    // Left column - Row 1
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#000000");
    const label1 = "BUREAU DE DÉPART";
    const label1Width = getTextWidth(label1, 8);
    doc.text(label1, currentX, currentY);
    
    // Value zone starts after label with small gap
    const value1ZoneX = currentX + label1Width + labelValueGap;
    doc.fontSize(7).font("Helvetica");
    // Center the value text in the zone
    doc.text(departureOffice, value1ZoneX, currentY, { width: valueZoneWidth, align: "center" });
    // Center the underline under the value
    const underline1Width = Math.max(80, getTextWidth(departureOffice, 7));
    const underline1StartX = value1ZoneX + (valueZoneWidth / 2) - (underline1Width / 2);
    doc.moveTo(underline1StartX, currentY + underlineYOffset).lineTo(underline1StartX + underline1Width, currentY + underlineYOffset).stroke();
    
    // Calculate next column position (end of value zone + space)
    let col1End = value1ZoneX + valueZoneWidth + columnGap;
    // Ensure we don't exceed the right boundary
    if (col1End + 200 > rightBoundary) {
      col1End = Math.min(col1End, rightBoundary - 200);
    }
    
    // Middle column - Row 1
    currentX = col1End;
    doc.fontSize(8).font("Helvetica-Bold");
    const label2 = "BUREAU DESTINATAIRE";
    const label2Width = getTextWidth(label2, 8);
    doc.text(label2, currentX, currentY);
    
    const value2ZoneX = currentX + label2Width + labelValueGap;
    doc.fontSize(7).font("Helvetica");
    // Center the value text in the zone
    doc.text(destinationOffice, value2ZoneX, currentY, { width: valueZoneWidth, align: "center" });
    // Center the underline under the value
    const underline2Width = Math.max(80, getTextWidth(destinationOffice, 7));
    const underline2StartX = value2ZoneX + (valueZoneWidth / 2) - (underline2Width / 2);
    doc.moveTo(underline2StartX, currentY + underlineYOffset).lineTo(underline2StartX + underline2Width, currentY + underlineYOffset).stroke();
    
    // Calculate next column position
    let col2End = value2ZoneX + valueZoneWidth + columnGap;
    // Ensure we don't exceed the right boundary
    if (col2End + 150 > rightBoundary) {
      col2End = Math.min(col2End, rightBoundary - 150);
    }
    
    // Right column - Row 1
    currentX = col2End;
    doc.fontSize(8).font("Helvetica-Bold");
    const label3 = "VÉHICULE";
    const label3Width = getTextWidth(label3, 8);
    doc.text(label3, currentX, currentY);
    
    const value3ZoneX = currentX + label3Width + labelValueGap;
    doc.fontSize(7).font("Helvetica");
    const vehicleValue = departure.vehicle ? departure.vehicle.registration_number : "";
    // Center the value text in the zone
    doc.text(vehicleValue, value3ZoneX, currentY, { width: valueZoneWidth, align: "center" });
    // Center the underline under the value
    const underline3Width = Math.max(80, getTextWidth(vehicleValue, 7));
    const underline3StartX = value3ZoneX + (valueZoneWidth / 2) - (underline3Width / 2);
    doc.moveTo(underline3StartX, currentY + underlineYOffset).lineTo(underline3StartX + underline3Width, currentY + underlineYOffset).stroke();

    // ROW 2: DATE DE DÉPART | CHAUFFEUR | HEURE
    currentY = infoBoxY + 8 + rowHeight;
    currentX = leftColX;
    
    // Left column - Row 2
    doc.fontSize(8).font("Helvetica-Bold");
    const label4 = "DATE DE DÉPART";
    const label4Width = getTextWidth(label4, 8);
    doc.text(label4, currentX, currentY);
    
    const value4ZoneX = currentX + label4Width + labelValueGap;
    doc.fontSize(7).font("Helvetica");
    // Center the value text in the zone
    doc.text(departureDate, value4ZoneX, currentY, { width: valueZoneWidth, align: "center" });
    // Center the underline under the value
    const underline4Width = Math.max(80, getTextWidth(departureDate, 7));
    const underline4StartX = value4ZoneX + (valueZoneWidth / 2) - (underline4Width / 2);
    doc.moveTo(underline4StartX, currentY + underlineYOffset).lineTo(underline4StartX + underline4Width, currentY + underlineYOffset).stroke();
    
    // Calculate next column position
    let col3End = value4ZoneX + valueZoneWidth + columnGap;
    // Ensure we don't exceed the right boundary
    if (col3End + 200 > rightBoundary) {
      col3End = Math.min(col3End, rightBoundary - 200);
    }
    
    // Middle column - Row 2
    currentX = col3End;
    doc.fontSize(8).font("Helvetica-Bold");
    const label5 = "CHAUFFEUR";
    const label5Width = getTextWidth(label5, 8);
    doc.text(label5, currentX, currentY);
    
    const value5ZoneX = currentX + label5Width + labelValueGap;
    doc.fontSize(7).font("Helvetica");
    const driverValue = departure.driver 
      ? `${departure.driver.first_name} ${departure.driver.last_name}` 
      : "";
    // Center the value text in the zone
    doc.text(driverValue, value5ZoneX, currentY, { width: valueZoneWidth, align: "center" });
    // Center the underline under the value
    const underline5Width = Math.max(80, getTextWidth(driverValue, 7));
    const underline5StartX = value5ZoneX + (valueZoneWidth / 2) - (underline5Width / 2);
    doc.moveTo(underline5StartX, currentY + underlineYOffset).lineTo(underline5StartX + underline5Width, currentY + underlineYOffset).stroke();
    
    // Calculate next column position
    let col4End = value5ZoneX + valueZoneWidth + columnGap;
    // Ensure we don't exceed the right boundary
    if (col4End + 150 > rightBoundary) {
      col4End = Math.min(col4End, rightBoundary - 150);
    }
    
    // Right column - Row 2
    currentX = col4End;
    doc.fontSize(8).font("Helvetica-Bold");
    const label6 = "HEURE";
    const label6Width = getTextWidth(label6, 8);
    doc.text(label6, currentX, currentY);
    
    const value6ZoneX = currentX + label6Width + labelValueGap;
    doc.fontSize(7).font("Helvetica");
    // Empty value for HEURE (to be filled manually) - centered in zone
    const underline6Width = 80;
    const underline6StartX = value6ZoneX + (valueZoneWidth / 2) - (underline6Width / 2);
    // Underline for empty value (centered)
    doc.moveTo(underline6StartX, currentY + underlineYOffset).lineTo(underline6StartX + underline6Width, currentY + underlineYOffset).stroke();

    yPos = infoBoxY + infoBoxHeight + 15;

    // Table headers with better spacing
    const tableTop = yPos;
    const colWidths = {
      waybill: 90,
      sender: 115,
      receiver: 115,
      description: 110,
      weight: 70, // Increased for "XX.XX kg" text
    };
    
    const tableStartX = 50;
    const tableWidth = 500; // Total width: 90+115+115+110+70 = 500
    const padding = 5;
    
    // Draw table header background (gray) with borders
    doc.rect(tableStartX, tableTop - 5, tableWidth, 18).fillAndStroke("#E5E7EB", "#000000");
    
    // Draw vertical lines for columns (header)
    let colX = tableStartX;
    doc.moveTo(colX, tableTop - 5).lineTo(colX, tableTop + 13).stroke();
    colX += colWidths.waybill;
    doc.moveTo(colX, tableTop - 5).lineTo(colX, tableTop + 13).stroke();
    colX += colWidths.sender;
    doc.moveTo(colX, tableTop - 5).lineTo(colX, tableTop + 13).stroke();
    colX += colWidths.receiver;
    doc.moveTo(colX, tableTop - 5).lineTo(colX, tableTop + 13).stroke();
    colX += colWidths.description;
    doc.moveTo(colX, tableTop - 5).lineTo(colX, tableTop + 13).stroke();
    colX += colWidths.weight;
    doc.moveTo(colX, tableTop - 5).lineTo(colX, tableTop + 13).stroke();
    
    // Header text with consistent padding
    doc.fontSize(9).font("Helvetica-Bold");
    doc.fillColor("#000000");
    
    // Calculate column start positions - all text centered
    let colStartX = tableStartX + padding;
    doc.text("N° Bordereau", colStartX, tableTop, { width: colWidths.waybill - padding * 2, align: "center" });
    
    colStartX += colWidths.waybill;
    doc.text("Expéditeur", colStartX + padding, tableTop, { width: colWidths.sender - padding * 2, align: "center" });
    
    colStartX += colWidths.sender;
    doc.text("Destinataire", colStartX + padding, tableTop, { width: colWidths.receiver - padding * 2, align: "center" });
    
    colStartX += colWidths.receiver;
    doc.text("Description", colStartX + padding, tableTop, { width: colWidths.description - padding * 2, align: "center" });
    
    colStartX += colWidths.description;
    doc.text("Poids", colStartX + padding, tableTop, { width: colWidths.weight - padding * 2, align: "center" });

    yPos = tableTop + 18;

    // Shipments rows
    doc.fontSize(8).font("Helvetica");
    let totalAmount = 0;
    let totalWeight = 0;
    let parcelCount = 0;

    // Format numbers with spaces for thousands
    const formatNumber = (num: number) => {
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    for (const shipment of shipments) {
      if (yPos > 680) {
        // New page if needed
        doc.addPage();
        yPos = 50;
        
        // Redraw table header on new page
        const newTableTop = yPos;
        doc.rect(tableStartX, newTableTop - 5, tableWidth, 18).fillAndStroke("#E5E7EB", "#000000");
        
        // Draw vertical lines for columns on new page
        colX = tableStartX;
        doc.moveTo(colX, newTableTop - 5).lineTo(colX, newTableTop + 13).stroke();
        colX += colWidths.waybill;
        doc.moveTo(colX, newTableTop - 5).lineTo(colX, newTableTop + 13).stroke();
        colX += colWidths.sender;
        doc.moveTo(colX, newTableTop - 5).lineTo(colX, newTableTop + 13).stroke();
        colX += colWidths.receiver;
        doc.moveTo(colX, newTableTop - 5).lineTo(colX, newTableTop + 13).stroke();
        colX += colWidths.description;
        doc.moveTo(colX, newTableTop - 5).lineTo(colX, newTableTop + 13).stroke();
        colX += colWidths.weight;
        doc.moveTo(colX, newTableTop - 5).lineTo(colX, newTableTop + 13).stroke();
        
        doc.fontSize(9).font("Helvetica-Bold");
        doc.fillColor("#000000");
        
        // Calculate column start positions for new page header - all text centered
        let newColStartX = tableStartX + padding;
        doc.text("N° Bordereau", newColStartX, newTableTop, { width: colWidths.waybill - padding * 2, align: "center" });
        
        newColStartX += colWidths.waybill;
        doc.text("Expéditeur", newColStartX + padding, newTableTop, { width: colWidths.sender - padding * 2, align: "center" });
        
        newColStartX += colWidths.sender;
        doc.text("Destinataire", newColStartX + padding, newTableTop, { width: colWidths.receiver - padding * 2, align: "center" });
        
        newColStartX += colWidths.receiver;
        doc.text("Description", newColStartX + padding, newTableTop, { width: colWidths.description - padding * 2, align: "center" });
        
        newColStartX += colWidths.description;
        doc.text("Poids", newColStartX + padding, newTableTop, { width: colWidths.weight - padding * 2, align: "center" });
        yPos = newTableTop + 18;
        doc.fontSize(8).font("Helvetica");
      }

      const amount = parseFloat(shipment.price.toString());
      const weight = parseFloat(shipment.weight.toString());
      totalAmount += amount;
      totalWeight += weight;
      parcelCount++;

      const rowY = yPos;
      const rowHeight = 15;

      // Draw row background (alternating gray for better readability)
      if (parcelCount % 2 === 0) {
        doc.rect(tableStartX, rowY - 3, tableWidth, rowHeight).fill("#F9FAFB");
      }

      // Draw vertical lines for each row (aligned with header)
      colX = tableStartX;
      doc.moveTo(colX, rowY - 3).lineTo(colX, rowY + rowHeight - 3).stroke();
      colX += colWidths.waybill;
      doc.moveTo(colX, rowY - 3).lineTo(colX, rowY + rowHeight - 3).stroke();
      colX += colWidths.sender;
      doc.moveTo(colX, rowY - 3).lineTo(colX, rowY + rowHeight - 3).stroke();
      colX += colWidths.receiver;
      doc.moveTo(colX, rowY - 3).lineTo(colX, rowY + rowHeight - 3).stroke();
      colX += colWidths.description;
      doc.moveTo(colX, rowY - 3).lineTo(colX, rowY + rowHeight - 3).stroke();
      colX += colWidths.weight;
      doc.moveTo(colX, rowY - 3).lineTo(colX, rowY + rowHeight - 3).stroke();

      // Data text with consistent padding - all text centered
      doc.fillColor("#000000");
      
      // First column: start at tableStartX + padding
      let dataColStartX = tableStartX + padding;
      doc.text(shipment.waybill_number || "N/A", dataColStartX, rowY, { width: colWidths.waybill - padding * 2, align: "center" });
      
      // Subsequent columns: add column width, then add padding for left margin
      dataColStartX += colWidths.waybill;
      doc.text(shipment.sender_name || "N/A", dataColStartX + padding, rowY, { width: colWidths.sender - padding * 2, align: "center" });
      
      dataColStartX += colWidths.sender;
      doc.text(shipment.receiver_name || "N/A", dataColStartX + padding, rowY, { width: colWidths.receiver - padding * 2, align: "center" });
      
      dataColStartX += colWidths.receiver;
      doc.text(shipment.description || "-", dataColStartX + padding, rowY, { width: colWidths.description - padding * 2, align: "center" });
      
      // Last column (Poids): centered like all other columns
      dataColStartX += colWidths.description;
      doc.text(weight.toFixed(2) + " kg", dataColStartX + padding, rowY, { width: colWidths.weight - padding * 2, align: "center" });

      // Draw row separator line (bottom border)
      doc.moveTo(tableStartX, rowY + rowHeight - 3).lineTo(tableStartX + tableWidth, rowY + rowHeight - 3).stroke();

      yPos += rowHeight;
    }
    
    // Draw final right border (from header top to last row bottom)
    doc.moveTo(tableStartX + tableWidth, tableTop - 5).lineTo(tableStartX + tableWidth, yPos - 3).stroke();

    yPos += 20;

    // Signature areas
    if (yPos > 650) {
      doc.addPage();
      yPos = 50;
    }

    doc.fontSize(11).font("Helvetica-Bold").text("SIGNATURES", 50, yPos);
    yPos += 20;

    // Agent signature
    doc.fontSize(9).font("Helvetica").text("Agent:", 50, yPos);
    doc.moveTo(50, yPos + 20).lineTo(250, yPos + 20).stroke();
    doc.fontSize(8).fillColor("#666666").text("Nom et signature", 50, yPos + 25);

    // Driver signature
    doc.fillColor("#000000").fontSize(9).font("Helvetica").text("Chauffeur:", 300, yPos);
    doc.moveTo(300, yPos + 20).lineTo(500, yPos + 20).stroke();
    doc.fontSize(8).fillColor("#666666").text("Nom et signature", 300, yPos + 25);

    // Notes
    if (departure.notes) {
      yPos += 60;
      if (yPos > 680) {
        doc.addPage();
        yPos = 50;
      }
      doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold").text("REMARQUES", 50, yPos);
      doc.fontSize(9).font("Helvetica").text(departure.notes, 50, yPos + 15, { width: 500 });
    }

    // Finalize PDF
    doc.end();

    // Wait for stream to finish
    return new Promise((resolve, reject) => {
      stream.on("finish", () => {
        console.log(`✅ [PDF] PDF généré avec succès: ${filepath}`);
        resolve(filepath);
      });
      stream.on("error", (error) => {
        console.error(`❌ [PDF] Erreur lors de la génération: ${error}`);
        reject(error);
      });
    });
  }
}

