"use client";

import { useEffect, useState } from "react";
import { getActiveNotice } from "@/lib/shop/announcements.mjs";

type ActiveNotice = NonNullable<ReturnType<typeof getActiveNotice>>;

/**
 * The holiday/closure warning line inside the contact page's hours card.
 *
 * Reuses the same notice engine as the top-of-page banner instead of
 * re-deriving "is a holiday coming up" here — one source of truth for what
 * counts as a warning. The server renders nothing so a static export never
 * bakes a build-day decision into the HTML; the client fills it in once.
 */
export function HoursCardNotice() {
  const [notice, setNotice] = useState<ActiveNotice | null>(null);

  useEffect(() => {
    setNotice(getActiveNotice());
  }, []);

  if (!notice) return null;

  return <p className="contact-hours-warning">{notice.message}</p>;
}
