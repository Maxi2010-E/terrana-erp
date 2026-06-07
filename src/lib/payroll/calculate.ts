import type {
  AdvanceRecordInput,
  BonusRecordInput,
  LeaveRecordInput,
  PayrollEmployeeInput,
  PayrollLineCalculation,
  PayrollRunPreview,
} from "@/lib/payroll/types";
import {
  countLeaveWeekdaysInPeriod,
  dailyRate,
  employeeActiveInPeriod,
  roundMoney,
  workingDaysInPayPeriod,
} from "@/lib/payroll/working-days";

function sumApprovedBonuses(bonuses: BonusRecordInput[]): number {
  return roundMoney(
    bonuses
      .filter((bonus) => bonus.status === "approved")
      .reduce((sum, bonus) => sum + bonus.amount, 0),
  );
}

function leaveDaysByType(
  leaves: LeaveRecordInput[],
  payPeriod: string,
): { paidLeaveDays: number; unpaidLeaveDays: number } {
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;

  for (const leave of leaves) {
    if (leave.status !== "approved") {
      continue;
    }

    const days = countLeaveWeekdaysInPeriod(
      leave.startDate,
      leave.endDate,
      payPeriod,
    );

    if (leave.leaveType === "paid") {
      paidLeaveDays += days;
    } else {
      unpaidLeaveDays += days;
    }
  }

  return { paidLeaveDays, unpaidLeaveDays };
}

function outstandingAdvances(advances: AdvanceRecordInput[]): AdvanceRecordInput[] {
  return advances.filter(
    (advance) =>
      advance.status === "approved" &&
      roundMoney(advance.amount - advance.amountRepaid) > 0,
  );
}

function allocateAdvanceDeductions(
  advances: AdvanceRecordInput[],
  maxDeduction: number,
): { total: number; allocations: Array<{ advanceId: string; amount: number }> } {
  let remaining = roundMoney(Math.max(maxDeduction, 0));
  const allocations: Array<{ advanceId: string; amount: number }> = [];

  for (const advance of advances) {
    if (remaining <= 0) {
      break;
    }

    const balance = roundMoney(advance.amount - advance.amountRepaid);
    if (balance <= 0) {
      continue;
    }

    const amount = roundMoney(Math.min(balance, remaining));
    allocations.push({ advanceId: advance.id, amount });
    remaining = roundMoney(remaining - amount);
  }

  const total = roundMoney(
    allocations.reduce((sum, item) => sum + item.amount, 0),
  );

  return { total, allocations };
}

export function calculatePayrollLine(input: {
  employee: PayrollEmployeeInput;
  payPeriod: string;
  leaves: LeaveRecordInput[];
  advances: AdvanceRecordInput[];
  bonuses: BonusRecordInput[];
}): PayrollLineCalculation | null {
  const { employee, payPeriod, leaves, advances, bonuses } = input;

  if (!employeeActiveInPeriod(employee.hireDate, employee.status, payPeriod)) {
    return null;
  }

  const workingDays = workingDaysInPayPeriod(payPeriod);
  const baseSalary = roundMoney(employee.monthlySalary);
  const rate = dailyRate(baseSalary, workingDays);
  const { paidLeaveDays, unpaidLeaveDays } = leaveDaysByType(leaves, payPeriod);
  const leaveDeduction = roundMoney(rate * unpaidLeaveDays);
  const bonusTotal = sumApprovedBonuses(bonuses);
  const grossPay = roundMoney(baseSalary - leaveDeduction + bonusTotal);

  const { total: advanceDeduction, allocations } = allocateAdvanceDeductions(
    outstandingAdvances(advances),
    grossPay,
  );

  const netPay = roundMoney(Math.max(grossPay - advanceDeduction, 0));

  return {
    employeeId: employee.employeeId,
    baseSalary,
    workingDaysInPeriod: workingDays,
    paidLeaveDays,
    unpaidLeaveDays,
    leaveDeduction,
    bonusTotal,
    advanceDeduction,
    grossPay,
    netPay,
    advanceAllocations: allocations,
  };
}

export function calculatePayrollRun(input: {
  payPeriod: string;
  employees: PayrollEmployeeInput[];
  leavesByEmployee: Map<string, LeaveRecordInput[]>;
  advancesByEmployee: Map<string, AdvanceRecordInput[]>;
  bonusesByEmployee: Map<string, BonusRecordInput[]>;
}): PayrollRunPreview {
  const workingDays = workingDaysInPayPeriod(input.payPeriod);
  const lines: PayrollLineCalculation[] = [];

  for (const employee of input.employees) {
    const line = calculatePayrollLine({
      employee,
      payPeriod: input.payPeriod,
      leaves: input.leavesByEmployee.get(employee.employeeId) ?? [],
      advances: input.advancesByEmployee.get(employee.employeeId) ?? [],
      bonuses: input.bonusesByEmployee.get(employee.employeeId) ?? [],
    });

    if (line) {
      lines.push(line);
    }
  }

  lines.sort((a, b) => a.employeeId.localeCompare(b.employeeId));

  const totals = lines.reduce(
    (acc, line) => ({
      baseSalary: roundMoney(acc.baseSalary + line.baseSalary),
      leaveDeduction: roundMoney(acc.leaveDeduction + line.leaveDeduction),
      bonusTotal: roundMoney(acc.bonusTotal + line.bonusTotal),
      advanceDeduction: roundMoney(acc.advanceDeduction + line.advanceDeduction),
      grossPay: roundMoney(acc.grossPay + line.grossPay),
      netPay: roundMoney(acc.netPay + line.netPay),
    }),
    {
      baseSalary: 0,
      leaveDeduction: 0,
      bonusTotal: 0,
      advanceDeduction: 0,
      grossPay: 0,
      netPay: 0,
    },
  );

  return {
    payPeriod: input.payPeriod,
    workingDaysInPeriod: workingDays,
    lines,
    totals,
  };
}
