import { formatOfficeDateTime } from "@/lib/office/date";
import type { AttendanceRosterSummary } from "@/lib/office/types";

type AttendanceRosterTableProps = {
  roster: AttendanceRosterSummary;
};

export function AttendanceRosterTable({ roster }: AttendanceRosterTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <p>
          <span className="text-muted-foreground">Date:</span>{" "}
          <span className="font-medium">{roster.date}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Present:</span>{" "}
          <span className="font-medium text-emerald-700 dark:text-emerald-300">
            {roster.presentCount}
          </span>
          <span className="text-muted-foreground"> / {roster.total}</span>
        </p>
      </div>

      <form className="flex max-w-xs flex-wrap items-end gap-2" method="get">
        <input type="hidden" name="view" value="attendance" />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">View date</span>
          <input
            type="date"
            name="date"
            defaultValue={roster.date}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          />
        </label>
        <button
          type="submit"
          className="h-10 rounded-xl border border-input px-3 text-sm hover:bg-muted"
        >
          Go
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border/70">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">First login</th>
            </tr>
          </thead>
          <tbody>
            {roster.rows.map((row) => (
              <tr key={row.userId} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3 font-medium">{row.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.role}</td>
                <td className="px-4 py-3">
                  {row.present ? (
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                      Present
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      Not yet
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatOfficeDateTime(row.firstLoginTime)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
