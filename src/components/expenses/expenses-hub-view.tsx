"use client";

import { useCallback, useEffect, type ReactNode } from "react";

import { ExpensesHubActions } from "@/components/expenses/expenses-hub-actions";
import { ExpensesHubSearch } from "@/components/expenses/expenses-hub-search";
import { ExpensesHubShell } from "@/components/expenses/expenses-hub-shell";
import { EXPENSE_HUB_TAB_CONFIG } from "@/components/expenses/expenses-hub-tab-config";
import { HubTabList } from "@/components/hub/hub-tab-list";
import { useHubTabState } from "@/components/hub/use-hub-tab-state";
import {
  expenseTabSearchPlaceholder,
  resolveExpenseTab,
  type ExpenseHubTab,
} from "@/lib/expenses/hub";
import { expensesTabHref } from "@/lib/expenses/hub-url";
import type { OperationalExpenseType } from "@/lib/expenses/constants";
import type { OperationalExpenseLinkOptions } from "@/lib/expenses/types";
import type { AppRole } from "@/lib/roles";

type ExpensesHubViewProps = {
  initialTab: ExpenseHubTab;
  tabPendingCounts: Partial<Record<ExpenseHubTab, number>>;
  tabReadyCounts?: Partial<Record<ExpenseHubTab, number>>;
  banners: ReactNode;
  pettyCash: ReactNode;
  flash: ReactNode;
  role: AppRole;
  query: string;
  defaultOpenCreate: boolean;
  defaultOperationalType?: OperationalExpenseType;
  operationalLinkOptions?: OperationalExpenseLinkOptions | null;
  status?: string;
  page?: string;
  type?: string;
  panel: ReactNode;
  operationalToolbar: ReactNode | null;
};

export function ExpensesHubView({
  initialTab,
  tabPendingCounts,
  tabReadyCounts,
  banners,
  pettyCash,
  flash,
  role,
  query,
  defaultOpenCreate,
  defaultOperationalType,
  operationalLinkOptions = null,
  status,
  page,
  type,
  panel,
  operationalToolbar,
}: ExpensesHubViewProps) {
  const resolveFromUrl = useCallback(
    (params: URLSearchParams) =>
      resolveExpenseTab(params.get("tab") ?? undefined),
    [],
  );

  const { activeTab, switchTab } = useHubTabState(
    initialTab,
    resolveFromUrl,
    expensesTabHref,
  );

  useEffect(() => {
    if (defaultOpenCreate && activeTab !== initialTab) {
      switchTab(initialTab);
    }
  }, [defaultOpenCreate, initialTab, activeTab, switchTab]);

  return (
    <ExpensesHubShell
      pettyCash={pettyCash}
      tabs={
        <div className="space-y-3">
          <HubTabList
            tabs={EXPENSE_HUB_TAB_CONFIG}
            activeTab={activeTab}
            tabPendingCounts={tabPendingCounts}
            tabReadyCounts={tabReadyCounts}
            onTabChange={switchTab}
          />
          {banners}
        </div>
      }
      flash={flash}
      search={
        <ExpensesHubSearch
          tab={activeTab}
          placeholder={expenseTabSearchPlaceholder(activeTab)}
          defaultValue={query}
          preserveParams={{
            status: activeTab === "operational" ? status : undefined,
            page,
            type: activeTab === "operational" ? type : undefined,
          }}
        />
      }
      actions={
        <ExpensesHubActions
          activeTab={activeTab}
          initialTab={initialTab}
          role={role}
          defaultOpenCreate={defaultOpenCreate}
          defaultOperationalType={defaultOperationalType}
          operationalLinkOptions={operationalLinkOptions}
        />
      }
      toolbar={activeTab === "operational" ? operationalToolbar : null}
    >
      {panel}
    </ExpensesHubShell>
  );
}
