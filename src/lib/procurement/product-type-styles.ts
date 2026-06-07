/** Maps product type labels to CSS classes defined in globals.css */
export const PRODUCT_TYPE_CLASSES: Record<string, string> = {
  "Raw New Red": "product-type-raw-new-red",
  "Raw New Black": "product-type-raw-new-black",
  "Raw Old Red": "product-type-raw-old-red",
  "Raw Old Black": "product-type-raw-old-black",
  "Clean New Red": "product-type-clean-new-red",
  "Clean New Black": "product-type-clean-new-black",
  "Clean Old Red": "product-type-clean-old-red",
  "Clean Old Black": "product-type-clean-old-black",
  "Red Mixed": "product-type-red-mixed",
  "Black Mixed": "product-type-black-mixed",
  "Combined Mixed": "product-type-combined-mixed",
  Mixed: "product-type-mixed",
  "New Combined Mixed": "product-type-new-combined-mixed",
  "Old Combined Mixed": "product-type-old-combined-mixed",
};

const BASE_CLASS = "product-type-badge";
const FALLBACK_CLASS = "product-type-unknown";

export function getProductTypeStyle(productType: string): string {
  const variant = PRODUCT_TYPE_CLASSES[productType] ?? FALLBACK_CLASS;
  return `${BASE_CLASS} ${variant}`;
}
