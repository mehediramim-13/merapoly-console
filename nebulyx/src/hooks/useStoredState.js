"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useState that persists to localStorage.
 * Hydrates after mount (so SSR markup always matches) and reports `ready`.
 */
export function useStoredState(key, initial) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        setValue(
          parsed && typeof parsed === "object" && !Array.isArray(parsed) && initial && typeof initial === "object"
            ? { ...initial, ...parsed }
            : parsed
        );
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    if (first.current) {
      first.current = false;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full / blocked */
    }
  }, [key, value, ready]);

  return [value, setValue, ready];
}
