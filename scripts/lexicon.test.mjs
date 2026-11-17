import test from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { lexiconKey, lexiconLetter, matchArticle, orderEntries, singleWord } from "../src/lexicon-core.ts"
import { toCard } from "./build-lexicon.mjs"

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
