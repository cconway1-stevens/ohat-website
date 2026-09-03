/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "No circular dependencies between modules.",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "no-prod-to-dev",
      severity: "error",
      comment: "Production code (src/) must not import development tooling (dev/).",
      from: { path: "^src/" },
      to: { path: "^dev/" },
    },
    {
      name: "no-worker-to-components",
      severity: "error",
      comment: "The Cloudflare Worker entry must not import React components.",
      from: { path: "^src/worker/" },
      to: { path: "^src/components/" },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    exclude: {
      path: "dist|\\.next|\\.wrangler|\\.vinext|coverage",
    },
    tsConfig: {
      fileName: "tsconfig.json",
    },
    tsPreCompilationDeps: true,
  },
};
