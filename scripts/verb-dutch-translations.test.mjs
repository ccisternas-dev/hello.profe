import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {buildVerbs} from '../src/verb-challenge.ts'
const read=name=>JSON.parse(readFileSync(new URL('../src/data/'+name,import.meta.url)))
test('all 148 German verb cards retain Dutch meanings across all source forms',()=>{
 const cards=read('study-decks.json').decks.find(d=>d.id==='irregular-verbs').cards
 const dutch=read('verb-dutch-translations.json')
 const verbs=buildVerbs(cards,{...read('verb-overrides.json'),cues:{}})
 assert.equal(verbs.length,148)
 assert.deepEqual(Object.keys(dutch).sort(),verbs.map(v=>v.id).sort())
 for(const card of cards)assert.equal(card.translations.nl,dutch[card.prompt.split(' — ')[0]])
 for(const verb of verbs)assert.ok(verb.cues.nl?.trim())
 assert.equal(dutch.liegen,'liggen')
 assert.equal(dutch.lügen,'liegen')
})
