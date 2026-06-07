import type { ExpenseHubTab } from "@/lib/expenses/hub";

/** Build `/expenses` query string for a tab switch (clears page; strips tab-incompatible params). */
export function buildExpensesTabQuery(
  tab: ExpenseHubTab,
  current: URLSearchParams,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of current.entries()) {
    if (key === "tab" || key === "page") {
      continue;
    }
    if (tab === "daily" && (key === "status" || key === "type")) {
      continue;
    }
    params.set(key, value);
  }

  params.set("tab", tab);
  return params.toString();
}

export function expensesTabHref(tab: ExpenseHubTab, current: URLSearchParams): string {
  const query = buildExpensesTabQuery(tab, current);
  return query ? `/expenses?${query}` : "/expenses?tab=daily";
}
