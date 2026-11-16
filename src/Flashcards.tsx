import { useState } from 'react'
import { Button, CardButton, PageHeader } from './components'
import { useI18n, type MessageKey } from './i18n'
import data from './data/study-decks.json'
import { availableDecks, filterDecks, countStudyCards, type StudyDeck } from './deck-catalog'
import VerbFlashcards from './VerbFlashcards'
import FlashcardSession from './FlashcardSession'

const decks: StudyDeck[] = availableDecks(data.decks, import.meta.env.PROD)
const emptyFilters = {language: '', level: '', topic: ''}
const languageNames: Record<string, MessageKey> = { de: 'German', en: 'English', es: 'Spanish', fr: 'French', nl: 'Dutch' }
const topicNames: Record<string, MessageKey> = { verbs: 'Irregular verbs', health: 'Health & body', relationships: 'Relationships', grammar: 'Temporal connectors', 'regular-verbs': 'Regular verbs' }

export default function Flashcards() {
  const { t } = useI18n()
  const [filters, setFilters] = useState(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters)
  const [selected, setSelected] = useState<StudyDeck | null>(null)
  const shown = filterDecks(decks, appliedFilters)
  const close = () => {
    const id = selected?.id
    setSelected(null)
    requestAnimationFrame(() => document.getElementById(`deck-${id}`)?.focus())
  }
  return <main className="page flashcards-page">
    <PageHeader eyebrow="" title={t('Flashcards')} description={t('Choose a topic and study at your own pace.')} />
    {selected ? <FlashcardSession title={t(selected.title as MessageKey)} onClose={close}>
      {selected.reviewed !== true && <p className="small-note">{t('Draft content — awaiting owner review.')}</p>}
      {selected.id === 'irregular-verbs' ? <VerbFlashcards /> : <DeckStudy key={selected.id} deck={selected} />}
    </FlashcardSession> : <>
      <form className="deck-filters" aria-label={t('Flashcard filters')}
        onSubmit={event => { event.preventDefault(); setAppliedFilters({...filters}) }}
        onReset={event => { event.preventDefault(); setFilters(emptyFilters); setAppliedFilters(emptyFilters) }}>
        <p id="flashcard-filter-help" className="filter-help">{t('Choose filters, then select Search to update the results.')}</p>
        <label className="locale-selector"><span id="filter-language-label">{t('Language')}</span><select aria-labelledby="filter-language-label" aria-describedby="flashcard-filter-help" value={filters.language} onChange={e=>setFilters({...filters,language:e.target.value})}>
          <option value="">{t('All languages')}</option>
          {[...new Set(decks.map(d=>d.language))].filter(Boolean).map(language=><option key={language} value={language}>{t(languageNames[language!])}</option>)}
        </select></label>
        <label className="locale-selector"><span id="filter-level-label">{t('Level')}</span><select aria-labelledby="filter-level-label" aria-describedby="flashcard-filter-help" value={filters.level} onChange={e=>setFilters({...filters,level:e.target.value})}>
          <option value="">{t('All levels')}</option>
          {[...new Set(decks.flatMap(d=>d.levels || [d.level]))].filter(Boolean).sort().map(level=><option key={level} value={level}>{level}</option>)}
        </select></label>
        <label className="locale-selector"><span id="filter-topic-label">{t('Topic')}</span><select aria-labelledby="filter-topic-label" aria-describedby="flashcard-filter-help" value={filters.topic} onChange={e=>setFilters({...filters,topic:e.target.value})}>
          <option value="">{t('All topics')}</option>
          {[...new Set(decks.map(d=>d.topic))].filter(Boolean).map(topic=><option key={topic} value={topic}>{t(topicNames[topic!])}</option>)}
        </select></label>
        <div className="filter-actions">
          <Button type="submit" aria-controls="flashcard-results">{t('Search')}</Button>
          <Button type="reset" variant="secondary" aria-controls="flashcard-results">{t('Reset')}</Button>
        </div>
      </form>
      <div id="flashcard-results">
        <p className="filter-results-count" role="status" aria-live="polite" aria-atomic="true">
          {t('Showing {displayed} of {total} decks.', {displayed: shown.length, total: decks.length})}
          {!shown.length && <> {t('No decks match these filters.')}</>}
        </p>
        <div className="topic-grid">
          {shown.map(deck=><CardButton className="topic-card" key={deck.id} id={`deck-${deck.id}`} onClick={()=>setSelected(deck)}>
            <span className="eyebrow">{t(languageNames[deck.language!])} · {deck.levels ? deck.levels.join(' · ') : deck.level}</span>
            <strong>{t(deck.title as MessageKey)}</strong>
            {deck.topic && <span className="badge badge--language topic-pill"><span className="sr-only">{t('Topic')}: </span>{t(topicNames[deck.topic])}</span>}
            <span>{t('{count} cards', {count:countStudyCards(deck)})}</span>
            {deck.reviewed !== true && <span>{t('Draft content — awaiting owner review.')}</span>}
          </CardButton>)}
        </div>
      </div>
    </>}
  </main>
}

export function DeckStudy({deck}: {deck: StudyDeck}) {
  const {t} = useI18n()
  const [index,setIndex] = useState(0)
  const card=deck.cards[index]
  if (!card) return <p>{t('No cards available in this deck.')}</p>
  const move=(delta:number)=>setIndex(index+delta)
  return <div className="verb-flashcards deck-study">
    <article className="verb-reference-card" aria-live="polite" aria-atomic="true">
      <h2 lang={deck.language}>{card.prompt}</h2>
        <p className="deck-answer" lang={['gesundheit', 'freundschaft'].includes(deck.id) ? 'en' : deck.language}>{card.answer}</p>
        {card.detail && <p lang={deck.language}>{card.detail}</p>}
        <dl className="verb-translations">{Object.entries(card.translations).filter(([,value])=>value).map(([language,value])=><div key={language}><dt>{t(languageNames[language])}</dt><dd lang={language}>{value}</dd></div>)}</dl>
    </article>
    <nav className="verb-card-navigation" aria-label={t('Flashcards')}>
      <Button variant="secondary" icon="back" disabled={!index} onClick={()=>move(-1)}>{t('Previous card')}</Button>
      <Button icon="arrow" disabled={index===deck.cards.length-1} onClick={()=>move(1)}>{t('Next card')}</Button>
    </nav>
    <p className="verb-card-position">{t('Card {current} of {total}',{current:index+1,total:deck.cards.length})}</p>
  </div>
}
