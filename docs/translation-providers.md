# Microsoft and Google translation setup

Both integrations are implemented but disabled until credentials and enablement flags are configured. MyMemory stays the default; existing Cloudflare translation is unchanged. Provider selection never changes the interface language or translation direction.

| Provider | Worker route | Secret | Optional configuration |
| --- | --- | --- | --- |
| Microsoft Translator | `/api/translate/microsoft` | `MICROSOFT_TRANSLATOR_KEY` | `MICROSOFT_TRANSLATOR_REGION`: required for regional/multi-service resources; empty for a global Translator resource |
| Google Cloud Translation Basic v2 | `/api/translate/google` | `GOOGLE_TRANSLATE_KEY` | Uses the standard `nmt` model and plain text |

Requests pass through the same origin checks, 500-character input limit, per-IP limiter and shared limiter as Cloudflare translation. Keys go only in upstream request headers, never browser code, query strings or error messages. No provider automatically retries through another service.

## Accounts and cost controls

- Microsoft: create an Azure Translator resource on the **F0** tier. Its recurring allowance is 2 million characters per subscription month, and translation stops at the free quota. Select this tier explicitly; paid tiers have different billing. [Microsoft FAQ](https://www.microsoft.com/en-us/translator/business/faq/)
- Google: enable Cloud Translation API in a billing-enabled project and create an API key restricted to Cloud Translation API. The standard NMT allowance is 500,000 characters/month, with charges above the allowance. Before activation, lower the daily character quota to fit the budget; the default daily quota is unlimited. For example, 16,000 characters/day is at most 496,000 over a 31-day month, assuming no other usage consumes the billing account's allowance. Budget alerts alone do not stop requests. [Pricing](https://cloud.google.com/products/translate/pricing) · [Quotas](https://cloud.google.com/translate/quotas)
- Sending the same text to several target languages consumes allowance for each target. App rate limits limit request bursts; they are not monthly spending caps.

## Production activation

From the repository root, add the relevant secret through Wrangler's interactive prompt:

```sh
pnpm exec wrangler secret put MICROSOFT_TRANSLATOR_KEY --config worker/wrangler.jsonc --env production
pnpm exec wrangler secret put GOOGLE_TRANSLATE_KEY --config worker/wrangler.jsonc --env production
```

Configure only the provider(s) you intend to enable. Do not paste keys in chat, source files, shell arguments, GitHub variables or `VITE_*` variables.

1. Set `MICROSOFT_ENABLED` and/or `GOOGLE_ENABLED` to `"true"` under `env.production.vars` in `worker/wrangler.jsonc`. For Microsoft, also set the actual resource region if applicable.
2. Deploy the reviewed Worker changes: `pnpm exec wrangler deploy --config worker/wrangler.jsonc --env production`.
3. In GitHub Actions repository variables, set the matching `MICROSOFT_ENABLED` and/or `GOOGLE_ENABLED` to `true`, then rebuild/deploy Pages. These non-secret flags control the switcher and About credits.
4. Verify a short translation from the deployed site, plus quota and error handling, before considering activation complete.

Status (15 November 2026): Google is enabled in production; Microsoft remains disabled pending its key.

Disable the Worker flag and redeploy to stop access. Disable the matching GitHub variable and rebuild Pages to hide the option. A saved unavailable provider falls back to MyMemory.

## Local preview

Follow the private Worker setup in [translation-backend.md](translation-backend.md). Add the selected provider's key to the ignored `worker/.dev.vars` file; never commit it. Microsoft regional resources also need `MICROSOFT_TRANSLATOR_REGION`.

```sh
pnpm worker:dev --var TRANSLATION_ENABLED:true --var MICROSOFT_ENABLED:true --var GOOGLE_ENABLED:true
VITE_MICROSOFT_ENABLED=true VITE_GOOGLE_ENABLED=true pnpm dev:translation
```

Enable only providers whose credentials are available. Frontend flags alone do not enable the Worker or provide credentials. Mocked tests cover both integrations; live service validation requires your accounts.

Official API references: [Microsoft Translate](https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/v3/translate), [Microsoft authentication](https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/authentication), [Google Basic v2](https://cloud.google.com/translate/docs/reference/rest/v2/translate), [Google API-key headers](https://docs.cloud.google.com/docs/authentication/api-keys-use).
