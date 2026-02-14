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
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);
  const hydrated = useRef(false);

  // Load from localStorage once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored) as T;
        setValue(parsed);
      }
    } catch (err) {
      console.warn(`[useLocalStorage] Failed to read "${key}":`, err);
    }
    hydrated.current = true;
    setLoaded(true);
  }, [key]);

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

  return [value, setValue, { loaded, clear }] as const;
}
