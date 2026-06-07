import type { AppRole } from "@/lib/roles";

export const HR_TABS = [
  "employees",
  "payroll",
  "leave",
  "advances",
  "bonuses",
] as const;

export type HrTab = (typeof HR_TABS)[number];

export function defaultHrTab(role: AppRole): HrTab {
  if (role === "super_admin" || role === "admin") {
    return "employees";
  }
  return "payroll";
}

export function canAccessHrTab(tab: HrTab, role: AppRole): boolean {
  if (tab === "employees") {
    return role === "super_admin" || role === "admin";
  }
  return role === "super_admin" || role === "admin";
}

export function resolveHrTab(
  tabInput: string | undefined,
  role: AppRole,
): HrTab {
  const fallback = defaultHrTab(role);
  if (!tabInput) {
    return fallback;
  }

  if (!HR_TABS.includes(tabInput as HrTab)) {
    return fallback;
  }

  const tab = tabInput as HrTab;
  if (!canAccessHrTab(tab, role)) {
    return fallback;
  }

  return tab;
}

export function hrTabSearchPlaceholder(tab: HrTab): string {
  switch (tab) {
    case "employees":
      return "Search employees…";
    case "payroll":
      return "Search payroll…";
    case "leave":
      return "Search leave…";
    case "advances":
      return "Search advances…";
    case "bonuses":
      return "Search bonuses…";
  }
}
