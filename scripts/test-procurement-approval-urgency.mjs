/**
 * Procurement two-step confirmation urgency by role.
 * Run: npx tsx scripts/test-procurement-approval-urgency.mjs
 */

import { procurementStatusUrgencyForViewer } from "../src/lib/procurement/approval-urgency.ts";
import {
  canApproveProcurementStep,
} from "../src/lib/permissions/matrix.ts";
import {
  formatProcurementAwarenessBanner,
  formatProcurementUrgentBanner,
  procurementSidebarBadges,
} from "../src/lib/procurement/notifications.ts";
import { nextProcurementStatus } from "../src/lib/permissions/approval.ts";

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

console.log("Procurement confirmation flow…\n");

assert(
  "first approval: cash can confirm",
  canApproveProcurementStep("cash_manager", "first"),
);
assert(
  "first approval: logistics can confirm",
  canApproveProcurementStep("logistics_manager", "first"),
);
assert(
  "first approval: warehouse cannot confirm",
  !canApproveProcurementStep("warehouse_manager", "first"),
);
assert(
  "pending_approval skips to admin queue after confirm",
  nextProcurementStatus("pending_approval") === "pending_admin_approval",
);

assert(
  "warehouse: awaiting confirmation is urgent",
  procurementStatusUrgencyForViewer("pending_approval", "warehouse_manager") ===
    "urgent",
);
assert(
  "cash: awaiting confirmation is urgent",
  procurementStatusUrgencyForViewer("pending_approval", "cash_manager") ===
    "urgent",
);
assert(
  "admin: awaiting confirmation is yellow",
  procurementStatusUrgencyForViewer("pending_approval", "admin") ===
    "awareness",
);
assert(
  "admin: final step is red",
  procurementStatusUrgencyForViewer(
    "pending_admin_approval",
    "admin",
  ) === "urgent",
);

const adminFinal = {
  urgentCount: 2,
  awarenessCount: 3,
  needsPrice: 0,
  submittedPending: 0,
};
assert(
  "admin: red final, yellow awaiting confirmation",
  procurementSidebarBadges(adminFinal, "admin").urgent === 2 &&
    procurementSidebarBadges(adminFinal, "admin").pending === 3,
);

const cashConfirm = {
  urgentCount: 4,
  awarenessCount: 2,
  needsPrice: 0,
  submittedPending: 0,
};
assert(
  "cash: red to confirm, yellow with admin",
  procurementSidebarBadges(cashConfirm, "cash_manager").urgent === 4 &&
    procurementSidebarBadges(cashConfirm, "cash_manager").pending === 2,
);
assert(
  "cash urgent banner mentions confirmation",
  formatProcurementUrgentBanner(cashConfirm, "cash_manager")?.includes(
    "confirmation",
  ),
);

const warehouseSubmitted = {
  urgentCount: 0,
  awarenessCount: 1,
  needsPrice: 0,
  submittedPending: 2,
};
assert(
  "warehouse: red for own batches awaiting confirmation",
  procurementSidebarBadges(warehouseSubmitted, "warehouse_manager").urgent === 2,
);
assert(
  "warehouse submitted banner",
  formatProcurementUrgentBanner(
    warehouseSubmitted,
    "warehouse_manager",
  )?.includes("second person"),
);

console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
