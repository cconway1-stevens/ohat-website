"use client";

import { useEffect, useState } from "react";
import { gaMeasurementId } from "@/lib/analytics";
import { VercelAnalytics } from "./vercel-analytics";

const KLARO_STORAGE_KEY = "ohat-klaro-consent-v1";
const settingsEvent = "ohat-open-privacy-settings";
const consentEvent = "ohat-klaro-consent";

type ServiceName = "googleAnalytics" | "vercelAnalytics" | "shopWeather";
type KlaroApi = typeof import("klaro/dist/klaro-no-css");
let klaroApi: KlaroApi | null = null;
let klaroConfig: Record<string, unknown> | null = null;

declare global {
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

function removeGoogleCookies() {
  for (const name of document.cookie.split(";").map((cookie) => cookie.split("=")[0]?.trim())) {
    if (name === "_ga" || name?.startsWith("_ga_")) {
      // biome-ignore lint/suspicious/noDocumentCookie: withdrawal must remove GA cookies
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      // biome-ignore lint/suspicious/noDocumentCookie: cover cookies scoped to the parent host
      document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.${window.location.hostname}; SameSite=Lax`;
    }
  }
}

function enableGoogleAnalytics() {
  if (document.querySelector(`script[data-ohat-ga="${gaMeasurementId}"]`)) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
  });
  window.gtag("js", new Date());
  window.gtag("config", gaMeasurementId, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement("script");
  script.async = true;
  script.dataset.ohatGa = gaMeasurementId;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
  document.head.appendChild(script);
}

function disableGoogleAnalytics() {
  window.gtag?.("consent", "update", { analytics_storage: "denied" });
  document.querySelector(`script[data-ohat-ga="${gaMeasurementId}"]`)?.remove();
  removeGoogleCookies();
}

function effectiveConsent(service: ServiceName, consent: boolean) {
  return consent && !(navigator.globalPrivacyControl === true && service !== "shopWeather");
}

function publishConsent(service: ServiceName, consent: boolean) {
  const allowed = effectiveConsent(service, consent);
  window.dispatchEvent(new CustomEvent(consentEvent, { detail: { service, allowed } }));
  if (service === "shopWeather") {
    window.dispatchEvent(
      new CustomEvent("ohat-privacy-changed", { detail: { shopWeather: allowed } }),
    );
  }
  if (service === "googleAnalytics") {
    if (allowed) enableGoogleAnalytics();
    else disableGoogleAnalytics();
  }
}

function createConfig() {
  return {
    version: 1,
    elementID: "ohat-klaro",
    storageMethod: "localStorage",
    storageName: KLARO_STORAGE_KEY,
    cookieExpiresAfterDays: 365,
    default: false,
    mustConsent: false,
    acceptAll: true,
    hideDeclineAll: false,
    hideLearnMore: false,
    noticeAsModal: true,
    groupByPurpose: true,
    styling: { theme: ["light", "bottom", "wide"] },
    translations: {
      en: {
        privacyPolicyUrl: "/privacy",
        consentNotice: {
          title: "Your privacy choices",
          description:
            "Optional analytics and shop weather stay off until you choose them. The site works without them.",
          learnMore: "Choose services",
        },
        consentModal: {
          title: "Privacy settings",
          description:
            "Choose optional services individually. Essential site functions are always available.",
        },
        ok: "Accept all",
        decline: "Essential only",
        acceptAll: "Accept all",
        acceptSelected: "Accept selected",
        save: "Save choices",
        purposes: {
          analytics: { title: "Visitor analytics" },
          externalServices: { title: "Optional external services" },
        },
        googleAnalytics: {
          title: "Google Analytics 4",
          description: "Measures page views and phone-link clicks using analytics cookies.",
        },
        vercelAnalytics: {
          title: "Vercel Web Analytics",
          description: "Provides cookieless, aggregate page-view counts on the Vercel site.",
        },
        shopWeather: {
          title: "Shop weather from Open-Meteo",
          description: "Loads weather for the shop; Open-Meteo receives your IP address.",
        },
      },
    },
    services: [
      {
        name: "googleAnalytics",
        purposes: ["analytics"],
        cookies: [/^_ga(?:_.*)?$/],
        callback: (consent: boolean) => publishConsent("googleAnalytics", consent),
      },
      {
        name: "vercelAnalytics",
        purposes: ["analytics"],
        callback: (consent: boolean) => publishConsent("vercelAnalytics", consent),
      },
      {
        name: "shopWeather",
        purposes: ["externalServices"],
        callback: (consent: boolean) => publishConsent("shopWeather", consent),
      },
    ],
  };
}

export function PrivacyControls() {
  const [vercelAllowed, setVercelAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<{ service: ServiceName; allowed: boolean }>).detail;
      if (detail?.service === "vercelAnalytics") setVercelAllowed(detail.allowed);
    };
    const openSettings = () => {
      if (klaroApi && klaroConfig) klaroApi.show(klaroConfig, true);
    };
    window.addEventListener(consentEvent, onConsent);
    window.addEventListener(settingsEvent, openSettings);

    void import("klaro/dist/klaro-no-css").then((api) => {
      if (!active) return;
      klaroApi = api;
      klaroConfig = createConfig();
      api.render(klaroConfig, {
        show: window.localStorage.getItem(KLARO_STORAGE_KEY) === null,
      });
    });

    return () => {
      active = false;
      window.removeEventListener(consentEvent, onConsent);
      window.removeEventListener(settingsEvent, openSettings);
    };
  }, []);

  return vercelAllowed ? <VercelAnalytics /> : null;
}

export function openPrivacySettings() {
  window.dispatchEvent(new Event(settingsEvent));
}
