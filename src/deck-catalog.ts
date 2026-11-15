export type StudyCard = {
  id: string; deckId: string; prompt: string; answer: string; detail: string
  translations: Partial<Record<'en' | 'es' | 'fr' | 'de' | 'nl', string>>
}
export type StudyDeck = {
  id: string; title: string; cards: StudyCard[]
  language?: string; level?: string; topic?: string
  // Missing approval is treated as unreviewed.
  reviewed?: boolean
}
export type DeckFilters = { language: string; level: string; topic: string }
export function availableDecks<T extends StudyDeck>(decks: T[], production: boolean): T[] {
  return decks.filter(deck => !production || deck.reviewed === true)
}
export function filterDecks<T extends StudyDeck>(decks: T[], filters: DeckFilters): T[] {
  return decks.filter(deck => (!filters.language || deck.language === filters.language)
    && (!filters.level || deck.level === filters.level) && (!filters.topic || deck.topic === filters.topic))
}

// The verb reference screen groups several workbook form rows into one card.
export function countStudyCards(deck: StudyDeck): number {
  return deck.id === 'irregular-verbs'
    ? new Set(deck.cards.map(card => card.prompt.split(' — ')[0])).size
    : deck.cards.length
}
