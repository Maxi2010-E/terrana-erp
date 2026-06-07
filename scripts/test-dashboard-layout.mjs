/**
 * Static regression guard for dashboard shell layout.
 * Run: npm run test:layout
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full, acc);
    } else if (name.endsWith(".tsx") || name.endsWith(".ts")) {
      acc.push(full);
    }
  }
  return acc;
}

const failures = [];

const shellCss = read("src/styles/terrana-dashboard-shell.css");
const globalsCss = read("src/app/globals.css");
const shellTsx = read("src/components/layout/dashboard-shell.tsx");
const rootLayout = read("src/app/layout.tsx");

const requiredSelectors = [
  '[data-layout="dashboard-shell"]',
  '[data-layout="dashboard-sidebar"]',
  '[data-layout="dashboard-main"]',
  '[data-layout="dashboard-mobile-nav"]',
  '[data-layout="dashboard-page-scroll"]',
  '[data-layout="sidebar-inner"]',
  '[data-layout="sidebar-nav-scroll"]',
  '[data-layout="sidebar-user"]',
];

for (const selector of requiredSelectors) {
  if (!shellCss.includes(selector)) {
    failures.push(`Missing selector in terrana-dashboard-shell.css: ${selector}`);
  }
}

const criticalRules = [
  "position: fixed !important",
  "display: flex !important",
  "display: none !important",
  "overflow-y: auto !important",
  "margin-top: auto !important",
  "html[data-terrana-app]",
];

for (const rule of criticalRules) {
  if (!shellCss.includes(rule)) {
    failures.push(`Missing critical rule in terrana-dashboard-shell.css: ${rule}`);
  }
}

if (!rootLayout.includes('import "../styles/terrana-dashboard-shell.css"')) {
  failures.push(
    "Root layout must import terrana-dashboard-shell.css after globals.css",
  );
}

if (!rootLayout.includes('import "../styles/terrana-sidebar-nav.css"')) {
  failures.push(
    "Root layout must import terrana-sidebar-nav.css after dashboard shell CSS",
  );
}

const navCss = read("src/styles/terrana-sidebar-nav.css");
const sidebarTsx = read("src/components/layout/app-sidebar.tsx");

const navSelectors = [
  "[data-nav-link]",
  "[data-nav-active",
  "[data-nav-root]",
  "[data-nav-section]",
  "[data-layout=\"sidebar-brand\"]",
  '[data-layout="dashboard-sidebar"] > *',
];

for (const selector of navSelectors) {
  if (!navCss.includes(selector)) {
    failures.push(`Missing selector in terrana-sidebar-nav.css: ${selector}`);
  }
}

if (!sidebarTsx.includes('data-nav-link')) {
  failures.push("app-sidebar.tsx must use data-nav-link on navigation links");
}

if (/rounded-full px-3 py-2\.5/.test(sidebarTsx)) {
  failures.push(
    "app-sidebar.tsx must not use Tailwind classes for nav link layout — use terrana-sidebar-nav.css",
  );
}

if (globalsCss.includes('[data-layout="dashboard-shell"]')) {
  failures.push(
    "Dashboard layout rules must live only in terrana-dashboard-shell.css, not globals.css",
  );
}

for (const attr of [
  "dashboard-shell",
  "dashboard-sidebar",
  "dashboard-main",
  "dashboard-mobile-nav",
  "dashboard-content",
]) {
  if (!shellTsx.includes(`data-layout="${attr}"`)) {
    failures.push(`dashboard-shell.tsx missing data-layout="${attr}"`);
  }
}

if (!rootLayout.includes('data-terrana-app')) {
  failures.push("Root layout must set data-terrana-app on <html> for viewport lock");
}

if (/h-svh|overflow-hidden/.test(rootLayout)) {
  failures.push(
    "Root layout must not use Tailwind h-svh/overflow-hidden — use terrana-dashboard-shell.css",
  );
}

const layoutFiles = [
  ...walk(join(ROOT, "src/components/layout")),
  join(ROOT, "src/app/(dashboard)/layout.tsx"),
  join(ROOT, "src/app/layout.tsx"),
];

const forbiddenPatterns = [
  { pattern: /hidden\s+md:flex/, label: "hidden md:flex on shell (use data-layout CSS)" },
  { pattern: /md:pl-\d+/, label: "md:pl-* offset (use margin-left in shell CSS)" },
  { pattern: /min-h-screen/, label: "min-h-screen on layout (breaks viewport lock)" },
];

for (const file of layoutFiles) {
  const rel = file.replace(`${ROOT}/`, "");
  const content = read(rel);
  for (const { pattern, label } of forbiddenPatterns) {
    if (pattern.test(content)) {
      failures.push(`${rel}: forbidden pattern — ${label}`);
    }
  }
}

if (failures.length === 0) {
  console.log("PASS dashboard layout regression guard");
  process.exitCode = 0;
} else {
  console.error("FAIL dashboard layout regression guard\n");
  for (const failure of failures) {
    console.error(`  • ${failure}`);
  }
  process.exitCode = 1;
}
