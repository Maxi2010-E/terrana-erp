export const OFFICE_TIMEZONE = "Africa/Lagos";

/** YYYY-MM-DD in company local time (Nigeria). */
export function officeLocalDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: OFFICE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Stable across Node (SSR) and browsers — avoids dateStyle/timeStyle hydration mismatches. */
const OFFICE_DATETIME_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: OFFICE_TIMEZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function partValue(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function formatOfficeDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const parts = OFFICE_DATETIME_PARTS.formatToParts(new Date(value));
  const day = partValue(parts, "day");
  const month = partValue(parts, "month");
  const year = partValue(parts, "year");
  const hour = partValue(parts, "hour");
  const minute = partValue(parts, "minute");

  return `${day} ${month} ${year}, ${hour}:${minute}`;
}

export function formatOfficeDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: OFFICE_TIMEZONE,
    dateStyle: "medium",
  }).format(new Date(`${value}T12:00:00`));
}
