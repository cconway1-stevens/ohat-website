"use client";

import { openPrivacySettings, useServiceConsent } from "@/components/analytics/privacy-controls";

type ConsentMapProps = {
  address: string;
  title: string;
};

export function ConsentMap({ address, title }: ConsentMapProps) {
  // Klaro is the only gate here — no separate per-visit click. Once the
  // visitor has turned Google Maps on, the map just loads.
  const consented = useServiceConsent("googleMaps");

  if (!consented) {
    return (
      <div className="map-consent">
        <strong>Google Map is off</strong>
        <p>Turn it on in your privacy settings to see the shop on the map.</p>
        <button
          type="button"
          className="button button-primary"
          onClick={() => openPrivacySettings("googleMaps")}
        >
          Turn on Google Maps
        </button>
      </div>
    );
  }

  return (
    <iframe
      title={title}
      src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}
