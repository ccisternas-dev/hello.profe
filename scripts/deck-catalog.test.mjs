import test from 'node:test'
import assert from 'node:assert/strict'
import {availableDecks,filterDecks} from '../src/deck-catalog.ts'
const decks=[
 {id:'legacy',language:'de',level:'B2',topic:'verbs'},
 {id:'draft',language:'de',level:'B1',topic:'health',reviewed:false},
 {id:'approved',language:'de',level:'B1',topic:'health',reviewed:true},
 {id:'french',language:'fr',level:'B1',topic:'health',reviewed:true},
]
test('production hides all unreviewed content, including legacy decks',()=>{
 assert.deepEqual(availableDecks(decks,true).map(d=>d.id),['approved','french'])
 assert.equal(availableDecks(decks,false).length,4)
})
test('language, level and topic filters combine and allow empty results',()=>{
 assert.deepEqual(filterDecks(availableDecks(decks,true),{language:'de',level:'B1',topic:'health'}).map(d=>d.id),['approved'])
 assert.equal(filterDecks(decks,{language:'fr',level:'B2',topic:'verbs'}).length,0)
 assert.equal(filterDecks(decks,{language:'',level:'',topic:''}).length,4)
})
