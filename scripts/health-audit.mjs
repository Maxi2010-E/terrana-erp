/**
 * Terrana ERP automated health audit.
 * Run: npm run test:health
 */

import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd) {
  try {
    const output = execSync(cmd, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      cwd: ROOT,
    });
    return { ok: true, output: output.slice(-500) };
  } catch (error) {
    const err = error;
    return {
      ok: false,
      output: `${err.stdout ?? ""}${err.stderr ?? ""}`.slice(-800),
      code: err.status,
    };
  }
}

console.log("Terrana health audit…\n");

const lint = run("npm run lint");
console.log(lint.ok ? "✓ lint" : "✗ lint");
if (!lint.ok) {
  console.error(lint.output);
}

const tests = [
  { cmd: "npm run test:layout", name: "dashboard layout" },
  { cmd: "node scripts/test-graded-product-type.mjs", name: "graded naming" },
  { cmd: "node scripts/test-grading-variance.mjs", name: "grading variance" },
  { cmd: "npm run test:procurement", name: "procurement logic" },
  { cmd: "npm run test:processing", name: "processing logic" },
];

let testsOk = true;
for (const test of tests) {
  const result = run(test.cmd);
  console.log(result.ok ? `✓ ${test.name}` : `✗ ${test.name}`);
  if (!result.ok) {
    testsOk = false;
    console.error(result.output);
  }
}

const build = run("npm run build");
console.log(build.ok ? "✓ build" : "✗ build");
if (!build.ok) {
  console.error(build.output);
}

const links = run("npm run test:links");
console.log(links.ok ? "✓ link/route audit" : "✗ link/route audit");
if (!links.ok) {
  console.error(links.output);
}

const ok = lint.ok && testsOk && build.ok && links.ok;
console.log(`\n${ok ? "PASS" : "FAIL"}`);
process.exitCode = ok ? 0 : 1;
