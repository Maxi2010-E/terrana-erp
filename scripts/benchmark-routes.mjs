/**
 * Measure response times for Terrana dashboard routes.
 *
 * Usage:
 *   npm run dev   # or npm run build && npm start
 *   npm run test:routes-speed
 *
 * Authenticated timings (recommended):
 *   BENCHMARK_COOKIE="sb-..." npm run test:routes-speed
 *
 * Targets (module quality gate): list pages < 800ms TTFB, hub tabs < 800ms.
 */

const BASE_URL = (process.env.BENCHMARK_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const COOKIE = process.env.BENCHMARK_COOKIE ?? "";
const WARMUP = Number.parseInt(process.env.BENCHMARK_WARMUP ?? "1", 10);
const RUNS = Number.parseInt(process.env.BENCHMARK_RUNS ?? "2", 10);

/** Nav + hub tab entry points (no dynamic [id] routes). */
const ROUTES = [
  "/dashboard",
  "/office",
  "/hr",
  "/hr?tab=employees",
  "/hr?tab=payroll",
  "/hr?tab=leave",
  "/hr?tab=advances",
  "/hr?tab=bonuses",
  "/users",
  "/suppliers",
  "/suppliers/new",
  "/procurement",
  "/procurement/new",
  "/processing",
  "/processing/new",
  "/inventory",
  "/inventory?tab=pre_stock",
  "/inventory?tab=export",
  "/inventory?tab=warehouse_lots",
  "/inventory/export/new",
  "/payments",
  "/expenses",
  "/expenses?tab=daily",
  "/expenses?tab=operational",
  "/logistics",
  "/logistics?tab=shipments",
  "/logistics?tab=customers",
  "/logistics?tab=fumigation",
  "/logistics?tab=truck-agents",
  "/logistics?tab=cost-allocation",
  "/reports",
  "/settings",
  "/login",
];

const TARGET_MS = 800;

async function fetchTiming(path) {
  const url = `${BASE_URL}${path}`;
  const start = performance.now();
  const response = await fetch(url, {
    redirect: "manual",
    headers: COOKIE ? { cookie: COOKIE } : {},
  });
  const ttfb = performance.now() - start;
  return {
    status: response.status,
    ttfb,
    redirected: response.status >= 300 && response.status < 400,
    location: response.headers.get("location"),
  };
}

async function measureRoute(path) {
  for (let i = 0; i < WARMUP; i += 1) {
    await fetchTiming(path);
  }

  const samples = [];
  for (let i = 0; i < RUNS; i += 1) {
    samples.push(await fetchTiming(path));
  }

  const ttfbs = samples.map((s) => s.ttfb);
  const avg = ttfbs.reduce((sum, value) => sum + value, 0) / ttfbs.length;
  const last = samples[samples.length - 1];

  return {
    path,
    avgMs: Math.round(avg),
    minMs: Math.round(Math.min(...ttfbs)),
    maxMs: Math.round(Math.max(...ttfbs)),
    status: last.status,
    redirected: last.redirected,
    location: last.location,
  };
}

function grade(result) {
  if (!COOKIE && result.redirected) {
    return "auth";
  }
  if (result.avgMs <= TARGET_MS) {
    return "ok";
  }
  if (result.avgMs <= TARGET_MS * 1.5) {
    return "warn";
  }
  return "slow";
}

async function main() {
  console.log(`Route speed benchmark → ${BASE_URL}`);
  console.log(
    COOKIE
      ? `Authenticated (${RUNS} runs, ${WARMUP} warmup)`
      : `Unauthenticated — expect 307→/login (pass BENCHMARK_COOKIE for real timings)`,
  );
  console.log(`Target: ≤${TARGET_MS}ms avg TTFB per route\n`);

  let reachable = 0;
  const results = [];

  for (const path of ROUTES) {
    try {
      const result = await measureRoute(path);
      results.push(result);
      if (result.status > 0) {
        reachable += 1;
      }
    } catch (error) {
      results.push({
        path,
        avgMs: -1,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (reachable === 0) {
    console.error("Could not reach server. Start with: npm run dev");
    process.exitCode = 1;
    return;
  }

  const colPath = 42;
  console.log(
    `${"Route".padEnd(colPath)} ${"Avg".padStart(6)} ${"Min".padStart(6)} ${"Max".padStart(6)}  Status`,
  );
  console.log("-".repeat(colPath + 30));

  let slowCount = 0;
  for (const row of results) {
    if (row.error) {
      console.log(`${row.path.padEnd(colPath)} ERROR  ${row.error}`);
      continue;
    }

    const g = grade(row);
    if (g === "slow") {
      slowCount += 1;
    }

    const flag =
      g === "ok" ? "✓" : g === "warn" ? "~" : g === "auth" ? "→" : "✗";
    const status =
      row.redirected && !COOKIE
        ? `redirect ${row.location ?? ""}`
        : String(row.status);

    console.log(
      `${flag} ${row.path.padEnd(colPath - 2)} ${String(row.avgMs).padStart(6)}ms ${String(row.minMs).padStart(6)} ${String(row.maxMs).padStart(6)}  ${status}`,
    );
  }

  const measured = results.filter((r) => !r.error && (!r.redirected || COOKIE));
  const avgAll =
    measured.length > 0
      ? Math.round(
          measured.reduce((sum, r) => sum + r.avgMs, 0) / measured.length,
        )
      : 0;

  console.log(`\nRoutes tested: ${ROUTES.length}`);
  if (COOKIE) {
    console.log(`Average TTFB (authenticated): ${avgAll}ms`);
    console.log(`Over target (>${TARGET_MS}ms): ${slowCount}`);
  } else {
    console.log("Tip: log in, copy session cookie, run with BENCHMARK_COOKIE for real page timings.");
  }

  process.exitCode = COOKIE && slowCount > 0 ? 1 : 0;
}

main();
