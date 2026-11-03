export async function translateSpanish(text: string, signal: AbortSignal, endpoint = '/api/translate'): Promise<string> {
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source: 'es', target: 'de' }), signal,
  })
  let data: unknown
  try { data = await response.json() } catch { throw new Error('service_unavailable') }
  if (!response.ok) {
    const code = (data as { error?: { code?: unknown } })?.error?.code
    throw new Error(typeof code === 'string' ? code : 'service_unavailable')
  }
  const value = data as { source?: unknown; target?: unknown; translatedText?: unknown }
  if (value?.source !== 'es' || value?.target !== 'de' || typeof value.translatedText !== 'string' || !value.translatedText.trim()) throw new Error('invalid_provider_response')
  return value.translatedText
}
