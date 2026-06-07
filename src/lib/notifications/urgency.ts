import type { CSSProperties } from "react";

export type NotificationUrgency = "urgent" | "awareness" | "ready";

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
  ready: {
    background: "#16a34a",
    foreground: "#ffffff",
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
  const colors = notificationColors[urgency];

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
    return "notification-banner-urgent";
  }
  if (urgency === "ready") {
    return "notification-banner-ready";
  }
  return "notification-banner-awareness";
}

export function notificationCardClassName(
  urgency: NotificationUrgency,
): string {
  if (urgency === "urgent") {
    return "notification-card-urgent";
  }
  if (urgency === "ready") {
    return "notification-card-ready";
  }
  return "notification-card-awareness";
}
