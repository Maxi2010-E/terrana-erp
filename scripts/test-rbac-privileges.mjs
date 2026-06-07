/**
 * RBAC privilege audit — matrix, navigation, route guards, approvals, price hiding.
 * Run: npx tsx scripts/test-rbac-privileges.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canAccessModule,
  canApproveProcurementStep,
  canApproveProcessingStep,
  canMarkExpensePaid,
  canTopUpPettyCash,
  canViewPrices,
  canWriteExpenses,
  canWriteInventory,
  canWriteLogistics,
  canWriteProcessing,
  canWriteProcurement,
  canWriteWaste,
  isAdminRole,
} from "../src/lib/permissions/matrix.ts";
import { filterNavByRole, NAV_ITEMS } from "../src/lib/navigation.ts";
import { canViewPaymentAmounts } from "../src/lib/payments/permissions.ts";
import { canViewProcurementPricing } from "../src/lib/procurement/permissions.ts";
import {
  getDashboardKpiKeysForRole,
  canAccessReports,
} from "../src/lib/dashboard/permissions.ts";
import { normalizeAppRole, APP_ROLES } from "../src/lib/roles.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "src/app");

let passed = 0;
let failed = 0;
const failures = [];

function assert(label, condition) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.error(`  ✗ ${label}`);
  }
}

/** Design spec from RBAC plan */
const SPEC = {
  super_admin: {
    modules: [
      "dashboard",
      "office",
      "hr",
      "users",
      "suppliers",
      "procurement",
      "processing",
      "waste",
      "inventory",
      "payments",
      "expenses",
      "logistics",
      "reports",
      "settings",
    ],
    deniedModules: [],
    writeProcurement: true,
    writeProcessing: true,
    writeWaste: true,
    writeInventory: true,
    writeExpenses: true,
    writeLogistics: true,
    viewPrices: true,
    viewPaymentAmounts: true,
    topUpPettyCash: true,
    markExpensePaid: false,
    reports: true,
    approveProcurement: { first: false, second: false, final: true },
    approveProcessing: { first: false, second: false, final: true },
  },
  admin: {
    modules: [
      "dashboard",
      "office",
      "hr",
      "users",
      "suppliers",
      "procurement",
      "processing",
      "waste",
      "inventory",
      "payments",
      "expenses",
      "logistics",
      "reports",
      "settings",
    ],
    deniedModules: [],
    writeProcurement: true,
    writeProcessing: true,
    writeWaste: true,
    writeInventory: true,
    writeExpenses: true,
    writeLogistics: true,
    viewPrices: true,
    viewPaymentAmounts: true,
    topUpPettyCash: true,
    markExpensePaid: false,
    reports: true,
    approveProcurement: { first: false, second: false, final: true },
    approveProcessing: { first: false, second: false, final: true },
  },
  warehouse_manager: {
    modules: [
      "dashboard",
      "office",
      "procurement",
      "processing",
      "waste",
      "inventory",
      "expenses",
    ],
    deniedModules: [
      "hr",
      "users",
      "suppliers",
      "payments",
      "logistics",
      "reports",
      "settings",
    ],
    writeProcurement: true,
    writeProcessing: true,
    writeWaste: true,
    writeInventory: true,
    writeExpenses: true,
    writeLogistics: false,
    viewPrices: false,
    viewPaymentAmounts: false,
    topUpPettyCash: false,
    markExpensePaid: false,
    reports: false,
    approveProcurement: { first: false, second: false, final: false },
    approveProcessing: { first: true, second: false, final: false },
  },
  cash_manager: {
    modules: ["dashboard", "office", "inventory", "procurement", "payments", "expenses"],
    deniedModules: [
      "hr",
      "users",
      "suppliers",
      "processing",
      "waste",
      "logistics",
      "reports",
      "settings",
    ],
    writeProcurement: false,
    writeProcessing: false,
    writeWaste: false,
    writeInventory: false,
    writeExpenses: true,
    writeLogistics: false,
    viewPrices: false,
    viewPaymentAmounts: false,
    topUpPettyCash: true,
    markExpensePaid: true,
    reports: false,
    approveProcurement: { first: true, second: true, final: false },
    approveProcessing: { first: false, second: false, final: false },
  },
  logistics_manager: {
    modules: [
      "dashboard",
      "office",
      "suppliers",
      "procurement",
      "processing",
      "waste",
      "inventory",
      "logistics",
    ],
    deniedModules: ["hr", "users", "payments", "expenses", "reports", "settings"],
    writeProcurement: false,
    writeProcessing: false,
    writeWaste: false,
    writeInventory: false,
    writeExpenses: false,
    writeLogistics: true,
    viewPrices: false,
    viewPaymentAmounts: false,
    topUpPettyCash: false,
    markExpensePaid: false,
    reports: false,
    approveProcurement: { first: true, second: true, final: false },
    approveProcessing: { first: false, second: true, final: false },
  },
};

const ROUTE_GUARDS = {
  "/hr": (role) => isAdminRole(role),
  "/users": (role) => isAdminRole(role),
  "/reports": (role) => canAccessReports(role),
  "/settings": (role) => isAdminRole(role),
  "/suppliers": (role) => canAccessModule(role, "suppliers"),
  "/suppliers/new": (role) => isAdminRole(role),
  "/procurement": (role) => canAccessModule(role, "procurement"),
  "/processing": (role) => canAccessModule(role, "processing"),
  "/processing/new": (role) => canWriteProcessing(role),
  "/waste": (role) => canAccessModule(role, "waste"),
  "/inventory": (role) => canAccessModule(role, "inventory"),
  "/inventory/export/new": (role) => canWriteInventory(role),
  "/payments": (role) => canAccessModule(role, "payments"),
  "/expenses": (role) => canAccessModule(role, "expenses"),
  "/logistics": (role) => canAccessModule(role, "logistics"),
  "/logistics/shipments/new": (role) => canWriteLogistics(role),
};

const QUICK_LINKS = {
  warehouse_manager: [
    "/procurement",
    "/processing",
    "/inventory?tab=pre_stock",
  ],
  cash_manager: ["/procurement", "/expenses", "/payments"],
  logistics_manager: [
    "/logistics?tab=shipments",
    "/processing",
    "/procurement",
  ],
};

function testRoleMatrix(role) {
  const spec = SPEC[role];
  console.log(`\nRole: ${role}`);

  for (const mod of spec.modules) {
    assert(`${role} can access ${mod}`, canAccessModule(role, mod));
  }
  for (const mod of spec.deniedModules) {
    assert(`${role} denied ${mod}`, !canAccessModule(role, mod));
  }

  assert(`${role} writeProcurement`, canWriteProcurement(role) === spec.writeProcurement);
  assert(`${role} writeProcessing`, canWriteProcessing(role) === spec.writeProcessing);
  assert(`${role} writeWaste`, canWriteWaste(role) === spec.writeWaste);
  assert(`${role} writeInventory`, canWriteInventory(role) === spec.writeInventory);
  assert(`${role} writeExpenses`, canWriteExpenses(role) === spec.writeExpenses);
  assert(`${role} writeLogistics`, canWriteLogistics(role) === spec.writeLogistics);
  assert(`${role} viewPrices`, canViewPrices(role) === spec.viewPrices);
  assert(
    `${role} viewPaymentAmounts`,
    canViewPaymentAmounts(role) === spec.viewPaymentAmounts,
  );
  assert(`${role} viewProcurementPricing`, canViewProcurementPricing(role) === spec.viewPrices);
  assert(`${role} topUpPettyCash`, canTopUpPettyCash(role) === spec.topUpPettyCash);
  assert(`${role} markExpensePaid`, canMarkExpensePaid(role) === spec.markExpensePaid);
  assert(`${role} reports access`, canAccessReports(role) === spec.reports);

  for (const step of ["first", "second", "final"]) {
    assert(
      `${role} approve procurement ${step}`,
      canApproveProcurementStep(role, step) === spec.approveProcurement[step],
    );
    assert(
      `${role} approve processing ${step}`,
      canApproveProcessingStep(role, step) === spec.approveProcessing[step],
    );
  }

  const nav = filterNavByRole(NAV_ITEMS, role);
  const navHrefs = nav.map((item) => item.href).filter(Boolean);
  for (const mod of spec.modules) {
    const navItem = NAV_ITEMS.find((item) => item.module === mod);
    if (navItem?.href) {
      assert(`${role} nav includes ${mod}`, navHrefs.includes(navItem.href));
    }
  }
  for (const mod of spec.deniedModules) {
    const navItem = NAV_ITEMS.find((item) => item.module === mod);
    if (navItem?.href) {
      assert(`${role} nav excludes ${mod}`, !navHrefs.includes(navItem.href));
    }
  }

  const kpis = getDashboardKpiKeysForRole(role);
  if (isAdminRole(role)) {
    assert(`${role} dashboard KPIs populated`, kpis.length >= 6);
  } else if (role === "warehouse_manager") {
    assert(`${role} warehouse KPIs only`, kpis.every((k) => ["currentInventoryKg", "procurementKg"].includes(k)));
  } else if (role === "cash_manager") {
    assert(`${role} cash KPIs only`, kpis.every((k) => ["monthlyExpenses", "outstandingPayments"].includes(k)));
  } else if (role === "logistics_manager") {
    assert(
      `${role} logistics KPIs only`,
      kpis.every((k) => ["containersInTransit", "monthlyShipments"].includes(k)),
    );
  }

  const links = QUICK_LINKS[role];
  if (links) {
    for (const href of links) {
      const path = href.split("?")[0];
      const guard = ROUTE_GUARDS[path];
      assert(
        `${role} quick link ${href} allowed`,
        guard ? guard(role) : true,
      );
    }
  }
}

function testLegacyRoleNormalization() {
  console.log("\nLegacy role normalization");
  assert("accounts → cash_manager", normalizeAppRole("accounts") === "cash_manager");
  assert(
    "inventory_manager → warehouse_manager",
    normalizeAppRole("inventory_manager") === "warehouse_manager",
  );
  assert(
    "legacy cash can access payments",
    canAccessModule(normalizeAppRole("accounts"), "payments"),
  );
  assert(
    "legacy warehouse can access procurement",
    canAccessModule(normalizeAppRole("inventory_manager"), "procurement"),
  );
}

function scanProcurementReadOnlyGuards() {
  const procurementPage = readFileSync(
    join(ROOT, "src/app/(dashboard)/procurement/page.tsx"),
    "utf8",
  );
  const procurementActions = readFileSync(
    join(ROOT, "src/lib/actions/procurement.ts"),
    "utf8",
  );

  assert(
    "procurement list gates create dialog by canCreateProcurement",
    procurementPage.includes("canCreateProcurement(role)") &&
      procurementPage.includes("canCreate ? getActiveSuppliersForSelect()"),
  );
  assert(
    "supplier select uses read guard (not write-only)",
    procurementActions.includes("getActiveSuppliersForSelect") &&
      !/getActiveSuppliersForSelect[\s\S]{0,120}requireProcurementWrite/.test(
        procurementActions,
      ),
  );
  assert(
    "employee select allows logistics_manager",
    /getActiveEmployeesForSelect[\s\S]{0,400}logistics_manager/.test(
      procurementActions,
    ),
  );
}

function scanPaymentDetailAmountLeak() {
  console.log("\nStatic scans");
  scanProcurementReadOnlyGuards();
  const paymentDetail = readFileSync(
    join(ROOT, "src/app/(dashboard)/payments/[id]/page.tsx"),
    "utf8",
  );
  const usesAmountGuard =
    paymentDetail.includes("canViewPaymentAmounts") ||
    paymentDetail.includes("formatMoneyIfAllowed");
  assert(
    "payment detail hides amounts for cash_manager",
    usesAmountGuard,
  );

  const officePage = readFileSync(
    join(ROOT, "src/app/(dashboard)/office/page.tsx"),
    "utf8",
  );
  assert(
    "office page normalizes role",
    officePage.includes("normalizeAppRole"),
  );
}

function walkPages(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walkPages(full, acc);
    } else if (name === "page.tsx") {
      acc.push(full);
    }
  }
  return acc;
}

function routeFromPage(filePath) {
  const rel = relative(APP, filePath).replace(/\\/g, "/");
  const withoutPage = rel.replace(/\/page\.tsx$/, "");
  const segments = withoutPage
    .split("/")
    .filter((seg) => !(seg.startsWith("(") && seg.endsWith(")")));
  return `/${segments.join("/")}`.replace(/\/+/g, "/");
}

function testRouteGuardCoverage() {
  console.log("\nRoute guard coverage");
  const pages = walkPages(APP);
  const dashboardPages = pages
    .map((p) => ({ path: p, route: routeFromPage(p) }))
    .filter(({ route }) => route !== "/login" && !route.startsWith("/api"));

  const unguarded = [];
  for (const { path, route } of dashboardPages) {
    const content = readFileSync(path, "utf8");
    const hasGuard =
      /require[A-Z][a-zA-Z]+\(/.test(content) ||
      content.includes("redirect(") ||
      route === "/dashboard" ||
      route === "/office";
    if (
      !hasGuard &&
      !route.includes("[") &&
      route !== "/" &&
      !route.startsWith("/login")
    ) {
      unguarded.push(route);
    }
  }

  assert(
    `all static dashboard routes have guards (${unguarded.length} unguarded)`,
    unguarded.length === 0,
  );
  if (unguarded.length > 0) {
    console.error("    Unguarded:", unguarded.join(", "));
  }
}

console.log("RBAC privilege audit…");

for (const role of APP_ROLES) {
  testRoleMatrix(role);
}
testLegacyRoleNormalization();
scanPaymentDetailAmountLeak();
testRouteGuardCoverage();

console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.error("\nFailures:");
  for (const f of failures) {
    console.error(`  • ${f}`);
  }
}
process.exitCode = failed === 0 ? 0 : 1;
