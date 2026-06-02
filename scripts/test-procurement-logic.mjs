/**
 * Quick sanity checks for procurement quantity rules (no database).
 * Run: node scripts/test-procurement-logic.mjs
 */

import {
  buildProductType,
  calcTotalKg,
  calcTotalValue,
} from "../src/lib/procurement/product-type.ts";
import {
  isDirectTotalKgRequired,
  isKgPerBagRequired,
  showDirectTotalKg,
  showExtraKgField,
  showKgPerBagField,
} from "../src/lib/procurement/quantity-rules.ts";
import {
  allowedQualityDecisions,
  isQualityDecisionAllowed,
  validateQualityDecisionForProduct,
} from "../src/lib/procurement/quality-decision-rules.ts";

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

console.log("Product type");
assert(
  "Clean New Red",
  buildProductType({
    product_condition: "clean",
    product_age: "new",
    product_color: "red",
  }) === "Clean New Red",
);
assert(
  "Red Mixed",
  buildProductType({
    product_condition: "mixed",
    mixed_type: "red_mixed",
  }) === "Red Mixed",
);

console.log("\nRaw rules");
assert("raw hides kg/bag", !showKgPerBagField("raw"));
assert("raw hides extra kg", !showExtraKgField("raw"));
assert("raw requires direct total", isDirectTotalKgRequired("on_site", "raw", null));
assert("raw kg/bag not required", !isKgPerBagRequired("on_site", "raw"));

console.log("\nQuality decision routing");
assert(
  "raw only allows processing",
  allowedQualityDecisions("raw").join(",") === "processing",
);
assert(
  "clean allows both routes",
  allowedQualityDecisions("clean").length === 2,
);
assert(
  "raw pre-stock blocked",
  !isQualityDecisionAllowed("raw", "pre_stock"),
);
assert(
  "raw processing allowed",
  isQualityDecisionAllowed("raw", "processing"),
);
assert(
  "validation message for raw pre-stock",
  validateQualityDecisionForProduct("raw", "pre_stock")?.includes("processing"),
);

console.log("\nOff-site clean rules");
assert(
  "off-site clean kg/bag optional",
  !isKgPerBagRequired("off_site", "clean"),
);
assert(
  "off-site clean shows direct total when no kg/bag",
  showDirectTotalKg("off_site", "clean", null),
);
assert(
  "off-site clean hides direct total when kg/bag set",
  !showDirectTotalKg("off_site", "clean", 50),
);

console.log("\nOn-site clean rules");
assert(
  "on-site clean kg/bag required",
  isKgPerBagRequired("on_site", "clean"),
);
assert(
  "on-site clean no direct total",
  !showDirectTotalKg("on_site", "clean", null),
);

console.log("\nTotal KG calculations");
assert(
  "raw uses direct total",
  calcTotalKg({
    procurement_type: "on_site",
    product_condition: "raw",
    number_of_bags: 10,
    extra_kg: 5,
    kg_per_bag: 99,
    total_kg_direct: 500,
  }) === 500,
);
assert(
  "on-site clean calculated",
  calcTotalKg({
    procurement_type: "on_site",
    product_condition: "clean",
    number_of_bags: 10,
    kg_per_bag: 50,
    extra_kg: 5,
    total_kg_direct: null,
  }) === 505,
);
assert(
  "off-site clean with kg/bag",
  calcTotalKg({
    procurement_type: "off_site",
    product_condition: "clean",
    number_of_bags: 10,
    kg_per_bag: 40,
    extra_kg: 10,
    total_kg_direct: null,
  }) === 410,
);
assert(
  "off-site clean direct total",
  calcTotalKg({
    procurement_type: "off_site",
    product_condition: "clean",
    number_of_bags: 10,
    kg_per_bag: null,
    extra_kg: 0,
    total_kg_direct: 380,
  }) === 380,
);
assert(
  "total value",
  calcTotalValue(100, 2.5) === 250,
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
