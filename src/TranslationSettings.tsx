import { useState } from 'react'
import { useI18n } from './i18n'
import { emailStorageKey, readPreference, savePreference } from './translation-client'

export default function TranslationSettings() {
  const { t } = useI18n()
  const [email, setEmail] = useState(() => readPreference(emailStorageKey))
  const [invalid, setInvalid] = useState(false)
  return <section className="settings-card">
    <label className="locale-selector" htmlFor="mymemory-email">{t('MyMemory email (optional)')}</label>
    <input id="mymemory-email" type="email" autoComplete="email" value={email}
      aria-describedby="mymemory-email-help" aria-invalid={invalid}
      onChange={event => {
        setEmail(event.target.value)
        const valid = event.target.validity.valid
        setInvalid(!valid)
        savePreference(emailStorageKey, valid ? event.target.value.trim() : '')
      }} />
    <p id="mymemory-email-help" className="small-note">{t('Saved in this browser and sent only to MyMemory to increase the free daily allowance. Leave blank to use MyMemory anonymously.')}</p>
    {invalid && <p role="alert">{t('Enter a valid email address or leave this field blank.')}</p>}
  </section>
}
