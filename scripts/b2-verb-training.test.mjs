import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {forms, startChallenge, reduceChallenge, finishedQuestion, accepts} from '../src/verb-challenge.ts'
const data=JSON.parse(readFileSync(new URL('../src/data/b2-verb-training.json',import.meta.url)))
for (const language of ['nl','en']) {
 test(`${language} draft has complete forms and distinct usable translation cues`,()=>{
  const {verbs,reviewed,level}=data[language]
  assert.equal(reviewed,false)
  assert.equal(level,'B2')
  assert.equal(verbs.length,20)
  assert.equal(new Set(verbs.map(v=>v.id)).size,20)
  for (const prompt of language==='en'?['es','fr']:['en','es','fr']) {
   assert.equal(new Set(verbs.map(v=>v.cues[prompt])).size,20)
   for (const form of forms) {
    const state=startChallenge(verbs,{mode:'single',form,language:prompt},0)
    assert.equal(state.pool.length,20)
    for (const verb of verbs) assert.ok(verb.forms[form].canonical.trim())
   }
  }
  if(language==='en') assert.ok(verbs.every(v=>!v.cues.en))
 })
 test(`${language} complete sessions score all forms and advance without mixing datasets`,()=>{
  const {verbs}=data[language]
  let state=startChallenge(verbs,{mode:'complete',form:'infinitive',language:'es'},0)
  const verb=verbs.find(v=>v.id===state.verbId)
  for(const form of forms){
   state=reduceChallenge(state,{type:'edit',form,turn:0,value:verb.forms[form].canonical},verbs)
   state=reduceChallenge(state,{type:'submit',form,turn:0},verbs)
  }
  assert.equal(state.score,15)
  assert.ok(finishedQuestion(state))
  state=reduceChallenge(state,{type:'next',turn:0,random:0},verbs)
  assert.notEqual(state.verbId,verb.id)
 })
}
test('Dutch separable verbs, auxiliaries and English compound forms stay exact',()=>{
 const nl=id=>data.nl.verbs.find(v=>v.id===id).forms
 const en=id=>data.en.verbs.find(v=>v.id===id).forms
 assert.ok(accepts(nl('aanbieden').present,'biedt aan'))
 assert.ok(!accepts(nl('aanbieden').present,'aanbiedt'))
 assert.ok(accepts(nl('verdwijnen').perfect,'is verdwenen'))
 assert.ok(!accepts(nl('verdwijnen').perfect,'heeft verdwenen'))
 assert.ok(accepts(en('deal with').perfect,'has dealt with'))
 assert.ok(!accepts(en('undertake').participle,'undertook'))
})
