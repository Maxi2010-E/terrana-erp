import type { LeaveType } from "@/lib/payroll/constants";

export type LeaveRecordInput = {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: string;
};

export type AdvanceRecordInput = {
  id: string;
  amount: number;
  amountRepaid: number;
  status: string;
};

export type BonusRecordInput = {
  amount: number;
  status: string;
};

export type PayrollEmployeeInput = {
  employeeId: string;
  monthlySalary: number;
  hireDate: string;
  status: string;
};

export type PayrollLineCalculation = {
  employeeId: string;
  baseSalary: number;
  workingDaysInPeriod: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  leaveDeduction: number;
  bonusTotal: number;
  advanceDeduction: number;
  grossPay: number;
  netPay: number;
  advanceAllocations: Array<{ advanceId: string; amount: number }>;
};

export type PayrollRunPreview = {
  payPeriod: string;
  workingDaysInPeriod: number;
  lines: PayrollLineCalculation[];
  totals: {
    baseSalary: number;
    leaveDeduction: number;
    bonusTotal: number;
    advanceDeduction: number;
    grossPay: number;
    netPay: number;
  };
};

export type LeaveListRow = {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  recordedAt: string;
  approvedByName: string | null;
};

export type LeaveListRowDisplay = LeaveListRow & {
  recordedAtLabel: string;
};

export type AdvanceListRow = {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  amount: number;
  amountRepaid: number;
  balance: number;
  dateIssued: string;
  reason: string | null;
  status: string;
};

export type BonusListRow = {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  amount: number;
  payPeriod: string;
  bonusDate: string;
  reason: string | null;
  status: string;
};

export type PayrollListRow = PayrollLineCalculation & {
  id: string;
  employeeCode: string;
  employeeName: string;
  status: "recorded" | "paid";
  paidAt: string | null;
  recordedAt: string;
};

/** Server-formatted timestamps — never format dates in client tables. */
export type PayrollListRowDisplay = PayrollListRow & {
  paidAtLabel: string | null;
  recordedAtLabel: string;
};

export type EmployeePayrollCalculation = PayrollLineCalculation & {
  employeeCode: string;
  employeeName: string;
};
