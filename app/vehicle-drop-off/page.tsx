import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import {
  phoneDisplay,
  phoneHref,
  SiteHeader,
} from "@/components/site-header";
import { DirectionsTrigger } from "@/components/directions-dialog";

export const metadata: Metadata = {
  title: "After-Hours Vehicle Drop-Off",
  description:
    "Use the secure early-bird and night-owl vehicle drop-off at Ocean Heights Auto & Tire in Egg Harbor Township, NJ.",
  alternates: { canonical: "/vehicle-drop-off" },
};

const steps = [
  {
    number: "01",
    title: "Park safely",
    copy: "Park in the customer area without blocking a service-bay door, driveway, or another vehicle.",
  },
  {
    number: "02",
    title: "Complete the envelope",
    copy: "Add your name, best phone number, vehicle details, and a clear description of what the vehicle is doing.",
  },
  {
    number: "03",
    title: "Secure your keys",
    copy: "Seal the keys inside the completed envelope and place it in the secure strong box by our side door.",
  },
  {
    number: "04",
    title: "We’ll call you",
    copy: "Our team checks the box first thing in the morning. We’ll contact you to confirm the concern and next steps.",
  },
];

export default function VehicleDropOffPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main id="main-content">
        <section className="dropoff-arrival">
          <div className="shell dropoff-hero-grid">
            <div>
              <p className="dropoff-route">After-hours route → secure side door</p>
              <h1>Park it.<br /><span>Drop it.</span><br />We’ll take it from here.</h1>
              <p>
                When the shop is closed, our secure key-drop system makes it
                easy to leave your vehicle for the next business day.
              </p>
              <div className="hero-actions">
                <DirectionsTrigger className="button button-primary">
                  Get directions
                </DirectionsTrigger>
                <a className="button button-ghost" href={phoneHref}>Call {phoneDisplay}</a>
              </div>
            </div>
            <div className="dropoff-photo">
              <Image
                src="/media/drop-box.jpg"
                alt="The secure key drop location beside the Ocean Heights service bays"
                fill
                priority
                sizes="(max-width: 800px) 100vw, 42vw"
              />
              <div className="dropoff-sign" aria-label="Secure vehicle drop-off">
                <span>24</span>
                <strong>HOUR</strong>
                <small>SECURE KEY DROP</small>
              </div>
            </div>
          </div>
        </section>

        <section className="section dropoff-steps">
          <div className="shell">
            <p className="eyebrow dark">Four easy steps</p>
            <h2>How after-hours drop-off works</h2>
            <div className="dropoff-grid">
              {steps.map((step) => (
                <article key={step.number}>
                  <span>{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="dropoff-location">
          <div className="shell dropoff-location-grid">
            <Image
              src="/media/Building-drop-box.jpg"
              width={630}
              height={381}
              alt="Ocean Heights Auto and Tire side entrance with the secure key drop location marked"
            />
            <div>
              <p className="eyebrow dark">Find the key box</p>
              <h2>Use the side door beside the service bays.</h2>
              <p>
                The secure strong box is mounted by the shop&apos;s side
                entrance. Look for the key-drop signage shown here. Please do
                not leave keys loose, under a mat, or inside an unlocked car.
              </p>
              <DirectionsTrigger className="button button-primary">
                Open directions
              </DirectionsTrigger>
            </div>
          </div>
        </section>

        <section className="dropoff-checklist">
          <div className="shell checklist-grid">
            <div>
              <p className="eyebrow">Before you lock up</p>
              <h2>Help us get started faster.</h2>
            </div>
            <ul>
              <li>Remove valuables and take anything you need for the day.</li>
              <li>Note the current mileage and where you parked.</li>
              <li>Leave the wheel-lock key if tire service may be needed.</li>
              <li>Describe when, where, and how the symptom happens.</li>
            </ul>
          </div>
        </section>

        <section className="dropoff-note">
          <div className="shell">
            <strong>Important:</strong>
            <p>
              The key drop is for scheduled or non-emergency service. If the
              vehicle is unsafe to drive, arrange a tow. Leaving a vehicle does
              not authorize repairs—we’ll speak with you before proceeding.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
