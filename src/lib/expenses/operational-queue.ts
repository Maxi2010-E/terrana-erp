import {
  OPERATIONAL_EXPENSE_TYPES,
  OPERATIONAL_EXPENSE_TYPE_LABELS,
  type OperationalExpenseType,
} from "@/lib/expenses/constants";
import type { OperationalExpenseNotificationCounts } from "@/lib/expenses/notifications";

/** Expense types with an automatic “cost to record” queue. */
export const OPERATIONAL_EXPENSE_QUEUE_TYPES = [
  "cleaning",
  "grading",
  "field_transfer_out",
  "field_transfer_in",
  "truck_offloading",
] as const;

export type OperationalExpenseQueueType =
  (typeof OPERATIONAL_EXPENSE_QUEUE_TYPES)[number];

export type OperationalExpenseDashboardCard = {
  type: OperationalExpenseType;
  label: string;
  description: string;
  href: string | null;
  disabled: boolean;
  disabledReason?: string;
  hasQueue: boolean;
  countKey?: keyof Pick<
    OperationalExpenseNotificationCounts,
    | "cleaningAwaitingRecord"
    | "gradingAwaitingRecord"
    | "fieldTransferOutAwaitingRecord"
    | "fieldTransferInAwaitingRecord"
    | "truckOffloadingAwaitingRecord"
  >;
};

const CARD_DESCRIPTIONS: Record<OperationalExpenseType, string> = {
  cleaning: "Processing cleaning",
  grading: "Export grading",
  field_transfer_out: "To processing",
  field_transfer_in: "Pre-stock into warehouse",
  truck_offloading: "Off-site unload",
  warehouse_loading: "Export container load",
  miscellaneous: "Manual entry",
};

export const OPERATIONAL_EXPENSE_DASHBOARD_CARDS: OperationalExpenseDashboardCard[] =
  OPERATIONAL_EXPENSE_TYPES.map((type) => {
    if (type === "miscellaneous" || type === "warehouse_loading") {
      return {
        type,
        label: OPERATIONAL_EXPENSE_TYPE_LABELS[type],
        description: CARD_DESCRIPTIONS[type],
        href: `/expenses?tab=operational&create=1&type=${type}`,
        disabled: false,
        hasQueue: false,
      };
    }

    const countKeyMap = {
      cleaning: "cleaningAwaitingRecord",
      grading: "gradingAwaitingRecord",
      field_transfer_out: "fieldTransferOutAwaitingRecord",
      field_transfer_in: "fieldTransferInAwaitingRecord",
      truck_offloading: "truckOffloadingAwaitingRecord",
    } as const;

    return {
      type,
      label: OPERATIONAL_EXPENSE_TYPE_LABELS[type],
      description: CARD_DESCRIPTIONS[type],
      href: `/expenses?tab=operational&create=1&type=${type}`,
      disabled: false,
      hasQueue: true,
      countKey: countKeyMap[type as OperationalExpenseQueueType],
    };
  });

export function getOperationalAwaitingRecordCount(
  counts: OperationalExpenseNotificationCounts,
  type: OperationalExpenseType,
): number {
  switch (type) {
    case "cleaning":
      return counts.cleaningAwaitingRecord;
    case "grading":
      return counts.gradingAwaitingRecord;
    case "field_transfer_out":
      return counts.fieldTransferOutAwaitingRecord;
    case "field_transfer_in":
      return counts.fieldTransferInAwaitingRecord;
    case "truck_offloading":
      return counts.truckOffloadingAwaitingRecord;
    default:
      return 0;
  }
}
