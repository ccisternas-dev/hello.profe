import test from 'node:test'
import assert from 'node:assert/strict'
import { startSession, sessionReducer, shuffle } from '../src/study-session.ts'

test('rating requires reveal and duplicate submissions cannot change totals', () => {
  let state = startSession(['a', 'b'])
  const rate = { type: 'rate', id: 'a', value: 'again' }
  assert.deepEqual(sessionReducer(state, rate), state)
  state = sessionReducer(state, { type: 'reveal' })
  state = sessionReducer(state, rate)
  assert.deepEqual(sessionReducer(state, { ...rate, value: 'remembered' }), state)
  state = sessionReducer(state, { type: 'move', delta: 1 })
  assert.equal(state.revealed, false)
  assert.deepEqual(sessionReducer(state, rate), state)
})
test('mixed, all-Again and all-Remembered rounds have correct review queues', () => {
  for (const values of [['again','remembered'], ['again','again'], ['remembered','remembered']]) {
    let state = startSession(['a', 'b'])
    for (const [index, value] of values.entries()) {
      state = sessionReducer(state, { type: 'reveal' })
      state = sessionReducer(state, { type: 'rate', id: state.order[index], value })
      if (!index) state = sessionReducer(state, { type: 'move', delta: 1 })
    }
    const again = state.order.filter(id => state.ratings[id] === 'again')
    assert.equal(again.length, values.filter(v => v === 'again').length)
    assert.equal(Object.keys(state.ratings).length, 2)
    const review = sessionReducer(state, { type: 'start', order: again })
    assert.deepEqual(review.ratings, {})
    assert.equal(review.revealed, false)
  }
})
test('navigation is bounded for single-card and empty decks', () => {
  for (const ids of [[], ['a']]) for (const delta of [-1, 1]) {
    assert.equal(sessionReducer(startSession(ids), { type: 'move', delta }).index, 0)
  }
})
test('shuffle preserves membership without mutating input', () => {
  const input = ['a','b','c','d']
  const output = shuffle(input, () => 0.5)
  assert.deepEqual([...output].sort(), input)
  assert.deepEqual(input, ['a','b','c','d'])
  assert.deepEqual(shuffle([]), [])
})
