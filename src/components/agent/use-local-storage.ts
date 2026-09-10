import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * useLocalStorage — SSR-safe, concurrent-safe persisted state for the studio.
 *
 * Reads flow through `useSyncExternalStore`: the server snapshot is always the
 * fallback, so SSR and the first client render agree (no hydration mismatch),
 * and after hydration the client snapshot reads localStorage. Writes go
 * straight to localStorage and notify every subscriber, so all components
 * using the same key stay in sync — with no setState-in-effect and no
 * cascading renders.
 */

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notify every useLocalStorage subscriber that some key changed. */
function notifyStorageChange() {
  for (const listener of listeners) listener();
}

function merge<T>(fallback: T, raw: string | null): T {
  if (raw === null) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) return (Array.isArray(parsed) ? parsed : fallback) as T;
    if (typeof fallback === "object" && fallback !== null) {
      return { ...fallback, ...parsed } as T;
    }
    // Primitive fallback (number/string/boolean): keep the parsed value only
    // when it matches the fallback's type — otherwise the stored value was
    // written by an older schema and the fallback wins.
    return (typeof parsed === typeof fallback ? parsed : fallback) as T;
  } catch {
    return fallback;
  }
}

/** One-shot read (for module-level writers like appendHistory/appendNote). */
export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return merge(fallback, window.localStorage.getItem(key));
}

/** One-shot write that also notifies subscribers. */
export function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    notifyStorageChange();
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function useLocalStorage<T>(
  key: string,
  fallback: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const getSnapshot = useCallback(
    () => window.localStorage.getItem(key) ?? JSON.stringify(fallback),
    [key, fallback],
  );
  const getServerSnapshot = useCallback(() => JSON.stringify(fallback), [fallback]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const value = useMemo(() => merge(fallback, raw), [fallback, raw]);
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(value) : next;
      writeStorage(key, resolved);
    },
    [key, value],
  );
  return [value, set];
}
