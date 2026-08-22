# Task 1.1 — Astro / Cloudflare compatibility spike

**Captured:** 2026-07-28  
**Scope:** disposable isolated spike only. The root Next.js app, its dependencies and lockfile, Vercel, Supabase, DNS, production routes, and credentials were not changed.

## Isolated spike

The spike is at `references/task-1.1/astro-cloudflare-spike/`. Its `.gitignore` excludes generated dependencies, build output, and Wrangler state. It contains no `.env`, bindings, production routes, or production secrets.

It has one explicit prerendered static route and one explicit on-demand endpoint:

- `/` — `export const prerender = true`; generated at `dist/client/index.html`.
- `/api/compatibility.json` — `export const prerender = false`; imports `node:buffer` and returns `{ "route": "dynamic", "nodejsCompat": "enabled" }`.

The endpoint is intentionally the smallest runtime check: successful execution proves the built Worker can serve a dynamic route and use the Node compatibility flag. It is not a product API or a Keystatic proof; Keystatic authentication/CRUD is reserved for Task 1.2.

## Pinned, observed compatibility set

| Package / runtime | Pinned version | Observed compatibility evidence |
| --- | --- | --- |
| Node.js | `22.12.0` | Astro `7.1.4`, `@astrojs/react 6.0.1`, and Wrangler `4.114.0` declare Node ≥22.12.0, ≥22.12.0, and ≥22.0.0 respectively. The spike has `engines.node`, `engines.npm`, and `.node-version` pinned to the observed Node/npm pair. |
| npm | `10.9.0` | Bundled with the pinned Node runtime and recorded in `engines.npm`. |
| Astro | `7.1.4` | `npm view astro@7 version engines --json` returned 7.1.4 as the current Astro 7 release and Node ≥22.12.0. |
| Cloudflare adapter | `14.1.5` | `npm view @astrojs/cloudflare@latest version peerDependencies --json` reported Astro `^7.0.0` and Wrangler `^4.83.0`. |
| React integration | `6.0.1` | `npm view @astrojs/react@latest version engines peerDependencies --json` reported Node ≥22.12.0 and React 17–19 peers. |
| React / React DOM | `19.2.4` / `19.2.4` | Exact versions are within the React integration peer range. |
| Keystatic core / Astro integration | `0.6.3` / `5.2.0` | `@keystatic/astro 5.2.0` declares Astro `2 || 3 || 4 || 5 || 6 || 7` and `@keystatic/core` as a peer. Both packages are pinned and lockfile-resolved; no Markdoc package was added. |
| Wrangler | `4.114.0` | `npm view wrangler@latest version engines --json` reported Node ≥22.0.0; the Cloudflare adapter peer range accepts it. |

Primary source guidance used: [Astro Cloudflare adapter documentation](https://docs.astro.build/en/guides/integrations-guide/cloudflare/), [Cloudflare compatibility flags documentation](https://developers.cloudflare.com/workers/configuration/compatibility-flags/), and [Keystatic’s Astro installation guide](https://keystatic.com/docs/installation-astro). The Keystatic guide lists `@keystatic/core` and `@keystatic/astro`; its Markdoc example was intentionally not adopted because the migration plan prohibits Markdoc absent a later approved need.

## Explicit runtime configuration

`astro.config.mjs` sets:

- `output: 'server'` to permit the dynamic endpoint.
- `cloudflare({ imageService: 'passthrough', prerenderEnvironment: 'workerd' })`.
- `sessionDrivers.lruCache()` so the disposable spike does not provision a Cloudflare KV namespace.
- the pinned React integration.

`wrangler.jsonc` sets:

- `compatibility_date: "2026-07-27"`.
- `compatibility_flags: ["nodejs_compat"]`.
- `preview_urls: true` and `workers_dev: false` (no route, custom domain, or production traffic).

The final generated `dist/server/wrangler.json` was checked to contain `main: "entry.mjs"`, `assets.directory: "../client"`, the same compatibility date and flag, and **zero** KV namespace bindings with no Images binding. This avoids automatic external resource provisioning in the spike.

## Observed local evidence

Under pinned Node 22.12.0, `npm run build` exited 0. Astro reported server output, the Cloudflare adapter, and prerendered `/index.html`.

`wrangler dev --config dist/server/wrangler.json` then served the built Worker locally. Observed requests:

| Request | Status | Evidence |
| --- | ---: | --- |
| `http://127.0.0.1:8790/` | 200 | Response contains `data-spike="static"`. |
| `http://127.0.0.1:8790/api/compatibility.json` | 200 | Response JSON: `route: "dynamic"`, `nodejsCompat: "enabled"`. |

## Cloudflare preview attempt — blocked

The preview script is pinned to the generated Worker config:

```powershell
npm run cf:preview
```

`wrangler whoami` returned exit 0 with account output suppressed, but that was not sufficient authentication evidence for a non-interactive upload. The actual `CI=1` preview-only upload exited 1 with no preview URL. Its sanitized observed error category/message is:

```text
user auth missing api token non interactive
In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable for Wrangler to work.
```

The pinned Wrangler source independently confirms that this category is emitted when no non-interactive token is available. No token value, email, account ID, or API URL was printed or written. Wrangler suggests `--temporary`, but that would use a temporary account and print a claim URL; it is an account-context mutation outside this spike's approved scope and was not attempted.

No Worker version, route, DNS setting, secret, binding, Pages project, or production deployment was created by this task.

**Result:** acceptance 2 is only locally demonstrated. A Cloudflare account/authorization or deployment-context change is required before a preview URL can be created and HTTP/browser-tested; do not treat the local workerd success as a Cloudflare preview pass.

## WSL re-verification — 2026-07-28

The Windows-installed `node_modules` could not run under WSL because it contained the Windows `workerd` binary. To keep the repository spike untouched, a disposable copy excluding `node_modules`, `.astro`, `dist`, and `.wrangler` was created under `/tmp`; its ignored dependencies were installed there with `npm ci --no-audit --no-fund` (453 packages), then discarded from the repository scope.

The WSL runtime was Node `22.22.3` / npm `10.9.8`, so its successful build is an additional Linux-platform check rather than a replacement for the exact pinned Node `22.12.0` / npm `10.9.0` evidence above. `npm run build` exited `0`, generated server output with the Cloudflare adapter, and prerendered `/index.html`.

The rebuilt Worker was served locally with the generated `dist/server/wrangler.json`. Observed responses were:

| Request | Status | Evidence |
| --- | ---: | --- |
| `http://127.0.0.1:8790/` | 200 | Response contains `data-spike="static"`. |
| `http://127.0.0.1:8790/api/compatibility.json` | 200 | Response JSON: `route: "dynamic"`, `nodejsCompat: "enabled"`. |

`wrangler whoami` in this WSL context reported that it was not authenticated. Therefore no `wrangler versions upload` command was invoked, and no Cloudflare Worker version, preview URL, route, DNS record, secret, binding, Pages project, or production deployment was created. The local Worker process was stopped after the two endpoint checks.

## Cloudflare account attempt — 2026-07-29

After a user-supplied local, Git-ignored environment file made the intended Cloudflare credential available to the WSL command, `wrangler whoami` succeeded. The rebuilt disposable spike was then bootstrapped with:

```bash
wrangler deploy --config dist/server/wrangler.json --keep-vars \
  --message 'Astro 7 compatibility spike bootstrap'
```

Cloudflare uploaded the Worker `solbo-astro7-compat-spike` and five static assets, reported version `f1720e8d-37fe-43ea-8c6a-5d7699d21f17`, and explicitly reported **“No targets deployed.”** The config still declares `workers_dev: false` and contains no route or custom domain, so this did not attach public traffic, alter DNS, modify Pages, or affect the production Sölbo site.

The first follow-up `wrangler versions upload --config dist/server/wrangler.json` reported Worker version `bd87e77e-2f65-43fe-b7a8-42d41734e53e`, but exited non-zero without a preview URL because the Cloudflare account had no registered `workers.dev` subdomain. A read-only `wrangler versions list --json` check confirmed that both returned version IDs exist.

After the user registered the account `workers.dev` subdomain, a final preview upload returned version `86fb733e-8209-4bb8-85bc-cb0c414ca703` with this isolated preview URL:

```text
https://86fb733e-solbo-astro7-compat-spike.nickgagne92.workers.dev
```

The public preview was HTTP-verified with no authentication:

| Request | Status | Evidence |
| --- | ---: | --- |
| `/` | 200 | HTML contained `data-spike="static"`. |
| `/api/compatibility.json` | 200 | JSON was `{ "route": "dynamic", "nodejsCompat": "enabled" }`. |

This completes Task 1.1's Cloudflare preview acceptance. The Worker remains a no-route compatibility spike; no production traffic, DNS, Pages project, Vercel deployment, Supabase resource, or production secret was changed.

## Commands executed

```powershell
npm view astro@7 version engines --json
npm view @astrojs/cloudflare@latest version engines peerDependencies --json
npm view @astrojs/react@latest version engines peerDependencies --json
npm view @keystatic/core@latest version engines peerDependencies --json
npm view @keystatic/astro@latest version engines peerDependencies --json
npm view wrangler@latest version engines --json
fnm install 22.12.0
fnm exec --using=22.12.0 -- node --version
node <Node-22 npm-cli.js> install --no-audit --no-fund
node <Node-22 npm-cli.js> run build
node node_modules\wrangler\bin\wrangler.js dev --config dist\server\wrangler.json --ip 127.0.0.1 --port 8790 --inspector-port 9230
Invoke-WebRequest http://127.0.0.1:8790/
Invoke-WebRequest http://127.0.0.1:8790/api/compatibility.json
node node_modules\wrangler\bin\wrangler.js whoami
npm run cf:preview
```

WSL re-verification and Cloudflare preview commands used the same isolated source, a temporary Linux-only dependency directory, and a local ignored credential file without printing its value:

```bash
npm ci --no-audit --no-fund
npm run build
wrangler whoami
wrangler deploy --config dist/server/wrangler.json --keep-vars \
  --message 'Astro 7 compatibility spike bootstrap'
wrangler versions upload --config dist/server/wrangler.json
curl --fail --silent https://86fb733e-solbo-astro7-compat-spike.nickgagne92.workers.dev/
curl --fail --silent https://86fb733e-solbo-astro7-compat-spike.nickgagne92.workers.dev/api/compatibility.json
```

The local workerd process was stopped after verification.
