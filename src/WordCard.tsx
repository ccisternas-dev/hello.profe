import { useEffect, useState } from 'react'
import { useI18n, type MessageKey } from './i18n'
import { articles, type LexiconEntry, type WordClass } from './lexicon-core'
import { lookupGerman } from './lexicon'

const classLabels: Record<WordClass, MessageKey> = {
  noun: 'Noun', verb: 'Verb', adj: 'Adjective', adv: 'Adverb', intj: 'Interjection', conj: 'Conjunction', prep: 'Preposition',
  pron: 'Pronoun', det: 'Determiner', article: 'Article', num: 'Number', particle: 'Particle', contraction: 'Contraction',
}

/** Article, word class and plural for a single German word, from Wiktionary data. Renders nothing for phrases or unknown words. */
export default function WordCard({ text }: { text: string }) {
  const { t } = useI18n()
  const [entries, setEntries] = useState<LexiconEntry[]>([])
  useEffect(() => {
    let current = true
    setEntries([])
    lookupGerman(text).then(found => { if (current) setEntries(found) }).catch(() => { /* The card is optional. */ })
    return () => { current = false }
  }, [text])
  if (!entries.length) return null
  return <section className="word-card" aria-label={t('Word details')}>
    <ul>
      {entries.map((entry, index) => <li key={index} className="word-card-entry">
        {entry.g?.map(gender => <span key={gender} lang="de" className={`article-badge article-badge--${gender}`}>{articles[gender]}</span>)}
        <strong lang="de">{entry.w}</strong>
        <span className="word-card-class">{t(classLabels[entry.c])}{entry.g?.includes('p') && <> · {t('Plural only')}</>}</span>
        {entry.pl && <span className="word-card-plural">{t('Plural: {word}', { word: entry.pl })}</span>}
      </li>)}
    </ul>
    <p className="small-note">{t('Word details from Wiktionary (CC BY-SA 4.0).')}</p>
  </section>
}
