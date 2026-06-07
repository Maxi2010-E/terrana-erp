"use client";

import { HubSearchInput } from "@/components/hub/hub-search-input";
import type { ExpenseHubTab } from "@/lib/expenses/hub";

type ExpensesHubSearchProps = {
  tab: ExpenseHubTab;
  placeholder: string;
  defaultValue?: string;
  preserveParams?: Record<string, string | undefined>;
};

export function ExpensesHubSearch(props: ExpensesHubSearchProps) {
  return <HubSearchInput basePath="/expenses" {...props} />;
}
