import { useState } from 'react'
import { useI18n } from './i18n'
import { readChallengePreferences, saveChallengePreferences, type ChallengePreferences } from './challenge-settings'
import { forms, type Form } from './verb-challenge'
import { germanFormLabels, modeLabels } from './VerbChallenge'

export default function ChallengeSettings() {
  const { t } = useI18n()
  const [preferences, setPreferences] = useState(readChallengePreferences)
  const update = (next: ChallengePreferences) => { setPreferences(next); saveChallengePreferences(next) }
  return <section className="settings-card challenge-preferences" aria-labelledby="challenge-settings-title">
    <h2 id="challenge-settings-title">{t('Translation Challenge')}</h2>
    <p className="small-note">{t('Changing these settings restarts a Translation Challenge in progress.')}</p>
    <label htmlFor="challenge-variation">{t('Challenge variation')}</label>
    <select id="challenge-variation" value={preferences.mode} onChange={e => update({ ...preferences, mode: e.target.value as ChallengePreferences['mode'] })}>
      {(['single', 'mixed'] as const).map(mode => <option key={mode} value={mode}>{t(modeLabels[mode])}</option>)}
    </select>
    {preferences.mode === 'single' && <>
      <label htmlFor="challenge-form">{t('Target form')}</label>
      <select id="challenge-form" value={preferences.form} onChange={e => update({ ...preferences, form: e.target.value as Form })}>
        {forms.map(form => <option key={form} value={form}>{t(germanFormLabels[form])}</option>)}
      </select>
    </>}
    <p className="small-note">{t('Prompts use the interface language when available, otherwise English.')}</p>
  </section>
}
