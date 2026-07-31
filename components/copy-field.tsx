"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A value with a one-tap copy button — handy for an email or address someone
 * wants to paste into their phone rather than retype.
 */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard access can be refused; the value is visible either way.
      return;
    }
    setCopied(true);
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      resetTimer.current = null;
      setCopied(false);
    }, 2000);
  }

  return (
    <button type="button" className="copy-button" onClick={copy}>
      <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
      <span>{copied ? "Copied" : `Copy ${label}`}</span>
    </button>
  );
}
