export type StudyCard = {
  id: string; deckId: string; prompt: string; answer: string; detail: string
  translations: Partial<Record<'en' | 'es' | 'fr' | 'de' | 'nl', string>>
}
export type StudyDeck = {
  id: string; title: string; cards: StudyCard[]
  language?: string; level?: string; topic?: string
  // Omitted only for legacy workbook content awaiting independent review (#5).
  reviewed?: boolean
}
export type DeckFilters = { language: string; level: string; topic: string }
export function availableDecks<T extends StudyDeck>(decks: T[], production: boolean): T[] {
  return decks.filter(deck => !production || deck.reviewed !== false)
}
export function filterDecks<T extends StudyDeck>(decks: T[], filters: DeckFilters): T[] {
  return decks.filter(deck => (!filters.language || deck.language === filters.language)
    && (!filters.level || deck.level === filters.level) && (!filters.topic || deck.topic === filters.topic))
}
