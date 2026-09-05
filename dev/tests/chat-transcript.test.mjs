import assert from "node:assert/strict";
import test from "node:test";
import {
  loadRecent,
  MAX_ENTRIES,
  RESTORE_MAX,
  readEntries,
  recordEntry,
  serializeTranscript,
  TRANSCRIPT_KEY,
} from "../../src/lib/chat/transcript.ts";

/** In-memory StorageLike stand-in for localStorage. */
function makeStore(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    removeItem: (key) => {
      delete data[key];
    },
    _data: data,
  };
}

test("readEntries returns an empty array when nothing is stored", () => {
  assert.deepEqual(readEntries(makeStore()), []);
});

test("readEntries survives corrupt JSON instead of throwing", () => {
  const store = makeStore({ [TRANSCRIPT_KEY]: "{not json" });
  assert.deepEqual(readEntries(store), []);
});

test("readEntries ignores a non-array payload", () => {
  const store = makeStore({ [TRANSCRIPT_KEY]: JSON.stringify({ nope: true }) });
  assert.deepEqual(readEntries(store), []);
});

test("readEntries migrates legacy 'tread' roles to 'mascot'", () => {
  const store = makeStore({
    [TRANSCRIPT_KEY]: JSON.stringify([{ t: 1000, role: "tread", text: "old log" }]),
  });
  const entries = readEntries(store);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].role, "mascot");
});

test("recordEntry appends and persists round-trippable entries", () => {
  const store = makeStore();
  recordEntry(store, { t: 1000, role: "user", text: "are you open?" });
  recordEntry(store, { t: 1001, role: "mascot", text: "Yes — we're open right now." });
  const entries = readEntries(store);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].text, "are you open?");
  assert.equal(entries[1].role, "mascot");
});

test("recordEntry caps the log at MAX_ENTRIES, dropping the oldest", () => {
  const store = makeStore();
  for (let i = 0; i < MAX_ENTRIES + 25; i++) {
    recordEntry(store, { t: i, role: "user", text: `message ${i}` });
  }
  const entries = readEntries(store);
  assert.equal(entries.length, MAX_ENTRIES);
  assert.equal(entries[0].text, "message 25");
  assert.equal(entries.at(-1).text, `message ${MAX_ENTRIES + 24}`);
});

test("recordEntry keeps miss flags and matched debug info", () => {
  const store = makeStore();
  recordEntry(store, {
    t: 1,
    role: "mascot",
    text: "I'm just a tire — that one's beyond me.",
    miss: true,
    matched: null,
  });
  const [entry] = readEntries(store);
  assert.equal(entry.miss, true);
  assert.equal(entry.matched, null);
});

test("loadRecent returns only entries inside the restore window, newest last", () => {
  const now = 1_000_000_000_000;
  const store = makeStore();
  recordEntry(store, { t: now - 48 * 60 * 60 * 1000, role: "user", text: "two days ago" });
  recordEntry(store, { t: now - 60 * 60 * 1000, role: "user", text: "an hour ago" });
  recordEntry(store, { t: now - 1000, role: "mascot", text: "just now" });
  const recent = loadRecent(store, now);
  assert.deepEqual(
    recent.map((entry) => entry.text),
    ["an hour ago", "just now"],
  );
});

test("loadRecent caps at RESTORE_MAX entries", () => {
  const now = 1_000_000_000_000;
  const store = makeStore();
  for (let i = 0; i < RESTORE_MAX + 10; i++) {
    recordEntry(store, { t: now - i * 1000, role: "user", text: `m${i}` });
  }
  assert.equal(loadRecent(store, now).length, RESTORE_MAX);
});

test("serializeTranscript emits valid JSON with the full log", () => {
  const store = makeStore();
  recordEntry(store, { t: 1, role: "user", text: "hi" });
  const parsed = JSON.parse(serializeTranscript(store, 1_700_000_000_000));
  assert.equal(parsed.source, "local-only");
  assert.equal(parsed.exportedAt, "2023-11-14T22:13:20.000Z");
  assert.equal(parsed.entries.length, 1);
  assert.equal(parsed.entries[0].text, "hi");
});
