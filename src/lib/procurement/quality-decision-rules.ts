import {
  QUALITY_DECISIONS,
  type ProductCondition,
  type QualityDecision,
} from "@/lib/procurement/constants";
import { isRawProduct } from "@/lib/procurement/quantity-rules";

/** Raw farm goods must always be reprocessed — never direct to pre-stock. */
export function allowedQualityDecisions(
  productCondition: ProductCondition,
): QualityDecision[] {
  if (isRawProduct(productCondition)) {
    return ["processing"];
  }

  return [...QUALITY_DECISIONS];
}

export function isQualityDecisionAllowed(
  productCondition: ProductCondition,
  decision: QualityDecision,
): boolean {
  return allowedQualityDecisions(productCondition).includes(decision);
}

export function requiredQualityDecisionForProduct(
  productCondition: ProductCondition,
): QualityDecision | null {
  if (isRawProduct(productCondition)) {
    return "processing";
  }

  return null;
}

export function validateQualityDecisionForProduct(
  productCondition: ProductCondition,
  decision: QualityDecision,
): string | null {
  if (isQualityDecisionAllowed(productCondition, decision)) {
    return null;
  }

  if (isRawProduct(productCondition)) {
    return "Raw goods must go to processing. They cannot be sent to pre-stock.";
  }

  return "Quality decision is not allowed for this product type.";
}
