"use client";

import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatNaira } from "@/lib/currency";
import { getPettyCashTopUpsList } from "@/lib/actions/expenses";
import { PAGE_SIZE } from "@/lib/employees/constants";
import { formatPettyCashBalance } from "@/lib/expenses/balance";
import type { PettyCashTopUpRow } from "@/lib/expenses/types";

type PettyCashTopUpHistoryDialogProps = {
  totalTopUps: number;
};

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-3 align-middle leading-normal";

export function PettyCashTopUpHistoryDialog({
  totalTopUps,
}: PettyCashTopUpHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PettyCashTopUpRow[]>([]);
  const [total, setTotal] = useState(totalTopUps);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const loadPage = useCallback(async (nextPage: number) => {
    setPending(true);
    setError(null);

    try {
      const result = await getPettyCashTopUpsList(nextPage);
      setRows(result.rows);
      setTotal(result.total);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load top-ups.");
    } finally {
      setPending(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadPage(1);
  }, [open, loadPage]);

  return (
    <>
      <Button
        type="button"
        variant="link"
        className="h-auto p-0 text-sm"
        onClick={() => setOpen(true)}
      >
        <History className="size-3.5" />
        View top-up history
        {totalTopUps > 0 ? ` (${totalTopUps.toLocaleString()})` : ""}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Petty cash top-up history</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className={`${HEAD_CELL} min-w-[6.5rem]`}>Date</th>
                    <th className={`${HEAD_CELL} min-w-[5.5rem]`}>Amount</th>
                    <th className={`${HEAD_CELL} min-w-[7rem]`}>Added by</th>
                    <th className={`${HEAD_CELL} min-w-[10rem]`}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {pending && rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-muted-foreground"
                      >
                        Loading top-ups…
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-muted-foreground"
                      >
                        No petty cash top-ups recorded yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td
                          className={`${BODY_CELL} whitespace-nowrap tabular-nums`}
                        >
                          {row.date_added}
                        </td>
                        <td className={`${BODY_CELL} tabular-nums font-medium`}>
                          +{formatPettyCashBalance(row.amount_added)}
                        </td>
                        <td className={BODY_CELL}>
                          {row.added_by_name ?? "—"}
                        </td>
                        <td className={`${BODY_CELL} text-muted-foreground`}>
                          {row.notes ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {total > 0 ? (
              <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-4 text-sm">
                <p className="text-muted-foreground">
                  Showing {from}–{to} of {total.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending || page <= 1}
                    onClick={() => void loadPage(page - 1)}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <span className="tabular-nums">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending || page >= totalPages}
                    onClick={() => void loadPage(page + 1)}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
