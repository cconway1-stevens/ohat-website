# Production Readiness Protocol

Use this checklist before connecting a production domain.

## Required Checks

Run this from the project root:

```bash
npm run qa:production
```

The QA command runs lint, the full test suite, starts a production preview,
checks exported routes in a real browser, verifies `/contact-card.vcf`,
`/sitemap.xml`, `robots.txt`, favicon files, and tests a generated 404 URL. It
writes a JSON report, Markdown summary, command logs, and screenshots to:

```text
artifacts/production-readiness/<timestamp>/
```

Use `npm run qa:production -- --install` to force the locked dependency install
before the checks. Use `npm run qa:production -- --skip-commands` only when the
build and tests have already run and you want to repeat the browser pass.

## Browser Smoke Test

Start the production preview:

```bash
PORT=3001 npm start
```

If you need to inspect the production preview manually:

- Primary routes render without app error text or browser console errors.
- Gallery photos render after scrolling `/our-shop`.
- `/contact-card.vcf` returns `200` with `text/vcard`.
- No provider-specific script requests are emitted before the hosting provider
  is chosen.
- A missing URL returns the branded 404 page and is captured.

## Hosting Notes

- Cloudflare Worker/Sites build output is validated in `dist/server`.
- Static hosting output is generated in `dist/client`.
- Static hosting must serve the site from a domain root, not a subdirectory.
- Canonical URLs are currently set to `https://oceanheightsautorepair.com`.
