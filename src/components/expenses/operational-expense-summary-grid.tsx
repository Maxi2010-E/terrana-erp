"use client";

type OperationalExpenseSummaryGridProps = {
  children: React.ReactNode;
};

export function OperationalExpenseSummaryGrid({
  children,
}: OperationalExpenseSummaryGridProps) {
  return (
    <div className="flex w-full min-w-0 flex-nowrap items-stretch gap-2.5">
      {children}
    </div>
  );
}
