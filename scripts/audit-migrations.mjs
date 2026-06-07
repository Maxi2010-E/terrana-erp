/**
 * Terrana ERP — migration audit for manual Supabase SQL Editor runs.
 * Run: node scripts/audit-migrations.mjs
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS_DIR = join(ROOT, "supabase/migrations");
const SETUP_PATH = join(ROOT, "SETUP.md");

/** Never run — comment-only stub or removed from repo. */
const SKIP = new Set(["00040_expense_payment_made.sql"]);

/** Still in repo for history; skip on fresh prod if the replacement is run. */
const SKIP_IF_REPLACEMENT_RUN = new Map([
  ["00004_users_update_own.sql", "00005_users_last_login_only.sql"],
]);

/** Run step 1, wait for success, then run step 2 in a new SQL Editor query. */
const SPLIT_PAIRS = [
  {
    label: "Processing session approval",
    step1: "00013_processing_session_approval.sql",
    step2: "00014_processing_session_approval_apply.sql",
  },
  {
    label: "Expense payment_made status",
    step1: "00040_expense_payment_made_enum.sql",
    step2: "00041_expense_payment_made_apply.sql",
  },
  {
    label: "RBAC + dual approval",
    step1: "00049_rbac_enum_values.sql",
    step2: "00050_rbac_and_dual_approval_apply.sql",
  },
];

const SETUP_MISSING_FILES = [];

/** Same numeric prefix — hr_payroll before expense enum (see SETUP Production migrations). */
function migrationSort(a, b) {
  if (a.startsWith("00040_") && b.startsWith("00040_")) {
    if (a.includes("hr_payroll_individual")) return -1;
    if (b.includes("hr_payroll_individual")) return 1;
  }
  return a.localeCompare(b, undefined, { numeric: true });
}

function listMigrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort(migrationSort);
}

function setupReferences() {
  const setup = readFileSync(SETUP_PATH, "utf8");
  const pattern = /supabase\/migrations\/(0\d{4}_[\w.]+\.sql)/g;
  const refs = new Set();
  let match;
  while ((match = pattern.exec(setup)) !== null) {
    refs.add(match[1]);
  }
  return refs;
}

function classify(files) {
  const skip = [];
  const run = [];
  const deprecated = [];

  for (const file of files) {
    if (SKIP.has(file)) {
      skip.push({ file, reason: "Do not run (stub or removed)" });
      continue;
    }

    const replacement = SKIP_IF_REPLACEMENT_RUN.get(file);
    if (replacement) {
      deprecated.push({ file, replacement });
      continue;
    }

    run.push(file);
  }

  return { skip, run, deprecated };
}

function splitNotesFor(file) {
  return SPLIT_PAIRS.filter((pair) => pair.step1 === file || pair.step2 === file);
}

function main() {
  const files = listMigrationFiles();
  const { skip, run, deprecated } = classify(files);
  const setupRefs = setupReferences();
  const onDisk = new Set(files);

  console.log("Terrana migration audit\n");
  console.log(`Folder: supabase/migrations (${files.length} files)\n`);

  console.log("── SKIP (do not run) ──");
  if (skip.length === 0) {
    console.log("  (none on disk — stub removed from repo)");
  }
  for (const item of skip) {
    console.log(`  ✗ ${item.file} — ${item.reason}`);
  }

  console.log("\n── SKIP on fresh prod (run replacement instead) ──");
  for (const item of deprecated) {
    console.log(`  ⊘ ${item.file} → use ${item.replacement}`);
  }

  console.log("\n── SPLIT PAIRS (two SQL Editor runs, wait between) ──");
  for (const pair of SPLIT_PAIRS) {
    console.log(`  ${pair.label}:`);
    console.log(`    1. ${pair.step1}`);
    console.log(`    2. ${pair.step2}`);
  }

  console.log("\n── PRODUCTION RUN ORDER ──");
  let step = 0;
  for (const file of run) {
    const pairs = splitNotesFor(file);
    const isStep2 = pairs.some((p) => p.step2 === file);
    if (isStep2) {
      console.log(`  ${String(++step).padStart(2, " ")}. ${file}  ← step 2 (new query)`);
    } else {
      const asStep1 = pairs.find((p) => p.step1 === file);
      if (asStep1) {
        console.log(
          `  ${String(++step).padStart(2, " ")}. ${file}  ← step 1 (wait, then next file)`,
        );
      } else {
        console.log(`  ${String(++step).padStart(2, " ")}. ${file}`);
      }
    }
  }

  console.log("\n── SETUP.md cross-check ──");
  const notInSetup = run.filter((f) => !setupRefs.has(f));
  if (notInSetup.length > 0) {
    console.log(
      `  ℹ ${notInSetup.length} runnable file(s) not listed in SETUP phase sections (see Production migrations)`,
    );
  }

  const staleSetup = [...setupRefs].filter((f) => !onDisk.has(f));
  for (const file of staleSetup) {
    console.log(`  ⚠ SETUP references file not in folder: ${file}`);
  }

  console.log(
    `\nRun: ${run.length} migrations (+ ${deprecated.length} optional skip on fresh DB)`,
  );
}

main();
