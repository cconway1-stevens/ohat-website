"use client";

import { useEffect, useRef, useState } from "react";

function useCopyToClipboard(value: string) {
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

  return { copied, copy };
}

/**
 * A large tap target that copies an email address, styled to match the
 * page's other primary contact actions rather than the small inline copy button.
 */
export function EmailCopyAction({ email, className }: { email: string; className?: string }) {
  const { copied, copy } = useCopyToClipboard(email);

  return (
    <button type="button" className={className} onClick={copy}>
      <span>{copied ? "Copied to clipboard" : "Email the shop"}</span>
      <strong>{email}</strong>
    </button>
  );
}
