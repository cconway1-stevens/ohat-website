import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const serviceSource = readFileSync(join(root, "src/lib/services.ts"), "utf8");
const slugs = [...serviceSource.matchAll(/^\s{4}slug: "([^"]+)"/gm)].map((match) => match[1]);

const workerUrl = new URL("../../../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("service-seo", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);
const workerEnv = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};
const workerContext = {
  waitUntil() {},
  passThroughOnException() {},
};

function contentOf(html, attribute, value) {
  const pattern = new RegExp(
    `<meta[^>]+${attribute}=["']${value}["'][^>]+content=["']([^"']*)["'][^>]*>`,
    "i",
  );
  return html.match(pattern)?.[1];
}

function jsonLdTypes(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
    .map((match) => JSON.parse(match[1]))
    .flatMap((value) => value["@graph"] ?? [value])
    .map((value) => value["@type"]);
}

const HTML_ENTITIES = new Map([
  ["amp", "&"],
  ["quot", '"'],
  ["#x27", "'"],
  ["lt", "<"],
  ["gt", ">"],
]);
const HTML_ENTITY_PATTERN = new RegExp(`&(${[...HTML_ENTITIES.keys()].join("|")});`, "g");
function decodeHtml(value) {
  return value.replace(HTML_ENTITY_PATTERN, (_, name) => HTML_ENTITIES.get(name) ?? `&${name};`);
}

test("every service page ships complete, unique local-search signals", async () => {
  assert.ok(slugs.length >= 12, "expected the complete service catalogue");
  const titles = new Set();
  const descriptions = new Set();

  for (const slug of slugs) {
    const path = `/services/${slug}`;
    const response = await worker.fetch(
      new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
      workerEnv,
      workerContext,
    );
    const html = await response.text();

    assert.equal(response.status, 200, `${path} should render`);
    assert.doesNotMatch(
      html,
      /<meta name="robots" content="noindex/i,
      `${path} should be indexable`,
    );
    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="https://oceanheightsautorepair\\.com${path}"`),
      `${path} needs its own canonical URL`,
    );
    assert.match(
      html,
      /<nav class="service-breadcrumbs" aria-label="Breadcrumb">/,
      `${path} needs visible breadcrumbs`,
    );
    assert.match(html, /href="tel:\+16092411546"/, `${path} needs a direct booking action`);
    assert.match(
      html,
      /<h1[^>]*>.*Egg Harbor Township.*NJ.*<\/h1>/s,
      `${path} needs one locally specific primary heading`,
    );

    const rawTitle = html.match(/<title>(.*?)<\/title>/s)?.[1];
    const title = rawTitle ? decodeHtml(rawTitle) : undefined;
    assert.ok(title, `${path} needs a title`);
    assert.ok(title.length <= 65, `${path} title is too long (${title.length})`);
    assert.match(title, /Egg Harbor Township/, `${path} title needs the service location`);
    assert.ok(!titles.has(title), `${path} duplicates another service title`);
    titles.add(title);

    const rawDescription = contentOf(html, "name", "description");
    const description = rawDescription ? decodeHtml(rawDescription) : undefined;
    assert.ok(description, `${path} needs a meta description`);
    assert.ok(
      description.length >= 120 && description.length <= 160,
      `${path} description should be 120-160 characters (${description.length})`,
    );
    assert.match(
      description,
      /Egg Harbor Township/,
      `${path} description needs the service location`,
    );
    assert.ok(!descriptions.has(description), `${path} duplicates another service description`);
    descriptions.add(description);

    const types = jsonLdTypes(html);
    for (const type of ["Service", "AutoRepair", "BreadcrumbList", "FAQPage"]) {
      assert.ok(types.includes(type), `${path} needs ${type} structured data`);
    }

    const relatedLinks = html.match(/href="\/services\/[^"]+"/g) ?? [];
    assert.ok(relatedLinks.length >= 3, `${path} needs useful internal service links`);
  }
});
