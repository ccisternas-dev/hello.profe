import { forms, type Form } from './verb-challenge.ts'

/** Translation Challenge options chosen on the Settings page. The prompt language follows the interface language. */
export type ChallengePreferences = { mode: 'single' | 'mixed'; form: Form }
export const challengePreferencesKey = 'hello-profe-translation-challenge'
export const defaultChallengePreferences: ChallengePreferences = { mode: 'single', form: 'infinitive' }

export function parseChallengePreferences(raw: string | null): ChallengePreferences {
  try {
    const value = JSON.parse(raw || 'null')
    const mode = value?.mode === 'mixed' ? 'mixed' : value?.mode === 'single' ? 'single' : null
    const form = forms.includes(value?.form) ? value.form as Form : null
    if (mode && form) return { mode, form }
  } catch { /* Fall back to defaults for missing or malformed data. */ }
  return defaultChallengePreferences
}
export function readChallengePreferences(): ChallengePreferences {
  try { return parseChallengePreferences(localStorage.getItem(challengePreferencesKey)) } catch { return defaultChallengePreferences }
}
export function saveChallengePreferences(preferences: ChallengePreferences) {
  try { localStorage.setItem(challengePreferencesKey, JSON.stringify(preferences)) } catch { /* In-memory choices still work. */ }
}
