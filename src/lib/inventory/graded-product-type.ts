/**
 * Graded export inventory naming — procurement-consistent labels.
 * - Single type → keep label (e.g. Clean New Red)
 * - Same color, two ages → Red Mixed / Black Mixed
 * - Red + black, all new → New Combined Mixed
 * - Red + black, all old → Old Combined Mixed
 * - Red + black, cross-age → Combined Mixed
 */

import { GRADED_COMBINATION_LABELS } from "@/lib/inventory/graded-product-type.constants";
import type {
  GradeComposition,
  GradeCompositionLine,
  GradeLineInput,
} from "@/lib/inventory/types";

export type { GradeComposition, GradeCompositionLine, GradeLineInput };

export type CleanSingleParts = {
  age: "New" | "Old";
  color: "Red" | "Black";
  label: string;
};

const CLEAN_SINGLE = /^Clean (New|Old) (Red|Black)$/;

export function parseCleanSingle(
  productType: string,
): CleanSingleParts | null {
  const match = CLEAN_SINGLE.exec(productType);
  if (!match) {
    return null;
  }

  const age = match[1] as "New" | "Old";
  const color = match[2] as "Red" | "Black";

  return { age, color, label: productType };
}

type ColorFlags = { red: boolean; black: boolean };

function colorFlagsForLabel(productType: string): ColorFlags {
  const single = parseCleanSingle(productType);
  if (single) {
    return single.color === "Red"
      ? { red: true, black: false }
      : { red: false, black: true };
  }

  switch (productType) {
    case "Red Mixed":
      return { red: true, black: false };
    case "Black Mixed":
      return { red: false, black: true };
    case "Combined Mixed":
    case "New Combined Mixed":
    case "Old Combined Mixed":
    case "Mixed":
      return { red: true, black: true };
    default:
      return { red: false, black: false };
  }
}

function mergeFlags(types: string[]): ColorFlags {
  return types.reduce<ColorFlags>(
    (acc, type) => {
      const flags = colorFlagsForLabel(type);
      return {
        red: acc.red || flags.red,
        black: acc.black || flags.black,
      };
    },
    { red: false, black: false },
  );
}

function agesFromTypes(types: string[]): { hasNew: boolean; hasOld: boolean } {
  let hasNew = false;
  let hasOld = false;

  for (const type of types) {
    const single = parseCleanSingle(type);
    if (single) {
      if (single.age === "New") {
        hasNew = true;
      } else {
        hasOld = true;
      }
      continue;
    }

    if (
      type === "Red Mixed" ||
      type === "Black Mixed" ||
      type === "Combined Mixed" ||
      type === "Mixed"
    ) {
      hasNew = true;
      hasOld = true;
      continue;
    }

    if (type === "New Combined Mixed") {
      hasNew = true;
      continue;
    }

    if (type === "Old Combined Mixed") {
      hasOld = true;
    }
  }

  return { hasNew, hasOld };
}

export function buildGradedProductType(sourceProductTypes: string[]): string {
  const unique = [
    ...new Set(sourceProductTypes.map((t) => t.trim()).filter(Boolean)),
  ];

  if (unique.length === 0) {
    return GRADED_COMBINATION_LABELS.combinedMixed;
  }

  if (unique.length === 1) {
    return unique[0]!;
  }

  const flags = mergeFlags(unique);

  if (flags.red && flags.black) {
    const { hasNew, hasOld } = agesFromTypes(unique);
    if (hasNew && !hasOld) {
      return GRADED_COMBINATION_LABELS.newCombinedMixed;
    }
    if (hasOld && !hasNew) {
      return GRADED_COMBINATION_LABELS.oldCombinedMixed;
    }
    return GRADED_COMBINATION_LABELS.combinedMixed;
  }

  if (flags.red) {
    return GRADED_COMBINATION_LABELS.redMixed;
  }

  if (flags.black) {
    return GRADED_COMBINATION_LABELS.blackMixed;
  }

  return GRADED_COMBINATION_LABELS.combinedMixed;
}

export function describeGradedCombination(sourceProductTypes: string[]): string {
  const unique = [
    ...new Set(sourceProductTypes.map((t) => t.trim()).filter(Boolean)),
  ];

  if (unique.length <= 1) {
    return "Single product type — name stays as-is.";
  }

  const name = buildGradedProductType(unique);

  if (name === GRADED_COMBINATION_LABELS.redMixed) {
    return "New and old red graded together.";
  }

  if (name === GRADED_COMBINATION_LABELS.blackMixed) {
    return "New and old black graded together.";
  }

  if (name === GRADED_COMBINATION_LABELS.newCombinedMixed) {
    return "All new red and black graded together.";
  }

  if (name === GRADED_COMBINATION_LABELS.oldCombinedMixed) {
    return "All old red and black graded together.";
  }

  return "Red and black with mixed ages — Combined Mixed.";
}

export function proportionalKg(
  bagsTaken: number,
  bagsAvailable: number,
  kgAvailable: number,
): number {
  if (bagsTaken <= 0 || bagsAvailable <= 0 || kgAvailable <= 0) {
    return 0;
  }

  if (bagsTaken >= bagsAvailable) {
    return Math.round(kgAvailable * 1000) / 1000;
  }

  return Math.round(((kgAvailable * bagsTaken) / bagsAvailable) * 1000) / 1000;
}

export function buildGradeComposition(
  lines: GradeCompositionLine[],
): GradeComposition {
  return {
    lines,
    derived_label: buildGradedProductType(
      lines.map((line) => line.source_product_type),
    ),
  };
}
