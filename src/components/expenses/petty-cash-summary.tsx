import { PettyCashTopUpDialog } from "@/components/expenses/petty-cash-top-up-dialog";
import { PettyCashTopUpHistoryDialog } from "@/components/expenses/petty-cash-top-up-history-dialog";
import { formatNaira } from "@/lib/currency";
import { formatPettyCashBalance } from "@/lib/expenses/balance";
import type { PettyCashSummary } from "@/lib/expenses/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PettyCashSummaryCardProps = {
  summary: PettyCashSummary;
  canTopUp?: boolean;
};

export function PettyCashSummaryCard({
  summary,
  canTopUp = false,
}: PettyCashSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <CardTitle className="text-base">Petty cash balance</CardTitle>
        {canTopUp ? <PettyCashTopUpDialog compact /> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-semibold tracking-tight">
          {formatNaira(summary.balance)}
        </p>
        <p className="text-sm text-muted-foreground">
          Approved cash daily and operational expenses reduce this balance.
          Transfer expenses do not affect petty cash.
        </p>
        {summary.lastTopUp ? (
          <p className="text-sm text-muted-foreground">
            Last top-up:{" "}
            <span className="font-medium text-foreground">
              +{formatPettyCashBalance(summary.lastTopUp.amount_added)}
            </span>
            {" · "}
            {summary.lastTopUp.date_added}
            {summary.lastTopUp.added_by_name
              ? ` · ${summary.lastTopUp.added_by_name}`
              : ""}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No petty cash top-ups recorded yet.
          </p>
        )}
        {summary.totalTopUps > 0 ? (
          <PettyCashTopUpHistoryDialog totalTopUps={summary.totalTopUps} />
        ) : null}
      </CardContent>
    </Card>
  );
}
