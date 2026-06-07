import type { WasteReprocessingSessionDetail } from "@/lib/waste/reprocessing-types";

export function WasteReprocessingSessionRequestSummary({
  session,
}: {
  session: WasteReprocessingSessionDetail;
}) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <dt className="text-xs text-muted-foreground">Kg to re-process</dt>
        <dd className="text-sm font-medium tabular-nums">
          {session.kg_sent.toLocaleString()} kg
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Input KG</dt>
        <dd className="text-sm font-medium tabular-nums">
          {session.input_kg.toLocaleString()} kg
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Local product</dt>
        <dd className="text-sm font-medium">{session.local_product_label}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Origin session</dt>
        <dd className="text-sm font-medium">{session.origin_session_number}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Processing date</dt>
        <dd className="text-sm font-medium">{session.processing_date}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Processed by</dt>
        <dd className="text-sm font-medium">
          {session.processed_by_label ?? "—"}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Submitted</dt>
        <dd className="text-sm font-medium">
          {new Date(session.created_at).toLocaleString()}
        </dd>
      </div>
      {session.notes ? (
        <div className="sm:col-span-2 lg:col-span-3">
          <dt className="text-xs text-muted-foreground">Notes</dt>
          <dd className="text-sm">{session.notes}</dd>
        </div>
      ) : null}
    </dl>
  );
}
