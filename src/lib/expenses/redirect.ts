import type { ExpenseHubTab } from "@/lib/expenses/hub";

export function buildExpensesHubRedirect(
  tab: ExpenseHubTab,
  params: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams();
  search.set("tab", tab);

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  return `/expenses?${search.toString()}`;
}
