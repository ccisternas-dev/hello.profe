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
/** Explore details bucket: the first two letters with umlauts folded ("ging" → "gi"), so each chunk stays small. */
export function detailsBucket(key: string): string {
  const letters = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 's').slice(0, 2)
  return /^[a-z]{2}$/.test(letters) ? letters : lexiconLetter(key)
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

/** Explore details for one entry (#28). Table cells are null where Wiktionary has no form. */
export type Meaning = { d: string; ex?: [string, string] }
export type Conjugation = { pres: (string | null)[]; pret: (string | null)[]; pp?: string; aux?: string; imp?: (string | null)[] }
export type Declension = { sg: (string | null)[]; pl: (string | null)[] }
export type LexiconDetails = LexiconEntry & { s: Meaning[]; ipa?: string; audio?: string; conj?: Conjugation; decl?: Declension; cmp?: [string, string] }
export type DetailsResult = { word: string; entries: LexiconDetails[]; formOf?: string[] }

type Records<T> = Record<string, T> | undefined
export type DetailsLoaders = {
  details: (bucket: string) => Promise<Records<LexiconDetails[]>>
  cards: (letter: string) => Promise<Records<LexiconEntry[]>>
  forms: (letter: string) => Promise<Records<string[]>>
}

/** Single-word inflected forms in an entry's tables, as lookup keys ("ging" for gehen). Forms with a space are skipped. */
export function inflectedForms(entry: Partial<LexiconDetails>): string[] {
  const cells = [...(entry.conj?.pres || []), ...(entry.conj?.pret || []), ...(entry.conj?.imp || []), entry.conj?.pp,
    ...(entry.decl?.sg || []), ...(entry.decl?.pl || []), ...(entry.cmp || []), entry.pl]
  return [...new Set(cells.filter((cell): cell is string => !!cell).flatMap(cell => cell.split(' / ')).filter(form => !/\s/.test(form)).map(lexiconKey))]
}

/** Rebuilds the Wikimedia Commons MP3 URL from the stored path ("7/7e/De-Haus.ogg"). */
export function audioUrl(path: string): string {
  return `https://upload.wikimedia.org/wikipedia/commons/transcoded/${path}/${path.split('/').pop()}.mp3`
}

/**
 * Dictionary details for a German word. A lemma is found directly; a noun plural ("Häuser") through the word cards;
 * an inflected form ("ging") through the forms index. `formOf` lists the lemmas when the word was not one itself.
 */
export async function findDetails(text: string, load: DetailsLoaders): Promise<DetailsResult | null> {
  const word = singleWord(text)
  if (!word) return null
  const key = lexiconKey(word)
  const direct = (await load.details(detailsBucket(key)))?.[key]
  if (direct?.length) return { word, entries: orderEntries(word, direct) as LexiconDetails[] }
  const plurals = ((await load.cards(lexiconLetter(key)))?.[key] || []).map(card => lexiconKey(card.w))
  const lemmas = [...new Set([...plurals, ...((await load.forms(lexiconLetter(key)))?.[key] || [])])]
  const entries: LexiconDetails[] = []
  for (const lemma of lemmas) entries.push(...((await load.details(detailsBucket(lemma)))?.[lemma] || []))
  // A lemma key can hold unrelated entries ("fangen" the verb, "Fangen" the game); keep those that have this form.
  const matching = entries.filter(entry => inflectedForms(entry).includes(key))
  const found = matching.length ? matching : entries
  return found.length ? { word, entries: found, formOf: [...new Set(found.map(entry => entry.w))] } : null
}
