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
  return value.translatedText
}

export const translateSpanish = (text: string, signal: AbortSignal, endpoint?: string) => translateText(text, 'es', 'de', signal, endpoint)
