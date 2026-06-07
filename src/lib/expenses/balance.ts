export function formatPettyCashBalance(balance: number): string {
  return balance.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
