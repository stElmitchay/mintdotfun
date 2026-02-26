"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Persists state to localStorage with SSR-safe hydration.
 *
 * Uses a ref to gate writes — the persist effect will never fire
 * until the initial load from storage has completed, preventing
 * the race condition where `initialValue` overwrites stored data.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch (err) {
      console.warn(`[useLocalStorage] Failed to read "${key}":`, err);
    }
    return initialValue;
  });
  const hydrated = useRef(false);

  useEffect(() => {
    hydrated.current = true;
  }, []);

  // Persist to localStorage only after hydration completes
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`[useLocalStorage] Failed to write "${key}":`, err);
    }
  }, [key, value]);

  const clear = useCallback(() => {
    setValue(initialValue);
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[useLocalStorage] Failed to remove "${key}":`, err);
    }
  }, [key, initialValue]);

  return [value, setValue, { loaded: true, clear }] as const;
}
