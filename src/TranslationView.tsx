import { useEffect, useRef, useState } from 'react'
import { Badge, Button, PageHeader } from './components'
import { useI18n, type MessageKey } from './i18n'
import { translateSpanish } from './translation-client'

const errors: Record<string, MessageKey> = {
  quota_exhausted: 'The free translation allowance is exhausted. Try again tomorrow.',
  rate_limited: 'Too many requests. Wait a minute before trying again.',
  provider_timeout: 'Translation timed out. Please try again.',
  invalid_input: 'Enter between 1 and 500 characters.',
}
export default function TranslationView() {
  const { t } = useI18n()
  const enabled = import.meta.env.VITE_TRANSLATION_ENABLED === true
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState<MessageKey | null>(null)
  const [loading, setLoading] = useState(false)
  const current = useRef(0)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => { current.current++; controller.current?.abort() }, [])
  const count = [...text.trim()].length
  const translate = async () => {
    if (!enabled || count < 1 || count > 500) return
    const id = ++current.current
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setLoading(true); setError(null); setResult('')
    let timedOut = false
    const timer = setTimeout(() => { timedOut = true; request.abort() }, 15000)
    try {
      const translated = await translateSpanish(text, request.signal, import.meta.env.VITE_TRANSLATION_API_URL || "/api/translate")
      if (id === current.current) setResult(translated)
    } catch (failure) {
      if (id === current.current) setError(timedOut ? errors.provider_timeout : errors[failure instanceof Error ? failure.message : ''] || 'Translation is unavailable. Please try again later.')
    } finally {
      clearTimeout(timer)
      if (id === current.current) setLoading(false)
    }
  }
  return <main className="page translate-page">
    <PageHeader eyebrow={t('Translate')} title={t('What would you like to say?')} description={t('Spanish to German · translation preview')} />
    {!enabled && <p role="note" className="prototype-notice">{t('Real translation is not enabled on this website yet.')}</p>}
    <section className="translator" aria-label={t('Text to translate')}>
      <div className="translator-controls"><Badge>{t('Spanish')}</Badge><span aria-hidden="true">→</span><Badge>{t('German')}</Badge></div>
      <div className="translation-input">
        <label htmlFor="translation-text">{t('Text to translate')}</label>
        <textarea id="translation-text" lang="es" value={text} maxLength={1000} placeholder={t('Type or paste text here…')}
          onChange={event => { current.current++; controller.current?.abort(); setText(event.target.value); setResult(''); setError(null); setLoading(false) }} />
        <div className="input-footer"><span>{t('{count} / {total}', { count, total: 500 })}</span>
          <Button onClick={translate} loading={loading} disabled={!enabled || loading || count < 1 || count > 500}>{t('Translate')}</Button>
        </div>
        {count > 500 && <p role="alert">{t('Enter between 1 and 500 characters.')}</p>}
      </div>
    </section>
    <section aria-live="polite" aria-busy={loading}>
      {loading && <p>{t('Loading translations')}</p>}
      {error && <div className="result-card"><p role="alert">{t(error)}</p><Button variant="secondary" onClick={translate}>{t('Retry translation')}</Button></div>}
      {result && <article className="result-card"><Badge>{t('German')}</Badge><p lang="de" className="translation-result">{result}</p><p className="small-note">{t('Machine translation may contain mistakes, including changed names. Verify important details.')}</p></article>}
    </section>
  </main>
}
