import {
  calcProcessingOutputKg,
  calcWasteWeightKg,
} from "@/lib/processing/calculations";

export function calcWasteReprocessingInputKg(input: {
  number_of_bags: number;
  kg_per_bag: number | null;
  extra_kg: number;
  kg_sent: number;
}): number {
  if (input.kg_sent > 0) {
    return Math.round(input.kg_sent * 1000) / 1000;
  }

  return calcWasteWeightKg({
    number_of_bags: input.number_of_bags,
    kg_per_bag: input.kg_per_bag,
    extra_kg: input.extra_kg,
  });
}

export function calcWasteReprocessingOutputKg(input: {
  bags_produced: number;
  kg_per_bag: number | null;
  extra_kg: number;
}): number {
  return calcProcessingOutputKg(input);
}

export function calcWasteReprocessingYieldPct(
  inputKg: number,
  outputKg: number,
): number {
  if (inputKg <= 0 || outputKg <= 0) {
    return 0;
  }

  return Math.round((outputKg / inputKg) * 10000) / 100;
}

export function calcWasteAvailableKg(
  totalKg: number,
  reprocessedKg: number,
  reservedKg: number,
): number {
  return Math.max(
    0,
    Math.round((totalKg - reprocessedKg - reservedKg) * 1000) / 1000,
  );
}
