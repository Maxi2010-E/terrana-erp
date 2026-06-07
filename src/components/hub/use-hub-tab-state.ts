"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useHubTabState<T extends string>(
  initialTab: T,
  resolveFromSearchParams: (params: URLSearchParams) => T,
  buildHref: (tab: T, current: URLSearchParams) => string,
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const switchTab = useCallback(
    (next: T) => {
      if (next === activeTab) {
        return;
      }

      setActiveTab(next);
      const params = new URLSearchParams(searchParams.toString());
      const href = buildHref(next, params);
      router.replace(href);
    },
    [activeTab, buildHref, router, searchParams],
  );

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveTab(resolveFromSearchParams(params));
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [resolveFromSearchParams]);

  return { activeTab, switchTab };
}
