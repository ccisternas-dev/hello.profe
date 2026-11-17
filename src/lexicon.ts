import { lexiconKey, lexiconLetter, matchArticle, orderEntries, singleWord, type LexiconEntry } from './lexicon-core'

// One lazily loaded chunk per first letter, so the browser never downloads the whole lexicon.
const files = import.meta.glob<Record<string, LexiconEntry[]>>('./data/lexicon/de/*.json', { import: 'default' })

/** German word-card entries for a translation result; empty for phrases and unknown words. */
export async function lookupGerman(text: string): Promise<LexiconEntry[]> {
  const word = singleWord(text)
  if (!word) return []
  const key = lexiconKey(word)
  const load = files[`./data/lexicon/de/${lexiconLetter(key)}.json`]
  if (!load) return []
  return matchArticle(text, orderEntries(word, (await load())[key] || []))
}
