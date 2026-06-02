const INVENTORY_NUMBER_PATTERN = /^(INV-\d{4}-)(\d+)$/;

/** Display format: INV-2026-001 (compact). */
export function formatInventoryNumber(inventoryNumber: string): string {
  const match = INVENTORY_NUMBER_PATTERN.exec(inventoryNumber);
  if (!match) {
    return inventoryNumber;
  }

  const sequence = Number.parseInt(match[2], 10);
  if (Number.isNaN(sequence)) {
    return inventoryNumber;
  }

  return `${match[1]}${String(sequence).padStart(3, "0")}`;
}

const PRE_STOCK_NUMBER_PATTERN = /^(PSK-\d{4}-)(\d+)$/;

/** Display format: PSK-2026-001 (compact). */
export function formatPreStockNumber(preStockNumber: string): string {
  const match = PRE_STOCK_NUMBER_PATTERN.exec(preStockNumber);
  if (!match) {
    return preStockNumber;
  }

  const sequence = Number.parseInt(match[2], 10);
  if (Number.isNaN(sequence)) {
    return preStockNumber;
  }

  return `${match[1]}${String(sequence).padStart(3, "0")}`;
}
