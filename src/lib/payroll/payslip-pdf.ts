import { existsSync } from "node:fs";

import PDFDocument from "pdfkit";

import { TERRANA_LOGO_PATH } from "@/lib/brand";
import { formatNaira } from "@/lib/currency";
import { buildPayslipLayout } from "@/lib/payroll/payslip-layout";
import type { PayslipData } from "@/lib/payroll/payslip-types";
import { terranaColors } from "@/lib/theme";

const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#cbd5e1";
const STRIPE = "#f8fafc";
const DEDUCTION = "#b91c1c";
const BRAND = terranaColors.brand;

const MARGIN = 48;
const PAGE_WIDTH = 595;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function drawTable(
  doc: InstanceType<typeof PDFDocument>,
  options: {
    title: string;
    x: number;
    y: number;
    width: number;
    rows: Array<{ number: number; label: string; amount: number }>;
    totalLabel: string;
    totalAmount: number;
    emptyLabel: string;
    amountColor?: string;
  },
): number {
  const { title, x, y, width, rows, totalLabel, totalAmount, emptyLabel, amountColor } =
    options;
  const colNo = 24;
  const colAmount = 78;
  const colDesc = width - colNo - colAmount;

  doc.save();
  doc.rect(x, y, width, 22).fill(BRAND);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9).text(title.toUpperCase(), x + 10, y + 7);
  doc.restore();

  let rowY = y + 22;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED);
  doc.text("#", x + 8, rowY + 6, { width: colNo });
  doc.text("Description", x + colNo + 8, rowY + 6, { width: colDesc });
  doc.text("Amount", x + width - colAmount - 8, rowY + 6, { width: colAmount - 8, align: "right" });
  rowY += 20;
  doc.moveTo(x, rowY).lineTo(x + width, rowY).strokeColor(BORDER).lineWidth(1).stroke();

  if (rows.length === 0) {
    rowY += 12;
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(emptyLabel, x + 10, rowY, {
      width: width - 20,
      align: "center",
    });
    rowY += 28;
  } else {
    for (const [index, row] of rows.entries()) {
      rowY += 8;
      if (index % 2 === 0) {
        doc.rect(x, rowY - 2, width, 22).fill(STRIPE);
      }
      doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(String(row.number), x + 8, rowY, {
        width: colNo,
      });
      doc.fillColor(INK).font("Helvetica").fontSize(9).text(row.label, x + colNo + 8, rowY, {
        width: colDesc,
      });
      doc
        .fillColor(amountColor ?? INK)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(formatNaira(row.amount), x + width - colAmount - 8, rowY, {
          width: colAmount - 8,
          align: "right",
        });
      rowY += 22;
    }
  }

  rowY += 4;
  doc.moveTo(x, rowY).lineTo(x + width, rowY).strokeColor(BORDER).lineWidth(1).stroke();
  rowY += 10;
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(9).text(totalLabel, x + colNo + 8, rowY, {
    width: colDesc,
  });
  doc
    .fillColor(amountColor ?? INK)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(formatNaira(totalAmount), x + width - colAmount - 8, rowY, {
      width: colAmount - 8,
      align: "right",
    });

  doc.rect(x, y, width, rowY + 18 - y).strokeColor(BORDER).lineWidth(1).stroke();
  return rowY + 28;
}

export function generatePayslipPdf(data: PayslipData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN });
    const chunks: Buffer[] = [];
    const layout = buildPayslipLayout(data);
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
      ["Pay period", data.payPeriodLabel],
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
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(22).text("Payslip", MARGIN, y);
    y += 26;
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(10)
      .text(
        "Official pay statement for salary, allowances, and deductions for the stated pay period.",
        MARGIN,
        y,
        { width: CONTENT_WIDTH - 200 },
      );

    y += 34;
    doc.moveTo(MARGIN, y).lineTo(right, y).lineWidth(2).strokeColor(BRAND).stroke();
    y += 22;

    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text("EMPLOYEE INFORMATION", MARGIN, y);
    y += 16;

    const infoCols = 3;
    const cellGap = 8;
    const cellWidth = (CONTENT_WIDTH - cellGap * (infoCols - 1)) / infoCols;
    const infoRows = [
      ["Employee name", data.employeeName],
      ["Employee ID", data.employeeCode],
      ["Department", data.departmentLabel],
      ["Job title", data.jobTitle],
      ["Payment method", data.paymentMethod],
      ["Pay frequency", "Monthly"],
    ] as const;

    for (let index = 0; index < infoRows.length; index += infoCols) {
      for (let col = 0; col < infoCols; col += 1) {
        const item = infoRows[index + col];
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

    y += 8;
    const columnGap = 16;
    const columnWidth = (CONTENT_WIDTH - columnGap) / 2;
    const earningsBottom = drawTable(doc, {
      title: "Earnings",
      x: MARGIN,
      y,
      width: columnWidth,
      rows: layout.earnings,
      totalLabel: "Total earnings",
      totalAmount: layout.earningsTotal,
      emptyLabel: "No earnings recorded",
    });
    const deductionsBottom = drawTable(doc, {
      title: "Deductions",
      x: MARGIN + columnWidth + columnGap,
      y,
      width: columnWidth,
      rows: layout.deductions,
      totalLabel: "Total deductions",
      totalAmount: layout.deductionsTotal,
      emptyLabel: "No deductions this period",
      amountColor: DEDUCTION,
    });
    y = Math.max(earningsBottom, deductionsBottom) + 10;

    const summaryHeight = 58;
    doc.rect(MARGIN, y, CONTENT_WIDTH, summaryHeight).strokeColor(BORDER).lineWidth(1).stroke();
    const third = CONTENT_WIDTH / 3;
    doc.moveTo(MARGIN + third, y).lineTo(MARGIN + third, y + summaryHeight).strokeColor(BORDER).stroke();
    doc
      .moveTo(MARGIN + third * 2, y)
      .lineTo(MARGIN + third * 2, y + summaryHeight)
      .strokeColor(BORDER)
      .stroke();

    doc.fillColor(MUTED).font("Helvetica").fontSize(8).text("GROSS PAY", MARGIN + 14, y + 12);
    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(formatNaira(data.grossPay), MARGIN + 14, y + 26, { width: third - 28 });

    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(8)
      .text("TOTAL DEDUCTIONS", MARGIN + third + 14, y + 12);
    doc
      .fillColor(DEDUCTION)
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`-${formatNaira(data.totalDeductions)}`, MARGIN + third + 14, y + 26, {
        width: third - 28,
      });

    doc.rect(MARGIN + third * 2, y, third, summaryHeight).fill(BRAND);
    doc.fillColor("#cbd5e1").font("Helvetica").fontSize(8).text("NET PAY", MARGIN + third * 2 + 14, y + 12);
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(formatNaira(data.netPay), MARGIN + third * 2 + 14, y + 24, { width: third - 28 });

    y += summaryHeight + 18;
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text("ATTENDANCE SUMMARY", MARGIN, y);
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
      .text(
        `Working days in period: ${data.workingDaysInPeriod}    Paid leave days: ${data.paidLeaveDays}    Unpaid leave days: ${data.unpaidLeaveDays}`,
        MARGIN + 14,
        y + 15,
        { width: CONTENT_WIDTH - 28 },
      );

    y += 64;
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(8)
      .text(
        "This document is confidential and intended only for the named employee. If you believe any amount is incorrect, contact HR within five working days of receipt.",
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
