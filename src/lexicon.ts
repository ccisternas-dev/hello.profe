import { findDetails, lexiconKey, lexiconLetter, matchArticle, orderEntries, singleWord, type DetailsResult, type LexiconDetails, type LexiconEntry } from './lexicon-core'

// Lazily loaded chunks, so the browser never downloads the whole lexicon: word cards and forms per first letter,
// Explore details per first two letters.
const files = import.meta.glob<Record<string, LexiconEntry[]>>('./data/lexicon/de/*.json', { import: 'default' })
const detailFiles = import.meta.glob<Record<string, LexiconDetails[]>>('./data/lexicon/de-details/*.json', { import: 'default' })
const formFiles = import.meta.glob<Record<string, string[]>>('./data/lexicon/de-forms/*.json', { import: 'default' })

/** German word-card entries for a translation result; empty for phrases and unknown words. */
export async function lookupGerman(text: string): Promise<LexiconEntry[]> {
  const word = singleWord(text)
  if (!word) return []
  const key = lexiconKey(word)
  const load = files[`./data/lexicon/de/${lexiconLetter(key)}.json`]
  if (!load) return []
  return matchArticle(text, orderEntries(word, (await load())[key] || []))
}

/** Explore details for a German word, its plural or an inflected form; null when it is not in the dictionary. */
export function exploreGerman(text: string): Promise<DetailsResult | null> {
  return findDetails(text, {
    details: bucket => detailFiles[`./data/lexicon/de-details/${bucket}.json`]?.(),
    cards: letter => files[`./data/lexicon/de/${letter}.json`]?.(),
    forms: letter => formFiles[`./data/lexicon/de-forms/${letter}.json`]?.(),
  })
}
