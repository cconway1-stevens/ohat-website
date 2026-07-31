"use client";

import { useEffect, useState } from "react";
import { getShopHoursStatus } from "@/lib/shop-hours";

export function ShopHoursStatus() {
  const [status, setStatus] = useState(() => getShopHoursStatus());
  useEffect(() => {
    const timer = window.setInterval(() => setStatus(getShopHoursStatus()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span className="shop-hours-status-wrap">
      <span className={`shop-hours-status is-${status.status}`}><span aria-hidden="true" />{status.label}</span>
      {status.holiday ? (
        <span className="shop-hours-holiday">
          Holiday hours may vary for {status.holiday}. Please give us a call before stopping by.
        </span>
      ) : null}
    </span>
  );
}
