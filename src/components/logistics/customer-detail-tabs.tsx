"use client";

import Link from "next/link";
import { useState } from "react";

import { CustomerOverviewForm } from "@/components/logistics/customer-overview-form";
import { ShipmentStatusBadge } from "@/components/logistics/shipment-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CustomerFormState } from "@/lib/actions/customers";
import {
  CUSTOMER_TAB_LABELS,
  FUMIGATION_REQUIREMENT_LABELS,
  type CustomerTab,
} from "@/lib/logistics/constants";
import type { Customer, CustomerShipmentRow } from "@/lib/logistics/types";
import { cn } from "@/lib/utils";

type CustomerDetailTabsProps = {
  customer: Customer;
  shipments: CustomerShipmentRow[];
  canEdit: boolean;
  updateAction: (
    customerId: string,
    state: CustomerFormState,
    formData: FormData,
  ) => Promise<CustomerFormState>;
};

export function CustomerDetailTabs({
  customer,
  shipments,
  canEdit,
  updateAction,
}: CustomerDetailTabsProps) {
  const [tab, setTab] = useState<CustomerTab>("overview");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-2">
        {(["overview", "shipments"] as CustomerTab[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              tab === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {CUSTOMER_TAB_LABELS[value]}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer details</CardTitle>
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <CustomerOverviewForm
                customer={customer}
                action={updateAction.bind(null, customer.id)}
              />
            ) : (
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Country</dt>
                  <dd>{customer.country}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Fumigation</dt>
                  <dd>{FUMIGATION_REQUIREMENT_LABELS[customer.fumigation_requirement]}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Contact</dt>
                  <dd>{customer.contact_person ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Phone</dt>
                  <dd>{customer.phone ?? "—"}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-xs uppercase text-muted-foreground">Email</dt>
                  <dd>{customer.email ?? "—"}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            {shipments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shipments for this customer yet.</p>
            ) : (
              <ul className="space-y-3">
                {shipments.map((shipment) => (
                  <li
                    key={shipment.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-4 py-3"
                  >
                    <div>
                      <Link
                        href={`/logistics/shipments/${shipment.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {shipment.shipment_number}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {shipment.container_number} · {shipment.loading_date} ·{" "}
                        {shipment.total_kg.toLocaleString()} kg
                      </p>
                    </div>
                    <ShipmentStatusBadge status={shipment.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
