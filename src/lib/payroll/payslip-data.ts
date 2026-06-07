import { EMPLOYEE_DEPARTMENT_LABELS, type EmployeeDepartment } from "@/lib/employees/constants";
import { formatPayPeriodLabel } from "@/lib/payroll/constants";
import type { PayslipData, PayslipLineItem } from "@/lib/payroll/payslip-types";
import { createClient } from "@/lib/supabase/server";

function formatIsoDate(value: string | null): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function payslipReference(employeeCode: string, payPeriod: string): string {
  const year = payPeriod.slice(0, 4);
  const suffix = employeeCode.split("-").pop() ?? employeeCode;
  return `PAY-HR-${year}-${suffix}`;
}

export async function loadPayslipData(lineId: string): Promise<PayslipData | null> {
  const supabase = await createClient();

  const { data: line, error } = await supabase
    .from("payroll_lines")
    .select(
      "id, employee_id, base_salary, working_days_in_period, paid_leave_days, unpaid_leave_days, leave_deduction, bonus_total, advance_deduction, gross_pay, net_pay, status, paid_at, created_at, payroll_runs (pay_period), employees (employee_code, first_name, last_name, job_title, department)",
    )
    .eq("id", lineId)
    .maybeSingle();

  if (error || !line) {
    return null;
  }

  const employee = Array.isArray(line.employees) ? line.employees[0] : line.employees;
  const run = Array.isArray(line.payroll_runs) ? line.payroll_runs[0] : line.payroll_runs;
  const payPeriod = run?.pay_period;

  if (!employee || !payPeriod) {
    return null;
  }

  const [bonusResult, advanceResult] = await Promise.all([
    supabase
      .from("employee_bonuses")
      .select("amount, reason")
      .eq("employee_id", line.employee_id)
      .eq("pay_period", payPeriod)
      .eq("status", "approved"),
    supabase
      .from("payroll_advance_deductions")
      .select("amount_deducted, employee_advances (reason)")
      .eq("payroll_line_id", lineId),
  ]);

  const bonusItems: PayslipLineItem[] = (bonusResult.data ?? []).map((row) => ({
    label: row.reason?.trim() || "Bonus",
    amount: Number(row.amount),
  }));

  const advanceItems: PayslipLineItem[] = (advanceResult.data ?? []).map((row) => {
    const advance = Array.isArray(row.employee_advances)
      ? row.employee_advances[0]
      : row.employee_advances;

    return {
      label: advance?.reason?.trim() || "Salary advance repayment",
      amount: Number(row.amount_deducted),
    };
  });

  const department = employee.department as EmployeeDepartment;
  const leaveDeduction = Number(line.leave_deduction);
  const advanceDeduction = Number(line.advance_deduction);
  const status = line.status as "recorded" | "paid";

  return {
    companyName: "Terrana Africa Limited",
    payPeriod,
    payPeriodLabel: formatPayPeriodLabel(payPeriod),
    reference: payslipReference(employee.employee_code, payPeriod),
    employeeCode: employee.employee_code,
    employeeName: `${employee.first_name} ${employee.last_name}`.trim(),
    jobTitle: employee.job_title,
    departmentLabel: EMPLOYEE_DEPARTMENT_LABELS[department] ?? employee.department,
    paymentMethod: "Bank Transfer",
    paymentDate: formatIsoDate(line.paid_at ?? line.created_at),
    status,
    statusLabel: status === "paid" ? "PAID" : "RECORDED",
    baseSalary: Number(line.base_salary),
    workingDaysInPeriod: line.working_days_in_period,
    paidLeaveDays: line.paid_leave_days,
    unpaidLeaveDays: line.unpaid_leave_days,
    leaveDeduction,
    bonusTotal: Number(line.bonus_total),
    bonusItems,
    advanceDeduction,
    advanceItems,
    grossPay: Number(line.gross_pay),
    totalDeductions: leaveDeduction + advanceDeduction,
    netPay: Number(line.net_pay),
    generatedAtLabel: new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }).format(new Date()),
  };
}

export function payslipFilename(data: PayslipData): string {
  const period = data.payPeriod.slice(0, 7);
  const code = data.employeeCode.replace(/[^a-zA-Z0-9-]+/g, "-");
  return `payslip-${code}-${period}.pdf`;
}
