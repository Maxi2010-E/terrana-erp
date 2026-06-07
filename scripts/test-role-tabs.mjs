/**
 * Warehouse + Logistics manager tab audit.
 * Run: npx tsx scripts/test-role-tabs.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canAccessModule,
  canParticipateInProcessingApproval,
  canParticipateInProcurementApproval,
  canWriteInventory,
  canWriteLogistics,
  canWriteProcurement,
  canWriteProcessing,
} from "../src/lib/permissions/matrix.ts";
import { filterNavByRole, NAV_ITEMS } from "../src/lib/navigation.ts";
import { INVENTORY_HUB_TABS } from "../src/lib/inventory/hub.ts";
import { LOGISTICS_HUB_TABS } from "../src/lib/logistics/hub.ts";
import { EXPENSE_HUB_TABS } from "../src/lib/expenses/hub.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const ROLE_TABS = {
  warehouse_manager: {
    nav: [
      "Dashboard",
      "Office",
      "Procurement",
      "Processing",
      "Waste",
      "Inventory",
      "Expenses",
    ],
    deniedNav: ["HR", "Users", "Suppliers", "Payments", "Logistics", "Reports", "Settings"],
    hubs: {
      "/inventory": INVENTORY_HUB_TABS,
      "/expenses": EXPENSE_HUB_TABS,
    },
    routes: [
      "/dashboard",
      "/office",
      "/procurement",
      "/processing",
      "/waste",
      "/inventory",
      "/expenses",
    ],
    deniedRoutes: ["/suppliers", "/logistics", "/payments", "/hr", "/users"],
    write: {
      procurement: true,
      processing: true,
      inventory: true,
      logistics: false,
    },
    approval: { procurement: false, processing: true },
  },
  cash_manager: {
    nav: [
      "Dashboard",
      "Office",
      "Procurement",
      "Processing",
      "Inventory",
      "Payments",
      "Expenses",
    ],
    deniedNav: [
      "HR",
      "Users",
      "Suppliers",
      "Waste",
      "Logistics",
      "Reports",
      "Settings",
    ],
    hubs: {
      "/inventory": INVENTORY_HUB_TABS,
      "/expenses": EXPENSE_HUB_TABS,
    },
    routes: [
      "/dashboard",
      "/office",
      "/procurement",
      "/processing",
      "/inventory",
      "/payments",
      "/expenses",
    ],
    deniedRoutes: ["/suppliers", "/waste", "/logistics", "/hr", "/users"],
    write: {
      procurement: false,
      processing: false,
      inventory: false,
      logistics: false,
    },
    approval: { procurement: true, processing: false },
  },
  logistics_manager: {
    nav: [
      "Dashboard",
      "Office",
      "Suppliers",
      "Procurement",
      "Processing",
      "Waste",
      "Inventory",
      "Logistics",
    ],
    deniedNav: ["HR", "Users", "Payments", "Expenses", "Reports", "Settings"],
    hubs: {
      "/inventory": INVENTORY_HUB_TABS,
      "/logistics": LOGISTICS_HUB_TABS,
    },
    routes: [
      "/dashboard",
      "/office",
      "/suppliers",
      "/procurement",
      "/processing",
      "/waste",
      "/inventory",
      "/logistics",
    ],
    deniedRoutes: ["/expenses", "/payments", "/hr", "/users"],
    write: {
      procurement: false,
      processing: false,
      inventory: false,
      logistics: true,
    },
    approval: { procurement: true, processing: true },
  },
};

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

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function testRole(role, spec) {
  console.log(`\n${role}`);

  const nav = filterNavByRole(NAV_ITEMS, role);
  const titles = nav.map((item) => item.title);

  for (const title of spec.nav) {
    assert(`nav includes ${title}`, titles.includes(title));
  }
  for (const title of spec.deniedNav) {
    assert(`nav excludes ${title}`, !titles.includes(title));
  }

  for (const route of spec.routes) {
    const module = route.replace("/", "") || "dashboard";
    const mod =
      module === "dashboard" || module === "office"
        ? module
        : module;
    assert(`route allowed ${route}`, canAccessModule(role, mod));
  }

  for (const route of spec.deniedRoutes) {
    const mod = route.replace("/", "");
    assert(`route denied ${route}`, !canAccessModule(role, mod));
  }

  assert("write procurement", canWriteProcurement(role) === spec.write.procurement);
  assert("write processing", canWriteProcessing(role) === spec.write.processing);
  assert("write inventory", canWriteInventory(role) === spec.write.inventory);
  assert("write logistics", canWriteLogistics(role) === spec.write.logistics);
  assert(
    "procurement approval participant",
    canParticipateInProcurementApproval(role) === spec.approval.procurement,
  );
  assert(
    "processing approval participant",
    canParticipateInProcessingApproval(role) === spec.approval.processing,
  );

  for (const [hub, tabs] of Object.entries(spec.hubs)) {
    assert(`${hub} has ${tabs.length} sub-tabs`, tabs.length > 0);
  }
}

function scanReadPageGuards() {
  console.log("\nRead-page guard scans");

  const procurementPage = read("src/app/(dashboard)/procurement/page.tsx");
  assert(
    "procurement list skips supplier fetch for read-only roles",
    procurementPage.includes("canCreate ? getActiveSuppliersForSelect()"),
  );

  const suppliersPage = read("src/app/(dashboard)/suppliers/page.tsx");
  assert(
    "suppliers list gates outstanding totals by payments access",
    suppliersPage.includes("showOutstanding") &&
      suppliersPage.includes("showOutstanding\n      ? getSupplierOutstandingTotals"),
  );

  const supplierDetail = read("src/app/(dashboard)/suppliers/[id]/page.tsx");
  assert(
    "supplier detail skips payments fetch without payments access",
    supplierDetail.includes("showPaymentsTab ? getPaymentsForSupplier"),
  );

  const processingPage = read("src/app/(dashboard)/processing/page.tsx");
  assert(
    "processing list uses canReviewProcessingApprovals",
    processingPage.includes("canReviewProcessingApprovals(role)"),
  );

  const procurementActions = read("src/lib/actions/procurement.ts");
  assert(
    "supplier select uses read guard",
    /getActiveSuppliersForSelect[\s\S]{0,80}requireProcurementRead/.test(
      procurementActions,
    ),
  );
}

console.log("Role tab audit (warehouse + logistics)…");

for (const [role, spec] of Object.entries(ROLE_TABS)) {
  testRole(role, spec);
}

assert(
  "cash and logistics can confirm first step",
  canParticipateInProcurementApproval("cash_manager") &&
    canParticipateInProcurementApproval("logistics_manager") &&
    !canParticipateInProcurementApproval("warehouse_manager"),
);
scanReadPageGuards();

console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
