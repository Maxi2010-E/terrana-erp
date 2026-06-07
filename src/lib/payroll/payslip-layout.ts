import type { PayslipData } from "@/lib/payroll/payslip-types";

export type PayslipTableRow = {
  number: number;
  label: string;
  amount: number;
};

export type PayslipLayout = {
  earnings: PayslipTableRow[];
  deductions: PayslipTableRow[];
  earningsTotal: number;
  deductionsTotal: number;
};

export function buildPayslipLayout(data: PayslipData): PayslipLayout {
  const earnings: PayslipTableRow[] = [
    { number: 1, label: "Basic salary", amount: data.baseSalary },
  ];

  let earningsCounter = 2;
  if (data.bonusItems.length > 0) {
    for (const item of data.bonusItems) {
      earnings.push({
        number: earningsCounter++,
        label: item.label,
        amount: item.amount,
      });
    }
  } else if (data.bonusTotal > 0) {
    earnings.push({
      number: earningsCounter++,
      label: "Bonus",
      amount: data.bonusTotal,
    });
  }

  const deductions: PayslipTableRow[] = [];
  let deductionsCounter = 1;

  if (data.unpaidLeaveDays > 0) {
    deductions.push({
      number: deductionsCounter++,
      label: `Unpaid leave (${data.unpaidLeaveDays} day${data.unpaidLeaveDays === 1 ? "" : "s"})`,
      amount: data.leaveDeduction,
    });
  }

  if (data.advanceItems.length > 0) {
    for (const item of data.advanceItems) {
      deductions.push({
        number: deductionsCounter++,
        label: item.label,
        amount: item.amount,
      });
    }
  } else if (data.advanceDeduction > 0) {
    deductions.push({
      number: deductionsCounter++,
      label: "Salary advance repayment",
      amount: data.advanceDeduction,
    });
  }

  return {
    earnings,
    deductions,
    earningsTotal: data.grossPay,
    deductionsTotal: data.totalDeductions,
  };
}
