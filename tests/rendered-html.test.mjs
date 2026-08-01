import assert from "node:assert/strict";
import test from "node:test";

const codexPreviewMeta = /\bname=["']codex-preview["']/i;

test("renders production metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(
    html,
    /<title>Auto Repair &amp; Tire Shop in Egg Harbor Township, NJ \| Ocean Heights<\/title>/,
  );
  assert.match(
    html,
    /<meta property="og:site_name" content="Ocean Heights Auto &amp; Tire"/,
  );
  assert.doesNotMatch(html, codexPreviewMeta);
});

test("renders the shared directions chooser on every location route", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("directions-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const routes = ["/", "/contact", "/vehicle-drop-off", "/links"];

  for (const route of routes) {
    const response = await worker.fetch(
      new Request(`http://localhost${route}`, {
        headers: { accept: "text/html" },
      }),
      {
        ASSETS: {
          fetch: async () => new Response("Not found", { status: 404 }),
        },
      },
      {
        waitUntil() {},
        passThroughOnException() {},
      },
    );
    const html = await response.text();

    assert.equal(response.status, 200, `${route} should render`);
    assert.match(
      html,
      /class="directions-dialog"/,
      `${route} should include the shared directions chooser`,
    );
    assert.match(
      html,
      />Apple Maps</,
      `${route} should offer Apple Maps`,
    );
    assert.match(
      html,
      />Google Maps</,
      `${route} should offer Google Maps`,
    );
    assert.match(html, />Waze</, `${route} should offer Waze`);
    assert.match(
      html,
      />Copy address</,
      `${route} should offer Copy Address`,
    );
  }
});
