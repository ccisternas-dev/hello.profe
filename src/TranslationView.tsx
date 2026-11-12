import { useEffect, useRef, useState } from 'react'
import { Badge, Button, PageHeader } from './components'
import { useI18n, type MessageKey } from './i18n'
import { translateText, type TranslationLanguage } from './translation-client'

const languages: { code: TranslationLanguage; label: MessageKey }[] = [
  { code: 'es', label: 'Spanish' }, { code: 'en', label: 'English' },
  { code: 'nl', label: 'Dutch' }, { code: 'de', label: 'German' }, { code: 'fr', label: 'French' },
]
type TranslationResult = { target: TranslationLanguage; text?: string; error?: MessageKey }

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
  const [source, setSource] = useState<TranslationLanguage>('es')
  const [targets, setTargets] = useState<TranslationLanguage[]>(['de'])
  const [results, setResults] = useState<TranslationResult[]>([])
  const [loading, setLoading] = useState(false)
  const current = useRef(0)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => { current.current++; controller.current?.abort() }, [])
  const count = [...text.trim()].length
  const reset = () => {
    current.current++; controller.current?.abort(); setResults([]); setLoading(false)
  }
  const translate = async () => {
    if (!enabled || count < 1 || count > 500 || !targets.length) return
    const id = ++current.current
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setLoading(true); setResults([])
    let timedOut = false
    const timer = setTimeout(() => { timedOut = true; request.abort() }, 15000)
    await Promise.allSettled(targets.map(async target => {
      let result: TranslationResult
      try {
        const translated = await translateText(text, source, target, request.signal, import.meta.env.VITE_TRANSLATION_API_URL || '/api/translate')
        result = { target, text: translated }
      } catch (failure) {
        result = { target, error: timedOut ? errors.provider_timeout : errors[failure instanceof Error ? failure.message : ''] || 'Translation is unavailable. Please try again later.' }
      }
      if (id === current.current) setResults(previous => [...previous, result])
    }))
    clearTimeout(timer)
    if (id === current.current) setLoading(false)
  }

  return <main className="page translate-page">
    <PageHeader eyebrow={t('Translate')} title={t('What would you like to say?')} description={t('Translate into up to four languages at once.')} />
    {!enabled && <p role="note" className="prototype-notice">{t('Real translation is not enabled on this website yet.')}</p>}
    <section className="translator" aria-label={t('Text to translate')}>
      <div className="translator-controls">
        <label className="language-select"><span className="field-label">{t('From')}</span>
          <select value={source} onChange={event => {
            const next = event.target.value as TranslationLanguage
            reset(); setSource(next); setTargets(previous => previous.filter(target => target !== next))
          }}>{languages.map(language => <option key={language.code} value={language.code}>{t(language.label)}</option>)}</select>
        </label>
        <span aria-hidden="true">→</span>
        <div className="target-control" role="group" aria-label={t('Translate to')}>
          <span className="field-label">{t('Translate to')}</span>
          <div className="target-chips">{languages.filter(language => language.code !== source).map(language =>
            <button key={language.code} type="button" className={`chip${targets.includes(language.code) ? ' selected' : ''}`} aria-pressed={targets.includes(language.code)} onClick={() => {
              reset(); setTargets(previous => previous.includes(language.code) ? previous.filter(target => target !== language.code) : [...previous, language.code])
            }}>{t(language.label)}</button>
          )}</div>
        </div>
      </div>
      <div className="translation-input">
        <label htmlFor="translation-text">{t('Text to translate')}</label>
        <textarea id="translation-text" lang={source} value={text} maxLength={1000} placeholder={t('Type or paste text here…')}
          onChange={event => { reset(); setText(event.target.value) }} />
        <div className="input-footer"><span>{t('{count} / {total}', { count, total: 500 })}</span>
          <Button onClick={translate} loading={loading} disabled={!enabled || loading || count < 1 || count > 500 || !targets.length}>{t('Translate')}</Button>
        </div>
        {count > 500 && <p role="alert">{t('Enter between 1 and 500 characters.')}</p>}
      </div>
    </section>
    <section aria-live="polite" aria-busy={loading}>
      {loading && <p>{t('Loading translations')}</p>}
      {!targets.length && <p>{t('Choose at least one target language.')}</p>}
      {targets.map(target => {
        const result = results.find(item => item.target === target)
        return result && <article key={target} className="result-card">
          <Badge>{t(languages.find(language => language.code === target)!.label)}</Badge>
          {result.error ? <><p role="alert">{t(result.error)}</p><Button variant="secondary" disabled={loading} onClick={translate}>{t('Retry translation')}</Button></>
            : <><p lang={target} className="translation-result">{result.text}</p><p className="small-note">{t('Machine translation may contain mistakes, including changed names. Verify important details.')}</p></>}
        </article>
      })}
    </section>
  </main>
}
