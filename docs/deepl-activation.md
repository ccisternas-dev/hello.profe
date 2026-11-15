# DeepL integration — prepared, not activated

Issue #39 remains open. The owner requested preparation only: no DeepL account or secret is available, and no live DeepL translation has been verified.

The browser uses `/api/translate/deepl` on the existing Worker. The Worker calls `https://api-free.deepl.com/v2/translate` with a `DeepL-Auth-Key` header. The key is never a Vite environment variable or client setting. Both translation routes share origin validation, input limits, per-IP throttling and the global request budget. Errors return only safe codes; upstream bodies and keys are not logged.

## Activation after account setup

1. Create a DeepL API Free account and obtain its API key.
2. From this repository, use the interactive secret prompt: `pnpm exec wrangler secret put DEEPL_KEY --config worker/wrangler.jsonc --env production`. Never paste the key into code, chat, a command argument or a Vite variable.
3. Set production `DEEPL_ENABLED` to `"true"` in `worker/wrangler.jsonc`, review and deploy the Worker with `pnpm exec wrangler deploy --config worker/wrangler.jsonc --env production`.
4. Set the GitHub repository Actions variable `DEEPL_ENABLED` to `true`, then rebuild/deploy Pages. The workflow maps it to the non-secret `VITE_DEEPL_ENABLED` feature flag. The provider switcher and About credits will then include DeepL. For local UI testing, set `VITE_DEEPL_ENABLED=true` in the Vite process environment.
5. Verify a translation from the deployed site's origin and confirm origin restrictions, quota messaging and throttling before closing #39.

To disable access, set the Worker's `DEEPL_ENABLED` back to `"false"` and redeploy it. Set the repository variable to `false` and rebuild Pages to hide the option. A previously saved DeepL choice falls back to MyMemory when the option is hidden.

Official references: [authentication](https://developers.deepl.com/docs/getting-started/auth), [translate API](https://developers.deepl.com/api-reference/translate/request-translation), [terms](https://www.deepl.com/en/pro-license).
