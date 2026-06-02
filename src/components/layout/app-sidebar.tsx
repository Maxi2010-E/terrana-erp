"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_ITEMS, filterNavByRole, type NavItem } from "@/lib/navigation";
import { ROLE_LABELS, type AppRole } from "@/lib/roles";
import {
  EMPTY_PROCESSING_QUEUE_NOTIFICATIONS,
  type ProcessingQueueNotifications,
  formatProcessingSidebarTitle,
  hasProcessingSidebarAlert,
  processingSidebarBadges,
} from "@/lib/processing/notifications";
import {
  EMPTY_PROCUREMENT_NOTIFICATIONS,
  type ProcurementNotifications,
  formatProcurementNotificationTitle,
  hasProcurementSidebarAlert,
  procurementSidebarBadges,
} from "@/lib/procurement/notifications";
import {
  formatNotificationCount,
  hasDualNotifications,
  type DualNotificationCounts,
} from "@/lib/notifications/dual-badges";
import {
  notificationBadgeClassName,
  notificationBadgeStyle,
  type NotificationUrgency,
} from "@/lib/notifications/urgency";
import { terranaColors } from "@/lib/theme";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  role: AppRole;
  email?: string;
  procurementNotifications?: ProcurementNotifications;
  processingNotifications?: ProcessingQueueNotifications;
};

const sidebarStyle = {
  backgroundColor: terranaColors.sidebar,
  color: terranaColors.sidebarForeground,
  borderColor: terranaColors.sidebarBorder,
} as const;

function SidebarUser({
  email,
  role,
}: {
  email?: string;
  role: AppRole;
}) {
  const displayName = email?.split("@")[0] ?? "User";

  return (
    <div
      className="mt-auto border-t px-4 py-4"
      style={{ borderColor: terranaColors.sidebarBorder }}
    >
      <div
        className="space-y-3 rounded-xl px-2 py-2"
        style={{ backgroundColor: terranaColors.sidebarHover }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
            style={{
              backgroundColor: terranaColors.brand,
              color: terranaColors.brandForeground,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p
              className="truncate text-xs capitalize"
              style={{ color: terranaColors.sidebarMuted }}
            >
              {ROLE_LABELS[role]}
            </p>
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="w-full border-white/15 bg-transparent text-inherit hover:bg-white/10"
          >
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}

function NavBadge({
  label,
  urgency,
  isActive,
  alertLabel,
}: {
  label: string;
  urgency?: NotificationUrgency | null;
  isActive: boolean;
  alertLabel?: string;
}) {
  if (urgency) {
    return (
      <span
        className={notificationBadgeClassName()}
        style={notificationBadgeStyle(urgency, isActive)}
        title={alertLabel}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
        isActive
          ? "bg-white/20 text-white"
          : "bg-white/10 text-[#eceef2]",
      )}
    >
      {label}
    </span>
  );
}

function NavDualBadges({
  counts,
  isActive,
  title,
}: {
  counts: DualNotificationCounts;
  isActive: boolean;
  title?: string;
}) {
  const urgentLabel = formatNotificationCount(counts.urgent);
  const pendingLabel = formatNotificationCount(counts.pending);

  return (
    <span className="flex items-center gap-1" title={title}>
      {urgentLabel ? (
        <NavBadge
          label={urgentLabel}
          urgency="urgent"
          isActive={isActive}
          alertLabel={title}
        />
      ) : null}
      {pendingLabel ? (
        <NavBadge
          label={pendingLabel}
          urgency="awareness"
          isActive={isActive}
          alertLabel={title}
        />
      ) : null}
    </span>
  );
}

function NavLinks({
  items,
  pathname,
  role,
  procurementNotifications = EMPTY_PROCUREMENT_NOTIFICATIONS,
  processingNotifications = EMPTY_PROCESSING_QUEUE_NOTIFICATIONS,
}: {
  items: NavItem[];
  pathname: string;
  role: AppRole;
  procurementNotifications?: ProcurementNotifications;
  processingNotifications?: ProcessingQueueNotifications;
}) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        if (item.children?.length) {
          return (
            <div key={item.title} className="space-y-1">
              <p
                className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase"
                style={{ color: terranaColors.sidebarMuted }}
              >
                {item.title}
              </p>
              <NavLinks
                items={item.children}
                pathname={pathname}
                role={role}
                procurementNotifications={procurementNotifications}
                processingNotifications={processingNotifications}
              />
            </div>
          );
        }

        if (!item.href) {
          return null;
        }

        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        const isProcurement = item.href === "/procurement";
        const isProcessing = item.href === "/processing";
        const procurementBadges = isProcurement
          ? procurementSidebarBadges(procurementNotifications, role)
          : null;
        const processingBadges = isProcessing
          ? processingSidebarBadges(processingNotifications, role)
          : null;
        const dualBadges = procurementBadges ?? processingBadges;
        const showDual = dualBadges != null && hasDualNotifications(dualBadges);
        const showProcurementAlert =
          isProcurement &&
          hasProcurementSidebarAlert(procurementNotifications, role);
        const showProcessingAlert =
          isProcessing &&
          hasProcessingSidebarAlert(processingNotifications, role);
        const showAlert = showProcurementAlert || showProcessingAlert;

        const alertLabel = showProcurementAlert
          ? formatProcurementNotificationTitle(procurementNotifications, role)
          : showProcessingAlert
            ? formatProcessingSidebarTitle(processingNotifications, role)
            : undefined;

        const phaseLabel = !showDual && item.phase ? `P${item.phase}` : null;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={
              showAlert && alertLabel
                ? `${item.title} — ${alertLabel}`
                : item.title
            }
            className={cn(
              "flex items-center justify-between rounded-full px-3 py-2.5 text-sm transition-colors",
              !isActive && "hover:bg-[#3a3d44]",
            )}
            style={
              isActive
                ? {
                    backgroundColor: terranaColors.brand,
                    color: terranaColors.brandForeground,
                  }
                : undefined
            }
          >
            <span className="flex items-center gap-2.5">
              <item.icon className="size-4 shrink-0 opacity-90" />
              {item.title}
            </span>
            {showDual && dualBadges ? (
              <NavDualBadges
                counts={dualBadges}
                isActive={isActive}
                title={alertLabel}
              />
            ) : phaseLabel ? (
              <NavBadge label={phaseLabel} isActive={isActive} />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarInner({
  role,
  email,
  pathname,
  procurementNotifications = EMPTY_PROCUREMENT_NOTIFICATIONS,
  processingNotifications = EMPTY_PROCESSING_QUEUE_NOTIFICATIONS,
}: {
  role: AppRole;
  email?: string;
  pathname: string;
  procurementNotifications?: ProcurementNotifications;
  processingNotifications?: ProcessingQueueNotifications;
}) {
  const navItems = filterNavByRole(NAV_ITEMS, role);

  return (
    <div className="flex h-full flex-col">
      <div
        className="border-b px-4 py-5"
        style={{ borderColor: terranaColors.sidebarBorder }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
            style={{
              backgroundColor: terranaColors.brand,
              color: terranaColors.brandForeground,
            }}
          >
            T
          </div>
          <div>
            <p className="text-base font-semibold">Terrana ERP</p>
            <p style={{ color: terranaColors.sidebarMuted }} className="text-xs">
              Operations platform
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <NavLinks
          items={navItems}
          pathname={pathname}
          role={role}
          procurementNotifications={procurementNotifications}
          processingNotifications={processingNotifications}
        />
      </div>
      <SidebarUser email={email} role={role} />
    </div>
  );
}

export function AppSidebar({
  role,
  email,
  procurementNotifications = EMPTY_PROCUREMENT_NOTIFICATIONS,
  processingNotifications = EMPTY_PROCESSING_QUEUE_NOTIFICATIONS,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside
        className="hidden w-64 shrink-0 border-r md:block"
        style={sidebarStyle}
      >
        <SidebarInner
          role={role}
          email={email}
          pathname={pathname}
          procurementNotifications={procurementNotifications}
          processingNotifications={processingNotifications}
        />
      </aside>

      <div className="border-b p-3 md:hidden" style={sidebarStyle}>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="border-white/20 bg-white/10 text-inherit hover:bg-white/15"
              />
            }
          >
            <Menu className="size-4" />
            Menu
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 border-r p-0"
            style={sidebarStyle}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <div onClick={() => setOpen(false)}>
              <SidebarInner
                role={role}
                email={email}
                pathname={pathname}
                procurementNotifications={procurementNotifications}
                processingNotifications={processingNotifications}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
