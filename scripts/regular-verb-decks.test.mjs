import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {availableDecks,filterDecks} from '../src/deck-catalog.ts'
const {decks}=JSON.parse(readFileSync(new URL('../src/data/study-decks.json',import.meta.url)))
test('five regular verb decks span all four levels without publishing drafts',()=>{
 const regular=decks.filter(d=>d.id.endsWith('regular-verbs-a1-b2'))
 assert.equal(regular.length,5)
 assert.equal(availableDecks(regular,true).length,0)
 for(const deck of regular){
  assert.equal(deck.cards.length,24)
  assert.equal(new Set(deck.cards.map(c=>c.prompt)).size,24)
  for(const level of ['A1','A2','B1','B2']){
   assert.equal(deck.cards.filter(c=>c.level===level).length,6)
   assert.deepEqual(filterDecks(regular,{language:deck.language,level,topic:'regular-verbs'}),[deck])
  }
  for(const card of deck.cards){
   assert.equal(Object.keys(card.translations).length,4)
   assert.ok(card.answer && card.detail)
  }
 }
})
