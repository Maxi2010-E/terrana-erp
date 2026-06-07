/**
 * Static link + route audit for Terrana ERP.
 * Run: node scripts/test-links-routes.mjs
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const APP = join(SRC, "app");

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, acc);
    } else if (name === "page.tsx" || name === "page.ts") {
      acc.push(full);
    }
  }
  return acc;
}

function routeFromPage(filePath) {
  const rel = relative(APP, filePath).replace(/\\/g, "/");
  const withoutPage = rel.replace(/\/page\.tsx?$/, "");
  if (withoutPage === "page.tsx" || withoutPage === "page.ts") {
    return "/";
  }
  const segments = withoutPage
    .split("/")
    .filter((seg) => !(seg.startsWith("(") && seg.endsWith(")")));
  const route = `/${segments.join("/")}`;
  return route.replace(/\/+/g, "/");
}

function collectRoutes() {
  const pages = walk(APP);
  const routes = pages.map((p) => routeFromPage(p));
  const dynamicPatterns = routes.map((route) => {
    const escaped = route.replace(/\[([^\]]+)\]/g, "[^/]+");
    return new RegExp(`^${escaped}$`);
  });
  return { routes, dynamicPatterns };
}

function extractStaticHrefs(content) {
  const hrefs = new Set();
  const patterns = [
    /href="(\/[^"#?]*)"[^>]*>/g,
    /href='(\/[^'#?]*)'[^>]*>/g,
    /href=\{\s*"(\/[^"#?]*)"[^}]*\}/g,
    /href=\{\s*'(\/[^'#?]*)'[^}]*\}/g,
    /href=\{\s*`(\/[^`$?]*)(?:\$\{[^}]+\}[^`]*)*`/g,
    /pathname:\s*"(\/[^"]+)"/g,
    /redirect\(\s*"(\/[^"]+)"/g,
    /redirect\(\s*'(\/[^']+)'/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const href = match[1];
      if (href && !href.includes("${")) {
        hrefs.add(href.split("?")[0].split("#")[0]);
      }
    }
  }

  return [...hrefs];
}

function extractNavHrefs() {
  const navFile = readFileSync(join(SRC, "lib/navigation.ts"), "utf8");
  const hrefs = new Set();
  const pattern = /href:\s*"(\/[^"]+)"/g;
  let match;
  while ((match = pattern.exec(navFile)) !== null) {
    hrefs.add(match[1]);
  }
  return [...hrefs];
}

function routeExists(href, routes, dynamicPatterns) {
  if (routes.includes(href)) {
    return true;
  }
  if (dynamicPatterns.some((pattern) => pattern.test(href))) {
    return true;
  }
  if (href.endsWith("/")) {
    const parent = href.slice(0, -1);
    if (routes.some((route) => route.startsWith(`${parent}/[`))) {
      return true;
    }
  }
  return false;
}

function scanSourceFiles() {
  const files = [];
  function walkSrc(dir) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (name !== "node_modules") walkSrc(full);
      } else if (/\.(tsx?|jsx?)$/.test(name)) {
        files.push(full);
      }
    }
  }
  walkSrc(SRC);
  return files;
}

function main() {
  console.log("Link + route audit…\n");

  const { routes, dynamicPatterns } = collectRoutes();

  const navHrefs = extractNavHrefs();
  const navMissing = navHrefs.filter(
    (href) => !routeExists(href, routes, dynamicPatterns),
  );
  console.log(
    navMissing.length === 0
      ? `✓ navigation (${navHrefs.length} hrefs)`
      : `✗ navigation missing routes: ${navMissing.join(", ")}`,
  );

  const sourceFiles = scanSourceFiles();
  const allBroken = new Set();

  for (const file of sourceFiles) {
    const content = readFileSync(file, "utf8");
    const hrefs = extractStaticHrefs(content);
    const broken = hrefs.filter(
      (href) =>
        !href.startsWith("/api") &&
        !routeExists(href, routes, dynamicPatterns),
    );
    broken.forEach((href) => allBroken.add(href));
  }

  console.log(
    allBroken.size === 0
      ? `✓ static hrefs (${sourceFiles.length} files scanned)`
      : `✗ ${allBroken.size} broken href(s): ${[...allBroken].join(", ")}`,
  );

  const pagePaths = walk(APP);
  const placeholderRoutes = routes.filter((route) => {
    const pageFile = pagePaths.find((p) => routeFromPage(p) === route);
    if (!pageFile) return false;
    const content = readFileSync(pageFile, "utf8");
    return content.includes("ModulePlaceholder");
  });
  console.log(
    `ℹ ${placeholderRoutes.length} placeholder route(s) (expected for future phases)`,
  );

  const ok = navMissing.length === 0 && allBroken.size === 0;
  console.log(`\n${ok ? "PASS" : "FAIL"}`);
  process.exitCode = ok ? 0 : 1;
}

main();
