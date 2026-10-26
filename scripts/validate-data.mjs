import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

export function validate(data) {
  assert.equal(data.schemaVersion, 1)
  assert.ok(Array.isArray(data.decks) && data.decks.length > 0)
  const decks = new Set(), cards = new Set()
  for (const deck of data.decks) {
    assert.ok(deck.id && deck.title && !decks.has(deck.id), 'Missing or duplicate deck')
    decks.add(deck.id)
    assert.ok(deck.cards.length > 0, `Empty deck: ${deck.id}`)
    for (const card of deck.cards) {
      assert.ok(card.id && !cards.has(card.id), `Duplicate/missing ID: ${card.id}`)
      cards.add(card.id)
      assert.equal(card.deckId, deck.id)
      for (const field of ['prompt', 'answer']) {
        assert.ok(typeof card[field] === 'string' && card[field].trim() && !['undefined', 'NaN', '—'].includes(card[field]), `Invalid ${field}: ${card.id}`)
      }
      assert.ok(card.source.file.endsWith('.xlsx') && card.source.sheet && card.source.row > 0)
      assert.equal(typeof card.detail, 'string')
      assert.ok(Object.values(card.translations).every(value => typeof value === 'string'))
    }
  }
  return cards.size
}
const data = JSON.parse(readFileSync(new URL('../src/data/study-decks.json', import.meta.url)))
console.log(`Validated ${validate(data)} cards in ${data.decks.length} decks`)
const broken = structuredClone(data)
broken.decks[0].cards[0].answer = ''
assert.throws(() => validate(broken), /Invalid answer/)
broken.decks[0].cards[0].answer = 'restored'
broken.decks[0].cards.push(broken.decks[0].cards[0])
assert.throws(() => validate(broken), /Duplicate/)
