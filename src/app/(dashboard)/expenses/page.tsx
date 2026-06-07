import { Suspense } from "react";

import { ExpensesHubView } from "@/components/expenses/expenses-hub-view";
import { loadExpensesHubNotifications } from "@/components/expenses/expenses-hub-notifications";
import { PettyCashSummaryCard } from "@/components/expenses/petty-cash-summary";
import { getPettyCashSummary, getOperationalExpenseLinkOptions } from "@/lib/actions/expenses";
import { DailyExpensesPanel } from "@/components/expenses/panels/daily-expenses-panel";
import { OperationalExpensesPanel } from "@/components/expenses/panels/operational-expenses-panel";
import { OperationalExpensesToolbar } from "@/components/expenses/panels/operational-expenses-toolbar";
import { SuccessFlash } from "@/components/layout/success-flash";
import { requireActorUserId } from "@/lib/auth/actor-id";
import { requireExpenseRead } from "@/lib/auth/require-role";
import {
  EXPENSE_RECORD_STATUSES,
  OPERATIONAL_EXPENSE_TYPES,
  type ExpenseRecordStatus,
  type OperationalExpenseType,
} from "@/lib/expenses/constants";
import { resolveExpenseTab } from "@/lib/expenses/hub";
import {
  canApproveExpense,
  canRecordExpense,
  canTopUpPettyCash,
} from "@/lib/expenses/permissions";
import type { AppRole } from "@/lib/roles";

type ExpensesHubPageProps = {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    page?: string;
    message?: string;
    create?: string;
    type?: string;
    status?: string;
  }>;
};

function listStatusFilter(status: string | undefined): ExpenseRecordStatus | undefined {
  if (
    status &&
    EXPENSE_RECORD_STATUSES.includes(status as ExpenseRecordStatus)
  ) {
    return status as ExpenseRecordStatus;
  }
  return undefined;
}

function defaultExpenseType(
  type: string | undefined,
): OperationalExpenseType | undefined {
  if (
    type &&
    OPERATIONAL_EXPENSE_TYPES.includes(type as OperationalExpenseType)
  ) {
    return type as OperationalExpenseType;
  }
  return undefined;
}

function successMessage(message: string | undefined): string | null {
  if (message === "created") {
    return "Expense submitted for approval.";
  }
  if (message === "approved") {
    return "Expense approved. Staff can pay and mark Payment made.";
  }
  if (message === "paid_now" || message === "payment_made") {
    return "Payment recorded. Petty cash has been updated.";
  }
  if (message === "top_up") {
    return "Petty cash top-up recorded.";
  }
  return null;
}

export default async function ExpensesHubPage({
  searchParams,
}: ExpensesHubPageProps) {
  const params = await searchParams;
  const session = await requireExpenseRead();
  const { role, appUser } = session;
  const effectiveRole = (appUser?.role ?? role) as AppRole;
  const currentUserId = requireActorUserId(session);
  const tab = resolveExpenseTab(params.tab);
  const query = params.q ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const statusFilter = listStatusFilter(params.status);
  const initialExpenseType = defaultExpenseType(params.type);
  const flash = successMessage(params.message);
  const canApprove = canApproveExpense(effectiveRole);
  const canRecord = canRecordExpense(effectiveRole);
  const canTopUp = canTopUpPettyCash(effectiveRole);
  const defaultOpenCreate = params.create === "1";

  const panelPromise =
    tab === "daily"
      ? DailyExpensesPanel({
          page,
          query,
          status: statusFilter,
          role: effectiveRole,
          currentUserId,
        })
      : OperationalExpensesPanel({
          page,
          query,
          status: statusFilter,
          role: effectiveRole,
          currentUserId,
        });

  const toolbarPromise =
    tab === "operational"
      ? OperationalExpensesToolbar({
          canRecord,
          canApprove,
          activeType: initialExpenseType,
          hidePendingStrip: statusFilter === "pending_approval",
        })
      : Promise.resolve(null);

  const [
    { tabPendingCounts, tabReadyCounts, banners },
    pettyCashSummary,
    panel,
    operationalToolbar,
    operationalLinkOptions,
  ] = await Promise.all([
    loadExpensesHubNotifications(effectiveRole),
    getPettyCashSummary(),
    panelPromise,
    toolbarPromise,
    tab === "operational" && canRecord
      ? getOperationalExpenseLinkOptions()
      : Promise.resolve(null),
  ]);

  return (
    <Suspense
      fallback={
        <div className="px-4 py-16 text-center text-sm text-muted-foreground">
          Loading expenses…
        </div>
      }
    >
      <ExpensesHubView
        initialTab={tab}
        tabPendingCounts={tabPendingCounts}
        tabReadyCounts={tabReadyCounts}
        banners={banners}
        pettyCash={
          <PettyCashSummaryCard
            summary={pettyCashSummary}
            canTopUp={canTopUp}
          />
        }
        flash={flash ? <SuccessFlash message={flash} /> : null}
        role={effectiveRole}
        query={query}
        defaultOpenCreate={defaultOpenCreate}
        defaultOperationalType={initialExpenseType}
        operationalLinkOptions={operationalLinkOptions}
        status={params.status}
        page={params.page}
        type={params.type}
        panel={panel}
        operationalToolbar={operationalToolbar}
      />
    </Suspense>
  );
}
