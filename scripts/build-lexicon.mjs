// Builds the German word-card lexicon (#68) and the Explore details (#28) from a kaikki.org Wiktextract dump and a frequency list.
// Usage: node scripts/build-lexicon.mjs <kaikki-German.jsonl.gz> <de_50k.txt> [count=20000]
// Output, keyed by lowercase word: src/data/lexicon/de/<letter>.json (word cards), de-details/<bucket>.json (meanings, examples,
// pronunciation, tables) and de-forms/<letter>.json (inflected forms → lemma keys). Data is CC BY-SA 4.0 (see README there).
import { createReadStream, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createGunzip } from "node:zlib"
import { createInterface } from "node:readline"
import { detailsBucket, inflectedForms, lexiconKey, lexiconLetter } from "../src/lexicon-core.ts"

// Word classes kept, mapped to the short codes the UI understands.
const classes = { noun: "noun", verb: "verb", adj: "adj", adv: "adv", intj: "intj", conj: "conj", prep: "prep", postp: "prep", pron: "pron", det: "det", article: "article", num: "num", particle: "particle", contraction: "contraction" }
const minorUsage = new Set(["nonstandard", "uncommon", "figuratively", "poetic", "rare", "archaic", "dated", "obsolete", "regional", "dialectal", "colloquial"])

const pick = (entry, wanted) => entry.forms?.find((form) => wanted.every((tag) => form.tags?.includes(tag)) && !form.tags.some((tag) => minorUsage.has(tag)))?.form

const toCardFields = ({ w, c, g, pl, gen }) => Object.fromEntries(Object.entries({ w, c, g, pl, gen }).filter(([, value]) => value !== undefined))

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

const MAX_SENSES = 5
const MAX_EXAMPLE = 140
const persons = [["first-person", "singular"], ["second-person", "singular"], ["third-person", "singular"], ["first-person", "plural"], ["second-person", "plural"], ["third-person", "plural"]]
const usable = (form) => form.form && !form.tags?.some((tag) => minorUsage.has(tag) || tag === "subordinate-clause" || tag === "multiword-construction")
const table = (entry, source) => (entry.forms || []).filter((form) => form.source === source && usable(form))
const cell = (forms, wanted) => [...new Set(forms.filter((form) => wanted.every((tag) => form.tags?.includes(tag))).map((form) => form.form))].join(" / ") || undefined

/** Meanings, one short example each, IPA, audio and the key inflection table for one Wiktextract entry. */
export function toDetails(entry) {
  const card = toCard(entry)
  if (!card) return null
  const details = { ...card, s: [] }
  for (const sense of entry.senses || []) {
    const gloss = sense.glosses?.at(-1)
    if (!gloss || sense.tags?.includes("form-of") || details.s.length >= MAX_SENSES) continue
    const meaning = { d: gloss }
    const example = sense.examples?.find((ex) => ex.text && (ex.english || ex.translation) && ex.text.length <= MAX_EXAMPLE && ex.type !== "quotation")
    if (example) meaning.ex = [example.text, example.english || example.translation]
    details.s.push(meaning)
  }
  const ipa = entry.sounds?.find((sound) => sound.ipa)?.ipa
  if (ipa) details.ipa = ipa
  const audio = entry.sounds?.find((sound) => sound.mp3_url && !sound.tags?.length) || entry.sounds?.find((sound) => sound.mp3_url)
  // Wikimedia Commons path only ("7/7e/De-Haus.ogg"); the app rebuilds the transcoded MP3 URL.
  const commons = audio?.mp3_url.match(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/transcoded\/([0-9a-f]\/[0-9a-f]{2}\/[^/]+)\/[^/]+\.mp3$/)
  if (commons) details.audio = commons[1]
  if (card.c === "verb") {
    const forms = table(entry, "conjugation")
    const present = persons.map((person) => cell(forms, ["indicative", "present", ...person]))
    const preterite = persons.map((person) => cell(forms, ["indicative", "preterite", ...person]))
    if (present.some(Boolean)) {
      details.conj = { pres: present, pret: preterite, pp: cell(forms, ["participle", "past"]), aux: cell(forms, ["auxiliary"]) }
      const imperative = [cell(forms, ["imperative", "singular"]), cell(forms, ["imperative", "plural"])]
      if (imperative.some(Boolean)) details.conj.imp = imperative
    }
  }
  if (card.c === "noun") {
    const forms = table(entry, "declension")
    const cases = ["nominative", "genitive", "dative", "accusative"]
    const singular = cases.map((name) => cell(forms, [name, "singular"]))
    const plural = cases.map((name) => cell(forms, [name, "plural"]))
    if (singular.some(Boolean) || plural.some(Boolean)) details.decl = { sg: singular, pl: plural }
  }
  if (card.c === "adj") {
    const degrees = [pick(entry, ["comparative"]), pick(entry, ["superlative"])]
    if (degrees.every(Boolean)) details.cmp = degrees
  }
  return details
}

export { inflectedForms }

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
  const detailsByKey = new Map()
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
    // Homographs with the same card (separate etymologies) share one details entry.
    const details = toDetails(entry)
    const list = detailsByKey.get(key) || []
    const same = list.find((existing) => JSON.stringify(toCardFields(existing)) === JSON.stringify(card))
    if (!same) list.push(details)
    else {
      same.s = [...same.s, ...details.s].slice(0, MAX_SENSES)
      for (const field of ["ipa", "audio", "conj", "decl", "cmp"]) if (!same[field] && details[field]) same[field] = details[field]
    }
    detailsByKey.set(key, list)
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

  // Explore details, in smaller two-letter buckets because they are larger than the cards.
  const detailFiles = {}
  for (const key of [...keys].sort()) (detailFiles[detailsBucket(key)] ||= {})[key] = detailsByKey.get(key)
  // Inflected forms that are not words of their own point to their lemma keys.
  const formFiles = {}
  let forms = 0
  for (const key of keys) for (const details of detailsByKey.get(key)) for (const form of inflectedForms(details)) {
    if (form === key || byKey.has(form) || selected.has(form)) continue
    const bucket = (formFiles[lexiconLetter(form)] ||= {})
    if (!bucket[form]) forms++
    if (!(bucket[form] ||= []).includes(key)) bucket[form].push(key)
  }
  for (const [dir, content] of [["de-details", detailFiles], ["de-forms", formFiles]]) {
    const target = new URL(`../src/data/lexicon/${dir}/`, import.meta.url)
    rmSync(target, { recursive: true, force: true })
    mkdirSync(target, { recursive: true })
    for (const [name, entries] of Object.entries(content)) writeFileSync(new URL(`${name}.json`, target), JSON.stringify(entries) + "\n")
  }
  console.log(`Wrote details in ${Object.keys(detailFiles).length} files and ${forms} inflected forms.`)
}
