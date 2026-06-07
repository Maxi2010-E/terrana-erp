import type { HrTab } from "@/lib/hr/hub";

export function buildHrHubRedirect(
  tab: HrTab,
  params: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams();
  search.set("tab", tab);

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  return `/hr?${search.toString()}`;
}
