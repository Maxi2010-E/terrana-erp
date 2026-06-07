import { LinkButton } from "@/components/ui/link-button";
import { SHIPMENT_STATUSES, type ShipmentStatus } from "@/lib/logistics/constants";

type ShipmentStatusFiltersProps = {
  activeStatus?: ShipmentStatus;
  query?: string;
};

export function ShipmentStatusFilters({
  activeStatus,
  query,
}: ShipmentStatusFiltersProps) {
  function href(status?: ShipmentStatus) {
    const params = new URLSearchParams({ tab: "shipments" });
    if (status) {
      params.set("status", status);
    }
    if (query) {
      params.set("q", query);
    }
    return `/logistics?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap gap-2 border-b border-border/60 px-4 py-4">
      <LinkButton
        href={href()}
        variant={activeStatus ? "outline" : "default"}
        size="sm"
      >
        All
      </LinkButton>
      {SHIPMENT_STATUSES.map((value) => (
        <LinkButton
          key={value}
          href={href(value)}
          variant={activeStatus === value ? "default" : "outline"}
          size="sm"
        >
          {value.replace("_", " ")}
        </LinkButton>
      ))}
    </div>
  );
}
