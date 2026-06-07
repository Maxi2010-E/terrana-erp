export const EXPENSE_HUB_TABS = ["daily", "operational"] as const;

export type ExpenseHubTab = (typeof EXPENSE_HUB_TABS)[number];

export function defaultExpenseTab(): ExpenseHubTab {
  return "daily";
}

export function resolveExpenseTab(tabInput: string | undefined): ExpenseHubTab {
  const fallback = defaultExpenseTab();
  if (!tabInput) {
    return fallback;
  }

  if (!EXPENSE_HUB_TABS.includes(tabInput as ExpenseHubTab)) {
    return fallback;
  }

  return tabInput as ExpenseHubTab;
}

export function expenseTabSearchPlaceholder(tab: ExpenseHubTab): string {
  switch (tab) {
    case "daily":
      return "Search daily expenses…";
    case "operational":
      return "Search operational expenses…";
  }
}
