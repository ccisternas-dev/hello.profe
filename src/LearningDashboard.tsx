import { Icon, type IconName } from "./components"
import { useI18n, type MessageKey } from "./i18n"

export type LearningPath = "challenge" | "complete" | "flashcards"
export const learningPathTitles: Record<LearningPath, MessageKey> = {
  challenge: "Translation Challenge",
  complete: "Complete the Verb",
  flashcards: "Flashcards",
}
const paths: {
  id: LearningPath
  icon: IconName
  description: MessageKey
  badge: MessageKey
}[] = [
  { id: "challenge", icon: "translate", description: "See the meaning, recall the German form. Type the answer.", badge: "Recommended" },
  { id: "complete", icon: "forms", description: "Fill in the supplied German verb forms, one field at a time.", badge: "Build forms" },
  { id: "flashcards", icon: "cards", description: "Read German verbs, their forms and translations at your own pace.", badge: "Memorize verbs" },
]

export default function LearningDashboard({ onSelect }: { onSelect: (path: LearningPath) => void }) {
  const { t } = useI18n()
  return (
    <section className="learning-modes" aria-labelledby="learning-modes-title">
      <header className="learning-modes-header">
        <h2 id="learning-modes-title" tabIndex={-1}>{t("Learning Modes")}</h2>
        <span>{t("{count} distinct paths", { count: paths.length })}</span>
      </header>
      <div className="learning-mode-list">
        {paths.map(path => (
          <button
            key={path.id}
            type="button"
            className={`learning-mode-card learning-mode-card--${path.id}`}
            onClick={() => onSelect(path.id)}
            aria-labelledby={`learning-title-${path.id}`}
            aria-describedby={`learning-description-${path.id} learning-badge-${path.id}`}
          >
            <span className="learning-mode-icon"><Icon name={path.icon} /></span>
            <span className="learning-mode-copy">
              <span className="learning-mode-title-row">
                <span className="learning-mode-title" id={`learning-title-${path.id}`}>{t(learningPathTitles[path.id])}</span>
                {path.id !== "challenge" && <span className="learning-mode-tag" id={`learning-badge-${path.id}`}>{t(path.badge)}</span>}
              </span>
              <span className="learning-mode-description" id={`learning-description-${path.id}`}>{t(path.description)}</span>
            </span>
            {path.id === "challenge"
              ? <span className="learning-mode-recommended" id={`learning-badge-${path.id}`}>{t(path.badge)}</span>
              : <span className="learning-mode-chevron"><Icon name="chevronRight" /></span>}
          </button>
        ))}
      </div>
    </section>
  )
}
