import { ApiError, type TranslationInput } from './provider.ts'

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
function output(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 8000) throw new ApiError(502, 'invalid_provider_response')
  return value.trim()
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  let response: Response
  let data: unknown
  try {
    response = await fetch(url, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(9000),
    })
    try { data = await response.json() } catch (error) {
      if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) throw error
      if (response.ok) throw new ApiError(502, 'invalid_provider_response')
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    const timeout = error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)
    throw new ApiError(timeout ? 504 : 502, timeout ? 'provider_timeout' : 'provider_unavailable')
  }
  if (!response.ok) {
    // Read only documented error codes; never forward provider messages or keys.
    const error = record(record(data).error)
    const reasons = Array.isArray(error.errors) ? error.errors.map(item => record(item).reason) : []
    if (Number(error.code) === 403001 || reasons.some(reason => ['dailyLimitExceeded', 'quotaExceeded'].includes(String(reason)))) throw new ApiError(429, 'quota_exhausted')
    if (response.status === 429 || reasons.some(reason => ['rateLimitExceeded', 'userRateLimitExceeded'].includes(String(reason)))) throw new ApiError(429, 'rate_limited')
    throw new ApiError(502, 'provider_unavailable')
  }
  return data
}

export async function translateMicrosoft(key: string, region: string | undefined, input: TranslationInput): Promise<string> {
  const url = new URL('https://api.cognitive.microsofttranslator.com/translate')
  url.searchParams.set('api-version', '3.0')
  url.searchParams.set('from', input.source)
  url.searchParams.set('to', input.target)
  url.searchParams.set('textType', 'plain')
  const headers: Record<string, string> = { 'Ocp-Apim-Subscription-Key': key }
  if (region?.trim()) headers['Ocp-Apim-Subscription-Region'] = region.trim()
  const data = await postJson(url.toString(), headers, [{ Text: input.text }])
  if (!Array.isArray(data) || data.length !== 1) throw new ApiError(502, 'invalid_provider_response')
  const translations = record(data[0]).translations
  if (!Array.isArray(translations) || translations.length !== 1 || record(translations[0]).to !== input.target) throw new ApiError(502, 'invalid_provider_response')
  return output(record(translations[0]).text)
}

// Google Basic can return escaped punctuation even for plain-text requests.
// Decode once and return a string; React renders it as text, never HTML.
function decodeEntities(text: string): string {
  const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, code: string) => {
    if (!code.startsWith('#')) return named[code.toLowerCase()] ?? entity
    const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1))
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : entity
  })
}
export async function translateGoogle(key: string, input: TranslationInput): Promise<string> {
  const data = await postJson('https://translation.googleapis.com/language/translate/v2', { 'x-goog-api-key': key }, {
    q: [input.text], source: input.source, target: input.target, format: 'text', model: 'nmt',
  })
  const translations = record(record(data).data).translations
  if (!Array.isArray(translations) || translations.length !== 1) throw new ApiError(502, 'invalid_provider_response')
  const item = record(translations[0])
  if (item.detectedSourceLanguage !== undefined && item.detectedSourceLanguage !== input.source) throw new ApiError(502, 'invalid_provider_response')
  return output(decodeEntities(output(item.translatedText)))
}
