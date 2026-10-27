export const forms = ['infinitive', 'present', 'preterite', 'perfect', 'participle'] as const
export type Form = typeof forms[number]
export type PromptLanguage = 'en' | 'es' | 'fr' | 'nl' | 'de'
export type Settings = { mode: 'single' | 'complete' | 'mixed'; form: Form; language: PromptLanguage }
export type Answer = { canonical: string; alternatives: string[] }
export type Verb = { id: string; cues: Partial<Record<PromptLanguage, string>>; forms: Partial<Record<Form, Answer>> }
type Card = { prompt: string; answer: string; translations: Partial<Record<PromptLanguage, string>> }
type Overrides = { sourceAnswers?: Record<string, string>; answers: Record<string, string[]>; cues: Record<string, Partial<Record<PromptLanguage, string>>> }
const labels: Record<string, Form> = { 'Präsens (er/sie/es)': 'present', 'Präteritum (er/sie/es)': 'preterite', 'Perfekt (er/sie/es)': 'perfect', 'Partizip II': 'participle' }

export function buildVerbs(cards: Card[], overrides: Overrides): Verb[] {
  const verbs = new Map<string, Verb>()
  const used = new Set<string>()
  for (const card of cards) {
    const [lemma, label, extra] = card.prompt.split(' — ')
    const form = labels[label]
    if (!lemma || !form || extra) throw new Error(`Invalid verb prompt: ${card.prompt}`)
    if (!verbs.has(lemma)) verbs.set(lemma, { id: lemma.normalize('NFC'), cues: { ...card.translations, ...overrides.cues[lemma] }, forms: { infinitive: { canonical: lemma, alternatives: [] } } })
    const verb = verbs.get(lemma)!
    if (verb.forms[form]) throw new Error(`Duplicate verb form: ${lemma}:${form}`)
    if (!card.answer.trim() || card.answer === '—') continue
    const key = `${lemma}:${form}`
    const explicit = overrides.answers[key]
    if (explicit) {
      used.add(key)
      if (overrides.sourceAnswers?.[key] && overrides.sourceAnswers[key] !== card.answer) throw new Error(`Review changed source answer: ${key}`)
    }
    if (!explicit && /[\/();]/.test(card.answer)) throw new Error(`Define explicit alternatives for ${key}`)
    const accepted = explicit || [card.answer]
    if (!accepted.length || accepted.some(a => !a.trim() || /[\/();]/.test(a))) throw new Error(`Invalid accepted answers: ${key}`)
    verb.forms[form] = { canonical: accepted[0], alternatives: accepted.slice(1) }
  }
  for (const key of Object.keys(overrides.answers)) if (!used.has(key)) throw new Error(`Stale answer override: ${key}`)
  for (const key of Object.keys(overrides.cues)) if (!verbs.has(key)) throw new Error(`Stale cue override: ${key}`)
  return [...verbs.values()]
}
export const normalizeAnswer = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('de-DE')
export const accepts = (answer: Answer, value: string) => !!normalizeAnswer(value) && [answer.canonical, ...answer.alternatives].some(a => normalizeAnswer(a) === normalizeAnswer(value))
export function hintDetails(answer: string) {
  const chars = Array.from(new Intl.Segmenter('de', { granularity: 'grapheme' }).segment(answer.normalize('NFC')), part => part.segment)
  return { first: chars.find(char => /\p{L}/u.test(char)) || '', length: chars.filter(char => /[\p{L}\p{N}]/u.test(char)).length }
}
export function insertCharacter(value: string, start: number, end: number, character: string) {
  return { value: value.slice(0, start) + character + value.slice(end), caret: start + character.length }
}
export type FieldState = { value: string; hints: number; mistakes: number; status: 'editing' | 'empty' | 'wrong' | 'correct' | 'revealed' }
type Stat = { seen: number; debt: number }
type Task = { verbId: string; form: Form }
export type Challenge = {
  settings: Settings; pool: Task[]; turn: number; verbId: string; fields: Partial<Record<Form, FieldState>>
  stats: Record<string, Stat>; ended: boolean; score: number; answered: number; unaided: number; hinted: number; retried: number; revealed: number
}
const keyFor = (verb: string, form: Form) => `${verb}:${form}`
export const finishedField = (field: FieldState) => field.status === 'correct' || field.status === 'revealed'
export const finishedQuestion = (state: Challenge) => Object.values(state.fields).length > 0 && Object.values(state.fields).every(finishedField)

export function chooseTask(pool: Task[], stats: Challenge['stats'], previous: string, turn: number, random: number): Task | undefined {
  const remaining = pool.filter(t => keyFor(t.verbId, t.form) !== previous)
  const choices = remaining.length ? remaining : pool
  if (!choices.length) return undefined
  const stat = (t: Task) => stats[keyFor(t.verbId, t.form)] || { seen: 0, debt: 0 }
  // One review turn in three; other turns prioritize least-seen forms to guarantee coverage.
  const review = turn % 3 === 2 && choices.some(t => stat(t).debt > 0)
  const priority = (t: Task) => review ? stat(t).debt : -stat(t).seen
  const best = Math.max(...choices.map(priority))
  const tied = choices.filter(t => priority(t) === best)
  return tied[Math.min(tied.length - 1, Math.floor(Math.max(0, random) * tied.length))]
}
function nextQuestion(state: Challenge, verbs: Verb[], random: number): Challenge {
  const previousForm = Object.keys(state.fields)[0] as Form | undefined
  let pool = state.pool
  // A complete-verb question covers all forms, so avoid the same verb back-to-back.
  if (state.settings.mode === 'complete' && pool.some(t => t.verbId !== state.verbId)) pool = pool.filter(t => t.verbId !== state.verbId)
  const selected = chooseTask(pool, state.stats, previousForm ? keyFor(state.verbId, previousForm) : '', state.turn, random)
  if (!selected) return { ...state, fields: {}, ended: true }
  const verb = verbs.find(v => v.id === selected.verbId)!
  const targets = state.settings.mode === 'complete' ? forms.filter(f => verb.forms[f]) : [selected.form]
  return { ...state, verbId: verb.id, fields: Object.fromEntries(targets.map(f => [f, { value: '', hints: 0, mistakes: 0, status: 'editing' }])) }
}
export function startChallenge(verbs: Verb[], settings: Settings, random: number): Challenge {
  const pool = verbs.flatMap(v => v.cues[settings.language]?.trim() ? forms.filter(f => v.forms[f] && (settings.mode !== 'single' || settings.form === f)).map(form => ({ verbId: v.id, form })) : [])
  return nextQuestion({ settings, pool, turn: 0, verbId: '', fields: {}, stats: {}, ended: false, score: 0, answered: 0, unaided: 0, hinted: 0, retried: 0, revealed: 0 }, verbs, random)
}
export type ChallengeAction =
  | { type: 'edit'; form: Form; turn: number; value: string }
  | { type: 'submit' | 'hint' | 'reveal'; form: Form; turn: number }
  | { type: 'next'; turn: number; random: number }
  | { type: 'review-all'; turn: number }
  | { type: 'reveal-all'; turn: number }
  | { type: 'end' }
export function reduceChallenge(state: Challenge, action: ChallengeAction, verbs: Verb[]): Challenge {
  if (action.type === 'end') return { ...state, ended: true }
  if (state.ended || action.turn !== state.turn) return state
  if (action.type === 'review-all' || action.type === 'reveal-all') {
    if (state.settings.mode !== 'complete') return state
    const type = action.type === 'review-all' ? 'submit' : 'reveal'
    return forms.reduce((current, form) => reduceChallenge(current, { type, form, turn: action.turn }, verbs), state)
  }
  if (action.type === 'next') return (state.settings.mode === 'complete' || finishedQuestion(state)) ? nextQuestion({ ...state, turn: state.turn + 1 }, verbs, action.random) : state
  const field = state.fields[action.form]
  if (!field || finishedField(field)) return state
  const answer = verbs.find(v => v.id === state.verbId)!.forms[action.form]!
  const updated = { ...field }
  const next = { ...state, fields: { ...state.fields, [action.form]: updated }, stats: { ...state.stats } }
  const key = keyFor(state.verbId, action.form)
  const stat = { ...(state.stats[key] || { seen: 0, debt: 0 }) }
  next.stats[key] = stat
  if (action.type === 'edit') { updated.value = action.value; updated.status = 'editing'; return next }
  if (action.type === 'hint') { updated.hints = Math.min(2, updated.hints + 1); stat.debt = Math.max(1, stat.debt); return next }
  if (action.type === 'submit') {
    if (!normalizeAnswer(field.value)) { updated.status = 'empty'; return next }
    if (!accepts(answer, field.value)) {
      updated.status = 'wrong'; updated.mistakes++; stat.debt = Math.min(5, stat.debt + 1); return next
    }
    updated.status = 'correct'
    next.score += field.hints === 2 ? 0 : field.hints === 1 ? 1 : field.mistakes ? 2 : 3
    if (field.hints) next.hinted++
    if (field.mistakes) next.retried++
    if (!field.hints && !field.mistakes) { next.unaided++; stat.debt = Math.max(0, stat.debt - 1) }
  } else { updated.status = 'revealed'; next.revealed++; stat.debt = Math.min(5, stat.debt + 2) }
  stat.seen++
  next.answered++
  return next
}
