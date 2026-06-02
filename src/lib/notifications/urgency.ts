import type { CSSProperties } from "react";

export type NotificationUrgency = "urgent" | "awareness";

/** Explicit hex colors — default Tailwind red/amber scales are not in our @theme. */
export const notificationColors = {
  urgent: {
    background: "#dc2626",
    foreground: "#ffffff",
    activeRing: "rgba(255, 255, 255, 0.8)",
  },
  awareness: {
    background: "#f59e0b",
    foreground: "#1c1408",
    activeRing: "rgba(255, 255, 255, 0.8)",
  },
} as const;

export function notificationBadgeClassName(): string {
  return "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums";
}

export function notificationBadgeStyle(
  urgency: NotificationUrgency,
  isActive: boolean,
): CSSProperties {
  const colors =
    notificationColors[urgency === "urgent" ? "urgent" : "awareness"];

  return {
    backgroundColor: colors.background,
    color: colors.foreground,
    ...(isActive ? { boxShadow: `inset 0 0 0 2px ${colors.activeRing}` } : {}),
  };
}

export function notificationBannerClassName(
  urgency: NotificationUrgency,
): string {
  if (urgency === "urgent") {
    return "rounded-xl border px-4 py-3 text-sm border-[#dc2626]/35 bg-[#dc2626]/10 text-[#7f1d1d] dark:text-[#fecaca]";
  }

  return "rounded-xl border px-4 py-3 text-sm border-[#f59e0b]/35 bg-[#f59e0b]/10 text-[#78350f] dark:text-[#fde68a]";
}

export function notificationCardClassName(
  urgency: NotificationUrgency,
): string {
  if (urgency === "urgent") {
    return "rounded-2xl border shadow-sm border-[#dc2626]/45 dark:border-[#dc2626]/50";
  }

  return "rounded-2xl border shadow-sm border-[#f59e0b]/45 dark:border-[#f59e0b]/40";
}
