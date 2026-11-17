// Builds the German word-card lexicon (#68) from a kaikki.org Wiktextract dump and a frequency list.
// Usage: node scripts/build-lexicon.mjs <kaikki-German.jsonl.gz> <de_50k.txt> [count=20000]
// Output: src/data/lexicon/de/<letter>.json, keyed by lowercase word. Data is CC BY-SA 4.0 (see README there).
import { createReadStream, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createGunzip } from "node:zlib"
import { createInterface } from "node:readline"
import { lexiconKey, lexiconLetter } from "../src/lexicon-core.ts"

// Word classes kept, mapped to the short codes the UI understands.
const classes = { noun: "noun", verb: "verb", adj: "adj", adv: "adv", intj: "intj", conj: "conj", prep: "prep", postp: "prep", pron: "pron", det: "det", article: "article", num: "num", particle: "particle", contraction: "contraction" }
const minorUsage = new Set(["nonstandard", "uncommon", "figuratively", "poetic", "rare", "archaic", "dated", "obsolete", "regional", "dialectal", "colloquial"])

const pick = (entry, wanted) => entry.forms?.find((form) => wanted.every((tag) => form.tags?.includes(tag)) && !form.tags.some((tag) => minorUsage.has(tag)))?.form

export function toCard(entry) {
  const word = classes[entry.pos]
  if (!word || !entry.word || /\s/.test(entry.word)) return null
  const senses = entry.senses || []
  // Skip pure inflected-form entries such as "Leute (noun form)".
  if (senses.length && senses.every((sense) => sense.tags?.includes("form-of"))) return null
  const card = { w: entry.word, c: word }
  if (word === "noun") {
    const tags = new Set(senses.flatMap((sense) => sense.tags || []))
    const genders = ["masculine", "feminine", "neuter"].filter((gender) => tags.has(gender)).map((gender) => gender[0])
    if (tags.has("plural-only")) card.g = ["p"]
    else if (genders.length) card.g = genders
    const plural = pick(entry, ["nominative", "plural"])
    if (plural && !card.g?.includes("p")) card.pl = plural
    const genitive = pick(entry, ["genitive", "singular"])
    if (genitive) card.gen = genitive
  }
  return card
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const [kaikkiPath, frequencyPath, countArg] = process.argv.slice(2)
  if (!kaikkiPath || !frequencyPath) throw new Error("Usage: node scripts/build-lexicon.mjs <kaikki.jsonl.gz> <frequency.txt> [count]")
  const count = Number(countArg || 20000)
  const frequency = new Map()
  readFileSync(frequencyPath, "utf8").split("\n").forEach((line, rank) => {
    const word = line.split(" ")[0]
    if (word && !frequency.has(lexiconKey(word))) frequency.set(lexiconKey(word), rank)
  })
  const byKey = new Map()
  const lines = createInterface({ input: createReadStream(kaikkiPath).pipe(createGunzip()), crlfDelay: Infinity })
  for await (const line of lines) {
    const entry = JSON.parse(line)
    const key = lexiconKey(entry.word || "")
    if (!frequency.has(key)) continue
    const card = toCard(entry)
    if (!card) continue
    const cards = byKey.get(key) || []
    if (!cards.some((existing) => JSON.stringify(existing) === JSON.stringify(card))) cards.push(card)
    byKey.set(key, cards)
  }
  const keys = [...byKey.keys()].sort((a, b) => frequency.get(a) - frequency.get(b)).slice(0, count)
  const selected = new Map(keys.map((key) => [key, byKey.get(key)]))
  // Plural aliases: "personen" finds "Person". Only when the plural is not a word of its own.
  let aliases = 0
  for (const key of keys) for (const card of byKey.get(key)) {
    const plural = card.pl && lexiconKey(card.pl)
    if (!plural || byKey.has(plural)) continue
    const cards = selected.get(plural) || []
    if (!cards.includes(card)) cards.push(card)
    if (!selected.has(plural)) aliases++
    selected.set(plural, cards)
  }
  const files = {}
  for (const key of [...selected.keys()].sort()) (files[lexiconLetter(key)] ||= {})[key] = selected.get(key)
  const out = new URL("../src/data/lexicon/de/", import.meta.url)
  rmSync(out, { recursive: true, force: true })
  mkdirSync(out, { recursive: true })
  for (const [letter, entries] of Object.entries(files)) writeFileSync(new URL(`${letter}.json`, out), JSON.stringify(entries) + "\n")
  console.log(`Wrote ${keys.length} words and ${aliases} plural aliases in ${Object.keys(files).length} files.`)
}
