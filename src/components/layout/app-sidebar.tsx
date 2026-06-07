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
  EMPTY_PAYMENT_NOTIFICATIONS,
  type PaymentNotifications,
  formatPaymentNotificationTitle,
  hasPaymentSidebarAlert,
  paymentSidebarBadges,
} from "@/lib/payments/notifications";
import {
  EMPTY_EXPENSE_PAGE_NOTIFICATIONS,
  EMPTY_OPERATIONAL_EXPENSE_NOTIFICATIONS,
  type ExpensePageNotificationCounts,
  type OperationalExpenseNotificationCounts,
  expenseHubSidebarBadges,
  formatExpenseHubSidebarTitle,
  hasExpenseHubSidebarAlert,
} from "@/lib/expenses/notifications";
import {
  EMPTY_PROCUREMENT_NOTIFICATIONS,
  type ProcurementNotifications,
  formatProcurementNotificationTitle,
  hasProcurementSidebarAlert,
  procurementSidebarBadges,
} from "@/lib/procurement/notifications";
import {
  EMPTY_PAYROLL_HR_NOTIFICATIONS,
  type PayrollHrNotifications,
  formatHrHubSidebarTitle,
  hasHrHubSidebarAlert,
  hrHubSidebarBadges,
} from "@/lib/payroll/hr-notifications";
import {
  EMPTY_EXPORT_LOT_ASSIGNMENT_NOTIFICATIONS,
  EMPTY_PRE_STOCK_NOTIFICATIONS,
  type ExportLotAssignmentNotifications,
  type PreStockNotifications,
  formatInventoryHubSidebarTitle,
  hasInventoryHubSidebarAlert,
  inventoryHubSidebarBadges,
} from "@/lib/inventory/notifications";
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
  paymentNotifications?: PaymentNotifications;
  dailyExpenseNotifications?: ExpensePageNotificationCounts;
  operationalExpenseNotifications?: OperationalExpenseNotificationCounts;
  payrollHrNotifications?: PayrollHrNotifications;
  preStockNotifications?: PreStockNotifications;
  exportLotAssignmentNotifications?: ExportLotAssignmentNotifications;
};

export type { AppSidebarProps };

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
      data-layout="sidebar-user"
    >
      <div data-layout="sidebar-user-card">
        <div data-layout="sidebar-user-profile">
          <div data-layout="sidebar-user-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p data-layout="sidebar-user-name">{displayName}</p>
            <p data-layout="sidebar-user-role">{ROLE_LABELS[role]}</p>
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
  const readyLabel = formatNotificationCount(counts.ready ?? 0);

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
      {readyLabel ? (
        <NavBadge
          label={readyLabel}
          urgency="ready"
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
  paymentNotifications = EMPTY_PAYMENT_NOTIFICATIONS,
  dailyExpenseNotifications = EMPTY_EXPENSE_PAGE_NOTIFICATIONS,
  operationalExpenseNotifications = EMPTY_OPERATIONAL_EXPENSE_NOTIFICATIONS,
  payrollHrNotifications = EMPTY_PAYROLL_HR_NOTIFICATIONS,
  preStockNotifications = EMPTY_PRE_STOCK_NOTIFICATIONS,
  exportLotAssignmentNotifications = EMPTY_EXPORT_LOT_ASSIGNMENT_NOTIFICATIONS,
}: {
  items: NavItem[];
  pathname: string;
  role: AppRole;
  procurementNotifications?: ProcurementNotifications;
  processingNotifications?: ProcessingQueueNotifications;
  paymentNotifications?: PaymentNotifications;
  dailyExpenseNotifications?: ExpensePageNotificationCounts;
  operationalExpenseNotifications?: OperationalExpenseNotificationCounts;
  payrollHrNotifications?: PayrollHrNotifications;
  preStockNotifications?: PreStockNotifications;
  exportLotAssignmentNotifications?: ExportLotAssignmentNotifications;
}) {
  return (
    <nav data-nav-root>
      {items.map((item) => {
        if (item.children?.length) {
          return (
            <div key={item.title}>
              <p data-nav-section>{item.title}</p>
              <NavLinks
                items={item.children}
                pathname={pathname}
                role={role}
                procurementNotifications={procurementNotifications}
                processingNotifications={processingNotifications}
                paymentNotifications={paymentNotifications}
                dailyExpenseNotifications={dailyExpenseNotifications}
                operationalExpenseNotifications={operationalExpenseNotifications}
                payrollHrNotifications={payrollHrNotifications}
                preStockNotifications={preStockNotifications}
                exportLotAssignmentNotifications={exportLotAssignmentNotifications}
              />
            </div>
          );
        }

        if (!item.href) {
          return null;
        }

        const isActive =
          item.href === "/hr"
            ? pathname === "/hr" || pathname.startsWith("/hr/")
            : item.href === "/logistics"
              ? pathname === "/logistics" || pathname.startsWith("/logistics/")
              : item.href === "/expenses"
                ? pathname === "/expenses" || pathname.startsWith("/expenses/")
                : item.href === "/inventory"
                  ? pathname === "/inventory" || pathname.startsWith("/inventory/")
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

        const isProcurement = item.href === "/procurement";
        const isProcessing = item.href === "/processing";
        const isPayments = item.href === "/payments";
        const isExpensesHub = item.href === "/expenses";
        const isHrHub = item.href === "/hr";
        const isInventoryHub = item.href === "/inventory";
        const procurementBadges = isProcurement
          ? procurementSidebarBadges(procurementNotifications, role)
          : null;
        const processingBadges = isProcessing
          ? processingSidebarBadges(processingNotifications, role)
          : null;
        const paymentBadges = isPayments
          ? paymentSidebarBadges(paymentNotifications, role)
          : null;
        const expensesHubBadges =
          isExpensesHub &&
          dailyExpenseNotifications &&
          operationalExpenseNotifications
            ? expenseHubSidebarBadges(
                dailyExpenseNotifications,
                operationalExpenseNotifications,
                role,
              )
            : null;
        const hrHubBadges = isHrHub
          ? hrHubSidebarBadges(payrollHrNotifications, role)
          : null;
        const inventoryHubBadges = isInventoryHub
          ? inventoryHubSidebarBadges(
              preStockNotifications,
              exportLotAssignmentNotifications,
            )
          : null;
        const dualBadges =
          procurementBadges ??
          processingBadges ??
          paymentBadges ??
          expensesHubBadges ??
          hrHubBadges ??
          inventoryHubBadges;
        const showDual = dualBadges != null && hasDualNotifications(dualBadges);
        const showProcurementAlert =
          isProcurement &&
          hasProcurementSidebarAlert(procurementNotifications, role);
        const showProcessingAlert =
          isProcessing &&
          hasProcessingSidebarAlert(processingNotifications, role);
        const showPaymentAlert =
          isPayments && hasPaymentSidebarAlert(paymentNotifications, role);
        const showExpensesHubAlert =
          isExpensesHub &&
          dailyExpenseNotifications &&
          operationalExpenseNotifications &&
          hasExpenseHubSidebarAlert(
            dailyExpenseNotifications,
            operationalExpenseNotifications,
            role,
          );
        const showHrHubAlert =
          isHrHub && hasHrHubSidebarAlert(payrollHrNotifications, role);
        const showInventoryHubAlert =
          isInventoryHub &&
          hasInventoryHubSidebarAlert(
            preStockNotifications,
            exportLotAssignmentNotifications,
          );
        const showAlert =
          showProcurementAlert ||
          showProcessingAlert ||
          showPaymentAlert ||
          showExpensesHubAlert ||
          showHrHubAlert ||
          showInventoryHubAlert;

        const alertLabel = showProcurementAlert
          ? formatProcurementNotificationTitle(procurementNotifications, role)
          : showProcessingAlert
            ? formatProcessingSidebarTitle(processingNotifications, role)
            : showPaymentAlert
              ? formatPaymentNotificationTitle(paymentNotifications, role)
              : showExpensesHubAlert &&
                  dailyExpenseNotifications &&
                  operationalExpenseNotifications
                ? formatExpenseHubSidebarTitle(
                    dailyExpenseNotifications,
                    operationalExpenseNotifications,
                    role,
                  )
                : showHrHubAlert
                  ? formatHrHubSidebarTitle(payrollHrNotifications, role)
                  : showInventoryHubAlert
                    ? formatInventoryHubSidebarTitle(
                        preStockNotifications,
                        exportLotAssignmentNotifications,
                      )
                    : undefined;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            data-nav-link
            data-nav-active={isActive ? "true" : undefined}
            aria-current={isActive ? "page" : undefined}
            aria-label={
              showAlert && alertLabel
                ? `${item.title} — ${alertLabel}`
                : item.title
            }
          >
            <span data-nav-link-label>
              <item.icon />
              {item.title}
            </span>
            {showDual && dualBadges ? (
              <NavDualBadges
                counts={dualBadges}
                isActive={isActive}
                title={alertLabel}
              />
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
  paymentNotifications = EMPTY_PAYMENT_NOTIFICATIONS,
  dailyExpenseNotifications = EMPTY_EXPENSE_PAGE_NOTIFICATIONS,
  operationalExpenseNotifications = EMPTY_OPERATIONAL_EXPENSE_NOTIFICATIONS,
  payrollHrNotifications = EMPTY_PAYROLL_HR_NOTIFICATIONS,
  preStockNotifications = EMPTY_PRE_STOCK_NOTIFICATIONS,
  exportLotAssignmentNotifications = EMPTY_EXPORT_LOT_ASSIGNMENT_NOTIFICATIONS,
}: {
  role: AppRole;
  email?: string;
  pathname: string;
  procurementNotifications?: ProcurementNotifications;
  processingNotifications?: ProcessingQueueNotifications;
  paymentNotifications?: PaymentNotifications;
  dailyExpenseNotifications?: ExpensePageNotificationCounts;
  operationalExpenseNotifications?: OperationalExpenseNotificationCounts;
  payrollHrNotifications?: PayrollHrNotifications;
  preStockNotifications?: PreStockNotifications;
  exportLotAssignmentNotifications?: ExportLotAssignmentNotifications;
}) {
  const navItems = filterNavByRole(NAV_ITEMS, role);

  return (
    <div data-layout="sidebar-inner">
      <div data-layout="sidebar-brand">
        <div data-layout="sidebar-brand-mark">
          <div data-layout="sidebar-brand-icon">T</div>
          <div>
            <p data-layout="sidebar-brand-title">Terrana ERP</p>
            <p data-layout="sidebar-brand-subtitle">Operations platform</p>
          </div>
        </div>
      </div>
      <div data-layout="sidebar-nav-scroll">
        <NavLinks
          items={navItems}
          pathname={pathname}
          role={role}
          procurementNotifications={procurementNotifications}
          processingNotifications={processingNotifications}
          paymentNotifications={paymentNotifications}
          dailyExpenseNotifications={dailyExpenseNotifications}
          operationalExpenseNotifications={operationalExpenseNotifications}
          payrollHrNotifications={payrollHrNotifications}
          preStockNotifications={preStockNotifications}
          exportLotAssignmentNotifications={exportLotAssignmentNotifications}
        />
      </div>
      <SidebarUser email={email} role={role} />
    </div>
  );
}

export function AppSidebarDesktop({
  role,
  email,
  procurementNotifications = EMPTY_PROCUREMENT_NOTIFICATIONS,
  processingNotifications = EMPTY_PROCESSING_QUEUE_NOTIFICATIONS,
  paymentNotifications = EMPTY_PAYMENT_NOTIFICATIONS,
  dailyExpenseNotifications = EMPTY_EXPENSE_PAGE_NOTIFICATIONS,
  operationalExpenseNotifications = EMPTY_OPERATIONAL_EXPENSE_NOTIFICATIONS,
  payrollHrNotifications = EMPTY_PAYROLL_HR_NOTIFICATIONS,
  preStockNotifications = EMPTY_PRE_STOCK_NOTIFICATIONS,
  exportLotAssignmentNotifications = EMPTY_EXPORT_LOT_ASSIGNMENT_NOTIFICATIONS,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <SidebarInner
      role={role}
      email={email}
      pathname={pathname}
      procurementNotifications={procurementNotifications}
      processingNotifications={processingNotifications}
      paymentNotifications={paymentNotifications}
      dailyExpenseNotifications={dailyExpenseNotifications}
      operationalExpenseNotifications={operationalExpenseNotifications}
      payrollHrNotifications={payrollHrNotifications}
      preStockNotifications={preStockNotifications}
      exportLotAssignmentNotifications={exportLotAssignmentNotifications}
    />
  );
}

export function AppSidebarMobile({
  role,
  email,
  procurementNotifications = EMPTY_PROCUREMENT_NOTIFICATIONS,
  processingNotifications = EMPTY_PROCESSING_QUEUE_NOTIFICATIONS,
  paymentNotifications = EMPTY_PAYMENT_NOTIFICATIONS,
  dailyExpenseNotifications = EMPTY_EXPENSE_PAGE_NOTIFICATIONS,
  operationalExpenseNotifications = EMPTY_OPERATIONAL_EXPENSE_NOTIFICATIONS,
  payrollHrNotifications = EMPTY_PAYROLL_HR_NOTIFICATIONS,
  preStockNotifications = EMPTY_PRE_STOCK_NOTIFICATIONS,
  exportLotAssignmentNotifications = EMPTY_EXPORT_LOT_ASSIGNMENT_NOTIFICATIONS,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div data-nav-mobile-bar>
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
          className="flex h-full w-72 flex-col border-r p-0"
          style={sidebarStyle}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="h-full min-h-0" onClick={() => setOpen(false)}>
            <SidebarInner
              role={role}
              email={email}
              pathname={pathname}
              procurementNotifications={procurementNotifications}
              processingNotifications={processingNotifications}
              paymentNotifications={paymentNotifications}
              dailyExpenseNotifications={dailyExpenseNotifications}
              operationalExpenseNotifications={operationalExpenseNotifications}
              payrollHrNotifications={payrollHrNotifications}
              preStockNotifications={preStockNotifications}
              exportLotAssignmentNotifications={exportLotAssignmentNotifications}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** @deprecated Use AppSidebarDesktop — kept for Suspense fallbacks. */
export function AppSidebar(props: AppSidebarProps) {
  return <AppSidebarDesktop {...props} />;
}
