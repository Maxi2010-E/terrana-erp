/** Typical target bags per export container (soft guide for loaders). */
export const CONTAINER_TARGET_BAGS = 520;

/** Proportional KG for a partial bag load from a batch. */
export function kgForBagLoad(
  batchBags: number,
  batchKg: number,
  loadBags: number,
): number {
  if (loadBags <= 0 || batchBags <= 0 || batchKg <= 0) {
    return 0;
  }
  if (loadBags >= batchBags) {
    return batchKg;
  }
  const kgPerBag = batchKg / batchBags;
  return Math.round(kgPerBag * loadBags * 1000) / 1000;
}
