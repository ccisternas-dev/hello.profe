import { useI18n, LocaleSelector, type MessageKey } from "./i18n"
import StudyPractice from "./StudyPractice"
import TranslationView from "./TranslationView"
import TranslationSettings from "./TranslationSettings"
import ChallengeSettings from "./ChallengeSettings"
import ThemeSettings from "./ThemeSettings"
import GrammarTables from "./GrammarTables"
import Flashcards from "./Flashcards"
import ExploreView from "./ExploreView"
import { useEffect, useRef, useState } from "react"
import {
  Alert,
  Badge,
  Button,
  CardButton,
  Chip,
  Dialog,
  EmptyState,
  Field,
  Icon,
  IconButton,
  LanguageSelect,
  NavItem,
  PageHeader,
  SearchField,
  Skeleton,
  Tabs,
  Toast,
} from "./components"

type View = "translate" | "explore" | "notebook" | "practice" | "flashcards" | "grammar" | "settings" | "about"

const languages: MessageKey[] = [
  "English",
  "Spanish",
  "German",
  "French",
  "Dutch",
]

function Logo() {
  return (
    <a className="logo" href={import.meta.env.BASE_URL} aria-label="hello.profe">
      <svg viewBox="0 0 34 34" aria-hidden="true">
        <path d="M5 7h15a7 7 0 0 1 7 7v1a7 7 0 0 1-7 7h-6l-7 5 2-6a7 7 0 0 1-6-7V9a2 2 0 0 1 2-2Z" />
        <path d="M19 14h7a5 5 0 0 1 5 5v1a5 5 0 0 1-5 5h-2l1 4-5-4h-1a5 5 0 0 1 0-11Z" />
      </svg>
      <span>
        hello<span>.</span>profe
      </span>
    </a>
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
    icon: "translate" | "book" | "practice" | "cards" | "table" | "settings" | "info"
  }[] = [
    { id: "translate", label: "Translate", icon: "translate" },
    { id: "notebook", label: "Notebook", icon: "book" },
    { id: "practice", label: "Practice", icon: "practice" },
    { id: "flashcards", label: "Flashcards", icon: "cards" },
    { id: "grammar", label: "Grammar", icon: "table" },
    { id: "settings", label: "Settings", icon: "settings" },
    { id: "about", label: "About", icon: "info" },
  ]

  // The bottom bar keeps four entries; Notebook, Settings and About stay reachable from the sidebar or footer.
  const mobileNav = primaryNav.filter(item => item.id !== "notebook" && item.id !== "settings" && item.id !== "about")
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
            <NavItem
              key={item.id}
              className="nav-item"
              icon={item.icon}
              label={t(item.label)}
              selected={view === item.id || (view === "explore" && item.id === "translate")}
              onClick={() => setView(item.id)}
            />
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
        <LocaleSelector compact />
      </header>

      <div className="content-shell" id="main-content" tabIndex={-1}>
        {view !== "settings" && <div className="locale-toolbar"><LocaleSelector /></div>}
        {view === "notebook" && (
          <div className="prototype-notice" role="note">
            {t(
              "Interface prototype — translation and notebook features are simulated. Use Practice for the working German trainer.",
            )}
          </div>
        )}
        {children}
        <footer className="page-footer">
          <small>{t("© {year} hello.profe. Third-party materials retain their own licenses.", {year: String(new Date().getFullYear())})}</small>
          <div className="page-footer-links">
            <a href="#about" aria-current={view === "about" ? "page" : undefined} onClick={() => setView("about")}>{t("About")}</a>
            <a href="#settings" aria-current={view === "settings" ? "page" : undefined} onClick={() => setView("settings")}>{t("Settings")}</a>
          </div>
        </footer>
      </div>

      <nav className="bottom-nav" hidden={keyboardOpen} aria-label={t("Mobile navigation")}>
        {mobileNav.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={t(item.label)}
            selected={view === item.id || (view === "explore" && item.id === "translate")}
            onClick={() => setView(item.id)}
          />
        ))}
      </nav>
    </div>
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
            <CardButton className="vocab-main" onClick={onExplore}>
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
            </CardButton>
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

/** Hash routes are "#view", plus "#explore/<word>" for a dictionary entry. */
function viewFromLocation(): View {
  const hash = window.location.hash.slice(1).split("/")[0]
  return ["translate", "explore", "notebook", "practice", "flashcards", "grammar", "settings", "about"].includes(hash)
    ? hash as View
    : "translate"
}

function exploreWordFromLocation(): string {
  const [view, word = ""] = window.location.hash.slice(1).split("/")
  try {
    return view === "explore" ? decodeURIComponent(word) : ""
  } catch {
    return ""
  }
}

export default function App() {
  const { t } = useI18n()

  const [view, setCurrentView] = useState<View>(viewFromLocation)
  const [exploreWord, setExploreWord] = useState(exploreWordFromLocation)
  const setView = (next: View, word = "") => {
    window.location.hash = word ? `${next}/${encodeURIComponent(word)}` : next
    setCurrentView(next)
    setExploreWord(word)
  }
  useEffect(() => {
    const updateView = () => {
      setCurrentView(viewFromLocation())
      setExploreWord(exploreWordFromLocation())
    }
    window.addEventListener("hashchange", updateView)
    return () => window.removeEventListener("hashchange", updateView)
  }, [])
  const initialView = useRef(true)
  const [saved, setSaved] = useState(() => {
    try {
      return window.localStorage.getItem("hello-profe-saved") === "true"
    } catch {
      return false
    }
  })

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

  return (
    <AppShell view={view} setView={setView}>
      {view === "translate" && (
        <TranslationView />
      )}
      {view === "explore" && (
        <ExploreView
          word={exploreWord}
          onSearch={(word) => setView("explore", word)}
          onBack={() => setView("translate")}
        />
      )}
      {view === "notebook" && (
        <NotebookView
          saved={saved}
          onExplore={() => setView("explore", "lernen")}
          onDelete={() => setSaved(false)}
        />
      )}
      {view === "practice" && <StudyPractice onFlashcards={() => setView("flashcards")} />}
      {view === "flashcards" && <Flashcards />}
      {view === "grammar" && <GrammarTables />}
      {view === "settings" && <main className="page settings-page">
        <PageHeader eyebrow="" title={t("Settings")} description={t("Choose the language used throughout the website.")} />
        <section className="settings-card" aria-label={t("Interface language")}>
          <LocaleSelector />
          <p className="small-note">{t("Your language preference is saved in this browser when storage is available.")}</p>
        </section>
        <ThemeSettings />
        <TranslationSettings />
        <ChallengeSettings />
        <Button variant="text" onClick={() => setView("about")}>{t("About hello.profe")}</Button>
      </main>}
      {view === "about" && <main className="page about-page">
        <Button variant="text" onClick={() => setView("settings")}>{t("Settings")}</Button>
        <PageHeader eyebrow="" title={t("About hello.profe")} description={t("A little practice today, more confidence tomorrow.")} />
        <section className="settings-card about-copy" aria-label={t("About hello.profe")}>
          <p>{t("Languages open doors to people, places and everyday moments. hello.profe gives you a welcoming place to find the words you need and practise until they feel familiar.")}</p>
          <p>{t("This project grew out of life in a multilingual family in Brussels and my own German studies. It is for curious learners who want to make steady progress, one useful phrase at a time.")}</p>
          <p>{t("Translate between Spanish, English, German, French and Dutch, then explore German B1 topics at your own pace. No account is needed: choose a topic, try a card and keep going.")}</p>
          <p>{t("“Profe” is an informal Spanish word for a teacher. Together with “hello,” it reflects the welcoming, personal spirit of this project.")}</p>
          <p>{t("I use AI tools openly: Google Stitch for wireframes and inspiration, Figma Make for the logotype and design system, OpenAI Codex for implementation, and GitHub Copilot and Claude to double-check features. I review and test what they produce.")}</p>
          <h2>{t("Services and credits")}</h2>
          <ul>
            <li><a href="https://mymemory.translated.net/terms-and-conditions">{t("MyMemory")} · {t("Terms of service")}</a></li>
            <li><a href="https://www.cloudflare.com/service-specific-terms-application-services/">{t("Cloudflare Workers AI")} · {t("Terms of service")}</a></li>
            {import.meta.env.VITE_MICROSOFT_ENABLED === true && <li><a href="https://www.microsoft.com/licensing/terms/productoffering/MicrosoftAzure/all">{t("Microsoft Translator")} · {t("Terms of service")}</a></li>}
            {import.meta.env.VITE_GOOGLE_ENABLED === true && <li><a href="https://cloud.google.com/terms/service-terms">{t("Google Cloud Translation")} · {t("Terms of service")}</a></li>}
            <li><a href="https://kaikki.org/">{t("German word details: Wiktionary via kaikki.org, CC BY-SA 4.0")}</a></li>
            <li><a href="https://github.com/adobe-fonts/source-sans/blob/release/LICENSE.md">{t("Source Sans 3 — Adobe, SIL Open Font License")}</a></li>
          </ul>
          <p>{t("Interface design and inline icons: hello.profe, developed from the Figma Make prototype.")}</p>
          <p>{t("German B1 topic cards were drafted with AI and reviewed by the project owner. Unreviewed workbook decks are not published.")}</p>
          <p>{t("View the source code and follow development on GitHub.")}</p>
          <ul>
            <li><a href="https://github.com/ccisternas-dev/hello.profe">{t("GitHub repository")}</a></li>
            <li><a href="https://github.com/ccisternas-dev">{t("GitHub profile")}</a></li>
            <li><a href="https://www.linkedin.com/in/ccisternasv/">{t("LinkedIn")}</a></li>
          </ul>
        </section>
      </main>}
    </AppShell>
  )
}
