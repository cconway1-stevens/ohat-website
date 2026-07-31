"use client";

import { useEffect, useState } from "react";
import { getShopHoursStatus } from "@/lib/shop-hours";
import { shop } from "@/lib/shop";

export function ShopHoursStatus() {
  const [status, setStatus] = useState(() => getShopHoursStatus());
  useEffect(() => {
    const timer = window.setInterval(
      () => setStatus(getShopHoursStatus()),
      shop.hours.status.refreshMs,
    );
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span className="shop-hours-status-wrap">
      <span className={`shop-hours-status is-${status.status}`}><span aria-hidden="true" />{status.label}</span>
      {status.holiday ? (
        <span className="shop-hours-holiday">
          {status.holidayNotice}
        </span>
      ) : null}
    </span>
  );
}
