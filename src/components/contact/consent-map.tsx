"use client";

import { useState } from "react";
import { openPrivacySettings, useServiceConsent } from "@/components/analytics/privacy-controls";

type ConsentMapProps = {
  address: string;
  title: string;
};

export function ConsentMap({ address, title }: ConsentMapProps) {
  // Two gates, because they answer different questions. The Klaro choice is the
  // standing one — turn it off and the map stays off everywhere. The click is
  // the per-visit one, so nobody who never scrolls to the map loads Google.
  const consented = useServiceConsent("googleMaps");
  const [clicked, setClicked] = useState(false);

  if (!consented || !clicked) {
    return (
      <div className="map-consent">
        <strong>Google Map is off</strong>
        <p>Loading it shares your IP address and browser information with Google.</p>
        {consented ? (
          <button type="button" className="button button-primary" onClick={() => setClicked(true)}>
            Load Google Map
          </button>
        ) : (
          <button type="button" className="button button-primary" onClick={openPrivacySettings}>
            Turn on Google Maps
          </button>
        )}
        <button type="button" className="map-consent-settings" onClick={openPrivacySettings}>
          Manage your other privacy choices
        </button>
      </div>
    );
  }

  return (
    <iframe
      title={title}
      src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`}
      loading="lazy"
      referrerPolicy="no-referrer"
      allowFullScreen
    />
  );
}
