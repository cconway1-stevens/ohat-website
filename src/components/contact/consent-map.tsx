"use client";

import { useState } from "react";

type ConsentMapProps = {
  address: string;
  title: string;
};

export function ConsentMap({ address, title }: ConsentMapProps) {
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    return (
      <div className="map-consent">
        <strong>Google Map is off</strong>
        <p>Loading it shares your IP address and browser information with Google.</p>
        <button type="button" className="button button-primary" onClick={() => setLoaded(true)}>
          Load Google Map
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
