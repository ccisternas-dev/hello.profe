import { ApiError, type TranslationInput } from './provider.ts'

export async function translateDeepL(key: string, input: TranslationInput): Promise<string> {
  let response: Response
  try {
    response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: { Authorization: `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({text:[input.text],source_lang:input.source.toUpperCase(),target_lang:input.target.toUpperCase()}),
      signal: AbortSignal.timeout(9000),
    })
  } catch (error) {
    throw new ApiError(error instanceof Error && ['TimeoutError','AbortError'].includes(error.name) ? 504 : 502,
      error instanceof Error && ['TimeoutError','AbortError'].includes(error.name) ? 'provider_timeout' : 'provider_unavailable')
  }
  // Never expose upstream messages, submitted text or the API key to clients.
  if (response.status === 456) throw new ApiError(429, 'quota_exhausted')
  if (response.status === 429) throw new ApiError(429, 'rate_limited')
  if (!response.ok) throw new ApiError(502, 'provider_unavailable')
  let data: unknown
  try { data = await response.json() } catch { throw new ApiError(502, 'invalid_provider_response') }
  const translations = (data as {translations?: unknown})?.translations
  if (!Array.isArray(translations) || translations.length !== 1) throw new ApiError(502, 'invalid_provider_response')
  const item = translations[0] as {text?:unknown;detected_source_language?:unknown} | null
  if (!item || typeof item.text !== 'string' || !item.text.trim() || item.text.length > 8000
      || (item.detected_source_language !== undefined && item.detected_source_language !== input.source.toUpperCase())) throw new ApiError(502, 'invalid_provider_response')
  return item.text.trim()
}
