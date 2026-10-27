import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildVerbs, accepts, hintDetails, insertCharacter, startChallenge, reduceChallenge, chooseTask, finishedQuestion, forms } from '../src/verb-challenge.ts'
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)))
const cards = read('../src/data/study-decks.json').decks.find(d => d.id === 'irregular-verbs').cards
const overrides = read('../src/data/verb-overrides.json')
const verbs = buildVerbs(cards, overrides)
const settings = { mode: 'single', form: 'infinitive', language: 'en' }
const reduce = (state, action) => reduceChallenge(state, action, verbs)
const act = (state, type, extra = {}) => reduce(state, { type, form: 'infinitive', turn: state.turn, ...extra })
const answer = state => verbs.find(v => v.id === state.verbId).forms.infinitive.canonical

test('all supplied verbs map to explicit answers; cues disambiguate duplicate translations', () => {
  assert.equal(verbs.length, 148)
  assert.equal(verbs.reduce((count,v) => count + Object.keys(v.forms).length,0),740)
  for (const lang of ['en','es','fr','nl','de']) {
    assert.ok(verbs.every(v => typeof v.cues[lang] === 'string' && v.cues[lang].trim()))
    assert.equal(new Set(verbs.map(v => v.cues[lang])).size,148)
    for (const mode of ['single','complete','mixed']) {
      const state = startChallenge(verbs, { ...settings, mode, language: lang }, 0)
      assert.equal(new Set(state.pool.map(task => task.verbId)).size,148)
      assert.equal(state.ended,false)
    }
  }
  assert.deepEqual(verbs.find(v=>v.id==='ziehen').forms.perfect.alternatives,['ist gezogen'])
  assert.ok(accepts(verbs.find(v=>v.id==='senden').forms.perfect,'hat gesendet'))
  assert.ok(!accepts(verbs.find(v=>v.id==='senden').forms.perfect,'gesendet'))
  assert.throws(()=>buildVerbs(cards, {answers:{},cues:{}}),/Define explicit/)
  assert.throws(()=>buildVerbs([...cards,cards[0]],overrides),/Duplicate/)
  const changed = cards.map(c => c.prompt === 'backen — Präsens (er/sie/es)' ? { ...c, answer: 'changed' } : c)
  assert.throws(()=>buildVerbs(changed,overrides),/Review changed source/)
  assert.throws(()=>buildVerbs([{...cards[0],prompt:'invalid'}],{answers:{},cues:{}}),/Invalid verb prompt/)
})
test('answer checking preserves umlauts and sharp-s, accepts NFC/case/trim and explicit alternatives only', () => {
  const a={canonical:'fährt',alternatives:[]}
  assert.ok(accepts(a,'  FA\u0308HRT  '))
  assert.ok(!accepts(a,'fahrt'))
  assert.ok(!accepts(a,'faehrt'))
  assert.ok(!accepts(a,''))
  assert.ok(!accepts({canonical:'heißt',alternatives:[]},'heisst'))
  assert.ok(accepts({canonical:'heißt',alternatives:['heisst']},'heisst'))
  assert.ok(accepts({canonical:'heißt',alternatives:[]},'HEIẞT'))
})
test('hints count visible letters/digits, excluding spaces and punctuation', () => {
  assert.deepEqual(hintDetails('hat angeboten'),{first:'h',length:12})
  assert.deepEqual(hintDetails('ba\u0308ckt'),{first:'b',length:5})
  assert.deepEqual(hintDetails('… fährt!'),{first:'f',length:5})
})
test('German characters insert at caret and replace selections', () => {
  assert.deepEqual(insertCharacter('fahrt',1,2,'ä'),{value:'fährt',caret:2})
  assert.deepEqual(insertCharacter('ber',0,0,'ü'),{value:'über',caret:1})
  assert.deepEqual(insertCharacter('gro',3,3,'ß'),{value:'groß',caret:4})
})
test('retry before reveal, blank input and duplicate/stale actions cannot inflate scores', () => {
  let s=startChallenge(verbs,settings,0)
  s=act(s,'submit'); assert.equal(s.fields.infinitive.status,'empty'); assert.equal(s.answered,0)
  s=act(s,'edit',{value:'wrong'});s=act(s,'submit')
  assert.equal(s.fields.infinitive.status,'wrong');assert.equal(s.revealed,0)
  s=act(s,'edit',{value:answer(s)});s=act(s,'submit')
  assert.equal(s.score,2);assert.equal(s.retried,1)
  assert.deepEqual(act(s,'submit'),s)
  const next=act(s,'next',{random:0})
  assert.notEqual(next.verbId,s.verbId)
  assert.deepEqual(reduce(next,{type:'submit',form:'infinitive',turn:0}),next)
})
test('first-letter/length hints reduce points; reveal locks the answer at zero', () => {
  for(const [hints,points] of [[0,3],[1,1],[2,0]]){
    let s=startChallenge(verbs,settings,0)
    for(let i=0;i<hints;i++) s=act(s,'hint')
    s=act(s,'edit',{value:answer(s)});s=act(s,'submit')
    assert.equal(s.score,points);assert.equal(s.hinted,hints?1:0)
  }
  let s=startChallenge(verbs,settings,0);s=act(s,'reveal')
  assert.equal(s.revealed,1);assert.equal(s.score,0)
  assert.deepEqual(act(s,'edit',{value:answer(s)}),s)
  assert.deepEqual(act(s,'submit'),s)
})
test('complete mode validates each field independently and retains correct fields', () => {
  let s=startChallenge(verbs,{...settings,mode:'complete'},0)
  for(const form of forms){
    const expected=verbs.find(v=>v.id===s.verbId).forms[form].canonical
    s=act(s,'edit',{form,value:expected});s=act(s,'submit',{form})
  }
  assert.ok(finishedQuestion(s));assert.equal(s.score,15);assert.equal(s.answered,5)
  assert.deepEqual(act(s,'reveal',{form:'present'}),s)
})
test('coverage and review prioritize exact forms without starving other questions', () => {
  const pool=[{verbId:'a',form:'present'},{verbId:'a',form:'participle'},{verbId:'b',form:'present'}]
  const stats={'a:present':{seen:2,debt:0},'a:participle':{seen:1,debt:4},'b:present':{seen:0,debt:0}}
  assert.deepEqual(chooseTask(pool,stats,'a:present',2,0),pool[1])
  assert.deepEqual(chooseTask(pool,stats,'a:present',3,0),pool[2])
  assert.notDeepEqual(chooseTask(pool,stats,'a:participle',2,0),pool[1])
  assert.equal(startChallenge(verbs,{...settings,mode:'mixed'},0).pool.length,740)
  assert.notEqual(startChallenge(verbs,{...settings,mode:'mixed'},0.6).verbId,startChallenge(verbs,{...settings,mode:'mixed'},0).verbId)
})
test('missing forms, empty data, single-item pools, stop and restart are safe', () => {
  const subset=[{id:'x',cues:{en:'test'},forms:{infinitive:{canonical:'x',alternatives:[]}}}]
  let s=startChallenge(subset,{...settings,mode:'complete'},0)
  assert.deepEqual(Object.keys(s.fields),['infinitive'])
  s=reduceChallenge(s,{type:'reveal',form:'infinitive',turn:0},subset)
  s=reduceChallenge(s,{type:'next',turn:0,random:0},subset)
  assert.equal(s.verbId,'x');assert.equal(s.turn,1)
  assert.ok(startChallenge([] ,settings,0).ended)
  assert.ok(startChallenge(subset,{...settings,form:'perfect'},0).ended)
  const stopped=reduceChallenge(s,{type:'end'},subset)
  assert.deepEqual(reduceChallenge(stopped,{type:'submit',turn:1,form:'infinitive'},subset),stopped)
  assert.equal(startChallenge(subset,settings,0).score,0)
})

test('complete practice reviews all fields, reveals unfinished forms, and allows skipping', () => {
  let state = startChallenge(verbs, { ...settings, mode: 'complete' }, 0)
  const verb = verbs.find(v => v.id === state.verbId)
  state = reduce(state, { type: 'edit', form: 'infinitive', turn: 0, value: verb.forms.infinitive.canonical })
  state = reduce(state, { type: 'edit', form: 'present', turn: 0, value: 'wrong' })
  state = reduce(state, { type: 'review-all', turn: 0 })
  assert.equal(state.fields.infinitive.status, 'correct')
  assert.equal(state.fields.present.status, 'wrong')
  assert.equal(state.fields.perfect.status, 'empty')
  const correct = state.fields.infinitive
  state = reduce(state, { type: 'reveal-all', turn: 0 })
  assert.equal(state.fields.infinitive, correct)
  assert.ok(finishedQuestion(state))
  assert.equal(state.fields.present.status, 'revealed')
  const reviewed = state
  state = reduce(state, { type: 'reveal-all', turn: 0 })
  assert.deepEqual(state, reviewed)
  state = reduce(state, { type: 'next', turn: 0, random: 0 })
  const next = state
  assert.deepEqual(reduce(state, { type: 'review-all', turn: 0 }), next)
  state = reduce(state, { type: 'next', turn: 1, random: 0 })
  assert.equal(state.turn, 2)
  assert.ok(Object.values(state.fields).every(f => f.status === 'editing'))
  const single = startChallenge(verbs, settings, 0)
  assert.equal(reduce(single, { type: 'next', turn: 0, random: 0 }), single)
  assert.equal(reduce(single, { type: 'reveal-all', turn: 0 }), single)
})
