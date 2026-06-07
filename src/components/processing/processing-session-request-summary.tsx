import type { ProcessingSessionDetail } from "@/lib/processing/types";

export function ProcessingSessionRequestSummary({
  session,
}: {
  session: ProcessingSessionDetail;
}) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <dt className="text-xs text-muted-foreground">Bags to process</dt>
        <dd className="text-sm font-medium tabular-nums">
          {session.bags_sent.toLocaleString()}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Input KG</dt>
        <dd className="text-sm font-medium tabular-nums">
          {session.input_kg.toLocaleString()} kg
        </dd>
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
