import type { HrTab } from "@/lib/hr/hub";

type HrPayPeriodFilterProps = {
  tab: HrTab;
  payPeriod: string;
  query?: string;
};

export function HrPayPeriodFilter({ tab, payPeriod, query }: HrPayPeriodFilterProps) {
  return (
    <form
      className="flex flex-wrap items-end gap-2 border-b border-border/60 px-4 py-4"
      method="get"
      action="/hr"
    >
      <input type="hidden" name="tab" value={tab} />
      {query ? <input type="hidden" name="q" value={query} /> : null}
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Pay month</span>
        <input
          type="month"
          name="month"
          defaultValue={payPeriod.slice(0, 7)}
          className="h-10 rounded-xl border border-input bg-background px-3"
        />
      </label>
      <button
        type="submit"
        className="h-10 rounded-xl border border-input px-3 text-sm hover:bg-muted"
      >
        View
      </button>
    </form>
  );
}
