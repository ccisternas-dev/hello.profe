# Translation backend — Spanish → German preview

Tracking: [real translation #27](https://github.com/ccisternas-dev/hello.profe/issues/27), [future dictionary lookup #28](https://github.com/ccisternas-dev/hello.profe/issues/28).

## Repository inspection and decision

The existing app is React 19 + TypeScript + Vite 8, with pnpm 10.34.3 pinned in package.json. No AGENTS.md instructions were found in the repository or ancestor directories. The Vite config retains Figma Make plugins and uses `/hello.profe/` for GitHub Pages. `.github/workflows/pages.yml` already checks and deploys the static app on main.

Practice is working: workbook-derived data contains 917 source cards across nine decks, including 148 verbs. The public Flashcards view is now a reading-only verb reference. Translation Challenge and Complete the Verb use local data. Preserve these features and their data.

`TranslateView` in `src/App.tsx` currently waits 850ms and renders fixed samples (`aprender`, `lernen`, and a simulated French error). The source language is fixed to English, selections do not drive results, and exploration/notebook actions are prototypes. That original simulated view has now been replaced by `src/TranslationView.tsx`. It shows only actual endpoint results in the enabled local preview and an unavailable notice in production. It no longer presents fixed sample translations or links them to simulated dictionary entries.

**Decision:** retain GitHub Pages, add a separate Worker API, no SSR, no replacement project. Keep model details in `worker/src/provider.ts`. First prove Spanish → German using the existing repository's tooling. Next evaluate real outputs, then connect the current UI, then add independent target requests from the original source and stale-response/per-target-retry handling. Dictionary lookup is separate.

## Verified provider facts (2026-10-28)

- Model: `@cf/meta/m2m100-1.2b`. Its [input schema](https://developers.cloudflare.com/workers-ai/models/m2m100-1.2b/sync-input.json) describes `text`, `source_lang`, `target_lang`; we explicitly send `es` and `de`. The [model page](https://developers.cloudflare.com/workers-ai/models/m2m100-1.2b/) also contains examples using full English language names. Live inference on 2026-10-29 accepted `es` and `de`.
- Documentation inconsistency: the linked [synchronous output schema](https://developers.cloudflare.com/workers-ai/models/m2m100-1.2b/sync-output.json) currently describes `request_id`, not translated text. The adapter requires a nonempty `translated_text` and rejects an async ID or unexpected shape. Six live binding calls on 2026-10-29 returned `translated_text`, confirming this adapter shape for the tested synchronous path.
- [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/): 10,000 free neurons/day, resetting at midnight UTC; Workers Free stops accepting inference after exhaustion. Paid plans can bill overages. M2M100 is listed at $0.342/M input tokens and $0.342/M output tokens and is not in the documented paid-only model list. This is documentation-based eligibility, not verification of this user's account access or billing plan.
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/): Free has 100,000 requests/day and 10ms CPU/request. The separate AI allowance will normally be the relevant constraint here; do not turn a character limit into a guaranteed number of free translations.
- [Local development](https://developers.cloudflare.com/workers/local-development/): AI has no local model simulation. `remote: true` calls Cloudflare even when the Worker itself runs on localhost and consumes the account's allowance. Routine tests inject a fake AI binding and make no model calls.
- [Rate-limit bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) are approximate and per Cloudflare location, not a strict worldwide daily budget. This PoC's shared limit of 3 requests/minute is a small private-test guard, not a cost guarantee.
- [Provider errors](https://developers.cloudflare.com/workers-ai/platform/errors/): 3036 means exhausted free allocation, 3040 capacity, 3007/3008 timeout/abort. These map to sanitized API codes; other failures map to provider_unavailable.

## Endpoint and safety boundary

`POST /api/translate`, JSON `{ "text": "Quiero aprender alemán.", "source": "es", "target": "de" }` returns `{ "source": "es", "target": "de", "translatedText": "…" }`. Only this language pair is accepted in milestone 1.

Limits: 500 Unicode code points after trimming, 4,096 body bytes checked while streaming, 3-second body deadline, 10-second provider-response deadline. Error response: `{ "error": { "code": "…" } }`. HTTP statuses distinguish invalid input (400), authorization (401), origin (403), body size (413), media type (415), rate/quota limits (429), provider failure (502), disabled/unavailable (503), and timeout (504). No automatic model retry. A timeout stops waiting; it does not prove cancellation of already-running inference, which can still consume allowance.

The Worker is disabled by default, with workers.dev and preview URLs disabled and no custom route. It requires an enabled flag, AI and rate-limit bindings, and a private 32+-character bearer token. The token is for local CLI evaluation only; never put it in a VITE_* variable or ship it in frontend code. `.dev.vars*` and `.wrangler/` are ignored. Handler/adapter code does not log requests, provider error messages, credentials, or submitted text. Observability is disabled in configuration.

CORS currently allows only the two explicit Vite localhost origins. CORS is browser policy, not authentication. For a later approved public release, allow the exact GitHub Pages **origin** `https://ccisternas-dev.github.io` (no `/hello.profe/` path), design public abuse protection, verify Free billing, and only then enable a route. Do not remove the private token gate merely to make a browser demo work. A paid account is outside the free-only guarantee: keep it disabled until a strict shared budget/appropriate billing boundary is designed. Other projects may share the account's daily AI allowance.

## Exact local commands

Run from the existing repository root. No global changes or new app scaffold are needed.

```sh
pnpm install --frozen-lockfile
pnpm i18n:check
pnpm data:validate
pnpm test
pnpm typecheck
GITHUB_PAGES=true pnpm build
pnpm worker:check
```

`worker:check` invokes `wrangler deploy --dry-run`: it validates and bundles locally, without uploading or deploying. The local Corepack installation encountered an outdated signing-key error; if `pnpm` fails for that reason, prefix commands with `npm exec --yes --package=pnpm@10.34.3 -- pnpm`, for example `npm exec --yes --package=pnpm@10.34.3 -- pnpm test`. Do not disable signature verification. Wrangler 4.154.0 is pinned locally.

### Account setup and real proof of concept

1. In Cloudflare, select the intended personal account and verify **Workers Free**, without enabling Paid or prepaid AI credits. The user confirmed Workers Free on 2026-10-28; Wrangler authentication has been verified for the intended personal account. Billing status is user-confirmed, not independently queried.
2. Authenticate locally; do not paste credentials into chat:

```sh
pnpm exec wrangler login
pnpm exec wrangler whoami
```

If multiple accounts are listed, choose the intended account through the `CLOUDFLARE_ACCOUNT_ID` environment variable. An account ID is not an API token. Never add credentials to Git.

Before starting local AI development, complete **Workers & Pages onboarding** in the Cloudflare dashboard and register a free `workers.dev` subdomain. Wrangler’s remote-binding proxy requires it even though this app’s Worker runs locally and its public route remains disabled. The registered account subdomain is now `cristian-cisternas-v.workers.dev`; local remote-binding startup succeeded on 2026-10-29. Registering the subdomain does not require deploying an application or upgrading the plan.

3. Generate a local-only test token without printing it (this refuses to overwrite an existing file):

```sh
node --input-type=module -e 'import { randomBytes } from "node:crypto"; import { writeFileSync } from "node:fs"; writeFileSync("worker/.dev.vars", "POC_TOKEN=" + randomBytes(32).toString("hex") + "\n", { mode: 0o600, flag: "wx" })'
```

4. After confirming Free and model access, start the private dev endpoint in one terminal:

```sh
pnpm worker:dev --var TRANSLATION_ENABLED:true
```

This runs the Worker on `127.0.0.1:8787` with a remote AI binding. Do not use `--remote`, which uploads Worker code to a remote preview. The enable override above is local; the checked-in default stays disabled.

5. In another terminal run one authored evaluation fixture at a time:

```sh
pnpm translation:evaluate simple
pnpm translation:evaluate formal
pnpm translation:evaluate negation
# Wait at least 60 seconds before the next group.
pnpm translation:evaluate past
pnpm translation:evaluate numbers
pnpm translation:evaluate ambiguous
```

The harness reads the ignored local token, calls only the loopback endpoint, and prints fixture ID, returned translation/error, and latency. It does not retry automatically. References and assessment criteria are in `worker/evaluation/es-de.json`. They are illustrative, not exact-match assertions.

### Deployment (not executed or ready for public use)

GitHub Pages continues through its existing workflow. This milestone adds no Worker deployment workflow. After a separately requested public-hardening milestone and deployment approval, configure the production origin, request/budget safeguards and route; remove/replace the private CLI gate with the agreed public access mechanism; then the deployment command will be `pnpm exec wrangler deploy --config worker/wrangler.jsonc`. With the current configuration there is no public route and translation stays disabled. Never auto-upgrade the billing plan to bypass quota errors.

## Evaluation findings and remaining work

Mocked adapter/HTTP tests verify request parameters, invalid inputs, byte limits, origin checks, disabled/missing controls, rate limits, timeout, quota errors and unexpected model responses. Type checking and a Wrangler bundle dry run validate local code/configuration, not account access or model quality.

**Live evaluation completed on 2026-10-29:** after the user supplied `cristian-cisternas-v.workers.dev`, the local Worker connected to remote Workers AI. All six authored fixtures returned HTTP 200. Measured client-to-local-endpoint times (including remote inference) ranged from 688 to 909ms; these are single observations, not a latency benchmark. Requests were split into two groups with a wait respecting the private limiter. The dev server was stopped afterward.

Actual outputs and assessments are recorded in [the evaluation results](../worker/evaluation/results-2026-10-29.json). Simple meaning, negation, temporal contrast and numbers were preserved. The polite question retained formal Sie but weakened the tentative wording. The model changed **Ana → Anna**, failing exact proper-name preservation. It translated the action “Me senté” as the state “Ich saß,” losing aspect nuance. The bench context was retained.

**Decision:** M2M100 is viable for the next clearly labelled UI prototype, but six short examples do not establish broad translation quality. Keep visible machine-translation limitations; include name preservation and action/state nuance in future evaluation. Do not automatically correct names after inference. Token/neuron usage was not measured, so no exact per-request cost or guaranteed daily translation count is claimed. No app deployment occurred; the public Worker route remains disabled and production translation remains disabled until public API configuration is approved.

Later milestones: public API configuration and abuse/budget controls, followed by independent multi-target results and retries, always translated from the original input. Practice and its data are unchanged. The user authorized committing and merging the local UI integration; no public Worker deployment is performed.

## Local UI integration (2026-11-03)

After the account/token setup above, use two terminals in this repository:

```sh
# Terminal 1: private local Worker with remote AI
pnpm worker:dev --var TRANSLATION_ENABLED:true
# Terminal 2: existing Vite app, with a server-only proxy
pnpm dev:translation
```

Open `http://127.0.0.1:8443` and choose Translate. Enter Spanish text (1–500 characters); the target is German for this milestone. The Vite server attaches the private bearer token to requests forwarded to localhost:8787. The browser never gets it. Vite binds to loopback, rejects cross-origin proxy requests, and denies HTTP access to `.dev.vars` files. The ordinary `pnpm dev` command and all production builds leave real translation disabled. No VITE_* secret or production proxy is used.

The UI clears results and cancels/invalidates older requests on text edits, new attempts or unmount, times out after 15 seconds, and exposes a retry action for failures. It displays a machine-translation accuracy note. All messages support five interface languages; this does not expand the Spanish → German translation pair.

Validation: 25 automated tests, localization/data audits, frontend/Worker type checks and production build passed. Chrome verified a real UI request (`Quiero aprender alemán.` → `Ich möchte Deutsch lernen.`), no Authorization header from the browser, blocked access to `.dev.vars`, mocked rate-limit/retry and stale responses, length limits, five locales, and working flashcards. The six-fixture evaluation remains in `worker/evaluation/`; this UI check used one additional authored model request.
