"use client";

import { useEffect, useState } from "react";
import { gaMeasurementId } from "@/lib/analytics";
import { VercelAnalytics } from "./vercel-analytics";
import { VercelSpeedInsights } from "./vercel-speed-insights";

const KLARO_STORAGE_KEY = "ohat-klaro-consent-v1";
const settingsEvent = "ohat-open-privacy-settings";
const consentEvent = "ohat-klaro-consent";

export type ServiceName =
  | "googleAnalytics"
  | "vercelAnalytics"
  | "vercelSpeedInsights"
  | "shopWeather"
  | "googleMaps"
  | "radioBrowser";

// Global Privacy Control is an opt-out of selling/sharing, so it overrides the
// measurement services. It does not override content the visitor explicitly
// asks us to load (weather, the map, a radio station) — those stay off until
// the visitor turns them on anyway.
const GPC_EXEMPT: ReadonlySet<ServiceName> = new Set<ServiceName>([
  "shopWeather",
  "googleMaps",
  "radioBrowser",
]);
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
  return consent && !(navigator.globalPrivacyControl === true && !GPC_EXEMPT.has(service));
}

/**
 * Reads a stored Klaro choice without waiting for the Klaro bundle to load, so
 * a component can decide whether it is allowed to reach a third party on its
 * very first render.
 */
export function serviceAllowed(service: ServiceName) {
  try {
    const raw = window.localStorage.getItem(KLARO_STORAGE_KEY);
    if (!raw) return false;
    const consent = JSON.parse(decodeURIComponent(raw)) as Partial<Record<ServiceName, boolean>>;
    return effectiveConsent(service, consent[service] === true);
  } catch {
    return false;
  }
}

/** Live consent for one service: the stored choice, then every later change. */
export function useServiceConsent(service: ServiceName) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(serviceAllowed(service));
    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<{ service: ServiceName; allowed: boolean }>).detail;
      if (detail?.service === service) setAllowed(detail.allowed);
    };
    window.addEventListener(consentEvent, onConsent);
    return () => window.removeEventListener(consentEvent, onConsent);
  }, [service]);

  return allowed;
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
        poweredBy: "Powered by Klaro",
        consentNotice: {
          title: "Your privacy, your choice",
          description:
            "We use optional analytics to improve this website, plus external services for shop weather, the map, and the arcade radio. Nothing optional loads until you choose, and the website works either way. Read our {privacyPolicy} for the full details.",
          learnMore: "Choose my services",
        },
        consentModal: {
          title: "Choose your privacy settings",
          description:
            "Optional services are off by default. Turn on only the services you are comfortable using. You can change these choices anytime.",
        },
        ok: "Allow all optional services",
        decline: "Use essential services only",
        acceptAll: "Allow all optional services",
        acceptSelected: "Allow selected services",
        save: "Save my choices",
        purposes: {
          analytics: { title: "Website insights" },
          externalServices: { title: "Shop information" },
          arcade: { title: "Arcade extras" },
        },
        googleAnalytics: {
          title: "Google Analytics 4",
          description:
            "Helps us understand which pages are useful and when someone taps a phone link. Google Analytics uses analytics cookies; advertising features stay disabled.",
        },
        vercelAnalytics: {
          title: "Vercel Web Analytics",
          description:
            "Gives us simple, cookieless page-view totals when this website is served by Vercel.",
        },
        vercelSpeedInsights: {
          title: "Vercel Speed Insights",
          description:
            "Measures how quickly pages load for you so we can fix slow pages. It sets no cookies, but Vercel receives your IP address when it loads.",
        },
        googleMaps: {
          title: "Google Maps",
          description:
            "Shows the shop on an embedded Google map. Google receives your IP address and browser information whenever the map loads.",
        },
        radioBrowser: {
          title: "Arcade internet radio",
          description:
            "Lets the arcade radio look up stations through Radio-Browser and play them. Radio-Browser and whichever station you pick both receive your IP address.",
        },
        shopWeather: {
          title: "Local shop weather",
          description:
            "Shows current weather at our shop using Open-Meteo. The request uses the shop's location, but Open-Meteo receives your IP address when it loads.",
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
        name: "vercelSpeedInsights",
        purposes: ["analytics"],
        callback: (consent: boolean) => publishConsent("vercelSpeedInsights", consent),
      },
      {
        name: "shopWeather",
        purposes: ["externalServices"],
        callback: (consent: boolean) => publishConsent("shopWeather", consent),
      },
      {
        name: "googleMaps",
        purposes: ["externalServices"],
        callback: (consent: boolean) => publishConsent("googleMaps", consent),
      },
      {
        name: "radioBrowser",
        purposes: ["arcade"],
        callback: (consent: boolean) => publishConsent("radioBrowser", consent),
      },
    ],
  };
}

/**
 * Expands the service's purpose group inside the open Klaro modal, scrolls it
 * into view, and pulses an outline around it — so "turn this on" lands the
 * visitor on the exact toggle instead of a modal full of unrelated switches.
 * The modal mounts asynchronously after `.show()`, so this polls briefly
 * rather than assuming the DOM is already there.
 */
function highlightService(service: ServiceName, attempt = 0) {
  const input = document.getElementById(`service-item-${service}`);
  if (!input) {
    if (attempt < 20) setTimeout(() => highlightService(service, attempt + 1), 100);
    return;
  }
  const row = input.closest("li.cm-service");
  const content = input.closest("ul.cm-content");
  const caret = content?.parentElement?.querySelector<HTMLAnchorElement>(".cm-caret a");
  if (content && !content.classList.contains("expanded")) caret?.click();
  row?.scrollIntoView({ block: "center", behavior: "smooth" });
  row?.classList.add("cm-service-highlight");
  setTimeout(() => row?.classList.remove("cm-service-highlight"), 2400);
}

export function PrivacyControls() {
  const vercelAllowed = useServiceConsent("vercelAnalytics");
  const speedInsightsAllowed = useServiceConsent("vercelSpeedInsights");

  useEffect(() => {
    let active = true;
    const openSettings = (event: Event) => {
      if (!klaroApi || !klaroConfig) return;
      klaroApi.show(klaroConfig, true);
      const service = (event as CustomEvent<{ service?: ServiceName }>).detail?.service;
      if (service) highlightService(service);
    };
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
      window.removeEventListener(settingsEvent, openSettings);
    };
  }, []);

  return (
    <>
      {vercelAllowed ? <VercelAnalytics /> : null}
      {speedInsightsAllowed ? <VercelSpeedInsights /> : null}
    </>
  );
}

export function openPrivacySettings(service?: ServiceName) {
  window.dispatchEvent(new CustomEvent(settingsEvent, { detail: { service } }));
}
