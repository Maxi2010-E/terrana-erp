import { existsSync } from "node:fs";

import PDFDocument from "pdfkit";

import { TERRANA_LOGO_PATH } from "@/lib/brand";
import type { WasteSlipData } from "@/lib/waste/waste-slip-types";
import { terranaColors } from "@/lib/theme";

const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#cbd5e1";
const STRIPE = "#f8fafc";
const BRAND = terranaColors.brand;

const MARGIN = 48;
const PAGE_WIDTH = 595;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function formatKg(value: number): string {
  return `${value.toLocaleString("en-GB")} kg`;
}

function formatLoadLine(line: {
  numberOfBags: number;
  kgPerBag: number | null;
  extraKg: number;
}): string {
  if (line.numberOfBags <= 0) {
    return line.extraKg > 0 ? `${formatKg(line.extraKg)} (extra only)` : "—";
  }

  const parts = [`${line.numberOfBags} bag(s)`];
  if (line.kgPerBag != null && line.kgPerBag > 0) {
    parts.push(`${line.kgPerBag} kg/bag`);
  }
  if (line.extraKg > 0) {
    parts.push(`${line.extraKg} kg extra`);
  }

  return parts.join(" · ");
}

export function generateWasteSlipPdf(data: WasteSlipData): Promise<Buffer> {
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
      ["Processing date", data.processingDate],
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
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(22).text("Waste collection slip", MARGIN, y);
    y += 26;
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(10)
      .text(
        "Official record of waste collected from a completed processing session — broken flower, bulb, fungus, and other categories.",
        MARGIN,
        y,
        { width: CONTENT_WIDTH - 200 },
      );

    y += 34;
    doc.moveTo(MARGIN, y).lineTo(right, y).lineWidth(2).strokeColor(BRAND).stroke();
    y += 22;

    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text("SOURCE SESSION", MARGIN, y);
    y += 16;

    const sourceRows = [
      ["Session", data.sessionNumber],
      ["Batch", data.batchNumber],
      ["Supplier", data.supplierName],
      ["Product type", data.productType],
      ["Bags sent", String(data.bagsSent)],
      ["Input kg", formatKg(data.inputKg)],
      [
        "Export output",
        data.outputKg != null ? formatKg(data.outputKg) : "—",
      ],
      [
        "Yield",
        data.yieldPct != null ? `${data.yieldPct}%` : "—",
      ],
      ["Processed by", data.processedByLabel ?? "—"],
    ] as const;

    for (const [label, value] of sourceRows) {
      doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(label, MARGIN, y, { width: 120 });
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(9).text(value, MARGIN + 124, y, {
        width: CONTENT_WIDTH - 124,
      });
      y += 16;
    }

    y += 10;
    const colType = 130;
    const colLoad = CONTENT_WIDTH - colType - 72;
    const colKg = 72;
    const tableTop = y;

    doc.save();
    doc.rect(MARGIN, y, CONTENT_WIDTH, 22).fill(BRAND);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9).text("WASTE COLLECTED", MARGIN + 10, y + 7);
    doc.restore();
    y += 22;

    doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED);
    doc.text("Category", MARGIN + 8, y + 6, { width: colType });
    doc.text("Load", MARGIN + colType + 8, y + 6, { width: colLoad });
    doc.text("Total kg", MARGIN + colType + colLoad, y + 6, {
      width: colKg - 8,
      align: "right",
    });
    y += 20;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_WIDTH, y).strokeColor(BORDER).lineWidth(1).stroke();

    for (const [index, line] of data.lines.entries()) {
      y += 8;
      if (index % 2 === 0) {
        doc.rect(MARGIN, y - 2, CONTENT_WIDTH, 24).fill(STRIPE);
      }
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(9).text(line.label, MARGIN + 8, y, {
        width: colType,
      });
      doc
        .fillColor(MUTED)
        .font("Helvetica")
        .fontSize(8)
        .text(formatLoadLine(line), MARGIN + colType + 8, y, { width: colLoad });
      doc
        .fillColor(INK)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(formatKg(line.weightKg), MARGIN + colType + colLoad, y, {
          width: colKg - 8,
          align: "right",
        });
      y += 22;
    }

    y += 4;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_WIDTH, y).strokeColor(BORDER).lineWidth(1).stroke();
    y += 10;
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(9).text("Total waste collected", MARGIN + colType + 8, y, {
      width: colLoad,
    });
    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(formatKg(data.totalWasteKg), MARGIN + colType + colLoad, y, {
        width: colKg - 8,
        align: "right",
      });
    doc.rect(MARGIN, tableTop, CONTENT_WIDTH, y + 18 - tableTop).strokeColor(BORDER).lineWidth(1).stroke();

    y += 36;
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(8)
      .text(
        "This slip documents waste separated during processing. Retain for traceability, stocktake, and disposal records. Disposal actions are recorded separately in waste management.",
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
