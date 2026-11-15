export type TranslationLanguage = 'es' | 'en' | 'nl' | 'de' | 'fr'

export async function translateText(text: string, source: TranslationLanguage, target: TranslationLanguage, signal: AbortSignal, endpoint = '/api/translate'): Promise<string> {
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source, target }), signal,
  })
  let data: unknown
  try { data = await response.json() } catch { throw new Error('service_unavailable') }
  if (!response.ok) {
    const code = (data as { error?: { code?: unknown } })?.error?.code
    throw new Error(typeof code === 'string' ? code : 'service_unavailable')
  }
  const value = data as { source?: unknown; target?: unknown; translatedText?: unknown }
  if (value?.source !== source || value?.target !== target || typeof value.translatedText !== 'string' || !value.translatedText.trim()) throw new Error('invalid_provider_response')
  return validateOutput(value.translatedText)
}

export const translateSpanish = (text: string, signal: AbortSignal, endpoint?: string) => translateText(text, 'es', 'de', signal, endpoint)

export type TranslationProvider = 'mymemory' | 'cloudflare' | 'deepl'
export const defaultProvider: TranslationProvider = 'mymemory'
export const providerStorageKey = 'hello-profe-translation-provider'
export const emailStorageKey = 'hello-profe-mymemory-email'
export const isTranslationProvider = (value: unknown): value is TranslationProvider => value === 'mymemory' || value === 'cloudflare' || value === 'deepl'
export const inputBytes = (text: string) => new TextEncoder().encode(text.trim()).length

export function readPreference(key: string): string {
  try { return localStorage.getItem(key) || '' } catch { return '' }
}
export function savePreference(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* In-memory choices still work. */ }
}
export function savedProvider(): TranslationProvider {
  const value = readPreference(providerStorageKey)
  return isTranslationProvider(value) ? value : defaultProvider
}

export async function translateWithProvider(text: string, source: TranslationLanguage, target: TranslationLanguage, signal: AbortSignal, options: { provider?: TranslationProvider; endpoint?: string; email?: string } = {}): Promise<string> {
  if (options.provider === 'deepl') return translateText(text, source, target, signal, `${(options.endpoint || '/api/translate').replace(/\/$/, '')}/deepl`)
  if ((options.provider ?? defaultProvider) === 'cloudflare') return translateText(text, source, target, signal, options.endpoint)
  if (!text.trim() || inputBytes(text) > 500) throw new Error('input_too_long_bytes')
  const url = new URL('https://api.mymemory.translated.net/get')
  url.searchParams.set('q', text.trim())
  url.searchParams.set('langpair', `${source}|${target}`)
  if (options.email?.trim()) url.searchParams.set('de', options.email.trim())
  const response = await fetch(url.toString(), { signal })
  let data: unknown
  try { data = await response.json() } catch { throw new Error('service_unavailable') }
  if (!data || typeof data !== 'object') throw new Error('invalid_provider_response')
  const value = data as { responseStatus?: unknown; quotaFinished?: unknown; responseDetails?: unknown; responseData?: { translatedText?: unknown } }
  const output = value.responseData?.translatedText
  const details = typeof value.responseDetails === 'string' ? value.responseDetails : ''
  if (value.quotaFinished === true || Number(value.responseStatus) === 429 || response.status === 429
      || /MYMEMORY WARNING|USED ALL AVAILABLE FREE TRANSLATIONS|DAILY (?:FREE )?(?:LIMIT|QUOTA)/i.test(`${details} ${typeof output === 'string' ? output : ''}`)) throw new Error('quota_exhausted')
  if (!response.ok || Number(value.responseStatus) !== 200) throw new Error('service_unavailable')
  return validateOutput(output)
}

function validateOutput(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 8000) throw new Error('invalid_provider_response')
  return value.trim()
}
