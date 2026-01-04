import PDFDocument from "pdfkit";
import { Shipment } from "../entities/shipment.entity";

export class ReceiptService {
  /**
   * Generate Receipt PDF for a shipment
   */
  async generatePDF(shipment: Shipment): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      // Collect PDF data
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Agency Information (Header)
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("TRANSCAM", 50, 50, { align: "center" });
      doc
        .fontSize(12)
        .font("Helvetica")
        .text("Système de Messagerie", 50, 75, { align: "center" });

      // Title
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("REÇU DE PAIEMENT", 50, 120, { align: "center" });
      doc.moveDown();

      // Receipt Number
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(`N° Reçu: ${shipment.waybill_number}`, 50, 160);

      // Creation Date
      const createdDate = shipment.created_at
        ? new Date(shipment.created_at).toLocaleDateString("fr-FR")
        : "N/A";
      doc.fontSize(10).font("Helvetica").text(`Date: ${createdDate}`, 50, 180);
      doc.moveDown();

      // Payment Information
      let yPos = 220;
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("INFORMATIONS DE PAIEMENT:", 50, yPos);
      yPos += 25;

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `Montant payé: ${parseFloat(shipment.price.toString()).toFixed(2)} FCFA`,
          50,
          yPos
        );
      yPos += 20;

      // Sender Information
      doc.fontSize(12).font("Helvetica-Bold").text("EXPÉDITEUR:", 50, yPos);
      yPos += 20;
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Nom: ${shipment.sender_name}`, 50, yPos);
      yPos += 15;
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Téléphone: ${shipment.sender_phone}`, 50, yPos);
      yPos += 30;

      // Receiver Information
      doc.fontSize(12).font("Helvetica-Bold").text("DESTINATAIRE:", 50, yPos);
      yPos += 20;
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Nom: ${shipment.receiver_name}`, 50, yPos);
      yPos += 15;
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Téléphone: ${shipment.receiver_phone}`, 50, yPos);
      yPos += 30;

      // Parcel Information
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("INFORMATIONS DU COLIS:", 50, yPos);
      yPos += 20;

      if (shipment.description) {
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`Description: ${shipment.description}`, 50, yPos);
        yPos += 15;
      }

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `Poids: ${parseFloat(shipment.weight.toString()).toFixed(2)} kg`,
          50,
          yPos
        );
      yPos += 15;
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Route: ${shipment.route}`, 50, yPos);
      yPos += 30;

      // Payment Confirmation
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("✓ Paiement reçu et confirmé", 50, yPos);
      yPos += 40;

      // Signature Area
      doc.fontSize(10).font("Helvetica-Bold").text("SIGNATURE:", 50, yPos);
      yPos += 20;
      doc.moveTo(50, yPos).lineTo(250, yPos).stroke();
      doc.fontSize(8).text("Agent TRANSCAM", 50, yPos + 5);

      // Footer
      const pageHeight = doc.page.height;
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          "Ce reçu est généré automatiquement par le système TRANSCAM",
          50,
          pageHeight - 50,
          { align: "center" }
        );

      // Finalize PDF
      doc.end();
    });
  }
}
