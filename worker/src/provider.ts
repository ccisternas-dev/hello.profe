export type TranslationInput = { text: string; source: 'es'; target: 'de' }
export type AiBinding = { run: (model: string, input: Record<string, string>) => Promise<unknown> }
export type Provider = (ai: AiBinding, input: TranslationInput) => Promise<string>
export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string) {
    super(code)
    this.status = status
    this.code = code
  }
}

// All model-specific parameters and response/error interpretation live here.
export const translateM2M100: Provider = async (ai, input) => {
  let output: unknown
  try {
    output = await ai.run('@cf/meta/m2m100-1.2b', {
      text: input.text, source_lang: input.source, target_lang: input.target,
    })
  } catch (error) {
    // Never return/log provider messages: they may contain submitted text.
    const message = error instanceof Error ? error.message : ''
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
    if (/\b3036\b/.test(`${code} ${message}`)) throw new ApiError(429, 'quota_exhausted')
    if (/\b3040\b/.test(`${code} ${message}`)) throw new ApiError(503, 'provider_busy')
    if (/\b(3007|3008)\b/.test(`${code} ${message}`)) throw new ApiError(504, 'provider_timeout')
    throw new ApiError(502, 'provider_unavailable')
  }
  // A request_id alone is not a translation. Confirm this shape with live inference.
  if (!output || typeof output !== 'object' || !('translated_text' in output)
      || typeof output.translated_text !== 'string' || !output.translated_text.trim()
      || output.translated_text.length > 8000) throw new ApiError(502, 'invalid_provider_response')
  return output.translated_text.trim()
}
