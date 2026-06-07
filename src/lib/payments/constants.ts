export const PAYMENT_METHODS = ["cash", "transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_RECORD_STATUSES = [
  "pending_approval",
  "approved",
] as const;
export type PaymentRecordStatus = (typeof PAYMENT_RECORD_STATUSES)[number];

export const PAYMENT_QUEUE_FILTERS = [
  "outstanding",
  "partial",
  "completed",
] as const;
export type PaymentQueueFilter = (typeof PAYMENT_QUEUE_FILTERS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  transfer: "Transfer",
};

export const PAYMENT_RECORD_STATUS_LABELS: Record<
  PaymentRecordStatus,
  string
> = {
  pending_approval: "Pending approval",
  approved: "Approved",
};

export const PAYMENT_QUEUE_FILTER_LABELS: Record<PaymentQueueFilter, string> =
  {
    outstanding: "Outstanding",
    partial: "Partially paid",
    completed: "Completed",
  };
