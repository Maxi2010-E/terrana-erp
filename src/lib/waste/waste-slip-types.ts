import type { WasteType } from "@/lib/processing/constants";

export type WasteSlipLine = {
  wasteType: WasteType;
  label: string;
  numberOfBags: number;
  kgPerBag: number | null;
  extraKg: number;
  weightKg: number;
};

export type WasteSlipData = {
  companyName: string;
  reference: string;
  sessionNumber: string;
  processingDate: string;
  statusLabel: string;
  batchNumber: string;
  supplierName: string;
  productType: string;
  bagsSent: number;
  inputKg: number;
  outputKg: number | null;
  yieldPct: number | null;
  lines: WasteSlipLine[];
  totalWasteKg: number;
  processedByLabel: string | null;
  generatedAtLabel: string;
};
