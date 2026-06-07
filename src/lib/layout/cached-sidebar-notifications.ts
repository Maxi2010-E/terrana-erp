import { cache } from "react";

import {
  getDailyExpenseNotificationCounts,
  getOperationalExpenseApprovalCountsLight,
} from "@/lib/actions/expenses";
import { getPayrollHrNotifications } from "@/lib/actions/payroll";
import { getPaymentNotifications } from "@/lib/actions/payments";
import { getProcessingQueueNotifications } from "@/lib/actions/processing";
import {
  getExportLotAssignmentNotifications,
  getPreStockNotifications,
} from "@/lib/actions/inventory";
import { getProcurementNotifications } from "@/lib/actions/procurement";
import { createMemoryTtlCache } from "@/lib/cache/memory-ttl-cache";
import { canReceiveExpenseNotifications } from "@/lib/expenses/notifications";
import {
  EMPTY_OPERATIONAL_EXPENSE_NOTIFICATIONS,
  type ExpensePageNotificationCounts,
  type OperationalExpenseNotificationCounts,
} from "@/lib/expenses/notifications";
import { canReceivePaymentNotifications } from "@/lib/payments/notifications";
import type { PaymentNotifications } from "@/lib/payments/notifications";
import { canReceiveProcessingQueueNotifications } from "@/lib/processing/notifications";
import type { ProcessingQueueNotifications } from "@/lib/processing/notifications";
import { canReceivePreStockNotifications } from "@/lib/inventory/notifications";
import type {
  ExportLotAssignmentNotifications,
  PreStockNotifications,
} from "@/lib/inventory/notifications";
import { canReceiveProcurementNotifications } from "@/lib/procurement/notifications";
import type { ProcurementNotifications } from "@/lib/procurement/notifications";
import {
  canReceivePayrollHrNotifications,
  type PayrollHrNotifications,
} from "@/lib/payroll/hr-notifications";
import type { AppRole } from "@/lib/roles";

export type SidebarNotificationBundle = {
  procurementNotifications?: ProcurementNotifications;
  processingNotifications?: ProcessingQueueNotifications;
  paymentNotifications?: PaymentNotifications;
  dailyExpenseNotifications?: ExpensePageNotificationCounts;
  operationalExpenseNotifications?: OperationalExpenseNotificationCounts;
  payrollHrNotifications?: PayrollHrNotifications;
  preStockNotifications?: PreStockNotifications;
  exportLotAssignmentNotifications?: ExportLotAssignmentNotifications;
};

const SIDEBAR_NOTIFICATIONS_REVALIDATE_SECONDS = 30;
const sidebarNotificationCache = createMemoryTtlCache<SidebarNotificationBundle>(
  SIDEBAR_NOTIFICATIONS_REVALIDATE_SECONDS * 1000,
);
const sidebarInflight = new Map<string, Promise<SidebarNotificationBundle>>();

const loadSidebarBundleForRequest = cache(
  async (role: AppRole): Promise<SidebarNotificationBundle> => {
    const [
      procurementNotifications,
      processingNotifications,
      paymentNotifications,
      dailyExpenseNotifications,
      operationalExpenseNotifications,
      payrollHrNotifications,
      preStockNotifications,
      exportLotAssignmentNotifications,
    ] = await Promise.all([
      canReceiveProcurementNotifications(role)
        ? getProcurementNotifications()
        : Promise.resolve(undefined),
      canReceiveProcessingQueueNotifications(role)
        ? getProcessingQueueNotifications()
        : Promise.resolve(undefined),
      canReceivePaymentNotifications(role)
        ? getPaymentNotifications()
        : Promise.resolve(undefined),
      canReceiveExpenseNotifications(role)
        ? getDailyExpenseNotificationCounts()
        : Promise.resolve(undefined),
      canReceiveExpenseNotifications(role)
        ? getOperationalExpenseApprovalCountsLight().then((light) => ({
            ...EMPTY_OPERATIONAL_EXPENSE_NOTIFICATIONS,
            ...light,
          }))
        : Promise.resolve(undefined),
      canReceivePayrollHrNotifications(role)
        ? getPayrollHrNotifications()
        : Promise.resolve(undefined),
      canReceivePreStockNotifications(role)
        ? getPreStockNotifications()
        : Promise.resolve(undefined),
      canReceivePreStockNotifications(role)
        ? getExportLotAssignmentNotifications()
        : Promise.resolve(undefined),
    ]);

    return {
      procurementNotifications,
      processingNotifications,
      paymentNotifications,
      dailyExpenseNotifications,
      operationalExpenseNotifications,
      payrollHrNotifications,
      preStockNotifications,
      exportLotAssignmentNotifications,
    };
  },
);

export async function getCachedSidebarNotificationBundle(
  userId: string,
  role: AppRole,
): Promise<SidebarNotificationBundle> {
  const cacheKey = `${userId}:${role}`;
  const memoryHit = sidebarNotificationCache.get(cacheKey);
  if (memoryHit) {
    return memoryHit;
  }

  const inflight = sidebarInflight.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  // Per-request + in-memory TTL only — unstable_cache cannot wrap Supabase reads (cookies).
  const promise = loadSidebarBundleForRequest(role).then((value) => {
    sidebarNotificationCache.set(cacheKey, value);
    return value;
  });

  sidebarInflight.set(cacheKey, promise);

  try {
    return await promise;
  } finally {
    sidebarInflight.delete(cacheKey);
  }
}

export function invalidateSidebarNotificationMemoryCache(
  userId: string,
  role: AppRole,
) {
  sidebarNotificationCache.delete(`${userId}:${role}`);
}
