export const grammarTopics = ['articles', 'pronouns', 'prepositions', 'aduso', 'adjectives', 'connectors'] as const
export type GrammarTopic = typeof grammarTopics[number]
export type GrammarTableData = {
  id: string; language: string; level: string; topic: GrammarTopic; reviewed: boolean
  title: string; columns: string[]; rows: string[][]; notes: string[]
}

/** Approved tables, filtered by language and topic ("" means all). */
export function filterGrammarTables(tables: GrammarTableData[], language: string, topic: string) {
  return tables.filter(table => table.reviewed && (!language || table.language === language) && (!topic || table.topic === topic))
}
export const isGrammarTopic = (value: string): value is GrammarTopic => (grammarTopics as readonly string[]).includes(value)
