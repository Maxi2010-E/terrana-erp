"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { OperationalExpenseForm } from "@/components/expenses/operational-expense-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getOperationalExpenseLinkOptions } from "@/lib/actions/expenses";
import type { OperationalExpenseType } from "@/lib/expenses/constants";
import type { OperationalExpenseLinkOptions } from "@/lib/expenses/types";

type OperationalExpenseCreateDialogProps = {
  defaultOpen?: boolean;
  defaultExpenseType?: OperationalExpenseType;
  initialLinkOptions?: OperationalExpenseLinkOptions | null;
};

export function OperationalExpenseCreateDialog({
  defaultOpen = false,
  defaultExpenseType,
  initialLinkOptions = null,
}: OperationalExpenseCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [linkOptions, setLinkOptions] =
    useState<OperationalExpenseLinkOptions | null>(initialLinkOptions);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultOpen) {
      setOpen(true);
    }
  }, [defaultOpen]);

  useEffect(() => {
    if (initialLinkOptions) {
      setLinkOptions(initialLinkOptions);
    }
  }, [initialLinkOptions]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (linkOptions || loadingLinks) {
      return;
    }

    let cancelled = false;
    setLoadingLinks(true);
    setLoadError(null);

    getOperationalExpenseLinkOptions()
      .then((options) => {
        if (!cancelled) {
          setLinkOptions(options);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load expense link options.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingLinks(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, linkOptions, loadingLinks]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setLoadError(null);
    }
  }

  function handleSuccess() {
    setOpen(false);
    router.push("/expenses?tab=operational&message=created");
    router.refresh();
  }

  return (
    <>
      <Button type="button" size="lg" onClick={() => setOpen(true)}>
        <Plus />
        New operational expense
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create operational expense</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {loadingLinks ? (
              <p className="text-sm text-muted-foreground">Loading form options…</p>
            ) : loadError ? (
              <div className="space-y-3">
                <p className="text-sm text-destructive" role="alert">
                  {loadError}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setLinkOptions(null);
                    setLoadError(null);
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : linkOptions ? (
              <OperationalExpenseForm
                cleaningProcessingSessions={linkOptions.cleaningProcessingSessions}
                fieldTransferOutProcessingSessions={
                  linkOptions.fieldTransferOutProcessingSessions
                }
                processingSessions={linkOptions.processingSessions}
                inventoryBatches={linkOptions.inventoryBatches}
                offSiteProcurement={linkOptions.offSiteProcurement}
                preStock={linkOptions.preStock}
                shipments={linkOptions.shipments}
                defaultExpenseType={defaultExpenseType}
                onSuccess={handleSuccess}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Preparing expense form…
              </p>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
