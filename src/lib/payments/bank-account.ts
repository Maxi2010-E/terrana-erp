import type { PaymentBankAccountSummary } from "@/lib/payments/types";

export function formatBankAccountLabel(
  account: Pick<
    PaymentBankAccountSummary,
    "bank_name" | "account_number" | "account_name" | "is_primary"
  >,
): string {
  const masked = maskAccountNumber(account.account_number);
  const primary = account.is_primary ? " · Primary" : "";

  return `${account.bank_name} · ${masked} · ${account.account_name}${primary}`;
}

export function maskAccountNumber(accountNumber: string): string {
  const trimmed = accountNumber.trim();
  if (trimmed.length <= 4) {
    return trimmed;
  }

  return `···${trimmed.slice(-4)}`;
}

export function pickDefaultBankAccountId(
  accounts: PaymentBankAccountSummary[],
): string {
  if (accounts.length === 0) {
    return "";
  }

  return accounts.find((account) => account.is_primary)?.id ?? accounts[0].id;
}
