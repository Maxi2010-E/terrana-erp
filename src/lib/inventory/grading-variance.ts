/** Export standard after grading — each bag recorded at 25 kg. */
export const EXPORT_STANDARD_KG_PER_BAG = 25;

/** Output KG below this share of pre-mix input triggers a loss alert. */
export const GRADING_KG_LOSS_WARN_RATIO = 0.88;

/** Output KG above pre-mix input by more than this (kg) triggers moisture notice. */
export const GRADING_KG_GAIN_WARN_KG = 0.5;

/** Allowed gap between total KG and bags × 25 before a nominal warning. */
export const GRADING_NOMINAL_GAP_PER_BAG_KG = 0.5;

export type GradingVarianceLevel = "info" | "warn" | "alert";

export type GradingVarianceCode =
  | "moisture_gain"
  | "loss_high"
  | "bag_loss"
  | "nominal_gap";

export type GradingVarianceWarning = {
  level: GradingVarianceLevel;
  code: GradingVarianceCode;
  message: string;
};

export function nominalExportKg(outputBags: number): number {
  if (outputBags <= 0) {
    return 0;
  }
  return outputBags * EXPORT_STANDARD_KG_PER_BAG;
}

export function assessGradingVariance(input: {
  input_bags: number;
  input_kg: number;
  output_bags: number;
  output_kg: number;
}): GradingVarianceWarning[] {
  const warnings: GradingVarianceWarning[] = [];
  const { input_bags, input_kg, output_bags, output_kg } = input;

  if (input_kg <= 0 || output_kg <= 0) {
    return warnings;
  }

  const nominal = nominalExportKg(output_bags);
  const bagDelta = output_bags - input_bags;

  if (output_kg > input_kg + GRADING_KG_GAIN_WARN_KG) {
    warnings.push({
      level: "info",
      code: "moisture_gain",
      message: `Output is ${formatDelta(output_kg - input_kg)} kg above pre-mix input. Water may have been added during mixing — weights may not add up until goods settle.`,
    });
  }

  if (output_kg < input_kg * GRADING_KG_LOSS_WARN_RATIO) {
    warnings.push({
      level: "alert",
      code: "loss_high",
      message: `Output (${output_kg.toLocaleString()} kg) is much lower than pre-mix input (${input_kg.toLocaleString()} kg). Check for excess moisture loss or a weighing error.`,
    });
  }

  if (bagDelta < 0) {
    warnings.push({
      level: "info",
      code: "bag_loss",
      message: `${Math.abs(bagDelta).toLocaleString()} fewer export bag(s) than taken from pre-stock (${input_bags.toLocaleString()} → ${output_bags.toLocaleString()}). Normal during re-bagging.`,
    });
  }

  if (output_bags > 0) {
    const nominalGap = Math.abs(output_kg - nominal);
    const allowedGap = output_bags * GRADING_NOMINAL_GAP_PER_BAG_KG;
    if (nominalGap > allowedGap) {
      warnings.push({
        level: "warn",
        code: "nominal_gap",
        message: `Total KG (${output_kg.toLocaleString()} kg) differs from the ${EXPORT_STANDARD_KG_PER_BAG} kg/bag standard (${nominal.toLocaleString()} kg for ${output_bags.toLocaleString()} bags).`,
      });
    }
  }

  return warnings;
}

function formatDelta(kg: number): string {
  const rounded = Math.round(kg * 1000) / 1000;
  return rounded.toLocaleString();
}

export function gradingVarianceAlertClass(level: GradingVarianceLevel): string {
  switch (level) {
    case "alert":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "warn":
      return "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100";
    default:
      return "border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100";
  }
}
