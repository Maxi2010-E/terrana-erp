import Link from "next/link";

import type { PayrollDueBannerStatus } from "@/lib/payroll/notifications";
import {
  formatPayrollDueBannerDetail,
  formatPayrollDueBannerHeadline,
} from "@/lib/payroll/notifications";

type PayrollDueBannerProps = {
  status: PayrollDueBannerStatus;
};

export function PayrollDueBanner({ status }: PayrollDueBannerProps) {
  const payrollHref = `/hr?tab=payroll&month=${status.payPeriod.slice(0, 7)}`;

  return (
    <div
      className="payroll-due-banner"
      role="alert"
      aria-live="assertive"
    >
      <div className="payroll-due-banner-inner">
        <div className="payroll-due-banner-badge" aria-hidden="true">
          DUE
        </div>
        <div className="payroll-due-banner-copy">
          {status.isPreview ? (
            <p className="payroll-due-banner-preview-note">
              Visual preview only — dev mode. Add{" "}
              <code className="payroll-due-banner-preview-code">
                ?preview_payroll_banner=0
              </code>{" "}
              to hide.
            </p>
          ) : null}
          <p className="payroll-due-banner-title">
            {formatPayrollDueBannerHeadline(status)}
          </p>
          <p className="payroll-due-banner-detail">
            {formatPayrollDueBannerDetail(status)}{" "}
            <Link href={payrollHref} className="payroll-due-banner-link">
              Open payroll now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
