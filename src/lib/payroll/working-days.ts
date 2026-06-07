const MS_PER_DAY = 86_400_000;

function parseDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

export function payPeriodBounds(payPeriod: string): {
  periodStart: string;
  periodEnd: string;
  year: number;
  month: number;
} {
  const [yearText, monthText] = payPeriod.slice(0, 7).split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const periodStart = `${yearText}-${monthText}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const periodEnd = `${yearText}-${monthText}-${String(lastDay).padStart(2, "0")}`;
  return { periodStart, periodEnd, year, month };
}

/** Weekdays (Mon–Fri) in the pay-period month. */
export function workingDaysInPayPeriod(payPeriod: string): number {
  const { year, month } = payPeriodBounds(payPeriod);
  let count = 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    if (isWeekday(date)) {
      count += 1;
    }
  }
  return count;
}

/** Count weekday overlap between leave range and pay period (inclusive). */
export function countLeaveWeekdaysInPeriod(
  startDate: string,
  endDate: string,
  payPeriod: string,
): number {
  const { periodStart, periodEnd } = payPeriodBounds(payPeriod);
  const rangeStart = parseDate(startDate > periodStart ? startDate : periodStart);
  const rangeEnd = parseDate(endDate < periodEnd ? endDate : periodEnd);

  if (rangeEnd < rangeStart) {
    return 0;
  }

  let count = 0;
  for (
    let cursor = rangeStart.getTime();
    cursor <= rangeEnd.getTime();
    cursor += MS_PER_DAY
  ) {
    const date = new Date(cursor);
    if (isWeekday(date)) {
      count += 1;
    }
  }

  return count;
}

export function employeeActiveInPeriod(
  hireDate: string,
  employeeStatus: string,
  payPeriod: string,
): boolean {
  if (employeeStatus === "archived" || employeeStatus === "inactive") {
    return false;
  }

  const { periodEnd } = payPeriodBounds(payPeriod);
  return hireDate <= periodEnd;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function dailyRate(monthlySalary: number, workingDays: number): number {
  if (workingDays <= 0) {
    return 0;
  }
  return monthlySalary / workingDays;
}
