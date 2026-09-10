"use client";

import { openPrivacySettings } from "./privacy-controls";

type PrivacySettingsButtonProps = {
  placement?: "footer" | "page";
};

export function PrivacySettingsButton({ placement = "footer" }: PrivacySettingsButtonProps) {
  return (
    <button
      type="button"
      className={
        placement === "page"
          ? "button button-primary privacy-settings-cta"
          : "footer-privacy-button"
      }
      onClick={openPrivacySettings}
    >
      {placement === "page" ? "Review privacy choices" : "Privacy settings"}
    </button>
  );
}
