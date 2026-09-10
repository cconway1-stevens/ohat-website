import Link from "next/link";
import { phoneDisplay, phoneHref } from "@/components/layout/site-header";
import { contactEmail } from "@/lib/shop/business";
import { shop } from "@/lib/shop/shop";

export function AccessibilitySupportSections() {
  return (
    <>
      <section id="feedback">
        <p className="privacy-section-number">05 · Report a barrier</p>
        <h2>Something blocking you? Tell us.</h2>
        <p>
          If any part of this website stops you from getting what you need, contact us and we will
          help you directly and work on a fix. You do not need to know what the technical problem
          is, and you do not need to use any special wording.
        </p>

        <div className="privacy-request-card">
          <div>
            <p className="privacy-section-number">Accessibility contact</p>
            <h3>Reach a person at the shop.</h3>
            <p>
              Please describe the barrier and tell us how you would prefer to be contacted. We will
              review your report and discuss a way to help you get the information or service you
              need while we investigate. For time-sensitive shop questions, call during business hours.
            </p>
          </div>
          <div className="privacy-request-actions">
            <a
              className="button button-primary"
              href={"mailto:" + contactEmail + "?subject=Website accessibility"}
            >
              Email an accessibility report
            </a>
            <a className="privacy-text-link" href={phoneHref}>
              Or call {phoneDisplay}
            </a>
          </div>
        </div>

        <h3>What helps us fix it faster</h3>
        <p>
          Any of this is useful, and none of it is required — a sentence describing what went wrong
          is enough to get started:
        </p>
        <ul>
          <li>the page you were on, or what you were trying to do;</li>
          <li>what happened, and what you expected instead;</li>
          <li>
            the browser and device you were using, and any assistive technology, if you know it.
          </li>
        </ul>

        <div className="privacy-callout">
          <strong>You never have to use this website to get service from us.</strong>
          <p>
            For help with shop services, call <a href={phoneHref}>{phoneDisplay}</a>{" "}
            during business hours — hours, directions, pricing questions, scheduling, and the status
            of your vehicle. You can also email us and describe a communication method that works for you.
          </p>
        </div>
      </section>

      <section id="technical">
        <p className="privacy-section-number">06 · Technical details</p>
        <h2>What the site relies on</h2>
        <p>
          Accessibility of this website depends on the following technologies working in your
          browser:
        </p>
        <ul>
          <li>HTML</li>
          <li>CSS</li>
          <li>JavaScript</li>
          <li>WAI-ARIA, where a native HTML element cannot express the role or state</li>
        </ul>
        <p>
          The site is built to degrade gracefully. Core content — hours, address, phone numbers,
          services, and directions links — is plain HTML and remains readable and usable when
          JavaScript is unavailable or blocked. Interactive extras such as the arcade and the
          optional map require JavaScript by their nature.
        </p>

        <h3>Compatibility</h3>
        <p>
          The site is designed to work with current versions of Chrome, Edge, Firefox, and Safari on
          desktop and mobile, used together with the assistive technology available on those
          platforms. It is not tested against browsers that are no longer receiving security
          updates.
        </p>
      </section>

      <section id="assessment">
        <p className="privacy-section-number">07 · How this was assessed</p>
        <h2>Internal review and ongoing improvements</h2>
        <p>
          {shop.name} uses internal review and automated checks to improve this website. No independent
          accessibility certification or complete conformance evaluation is claimed.
        </p>
        <p>
          The automated checks described above run in the repository workflow. Their results are
          limited to the pages and states tested. Screen-reader, voice-control, and other
          assistive-technology combinations need additional human evaluation.
        </p>

        <h3>Keeping this statement true</h3>
        <p>
          A source check helps keep the testing descriptions aligned with the repository. It
          cannot verify every accessibility claim or the experience of every visitor. We update
          this statement when the practices or known limitations change.
        </p>

        <h3>Contact</h3>
        <address className="privacy-contact-card">
          <strong>{shop.name}</strong>
          <span>{shop.address.street}</span>
          <span>{shop.address.cityLine}</span>
          <span>United States</span>
          <a href={phoneHref}>{phoneDisplay}</a>
          <a href={"mailto:" + contactEmail}>{contactEmail}</a>
        </address>
        <p>
          <Link href="/contact">See all contact and direction options →</Link>
        </p>
        <p>
          See also our <Link href="/privacy">privacy policy</Link> for how this website handles
          data.
        </p>
      </section>
    </>
  );
}
