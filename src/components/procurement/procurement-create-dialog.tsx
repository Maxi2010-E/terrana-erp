"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProcurementForm } from "@/components/procurement/procurement-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createProcurement } from "@/lib/actions/procurement";
import type { EmployeeOption, SupplierOption } from "@/lib/procurement/types";

type ProcurementCreateDialogProps = {
  suppliers: SupplierOption[];
  employees: EmployeeOption[];
  canEditPricing: boolean;
  defaultOpen?: boolean;
};

export function ProcurementCreateDialog({
  suppliers,
  employees,
  canEditPricing,
  defaultOpen = false,
}: ProcurementCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);

  function handleSuccess() {
    setOpen(false);
    router.push("/procurement?message=created");
    router.refresh();
  }

  return (
    <>
      <Button type="button" size="lg" onClick={() => setOpen(true)}>
        <Plus />
        New procurement
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New procurement</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <ProcurementForm
              action={createProcurement}
              suppliers={suppliers}
              employees={employees}
              canEditPricing={canEditPricing}
              submitLabel="Create batch"
              compact
              onSuccess={handleSuccess}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
