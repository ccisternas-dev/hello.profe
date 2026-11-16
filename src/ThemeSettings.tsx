import { useState } from 'react'
import { useI18n, type MessageKey } from './i18n'
import { applyTheme, readThemePreference, saveThemePreference, themePreferences, type ThemePreference } from './theme'

const labels: Record<ThemePreference, MessageKey> = { system: 'Match device', light: 'Light', dark: 'Dark' }

export default function ThemeSettings() {
  const { t } = useI18n()
  const [preference, setPreference] = useState(readThemePreference)
  const choose = (next: ThemePreference) => { setPreference(next); saveThemePreference(next); applyTheme(next) }
  return <section className="settings-card theme-settings">
    <fieldset>
      <legend>{t('Theme')}</legend>
      <div className="theme-options">
        {themePreferences.map(option => <label key={option} className="theme-option">
          <input type="radio" name="theme" value={option} checked={preference === option} onChange={() => choose(option)} />
          <span>{t(labels[option])}</span>
        </label>)}
      </div>
    </fieldset>
    <p className="small-note">{t('Match device follows your phone or computer setting. Device high-contrast settings are also respected.')}</p>
  </section>
}
