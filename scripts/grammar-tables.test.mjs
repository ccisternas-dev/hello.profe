import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { filterGrammarTables, grammarTopics } from "../src/grammar-tables.ts"

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"))
const data = read("src/data/grammar-tables.json")
const catalogs = ["en", "es", "fr", "de", "nl"].map((locale) => [locale, read(`src/locales/${locale}.json`)])

test("grammar tables are complete, labelled and approved", () => {
  const ids = new Set()
  for (const table of data.tables) {
    assert.ok(!ids.has(table.id), `duplicate id ${table.id}`); ids.add(table.id)
    assert.equal(table.language, "de")
    assert.match(table.level, /^(A1|A2|B1|B2|C1|C2)$/)
    assert.ok(grammarTopics.includes(table.topic), `${table.id} topic`)
    assert.equal(table.reviewed, true)
    assert.ok(table.columns.length >= 2 && table.rows.length >= 1)
    for (const row of table.rows) {
      assert.equal(row.length, table.columns.length, `${table.id}: ${row[0]}`)
      for (const cell of row) {
        assert.ok(cell.trim(), `${table.id}: empty cell`)
        assert.equal((cell.match(/\[/g) || []).length, (cell.match(/\]/g) || []).length, `${table.id}: unbalanced highlight in ${cell}`)
      }
    }
  }
  assert.deepEqual(data.review, { approvedBy: "ccisternas-dev", approvedOn: "2026-11-18" })
})

test("every requested topic has a table, including all four cases for articles and pronouns", () => {
  for (const topic of grammarTopics) assert.ok(data.tables.some((table) => table.topic === topic), topic)
  for (const id of ["de-definite-articles", "de-indefinite-articles", "de-adjective-endings-weak"]) {
    assert.deepEqual(data.tables.find((table) => table.id === id).rows.map((row) => row[0]), ["Nominativ", "Akkusativ", "Dativ", "Genitiv"])
  }
  assert.deepEqual(data.tables.find((table) => table.id === "de-personal-pronouns").columns.slice(1, 4), ["Nominativ", "Akkusativ", "Dativ"])
})

test("table titles and notes are translated in every interface language", () => {
  const keys = data.tables.flatMap((table) => [table.title, ...table.notes])
  for (const [locale, catalog] of catalogs) for (const key of keys) assert.ok(catalog[key]?.trim(), `${locale}: ${key}`)
})

test("filters combine language and topic and skip unreviewed tables", () => {
  const tables = [...data.tables, { ...data.tables[0], id: "draft", reviewed: false }]
  assert.equal(filterGrammarTables(tables, "de", "").length, data.tables.length)
  assert.deepEqual(filterGrammarTables(tables, "de", "aduso").map((table) => table.id), ["de-aduso"])
  assert.equal(filterGrammarTables(tables, "nl", "").length, 0)
})
