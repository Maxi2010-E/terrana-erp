type FormatNairaOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function formatNaira(
  amount: number,
  options: FormatNairaOptions = {},
): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(amount);
}

export function formatNairaOrDash(
  amount: number | null | undefined,
  options: FormatNairaOptions = {},
): string {
  if (amount == null) {
    return "—";
  }

  return formatNaira(Number(amount), options);
}
