/**
 * Local-only conversation log for the contact-page chat widget.
 *
 * Every message Tread and the visitor exchange is appended to a capped,
 * JSON-encoded array in `localStorage` — nothing ever leaves the device, so
 * the "no data leaves your device" promise stays true. The log exists so the
 * shop can review what real visitors actually asked (and what the brain
 * couldn't answer) and tune the matcher, without any analytics or network.
 *
 * The functions here are pure over a `StorageLike` interface (the browser's
 * `localStorage` satisfies it) so they run under `node --test` with a plain
 * in-memory stand-in.
 */

type TranscriptRole = "user" | "mascot";

export type TranscriptEntry = {
  /** Epoch milliseconds when the message was sent. */
  t: number;
  role: TranscriptRole;
  text: string;
  /** True when a user query fell through to the fallback answer. */
  miss?: boolean;
  /** Why the brain answered the way it did (from `debugAnswer`). */
  matched?: { kind: string; id: string; score: number; label: string } | null;
};

/** Minimal subset of `localStorage` so the helpers stay testable. */
export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export const TRANSCRIPT_KEY = "ohat-chat-transcript";
/** Keep the log bounded so a chatty visitor can't fill the quota. */
export const MAX_ENTRIES = 200;
/** Restore only the last day of history into the panel on reopen. */
const RESTORE_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Cap how many messages hydrate back into the panel. */
export const RESTORE_MAX = 20;

export function readEntries(store: StorageLike): TranscriptEntry[] {
  try {
    const raw = store.getItem(TRANSCRIPT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Migrate logs written before the role was renamed "tread" → "mascot".
    return (parsed as TranscriptEntry[]).map((entry) =>
      (entry.role as string) === "tread" ? { ...entry, role: "mascot" } : entry,
    );
  } catch {
    return [];
  }
}

/** Append one entry, trimming the oldest past `MAX_ENTRIES`. Returns the log. */
export function recordEntry(store: StorageLike, entry: TranscriptEntry): TranscriptEntry[] {
  const entries = readEntries(store);
  entries.push(entry);
  const trimmed = entries.slice(-MAX_ENTRIES);
  try {
    store.setItem(TRANSCRIPT_KEY, JSON.stringify(trimmed));
  } catch {
    // Quota exceeded or storage unavailable — the chat still works, we just
    // can't keep the log. Fail silently rather than break the conversation.
  }
  return trimmed;
}

/** The most recent entries within the restore window, newest last. */
export function loadRecent(store: StorageLike, now: number = Date.now()): TranscriptEntry[] {
  const cutoff = now - RESTORE_WINDOW_MS;
  return readEntries(store)
    .filter((entry) => entry.t >= cutoff)
    .slice(-RESTORE_MAX);
}

/** Wipe the local conversation log so a fresh "clear chat" starts empty. */
export function clearTranscript(store: StorageLike): void {
  store.removeItem(TRANSCRIPT_KEY);
}

/** A pretty-printed JSON snapshot for the "download transcript" affordance. */
export function serializeTranscript(store: StorageLike, now: number = Date.now()): string {
  return JSON.stringify(
    {
      exportedAt: new Date(now).toISOString(),
      source: "local-only",
      entries: readEntries(store),
    },
    null,
    2,
  );
}
