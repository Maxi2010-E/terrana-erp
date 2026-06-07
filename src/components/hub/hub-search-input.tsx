"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type HubSearchInputProps = {
  basePath: string;
  tab: string;
  placeholder: string;
  defaultValue?: string;
  preserveParams?: Record<string, string | undefined>;
};

/** Ignores param order and empty values so debounced search does not re-navigate. */
function hubQueriesEquivalent(current: string, next: string): boolean {
  const toMap = (query: string) => {
    const map = new Map<string, string>();
    for (const [key, value] of new URLSearchParams(query)) {
      if (value) {
        map.set(key, value);
      }
    }
    return map;
  };

  const currentMap = toMap(current);
  const nextMap = toMap(next);
  if (currentMap.size !== nextMap.size) {
    return false;
  }

  for (const [key, value] of currentMap) {
    if (nextMap.get(key) !== value) {
      return false;
    }
  }

  return true;
}

export function HubSearchInput({
  basePath,
  tab,
  placeholder,
  defaultValue = "",
  preserveParams,
}: HubSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  const pushQuery = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      if (preserveParams) {
        for (const [key, val] of Object.entries(preserveParams)) {
          if (val) {
            params.set(key, val);
          } else {
            params.delete(key);
          }
        }
      }
      if (next.trim()) {
        params.set("q", next.trim());
      } else {
        params.delete("q");
      }
      params.delete("page");

      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();
      if (
        pathname === basePath &&
        hubQueriesEquivalent(currentQuery, nextQuery)
      ) {
        return;
      }

      router.replace(
        nextQuery ? `${basePath}?${nextQuery}` : `${basePath}?tab=${tab}`,
      );
    },
    [basePath, pathname, preserveParams, router, searchParams, tab],
  );

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (value === defaultValue) {
      return;
    }

    const timer = window.setTimeout(() => {
      pushQuery(value);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [value, defaultValue, pushQuery]);

  return (
    <form
      className="relative min-w-0 flex-1 max-w-md"
      onSubmit={(event) => {
        event.preventDefault();
        pushQuery(value);
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => {
          if (value !== defaultValue) {
            pushQuery(value);
          }
        }}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </form>
  );
}
