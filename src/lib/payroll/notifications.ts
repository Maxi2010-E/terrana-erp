import { formatPayPeriodLabel } from "@/lib/payroll/constants";
import { officeLocalDate } from "@/lib/office/date";
import type { AppRole } from "@/lib/roles";

export type PayrollRunBannerStatus = "none" | "draft" | "finalized" | "paid";

export const PAYROLL_BANNER_PREVIEW_COOKIE = "payroll_banner_preview";
export const PAYROLL_BANNER_PREVIEW_QUERY = "preview_payroll_banner";

export type PayrollDueBannerStatus = {
  payPeriod: string;
  payPeriodLabel: string;
  eligibleCount: number;
  paidLineCount: number;
  unpaidCount: number;
  runStatus: PayrollRunBannerStatus;
  runId: string | null;
  /** Dev-only visual preview — banner forced outside the last-week window. */
  isPreview?: boolean;
};

export function canReceivePayrollDueBanner(role: AppRole): boolean {
  return role === "super_admin" || role === "admin";
}

/** Current month pay period (YYYY-MM-01) from company local date. */
export function payPeriodForLocalDate(localDate = officeLocalDate()): string {
  return `${localDate.slice(0, 7)}-01`;
}

export function isPayrollBannerPreviewEnabled(input?: {
  cookieValue?: string | null;
  envPreview?: string | null;
  nodeEnv?: string | null;
}): boolean {
  if ((input?.nodeEnv ?? process.env.NODE_ENV) !== "development") {
    return false;
  }

  if (input?.envPreview === "1" || process.env.PAYROLL_BANNER_PREVIEW === "1") {
    return true;
  }

  return input?.cookieValue === "1";
}

/** Last 7 calendar days of the month in company local time. */
export function isPayrollDueWindow(localDate = officeLocalDate()): boolean {
  const [yearText, monthText, dayText] = localDate.split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return false;
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= daysInMonth - 6;
}

export function shouldShowPayrollDueBanner(input: {
  eligibleCount: number;
  paidEmployeeCount: number;
}): boolean {
  if (input.eligibleCount <= 0) {
    return false;
  }

  return input.paidEmployeeCount < input.eligibleCount;
}

export function buildPayrollDueBannerStatus(input: {
  payPeriod: string;
  eligibleCount: number;
  paidEmployeeCount: number;
  recordedCount: number;
  runId: string | null;
  isPreview?: boolean;
}): PayrollDueBannerStatus {
  return {
    payPeriod: input.payPeriod,
    payPeriodLabel: formatPayPeriodLabel(input.payPeriod),
    eligibleCount: input.eligibleCount,
    paidLineCount: input.paidEmployeeCount,
    unpaidCount: Math.max(0, input.eligibleCount - input.paidEmployeeCount),
    runStatus:
      input.paidEmployeeCount >= input.eligibleCount
        ? "paid"
        : input.recordedCount > 0
          ? "finalized"
          : "none",
    runId: input.runId,
    isPreview: input.isPreview,
  };
}

/** Sample data for dev visual preview when payroll is already complete or empty. */
export function buildPayrollDueBannerPreviewStatus(
  payPeriod: string,
): PayrollDueBannerStatus {
  return buildPayrollDueBannerStatus({
    payPeriod,
    eligibleCount: 8,
    paidEmployeeCount: 2,
    recordedCount: 5,
    runId: null,
    isPreview: true,
  });
}

export function formatPayrollDueBannerHeadline(status: PayrollDueBannerStatus): string {
  return `Payroll is due — ${status.payPeriodLabel}`;
}

export function formatPayrollDueBannerDetail(status: PayrollDueBannerStatus): string {
  if (status.runStatus === "none") {
    return status.unpaidCount === 1
      ? "1 eligible employee has not been paid this month. Add payroll for each employee, then mark them paid when salaries are sent."
      : `${status.unpaidCount.toLocaleString()} eligible employees have not been paid this month. Add payroll for each employee, then mark them paid when salaries are sent.`;
  }

  if (status.runStatus === "finalized") {
    return status.unpaidCount === 1
      ? "1 employee is still marked unpaid. Mark their payroll as paid after salaries are sent."
      : `${status.unpaidCount.toLocaleString()} employees are still marked unpaid. Mark each payroll as paid after salaries are sent.`;
  }

  return "Complete payroll for this month.";
}
