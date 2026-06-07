import { existsSync } from "node:fs";

import PDFDocument from "pdfkit";

import { TERRANA_LOGO_PATH } from "@/lib/brand";
import { formatNaira } from "@/lib/currency";
import type { PaymentReceiptData } from "@/lib/payments/payment-receipt-types";
import { terranaColors } from "@/lib/theme";

const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#cbd5e1";
const BRAND = terranaColors.brand;

const MARGIN = 48;
const PAGE_WIDTH = 595;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function drawInfoGrid(
  doc: InstanceType<typeof PDFDocument>,
  title: string,
  rows: Array<[string, string]>,
  startY: number,
): number {
  const right = PAGE_WIDTH - MARGIN;
  let y = startY;

  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text(title, MARGIN, y);
  y += 16;

  const cols = 3;
  const cellGap = 8;
  const cellWidth = (CONTENT_WIDTH - cellGap * (cols - 1)) / cols;

  for (let index = 0; index < rows.length; index += cols) {
    for (let col = 0; col < cols; col += 1) {
      const item = rows[index + col];
      if (!item) continue;
      const cellX = MARGIN + col * (cellWidth + cellGap);
      doc.rect(cellX, y, cellWidth, 42).strokeColor(BORDER).lineWidth(1).stroke();
      doc.fillColor(MUTED).font("Helvetica").fontSize(7).text(item[0].toUpperCase(), cellX + 8, y + 8, {
        width: cellWidth - 16,
      });
      doc
        .fillColor(INK)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(item[1], cellX + 8, y + 20, { width: cellWidth - 16 });
    }
    y += 50;
  }

  return y + 4;
}

export function generatePaymentReceiptPdf(
  data: PaymentReceiptData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN });
    const chunks: Buffer[] = [];
    const right = PAGE_WIDTH - MARGIN;

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    let y = MARGIN;
    const logoWidth = 160;
    const logoHeight = Math.round(logoWidth * (200 / 404));

    if (existsSync(TERRANA_LOGO_PATH)) {
      doc.image(TERRANA_LOGO_PATH, MARGIN, y, { width: logoWidth, height: logoHeight });
    }

    const metaX = right - 190;
    const metaLines = [
      ["Payment date", data.paymentDate],
      ["Reference", data.reference],
      ["Status", data.statusLabel],
    ] as const;

    let metaY = MARGIN;
    for (const [label, value] of metaLines) {
      doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(label.toUpperCase(), metaX, metaY, {
        width: 190,
        align: "right",
      });
      doc
        .fillColor(INK)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(value, metaX, metaY + 11, { width: 190, align: "right" });
      metaY += 28;
    }

    y = Math.max(y + logoHeight + 12, metaY) + 6;
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(22).text("Payment Receipt", MARGIN, y);
    y += 26;
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(10)
      .text(
        "Official confirmation of an approved supplier payment against a procurement batch.",
        MARGIN,
        y,
        { width: CONTENT_WIDTH - 200 },
      );

    y += 34;
    doc.moveTo(MARGIN, y).lineTo(right, y).lineWidth(2).strokeColor(BRAND).stroke();
    y += 22;

    const supplierRows: Array<[string, string]> = [
      ["Supplier", data.supplierName],
      ["Supplier code", data.supplierCode],
      ["Address", data.supplierAddress ?? "—"],
      ["Phone", data.supplierPhone ?? "—"],
    ];
    y = drawInfoGrid(doc, "SUPPLIER", supplierRows, y);

    const paymentRows: Array<[string, string]> = [
      ["Amount paid", formatNaira(data.amount)],
      ["Payment method", data.paymentMethodLabel],
      ["Payout account", data.payoutAccountLabel ?? "—"],
      ["Recorded by", data.recordedByName ?? "—"],
      ["Approved by", data.approvedByName ?? "—"],
      ["Approved at", data.approvedAtLabel ?? "—"],
    ];
    y = drawInfoGrid(doc, "PAYMENT DETAILS", paymentRows, y + 8);

    const batchRows: Array<[string, string]> = [
      ["Batch", data.batchNumberDisplay],
      ["Product type", data.productType],
      ["Batch value", formatNaira(data.batchValue)],
      ["Total paid", formatNaira(data.paidTotal)],
      ["Outstanding", formatNaira(data.outstanding)],
    ];
    y = drawInfoGrid(doc, "LINKED BATCH", batchRows, y + 8);

    const summaryHeight = 58;
    doc.rect(MARGIN, y + 8, CONTENT_WIDTH, summaryHeight).fill(BRAND);
    doc.fillColor("#ffffff").font("Helvetica").fontSize(8).text("AMOUNT RECEIVED", MARGIN + 14, y + 26);
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .text(formatNaira(data.amount), MARGIN + 14, y + 40, { width: CONTENT_WIDTH - 28 });

    y += summaryHeight + 36;

    if (data.notes) {
      doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text("NOTES", MARGIN, y);
      y += 14;
      doc
        .roundedRect(MARGIN, y, CONTENT_WIDTH, 42, 6)
        .dash(3, { space: 4 })
        .strokeColor(BORDER)
        .lineWidth(1)
        .stroke()
        .undash();
      doc
        .fillColor(INK)
        .font("Helvetica")
        .fontSize(9)
        .text(data.notes, MARGIN + 14, y + 14, { width: CONTENT_WIDTH - 28 });
      y += 58;
    }

    y += 12;
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(8)
      .text(
        "This receipt confirms an approved payment recorded in Terrana Operations. Retain for supplier reconciliation and audit purposes.",
        MARGIN,
        y,
        { width: CONTENT_WIDTH, lineGap: 2 },
      );
    y += 28;
    doc.text(`Generated ${data.generatedAtLabel}`, MARGIN, y);
    doc.text("Terrana Africa Operations System", MARGIN, y, {
      width: CONTENT_WIDTH,
      align: "right",
    });

    doc.end();
  });
}
