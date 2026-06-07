"use server";

import { cache } from "react";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies, headers } from "next/headers";

import { getSessionUser } from "@/lib/auth/get-session";
import { requireActorUserId } from "@/lib/auth/actor-id";
import {
  requireHrAdmin,
  requirePayrollRead,
  requirePayrollWrite,
} from "@/lib/auth/require-role";
import { calculatePayrollLine } from "@/lib/payroll/calculate";
import {
  currentPayPeriod,
  parsePayPeriodMonth,
  type LeaveType,
} from "@/lib/payroll/constants";
import type {
  AdvanceListRow,
  AdvanceRecordInput,
  BonusListRow,
  BonusRecordInput,
  LeaveListRow,
  LeaveRecordInput,
  PayrollEmployeeInput,
  PayrollLineCalculation,
  PayrollListRow,
  EmployeePayrollCalculation,
} from "@/lib/payroll/types";
import {
  buildPayrollDueBannerPreviewStatus,
  buildPayrollDueBannerStatus,
  canReceivePayrollDueBanner,
  isPayrollBannerPreviewEnabled,
  isPayrollDueWindow,
  PAYROLL_BANNER_PREVIEW_COOKIE,
  payPeriodForLocalDate,
  shouldShowPayrollDueBanner,
  type PayrollDueBannerStatus,
} from "@/lib/payroll/notifications";
import {
  buildEmployeePayrollBlockers,
  type EmployeePayrollBlockers,
  type PayrollHrNotifications,
} from "@/lib/payroll/hr-notifications";
import { employeeActiveInPeriod, payPeriodBounds } from "@/lib/payroll/working-days";
import type { AppRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { invalidateSidebarNotificationMemoryCache } from "@/lib/layout/cached-sidebar-notifications";
import { nameFromMap, resolveUserDisplayNames } from "@/lib/users/resolve-user-names";

const HR_PATHS = ["/hr"] as const;

async function revalidateHr(...paths: string[]) {
  const targets = paths.length > 0 ? paths : [...HR_PATHS];
  for (const path of targets) {
    revalidatePath(path, "page");
  }

  const session = await getSessionUser();
  if (session.authUser?.id && session.appUser?.role) {
    invalidateSidebarNotificationMemoryCache(
      session.authUser.id,
      session.appUser.role,
    );
    if (process.env.NODE_ENV === "production") {
      revalidateTag(`sidebar-notifications-${session.authUser.id}`, "max");
    }
  }
}

async function countEligibleEmployeesForPeriod(payPeriod: string): Promise<number> {
  const supabase = await createClient();
  const { periodEnd } = payPeriodBounds(payPeriod);

  const { data, error } = await supabase
    .from("employees")
    .select("hire_date, status")
    .in("status", ["active", "on_leave"])
    .lte("hire_date", periodEnd);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).filter((row) =>
    employeeActiveInPeriod(row.hire_date, row.status, payPeriod),
  ).length;
}

function parseAmount(value: string, label: string): number {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
  return Math.round(amount * 100) / 100;
}

async function ensurePayrollRunId(
  payPeriod: string,
  createdBy: string,
): Promise<string> {
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("payroll_runs")
    .select("id")
    .eq("pay_period", payPeriod)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    return existing.id;
  }

  const { data: created, error: createError } = await supabase
    .from("payroll_runs")
    .insert({
      pay_period: payPeriod,
      status: "draft",
      created_by: createdBy,
    })
    .select("id")
    .single();

  if (createError || !created) {
    throw new Error(createError?.message ?? "Could not create payroll month.");
  }

  return created.id;
}

async function syncPayrollRunStatus(runId: string, payPeriod: string) {
  const supabase = await createClient();
  const eligibleCount = await countEligibleEmployeesForPeriod(payPeriod);

  const { count: paidCount, error: paidError } = await supabase
    .from("payroll_lines")
    .select("id", { count: "exact", head: true })
    .eq("payroll_run_id", runId)
    .eq("status", "paid");

  if (paidError) {
    throw new Error(paidError.message);
  }

  if ((paidCount ?? 0) >= eligibleCount && eligibleCount > 0) {
    await supabase
      .from("payroll_runs")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", runId);
    return;
  }

  const { count: recordedCount, error: recordedError } = await supabase
    .from("payroll_lines")
    .select("id", { count: "exact", head: true })
    .eq("payroll_run_id", runId);

  if (recordedError) {
    throw new Error(recordedError.message);
  }

  await supabase
    .from("payroll_runs")
    .update({
      status: (recordedCount ?? 0) > 0 ? "finalized" : "draft",
      paid_at: null,
    })
    .eq("id", runId);
}

async function loadEmployeePayrollCalculation(
  employeeId: string,
  payPeriod: string,
): Promise<EmployeePayrollCalculation | null> {
  const supabase = await createClient();
  const { periodStart, periodEnd } = payPeriodBounds(payPeriod);

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id, employee_code, first_name, last_name, monthly_salary, hire_date, status")
    .eq("id", employeeId)
    .maybeSingle();

  if (employeeError || !employee) {
    throw new Error(employeeError?.message ?? "Employee not found.");
  }

  const employeeInput: PayrollEmployeeInput = {
    employeeId: employee.id,
    monthlySalary: Number(employee.monthly_salary),
    hireDate: employee.hire_date,
    status: employee.status,
  };

  const { data: leaves } = await supabase
    .from("employee_leave")
    .select("leave_type, start_date, end_date, status")
    .eq("employee_id", employeeId)
    .lte("start_date", periodEnd)
    .gte("end_date", periodStart);

  const { data: advances } = await supabase
    .from("employee_advances")
    .select("id, amount, amount_repaid, status")
    .eq("employee_id", employeeId);

  const { data: bonuses } = await supabase
    .from("employee_bonuses")
    .select("amount, status")
    .eq("employee_id", employeeId)
    .eq("pay_period", payPeriod);

  const calculation = calculatePayrollLine({
    employee: employeeInput,
    payPeriod,
    leaves: (leaves ?? []).map((row) => ({
      leaveType: row.leave_type as LeaveType,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
    })),
    advances: (advances ?? []).map((row) => ({
      id: row.id,
      amount: Number(row.amount),
      amountRepaid: Number(row.amount_repaid),
      status: row.status,
    })),
    bonuses: (bonuses ?? []).map((row) => ({
      amount: Number(row.amount),
      status: row.status,
    })),
  });

  if (!calculation) {
    return null;
  }

  return {
    ...calculation,
    employeeCode: employee.employee_code,
    employeeName: `${employee.first_name} ${employee.last_name}`.trim(),
  };
}

export async function getEmployeePayrollCalculation(
  employeeId: string,
  payPeriodInput?: string,
): Promise<EmployeePayrollCalculation | null> {
  await requirePayrollRead();

  const payPeriod = parsePayPeriodMonth(payPeriodInput ?? currentPayPeriod());
  if (!payPeriod) {
    throw new Error("Invalid pay period.");
  }

  return loadEmployeePayrollCalculation(employeeId, payPeriod);
}

async function loadEmployeePayrollBlockers(
  employeeId: string,
  payPeriod: string,
): Promise<EmployeePayrollBlockers> {
  const supabase = await createClient();

  const [leaveResult, advanceResult, bonusResult] = await Promise.all([
    supabase
      .from("employee_leave")
      .select("id", { count: "exact", head: true })
      .eq("employee_id", employeeId)
      .eq("status", "pending_approval"),
    supabase
      .from("employee_advances")
      .select("id", { count: "exact", head: true })
      .eq("employee_id", employeeId)
      .eq("status", "pending_approval"),
    supabase
      .from("employee_bonuses")
      .select("id", { count: "exact", head: true })
      .eq("employee_id", employeeId)
      .eq("pay_period", payPeriod)
      .eq("status", "pending_approval"),
  ]);

  if (leaveResult.error) {
    throw new Error(leaveResult.error.message);
  }
  if (advanceResult.error) {
    throw new Error(advanceResult.error.message);
  }
  if (bonusResult.error) {
    throw new Error(bonusResult.error.message);
  }

  return buildEmployeePayrollBlockers({
    pendingLeave: leaveResult.count ?? 0,
    pendingAdvances: advanceResult.count ?? 0,
    pendingBonuses: bonusResult.count ?? 0,
  });
}

export async function getEmployeePayrollPreview(
  employeeId: string,
  payPeriodInput?: string,
): Promise<{
  calculation: EmployeePayrollCalculation | null;
  blockers: EmployeePayrollBlockers;
}> {
  await requirePayrollRead();

  const payPeriod = parsePayPeriodMonth(payPeriodInput ?? currentPayPeriod());
  if (!payPeriod) {
    throw new Error("Invalid pay period.");
  }

  const [calculation, blockers] = await Promise.all([
    loadEmployeePayrollCalculation(employeeId, payPeriod),
    loadEmployeePayrollBlockers(employeeId, payPeriod),
  ]);

  return { calculation, blockers };
}

async function loadPayrollHrNotifications(
  payPeriod: string,
): Promise<PayrollHrNotifications> {
  const supabase = await createClient();

  const [leaveRows, advanceRows, bonusRows, eligibleCount, runResult] =
    await Promise.all([
      supabase
        .from("employee_leave")
        .select("employee_id")
        .eq("status", "pending_approval"),
      supabase
        .from("employee_advances")
        .select("employee_id")
        .eq("status", "pending_approval"),
      supabase
        .from("employee_bonuses")
        .select("employee_id")
        .eq("pay_period", payPeriod)
        .eq("status", "pending_approval"),
      countEligibleEmployeesForPeriod(payPeriod),
      supabase
        .from("payroll_runs")
        .select("id")
        .eq("pay_period", payPeriod)
        .maybeSingle(),
    ]);

  if (leaveRows.error) {
    throw new Error(leaveRows.error.message);
  }
  if (advanceRows.error) {
    throw new Error(advanceRows.error.message);
  }
  if (bonusRows.error) {
    throw new Error(bonusRows.error.message);
  }

  const blockedEmployeeIds = new Set<string>();
  for (const row of leaveRows.data ?? []) {
    blockedEmployeeIds.add(row.employee_id);
  }
  for (const row of advanceRows.data ?? []) {
    blockedEmployeeIds.add(row.employee_id);
  }
  for (const row of bonusRows.data ?? []) {
    blockedEmployeeIds.add(row.employee_id);
  }

  let paidEmployeeCount = 0;
  if (runResult.data?.id) {
    const { count, error } = await supabase
      .from("payroll_lines")
      .select("id", { count: "exact", head: true })
      .eq("payroll_run_id", runResult.data.id)
      .eq("status", "paid");

    if (error) {
      throw new Error(error.message);
    }

    paidEmployeeCount = count ?? 0;
  }

  const pendingLeave = leaveRows.data?.length ?? 0;
  const pendingAdvances = advanceRows.data?.length ?? 0;
  const pendingBonuses = bonusRows.data?.length ?? 0;

  return {
    pendingLeave,
    pendingAdvances,
    pendingBonuses,
    pendingApprovalsTotal: pendingLeave + pendingAdvances + pendingBonuses,
    employeesBlockedByPending: blockedEmployeeIds.size,
    blockedEmployeeIds: [...blockedEmployeeIds],
    unpaidPayrollEmployees: Math.max(0, eligibleCount - paidEmployeeCount),
  };
}

export const getPayrollHrNotifications = cache(
  async (payPeriodInput?: string): Promise<PayrollHrNotifications> => {
    await requirePayrollRead();

    const payPeriod =
      parsePayPeriodMonth(payPeriodInput ?? currentPayPeriod()) ??
      currentPayPeriod();

    return loadPayrollHrNotifications(payPeriod);
  },
);

export const getPendingLeaveCount = cache(async (): Promise<number> => {
  await requirePayrollRead();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("employee_leave")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_approval");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
});

export const getPendingAdvanceCount = cache(async (): Promise<number> => {
  await requirePayrollRead();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("employee_advances")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_approval");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
});

export const getPendingBonusCount = cache(
  async (payPeriodInput?: string): Promise<number> => {
    await requirePayrollRead();
    const payPeriod =
      parsePayPeriodMonth(payPeriodInput ?? currentPayPeriod()) ??
      currentPayPeriod();
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("employee_bonuses")
      .select("id", { count: "exact", head: true })
      .eq("pay_period", payPeriod)
      .eq("status", "pending_approval");

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  },
);

export async function getPaidEmployeeIdsForPayrollPeriod(
  payPeriodInput?: string,
): Promise<string[]> {
  await requirePayrollRead();

  const payPeriod = parsePayPeriodMonth(payPeriodInput ?? currentPayPeriod());
  if (!payPeriod) {
    return [];
  }

  const supabase = await createClient();
  const { data: run } = await supabase
    .from("payroll_runs")
    .select("id")
    .eq("pay_period", payPeriod)
    .maybeSingle();

  if (!run?.id) {
    return [];
  }

  const { data, error } = await supabase
    .from("payroll_lines")
    .select("employee_id")
    .eq("payroll_run_id", run.id)
    .eq("status", "paid");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.employee_id as string);
}

export async function listPayrollLines(
  payPeriodInput?: string,
): Promise<PayrollListRow[]> {
  await requirePayrollRead();

  const payPeriod = parsePayPeriodMonth(payPeriodInput ?? currentPayPeriod());
  if (!payPeriod) {
    throw new Error("Invalid pay period.");
  }

  const supabase = await createClient();
  const { data: run } = await supabase
    .from("payroll_runs")
    .select("id")
    .eq("pay_period", payPeriod)
    .maybeSingle();

  if (!run?.id) {
    return [];
  }

  const { data, error } = await supabase
    .from("payroll_lines")
    .select(
      "id, employee_id, base_salary, working_days_in_period, paid_leave_days, unpaid_leave_days, leave_deduction, bonus_total, advance_deduction, gross_pay, net_pay, status, paid_at, created_at, employees (employee_code, first_name, last_name)",
    )
    .eq("payroll_run_id", run.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const employee = Array.isArray(row.employees)
      ? row.employees[0]
      : row.employees;

    return {
      id: row.id,
      employeeId: row.employee_id,
      employeeCode: employee?.employee_code ?? "—",
      employeeName: employee
        ? `${employee.first_name} ${employee.last_name}`.trim()
        : "—",
      baseSalary: Number(row.base_salary),
      workingDaysInPeriod: row.working_days_in_period,
      paidLeaveDays: row.paid_leave_days,
      unpaidLeaveDays: row.unpaid_leave_days,
      leaveDeduction: Number(row.leave_deduction),
      bonusTotal: Number(row.bonus_total),
      advanceDeduction: Number(row.advance_deduction),
      grossPay: Number(row.gross_pay),
      netPay: Number(row.net_pay),
      advanceAllocations: [],
      status: row.status as "recorded" | "paid",
      paidAt: row.paid_at,
      recordedAt: row.created_at,
    };
  });
}

export async function createPayrollLine(
  employeeId: string,
  payPeriodInput?: string,
): Promise<{ error: string | null }> {
  try {
    const { authUser } = await requirePayrollWrite();
    if (!authUser) {
      return { error: "Not signed in." };
    }

    const payPeriod = parsePayPeriodMonth(payPeriodInput ?? currentPayPeriod());
    if (!payPeriod) {
      return { error: "Invalid pay period." };
    }

    const calculation = await loadEmployeePayrollCalculation(employeeId, payPeriod);
    if (!calculation) {
      return { error: "This employee is not eligible for the selected pay month." };
    }

    const blockers = await loadEmployeePayrollBlockers(employeeId, payPeriod);
    if (blockers.blocked) {
      return { error: blockers.message ?? "Payroll is blocked by pending approvals." };
    }

    const supabase = await createClient();
    const runId = await ensurePayrollRunId(payPeriod, authUser.id);

    const { data: existing } = await supabase
      .from("payroll_lines")
      .select("id, status")
      .eq("payroll_run_id", runId)
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (existing?.status === "paid") {
      return { error: "Payroll for this employee is already marked as paid." };
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("payroll_lines")
        .update({
          base_salary: calculation.baseSalary,
          working_days_in_period: calculation.workingDaysInPeriod,
          paid_leave_days: calculation.paidLeaveDays,
          unpaid_leave_days: calculation.unpaidLeaveDays,
          leave_deduction: calculation.leaveDeduction,
          bonus_total: calculation.bonusTotal,
          advance_deduction: calculation.advanceDeduction,
          gross_pay: calculation.grossPay,
          net_pay: calculation.netPay,
          status: "recorded",
          paid_at: null,
        })
        .eq("id", existing.id);

      if (updateError) {
        return { error: updateError.message };
      }
    } else {
      const { error: insertError } = await supabase.from("payroll_lines").insert({
        payroll_run_id: runId,
        employee_id: employeeId,
        base_salary: calculation.baseSalary,
        working_days_in_period: calculation.workingDaysInPeriod,
        paid_leave_days: calculation.paidLeaveDays,
        unpaid_leave_days: calculation.unpaidLeaveDays,
        leave_deduction: calculation.leaveDeduction,
        bonus_total: calculation.bonusTotal,
        advance_deduction: calculation.advanceDeduction,
        gross_pay: calculation.grossPay,
        net_pay: calculation.netPay,
        status: "recorded",
      });

      if (insertError) {
        return { error: insertError.message };
      }
    }

    await syncPayrollRunStatus(runId, payPeriod);
    await revalidateHr("/hr");
    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save payroll.",
    };
  }
}

async function applyAdvanceDeductionsForLine(
  lineId: string,
  employeeId: string,
  payPeriod: string,
  calculation: PayrollLineCalculation,
) {
  const supabase = await createClient();

  await supabase
    .from("payroll_advance_deductions")
    .delete()
    .eq("payroll_line_id", lineId);

  for (const allocation of calculation.advanceAllocations) {
    const { data: advance, error: advanceError } = await supabase
      .from("employee_advances")
      .select("amount, amount_repaid")
      .eq("id", allocation.advanceId)
      .single();

    if (advanceError || !advance) {
      throw new Error(advanceError?.message ?? "Advance not found.");
    }

    const newRepaid =
      Math.round((Number(advance.amount_repaid) + allocation.amount) * 100) / 100;

    const { error: updateAdvanceError } = await supabase
      .from("employee_advances")
      .update({ amount_repaid: newRepaid })
      .eq("id", allocation.advanceId);

    if (updateAdvanceError) {
      throw new Error(updateAdvanceError.message);
    }

    const { error: deductionError } = await supabase
      .from("payroll_advance_deductions")
      .insert({
        payroll_line_id: lineId,
        advance_id: allocation.advanceId,
        amount_deducted: allocation.amount,
      });

    if (deductionError) {
      throw new Error(deductionError.message);
    }
  }

  await supabase
    .from("employee_bonuses")
    .update({ payroll_line_id: lineId })
    .eq("employee_id", employeeId)
    .eq("pay_period", payPeriod)
    .eq("status", "approved");
}

export async function markPayrollLinePaid(
  lineId: string,
): Promise<{ error: string | null }> {
  try {
    await requireHrAdmin();
    const supabase = await createClient();

    const { data: line, error: lineError } = await supabase
      .from("payroll_lines")
      .select(
        "id, employee_id, status, payroll_runs (pay_period)",
      )
      .eq("id", lineId)
      .single();

    if (lineError || !line) {
      return { error: lineError?.message ?? "Payroll record not found." };
    }

    if (line.status === "paid") {
      return { error: "This payroll is already marked as paid." };
    }

    const run = Array.isArray(line.payroll_runs)
      ? line.payroll_runs[0]
      : line.payroll_runs;
    const payPeriod = run?.pay_period;
    if (!payPeriod) {
      return { error: "Pay period not found." };
    }

    const calculation = await loadEmployeePayrollCalculation(
      line.employee_id,
      payPeriod,
    );
    if (!calculation) {
      return { error: "Could not recalculate payroll for this employee." };
    }

    await applyAdvanceDeductionsForLine(
      lineId,
      line.employee_id,
      payPeriod,
      calculation,
    );

    const { error: paidError } = await supabase
      .from("payroll_lines")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        base_salary: calculation.baseSalary,
        working_days_in_period: calculation.workingDaysInPeriod,
        paid_leave_days: calculation.paidLeaveDays,
        unpaid_leave_days: calculation.unpaidLeaveDays,
        leave_deduction: calculation.leaveDeduction,
        bonus_total: calculation.bonusTotal,
        advance_deduction: calculation.advanceDeduction,
        gross_pay: calculation.grossPay,
        net_pay: calculation.netPay,
      })
      .eq("id", lineId);

    if (paidError) {
      return { error: paidError.message };
    }

    const { data: runRow } = await supabase
      .from("payroll_lines")
      .select("payroll_run_id")
      .eq("id", lineId)
      .single();

    if (runRow?.payroll_run_id) {
      await syncPayrollRunStatus(runRow.payroll_run_id, payPeriod);
    }

    await revalidateHr("/hr");
    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not mark as paid.",
    };
  }
}

export const getPayrollDueBannerStatus = cache(
  async (role: AppRole): Promise<PayrollDueBannerStatus | null> => {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const previewCookie = cookieStore.get(PAYROLL_BANNER_PREVIEW_COOKIE)?.value;
    const previewHeader = headerStore.get("x-payroll-banner-preview") === "1";
    const preview =
      isPayrollBannerPreviewEnabled({
        cookieValue: previewCookie,
      }) || previewHeader;

    if (!canReceivePayrollDueBanner(role)) {
      return null;
    }

    if (!isPayrollDueWindow() && !preview) {
      return null;
    }

    const payPeriod = payPeriodForLocalDate();
    const supabase = await createClient();

    const [eligibleCount, runResult] = await Promise.all([
      countEligibleEmployeesForPeriod(payPeriod),
      supabase
        .from("payroll_runs")
        .select("id")
        .eq("pay_period", payPeriod)
        .maybeSingle(),
    ]);

    let paidEmployeeCount = 0;
    let recordedCount = 0;

    if (runResult.data?.id) {
      const [paidResult, recordedResult] = await Promise.all([
        supabase
          .from("payroll_lines")
          .select("id", { count: "exact", head: true })
          .eq("payroll_run_id", runResult.data.id)
          .eq("status", "paid"),
        supabase
          .from("payroll_lines")
          .select("id", { count: "exact", head: true })
          .eq("payroll_run_id", runResult.data.id),
      ]);

      if (paidResult.error) {
        throw new Error(paidResult.error.message);
      }
      if (recordedResult.error) {
        throw new Error(recordedResult.error.message);
      }

      paidEmployeeCount = paidResult.count ?? 0;
      recordedCount = recordedResult.count ?? 0;
    }

    const shouldShow = shouldShowPayrollDueBanner({
      eligibleCount,
      paidEmployeeCount,
    });

    if (!shouldShow) {
      return preview ? buildPayrollDueBannerPreviewStatus(payPeriod) : null;
    }

    return buildPayrollDueBannerStatus({
      payPeriod,
      eligibleCount,
      paidEmployeeCount,
      recordedCount,
      runId: runResult.data?.id ?? null,
      isPreview: preview || undefined,
    });
  },
);

export async function listLeaveRecords(): Promise<LeaveListRow[]> {
  await requirePayrollRead();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employee_leave")
    .select(
      "id, employee_id, leave_type, start_date, end_date, reason, status, approved_by, created_at, employees (employee_code, first_name, last_name)",
    )
    .order("start_date", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  const nameByUserId = await resolveUserDisplayNames(
    (data ?? []).map((row) => row.approved_by),
  );

  return (data ?? []).map((row) => {
    const employee = Array.isArray(row.employees)
      ? row.employees[0]
      : row.employees;
    return {
      id: row.id,
      employeeId: row.employee_id,
      employeeCode: employee?.employee_code ?? "—",
      employeeName: employee
        ? `${employee.first_name} ${employee.last_name}`.trim()
        : "—",
      leaveType: row.leave_type as LeaveType,
      startDate: row.start_date,
      endDate: row.end_date,
      reason: row.reason,
      status: row.status,
      recordedAt: row.created_at,
      approvedByName: nameFromMap(nameByUserId, row.approved_by),
    };
  });
}

export async function createLeaveRecord(formData: FormData) {
  const { authUser } = await requirePayrollWrite();
  if (!authUser) {
    throw new Error("Not signed in.");
  }

  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const leaveType = String(formData.get("leave_type") ?? "") as LeaveType;
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!employeeId || !startDate || !endDate) {
    throw new Error("Employee and leave dates are required.");
  }

  if (endDate < startDate) {
    throw new Error("End date cannot be before start date.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("employee_leave").insert({
    employee_id: employeeId,
    leave_type: leaveType,
    start_date: startDate,
    end_date: endDate,
    reason,
    created_by: authUser.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  await revalidateHr("/hr");
}

export async function approveLeaveRecord(leaveId: string) {
  const session = await requireHrAdmin();
  const approverId = requireActorUserId(session);

  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_leave")
    .update({
      status: "approved",
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", leaveId)
    .eq("status", "pending_approval");

  if (error) {
    throw new Error(error.message);
  }

  await revalidateHr("/hr");
}

export async function listAdvanceRecords(): Promise<AdvanceListRow[]> {
  await requirePayrollRead();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employee_advances")
    .select(
      "id, employee_id, amount, amount_repaid, date_issued, reason, status, employees (employee_code, first_name, last_name)",
    )
    .order("date_issued", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const employee = Array.isArray(row.employees)
      ? row.employees[0]
      : row.employees;
    const amount = Number(row.amount);
    const amountRepaid = Number(row.amount_repaid);
    return {
      id: row.id,
      employeeId: row.employee_id,
      employeeCode: employee?.employee_code ?? "—",
      employeeName: employee
        ? `${employee.first_name} ${employee.last_name}`.trim()
        : "—",
      amount,
      amountRepaid,
      balance: Math.round((amount - amountRepaid) * 100) / 100,
      dateIssued: row.date_issued,
      reason: row.reason,
      status: row.status,
    };
  });
}

export async function createAdvanceRecord(formData: FormData) {
  const { authUser } = await requirePayrollWrite();
  if (!authUser) {
    throw new Error("Not signed in.");
  }

  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const amount = parseAmount(String(formData.get("amount") ?? ""), "Amount");
  const dateIssued =
    String(formData.get("date_issued") ?? "").trim() ||
    new Date().toISOString().slice(0, 10);
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!employeeId) {
    throw new Error("Employee is required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("employee_advances").insert({
    employee_id: employeeId,
    amount,
    date_issued: dateIssued,
    reason,
    created_by: authUser.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  await revalidateHr("/hr");
}

export async function approveAdvanceRecord(advanceId: string) {
  const session = await requireHrAdmin();
  const approverId = requireActorUserId(session);

  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_advances")
    .update({
      status: "approved",
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", advanceId)
    .eq("status", "pending_approval");

  if (error) {
    throw new Error(error.message);
  }

  await revalidateHr("/hr");
}

export async function listBonusRecords(
  payPeriodInput?: string,
): Promise<BonusListRow[]> {
  await requirePayrollRead();

  const payPeriod = parsePayPeriodMonth(payPeriodInput ?? currentPayPeriod());
  if (!payPeriod) {
    throw new Error("Invalid pay period.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_bonuses")
    .select(
      "id, employee_id, amount, pay_period, bonus_date, reason, status, employees (employee_code, first_name, last_name)",
    )
    .eq("pay_period", payPeriod)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const employee = Array.isArray(row.employees)
      ? row.employees[0]
      : row.employees;
    return {
      id: row.id,
      employeeId: row.employee_id,
      employeeCode: employee?.employee_code ?? "—",
      employeeName: employee
        ? `${employee.first_name} ${employee.last_name}`.trim()
        : "—",
      amount: Number(row.amount),
      payPeriod: row.pay_period,
      bonusDate: row.bonus_date,
      reason: row.reason,
      status: row.status,
    };
  });
}

export async function createBonusRecord(formData: FormData) {
  const { authUser } = await requirePayrollWrite();
  if (!authUser) {
    throw new Error("Not signed in.");
  }

  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const amount = parseAmount(String(formData.get("amount") ?? ""), "Amount");
  const payPeriod = parsePayPeriodMonth(
    String(formData.get("pay_period") ?? currentPayPeriod()),
  );
  const bonusDate =
    String(formData.get("bonus_date") ?? "").trim() ||
    new Date().toISOString().slice(0, 10);
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!employeeId || !payPeriod) {
    throw new Error("Employee and pay period are required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("employee_bonuses").insert({
    employee_id: employeeId,
    amount,
    pay_period: payPeriod,
    bonus_date: bonusDate,
    reason,
    created_by: authUser.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  await revalidateHr("/hr");
}

export async function approveBonusRecord(bonusId: string) {
  const session = await requireHrAdmin();
  const approverId = requireActorUserId(session);

  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_bonuses")
    .update({
      status: "approved",
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", bonusId)
    .eq("status", "pending_approval");

  if (error) {
    throw new Error(error.message);
  }

  await revalidateHr("/hr");
}

export const getEmployeesForPayrollSelect = cache(async () => {
  await requirePayrollRead();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_code, first_name, last_name, department")
    .in("status", ["active", "on_leave"])
    .order("last_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    employee_code: row.employee_code,
    first_name: row.first_name,
    last_name: row.last_name,
    department: row.department,
  }));
});

export type PayrollSelectEmployee = Awaited<
  ReturnType<typeof getEmployeesForPayrollSelect>
>[number];
