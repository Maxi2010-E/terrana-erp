/**
 * Phase 7 expenses — logic, permissions, UI wiring audit (no database).
 * Run: node scripts/test-expenses-logic.mjs
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DAILY_EXPENSE_CATEGORIES,
  OPERATIONAL_EXPENSE_TYPES,
} from "../src/lib/expenses/constants.ts";
import { calcOperationalTotal, OPERATIONAL_EXPENSE_LINK_RULES } from "../src/lib/expenses/link-rules.ts";
import {
  canApproveExpense,
  canRecordExpense,
  canTopUpPettyCash,
} from "../src/lib/expenses/permissions.ts";
import {
  OPERATIONAL_EXPENSE_DASHBOARD_CARDS,
  getOperationalAwaitingRecordCount,
} from "../src/lib/expenses/operational-queue.ts";
import {
  emptyOperationalPendingByType,
  formatDailyExpenseUrgentBanner,
  formatExpenseSubmittedPendingBanner,
  formatOperationalExpensePendingStripTitle,
  formatOperationalExpenseSidebarTitle,
  getOperationalPendingApprovalCount,
  operationalExpensesAwaitingRecordTotal,
} from "../src/lib/expenses/notifications.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXPENSE_COMPONENTS = join(ROOT, "src/components/expenses");
const EXPENSE_ACTIONS = join(ROOT, "src/lib/actions/expenses.ts");

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

console.log("Operational totals");
assert("10 bags × 50 = 500", calcOperationalTotal(10, 50) === 500);
assert("3 bags × 33.33 rounds to 99.99", calcOperationalTotal(3, 33.33) === 99.99);
assert("1 bag × 0 = 0", calcOperationalTotal(1, 0) === 0);

console.log("\nLink rules");
assert(
  "cleaning requires processing session",
  OPERATIONAL_EXPENSE_LINK_RULES.cleaning.requiredField === "processing_session_id",
);
assert(
  "field transfer out requires processing session",
  OPERATIONAL_EXPENSE_LINK_RULES.field_transfer_out.requiredField ===
    "processing_session_id",
);
assert(
  "grading requires inventory batch",
  OPERATIONAL_EXPENSE_LINK_RULES.grading.requiredField === "inventory_batch_id",
);
assert(
  "truck offloading requires procurement batch",
  OPERATIONAL_EXPENSE_LINK_RULES.truck_offloading.requiredField ===
    "procurement_batch_id",
);
assert(
  "field transfer in requires pre-stock",
  OPERATIONAL_EXPENSE_LINK_RULES.field_transfer_in.requiredField === "pre_stock_id",
);
assert(
  "miscellaneous has no link",
  OPERATIONAL_EXPENSE_LINK_RULES.miscellaneous.requiredField === null,
);
assert(
  "warehouse loading enabled",
  OPERATIONAL_EXPENSE_LINK_RULES.warehouse_loading.disabled !== true,
);

console.log("\nPermissions");
assert("cash_manager can record", canRecordExpense("cash_manager"));
assert("warehouse_manager can record", canRecordExpense("warehouse_manager"));
assert("legacy accounts alias can record", canRecordExpense("accounts"));
assert("cash_manager cannot approve", !canApproveExpense("cash_manager"));
assert("cash_manager cannot top up", !canTopUpPettyCash("cash_manager"));
assert("admin can approve", canApproveExpense("admin"));
assert("admin can top up", canTopUpPettyCash("admin"));
assert(
  "legacy inventory_manager alias can record",
  canRecordExpense("inventory_manager"),
);
assert("logistics_manager cannot record", !canRecordExpense("logistics_manager"));

console.log("\nDashboard cards");
assert(
  "7 operational cards",
  OPERATIONAL_EXPENSE_DASHBOARD_CARDS.length === OPERATIONAL_EXPENSE_TYPES.length,
);
const warehouseCard = OPERATIONAL_EXPENSE_DASHBOARD_CARDS.find(
  (card) => card.type === "warehouse_loading",
);
assert("warehouse card enabled", warehouseCard?.disabled === false);
assert(
  "warehouse card opens create dialog",
  warehouseCard?.href === "/expenses?tab=operational&create=1&type=warehouse_loading",
);
const miscCard = OPERATIONAL_EXPENSE_DASHBOARD_CARDS.find(
  (card) => card.type === "miscellaneous",
);
assert(
  "miscellaneous card opens create dialog",
  miscCard?.href === "/expenses?tab=operational&create=1&type=miscellaneous",
);
assert("miscellaneous has no queue", miscCard?.hasQueue === false);

const sampleCounts = {
  pendingApproval: 2,
  submittedPending: 1,
  cleaningAwaitingRecord: 3,
  gradingAwaitingRecord: 1,
  fieldTransferOutAwaitingRecord: 0,
  fieldTransferInAwaitingRecord: 2,
  truckOffloadingAwaitingRecord: 0,
  pendingApprovalByType: {
    ...emptyOperationalPendingByType(),
    cleaning: 1,
    miscellaneous: 1,
  },
};

assert(
  "awaiting record total sums queue types",
  operationalExpensesAwaitingRecordTotal(sampleCounts) === 6,
);
assert(
  "cleaning awaiting count",
  getOperationalAwaitingRecordCount(sampleCounts, "cleaning") === 3,
);
assert(
  "miscellaneous awaiting count is zero",
  getOperationalAwaitingRecordCount(sampleCounts, "miscellaneous") === 0,
);
assert(
  "pending approval by type",
  getOperationalPendingApprovalCount(sampleCounts, "miscellaneous") === 1,
);

console.log("\nNotification copy");
assert(
  "daily urgent banner singular",
  formatDailyExpenseUrgentBanner(1)?.includes("1 daily expense"),
);
assert(
  "daily urgent banner hidden at zero",
  formatDailyExpenseUrgentBanner(0) === null,
);
assert(
  "accounts submitted banner",
  formatExpenseSubmittedPendingBanner(2)?.includes("2 expenses"),
);
assert(
  "operational pending strip",
  formatOperationalExpensePendingStripTitle(3)?.includes("3 operational"),
);
assert(
  "operational sidebar combines approval + to record",
  formatOperationalExpenseSidebarTitle(sampleCounts, "admin").includes("·"),
);

console.log("\nConstants coverage");
assert(
  "repairs category exists",
  DAILY_EXPENSE_CATEGORIES.includes("repairs"),
);
assert(
  "all operational types have link rules",
  OPERATIONAL_EXPENSE_TYPES.every((type) => OPERATIONAL_EXPENSE_LINK_RULES[type]),
);

console.log("\nServer error messages documented in actions");
const actionsSource = readFileSync(EXPENSE_ACTIONS, "utf8");
const requiredErrors = [
  "Enter a valid top-up amount.",
  "Select a valid category.",
  "Description is required.",
  "Enter a valid amount.",
  "This expense exceeds the petty cash balance.",
  "Daily expense is already approved.",
  "Approving this expense would exceed the petty cash balance.",
  "Select a valid expense type.",
  "Enter a description for this miscellaneous expense.",
  "Select a processing session.",
  "Select an inventory batch.",
  "Select an off-site procurement batch.",
  "Select a pre-stock record.",
  "Operational expense is already approved.",
  "Payment was already marked as made.",
  "markDailyExpensePaymentMade",
  "markOperationalExpensePaymentMade",
  "A cleaning expense has already been submitted for this processing session.",
  "A grading expense has already been submitted for this inventory batch.",
];

for (const message of requiredErrors) {
  assert(`actions expose: ${message}`, actionsSource.includes(message));
}

console.log("\nUI components — buttons and error handling");
const uiChecks = [
  {
    file: "daily-expense-create-dialog.tsx",
    mustInclude: [
      'role="alert"',
      "createDailyExpense",
      "Submit for approval",
      "setPending(false)",
      "result.error",
    ],
  },
  {
    file: "petty-cash-top-up-dialog.tsx",
    mustInclude: [
      'role="alert"',
      "addPettyCashTopUp",
      "Save top-up",
      "setPending(false)",
    ],
  },
  {
    file: "operational-expense-form.tsx",
    mustInclude: [
      'role="alert"',
      "createOperationalExpense",
      "Submit for approval",
      "isMiscellaneous",
      "operational_description",
    ],
  },
  {
    file: "expense-approve-button.tsx",
    mustInclude: [
      'role="alert"',
      "approveDailyExpenseAction",
      "approveOperationalExpenseAction",
      "Approving…",
    ],
  },
  {
    file: "operational-expense-create-dialog.tsx",
    mustInclude: ["New operational expense", "OperationalExpenseForm"],
  },
  {
    file: "operational-expense-list-table.tsx",
    mustInclude: ["No operational expenses found.", "ExpenseApproveButton"],
  },
  {
    file: "daily-expense-list-table.tsx",
    mustInclude: [
      "No daily expenses found.",
      "ExpenseApproveButton",
      "ExpensePaymentMadeButton",
    ],
  },
  {
    file: "expense-payment-made-button.tsx",
    mustInclude: [
      'role="alert"',
      "markDailyExpensePaymentMadeAction",
      "Payment made",
    ],
  },
  {
    file: "petty-cash-summary.tsx",
    mustInclude: [
      "PettyCashTopUpHistoryDialog",
      "lastTopUp",
      "Last top-up",
    ],
  },
  {
    file: "petty-cash-top-up-history-dialog.tsx",
    mustInclude: [
      'role="alert"',
      "getPettyCashTopUpsList",
      "View top-up history",
      "Previous",
      "Next",
    ],
  },
  {
    file: "operational-expense-dashboard-cards.tsx",
    mustInclude: [
      "status=pending_approval",
      "OPERATIONAL_EXPENSE_DASHBOARD_CARDS",
    ],
  },
];

for (const check of uiChecks) {
  const content = readFileSync(join(EXPENSE_COMPONENTS, check.file), "utf8");
  for (const needle of check.mustInclude) {
    assert(`${check.file} contains ${needle}`, content.includes(needle));
  }
}

console.log("\nPage wiring");
const dailyPage = readFileSync(
  join(ROOT, "src/app/(dashboard)/expenses/daily/page.tsx"),
  "utf8",
);
const operationalPage = readFileSync(
  join(ROOT, "src/app/(dashboard)/expenses/operational/page.tsx"),
  "utf8",
);

assert("daily page gates top-up by role", dailyPage.includes("canTopUpPettyCash"));
assert("daily page gates create by role", dailyPage.includes("canRecordExpense"));
assert("daily page gates approve column", dailyPage.includes("canApproveExpense"));
assert(
  "operational page loads all link loaders",
  operationalPage.includes("getPreStockForExpenseLink") &&
    operationalPage.includes("getOffSiteProcurementForExpenseLink"),
);
assert(
  "operational page supports status filter",
  operationalPage.includes('status === "pending_approval"'),
);

console.log("\nMigrations present");
const migrations = readdirSync(join(ROOT, "supabase/migrations")).filter((name) =>
  /^0002[6-9]|^0003[0-5]/.test(name),
);
assert("phase 8 logistics migration", migrations.includes("00034_phase8_logistics.sql"));
assert("miscellaneous description migration", migrations.includes("00033_operational_expense_description.sql"));
assert("warehouse loading unique migration", migrations.includes("00035_operational_expense_shipment_unique.sql"));
assert(
  "expense payment_made enum migration",
  readdirSync(join(ROOT, "supabase/migrations")).includes(
    "00040_expense_payment_made_enum.sql",
  ),
);
assert(
  "expense payment_made apply migration",
  readdirSync(join(ROOT, "supabase/migrations")).includes(
    "00041_expense_payment_made_apply.sql",
  ),
);
assert(
  "payment_made status constant",
  EXPENSE_RECORD_STATUSES.includes("payment_made"),
);

console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
