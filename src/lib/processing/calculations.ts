import type {
  ProcurementType,
  ProductCondition,
} from "../procurement/constants";
import { calcTotalKg } from "../procurement/product-type";

type BatchWeightInput = {
  procurement_type: ProcurementType;
  product_condition: ProductCondition;
  number_of_bags: number;
  kg_per_bag: number | null;
  extra_kg: number;
  total_kg: number;
};

export function calcBagsRemaining(
  batchBags: number,
  bagsSentInSessions: number,
): number {
  return Math.max(0, batchBags - bagsSentInSessions);
}

/** Input kg allocated to a processing session from the source batch. */
export function calcSessionInputKg(
  batch: BatchWeightInput,
  bagsSent: number,
): number {
  if (bagsSent <= 0 || batch.number_of_bags <= 0) {
    return 0;
  }

  const ratio = bagsSent / batch.number_of_bags;

  if (batch.product_condition === "raw") {
    return Math.round(batch.total_kg * ratio * 1000) / 1000;
  }

  if (batch.kg_per_bag != null && batch.kg_per_bag > 0) {
    const extraShare = ratio * batch.extra_kg;
    return calcTotalKg({
      procurement_type: batch.procurement_type,
      product_condition: batch.product_condition,
      number_of_bags: bagsSent,
      kg_per_bag: batch.kg_per_bag,
      extra_kg: extraShare,
      total_kg_direct: null,
    });
  }

  return Math.round(batch.total_kg * ratio * 1000) / 1000;
}

export function calcProcessingOutputKg(input: {
  bags_produced: number;
  kg_per_bag: number | null;
  extra_kg: number;
}): number {
  if (input.bags_produced <= 0) {
    return Math.max(0, input.extra_kg);
  }

  if (input.kg_per_bag != null && input.kg_per_bag > 0) {
    return (
      Math.round(
        (input.bags_produced * input.kg_per_bag + input.extra_kg) * 1000,
      ) / 1000
    );
  }

  return Math.max(0, input.extra_kg);
}

export function calcYieldPct(inputKg: number, outputKg: number): number {
  if (inputKg <= 0 || outputKg <= 0) {
    return 0;
  }

  return Math.round((outputKg / inputKg) * 10000) / 100;
}

export function calcWasteWeightKg(input: {
  number_of_bags: number;
  kg_per_bag: number | null;
  extra_kg: number;
}): number {
  if (input.number_of_bags <= 0) {
    return Math.max(0, input.extra_kg);
  }

  if (input.kg_per_bag != null && input.kg_per_bag > 0) {
    return (
      Math.round(
        (input.number_of_bags * input.kg_per_bag + input.extra_kg) * 1000,
      ) / 1000
    );
  }

  return Math.max(0, input.extra_kg);
}
