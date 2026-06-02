/**
 * Run: node scripts/test-grading-variance.mjs
 */

const EXPORT_STANDARD_KG_PER_BAG = 25;
const GRADING_KG_LOSS_WARN_RATIO = 0.88;
const GRADING_KG_GAIN_WARN_KG = 0.5;
const GRADING_NOMINAL_GAP_PER_BAG_KG = 0.5;

function nominalExportKg(outputBags) {
  return outputBags <= 0 ? 0 : outputBags * EXPORT_STANDARD_KG_PER_BAG;
}

function assessGradingVariance(input) {
  const warnings = [];
  const { input_bags, input_kg, output_bags, output_kg } = input;

  if (input_kg <= 0 || output_kg <= 0) {
    return warnings;
  }

  const nominal = nominalExportKg(output_bags);
  const bagDelta = output_bags - input_bags;

  if (output_kg > input_kg + GRADING_KG_GAIN_WARN_KG) {
    warnings.push({ code: "moisture_gain" });
  }

  if (output_kg < input_kg * GRADING_KG_LOSS_WARN_RATIO) {
    warnings.push({ code: "loss_high" });
  }

  if (bagDelta < 0) {
    warnings.push({ code: "bag_loss" });
  }

  if (output_bags > 0) {
    const nominalGap = Math.abs(output_kg - nominal);
    if (nominalGap > output_bags * GRADING_NOMINAL_GAP_PER_BAG_KG) {
      warnings.push({ code: "nominal_gap" });
    }
  }

  return warnings;
}

function hasCode(warnings, code) {
  return warnings.some((warning) => warning.code === code);
}

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

console.log("nominalExportKg");
assert("25 bags", nominalExportKg(25) === 625);

console.log("\nassessGradingVariance");
assert(
  "moisture gain when output kg above input",
  hasCode(
    assessGradingVariance({
      input_bags: 25,
      input_kg: 600,
      output_bags: 24,
      output_kg: 610,
    }),
    "moisture_gain",
  ),
);
assert(
  "loss alert when output far below input",
  hasCode(
    assessGradingVariance({
      input_bags: 25,
      input_kg: 600,
      output_bags: 20,
      output_kg: 500,
    }),
    "loss_high",
  ),
);
assert(
  "bag loss info when fewer export bags",
  hasCode(
    assessGradingVariance({
      input_bags: 25,
      input_kg: 600,
      output_bags: 22,
      output_kg: 550,
    }),
    "bag_loss",
  ),
);
assert(
  "nominal gap when total kg off 25 kg standard",
  hasCode(
    assessGradingVariance({
      input_bags: 20,
      input_kg: 500,
      output_bags: 20,
      output_kg: 480,
    }),
    "nominal_gap",
  ),
);
assert(
  "clean mix has no alerts",
  assessGradingVariance({
    input_bags: 24,
    input_kg: 590,
    output_bags: 23,
    output_kg: 575,
  }).length === 1,
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
