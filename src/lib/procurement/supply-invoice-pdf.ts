import { existsSync } from "node:fs";

import PDFDocument from "pdfkit";

import { TERRANA_LOGO_PATH } from "@/lib/brand";
import { formatNaira } from "@/lib/currency";
import type { SupplyInvoiceData } from "@/lib/procurement/supply-invoice-types";
import { terranaColors } from "@/lib/theme";

const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#cbd5e1";
const STRIPE = "#f8fafc";
const BRAND = terranaColors.brand;

const MARGIN = 48;
const PAGE_WIDTH = 595;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function drawLineItems(
  doc: InstanceType<typeof PDFDocument>,
  rows: Array<{ label: string; value: string }>,
  startY: number,
): number {
  let y = startY;
  const colLabel = CONTENT_WIDTH * 0.55;
  const colValue = CONTENT_WIDTH - colLabel;

  doc.save();
  doc.rect(MARGIN, y, CONTENT_WIDTH, 22).fill(BRAND);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9).text("SUPPLY DETAILS", MARGIN + 10, y + 7);
  doc.restore();
  y += 22;

  for (const [index, row] of rows.entries()) {
    if (index % 2 === 0) {
      doc.rect(MARGIN, y, CONTENT_WIDTH, 24).fill(STRIPE);
    }
    doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(row.label, MARGIN + 10, y + 8, {
      width: colLabel - 20,
    });
    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(row.value, MARGIN + colLabel, y + 8, { width: colValue - 10, align: "right" });
    y += 24;
  }

  doc.rect(MARGIN, startY, CONTENT_WIDTH, y - startY).strokeColor(BORDER).lineWidth(1).stroke();
  return y + 12;
}

export function generateSupplyInvoicePdf(data: SupplyInvoiceData): Promise<Buffer> {
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
      ["Procurement date", data.procurementDate],
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
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(22).text("Supply Invoice", MARGIN, y);
    y += 26;
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(10)
      .text(
        "Official record of approved raw material supply received from the named supplier.",
        MARGIN,
        y,
        { width: CONTENT_WIDTH - 200 },
      );

    y += 34;
    doc.moveTo(MARGIN, y).lineTo(right, y).lineWidth(2).strokeColor(BRAND).stroke();
    y += 22;

    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text("SUPPLIER", MARGIN, y);
    y += 16;
    const supplierLines = [
      data.supplierName,
      data.supplierCode,
      data.supplierAddress,
      data.supplierPhone,
    ].filter((line): line is string => Boolean(line?.trim()));

    for (const line of supplierLines) {
      doc.fillColor(INK).font("Helvetica").fontSize(10).text(line, MARGIN, y);
      y += 14;
    }

    y += 10;
    const detailRows: Array<{ label: string; value: string }> = [
      { label: "Batch number", value: data.batchNumberDisplay },
      { label: "Procurement type", value: data.procurementTypeLabel },
      { label: "Product type", value: data.productType },
    ];

    if (data.productConditionLabel) {
      detailRows.push({ label: "Condition", value: data.productConditionLabel });
    }
    if (data.productAgeLabel) {
      detailRows.push({ label: "Age", value: data.productAgeLabel });
    }
    if (data.productColorLabel) {
      detailRows.push({ label: "Colour", value: data.productColorLabel });
    }
    if (data.mixedTypeLabel) {
      detailRows.push({ label: "Mixed type", value: data.mixedTypeLabel });
    }

    detailRows.push(
      { label: "Number of bags", value: String(data.numberOfBags) },
      {
        label: "Kg per bag",
        value: data.kgPerBag != null ? `${data.kgPerBag} kg` : "—",
      },
      { label: "Extra kg", value: `${data.extraKg.toLocaleString()} kg` },
      { label: "Total kg", value: `${data.totalKg.toLocaleString()} kg` },
      { label: "Quality decision", value: data.qualityDecisionLabel },
      { label: "Payment status", value: data.paymentStatusLabel },
    );

    if (data.showPricing && data.unitPrice != null && data.totalValue != null) {
      detailRows.push(
        { label: "Unit price", value: formatNaira(data.unitPrice) },
        { label: "Total value", value: formatNaira(data.totalValue) },
      );
    }

    y = drawLineItems(doc, detailRows, y);

    const approvalHeight = 48;
    doc.rect(MARGIN, y, CONTENT_WIDTH, approvalHeight).strokeColor(BORDER).lineWidth(1).stroke();
    doc.fillColor(MUTED).font("Helvetica").fontSize(8).text("APPROVED BY", MARGIN + 14, y + 12);
    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(data.approvedByName ?? "—", MARGIN + 14, y + 24);
    doc.fillColor(MUTED).font("Helvetica").fontSize(8).text("APPROVED AT", MARGIN + CONTENT_WIDTH / 2, y + 12);
    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(data.approvedAtLabel ?? "—", MARGIN + CONTENT_WIDTH / 2, y + 24);
    y += approvalHeight + 16;

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

    y += 8;
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(8)
      .text(
        "This invoice documents approved supply received into Terrana operations. Use for procurement records, inventory traceability, and supplier reconciliation.",
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
