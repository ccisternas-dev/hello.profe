import { useEffect, useRef, useState } from "react"
import { Button } from "./components"
import { useI18n } from "./i18n"
import VerbChallenge, { type TrainingLanguage } from "./VerbChallenge"
import VerbFlashcards from "./VerbFlashcards"
import LearningDashboard, { learningPathTitles, type LearningPath } from "./LearningDashboard"

export default function StudyPractice({ onFlashcards }: { onFlashcards: () => void }) {
  const { t } = useI18n()

  const [target, setTarget] = useState<TrainingLanguage>("de")
  const languageNames = {de: "German", nl: "Dutch", en: "English"} as const
  const levelLabels = {de: "German · B2", nl: "Dutch · B2", en: "English · B2"} as const
  const [mode, setMode] = useState<LearningPath | null>(null)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    document.getElementById(mode ? "learning-content" : "learning-modes-title")?.focus()
  }, [mode])
  return (
    <main className="page practice-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">{t(levelLabels[target])}</span>
          <h1>{t(mode ? learningPathTitles[mode] : "Your learning dashboard")}</h1>
          {mode === null && <p>
            {t(
              "Choose a path and practice at your own pace.",
            )}
          </p>}
        </div>
      </div>
      {mode === null && import.meta.env.DEV && <label className="locale-selector">
        <span>{t('Training language')}</span>
        <select value={target} onChange={event => setTarget(event.target.value as TrainingLanguage)}>
          {(['de', 'nl', 'en'] as const).map(language => <option key={language} value={language}>{t(languageNames[language])}</option>)}
        </select>
      </label>}
      {mode === null ? <LearningDashboard onSelect={path => path === "flashcards" ? onFlashcards() : setMode(path)} /> : <>
        <div className="learning-path-toolbar">
          <Button variant="text" icon="back" onClick={() => setMode(null)}>{t("Back to learning modes")}</Button>
          {mode !== "flashcards" && <p className="small-note">{t("Returning to learning modes or leaving this screen resets the current session.")}</p>}
        </div>
        <section id="learning-content" tabIndex={-1} aria-label={t(learningPathTitles[mode])}>
          {mode !== "flashcards" ? <VerbChallenge target={target} key={`${mode}:${target}`} path={mode === "complete" ? "complete" : "translation"} /> : <VerbFlashcards />}
        </section>
      </>}
    </main>
  )
}
