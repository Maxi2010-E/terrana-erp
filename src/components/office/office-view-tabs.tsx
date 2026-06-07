import Link from "next/link";

import { cn } from "@/lib/utils";

type OfficeViewTabsProps = {
  view: "attendance" | "board";
  channel: "general" | "private" | "tasks";
  canViewAttendance: boolean;
};

export function OfficeViewTabs({
  view,
  channel,
  canViewAttendance,
}: OfficeViewTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {canViewAttendance ? (
        <Link
          href="/office?view=attendance"
          className={cn(
            "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
            view === "attendance"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          Attendance
        </Link>
      ) : null}
      <Link
        href="/office?view=board&channel=general"
        className={cn(
          "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
          view === "board"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        Company board
      </Link>
      {view === "board" ? (
        <span className="hidden sm:inline-flex items-center gap-2 pl-2 text-sm text-muted-foreground">
          <ChannelLink channel={channel} target="general" label="General" />
          <span aria-hidden>·</span>
          <ChannelLink channel={channel} target="private" label="Private" />
          <span aria-hidden>·</span>
          <ChannelLink channel={channel} target="tasks" label="Tasks" />
        </span>
      ) : null}
    </div>
  );
}

function ChannelLink({
  channel,
  target,
  label,
}: {
  channel: string;
  target: string;
  label: string;
}) {
  return (
    <Link
      href={`/office?view=board&channel=${target}`}
      className={cn(
        channel === target
          ? "font-medium text-foreground"
          : "hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
