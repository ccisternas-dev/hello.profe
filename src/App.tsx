import StudyPractice from './StudyPractice'
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
  Progress,
  SearchField,
  Skeleton,
  Tabs,
  Toast,
} from "./components"

type View = "translate" | "explore" | "notebook" | "practice" | "foundations" | "components"

const languages = ["English", "Spanish", "German", "French", "Dutch"]

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
  const primaryNav: {
    id: View
    label: string
    icon: "translate" | "book" | "practice"
  }[] = [
    { id: "translate", label: "Translate", icon: "translate" },
    { id: "notebook", label: "Notebook", icon: "book" },
    { id: "practice", label: "Practice", icon: "practice" },
  ]

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className="sidebar">
        <Logo />
        <nav aria-label="Main navigation">
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
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-section">
          <span className="nav-label">Design system</span>
          <button
            type="button"
            className={`nav-item ${view === "foundations" ? "selected" : ""}`}
            aria-current={view === "foundations" ? "page" : undefined}
            onClick={() => setView("foundations")}
          >
            <Icon name="palette" />
            <span>Foundations</span>
          </button>
          <button
            type="button"
            className={`nav-item ${view === "components" ? "selected" : ""}`}
            aria-current={view === "components" ? "page" : undefined}
            onClick={() => setView("components")}
          >
            <Icon name="grid" />
            <span>Components</span>
          </button>
        </div>
        <div className="offline-note">
          <span className="status-dot" />
          <div>
            <strong>Saved on this device</strong>
            <small>No account needed</small>
          </div>
        </div>
      </aside>

      <header className="mobile-header">
        <Logo />
        <IconButton
          label="Open design system foundations"
          icon="grid"
          onClick={() => setView("foundations")}
        />
      </header>

      <div className="content-shell" id="main-content" tabIndex={-1}>
        {view !== "practice" && <div className="prototype-notice" role="note">Interface prototype — translation and notebook features are simulated. Use Practice for the working German trainer.</div>}
        {children}
      </div>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {primaryNav.map((item) => (
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
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: React.ReactNode
}) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}

function TranslateView({
  onExplore,
  onSaved,
}: {
  onExplore: () => void
  onSaved: () => void
}) {
  const [text, setText] = useState("to learn")
  const [loading, setLoading] = useState(false)
  const [translated, setTranslated] = useState(true)
  const [targets, setTargets] = useState(["Spanish", "German", "French"])

  const toggleTarget = (language: string) => {
    setTargets((current) =>
      current.includes(language)
        ? current.filter((item) => item !== language)
        : current.length < 4
          ? [...current, language]
          : current,
    )
  }

  const translate = () => {
    if (!text.trim()) return
    setLoading(true)
    setTranslated(false)
    window.setTimeout(() => {
      setLoading(false)
      setTranslated(true)
    }, 850)
  }

  return (
    <main className="page translate-page">
      <PageHeader
        eyebrow="Translate"
        title="What would you like to say?"
        description="Translate a word, sentence or short paragraph into up to four languages."
        actions={
          <Button variant="text" icon="history">
            Recent
          </Button>
        }
      />

      <section
        className="translator"
        aria-labelledby="translation-input-heading"
      >
        <div className="translator-controls">
          <LanguageSelect label="From" value="English" options={languages} />
          <IconButton label="Swap source and target languages" icon="swap" />
          <div
            className="target-control"
            role="group"
            aria-labelledby="target-language-label"
          >
            <span className="field-label" id="target-language-label">
              To · choose up to four
            </span>
            <div className="target-chips">
              {languages
                .filter((language) => language !== "English")
                .map((language) => (
                  <Chip
                    key={language}
                    selected={targets.includes(language)}
                    onClick={() => toggleTarget(language)}
                  >
                    {language}
                  </Chip>
                ))}
            </div>
          </div>
        </div>

        <div className="translation-input">
          <label id="translation-input-heading" htmlFor="translation-text">
            Text to translate
          </label>
          <textarea
            id="translation-text"
            value={text}
            maxLength={1000}
            onChange={(event) => setText(event.target.value)}
            placeholder="Type or paste text here…"
          />
          <div className="input-footer">
            <span>{text.length} / 1,000</span>
            <Button
              variant="primary"
              icon="spark"
              loading={loading}
              disabled={!text.trim()}
              onClick={translate}
            >
              Translate
            </Button>
          </div>
        </div>
      </section>

      {loading && (
        <section
          className="results-grid"
          aria-label="Loading translations"
          aria-busy="true"
        >
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} />
          ))}
        </section>
      )}

      {!loading && translated && text.trim() && (
        <section className="results-section" aria-live="polite">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">Results</span>
              <h2>Three translations</h2>
            </div>
            <span className="sample-note">
              <Icon name="info" /> Illustrative translations—verify before use
            </span>
          </div>
          <div className="results-grid">
            <article className="result-card">
              <div className="result-top">
                <Badge tone="language">Spanish</Badge>
                <IconButton label="More options" icon="more" />
              </div>
              <div className="result-content">
                <span className="part-of-speech">verb</span>
                <h3>aprender</h3>
                <p className="pronunciation">/a.pɾenˈdeɾ/</p>
              </div>
              <div className="result-actions">
                <Button variant="text" icon="copy">
                  Copy
                </Button>
                <Button variant="text" icon="bookmark" onClick={onSaved}>
                  Save
                </Button>
                <Button variant="secondary" icon="arrow" onClick={onExplore}>
                  Explore word
                </Button>
              </div>
            </article>

            <article className="result-card">
              <div className="result-top">
                <Badge tone="language">German</Badge>
                <IconButton label="More options" icon="more" />
              </div>
              <div className="result-content">
                <span className="part-of-speech">verb</span>
                <h3>lernen</h3>
                <p className="pronunciation">/ˈlɛʁnən/</p>
              </div>
              <div className="result-actions">
                <Button variant="text" icon="copy">
                  Copy
                </Button>
                <Button variant="text" icon="bookmark" onClick={onSaved}>
                  Save
                </Button>
                <Button variant="secondary" icon="arrow">
                  Explore word
                </Button>
              </div>
            </article>

            <article className="result-card result-card--error">
              <div className="result-top">
                <Badge tone="language">French</Badge>
                <Icon name="warning" />
              </div>
              <div className="error-copy">
                <h3>Translation unavailable</h3>
                <p>
                  We could not reach this language service. Your other
                  translations are still available.
                </p>
              </div>
              <Button variant="secondary" icon="retry">
                Try French again
              </Button>
            </article>
          </div>
        </section>
      )}

      {!loading && !text.trim() && (
        <EmptyState
          icon="translate"
          title="Start with a word or phrase"
          description="Your translations will appear here, grouped by language."
        />
      )}
    </main>
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
        Back to translation
      </Button>
      <div className="word-hero">
        <div>
          <div className="word-meta">
            <Badge tone="language">Spanish</Badge>
            <Badge>verb</Badge>
          </div>
          <h1>aprender</h1>
          <p className="pronunciation">
            /a.pɾenˈdeɾ/{" "}
            <Button variant="icon" icon="audio" label="Play pronunciation" />
          </p>
        </div>
        <Button
          variant={saved ? "secondary" : "primary"}
          icon={saved ? "check" : "bookmark"}
          onClick={onSave}
        >
          {saved ? "Saved" : "Save word"}
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
                    <h2>to learn</h2>
                    <p>
                      To gain knowledge or skill through study or experience.
                    </p>
                  </div>
                </div>
                <div className="example">
                  <span>Example</span>
                  <p>Quiero aprender español este año.</p>
                  <p>I want to learn Spanish this year.</p>
                </div>
                <div className="synonyms">
                  <span>Similar meaning</span>
                  <Chip>estudiar</Chip>
                  <Chip>descubrir</Chip>
                </div>
              </section>
              <section className="detail-card">
                <div className="meaning-heading">
                  <span className="meaning-number">2</span>
                  <div>
                    <h2>to find out</h2>
                    <p>To become aware of a fact or piece of information.</p>
                  </div>
                </div>
                <div className="example">
                  <span>Example</span>
                  <p>Aprendí la noticia esta mañana.</p>
                  <p>I found out the news this morning.</p>
                </div>
              </section>
            </>
          )}

          {tab === "Conjugation" && (
            <section className="detail-card">
              <div className="table-heading">
                <div>
                  <span className="eyebrow">Indicative</span>
                  <h2>Common forms</h2>
                </div>
                <Button
                  variant="text"
                  icon={showConjugation ? "chevronUp" : "chevronDown"}
                  onClick={() => setShowConjugation(!showConjugation)}
                >
                  {showConjugation ? "Collapse" : "Expand"}
                </Button>
              </div>
              {showConjugation && (
                <div
                  className="table-scroll"
                  tabIndex={0}
                  aria-label="Scrollable conjugation table"
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Pronoun</th>
                        <th>Present</th>
                        <th>Preterite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conjugations.map((row) => (
                        <tr key={row[0]}>
                          {row.map((cell) => (
                            <td key={cell}>{cell}</td>
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
              <h2>Examples in context</h2>
              <div className="example-list">
                <div>
                  <p>Estamos aprendiendo a cocinar juntos.</p>
                  <span>We are learning to cook together.</span>
                </div>
                <div>
                  <p>Nunca es tarde para aprender algo nuevo.</p>
                  <span>It is never too late to learn something new.</span>
                </div>
                <div>
                  <p>Aprende de tus errores.</p>
                  <span>Learn from your mistakes.</span>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="detail-aside">
          <div className="source-card">
            <Icon name="book" />
            <div>
              <strong>Dictionary facts</strong>
              <p>Meanings and forms adapted from open dictionary data.</p>
              <Button variant="text">View sources</Button>
            </div>
          </div>
          <div className="source-card source-card--generated">
            <Icon name="spark" />
            <div>
              <strong>Generated explanation</strong>
              <p>Examples are illustrative and may require verification.</p>
            </div>
          </div>
          <Field
            label="Your context sentence"
            hint="Optional · saved only on this device"
          >
            <textarea
              placeholder="Add a sentence that helps you remember…"
              defaultValue="Quiero aprender español este año."
            />
          </Field>
          <Alert tone="neutral" title="Information unavailable">
            Regional usage notes are not available for this word.
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
  const [search, setSearch] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <main className="page notebook-page">
      <PageHeader
        eyebrow="Vocabulary notebook"
        title="Words worth keeping"
        description="Your entries are stored only on this device and remain available offline."
        actions={
          <>
            <Button variant="secondary" icon="import">
              Import
            </Button>
            <Button variant="secondary" icon="export">
              Export
            </Button>
          </>
        }
      />
      {saved ? (
        <>
          <div className="notebook-tools">
            <SearchField
              label="Search saved vocabulary"
              value={search}
              onChange={setSearch}
              placeholder="Search words or examples…"
            />
            <div className="filter-row">
              <Chip selected>All languages</Chip>
              <Chip>Spanish</Chip>
              <Chip>German</Chip>
              <Chip>Verbs</Chip>
            </div>
          </div>
          <div className="notebook-count">
            <span>1 saved word</span>
            <span>Last updated today</span>
          </div>
          <article className="vocab-card">
            <button type="button" className="vocab-main" onClick={onExplore}>
              <div className="vocab-word">
                <Badge tone="language">Spanish</Badge>
                <h2>aprender</h2>
                <span>verb · to learn</span>
              </div>
              <div className="personal-example">
                <span>Your example</span>
                <p>Quiero aprender español este año.</p>
              </div>
              <Icon name="chevronRight" />
            </button>
            <div className="vocab-actions">
              <IconButton label="Edit aprender" icon="edit" />
              <IconButton
                label="Delete aprender"
                icon="trash"
                onClick={() => setDeleteOpen(true)}
              />
            </div>
          </article>
        </>
      ) : (
        <EmptyState
          icon="bookmark"
          title="Your notebook is ready"
          description="Save a translation or a word you explore. Add your own example to make it easier to remember."
          action={
            <Button variant="primary" icon="translate">
              Translate your first word
            </Button>
          }
        />
      )}
      <Dialog
        open={deleteOpen}
        title="Delete “aprender”?"
        description="This removes the word and your personal example from this device. This action cannot be undone."
        confirmLabel="Delete word"
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

function FoundationsView() {
  const colors = [
    ["surface-default", "#F7F4ED"],
    ["surface-raised", "#FFFFFF"],
    ["text-primary", "#1E2927"],
    ["text-secondary", "#5C6B67"],
    ["action-primary", "#176B62"],
    ["accent-learning", "#E7A84C"],
    ["feedback-success", "#2F7458"],
    ["feedback-error", "#A83D34"],
  ]
  const spacing = [
    "space-1 · 4",
    "space-2 · 8",
    "space-3 · 12",
    "space-4 · 16",
    "space-6 · 24",
    "space-8 · 32",
    "space-12 · 48",
  ]
  return (
    <main className="page system-page">
      <PageHeader
        eyebrow="Design system / 01"
        title="Foundations"
        description="A warm, accessible language notebook built on semantic decisions—not one-off values."
      />
      <section className="foundation-section">
        <div className="foundation-intro">
          <span>Colour</span>
          <p>
            Primitive values map to semantic roles. Components consume only
            semantic tokens, ready for a future dark theme.
          </p>
        </div>
        <div className="color-grid">
          {colors.map(([name, value]) => (
            <div className="color-token" key={name}>
              <span style={{ backgroundColor: value }} />
              <strong>{name}</strong>
              <code>{value}</code>
            </div>
          ))}
        </div>
      </section>
      <section className="foundation-section">
        <div className="foundation-intro">
          <span>Typography</span>
          <p>
            Source Sans 3 is highly legible and supports every product language,
            including é, ñ, ü, ß and ë.
          </p>
        </div>
        <div className="type-specimens">
          <div>
            <span>Display / 48</span>
            <h2>Every word opens a door.</h2>
          </div>
          <div>
            <span>Heading / 30</span>
            <h3>Aprender · lernen · apprendre</h3>
          </div>
          <div>
            <span>Body / 16</span>
            <p>
              Clear forms and generous line spacing keep longer translations
              comfortable to read.
            </p>
          </div>
          <div>
            <span>Label / 13</span>
            <strong>SPANISH · PRESENT INDICATIVE</strong>
          </div>
        </div>
      </section>
      <section className="foundation-section foundation-grid">
        <div>
          <span className="foundation-label">Spacing</span>
          <div className="spacing-list">
            {spacing.map((item, index) => (
              <div key={item}>
                <i style={{ width: `${(index + 1) * 20}px` }} />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div>
          <span className="foundation-label">Shape & elevation</span>
          <div className="shape-row">
            <div>
              radius-sm
              <br />
              8px
            </div>
            <div>
              radius-md
              <br />
              12px
            </div>
            <div>
              elevation-1
              <br />
              subtle
            </div>
          </div>
        </div>
        <div>
          <span className="foundation-label">Focus & motion</span>
          <div className="focus-demo">Visible focus ring</div>
          <p className="small-note">
            Fast 160ms transitions. Motion is removed when the operating system
            requests reduced motion.
          </p>
        </div>
      </section>
      <Alert tone="neutral" title="Responsive rule">
        The app uses a compact sidebar from 960px and bottom navigation below
        it. Content has a readable maximum width while tables scroll
        horizontally on small screens.
      </Alert>
    </main>
  )
}

function ComponentsView() {
  const [tab, setTab] = useState("Default")
  const [toast, setToast] = useState(false)
  return (
    <main className="page system-page">
      <PageHeader
        eyebrow="Design system / 02"
        title="Components"
        description="Reusable, accessible patterns with consistent states, anatomy and language."
      />
      <section className="showcase">
        <div className="showcase-heading">
          <span>01</span>
          <div>
            <h2>Actions</h2>
            <p>
              Primary is reserved for one clear next step. Secondary supports;
              text and icon actions stay quiet.
            </p>
          </div>
        </div>
        <div className="component-demo">
          <Button variant="primary">Primary action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="text">Text action</Button>
          <IconButton label="Bookmark" icon="bookmark" />
          <Button variant="primary" loading>
            Translating
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div className="anatomy">
          <Badge>1 · Label</Badge>
          <Badge>2 · Optional icon</Badge>
          <Badge>3 · State feedback</Badge>
        </div>
      </section>
      <section className="showcase">
        <div className="showcase-heading">
          <span>02</span>
          <div>
            <h2>Inputs & selection</h2>
            <p>
              Labels remain visible. Validation pairs colour with icons and
              explanatory copy.
            </p>
          </div>
        </div>
        <div className="input-demo">
          <Field label="Default input" hint="Helpful guidance">
            <input placeholder="Type a word…" />
          </Field>
          <Field label="Validated input" error="Enter a word before continuing">
            <input className="invalid" defaultValue="" />
          </Field>
          <LanguageSelect
            label="Language"
            value="Spanish"
            options={languages}
          />
          <SearchField
            label="Search"
            value=""
            onChange={() => {}}
            placeholder="Search vocabulary…"
          />
        </div>
        <div className="component-demo">
          <Chip>French</Chip>
          <Chip selected>Spanish</Chip>
          <Chip disabled>German</Chip>
        </div>
      </section>
      <section className="showcase">
        <div className="showcase-heading">
          <span>03</span>
          <div>
            <h2>Navigation & feedback</h2>
            <p>
              Tabs switch peer content. Alerts persist; toasts confirm
              lightweight actions; dialogs protect destructive actions.
            </p>
          </div>
        </div>
        <Tabs
          items={["Default", "Selected", "Disabled"]}
          selected={tab}
          onChange={setTab}
        />
        <div className="feedback-grid">
          <Alert tone="success" title="Saved to your notebook">
            “aprender” is available for offline practice.
          </Alert>
          <Alert tone="error" title="Daily translation limit reached">
            Saved vocabulary and practice are still available. Try new
            translations tomorrow.
          </Alert>
          <Alert tone="warning" title="You’re offline">
            New translations require internet. Your notebook and supported
            practice remain available.
          </Alert>
          <Alert tone="neutral" title="Information unavailable">
            No etymology was found for this entry.
          </Alert>
        </div>
        <Button variant="secondary" onClick={() => setToast(true)}>
          Show save confirmation
        </Button>
      </section>
      <section className="showcase">
        <div className="showcase-heading">
          <span>04</span>
          <div>
            <h2>Loading, empty & progress</h2>
            <p>
              Skeletons preserve layout while data loads. Empty states explain
              both what happened and what to do next.
            </p>
          </div>
        </div>
        <div className="state-grid">
          <Skeleton />
          <EmptyState
            icon="book"
            title="No saved words yet"
            description="Save a translation to build your personal notebook."
          />
          <div className="progress-demo">
            <Progress value={60} />
            <span>6 of 10 complete</span>
          </div>
        </div>
      </section>
      <Toast
        open={toast}
        onClose={() => setToast(false)}
        title="Saved to notebook"
        description="“aprender” is now available offline."
      />
    </main>
  )
}

export default function App() {
  const [view, setView] = useState<View>("practice")
  const initialView = useRef(true)
  const [saved, setSaved] = useState(
    () => { try { return window.localStorage.getItem("hello-profe-saved") === "true" } catch { return false } },
  )
  const [toast, setToast] = useState(false)

  useEffect(() => {
    try { window.localStorage.setItem("hello-profe-saved", String(saved)) } catch { /* Storage may be unavailable. */ }
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
        <TranslateView
          onExplore={() => setView("explore")}
          onSaved={saveWord}
        />
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
      {view === "practice" && <StudyPractice />}
      {view === "foundations" && <FoundationsView />}
      {view === "components" && <ComponentsView />}
      <Toast
        open={toast}
        onClose={() => setToast(false)}
        title="Saved to notebook"
        description="Prototype notebook updated."
        action={
          <Button variant="text" onClick={() => setView("notebook")}>
            View notebook
          </Button>
        }
      />
    </AppShell>
  )
}
