import VerbChallenge from "./VerbChallenge"
import LearningDashboard, { learningPathTitles, type LearningPath } from "./LearningDashboard"
import { useI18n, type MessageKey } from "./i18n"
import { useEffect, useRef, useReducer, useState } from "react"
import { Button, Badge, Progress } from "./components"
import data from "./data/study-decks.json"
import { sessionReducer, shuffle, startSession } from "./study-session"

type Card = {
  id: string
  deckId: string
  prompt: string
  answer: string
  detail: string
  translations: {
    en?: string
    es?: string
    fr?: string
  }
  source: {
    file: string
    sheet: string
    row: number
  }
}
type Deck = {
  id: string
  title: string
  cards: Card[]
}
const decks: Deck[] = data.decks

export const deckMessages: Record<string, {
  title: MessageKey
  instruction?: MessageKey
}> = {
  "irregular-verbs": { title: "Irregular verbs" },
  gesundheit: { title: "Health & body" },
  freundschaft: { title: "Friendship & conflict" },
  "temporal-connectors": { title: "Temporal connectors" },
  "temporal-exercise-1": {
    title: "Exercise 1 — Choose a conjunction",
    instruction: "Choose the appropriate temporal conjunction.",
  },
  "temporal-exercise-2": {
    title: "Exercise 2 — Nachdem and verb tense",
    instruction:
      "Use the correct tense after nachdem, with the verb at the end.",
  },
  "temporal-exercise-3": {
    title: "Exercise 3 — Adverbs in main clauses",
    instruction: "Choose a temporal adverb; keep the verb in second position.",
  },
  "temporal-exercise-4": {
    title: "Exercise 4 — Connect sentences",
    instruction: "Connect the sentences using the conjunction in brackets.",
  },
  "temporal-exercise-5": {
    title: "Exercise 5 — Find and correct errors",
    instruction: "Correct the conjunction, word order or tense error.",
  },
}

function DeckSession({ deck }: { deck: Deck }) {
  const { t, plural } = useI18n()

  const [session, dispatch] = useReducer(
    sessionReducer,
    deck.cards.map((c) => c.id),
    startSession,
  )
  const [round, setRound] = useState(1)
  const card = deck.cards.find((c) => c.id === session.order[session.index])
  const rated = Object.keys(session.ratings).length
  const again = session.order.filter((id) => session.ratings[id] === "again")
  const complete = session.order.length > 0 && rated === session.order.length
  const restart = (random: boolean) => {
    dispatch({
      type: "start",
      order: random
        ? shuffle(deck.cards.map((c) => c.id))
        : deck.cards.map((c) => c.id),
    })
    setRound(1)
  }
  if (!card) return <p>{t("No cards available in this deck.")}</p>
  return (
    <>
      <div className="study-toolbar">
        <Button variant="secondary" onClick={() => restart(true)}>
          {t("Shuffle & restart")}
        </Button>
        <Button variant="text" onClick={() => restart(false)}>
          {t("Restart")}
        </Button>
      </div>
      <div className="practice-layout">
        <section
          className="practice-card study-card"
          aria-label={t("Flashcard")}
        >
          <div className="progress-header">
            <span>{t("Round {round}", { round })}</span>
            <span>
              {t("{count} of {total} assessed", {
                count: rated,
                total: session.order.length,
              })}
            </span>
          </div>
          <Progress value={(rated / session.order.length) * 100} />
          {complete ? (
            <div className="study-summary" role="status">
              <h2>{t("Round complete")}</h2>
              <p>
                {t("Remembered: {remembered} · Again: {again}", {
                  remembered: rated - again.length,
                  again: again.length,
                })}
              </p>
              <p>{t("These are your self-assessments, not a test score.")}</p>
              {again.length > 0 && (
                <Button
                  onClick={() => {
                    dispatch({ type: "start", order: again })
                    setRound(round + 1)
                  }}
                >
                  {plural(
                    "Review {count} Again card",
                    "Review {count} Again cards",
                    again.length,
                  )}
                </Button>
              )}
              <Button variant="secondary" onClick={() => restart(false)}>
                {t("Start a new session")}
              </Button>
            </div>
          ) : (
            <>
              <div className="prompt" aria-live="polite">
                <Badge>
                  {t("Card {current} of {total}", {
                    current: session.index + 1,
                    total: session.order.length,
                  })}
                </Badge>
                {deckMessages[deck.id].instruction && (
                  <p>{t(deckMessages[deck.id].instruction!)}</p>
                )}
                <h2 lang="de">{card.prompt}</h2>
                <p>{t("Think of your answer, then reveal it.")}</p>
              </div>
              {!session.revealed ? (
                <Button onClick={() => dispatch({ type: "reveal" })}>
                  {t("Reveal answer")}
                </Button>
              ) : (
                <div className="study-answer" aria-live="polite">
                  <h3>{t("Answer")}</h3>
                  <p
                    className="study-answer-text"
                    lang={
                      deck.id === "gesundheit" || deck.id === "freundschaft"
                        ? "en"
                        : "de"
                    }
                  >
                    {card.answer}
                  </p>
                  {Object.entries(card.translations)
                    .filter(([, value]) => value)
                    .map(([lang, value]) => (
                      <p key={lang}>
                        <strong>
                          {t(
                            ({
                              en: "English",
                              es: "Spanish",
                              fr: "French",
                            } as const)[(lang as "en" | "es" | "fr")],
                          )}
                          :
                        </strong>{" "}
                        <span lang={lang}>{value}</span>
                      </p>
                    ))}
                  {card.detail && (
                    <p
                      className="study-detail"
                      lang={
                        deck.id === "temporal-exercise-4" ||
                        deck.id === "temporal-exercise-5"
                          ? undefined
                          : "de"
                      }
                    >
                      {deck.id === "temporal-exercise-4" ||
                      deck.id === "temporal-exercise-5"
                        ? t("Model answer; other formulations may be valid.")
                        : card.detail}
                    </p>
                  )}
                  <div className="study-toolbar">
                    <Button
                      disabled={!!session.ratings[card.id]}
                      variant="secondary"
                      onClick={() =>
                        dispatch({ type: "rate", id: card.id, value: "again" })
                      }
                    >
                      {t("Again")}
                    </Button>
                    <Button
                      disabled={!!session.ratings[card.id]}
                      onClick={() =>
                        dispatch({
                          type: "rate",
                          id: card.id,
                          value: "remembered",
                        })
                      }
                    >
                      {t("Remembered")}
                    </Button>
                  </div>
                  {session.ratings[card.id] && (
                    <p role="status">
                      {session.ratings[card.id] === "again"
                        ? t("Recorded: Again. Choose Next to continue.")
                        : t("Recorded: Remembered. Choose Next to continue.")}
                    </p>
                  )}
                </div>
              )}
              <div className="practice-actions">
                <Button
                  variant="secondary"
                  disabled={session.index === 0}
                  onClick={() => dispatch({ type: "move", delta: -1 })}
                >
                  {t("Previous")}
                </Button>
                <Button
                  variant="secondary"
                  disabled={session.index === session.order.length - 1}
                  onClick={() => dispatch({ type: "move", delta: 1 })}
                >
                  {t("Next")}
                </Button>
              </div>
            </>
          )}
        </section>
        <aside className="session-card">
          <h2>{t("Your study session")}</h2>
          <p>
            {t(
              "Recall the answer before revealing it. Mark difficult cards Again and review them at the end.",
            )}
          </p>
          <p>
            {t(
              "Assess every card to finish the round. You can navigate back to skipped cards.",
            )}
          </p>
          <p>
            {t(
              "Progress lasts until you leave this screen or reload. No account needed.",
            )}
          </p>
          <p>
            {t(
              "Content comes from your B2 spreadsheets. Language accuracy has not been independently reviewed.",
            )}
          </p>
        </aside>
      </div>
    </>
  )
}

export default function StudyPractice() {
  const { t, plural } = useI18n()

  const [mode, setMode] = useState<LearningPath | null>(null)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    document.getElementById(mode ? "learning-content" : "learning-modes-title")?.focus()
  }, [mode])
  const [deckId, setDeckId] = useState(decks[0]?.id)
  const deck = decks.find((d) => d.id === deckId)
  return (
    <main className="page practice-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">{t("German · B2")}</span>
          <h1>{t("Your learning dashboard")}</h1>
          <p>
            {t(
              "Choose a path and practice at your own pace.",
            )}
          </p>
        </div>
      </div>
      {mode === null ? <LearningDashboard onSelect={setMode} /> : <>
        <div className="learning-path-toolbar">
          <Button variant="text" icon="back" onClick={() => setMode(null)}>{t("Back to learning modes")}</Button>
          <p className="small-note">{t("Returning to learning modes or leaving this screen resets the current session.")}</p>
        </div>
        <section id="learning-content" tabIndex={-1} aria-label={t(learningPathTitles[mode])}>
          {mode !== "flashcards" ? <VerbChallenge key={mode} path={mode === "complete" ? "complete" : "translation"} /> : <>
      <label className="study-deck-label" htmlFor="study-deck">
        {t("Study deck")}
      </label>
      <select
        className="study-deck-select"
        id="study-deck"
        value={deckId}
        onChange={(e) => setDeckId(e.target.value)}
      >
        {decks.map((d) => (
          <option key={d.id} value={d.id}>
            {plural(
              "{deck} · {count} card",
              "{deck} · {count} cards",
              d.cards.length,
              { deck: t(deckMessages[d.id].title) },
            )}
          </option>
        ))}
      </select>
      {deck ? (
        <DeckSession key={deck.id} deck={deck} />
      ) : (
        <p>{t("No study decks available.")}</p>
      )}
          </>}
        </section>
      </>}
    </main>
  )
}
