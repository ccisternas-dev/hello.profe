import { useEffect, useState, type FormEvent } from 'react'
import { useI18n, type MessageKey } from './i18n'
import { Alert, Badge, Button, EmptyState, Icon, SearchField, Skeleton } from './components'
import { articles, audioUrl, type Conjugation, type Declension, type DetailsResult, type LexiconDetails } from './lexicon-core'
import { exploreGerman } from './lexicon'
import { classLabels } from './WordCard'

const persons = ['ich', 'du', 'er / sie / es', 'wir', 'ihr', 'sie / Sie']
const cases: MessageKey[] = ['Nominative', 'Genitive', 'Dative', 'Accusative']
const wiktionary = (word: string) => `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}#German`

function playAudio(path: string) {
  new Audio(audioUrl(path)).play().catch(() => { /* Playback may be blocked or offline. */ })
}

function ConjugationTable({ conj }: { conj: Conjugation }) {
  const { t } = useI18n()
  return <>
    <div className="table-scroll" tabIndex={0} aria-label={t('Scrollable conjugation table')}>
      <table>
        <thead><tr><th>{t('Pronoun')}</th><th>{t('Present')}</th><th>{t('Preterite')}</th></tr></thead>
        <tbody>{persons.map((person, index) => <tr key={person}>
          <td lang="de">{person}</td><td lang="de">{conj.pres[index] || '—'}</td><td lang="de">{conj.pret[index] || '—'}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <dl className="explore-forms">
      {conj.pp && <div><dt>{t('Past participle')}</dt><dd lang="de">{conj.pp}</dd></div>}
      {conj.aux && <div><dt>{t('Auxiliary')}</dt><dd lang="de">{conj.aux}</dd></div>}
      {conj.imp?.some(Boolean) && <div><dt>{t('Imperative')}</dt><dd lang="de">{conj.imp.filter(Boolean).join(', ')}</dd></div>}
    </dl>
  </>
}

function DeclensionTable({ decl }: { decl: Declension }) {
  const { t } = useI18n()
  return <div className="table-scroll" tabIndex={0} aria-label={t('Scrollable declension table')}>
    <table>
      <thead><tr><th>{t('Case')}</th><th>{t('Singular')}</th><th>{t('Plural')}</th></tr></thead>
      <tbody>{cases.map((name, index) => <tr key={name}>
        <td>{t(name)}</td><td lang="de">{decl.sg[index] || '—'}</td><td lang="de">{decl.pl[index] || '—'}</td>
      </tr>)}</tbody>
    </table>
  </div>
}

function EntrySection({ entry }: { entry: LexiconDetails }) {
  const { t } = useI18n()
  return <section className="detail-card explore-entry">
    <header className="explore-entry-heading">
      {entry.g?.map(gender => <span key={gender} lang="de" className={`article-badge article-badge--${gender}`}>{articles[gender]}</span>)}
      <h2 lang="de">{entry.w}</h2>
      <Badge>{t(classLabels[entry.c])}</Badge>
      {entry.pl && <span className="word-card-plural">{t('Plural: {word}', { word: entry.pl })}</span>}
      {entry.g?.includes('p') && <span className="word-card-plural">{t('Plural only')}</span>}
    </header>
    <h3>{t('Meanings (English)')}</h3>
    <ol className="explore-meanings">
      {entry.s.map((meaning, index) => <li key={index}>
        <p lang="en">{meaning.d}</p>
        {meaning.ex && <div className="example"><span>{t('Example')}</span><p lang="de">{meaning.ex[0]}</p><p lang="en">{meaning.ex[1]}</p></div>}
      </li>)}
    </ol>
    {entry.cmp && <dl className="explore-forms">
      <div><dt>{t('Comparative')}</dt><dd lang="de">{entry.cmp[0]}</dd></div>
      <div><dt>{t('Superlative')}</dt><dd lang="de">{entry.cmp[1]}</dd></div>
    </dl>}
    {entry.conj && <><h3>{t('Conjugation')}</h3><ConjugationTable conj={entry.conj} /></>}
    {entry.decl && <><h3>{t('Declension')}</h3><DeclensionTable decl={entry.decl} /></>}
  </section>
}

/** Dictionary entry for a German word from Wiktionary data (#28), kept apart from machine translation. */
export default function ExploreView({ word, onSearch, onBack }: { word: string; onSearch: (word: string) => void; onBack: () => void }) {
  const { t } = useI18n()
  const [query, setQuery] = useState(word)
  const [result, setResult] = useState<DetailsResult | null | undefined>(undefined)
  useEffect(() => {
    let current = true
    setQuery(word)
    setResult(word ? undefined : null)
    if (word) exploreGerman(word).then(found => { if (current) setResult(found) }).catch(() => { if (current) setResult(null) })
    return () => { current = false }
  }, [word])
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (query.trim()) onSearch(query.trim())
  }
  const first = result?.entries[0]
  const sound = result?.entries.find(entry => entry.audio)?.audio
  const ipa = result?.entries.find(entry => entry.ipa)?.ipa

  return <main className="page explore-page">
    <Button variant="text" icon="back" onClick={onBack}>{t('Back to translation')}</Button>
    <form className="explore-search" role="search" onSubmit={submit}>
      <SearchField label={t('Look up a German word')} value={query} onChange={setQuery} placeholder={t('Look up a German word')} />
      <Button type="submit" variant="secondary">{t('Look up')}</Button>
    </form>

    {word && result === undefined && <Skeleton />}
    {!word && <EmptyState icon="book" title={t('Explore a German word')} description={t('Type a German word, or open one from a German translation.')} />}
    {word && result === null && <EmptyState icon="book" title={t('Not in the dictionary yet')}
      description={t('“{word}” is not among the 20,000 most common German words in this dictionary.', { word })}
      action={<a className="button button--secondary" href={wiktionary(word)} target="_blank" rel="noreferrer">{t('Search Wiktionary')}</a>} />}

    {result && first && <>
      <div className="word-hero">
        <div>
          <div className="word-meta"><Badge tone="language">{t('German')}</Badge></div>
          <h1 lang="de">{first.w}</h1>
          {(ipa || sound) && <p className="pronunciation">
            {ipa && <span>{ipa}</span>}
            {sound && <Button variant="icon" icon="audio" label={t('Play pronunciation')} onClick={() => playAudio(sound)} />}
          </p>}
        </div>
      </div>
      {result.formOf && <Alert tone="neutral" title={t('Inflected form')}>
        {t('“{word}” is a form of {lemma}.', { word: result.word, lemma: result.formOf.join(', ') })}
      </Alert>}
      <div className="detail-layout">
        <div className="detail-main">{result.entries.map((entry, index) => <EntrySection key={index} entry={entry} />)}</div>
        <aside className="detail-aside">
          <div className="source-card">
            <Icon name="book" />
            <div>
              <strong>{t('Dictionary facts')}</strong>
              <p>{t('From English Wiktionary via kaikki.org, CC BY-SA 4.0. Separate from machine translation.')}</p>
              <a href={wiktionary(first.w)} target="_blank" rel="noreferrer">{t('View on Wiktionary')}</a>
            </div>
          </div>
        </aside>
      </div>
    </>}
  </main>
}
