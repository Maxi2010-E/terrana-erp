export const LEAVE_TYPES = ["paid", "unpaid"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  paid: "Paid leave",
  unpaid: "Unpaid leave",
};

export const HR_REQUEST_STATUSES = [
  "pending_approval",
  "approved",
  "rejected",
  "cancelled",
] as const;
export type HrRequestStatus = (typeof HR_REQUEST_STATUSES)[number];

export const HR_REQUEST_STATUS_LABELS: Record<HrRequestStatus, string> = {
  pending_approval: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const PAYROLL_RUN_STATUSES = ["draft", "finalized", "paid"] as const;
export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUSES)[number];

export const PAYROLL_RUN_STATUS_LABELS: Record<PayrollRunStatus, string> = {
  draft: "Draft",
  finalized: "Finalized",
  paid: "Paid",
};

/** First day of month YYYY-MM-01 */
export function parsePayPeriodMonth(value: string): string | null {
  if (/^\d{4}-\d{2}$/.test(value)) {
    return `${value}-01`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value.slice(0, 7)}-01`;
  }
  return null;
}

export function formatPayPeriodLabel(payPeriod: string): string {
  const date = new Date(`${payPeriod.slice(0, 7)}-15T12:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function currentPayPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}
