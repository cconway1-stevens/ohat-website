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
      <svg
        className="contact-action-icon"
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
      <span>{copied ? "Copied to clipboard" : "Email the shop"}</span>
      <strong>{email}</strong>
    </button>
  );
}
