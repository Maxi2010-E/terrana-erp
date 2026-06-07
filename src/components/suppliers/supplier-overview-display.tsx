import type { Supplier } from "@/lib/suppliers/types";

type SupplierOverviewDisplayProps = {
  supplier: Supplier;
};

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export function SupplierOverviewDisplay({ supplier }: SupplierOverviewDisplayProps) {
  return (
    <dl className="grid gap-4 md:grid-cols-2">
      <Field label="Supplier ID" value={supplier.supplier_code} />
      <Field
        label="Status"
        value={supplier.status === "active" ? "Active" : "Inactive"}
      />
      <div className="md:col-span-2">
        <Field label="Supplier name" value={supplier.supplier_name} />
      </div>
      <Field label="Phone" value={supplier.phone ?? "—"} />
      <Field label="Email" value={supplier.email ?? "—"} />
      <div className="md:col-span-2">
        <Field label="Address" value={supplier.address ?? "—"} />
      </div>
      <div className="md:col-span-2">
        <Field label="Notes" value={supplier.notes ?? "—"} />
      </div>
    </dl>
  );
}
