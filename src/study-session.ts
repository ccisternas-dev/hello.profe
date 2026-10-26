export type Session = {
  order: string[]
  index: number
  revealed: boolean
  ratings: Record<string, 'again' | 'remembered'>
}
export type Action =
  | { type: 'reveal' }
  | { type: 'move'; delta: number }
  | { type: 'rate'; value: 'again' | 'remembered'; id: string }
  | { type: 'start'; order: string[] }

export function startSession(order: string[]): Session {
  return { order: [...order], index: 0, revealed: false, ratings: {} }
}
export function sessionReducer(state: Session, action: Action): Session {
  if (action.type === 'start') return startSession(action.order)
  if (action.type === 'reveal') return { ...state, revealed: true }
  if (action.type === 'move') return {
    ...state, index: Math.max(0, Math.min(state.order.length - 1, state.index + action.delta)), revealed: false,
  }
  if (!state.revealed || state.order[state.index] !== action.id || state.ratings[action.id]) return state
  return { ...state, ratings: { ...state.ratings, [action.id]: action.value } }
}
export function shuffle<T>(items: T[], random = Math.random): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
