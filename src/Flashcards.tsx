import { useRef, useState } from 'react'
import { Button, PageHeader } from './components'
import { useI18n, type MessageKey } from './i18n'
import data from './data/study-decks.json'
import { availableDecks, filterDecks, type StudyDeck } from './deck-catalog'
import VerbFlashcards from './VerbFlashcards'

const decks: StudyDeck[] = availableDecks(data.decks, import.meta.env.PROD)
const languageNames: Record<string, MessageKey> = { de: 'German', en: 'English', es: 'Spanish', fr: 'French', nl: 'Dutch' }
const topicNames: Record<string, MessageKey> = { verbs: 'Irregular verbs', health: 'Health & body', relationships: 'Relationships', grammar: 'Temporal connectors' }

export default function Flashcards() {
  const { t } = useI18n()
  const [filters, setFilters] = useState({language: '', level: '', topic: ''})
  const [selected, setSelected] = useState<StudyDeck | null>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const shown = filterDecks(decks, filters)
  const close = () => { setSelected(null); requestAnimationFrame(() => opener.current?.focus()) }
  return <main className="page flashcards-page">
    <PageHeader eyebrow="" title={t('Flashcards')} description={t('Choose a topic and study at your own pace.')} />
    {selected ? <section aria-label={t('Flashcards')}>
      <Button variant="text" icon="back" onClick={close}>{t('Back to topics')}</Button>
      <h2>{t(selected.title as MessageKey)}</h2>
      {selected.reviewed === false && <p className="small-note">{t('Draft content — awaiting owner review.')}</p>}
      {selected.id === 'irregular-verbs' ? <VerbFlashcards /> : <DeckStudy key={selected.id} deck={selected} />}
    </section> : <>
      <div className="deck-filters">
        <label className="locale-selector"><span>{t('Language')}</span><select value={filters.language} onChange={e=>setFilters({...filters,language:e.target.value})}>
          <option value="">{t('All languages')}</option>
          {[...new Set(decks.map(d=>d.language))].filter(Boolean).map(language=><option key={language} value={language}>{t(languageNames[language!])}</option>)}
        </select></label>
        <label className="locale-selector"><span>{t('Level')}</span><select value={filters.level} onChange={e=>setFilters({...filters,level:e.target.value})}>
          <option value="">{t('All levels')}</option>
          {[...new Set(decks.map(d=>d.level))].filter(Boolean).sort().map(level=><option key={level} value={level}>{level}</option>)}
        </select></label>
        <label className="locale-selector"><span>{t('Topic')}</span><select value={filters.topic} onChange={e=>setFilters({...filters,topic:e.target.value})}>
          <option value="">{t('All topics')}</option>
          {[...new Set(decks.map(d=>d.topic))].filter(Boolean).map(topic=><option key={topic} value={topic}>{t(topicNames[topic!])}</option>)}
        </select></label>
      </div>
      <div className="topic-grid" aria-live="polite">
        {shown.map(deck=><button className="topic-card" key={deck.id} onClick={event=>{opener.current=event.currentTarget;setSelected(deck)}}>
          <span className="eyebrow">{t(languageNames[deck.language!])} · {deck.level}</span>
          <strong>{t(deck.title as MessageKey)}</strong>
          <span>{t('{count} cards', {count:deck.cards.length})}</span>
          {deck.reviewed === false && <span>{t('Draft content — awaiting owner review.')}</span>}
        </button>)}
        {!shown.length && <p role="status">{t('No decks match these filters.')}</p>}
      </div>
    </>}
  </main>
}

export function DeckStudy({deck}: {deck: StudyDeck}) {
  const {t} = useI18n()
  const [index,setIndex] = useState(0)
  const [revealed,setRevealed] = useState(false)
  const card=deck.cards[index]
  if (!card) return <p>{t('No cards available in this deck.')}</p>
  const move=(delta:number)=>{setIndex(index+delta);setRevealed(false)}
  return <div className="verb-flashcards deck-study">
    <article className="verb-reference-card" aria-live="polite" aria-atomic="true">
      <h2 lang={deck.language}>{card.prompt}</h2>
      {!revealed ? <Button onClick={()=>setRevealed(true)}>{t('Reveal answer')}</Button> : <>
        <p className="deck-answer" lang={['gesundheit', 'freundschaft'].includes(deck.id) ? 'en' : deck.language}>{card.answer}</p>
        {card.detail && <p>{card.detail}</p>}
        <dl className="verb-translations">{Object.entries(card.translations).filter(([,value])=>value).map(([language,value])=><div key={language}><dt>{t(languageNames[language])}</dt><dd lang={language}>{value}</dd></div>)}</dl>
      </>}
    </article>
    <nav className="verb-card-navigation" aria-label={t('Flashcards')}>
      <Button variant="secondary" icon="back" disabled={!index} onClick={()=>move(-1)}>{t('Previous card')}</Button>
      <Button icon="arrow" disabled={index===deck.cards.length-1} onClick={()=>move(1)}>{t('Next card')}</Button>
    </nav>
    <p className="verb-card-position">{t('Card {current} of {total}',{current:index+1,total:deck.cards.length})}</p>
  </div>
}
