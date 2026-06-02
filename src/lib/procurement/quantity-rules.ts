import type {
  ProcurementType,
  ProductCondition,
} from "@/lib/procurement/constants";

export function isRawProduct(productCondition: ProductCondition): boolean {
  return productCondition === "raw";
}

export function isOffSiteClean(
  procurementType: ProcurementType,
  productCondition: ProductCondition,
): boolean {
  return procurementType === "off_site" && productCondition === "clean";
}

/** Raw products never use kg/bag or extra kg. */
export function showKgPerBagField(productCondition: ProductCondition): boolean {
  return !isRawProduct(productCondition);
}

export function showExtraKgField(productCondition: ProductCondition): boolean {
  return !isRawProduct(productCondition);
}

export function isKgPerBagRequired(
  procurementType: ProcurementType,
  productCondition: ProductCondition,
): boolean {
  if (isRawProduct(productCondition)) {
    return false;
  }
  if (isOffSiteClean(procurementType, productCondition)) {
    return false;
  }
  if (procurementType === "on_site") {
    return true;
  }
  return false;
}

export function isExtraKgRequired(): boolean {
  return false;
}

export function showDirectTotalKg(
  procurementType: ProcurementType,
  productCondition: ProductCondition,
  kgPerBag?: number | null,
): boolean {
  if (isRawProduct(productCondition)) {
    return true;
  }
  if (isOffSiteClean(procurementType, productCondition)) {
    return !kgPerBag || kgPerBag <= 0;
  }
  if (procurementType === "off_site") {
    return !kgPerBag || kgPerBag <= 0;
  }
  return false;
}

export function isDirectTotalKgRequired(
  procurementType: ProcurementType,
  productCondition: ProductCondition,
  kgPerBag?: number | null,
): boolean {
  return showDirectTotalKg(procurementType, productCondition, kgPerBag);
}
