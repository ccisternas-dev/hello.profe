import { useState } from "react"
import { Button, Icon } from "./components"
import { useI18n, type MessageKey } from "./i18n"
import data from "./data/study-decks.json"
import overrides from "./data/verb-overrides.json"
import { buildVerbs, type Form } from "./verb-challenge"

const cards = data.decks.find(deck => deck.id === "irregular-verbs")?.cards || []
// Keep workbook translations free of the disambiguation hints used in challenges.
const verbs = buildVerbs(cards, { ...overrides, cues: {} })
const principalForms: { form: Form; label: MessageKey }[] = [
  { form: "infinitive", label: "Infinitive" },
  { form: "preterite", label: "Präteritum (er/sie/es)" },
  { form: "perfect", label: "Perfekt (er/sie/es)" },
  { form: "participle", label: "Partizip II" },
]
const languages = ["en", "es", "fr"] as const
const languageLabels = { en: "English", es: "Spanish", fr: "French" } as const

export default function VerbFlashcards() {
  const { t } = useI18n()
  const [index, setIndex] = useState(0)
  const verb = verbs[index]
  if (!verb) return <p>{t("No cards available in this deck.")}</p>
  return (
    <div className="verb-flashcards">
      <article className="verb-reference-card" aria-labelledby="verb-reference-title" aria-live="polite" aria-atomic="true">
        <div className="verb-reference-heading"><Icon name="book" /><span>{t("German verb · irregular")}</span></div>
        <h2 id="verb-reference-title" lang="de">{verb.id}</h2>
        <dl className="verb-translations">
          {languages.map(language => verb.cues[language] && <div key={language}>
            <dt>{t(languageLabels[language])}</dt>
            <dd lang={language}>{verb.cues[language]}</dd>
          </div>)}
        </dl>
        {verb.forms.present && <p className="verb-present"><span>{t("Präsens (er/sie/es)")}</span><strong lang="de">{verb.forms.present.canonical}</strong></p>}
        <h3 className="verb-matrix-title">{t("Principal forms")}</h3>
        <dl className="verb-form-matrix">
          {principalForms.map(({ form, label }) => {
            const answer = verb.forms[form]
            return answer && <div key={form}>
              <dt>{t(label)}</dt>
              <dd lang="de">{[answer.canonical, ...answer.alternatives].join(" / ")}</dd>
            </div>
          })}
        </dl>
        {verb.forms.present && verb.forms.present.alternatives.length > 0 && <p className="verb-present-alternatives">
          {t("Alternative present forms")}<span lang="de">{verb.forms.present.alternatives.join(" / ")}</span>
        </p>}
      </article>
      <nav className="verb-card-navigation" aria-label={t("Verb cards")}>
        <Button variant="secondary" icon="back" disabled={index === 0} onClick={() => setIndex(index - 1)}>{t("Previous card")}</Button>
        <Button className="verb-next-card" icon="arrow" disabled={index === verbs.length - 1} onClick={() => setIndex(index + 1)}>{t("Next card")}</Button>
      </nav>
      <p className="verb-card-position">{t("Verb {current} of {total}", { current: index + 1, total: verbs.length })}</p>
    </div>
  )
}
