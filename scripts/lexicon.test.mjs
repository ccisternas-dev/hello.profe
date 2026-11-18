import test from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { audioUrl, detailsBucket, findDetails, lexiconKey, lexiconLetter, matchArticle, orderEntries, singleWord } from "../src/lexicon-core.ts"
import { inflectedForms, toCard, toDetails } from "./build-lexicon.mjs"

const dir = new URL("../src/data/lexicon/de/", import.meta.url)
const lexicon = Object.assign({}, ...readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(new URL(f, dir), "utf8"))))

test("keys drop a leading article and fold case; umlauts share their base letter file", () => {
  assert.equal(lexiconKey(" das Haus "), "haus")
  assert.equal(lexiconKey("Übung"), "übung")
  assert.equal(lexiconLetter("übung"), "u")
  assert.equal(lexiconLetter("straße"), "s")
  assert.equal(lexiconLetter("5"), "_")
})

test("only single words are looked up, with punctuation and an article removed", () => {
  assert.equal(singleWord("Haus."), "Haus")
  assert.equal(singleWord("„die Zeitung“"), "Zeitung")
  assert.equal(singleWord("ein großes Haus"), null)
  assert.equal(singleWord("..."), null)
})

test("lowercase words prefer lowercase entries; capitalized words keep all entries, exact case first", () => {
  const entries = [{ w: "Ach", c: "noun", g: ["n"] }, { w: "ach", c: "intj" }]
  assert.deepEqual(orderEntries("ach", entries).map((e) => e.c), ["intj"])
  assert.deepEqual(orderEntries("Ach", entries).map((e) => e.c), ["noun", "intj"])
  assert.deepEqual(orderEntries("Schnell", [{ w: "schnell", c: "adj" }]).map((e) => e.c), ["adj"])
})

test("the built lexicon has articles, word classes and plurals for common words", () => {
  assert.deepEqual(lexicon.haus, [{ w: "Haus", c: "noun", g: ["n"], pl: "Häuser", gen: "Hauses" }])
  assert.deepEqual(lexicon.band.map((e) => e.g[0]).sort(), ["f", "m", "n"])
  assert.deepEqual(lexicon.leute[0].g, ["p"])
  assert.equal(lexicon.leute[0].pl, undefined)
  assert.ok(lexicon.weil.some((e) => e.c === "conj"))
  assert.ok(lexicon.ach.some((e) => e.c === "intj"))
  assert.ok(Object.keys(lexicon).length > 15000)
  assert.ok(Object.values(lexicon).flat().every((e) => e.w && e.c))
})

test("the extractor skips inflected-form entries and minor plurals", () => {
  assert.equal(toCard({ word: "Leute", pos: "noun", senses: [{ tags: ["form-of", "plural"] }] }), null)
  assert.equal(toCard({ word: "Berlin", pos: "name", senses: [{}] }), null)
  assert.deepEqual(toCard({ word: "Hund", pos: "noun", senses: [{ tags: ["masculine"] }], forms: [
    { form: "Hünde", tags: ["nominative", "plural", "nonstandard"] }, { form: "Hunde", tags: ["definite", "nominative", "plural"] }, { form: "Hundes", tags: ["genitive", "singular"] },
  ] }), { w: "Hund", c: "noun", g: ["m"], pl: "Hunde", gen: "Hundes" })
})

test("an article in the translation keeps only the matching genders", () => {
  assert.deepEqual(matchArticle("das Band", lexicon.band).map((e) => e.pl), ["Bänder"])
  assert.deepEqual(matchArticle("der Band", lexicon.band).map((e) => e.pl), ["Bände"])
  assert.deepEqual(matchArticle("die Leute", lexicon.leute).map((e) => e.g[0]), ["p"])
  assert.equal(matchArticle("Band", lexicon.band).length, 3)
  assert.equal(matchArticle("das See", lexicon.see).length, 2)
})

test("noun plurals find their singular entry, unless the plural is a word of its own", () => {
  assert.equal(lexicon.personen[0].w, "Person")
  assert.equal(lexicon.häuser[0].w, "Haus")
  assert.ok(lexicon.mädchen.every((e) => e.w === "Mädchen"))
})

// Explore details (#28), loaded from the built chunks the same way the browser does.
const readJson = (dir, name) => {
  try { return JSON.parse(readFileSync(new URL(`../src/data/lexicon/${dir}/${name}.json`, import.meta.url), "utf8")) } catch { return undefined }
}
const loaders = { details: async (b) => readJson("de-details", b), cards: async (l) => readJson("de", l), forms: async (l) => readJson("de-forms", l) }

test("details buckets use two folded letters and fall back to the letter file", () => {
  assert.equal(detailsBucket("ging"), "gi")
  assert.equal(detailsBucket("übung"), "ub")
  assert.equal(detailsBucket("ß"), "s")
  assert.equal(detailsBucket("a"), "a")
  assert.equal(audioUrl("7/7e/De-Haus.ogg"), "https://upload.wikimedia.org/wikipedia/commons/transcoded/7/7e/De-Haus.ogg/De-Haus.ogg.mp3")
})

test("Explore finds lemmas with meanings, examples, pronunciation and tables", async () => {
  const gehen = await findDetails("gehen", loaders)
  assert.equal(gehen.formOf, undefined)
  const [verb] = gehen.entries
  assert.equal(verb.c, "verb")
  assert.equal(verb.s[0].d, "to go, to walk")
  assert.ok(verb.s.some((m) => m.ex?.[0] && m.ex?.[1]))
  assert.ok(verb.ipa && verb.audio)
  assert.deepEqual(verb.conj.pres, ["gehe", "gehst", "geht", "gehen", "geht", "gehen"])
  assert.equal(verb.conj.pret[0], "ging")
  assert.equal(verb.conj.pp, "gegangen")
  assert.equal(verb.conj.aux, "sein")
  const [haus] = (await findDetails("das Haus", loaders)).entries
  assert.deepEqual(haus.decl.pl, ["Häuser", "Häuser", "Häusern", "Häuser"])
  assert.deepEqual((await findDetails("schnell", loaders)).entries.find((e) => e.c === "adj").cmp, ["schneller", "am schnellsten"])
})

test("inflected forms and plurals lead to their lemma", async () => {
  const ging = await findDetails("ging", loaders)
  assert.deepEqual(ging.formOf, ["gehen"])
  assert.equal(ging.entries[0].w, "gehen")
  assert.deepEqual((await findDetails("Häusern", loaders)).formOf, ["Haus"])
  assert.deepEqual((await findDetails("Personen", loaders)).formOf, ["Person"])
  assert.deepEqual((await findDetails("fängst", loaders)).formOf, ["fangen"], "the noun Fangen is not a match")
})

test("ambiguous lemmas keep every entry and missing words return null", async () => {
  const band = await findDetails("Band", loaders)
  assert.deepEqual(band.entries.map((e) => e.g[0]).sort(), ["f", "m", "n"])
  assert.ok(band.entries.every((e) => e.s.length))
  assert.equal(await findDetails("Quatschwortxyz", loaders), null)
  assert.equal(await findDetails("ein großes Haus", loaders), null)
})

test("the details extractor limits meanings, skips long quotations and form-of senses", () => {
  const long = "x".repeat(200)
  const details = toDetails({ word: "Test", pos: "noun", senses: [
    { glosses: ["test"], tags: ["masculine"], examples: [{ text: long, english: "long" }, { text: "Ein Test.", english: "A test." }] },
    { glosses: ["Tests"], tags: ["form-of"] },
    ...Array.from({ length: 8 }, (_, i) => ({ glosses: [`sense ${i}`] })),
  ], sounds: [{ ipa: "/tɛst/" }, { mp3_url: "https://example.org/not-commons.mp3" }] })
  assert.equal(details.s.length, 5)
  assert.deepEqual(details.s[0].ex, ["Ein Test.", "A test."])
  assert.equal(details.ipa, "/tɛst/")
  assert.equal(details.audio, undefined)
  assert.deepEqual(inflectedForms({ conj: { pres: ["fange an", "fängst an"], pret: [null], pp: "angefangen" } }), ["angefangen"])
})
