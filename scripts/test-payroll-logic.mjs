/**
 * Payroll calculation tests (pure logic).
 * Run: npm run test:payroll
 */

import { calculatePayrollLine, calculatePayrollRun } from "../src/lib/payroll/calculate.ts";
import {
  isPayrollBannerPreviewEnabled,
  isPayrollDueWindow,
  payPeriodForLocalDate,
  shouldShowPayrollDueBanner,
} from "../src/lib/payroll/notifications.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log("Payroll logic tests…\n");

const employee = {
  employeeId: "emp-1",
  monthlySalary: 300_000,
  hireDate: "2024-01-01",
  status: "active",
};

// June 2026 has 22 weekdays
const payPeriod = "2026-06-01";

const baseOnly = calculatePayrollLine({
  employee,
  payPeriod,
  leaves: [],
  advances: [],
  bonuses: [],
});

assert(baseOnly?.netPay === 300_000, `expected net 300000, got ${baseOnly?.netPay}`);
assert(baseOnly?.workingDaysInPeriod === 22, "June 2026 weekday count");
console.log("✓ base salary with no adjustments");

const unpaidLeave = calculatePayrollLine({
  employee,
  payPeriod,
  leaves: [
    {
      leaveType: "unpaid",
      startDate: "2026-06-01",
      endDate: "2026-06-05",
      status: "approved",
    },
  ],
  advances: [],
  bonuses: [],
});

assert(unpaidLeave?.unpaidLeaveDays === 5, "five unpaid weekdays");
assert(
  unpaidLeave?.leaveDeduction === 68_181.82,
  `expected leave deduction 68181.82, got ${unpaidLeave?.leaveDeduction}`,
);
assert(
  unpaidLeave?.netPay === 231_818.18,
  `expected net 231818.18, got ${unpaidLeave?.netPay}`,
);
console.log("✓ unpaid leave deducts pro-rata");

const paidLeave = calculatePayrollLine({
  employee,
  payPeriod,
  leaves: [
    {
      leaveType: "paid",
      startDate: "2026-06-01",
      endDate: "2026-06-05",
      status: "approved",
    },
  ],
  advances: [],
  bonuses: [],
});

assert(paidLeave?.paidLeaveDays === 5, "five paid weekdays");
assert(paidLeave?.leaveDeduction === 0, "paid leave does not deduct");
assert(paidLeave?.netPay === 300_000, "paid leave keeps full salary");
console.log("✓ paid leave does not deduct");

const withBonusAndAdvance = calculatePayrollLine({
  employee,
  payPeriod,
  leaves: [],
  advances: [
    {
      id: "adv-1",
      amount: 50_000,
      amountRepaid: 0,
      status: "approved",
    },
  ],
  bonuses: [{ amount: 20_000, status: "approved" }],
});

assert(withBonusAndAdvance?.bonusTotal === 20_000, "bonus added");
assert(withBonusAndAdvance?.advanceDeduction === 50_000, "advance deducted");
assert(
  withBonusAndAdvance?.netPay === 270_000,
  `expected net 270000, got ${withBonusAndAdvance?.netPay}`,
);
console.log("✓ bonus added and advance deducted");

const cappedAdvance = calculatePayrollLine({
  employee: { ...employee, monthlySalary: 40_000 },
  payPeriod,
  leaves: [],
  advances: [
    {
      id: "adv-2",
      amount: 100_000,
      amountRepaid: 0,
      status: "approved",
    },
  ],
  bonuses: [],
});

assert(
  cappedAdvance?.advanceDeduction === 40_000,
  "advance deduction capped at gross pay",
);
assert(cappedAdvance?.netPay === 0, "net pay cannot go below zero");
console.log("✓ advance deduction capped at gross pay");

const run = calculatePayrollRun({
  payPeriod,
  employees: [employee],
  leavesByEmployee: new Map(),
  advancesByEmployee: new Map(),
  bonusesByEmployee: new Map(),
});

assert(run.lines.length === 1, "one payroll line in run");
assert(run.totals.netPay === 300_000, "run totals match");
console.log("✓ payroll run aggregation");

assert(isPayrollDueWindow("2026-06-25"), "June 25 is in last week");
assert(isPayrollDueWindow("2026-06-30"), "June 30 is in last week");
assert(isPayrollDueWindow("2026-06-24"), "June 24 is in last week of 30-day month");
assert(!isPayrollDueWindow("2026-06-23"), "June 23 is outside last week");
assert(isPayrollDueWindow("2026-02-22"), "Feb 22 is in last week of 28-day month");
assert(!isPayrollDueWindow("2026-02-21"), "Feb 21 is outside last week");
assert(payPeriodForLocalDate("2026-06-25") === "2026-06-01", "pay period month");
assert(
  shouldShowPayrollDueBanner({
    eligibleCount: 5,
    paidEmployeeCount: 5,
  }) === false,
  "hide when all paid",
);
assert(
  shouldShowPayrollDueBanner({
    eligibleCount: 5,
    paidEmployeeCount: 2,
  }) === true,
  "show when unpaid remain",
);
assert(
  isPayrollBannerPreviewEnabled({
    nodeEnv: "development",
    cookieValue: "1",
  }),
  "dev cookie enables preview",
);
assert(
  !isPayrollBannerPreviewEnabled({
    nodeEnv: "production",
    cookieValue: "1",
  }),
  "preview disabled in production",
);
console.log("✓ payroll due banner window");

console.log("\nPASS — payroll logic");
