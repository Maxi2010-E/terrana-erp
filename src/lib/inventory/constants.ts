export const INVENTORY_STATUSES = [
  "available",
  "reserved",
  "allocated",
  "shipped",
] as const;

export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

export const PRE_STOCK_SOURCE_TYPES = ["procurement", "processing"] as const;
export type PreStockSourceType = (typeof PRE_STOCK_SOURCE_TYPES)[number];

export const PRE_STOCK_SOURCE_TYPE_LABELS: Record<PreStockSourceType, string> = {
  procurement: "Procurement",
  processing: "Processing",
};

export const INVENTORY_STATUS_LABELS: Record<InventoryStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  allocated: "Allocated",
  shipped: "Shipped",
};
