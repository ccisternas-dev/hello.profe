import { useLayoutEffect, useReducer, useRef, useState } from 'react'
import { Button } from './components'
import { useI18n, type MessageKey } from './i18n'
import data from './data/study-decks.json'
import overrides from './data/verb-overrides.json'
import { buildVerbs, forms, finishedField, finishedQuestion, hintDetails, insertCharacter, reduceChallenge, startChallenge, type Challenge, type ChallengeAction, type FieldState, type Form, type Settings } from './verb-challenge'

const verbs = buildVerbs(data.decks.find(d => d.id === 'irregular-verbs')?.cards || [], overrides)
const formLabels: Record<Form, MessageKey> = {
  infinitive: 'Infinitive', present: 'Präsens (er/sie/es)', preterite: 'Präteritum (er/sie/es)', perfect: 'Perfekt (er/sie/es)', participle: 'Partizip II',
}
const modeLabels: Record<Settings['mode'], MessageKey> = { single: 'Single-form mode', complete: 'Complete the verb', mixed: 'Mixed challenge' }
const promptLabels = { en: 'English', es: 'Spanish', fr: 'French' } as const
const initialSettings: Settings = { mode: 'single', form: 'infinitive', language: 'en' }

function AnswerField({ form, field, state, dispatch }: { form: Form; field: FieldState; state: Challenge; dispatch: (action: ChallengeAction) => void }) {
  const { t } = useI18n()
  const input = useRef<HTMLInputElement>(null)
  const pendingCaret = useRef<number | null>(null)
  useLayoutEffect(() => {
    if (pendingCaret.current !== null && input.current) {
      input.current.focus()
      input.current.setSelectionRange(pendingCaret.current, pendingCaret.current)
      pendingCaret.current = null
    }
  })
  const answer = verbs.find(v => v.id === state.verbId)!.forms[form]!
  const hint = hintDetails(answer.canonical)
  const done = finishedField(field)
  const send = (type: 'submit' | 'hint' | 'reveal') => dispatch({ type, form, turn: state.turn })
  const insert = (character: string) => {
    if (!input.current) return
    const edit = insertCharacter(field.value, input.current.selectionStart ?? field.value.length, input.current.selectionEnd ?? field.value.length, character)
    pendingCaret.current = edit.caret
    dispatch({ type: 'edit', form, turn: state.turn, value: edit.value })
  }
  return <form className="challenge-field" onSubmit={e => { e.preventDefault(); send('submit') }} aria-label={t(formLabels[form])}>
    <label htmlFor={`answer-${form}`}>{t(formLabels[form])}</label>
    <input id={`answer-${form}`} ref={input} lang="de" value={field.value} disabled={done} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
      aria-invalid={field.status === 'wrong' || field.status === 'empty'} aria-describedby={`feedback-${form}`}
      onChange={e => dispatch({ type: 'edit', form, turn: state.turn, value: e.target.value })} />
    {!done && <div className="german-keys" role="group" aria-label={t('German characters')}>
      {['ä','ö','ü','ß'].map(character => <button key={character} type="button" lang="de" aria-label={t('Insert {character}', { character })} onPointerDown={e => e.preventDefault()} onClick={() => insert(character)}>{character}</button>)}
    </div>}
    <div id={`feedback-${form}`} role="status" className="challenge-feedback">
      {field.status === 'empty' && <p>{t('Enter an answer before checking.')}</p>}
      {field.status === 'wrong' && <p>{t('Not yet. Try again, use a hint, or reveal the answer.')}</p>}
      {field.status === 'correct' && <p>{t('Correct.')}</p>}
      {field.status === 'revealed' && <p>{t('Answer revealed: no points.')} <span lang="de">{answer.canonical}</span></p>}
      {field.hints >= 1 && <p>{t('First letter: {letter}', { letter: hint.first })}</p>}
      {field.hints >= 2 && <p>{t('Length: {count} letters or digits; spaces and punctuation excluded.', { count: hint.length })}</p>}
    </div>
    {!done && <div className="study-toolbar">
      <Button type="submit">{t('Check answer')}</Button>
      {field.hints < 2 && <Button variant="secondary" onClick={() => send('hint')}>{field.hints === 0 ? t('First letter hint · maximum 1 point') : t('Length hint · 0 points')}</Button>}
      <Button variant="text" onClick={() => send('reveal')}>{t('Reveal answer · 0 points')}</Button>
    </div>}
  </form>
}

function ChallengeSession({ settings, onRestart }: { settings: Settings; onRestart: () => void }) {
  const { t } = useI18n()
  const [state, dispatch] = useReducer((s: Challenge, a: ChallengeAction) => reduceChallenge(s, a, verbs), undefined, () => startChallenge(verbs, settings, Math.random()))
  const verb = verbs.find(v => v.id === state.verbId)
  const promptHeading = useRef<HTMLHeadingElement>(null)
  if (!verb) return <div><p>{t('No eligible verb questions for these settings.')}</p><Button onClick={onRestart}>{t('Change settings')}</Button></div>
  return <section className="challenge-session">
    <div className="study-toolbar"><span>{t(modeLabels[settings.mode])} · {t(promptLabels[settings.language])}</span>
      {!state.ended && <Button variant="secondary" onClick={() => dispatch({ type: 'end' })}>{t('End session')}</Button>}
    </div>
    <p>{t('Score: {score} · Answers completed: {count}', { score: state.score, count: state.answered })}</p>
    {state.ended ? <div className="practice-card study-summary" role="status">
      <h2>{t('Challenge summary')}</h2>
      <p>{t('Unaided correct: {count}', { count: state.unaided })}</p>
      <p>{t('Hinted correct: {count}', { count: state.hinted })}</p>
      <p>{t('Correct after retry: {count} (may include hints)', { count: state.retried })}</p>
      <p>{t('Revealed answers: {count}', { count: state.revealed })}</p>
      <p>{t('Unfinished answers are not scored. Practice points do not measure mastery.')}</p>
      <Button onClick={onRestart}>{t('Change settings and restart')}</Button>
    </div> : <div className="practice-card">
      <p>{t('Translate into German. Use the exact form requested.')}</p>
      <h2 className="challenge-cue" ref={promptHeading} tabIndex={-1} lang={settings.language}>{verb.cues[settings.language]}</h2>
      <p>{t('Question {count}', { count: state.turn + 1 })}</p>
      {forms.filter(form => state.fields[form]).map(form => <AnswerField key={`${state.turn}:${form}`} form={form} field={state.fields[form]!} state={state} dispatch={dispatch} />)}
      <Button disabled={!finishedQuestion(state)} onClick={() => {
        dispatch({ type: 'next', turn: state.turn, random: Math.random() })
        promptHeading.current?.focus()
      }}>{t('Next question')}</Button>
    </div>}
    <p className="small-note">{t('Scoring per answer: 3 unaided, 2 after retry, 1 with a first-letter hint, 0 with length hint or reveal.')}</p>
    <p className="small-note">{t('Missed forms return more often. Two coverage turns alternate with one review turn. Progress lasts for this session only.')}</p>
  </section>
}

export default function VerbChallenge({ path = "translation" }: { path?: "translation" | "complete" }) {
  const { t } = useI18n()
  const completeOnly = path === "complete"
  const [settings, setSettings] = useState<Settings>({ ...initialSettings, mode: completeOnly ? "complete" : "single" })
  const [running, setRunning] = useState(false)
  if (running) return <ChallengeSession settings={settings} onRestart={() => setRunning(false)} />
  return <section className="practice-card challenge-settings">
    <h2>{completeOnly ? t('Complete the Verb') : t('Translation Challenge')}</h2>
    <p>{completeOnly ? t('Choose the prompt language, then complete each supplied form.') : t('Choose a variation and prompt language. Only supplied German verb forms are included.')}</p>
    {!completeOnly && <><label htmlFor="challenge-variation">{t('Challenge variation')}</label>
    <select id="challenge-variation" value={settings.mode} onChange={e => setSettings({ ...settings, mode: e.target.value as Settings['mode'] })}>
      {(['single','mixed'] as const).map(mode => <option key={mode} value={mode}>{t(modeLabels[mode])}</option>)}
    </select></>}
    {settings.mode === 'single' && <><label htmlFor="challenge-form">{t('Target form')}</label>
      <select id="challenge-form" value={settings.form} onChange={e => setSettings({ ...settings, form: e.target.value as Form })}>{forms.map(form => <option key={form} value={form}>{t(formLabels[form])}</option>)}</select></>}
    <label htmlFor="challenge-language">{t('Prompt language')}</label>
    <select id="challenge-language" value={settings.language} onChange={e => setSettings({ ...settings, language: e.target.value as Settings['language'] })}>
      {(['en','es','fr'] as const).map(language => <option key={language} value={language}>{t(promptLabels[language])}</option>)}
    </select>
    <p>{completeOnly ? t('Fill in the supplied German verb forms, one field at a time.') : t('Choose one target form, or mix verbs and forms for a varied challenge.')}</p>
    <Button onClick={() => setRunning(true)}>{t('Start challenge')}</Button>
  </section>
}
