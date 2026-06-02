"use client";

import { cn } from "@/lib/utils";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  name: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({
  name,
  value,
  options,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <>
      <input type="hidden" name={name} value={value} />
      <div
        className={cn(
          "grid gap-2 rounded-xl border border-border bg-muted/30 p-1",
          options.length === 2 ? "grid-cols-2" : `grid-cols-${options.length}`,
          className,
        )}
        role="radiogroup"
      >
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                selected
                  ? "border border-primary/20 bg-accent text-accent-foreground shadow-sm"
                  : "border border-transparent text-muted-foreground hover:bg-background/80 hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
