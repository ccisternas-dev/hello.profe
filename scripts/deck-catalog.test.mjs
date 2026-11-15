import test from 'node:test'
import assert from 'node:assert/strict'
import {availableDecks,filterDecks,countStudyCards} from '../src/deck-catalog.ts'
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

test('card totals count verb reference cards rather than individual form rows',()=>{
 const verbs={id:'irregular-verbs',cards:[{prompt:'abnehmen — Präsens (er/sie/es)'},{prompt:'abnehmen — Partizip II'},{prompt:'gehen — Präsens (er/sie/es)'}]}
 const vocabulary={id:'b1-health',cards:[{prompt:'first'},{prompt:'second'}]}
 assert.equal(countStudyCards(verbs),2)
 assert.equal(countStudyCards(vocabulary),2)
 assert.equal([verbs,vocabulary].reduce((sum,deck)=>sum+countStudyCards(deck),0),4)
 assert.equal(countStudyCards({id:'empty',cards:[]}),0)
})
