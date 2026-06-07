import type { HrTab } from "@/lib/hr/hub";

export function buildHrTabQuery(tab: HrTab, current: URLSearchParams): string {
  const params = new URLSearchParams();

  for (const [key, value] of current.entries()) {
    if (key === "tab" || key === "page") {
      continue;
    }
    params.set(key, value);
  }

  params.set("tab", tab);
  return params.toString();
}

export function hrTabHref(tab: HrTab, current: URLSearchParams): string {
  return `/hr?${buildHrTabQuery(tab, current)}`;
}
