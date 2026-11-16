import { useLayoutEffect, useReducer, useRef, useState } from 'react'
import { readChallengePreferences } from './challenge-settings'
import { Button } from './components'
import { useI18n, type MessageKey } from './i18n'
import data from './data/study-decks.json'
import overrides from './data/verb-overrides.json'
import training from './data/b2-verb-training.json'
import { buildVerbs, forms, finishedField, finishedQuestion, insertCharacter, promptLanguageFor, reduceChallenge, startChallenge, type Challenge, type ChallengeAction, type FieldState, type Form, type PromptLanguage, type Settings, type Verb } from './verb-challenge'

const cards = data.decks.find(d => d.id === 'irregular-verbs')?.cards || []
const germanVerbs = cards.length ? buildVerbs(cards, overrides) : []
export const germanFormLabels: Record<Form, MessageKey> = {
  infinitive: 'Infinitive', present: 'Präsens (er/sie/es)', preterite: 'Präteritum (er/sie/es)', perfect: 'Perfekt (er/sie/es)', participle: 'Partizip II',
}
export type TrainingLanguage = 'de' | 'nl' | 'en'
const languageNames = {de: 'German', nl: 'Dutch', en: 'English'} as const
const otherFormLabels: Record<Form, MessageKey> = {
  infinitive: 'Infinitive', present: 'Present (third-person singular)', preterite: 'Past (third-person singular)', perfect: 'Present perfect (third-person singular)', participle: 'Past participle',
}
type Training = {verbs: Verb[]; target: TrainingLanguage; formLabels: Record<Form, MessageKey>}
export const modeLabels: Record<Settings['mode'], MessageKey> = { single: 'Single-form mode', complete: 'Complete the verb', mixed: 'Mixed challenge' }

const formDescriptions: Record<Form, MessageKey> = {
  infinitive: 'Base dictionary form', present: 'Third-person singular present', preterite: 'Third-person singular past', perfect: 'Auxiliary + past participle', participle: 'Past participle alone',
}
const germanCharacters = ['ä', 'ö', 'ü', 'ß']

/** Splits "Präsens (er/sie/es)" into the form name and its quieter qualifier. */
function FormLabel({ text }: { text: string }) {
  const open = text.indexOf(' (')
  if (open < 0) return <>{text}</>
  return <>{text.slice(0, open)} <span className="challenge-field-qualifier">{text.slice(open + 1)}</span></>
}

function AnswerField({ index, form, field, state, dispatch, training, inputRef, onFocus }: { index: number; training: Training; form: Form; field: FieldState; state: Challenge; dispatch: (action: ChallengeAction) => void; inputRef: (node: HTMLInputElement | null) => void; onFocus: () => void }) {
  const { t } = useI18n()
  const {verbs, target, formLabels} = training
  const answer = verbs.find(v => v.id === state.verbId)!.forms[form]!
  const done = finishedField(field)
  const send = (type: 'submit' | 'reveal') => dispatch({ type, form, turn: state.turn })
  return <form className={`challenge-field challenge-field--${field.status}`} onSubmit={e => { e.preventDefault(); send('submit') }} aria-label={t(formLabels[form])}>
    <div className="challenge-field-label">
      <label htmlFor={`answer-${form}`}>{index + 1}. <FormLabel text={t(formLabels[form])} /></label>
      <span className="challenge-field-description">{t(formDescriptions[form])}</span>
    </div>
    <div className="challenge-field-answer">
      <div className="challenge-field-input">
        <input id={`answer-${form}`} ref={inputRef} lang={target} value={field.value} disabled={done} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          aria-invalid={field.status === 'wrong' || field.status === 'empty'} aria-describedby={`feedback-${form}`} onFocus={onFocus}
          onChange={e => dispatch({ type: 'edit', form, turn: state.turn, value: e.target.value })} />
        {!done && <Button type="submit" variant="secondary" icon="check" label={t('Check answer')} className="challenge-check">{t('Check answer')}</Button>}
      </div>
      <div id={`feedback-${form}`} role="status" className="challenge-feedback">
        {field.status === 'empty' && <p>{t('Enter an answer before checking.')}</p>}
        {field.status === 'wrong' && <p>{t('Not yet. Try again or reveal the answer.')}</p>}
        {field.status === 'correct' && <p>{t('Correct.')}</p>}
        {field.status === 'revealed' && <p>{t('Answer revealed: no points.')} <span lang={target}>{answer.canonical}</span></p>}
      </div>
    </div>
    {!done && <div className="challenge-field-actions">
      <Button variant="text" onClick={() => send('reveal')}>{t('Reveal (0 pts)')}</Button>
    </div>}
  </form>
}

function ChallengeSession({ settings, promptLanguage, onRestart, training }: { training: Training; settings: Settings; promptLanguage: PromptLanguage; onRestart: () => void }) {
  const { t } = useI18n()
  const {verbs, target} = training
  const [state, dispatch] = useReducer((s: Challenge, a: ChallengeAction) => reduceChallenge(s, a, verbs), undefined, () => startChallenge(verbs, settings, Math.random()))
  const verb = verbs.find(v => v.id === state.verbId)
  const promptHeading = useRef<HTMLHeadingElement>(null)
  const inputs = useRef<Partial<Record<Form, HTMLInputElement | null>>>({})
  const [activeForm, setActiveForm] = useState<Form | null>(null)
  const pendingCaret = useRef<{ form: Form; caret: number } | null>(null)
  useLayoutEffect(() => {
    const pending = pendingCaret.current
    const input = pending && inputs.current[pending.form]
    if (pending && input) {
      input.focus()
      input.setSelectionRange(pending.caret, pending.caret)
      pendingCaret.current = null
    }
  })
  if (!verb) return <p>{t('No eligible verb questions for these settings.')}</p>
  const shown = forms.filter(form => state.fields[form])
  const open = shown.filter(form => !finishedField(state.fields[form]!))
  // Insert into the field the learner last focused, or the first unfinished one.
  const insertTarget = activeForm && open.includes(activeForm) ? activeForm : open[0]
  const insert = (character: string) => {
    const input = insertTarget && inputs.current[insertTarget]
    if (!insertTarget || !input) return
    const value = state.fields[insertTarget]!.value
    const edit = insertCharacter(value, input.selectionStart ?? value.length, input.selectionEnd ?? value.length, character)
    pendingCaret.current = { form: insertTarget, caret: edit.caret }
    dispatch({ type: 'edit', form: insertTarget, turn: state.turn, value: edit.value })
  }
  return <section className="challenge-session">
    <div className="challenge-status">
      <span>{t('Score: {score} · Answers completed: {count}', { score: state.score, count: state.answered })}</span>
      {!state.ended && <Button variant="text" className="challenge-end" onClick={() => dispatch({ type: 'end' })}>{t('End session')}</Button>}
    </div>
    {state.ended ? <div className="practice-card study-summary" role="status">
      <h2>{t('Challenge summary')}</h2>
      <p>{t('Unaided correct: {count}', { count: state.unaided })}</p>
      <p>{t('Correct after retry: {count}', { count: state.retried })}</p>
      <p>{t('Revealed answers: {count}', { count: state.revealed })}</p>
      <p>{t('Unfinished answers are not scored. Practice points do not measure mastery.')}</p>
      <Button onClick={onRestart}>{t('Start a new challenge')}</Button>
    </div> : <div className="practice-card challenge-card">
      <div className="challenge-prompt">
        <div className="challenge-prompt-meta">
          <span className="eyebrow">{t(modeLabels[settings.mode])} · {t('Question {count}', { count: state.turn + 1 })}</span>
          <span className="challenge-points">{t('Up to {count} points', { count: 3 })}</span>
        </div>
        <h2 className="challenge-cue" ref={promptHeading} tabIndex={-1} lang={verb.cues[promptLanguage] ? promptLanguage : settings.language}>{verb.cues[promptLanguage] || verb.cues[settings.language]}</h2>
        <p className="challenge-instruction">{t('Translate into {language}. Use the exact form requested.', {language: t(languageNames[target])})}</p>
        {target !== 'de' && <p className="small-note">{t('Use the infinitive without “to”; omit the subject in all answers.')}</p>}
      </div>
      {target === 'de' && open.length > 0 && <div className="quick-insert" role="group" aria-label={t('German characters')}>
        <span className="quick-insert-label" aria-hidden="true">{t('Quick insert')}</span>
        <div className="german-keys">
          {germanCharacters.map(character => <Button key={character} variant="secondary" className="german-key" lang={target} label={t('Insert {character}', { character })} onPointerDown={e => e.preventDefault()} onClick={() => insert(character)}>{character}</Button>)}
        </div>
      </div>}
      <div className="challenge-fields">
        {shown.map((form, index) => <AnswerField key={`${state.turn}:${form}`} index={index} training={training} form={form} field={state.fields[form]!} state={state} dispatch={dispatch}
          inputRef={node => { inputs.current[form] = node }} onFocus={() => setActiveForm(form)} />)}
      </div>
      <div className="challenge-footer">
        <p className="small-note">{t('Scoring per answer: 3 unaided, 2 after retry, 0 when revealed.')} {t('Missed forms return more often. Two coverage turns alternate with one review turn. Progress lasts for this session only.')}</p>
        <Button icon="arrow" disabled={!finishedQuestion(state)} onClick={() => {
          dispatch({ type: 'next', turn: state.turn, random: Math.random() })
          setActiveForm(null)
          promptHeading.current?.focus()
        }}>{t('Next question')}</Button>
      </div>
    </div>}
  </section>
}

export default function VerbChallenge({ path = "translation", target = "de" }: { path?: "translation" | "complete"; target?: TrainingLanguage }) {
  const { t, locale } = useI18n()
  const verbs = target === 'de' ? germanVerbs : import.meta.env.DEV ? training[target].verbs : []
  const formLabels = target === 'de' ? germanFormLabels : otherFormLabels
  const activeTraining: Training = {verbs, target, formLabels}
  const promptLanguages: readonly PromptLanguage[] = target === 'en' ? ['es', 'fr'] : ['en', 'es', 'fr']
  const promptLanguage = promptLanguageFor(locale, promptLanguages)
  // Settings are read once per session; the prompt language can follow the interface language mid-session.
  const [settings] = useState<Settings>(() => path === 'complete'
    ? { mode: 'complete', form: 'infinitive', language: promptLanguage }
    : { ...readChallengePreferences(), language: promptLanguage })
  const [run, setRun] = useState(0)
  return <>
    {target !== 'de' && <p className="small-note">{t('Draft content — awaiting owner review.')}</p>}
    <ChallengeSession key={run} training={activeTraining} settings={settings} promptLanguage={promptLanguage} onRestart={() => setRun(run + 1)} />
  </>
}
