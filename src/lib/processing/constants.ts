export const PROCESSING_SESSION_STATUSES = [
  "pending_approval",
  "in_progress",
  "completed",
  "rejected",
] as const;
export type ProcessingSessionStatus =
  (typeof PROCESSING_SESSION_STATUSES)[number];

export const ACTIVE_PROCESSING_SESSION_STATUSES = [
  "pending_approval",
  "in_progress",
  "completed",
] as const;

export const WASTE_TYPES = [
  "broken_flower",
  "flower_bulb",
  "fungus",
  "other",
] as const;
export type WasteType = (typeof WASTE_TYPES)[number];

export const PROCESSING_SESSION_STATUS_LABELS: Record<
  ProcessingSessionStatus,
  string
> = {
  pending_approval: "Pending approval",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Rejected",
};

export const WASTE_TYPE_LABELS: Record<WasteType, string> = {
  broken_flower: "Broken flower",
  flower_bulb: "Flower bulb",
  fungus: "Fungus",
  other: "Other",
};

/** Standard waste bag weights (kg) — default 30 kg per bag. */
export const WASTE_KG_PER_BAG_OPTIONS = [15, 20, 25, 30] as const;
export type WasteKgPerBagOption = (typeof WASTE_KG_PER_BAG_OPTIONS)[number];

export const DEFAULT_WASTE_KG_PER_BAG: WasteKgPerBagOption = 30;

export function isStandardWasteKgPerBag(
  value: number,
): value is WasteKgPerBagOption {
  return WASTE_KG_PER_BAG_OPTIONS.includes(value as WasteKgPerBagOption);
}
