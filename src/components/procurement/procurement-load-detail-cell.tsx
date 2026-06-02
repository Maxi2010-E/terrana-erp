import { formatNairaOrDash } from "@/lib/currency";
import {
  getProcurementLoadDetail,
  type ProcurementLoadDetailInput,
} from "@/lib/procurement/load-detail";

type ProcurementLoadDetailCellProps = {
  row: ProcurementLoadDetailInput;
  showUnitPrice?: boolean;
  unitPrice?: number | null;
};

export function ProcurementLoadDetailCell({
  row,
  showUnitPrice = false,
  unitPrice,
}: ProcurementLoadDetailCellProps) {
  const detail = getProcurementLoadDetail(row);

  if (!detail && !showUnitPrice) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-0.5 text-xs leading-snug tabular-nums">
      {detail ? (
        <>
          <p>
            {detail.bagCount.toLocaleString()}{" "}
            {detail.bagCount === 1 ? "bag" : "bags"}
            {detail.kgPerBag != null
              ? ` × ${detail.kgPerBag.toLocaleString()} kg`
              : null}
          </p>
          {detail.showExtraKgLine ? (
            <p className="text-muted-foreground">
              {Number(detail.extraKg).toLocaleString()} kg extra
            </p>
          ) : null}
        </>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
      {showUnitPrice ? (
        <p className={detail ? "text-muted-foreground" : ""}>
          {formatNairaOrDash(unitPrice)}/kg
        </p>
      ) : null}
    </div>
  );
}
