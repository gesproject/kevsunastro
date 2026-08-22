# Task 1.2: Keystatic GitHub-mode proof

## Status

Complete. E1 was approved on 2026-08-03. GitHub has renamed the supplied test repository to `gesproject/kevsunastro`; the proof configuration is on its test-only `main` branch at `53d495a`. Browser OAuth, browser CRUD, branch preview, failed build, and recovered preview are all evidenced without recording a secret or changing the Next.js/Vercel/Supabase production path.

## Isolated proof

`references/task-1.2/keystatic-github-proof/` is the retained early local compatibility experiment. It preserves the Astro 7 / Cloudflare compatibility pins from Task 1.1 and adds:

- the Keystatic Astro integration and an internal `/keystatic` route;
- a seeded `editorialProofs` collection with no Markdoc dependency;
- a GitHub-mode configuration selected by a non-secret repository identifier, with a `keystatic-proof/` branch prefix;
- `.env.example` listing the required secret names without values; and
- a test-branch prefix of `keystatic-proof/`.

The public test page remains a static Astro page; React is present only for Keystatic's internal admin UI. The deployed, canonical GitHub-mode proof is the separate client-supplied test repository described below, not this historical local reference.

## Client test-repository preparation

The supplied public repository was cloned into the separate sibling worktree `C:\Users\Chance\Chance Project\kev-test-build`; neither production repository, video asset, production deployment, nor secret was changed. The local `keystatic-proof/bootstrap` branch adds the pinned Astro 7.1.4 / Cloudflare adapter 14.1.5 / Keystatic 5.2.0 proof, a GitHub storage configuration for canonical repository `gesproject/kevsunastro`, a seeded `editorialProofs` record, and a secret-free `.env.example`. The reviewed proof was rebased over the editor's existing create/delete history and pushed to test `main` as `054f5c8`, followed by the canonical-repository correction `53d495a`.

`npm run check` passes there: Astro build, TypeScript, and `wrangler deploy --dry-run` all complete successfully. The generated Worker configuration resolves to the Astro Cloudflare entrypoint and client asset directory. That check command was a dry run only; the subsequent isolated preview deployment is recorded below. npm's audit report lists seven transitive advisories (four moderate and three high); they were not auto-upgraded because the proof uses intentional compatibility pins.

## Cloudflare preview evidence

After the client owner authenticated Wrangler, the exact built proof was deployed on 2026-08-03 to a new dedicated Worker named `kev-test-build-keystatic-proof`. It does not replace the pre-existing `kev-test-build` Worker or any production route. Both `/` and `/keystatic/` return HTTP 200 on the Cloudflare preview; a hydrated-browser capture at `C:\Users\Chance\Chance Project\kev-test-build\keystatic-github-mode-cloudflare.png` shows the live **Log in with GitHub** gate. The three required private binding names were configured through that Worker's secret manager; their values were never read or recorded.

The first live login attempt exposed an Astro 7 compatibility defect in Keystatic Astro 5.2.0: its injected API route accesses the removed `Astro.locals.runtime.env` API. The proof now uses a project-owned compatibility integration that retains Keystatic's upstream UI/config setup but injects a wrapper API route. The wrapper calls Keystatic's exported handler with Cloudflare's supported `cloudflare:workers` environment binding, without copying a secret into source. The rebuilt dedicated Worker passed `npm run check` (Astro build, TypeScript, and Cloudflare dry-run), and `/api/keystatic/github/login` returns the expected OAuth redirect to GitHub. Browser login, CRUD, branch-preview latency, failed-build, and rollback evidence are completed below.

## Browser CRUD evidence

The intended non-developer editor authenticated through the deployed `/keystatic` UI and completed the requested create, edit, and delete actions without a terminal. Public repository history records an add/update commit for `content/editorial-proofs/editorial-crud-proof.yaml` (`65765ea`) followed by its deletion (`1a838b4`); the file is absent after the delete. A later browser-created `branch-preview-proof` record committed as `ee48015`, but it also landed on the test repository's `main` branch. These events prove GitHub-mode CRUD and rollback of test records, but they do not prove the branch-scoped preview workflow; do not create another test record on `main`.

## Initial Cloudflare Builds evidence and safety recovery

The client connected Cloudflare Workers Builds. Pushing the existing `keystatic-proof/bootstrap` branch created a successful GitHub check named **Workers Builds: kev-test-build-keystatic-proof** and an uploaded dedicated-Worker version `49ed3a26-dfb0-468c-8216-b04e716e8459`. The dedicated Worker's active deployment did not change; its version-preview URL `https://49ed3a26-kev-test-build-keystatic-proof.nickgagne92.workers.dev/` returned HTTP 200 for `/` and `/keystatic/`, while `/api/keystatic/github/login` returned HTTP 307. This is a successful non-production Build and preview smoke test, but not the required editorial content commit or measured edit-to-preview latency.

The same GitHub push also produced a **Workers Builds: kev-test-build** check for the older Worker and promoted its version `46cbb95d-1b9e-466a-a0a8-e5e4b7cc5958`. This was not authorized: `kev-test-build` must remain separate from the proof. It was immediately rolled back to its last pre-proof active version `cd9a3905-fb0e-4056-9048-50b38826f529`; Cloudflare confirmed that version is again at 100% traffic. The client then disconnected **`kev-test-build` → Settings → Builds**. The subsequent `main` commit `ee48015` did not create another version or deployment for that Worker, verifying the disconnect. The action detaches only Git Builds; it does not delete or alter the restored Worker deployment.

The editor then used the direct proof-branch route and saved `branch-preview-proof-2` on `keystatic-proof/bootstrap` as commit `7aef870` at `2026-08-03T21:35:28-04:00`. Cloudflare uploaded preview version `3785deac-9252-4cb0-b4b9-c6dd90d5a8bc` at `2026-08-04T01:36:45.786Z`, an observed commit-to-preview latency of about 78 seconds. Its active deployment remained unchanged. The version preview `https://3785deac-kev-test-build-keystatic-proof.nickgagne92.workers.dev/` returned HTTP 200 for `/` and `/keystatic/`, and HTTP 307 from the GitHub login endpoint; it retained the three required secret bindings. This is the required editor-created branch content preview proof.

## Failed build and recovered preview

With explicit client approval, isolated commit `5a3f985` changed only the proof branch's `build` script to `node -e "process.exit(1)"`. Its local invocation returned a non-zero result as intended. GitHub then recorded **Workers Builds: kev-test-build-keystatic-proof** as `failure` at `2026-08-04T01:45:41Z`; no new dedicated-Worker version was uploaded and its active deployment did not change.

At the client's instruction, standard Git revert commit `ec91cdb` restored `build` to `astro build` on the same proof branch. `npm run check` then passed locally (Astro build, TypeScript, and Cloudflare dry-run). Cloudflare recorded the recovery check as `success` at `2026-08-04T02:00:36Z`, uploaded preview version `f817939b-e5cd-424c-8ddc-fa75094f8f21`, and again left the active deployment unchanged. Its version preview `https://f817939b-kev-test-build-keystatic-proof.nickgagne92.workers.dev/` returned HTTP 200 for `/` and `/keystatic/`, plus HTTP 307 from the GitHub login endpoint; all three private binding names remained present. The failure and revert commits are retained in `keystatic-proof/bootstrap` as the rollback audit trail.

Client-owned GitHub repository, GitHub App, Cloudflare account, and runtime secrets remain client-controlled. The intended editor performed the browser-only content operations. The implementation operator created and reverted the branch-only failure commit only after the client explicitly approved each action.

## Local evidence

- `npm ci` completed using the generated exact lockfile. npm reported seven transitive dependency advisories (four moderate and three high); they were not auto-upgraded because this is a pinned compatibility proof.
- `npm run build` passed for both default local preparation and the GitHub-mode configuration branch using the inert `owner/repository` identifier. No repository, credential, or external API was contacted.
- The built `npm run preview` returned HTTP 200 for `/`, `/keystatic/`, and `/api/compatibility.json`; the latter returned `{"route":"dynamic","nodejsCompat":"enabled"}`.
- `references/task-1.2/evidence/keystatic-local-admin.png` records the working Keystatic dashboard in that Cloudflare-compatible preview.
- The client test repository's built Worker rendered `/keystatic` locally and displayed the expected **Log in with GitHub** gate (`keystatic-github-mode-local.png`). The dedicated Cloudflare preview repeats that hydrated browser result (`keystatic-github-mode-cloudflare.png`). Together these confirm that the GitHub storage branch is active in the generated Worker; neither is a completed authentication or CRUD result.

Local filesystem storage cannot complete the collection-list or CRUD check in the Cloudflare Worker runtime: its collection view returns an empty JSON response because Worker runtime has no local project filesystem. This is not treated as a GitHub-mode pass. GitHub mode is designed to replace that storage boundary with the authorized repository API.

Astro's development server currently produces an `exports is not defined` error for the Keystatic API route, while the built Astro preview works. Continue verification with `npm run build` followed by `npm run preview` or the Cloudflare preview deployment, not the dev server.

## Client-owned configuration record

The GitHub App/OAuth, browser-only CRUD, and browser proof-branch save are complete. GitHub renamed the test repository to canonical `gesproject/kevsunastro`; the installed App continued to authorize the deployed Worker after that rename. The dedicated Worker’s `wrangler.json` name is identical to `kev-test-build-keystatic-proof`, satisfying the Workers Builds name requirement.

The client connected that dedicated Worker to `gesproject/kevsunastro` in the Cloudflare dashboard with production branch `main`, build command `npm run build`, production deploy command `npx wrangler deploy`, and non-production `npx wrangler versions upload`. Non-production branch builds are enabled for the proof branch, which is why the branch commits above uploaded versions without changing the active deployment. Cloudflare manages the build token; runtime secrets remain in the dedicated Worker's secret manager.

The current local Wrangler OAuth credential lacks Cloudflare’s separate **Workers Builds Configuration** permission, so no Builds API write was attempted from the terminal. That restriction did not prevent the client-owned dashboard connection or the completed preview proof.

## Acceptance result

- GitHub-mode browser authentication and non-developer CRUD are proven.
- An editor-created proof-branch content commit produced a live preview in about 78 seconds.
- The intentional branch-only build failure produced no deployable version.
- The authorized Git revert restored a passing build and a healthy new preview version.
- Client access and rollback ownership are recorded above; no secret value appears in this task record, source, or evidence.
