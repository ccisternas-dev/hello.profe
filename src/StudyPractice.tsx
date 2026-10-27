import { useEffect, useRef, useState } from "react"
import { Button } from "./components"
import { useI18n } from "./i18n"
import VerbChallenge from "./VerbChallenge"
import VerbFlashcards from "./VerbFlashcards"
import LearningDashboard, { learningPathTitles, type LearningPath } from "./LearningDashboard"

export default function StudyPractice() {
  const { t } = useI18n()

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
          <span className="eyebrow">{t("German · B2")}</span>
          <h1>{t("Your learning dashboard")}</h1>
          <p>
            {t(
              "Choose a path and practice at your own pace.",
            )}
          </p>
        </div>
      </div>
      {mode === null ? <LearningDashboard onSelect={setMode} /> : <>
        <div className="learning-path-toolbar">
          <Button variant="text" icon="back" onClick={() => setMode(null)}>{t("Back to learning modes")}</Button>
          {mode !== "flashcards" && <p className="small-note">{t("Returning to learning modes or leaving this screen resets the current session.")}</p>}
        </div>
        <section id="learning-content" tabIndex={-1} aria-label={t(learningPathTitles[mode])}>
          {mode !== "flashcards" ? <VerbChallenge key={mode} path={mode === "complete" ? "complete" : "translation"} /> : <VerbFlashcards />}
        </section>
      </>}
    </main>
  )
}
