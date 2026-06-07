"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useActionState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShipmentFormState } from "@/lib/actions/shipments";
import { getWarehouseLotLoadOptions } from "@/lib/actions/warehouse-lots";
import { kgForBagLoad, CONTAINER_TARGET_BAGS } from "@/lib/inventory/warehouse-lot";
import type {
  WarehouseLotForShipmentSelect,
  WarehouseLotLoadOption,
} from "@/lib/logistics/types";

const selectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type ShipmentCreateFormProps = {
  action: (
    state: ShipmentFormState,
    formData: FormData,
  ) => Promise<ShipmentFormState>;
  customers: { id: string; customer_code: string; customer_name: string; country: string }[];
  truckAgents: { id: string; agent_name: string; phone: string | null }[];
  warehouseLots: WarehouseLotForShipmentSelect[];
};

export function ShipmentCreateForm({
  action,
  customers,
  truckAgents,
  warehouseLots,
}: ShipmentCreateFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});
  const [lotId, setLotId] = useState("");
  const [loadOptions, setLoadOptions] = useState<WarehouseLotLoadOption[]>([]);
  const [loadOptionsError, setLoadOptionsError] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadBagsByBatch, setLoadBagsByBatch] = useState<Record<string, string>>({});

  useEffect(() => {
    if (state.success && state.shipmentId) {
      router.push(`/logistics/shipments/${state.shipmentId}?message=created`);
      router.refresh();
    }
  }, [state.success, state.shipmentId, router]);

  useEffect(() => {
    if (!lotId) {
      setLoadOptions([]);
      setLoadBagsByBatch({});
      return;
    }

    let cancelled = false;
    setLoadingOptions(true);
    setLoadOptionsError(null);

    getWarehouseLotLoadOptions(lotId)
      .then((options) => {
        if (!cancelled) {
          setLoadOptions(options);
          setLoadBagsByBatch({});
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadOptions([]);
          setLoadOptionsError(
            error instanceof Error ? error.message : "Could not load inventory for lot.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lotId]);

  const loadLines = useMemo(() => {
    return loadOptions
      .map((row) => {
        const raw = loadBagsByBatch[row.id] ?? "";
        const bags = Number.parseInt(raw, 10);
        if (!Number.isFinite(bags) || bags <= 0) {
          return null;
        }
        return {
          batchId: row.id,
          bags: Math.min(bags, row.bags),
          total_kg: kgForBagLoad(row.bags, row.total_kg, Math.min(bags, row.bags)),
        };
      })
      .filter((line): line is NonNullable<typeof line> => line !== null);
  }, [loadOptions, loadBagsByBatch]);

  const totalBags = loadLines.reduce((sum, line) => sum + line.bags, 0);
  const totalKg = loadLines.reduce((sum, line) => sum + line.total_kg, 0);

  return (
    <form action={formAction} className="space-y-8">
      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Shipment number (e.g. SHP-2026-000001) is assigned automatically when you save.
        Target load per container is about {CONTAINER_TARGET_BAGS.toLocaleString()} bags; partial
        loads are allowed and remainders stay in the warehouse lot.
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Customer & transport</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="customer_id">Customer</Label>
            <select id="customer_id" name="customer_id" className={selectClassName} required>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customer_code} · {customer.customer_name} ({customer.country})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="truck_agent_id">Truck agent</Label>
            <select id="truck_agent_id" name="truck_agent_id" className={selectClassName}>
              <option value="">Select truck agent (optional)</option>
              {truckAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.agent_name}
                  {agent.phone ? ` · ${agent.phone}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="driver_name">Driver name</Label>
            <Input id="driver_name" name="driver_name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="driver_phone">Driver phone</Label>
            <Input id="driver_phone" name="driver_phone" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="truck_plate_number">Truck plate number</Label>
            <Input id="truck_plate_number" name="truck_plate_number" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium">Load from warehouse lot</h2>
            <p className="text-sm text-muted-foreground">
              Pick a stack location, then enter bags to load per inventory batch.
            </p>
          </div>
          <p className="text-sm tabular-nums">
            Load:{" "}
            <span className="font-medium">
              {totalBags.toLocaleString()} bags · {totalKg.toLocaleString()} kg
            </span>
          </p>
        </div>

        <div className="space-y-2 max-w-md">
          <Label htmlFor="warehouse_lot_id">Warehouse lot</Label>
          <select
            id="warehouse_lot_id"
            name="warehouse_lot_id"
            className={selectClassName}
            value={lotId}
            onChange={(event) => setLotId(event.target.value)}
            required
          >
            <option value="">Select warehouse lot</option>
            {warehouseLots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.label} ({lot.bags_on_hand.toLocaleString()} bags on hand)
              </option>
            ))}
          </select>
        </div>

        {warehouseLots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No warehouse lots with available stock.{" "}
            <Link href="/inventory?tab=warehouse_lots" className="text-primary hover:underline">
              Manage warehouse lots
            </Link>{" "}
            and assign export inventory first.
          </p>
        ) : null}

        {loadOptionsError ? (
          <p className="text-sm text-destructive" role="alert">
            {loadOptionsError}
          </p>
        ) : null}

        {lotId && !loadingOptions && loadOptions.length === 0 && !loadOptionsError ? (
          <p className="text-sm text-muted-foreground">
            No available inventory at this lot.
          </p>
        ) : null}

        {loadingOptions ? (
          <p className="text-sm text-muted-foreground">Loading inventory for lot…</p>
        ) : null}

        {loadOptions.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                    Inventory
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                    On hand
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                    Bags to load
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadOptions.map((row) => (
                  <tr key={row.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 font-medium">{row.inventory_number}</td>
                    <td className="px-4 py-3">{row.product_type}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.bags} bags · {row.total_kg.toLocaleString()} kg
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min={0}
                        max={row.bags}
                        placeholder="0"
                        value={loadBagsByBatch[row.id] ?? ""}
                        onChange={(event) =>
                          setLoadBagsByBatch((current) => ({
                            ...current,
                            [row.id]: event.target.value,
                          }))
                        }
                        className="max-w-[7rem]"
                        aria-label={`Bags to load for ${row.inventory_number}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Container & shipping</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="container_number">Container number</Label>
            <Input id="container_number" name="container_number" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seal_number">Seal number</Label>
            <Input id="seal_number" name="seal_number" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination_port">Destination port</Label>
            <Input id="destination_port" name="destination_port" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loading_date">Loading date</Label>
            <Input
              id="loading_date"
              name="loading_date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bill_of_lading">Bill of lading</Label>
            <Input id="bill_of_lading" name="bill_of_lading" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vessel_name">Vessel name</Label>
            <Input id="vessel_name" name="vessel_name" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="vessel_number">Vessel number</Label>
            <Input id="vessel_number" name="vessel_number" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" />
          </div>
        </div>
      </section>

      {loadLines.map((line) => (
        <input
          key={`${line.batchId}-batch`}
          type="hidden"
          name="load_batch_id"
          value={line.batchId}
        />
      ))}
      {loadLines.map((line) => (
        <input
          key={`${line.batchId}-bags`}
          type="hidden"
          name="load_bags"
          value={String(line.bags)}
        />
      ))}

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={
          pending ||
          loadLines.length === 0 ||
          customers.length === 0 ||
          !lotId
        }
      >
        {pending ? "Creating shipment…" : "Create shipment"}
      </Button>
    </form>
  );
}
