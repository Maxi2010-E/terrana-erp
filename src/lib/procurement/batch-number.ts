const BATCH_NUMBER_PATTERN = /^(PR-\d{4}-)(\d+)$/;

/** Display format: PR-2026-001 (compact, no excess leading zeros). */
export function formatProcurementBatchNumber(batchNumber: string): string {
  const match = BATCH_NUMBER_PATTERN.exec(batchNumber);
  if (!match) {
    return batchNumber;
  }

  const sequence = Number.parseInt(match[2], 10);
  if (Number.isNaN(sequence)) {
    return batchNumber;
  }

  return `${match[1]}${String(sequence).padStart(3, "0")}`;
}
