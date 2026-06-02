import {
  assessGradingVariance,
  gradingVarianceAlertClass,
  type GradingVarianceWarning,
} from "@/lib/inventory/grading-variance";

type GradingVarianceAlertsProps = {
  inputBags: number;
  inputKg: number;
  outputBags: number;
  outputKg: number;
};

export function GradingVarianceAlerts({
  inputBags,
  inputKg,
  outputBags,
  outputKg,
}: GradingVarianceAlertsProps) {
  const warnings = assessGradingVariance({
    input_bags: inputBags,
    input_kg: inputKg,
    output_bags: outputBags,
    output_kg: outputKg,
  });

  if (warnings.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-2">
      {warnings.map((warning) => (
        <li key={warning.code}>
          <VarianceAlert warning={warning} />
        </li>
      ))}
    </ul>
  );
}

function VarianceAlert({ warning }: { warning: GradingVarianceWarning }) {
  const title =
    warning.code === "moisture_gain"
      ? "Moisture / weight gain"
      : warning.code === "loss_high"
        ? "Weight loss — check mix"
        : warning.code === "bag_loss"
          ? "Bag count change"
          : "KG vs 25 kg standard";

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 text-sm ${gradingVarianceAlertClass(warning.level)}`}
      role={warning.level === "alert" ? "alert" : "status"}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-0.5 text-[13px] opacity-90">{warning.message}</p>
    </div>
  );
}
