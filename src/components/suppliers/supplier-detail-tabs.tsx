"use client";

import { useState } from "react";

import { SupplierProcurementsPanel } from "@/components/procurement/supplier-procurements-panel";
import { SupplierBankAccountsPanel } from "@/components/suppliers/supplier-bank-accounts-panel";
import { SupplierOverviewForm } from "@/components/suppliers/supplier-overview-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  BankAccountFormState,
  SupplierFormState,
} from "@/lib/actions/suppliers";
import {
  SUPPLIER_TABS,
  SUPPLIER_TAB_LABELS,
  type SupplierTab,
} from "@/lib/suppliers/constants";
import type { Supplier, SupplierBankAccount } from "@/lib/suppliers/types";
import type {
  PaymentStatus,
  ProcurementStatus,
  ProcurementType,
} from "@/lib/procurement/constants";
import { cn } from "@/lib/utils";

type SupplierProcurementRow = {
  id: string;
  batch_number: string;
  procurement_type: ProcurementType;
  product_type: string;
  total_kg: number;
  status: ProcurementStatus;
  payment_status: PaymentStatus;
  procurement_date: string;
  unit_price: number | null;
  total_value: number | null;
};

type SupplierDetailTabsProps = {
  supplier: Supplier;
  bankAccounts: SupplierBankAccount[];
  procurements: SupplierProcurementRow[];
  showProcurementPricing: boolean;
  canEdit: boolean;
  updateAction: (
    supplierId: string,
    state: SupplierFormState,
    formData: FormData,
  ) => Promise<SupplierFormState>;
  addBankAction: (
    supplierId: string,
    state: BankAccountFormState,
    formData: FormData,
  ) => Promise<BankAccountFormState>;
  deleteBankAction: (supplierId: string, bankAccountId: string) => Promise<void>;
  setPrimaryBankAction: (
    supplierId: string,
    bankAccountId: string,
  ) => Promise<void>;
};

function PlaceholderPanel({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-2">Available in {phase}.</p>
    </div>
  );
}

export function SupplierDetailTabs({
  supplier,
  bankAccounts,
  procurements,
  showProcurementPricing,
  canEdit,
  updateAction,
  addBankAction,
  deleteBankAction,
  setPrimaryBankAction,
}: SupplierDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<SupplierTab>("overview");
  const boundUpdateAction = updateAction.bind(null, supplier.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {SUPPLIER_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {SUPPLIER_TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <SupplierOverviewForm
              action={boundUpdateAction}
              supplier={supplier}
              readOnly={!canEdit}
            />
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "bank" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bank accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <SupplierBankAccountsPanel
              supplierId={supplier.id}
              bankAccounts={bankAccounts}
              canEdit={canEdit}
              addAction={addBankAction}
              deleteAction={deleteBankAction}
              setPrimaryAction={setPrimaryBankAction}
            />
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "procurements" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Procurements</CardTitle>
          </CardHeader>
          <CardContent>
            <SupplierProcurementsPanel
              rows={procurements}
              showPricing={showProcurementPricing}
            />
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "payments" ? (
        <PlaceholderPanel title="Payments" phase="Phase 6" />
      ) : null}

      {activeTab === "analytics" ? (
        <PlaceholderPanel title="Analytics" phase="Phase 9" />
      ) : null}
    </div>
  );
}
