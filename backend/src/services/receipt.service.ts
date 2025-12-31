import PDFDocument from "pdfkit";
import { Shipment } from "../entities/shipment.entity";

export class ReceiptService {
  /**
   * Generate Receipt PDF for a shipment (Ticket format 80mm)
   */
  async generatePDF(shipment: Shipment): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // Ticket dimensions: 80mm width (226.77 points)
      // Height is variable, minimum ~400 points
      const ticketWidth = 226.77; // 80mm in points
      const margin = 10;
      const contentWidth = ticketWidth - (margin * 2);

      const doc = new PDFDocument({
        size: [ticketWidth, 600], // Width fixed, height will adjust
        margins: { top: 5, bottom: 5, left: margin, right: margin },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      let yPos = 5;

      // Helper function to format currency
      const formatCurrency = (amount: number): string => {
        // Format manuel avec espaces pour éviter les problèmes de rendu PDF
        const formatted = Math.round(amount).toString();
        return formatted.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      };

      // Helper function to format date
      const formatDate = (date: Date | string): string => {
        const d = typeof date === "string" ? new Date(date) : date;
        return d.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      };

      // Determine departure date
      let departureDate: Date;
      if (shipment.departure && shipment.departure.created_at) {
        departureDate = new Date(shipment.departure.created_at);
      } else {
        departureDate = new Date(shipment.created_at);
      }

      // ===== HEADER =====
      doc
        .fontSize(14)
        .font("Courier-Bold")
        .text("TRANSCAM COLIS ET COURRIER", margin, yPos, {
          align: "center",
          width: contentWidth,
        });
      yPos += 20;

      // Logo placeholder (empty rectangle for future logo)
      const logoHeight = 30;
      const logoWidth = 60;
      const logoX = (ticketWidth - logoWidth) / 2;
      doc
        .rect(logoX, yPos, logoWidth, logoHeight)
        .strokeColor("#CCCCCC")
        .stroke();
      yPos += logoHeight + 10;

      // Company information
      doc.fontSize(8).font("Courier").text(
        "Siège social: Mvan B.P 5633 Yaoundé",
        margin,
        yPos,
        { align: "center", width: contentWidth }
      );
      yPos += 12;

      doc.text(
        "Tél: 677 891 404 / 697 06 63 50",
        margin,
        yPos,
        { align: "center", width: contentWidth }
      );
      yPos += 12;

      doc.text(
        "N° contribuable: M0818164445-46P",
        margin,
        yPos,
        { align: "center", width: contentWidth }
      );
      yPos += 15;

      // Separator line
      doc
        .moveTo(margin, yPos)
        .lineTo(ticketWidth - margin, yPos)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();
      yPos += 10;

      // ===== RECEIPT NUMBER =====
      doc.fontSize(10).font("Courier").text("RECU EXPEDITION N°", margin, yPos, {
        align: "center",
        width: contentWidth,
      });
      yPos += 12;

      doc
        .fontSize(12)
        .font("Courier-Bold")
        .text(shipment.waybill_number, margin, yPos, {
          align: "center",
          width: contentWidth,
        });
      yPos += 15;

      // Separator line
      doc
        .moveTo(margin, yPos)
        .lineTo(ticketWidth - margin, yPos)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();
      yPos += 10;

      // ===== SENDER INFORMATION =====
      doc.fontSize(9).font("Courier-Bold").text("EXPEDITEUR", margin, yPos);
      yPos += 12;

      doc.fontSize(8).font("Courier").text(`  Nom: ${shipment.sender_name}`, margin, yPos);
      yPos += 10;

      doc.text(`  Tel: ${shipment.sender_phone}`, margin, yPos);
      yPos += 12;

      // ===== RECIPIENT INFORMATION =====
      doc.fontSize(9).font("Courier-Bold").text("DESTINATAIRE", margin, yPos);
      yPos += 12;

      doc.fontSize(8).font("Courier").text(`  Nom: ${shipment.receiver_name}`, margin, yPos);
      yPos += 10;

      doc.text(`  Tel: ${shipment.receiver_phone}`, margin, yPos);
      yPos += 12;

      // Separator line
      doc
        .moveTo(margin, yPos)
        .lineTo(ticketWidth - margin, yPos)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();
      yPos += 10;

      // ===== SHIPMENT DETAILS =====
      doc.fontSize(8).font("Courier");

      // Route
      doc.text(`TRAJET: ${shipment.route}`, margin, yPos);
      yPos += 10;

      // Nature
      const natureText =
        shipment.nature === "colis" ? "Colis" : "Courrier";
      doc.text(`NATURE: ${natureText}`, margin, yPos);
      yPos += 10;

      // Weight
      doc.text(`POIDS: ${shipment.weight} kg`, margin, yPos);
      yPos += 10;

      // Declared value
      doc.text(
        `VALEUR DECLAREE: ${formatCurrency(shipment.declared_value)} FCFA`,
        margin,
        yPos
      );
      yPos += 10;

      // Amount
      doc
        .font("Courier-Bold")
        .text(
          `MONTANT: ${formatCurrency(shipment.price)} FCFA`,
          margin,
          yPos
        );
      yPos += 10;

      // Description (if available)
      if (shipment.description) {
        doc.font("Courier");
        doc.text(`DESCRIPTION: ${shipment.description}`, margin, yPos);
        yPos += 10;
      }

      yPos += 5;

      // Separator line
      doc
        .moveTo(margin, yPos)
        .lineTo(ticketWidth - margin, yPos)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();
      yPos += 10;

      // ===== TRANSACTION INFORMATION =====
      doc.fontSize(8).font("Courier");

      // Departure date
      doc.text(`Date de départ: ${formatDate(departureDate)}`, margin, yPos);
      yPos += 10;

      // Created by
      if (shipment.created_by && shipment.created_by.username) {
        doc.text(`Créé par: ${shipment.created_by.username}`, margin, yPos);
        yPos += 10;
      }

      // Status
      doc.text("Statut: Confirmé", margin, yPos);
      yPos += 12;

      // Separator line
      doc
        .moveTo(margin, yPos)
        .lineTo(ticketWidth - margin, yPos)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();
      yPos += 10;

      // ===== TERMS AND CONDITIONS =====
      doc.fontSize(7).font("Courier");
      doc.text("CONDITIONS GENERALES:", margin, yPos);
      yPos += 10;

      const termsText =
        "En cas de perte ou d'avarie,\n" +
        "TRANSCAM s'engage à dédommager\n" +
        "selon les conditions contractuelles.\n" +
        "La valeur déclarée doit être\n" +
        "indiquée au moment du dépôt.";

      doc.text(termsText, margin, yPos, {
        width: contentWidth,
        align: "left",
      });
      yPos += 35;

      // Separator line
      doc
        .moveTo(margin, yPos)
        .lineTo(ticketWidth - margin, yPos)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();
      yPos += 10;

      // ===== FOOTER MESSAGE =====
      doc.fontSize(8).font("Courier");
      doc.text("Merci de votre confiance!", margin, yPos, {
        align: "center",
        width: contentWidth,
      });
      yPos += 10;

      doc.text("Conservez ce reçu pour", margin, yPos, {
        align: "center",
        width: contentWidth,
      });

      // Finalize PDF - no extra space or separator after last line
      doc.end();
    });
  }
}



