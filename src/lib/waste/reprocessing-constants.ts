import type { WasteType } from "@/lib/processing/constants";

export const WASTE_REPROCESS_LOCAL_LABELS: Record<WasteType, string> = {
  broken_flower: "Clean hibiscus flower (local)",
  flower_bulb: "Clean flower bulb (local)",
  fungus: "Recovered product (fungus line)",
  other: "Clean recovered product (local)",
};

export const WASTE_SOURCE_KINDS = ["collection", "byproduct"] as const;
export type WasteSourceKind = (typeof WASTE_SOURCE_KINDS)[number];
