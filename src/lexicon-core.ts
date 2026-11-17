/** Pure helpers for the German word-card lexicon (#68). Data lives in src/data/lexicon/de/<letter>.json. */
export type WordClass = 'noun' | 'verb' | 'adj' | 'adv' | 'intj' | 'conj' | 'prep' | 'pron' | 'det' | 'article' | 'num' | 'particle' | 'contraction'
export type Gender = 'm' | 'f' | 'n' | 'p'
export type LexiconEntry = { w: string; c: WordClass; g?: Gender[]; pl?: string; gen?: string }

export const articles: Record<Gender, string> = { m: 'der', f: 'die', n: 'das', p: 'die' }

/** Lookup key: NFC, lowercase, trimmed, without a leading article. */
export function lexiconKey(text: string): string {
  return text.normalize('NFC').trim().replace(/^(der|die|das)\s+/i, '').toLocaleLowerCase('de-DE')
}
/** File bucket for a key: its first letter with umlauts folded (ä → a), or "_" for anything else. */
export function lexiconLetter(key: string): string {
  const first = key.normalize('NFD').charAt(0).replace('ß', 's')
  return /[a-z]/.test(first) ? first : '_'
}
/** The single word in a translation result, optionally after an article; null for phrases. */
export function singleWord(text: string): string | null {
  const word = text.normalize('NFC').trim().replace(/^[\s"'“”„«»(¿¡]+|[\s"'“”„«».,;:!?)]+$/g, '').replace(/^(der|die|das)\s+/i, '')
  return word && !/\s/.test(word) && /\p{L}/u.test(word) ? word : null
}
/** Genders a leading article allows: "das Band" is neuter; "die" may be feminine or plural. */
export function articleGenders(text: string): Gender[] | null {
  const article = text.normalize('NFC').trim().replace(/^[\s"'“”„«»(¿¡]+/, '').match(/^(der|die|das)\s+\S/i)?.[1].toLowerCase()
  return article === 'der' ? ['m'] : article === 'das' ? ['n'] : article === 'die' ? ['f', 'p'] : null
}
/** Keeps the entries that match the article in the text, when there is one and something matches. */
export function matchArticle(text: string, entries: LexiconEntry[]): LexiconEntry[] {
  const genders = articleGenders(text)
  const matching = genders ? entries.filter(entry => entry.g?.some(gender => genders.includes(gender))) : []
  return matching.length ? matching : entries
}
/**
 * Orders matching entries. A lowercase word only matches lowercase entries when any exist ("ach" is not the noun "Ach").
 * A capitalized word may be a noun or the start of a sentence, so it keeps every entry, exact case first.
 */
export function orderEntries(word: string, entries: LexiconEntry[]): LexiconEntry[] {
  const exact = entries.filter(entry => entry.w === word)
  if (word === word.toLocaleLowerCase('de-DE')) return exact.length ? exact : entries
  return [...exact, ...entries.filter(entry => entry.w !== word)]
}
