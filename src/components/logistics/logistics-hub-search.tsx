"use client";

import { HubSearchInput } from "@/components/hub/hub-search-input";
import type { LogisticsHubTab } from "@/lib/logistics/hub";

type LogisticsHubSearchProps = {
  tab: LogisticsHubTab;
  placeholder: string;
  defaultValue?: string;
  preserveParams?: Record<string, string | undefined>;
};

export function LogisticsHubSearch(props: LogisticsHubSearchProps) {
  return <HubSearchInput basePath="/logistics" {...props} />;
}
