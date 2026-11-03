import { ApiError, translateM2M100, type AiBinding, type Provider, type TranslationInput } from './provider.ts'

type Limiter = { limit: (input: { key: string }) => Promise<{ success: boolean }> }
export type Env = {
  AI: AiBinding
  REQUEST_LIMITER: Limiter
  TRANSLATION_ENABLED: string
  ALLOWED_ORIGINS: string
  POC_TOKEN?: string
}
const MAX_BODY_BYTES = 4096
const MAX_TEXT_CHARACTERS = 500

async function deadline<T>(work: Promise<T>, milliseconds: number, code: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new ApiError(504, code)), milliseconds)
    })])
  } finally { clearTimeout(timer) }
}

async function readInput(request: Request): Promise<TranslationInput> {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') throw new ApiError(415, 'json_required')
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) throw new ApiError(413, 'body_too_large')
  const reader = request.body?.getReader()
  if (!reader) throw new ApiError(400, 'invalid_input')
  const bodyDeadline = Date.now() + 3000
  let size = 0
  let text = ''
  const decoder = new TextDecoder('utf-8', { fatal: true })
  try {
    while (true) {
      const chunk = await deadline(reader.read(), Math.max(1, bodyDeadline - Date.now()), 'body_timeout')
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > MAX_BODY_BYTES) throw new ApiError(413, 'body_too_large')
      text += decoder.decode(chunk.value, { stream: true })
    }
    text += decoder.decode()
    const value: unknown = JSON.parse(text)
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error()
    const v = value as Record<string, unknown>
    if (Object.keys(v).some(key => !['text', 'source', 'target'].includes(key))
        || typeof v.text !== 'string' || !v.text.trim() || [...v.text.trim()].length > MAX_TEXT_CHARACTERS
        || v.source !== 'es' || v.target !== 'de') throw new Error()
    return { text: v.text.trim(), source: 'es', target: 'de' }
  } catch (error) {
    void reader.cancel().catch(() => {})
    if (error instanceof ApiError) throw error
    throw new ApiError(400, 'invalid_input')
  } finally { reader.releaseLock() }
}

export function createHandler(provider: Provider = translateM2M100, timeoutMs = 10000) {
  return async (request: Request, env: Env): Promise<Response> => {
    const origin = request.headers.get('origin')
    const allowed = !!origin && env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).includes(origin)
    const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin' })
    if (allowed) headers.set('Access-Control-Allow-Origin', origin!)
    const respond = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers })
    try {
      if (new URL(request.url).pathname !== '/api/translate') throw new ApiError(404, 'not_found')
      if (origin && !allowed) throw new ApiError(403, 'origin_not_allowed')
      if (request.method === 'OPTIONS') {
        if (!allowed || request.headers.get('access-control-request-method') !== 'POST') throw new ApiError(403, 'origin_not_allowed')
        headers.set('Access-Control-Allow-Methods', 'POST')
        headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return new Response(null, { status: 204, headers })
      }
      if (request.method !== 'POST') { headers.set('Allow', 'POST, OPTIONS'); throw new ApiError(405, 'method_not_allowed') }
      // Private PoC only: no deployment route and no frontend secret. Missing controls fail closed.
      if (env.TRANSLATION_ENABLED !== 'true' || !env.POC_TOKEN || env.POC_TOKEN.length < 32
          || !env.REQUEST_LIMITER || !env.AI) throw new ApiError(503, 'translation_disabled')
      if (request.headers.get('authorization') !== `Bearer ${env.POC_TOKEN}`) throw new ApiError(401, 'unauthorized')
      const { success } = await env.REQUEST_LIMITER.limit({ key: 'private-poc' })
      if (!success) { headers.set('Retry-After', '60'); throw new ApiError(429, 'rate_limited') }
      const input = await readInput(request)
      const translatedText = await deadline(provider(env.AI, input), timeoutMs, 'provider_timeout')
      return respond({ source: input.source, target: input.target, translatedText }, 200)
    } catch (error) {
      const safe = error instanceof ApiError ? error : new ApiError(503, 'service_unavailable')
      return respond({ error: { code: safe.code } }, safe.status)
    }
  }
}
export default { fetch: createHandler() }
