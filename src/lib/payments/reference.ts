const PAYMENT_REFERENCE_PATTERN = /^(PAY-\d{4}-)(\d+)$/;

/** Display format: PAY-2026-001 (compact, no excess leading zeros). */
export function formatPaymentReference(reference: string): string {
  const match = PAYMENT_REFERENCE_PATTERN.exec(reference);
  if (!match) {
    return reference;
  }

  const sequence = Number.parseInt(match[2], 10);
  if (Number.isNaN(sequence)) {
    return reference;
  }

  return `${match[1]}${String(sequence).padStart(3, "0")}`;
}
