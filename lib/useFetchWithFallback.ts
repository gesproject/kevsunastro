"use client";

import { useEffect, useState } from "react";

export function useFetchWithFallback<T>(url: string, fallback: T): T {
  const [data, setData] = useState<T>(fallback);

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then((res) => (res.ok ? res.json() : fallback))
      .then((next: T) => {
        if (!cancelled) setData(next);
      })
      .catch(() => {
        if (!cancelled) setData(fallback);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return data;
}
