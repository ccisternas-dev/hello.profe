import { useReducer, useState } from 'react'
import { Button, Badge, Progress } from './components'
import data from './data/study-decks.json'
import { sessionReducer, shuffle, startSession } from './study-session'

type Card = {
  id: string; deckId: string; prompt: string; answer: string; detail: string
  translations: { en?: string; es?: string; fr?: string }
  source: { file: string; sheet: string; row: number }
}
type Deck = { id: string; title: string; cards: Card[] }
const decks: Deck[] = data.decks

function DeckSession({ deck }: { deck: Deck }) {
  const [session, dispatch] = useReducer(sessionReducer, deck.cards.map(c => c.id), startSession)
  const [round, setRound] = useState(1)
  const card = deck.cards.find(c => c.id === session.order[session.index])
  const rated = Object.keys(session.ratings).length
  const again = session.order.filter(id => session.ratings[id] === 'again')
  const complete = session.order.length > 0 && rated === session.order.length
  const restart = (random: boolean) => {
    dispatch({ type: 'start', order: random ? shuffle(deck.cards.map(c => c.id)) : deck.cards.map(c => c.id) })
    setRound(1)
  }
  if (!card) return <p>No cards available in this deck.</p>
  return <>
    <div className="study-toolbar">
      <Button variant="secondary" onClick={() => restart(true)}>Shuffle & restart</Button>
      <Button variant="text" onClick={() => restart(false)}>Restart</Button>
    </div>
    <div className="practice-layout">
      <section className="practice-card study-card" aria-label="Flashcard">
        <div className="progress-header"><span>Round {round}</span><span>{rated} of {session.order.length} assessed</span></div>
        <Progress value={rated / session.order.length * 100} />
        {complete ? <div className="study-summary" role="status">
          <h2>Round complete</h2>
          <p>Remembered: {rated - again.length} · Again: {again.length}</p>
          <p>These are your self-assessments, not a test score.</p>
          {again.length > 0 && <Button onClick={() => {
            dispatch({ type: 'start', order: again }); setRound(round + 1)
          }}>Review {again.length} Again cards</Button>}
          <Button variant="secondary" onClick={() => restart(false)}>Start a new session</Button>
        </div> : <>
          <div className="prompt" aria-live="polite">
            <Badge>Card {session.index + 1} of {session.order.length}</Badge>
            <h2 lang="de">{card.prompt}</h2>
            <p>Think of your answer, then reveal it.</p>
          </div>
          {!session.revealed ? <Button onClick={() => dispatch({ type: 'reveal' })}>Reveal answer</Button> :
            <div className="study-answer" aria-live="polite">
              <h3>Answer</h3><p className="study-answer-text">{card.answer}</p>
              {Object.entries(card.translations).filter(([, value]) => value).map(([lang, value]) =>
                <p key={lang}><strong>{({ en: 'English', es: 'Español', fr: 'Français' })[lang as 'en' | 'es' | 'fr']}:</strong> <span lang={lang}>{value}</span></p>)}
              {card.detail && <p className="study-detail">{card.detail}</p>}
              <div className="study-toolbar">
                <Button disabled={!!session.ratings[card.id]} variant="secondary" onClick={() => dispatch({ type: 'rate', id: card.id, value: 'again' })}>Again</Button>
                <Button disabled={!!session.ratings[card.id]} onClick={() => dispatch({ type: 'rate', id: card.id, value: 'remembered' })}>Remembered</Button>
              </div>
              {session.ratings[card.id] && <p role="status">Recorded: {session.ratings[card.id]}. Choose Next to continue.</p>}
            </div>}
          <div className="practice-actions">
            <Button variant="secondary" disabled={session.index === 0} onClick={() => dispatch({ type: 'move', delta: -1 })}>Previous</Button>
            <Button variant="secondary" disabled={session.index === session.order.length - 1} onClick={() => dispatch({ type: 'move', delta: 1 })}>Next</Button>
          </div>
        </>}
      </section>
      <aside className="session-card">
        <h2>Your study session</h2>
        <p>Recall the answer before revealing it. Mark difficult cards Again and review them at the end.</p>
        <p>Assess every card to finish the round. You can navigate back to skipped cards.</p>
        <p>Progress lasts until you leave this screen or reload. No account needed.</p>
        <p>Content comes from your B2 spreadsheets. Language accuracy has not been independently reviewed.</p>
      </aside>
    </div>
  </>
}

export default function StudyPractice() {
  const [deckId, setDeckId] = useState(decks[0]?.id)
  const deck = decks.find(d => d.id === deckId)
  return <main className="page practice-page">
    <div className="page-header"><div><span className="eyebrow">German · B2</span><h1>A little practice, every day.</h1>
      <p>Choose a deck, recall the answer, and revisit what needs practice.</p></div></div>
    <label className="study-deck-label" htmlFor="study-deck">Study deck</label>
    <select className="study-deck-select" id="study-deck" value={deckId} onChange={e => setDeckId(e.target.value)}>
      {decks.map(d => <option key={d.id} value={d.id}>{d.title} · {d.cards.length} cards</option>)}
    </select>
    {deck ? <DeckSession key={deck.id} deck={deck} /> : <p>No study decks available.</p>}
  </main>
}
