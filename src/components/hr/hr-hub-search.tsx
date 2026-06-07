"use client";

import { HubSearchInput } from "@/components/hub/hub-search-input";
import type { HrTab } from "@/lib/hr/hub";

type HrHubSearchProps = {
  tab: HrTab;
  placeholder: string;
  defaultValue?: string;
  preserveParams?: Record<string, string | undefined>;
};

export function HrHubSearch(props: HrHubSearchProps) {
  return <HubSearchInput basePath="/hr" {...props} />;
}
