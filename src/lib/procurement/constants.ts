export const PROCUREMENT_TYPES = ["on_site", "off_site"] as const;
export type ProcurementType = (typeof PROCUREMENT_TYPES)[number];

export const PRODUCT_CONDITIONS = ["raw", "clean", "mixed"] as const;
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];

export const PRODUCT_AGES = ["new", "old"] as const;
export type ProductAge = (typeof PRODUCT_AGES)[number];

export const PRODUCT_COLORS = ["red", "black"] as const;
export type ProductColor = (typeof PRODUCT_COLORS)[number];

export const MIXED_TYPES = [
  "red_mixed",
  "black_mixed",
  "combined_mixed",
] as const;
export type MixedType = (typeof MIXED_TYPES)[number];

export const QUALITY_DECISIONS = ["pre_stock", "processing"] as const;
export type QualityDecision = (typeof QUALITY_DECISIONS)[number];

export const PAYMENT_STATUSES = [
  "unpaid",
  "partially_paid",
  "paid",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PROCUREMENT_STATUSES = ["pending_approval", "approved"] as const;
export type ProcurementStatus = (typeof PROCUREMENT_STATUSES)[number];

export const PROCUREMENT_TYPE_LABELS: Record<ProcurementType, string> = {
  on_site: "On-site",
  off_site: "Off-site",
};

export const PRODUCT_CONDITION_LABELS: Record<ProductCondition, string> = {
  raw: "Raw",
  clean: "Clean",
  mixed: "Mixed",
};

export const PRODUCT_AGE_LABELS: Record<ProductAge, string> = {
  new: "New",
  old: "Old",
};

export const PRODUCT_COLOR_LABELS: Record<ProductColor, string> = {
  red: "Red",
  black: "Black",
};

export const MIXED_TYPE_LABELS: Record<MixedType, string> = {
  red_mixed: "Red Mixed",
  black_mixed: "Black Mixed",
  combined_mixed: "Combined Mixed",
};

export const QUALITY_DECISION_LABELS: Record<QualityDecision, string> = {
  pre_stock: "Pre-stock",
  processing: "Processing",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partially_paid: "Partially paid",
  paid: "Paid",
};

export const PROCUREMENT_STATUS_LABELS: Record<ProcurementStatus, string> = {
  pending_approval: "Pending approval",
  approved: "Approved",
};

/** Standard bag weights (kg) — fixed options wherever kg/bag applies. */
export const KG_PER_BAG_OPTIONS = [25, 20] as const;
export type KgPerBagOption = (typeof KG_PER_BAG_OPTIONS)[number];

export function isStandardKgPerBag(value: number): value is KgPerBagOption {
  return KG_PER_BAG_OPTIONS.includes(value as KgPerBagOption);
}
