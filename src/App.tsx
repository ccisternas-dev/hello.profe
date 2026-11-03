import { useI18n, LocaleSelector, type MessageKey } from "./i18n"
import StudyPractice from "./StudyPractice"
import TranslationView from "./TranslationView"
import VerbFlashcards from "./VerbFlashcards"
import { useEffect, useRef, useState } from "react"
import {
  Alert,
  Badge,
  Button,
  Chip,
  Dialog,
  EmptyState,
  Field,
  Icon,
  IconButton,
  LanguageSelect,
  PageHeader,
  SearchField,
  Skeleton,
  Tabs,
  Toast,
} from "./components"

type View = "translate" | "explore" | "notebook" | "practice" | "flashcards" | "settings"

const languages: MessageKey[] = [
  "English",
  "Spanish",
  "German",
  "French",
  "Dutch",
]

function Logo() {
  return (
    <div className="logo" aria-label="hello.profe">
      <svg viewBox="0 0 34 34" aria-hidden="true">
        <path d="M5 7h15a7 7 0 0 1 7 7v1a7 7 0 0 1-7 7h-6l-7 5 2-6a7 7 0 0 1-6-7V9a2 2 0 0 1 2-2Z" />
        <path d="M19 14h7a5 5 0 0 1 5 5v1a5 5 0 0 1-5 5h-2l1 4-5-4h-1a5 5 0 0 1 0-11Z" />
      </svg>
      <span>
        hello<span>.</span>profe
      </span>
    </div>
  )
}

function AppShell({
  view,
  setView,
  children,
}: {
  view: View
  setView: (view: View) => void
  children: React.ReactNode
}) {
  const { t } = useI18n()

  const primaryNav: {
    id: View
    label: MessageKey
    icon: "translate" | "book" | "practice" | "cards" | "settings"
  }[] = [
    { id: "translate", label: "Translate", icon: "translate" },
    { id: "notebook", label: "Notebook", icon: "book" },
    { id: "practice", label: "Practice", icon: "practice" },
    { id: "flashcards", label: "Flashcards", icon: "cards" },
    { id: "settings", label: "Settings", icon: "settings" },
  ]

  const mobileNav = primaryNav.filter(item => item.id !== "notebook")
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  useEffect(() => {
    const viewport = window.visualViewport
    const update = () => {
      const active = document.activeElement
      const editing = active instanceof HTMLElement && (active.matches('input, textarea') || active.isContentEditable)
      setKeyboardOpen(!!viewport && editing && window.innerHeight - viewport.height > 150)
    }
    viewport?.addEventListener("resize", update)
    document.addEventListener("focusin", update)
    document.addEventListener("focusout", update)
    return () => {
      viewport?.removeEventListener("resize", update)
      document.removeEventListener("focusin", update)
      document.removeEventListener("focusout", update)
    }
  }, [])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t("Skip to main content")}
      </a>
      <aside className="sidebar">
        <Logo />
        <nav aria-label={t("Main navigation")}>
          {primaryNav.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`nav-item ${
                view === item.id ||
                (view === "explore" && item.id === "translate")
                  ? "selected"
                  : ""
              }`}
              aria-current={
                view === item.id ||
                (view === "explore" && item.id === "translate")
                  ? "page"
                  : undefined
              }
              onClick={() => setView(item.id)}
            >
              <Icon name={item.icon} />
              <span>{t(item.label)}</span>
            </button>
          ))}
        </nav>
        <div className="offline-note">
          <span className="status-dot" />
          <div>
            <strong>{t("Saved on this device")}</strong>
            <small>{t("No account needed")}</small>
          </div>
        </div>
      </aside>

      <header className="mobile-header">
        <Logo />
      </header>

      <div className="content-shell" id="main-content" tabIndex={-1}>
        {view !== "settings" && <div className="locale-toolbar"><LocaleSelector /></div>}
        {["explore", "notebook"].includes(view) && (
          <div className="prototype-notice" role="note">
            {t(
              "Interface prototype — translation and notebook features are simulated. Use Practice for the working German trainer.",
            )}
          </div>
        )}
        {children}
      </div>

      <nav className="bottom-nav" hidden={keyboardOpen} aria-label={t("Mobile navigation")}>
        {mobileNav.map((item) => (
          <button
            type="button"
            key={item.id}
            className={
              view === item.id ||
              (view === "explore" && item.id === "translate")
                ? "selected"
                : ""
            }
            aria-current={
              view === item.id ||
              (view === "explore" && item.id === "translate")
                ? "page"
                : undefined
            }
            onClick={() => setView(item.id)}
          >
            <Icon name={item.icon} />
            <span>{t(item.label)}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function ExploreView({
  onBack,
  onSave,
  saved,
}: {
  onBack: () => void
  onSave: () => void
  saved: boolean
}) {
  const { t } = useI18n()

  const [tab, setTab] = useState("Meanings")
  const [showConjugation, setShowConjugation] = useState(true)
  const conjugations = [
    ["yo", "aprendo", "aprendí"],
    ["tú", "aprendes", "aprendiste"],
    ["él / ella / usted", "aprende", "aprendió"],
    ["nosotros / nosotras", "aprendemos", "aprendimos"],
    ["vosotros / vosotras", "aprendéis", "aprendisteis"],
    ["ellos / ellas / ustedes", "aprenden", "aprendieron"],
  ]

  return (
    <main className="page explore-page">
      <Button variant="text" icon="back" onClick={onBack}>
        {t("Back to translation")}
      </Button>
      <div className="word-hero">
        <div>
          <div className="word-meta">
            <Badge tone="language">{t("Spanish")}</Badge>
            <Badge>{t("verb")}</Badge>
          </div>
          <h1 lang="es">aprender</h1>
          <p className="pronunciation">
            /a.pɾenˈdeɾ/{" "}
            <Button
              variant="icon"
              icon="audio"
              label={t("Play pronunciation")}
            />
          </p>
        </div>
        <Button
          variant={saved ? "secondary" : "primary"}
          icon={saved ? "check" : "bookmark"}
          onClick={onSave}
          label={saved ? t("Saved") : t("Save word")}
        >
          {saved ? t("Saved") : t("Save word")}
        </Button>
      </div>

      <Tabs
        items={["Meanings", "Conjugation", "Examples"]}
        selected={tab}
        onChange={setTab}
      />

      <div className="detail-layout">
        <div className="detail-main">
          {tab === "Meanings" && (
            <>
              <section className="detail-card">
                <div className="meaning-heading">
                  <span className="meaning-number">1</span>
                  <div>
                    <h2 lang="en">to learn</h2>
                    <p lang="en">
                      To gain knowledge or skill through study or experience.
                    </p>
                  </div>
                </div>
                <div className="example">
                  <span>{t("Example")}</span>
                  <p lang="es">Quiero aprender español este año.</p>
                  <p lang="en">I want to learn Spanish this year.</p>
                </div>
                <div className="synonyms">
                  <span>{t("Similar meaning")}</span>
                  <span lang="es">
                    <Chip>estudiar</Chip>
                  </span>
                  <span lang="es">
                    <Chip>descubrir</Chip>
                  </span>
                </div>
              </section>
              <section className="detail-card">
                <div className="meaning-heading">
                  <span className="meaning-number">2</span>
                  <div>
                    <h2 lang="en">to find out</h2>
                    <p lang="en">
                      To become aware of a fact or piece of information.
                    </p>
                  </div>
                </div>
                <div className="example">
                  <span>{t("Example")}</span>
                  <p lang="es">Aprendí la noticia esta mañana.</p>
                  <p lang="en">I found out the news this morning.</p>
                </div>
              </section>
            </>
          )}

          {tab === "Conjugation" && (
            <section className="detail-card">
              <div className="table-heading">
                <div>
                  <span className="eyebrow">{t("Indicative")}</span>
                  <h2>{t("Common forms")}</h2>
                </div>
                <Button
                  variant="text"
                  icon={showConjugation ? "chevronUp" : "chevronDown"}
                  onClick={() => setShowConjugation(!showConjugation)}
                >
                  {showConjugation ? t("Collapse") : t("Expand")}
                </Button>
              </div>
              {showConjugation && (
                <div
                  className="table-scroll"
                  tabIndex={0}
                  aria-label={t("Scrollable conjugation table")}
                >
                  <table>
                    <thead>
                      <tr>
                        <th>{t("Pronoun")}</th>
                        <th>{t("Present")}</th>
                        <th>{t("Preterite")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conjugations.map((row) => (
                        <tr key={row[0]}>
                          {row.map((cell) => (
                            <td key={cell} lang="es">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {tab === "Examples" && (
            <section className="detail-card">
              <h2>{t("Examples in context")}</h2>
              <div className="example-list">
                <div>
                  <p lang="es">Estamos aprendiendo a cocinar juntos.</p>
                  <span lang="en">We are learning to cook together.</span>
                </div>
                <div>
                  <p lang="es">Nunca es tarde para aprender algo nuevo.</p>
                  <span lang="en">
                    It is never too late to learn something new.
                  </span>
                </div>
                <div>
                  <p lang="es">Aprende de tus errores.</p>
                  <span lang="en">Learn from your mistakes.</span>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="detail-aside">
          <div className="source-card">
            <Icon name="book" />
            <div>
              <strong>{t("Dictionary facts")}</strong>
              <p>
                {t("Meanings and forms adapted from open dictionary data.")}
              </p>
              <Button variant="text">{t("View sources")}</Button>
            </div>
          </div>
          <div className="source-card source-card--generated">
            <Icon name="spark" />
            <div>
              <strong>{t("Generated explanation")}</strong>
              <p>
                {t("Examples are illustrative and may require verification.")}
              </p>
            </div>
          </div>
          <Field
            label={t("Your context sentence")}
            hint={t("Optional · saved only on this device")}
          >
            <textarea
              placeholder={t("Add a sentence that helps you remember…")}
              lang="es"
              defaultValue="Quiero aprender español este año."
            />
          </Field>
          <Alert tone="neutral" title={t("Information unavailable")}>
            {t("Regional usage notes are not available for this word.")}
          </Alert>
        </aside>
      </div>
    </main>
  )
}

function NotebookView({
  saved,
  onExplore,
  onDelete,
}: {
  saved: boolean
  onExplore: () => void
  onDelete: () => void
}) {
  const { t, plural } = useI18n()

  const [search, setSearch] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <main className="page notebook-page">
      <PageHeader
        eyebrow={t("Vocabulary notebook")}
        title={t("Words worth keeping")}
        description={t(
          "Your entries are stored only on this device and remain available offline.",
        )}
        actions={
          <>
            <Button variant="secondary" icon="import">
              {t("Import")}
            </Button>
            <Button variant="secondary" icon="export">
              {t("Export")}
            </Button>
          </>
        }
      />
      {saved ? (
        <>
          <div className="notebook-tools">
            <SearchField
              label={t("Search saved vocabulary")}
              value={search}
              onChange={setSearch}
              placeholder={t("Search words or examples…")}
            />
            <div className="filter-row">
              <Chip selected>{t("All languages")}</Chip>
              <Chip>{t("Spanish")}</Chip>
              <Chip>{t("German")}</Chip>
              <Chip>{t("Verbs")}</Chip>
            </div>
          </div>
          <div className="notebook-count">
            <span>
              {plural("{count} saved word", "{count} saved words", 1)}
            </span>
            <span>{t("Last updated today")}</span>
          </div>
          <article className="vocab-card">
            <button type="button" className="vocab-main" onClick={onExplore}>
              <div className="vocab-word">
                <Badge tone="language">{t("Spanish")}</Badge>
                <h2 lang="es">aprender</h2>
                <span>
                  {t("verb")} · <span lang="en">to learn</span>
                </span>
              </div>
              <div className="personal-example">
                <span>{t("Your example")}</span>
                <p lang="es">Quiero aprender español este año.</p>
              </div>
              <Icon name="chevronRight" />
            </button>
            <div className="vocab-actions">
              <IconButton label={t("Edit aprender")} icon="edit" />
              <IconButton
                label={t("Delete aprender")}
                icon="trash"
                onClick={() => setDeleteOpen(true)}
              />
            </div>
          </article>
        </>
      ) : (
        <EmptyState
          icon="bookmark"
          title={t("Your notebook is ready")}
          description={t(
            "Save a translation or a word you explore. Add your own example to make it easier to remember.",
          )}
          action={
            <Button variant="primary" icon="translate">
              {t("Translate your first word")}
            </Button>
          }
        />
      )}
      <Dialog
        open={deleteOpen}
        title={t("Delete “aprender”?")}
        description={t(
          "This removes the word and your personal example from this device. This action cannot be undone.",
        )}
        confirmLabel={t("Delete word")}
        destructive
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false)
          onDelete()
        }}
      />
    </main>
  )
}

export default function App() {
  const { t } = useI18n()

  const [view, setView] = useState<View>("practice")
  const initialView = useRef(true)
  const [saved, setSaved] = useState(() => {
    try {
      return window.localStorage.getItem("hello-profe-saved") === "true"
    } catch {
      return false
    }
  })
  const [toast, setToast] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem("hello-profe-saved", String(saved))
    } catch {
      /* Storage may be unavailable. */
    }
  }, [saved])

  useEffect(() => {
    if (initialView.current) {
      initialView.current = false
      return
    }
    document.getElementById("main-content")?.focus()
  }, [view])

  const saveWord = () => {
    setSaved(true)
    setToast(true)
  }

  return (
    <AppShell view={view} setView={setView}>
      {view === "translate" && (
        <TranslationView />
      )}
      {view === "explore" && (
        <ExploreView
          onBack={() => setView("translate")}
          onSave={saveWord}
          saved={saved}
        />
      )}
      {view === "notebook" && (
        <NotebookView
          saved={saved}
          onExplore={() => setView("explore")}
          onDelete={() => setSaved(false)}
        />
      )}
      {view === "practice" && <StudyPractice onFlashcards={() => setView("flashcards")} />}
      {view === "flashcards" && <main className="page">
        <PageHeader eyebrow={t("German · B2")} title={t("Flashcards")} description={t("Read German verbs, their forms and translations at your own pace.")} />
        <p className="small-note">{t("Leaving this screen resets the current card position.")}</p>
        <VerbFlashcards />
      </main>}
      {view === "settings" && <main className="page settings-page">
        <PageHeader eyebrow="" title={t("Settings")} description={t("Choose the language used throughout the website.")} />
        <section className="settings-card" aria-label={t("Interface language")}>
          <LocaleSelector />
          <p className="small-note">{t("Your language preference is saved in this browser when storage is available.")}</p>
        </section>
      </main>}
      <Toast
        open={toast}
        onClose={() => setToast(false)}
        title={t("Saved to notebook")}
        description={t("Prototype notebook updated.")}
        action={
          <Button variant="text" onClick={() => setView("notebook")}>
            {t("View notebook")}
          </Button>
        }
      />
    </AppShell>
  )
}
