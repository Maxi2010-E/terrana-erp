/**
 * Quick sanity checks for processing calculations (no database).
 * Run: node scripts/test-processing-logic.mjs
 */

import {
  calcBagsRemaining,
  calcProcessingOutputKg,
  calcSessionInputKg,
  calcWasteWeightKg,
  calcYieldPct,
} from "../src/lib/processing/calculations.ts";

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

console.log("Bags remaining");
assert(
  "remaining bags",
  calcBagsRemaining(100, 35) === 65,
);

console.log("\nSession input KG");
assert(
  "on-site clean prorates extra",
  calcSessionInputKg(
    {
      procurement_type: "on_site",
      product_condition: "clean",
      number_of_bags: 100,
      kg_per_bag: 25,
      extra_kg: 10,
      total_kg: 2510,
    },
    10,
  ) === 251,
);

assert(
  "raw prorates total kg",
  calcSessionInputKg(
    {
      procurement_type: "on_site",
      product_condition: "raw",
      number_of_bags: 20,
      kg_per_bag: null,
      extra_kg: 0,
      total_kg: 1000,
    },
    5,
  ) === 250,
);

console.log("\nOutput KG");
assert(
  "output from bags and extra",
  calcProcessingOutputKg({
    bags_produced: 10,
    kg_per_bag: 25,
    extra_kg: 5,
  }) === 255,
);

console.log("\nYield");
assert(
  "yield percentage",
  calcYieldPct(200, 150) === 75,
);

console.log("\nWaste KG");
assert(
  "waste from bags at 30 kg",
  calcWasteWeightKg({ number_of_bags: 4, kg_per_bag: 30, extra_kg: 0 }) === 120,
);
assert(
  "waste includes extra kg",
  calcWasteWeightKg({ number_of_bags: 2, kg_per_bag: 30, extra_kg: 5.5 }) === 65.5,
);
assert(
  "extra kg only",
  calcWasteWeightKg({ number_of_bags: 0, kg_per_bag: 30, extra_kg: 12 }) === 12,
);
assert(
  "zero bags and extra yields zero",
  calcWasteWeightKg({ number_of_bags: 0, kg_per_bag: 30, extra_kg: 0 }) === 0,
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
