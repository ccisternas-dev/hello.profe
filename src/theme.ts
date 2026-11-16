/** Colour theme preference. "system" follows the device setting; the resolved theme is set on <html data-theme>. */
export type ThemePreference = 'system' | 'light' | 'dark'
export type Theme = 'light' | 'dark'
export const themeStorageKey = 'hello-profe-theme'
export const themePreferences: readonly ThemePreference[] = ['system', 'light', 'dark']
const darkQuery = '(prefers-color-scheme: dark)'

export const parseThemePreference = (raw: string | null): ThemePreference => raw === 'light' || raw === 'dark' ? raw : 'system'
export const resolveTheme = (preference: ThemePreference, systemDark: boolean): Theme =>
  preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

export function readThemePreference(): ThemePreference {
  try { return parseThemePreference(localStorage.getItem(themeStorageKey)) } catch { return 'system' }
}
export function saveThemePreference(preference: ThemePreference) {
  try { localStorage.setItem(themeStorageKey, preference) } catch { /* The choice still applies for this visit. */ }
}
export function applyTheme(preference: ThemePreference) {
  document.documentElement.dataset.theme = resolveTheme(preference, window.matchMedia(darkQuery).matches)
}
/** Re-applies the theme when the device setting changes, unless the learner chose Light or Dark. */
export function followSystemTheme() {
  window.matchMedia(darkQuery).addEventListener('change', () => applyTheme(readThemePreference()))
}
