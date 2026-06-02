/** Graded export labels — same vocabulary as procurement mixed types. */
export const GRADED_COMBINATION_LABELS = {
  redMixed: "Red Mixed",
  blackMixed: "Black Mixed",
  combinedMixed: "Combined Mixed",
  newCombinedMixed: "New Combined Mixed",
  oldCombinedMixed: "Old Combined Mixed",
} as const;

export type GradedCombinationLabel =
  (typeof GRADED_COMBINATION_LABELS)[keyof typeof GRADED_COMBINATION_LABELS];

export const CLEAN_PRE_STOCK_SINGLES = [
  "Clean New Red",
  "Clean New Black",
  "Clean Old Red",
  "Clean Old Black",
] as const;

export type CleanPreStockSingle = (typeof CLEAN_PRE_STOCK_SINGLES)[number];

export const PRE_STOCK_PROCUREMENT_MIXED = [
  "Red Mixed",
  "Black Mixed",
  "Combined Mixed",
  "Mixed",
] as const;
