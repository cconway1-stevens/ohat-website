"use client";

import { openPrivacySettings } from "./privacy-controls";

export function PrivacySettingsButton() {
  return (
    <button type="button" className="footer-privacy-button" onClick={openPrivacySettings}>
      Privacy settings
    </button>
  );
}
