import { useState } from "react"
import { useI18n, LocaleSelector, type MessageKey } from "./i18n"
import { Alert, Badge, IconButton, Button, Chip, EmptyState, Field, LanguageSelect, PageHeader, Progress, SearchField, Skeleton, Tabs, Toast } from "./components"

const languages: MessageKey[] = ["English", "Spanish", "German", "French", "Dutch"]

export default function DesignSystem() {
  const { t } = useI18n()
  const [view, setView] = useState(new URLSearchParams(window.location.search).get("design-system") === "components" ? "components" : "foundations")
  return <div className="design-showcase">
    <a className="skip-link" href="#showcase-content">{t("Skip to main content")}</a>
    <header className="design-showcase-header">
      <nav aria-label={t("Design system")}>
        <Button variant={view === "foundations" ? "primary" : "secondary"} aria-pressed={view === "foundations"} onClick={() => setView("foundations")}>{t("Foundations")}</Button>
        <Button variant={view === "components" ? "primary" : "secondary"} aria-pressed={view === "components"} onClick={() => setView("components")}>{t("Components")}</Button>
      </nav>
      <LocaleSelector />
    </header>
    <div id="showcase-content" tabIndex={-1}>
      {view === "foundations" ? <FoundationsView /> : <ComponentsView />}
    </div>
  </div>
}

function FoundationsView() {
  const { t } = useI18n()

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
        eyebrow={t("Design system / 01")}
        title={t("Foundations")}
        description={t(
          "A warm, accessible language notebook built on semantic decisions—not one-off values.",
        )}
      />
      <section className="foundation-section">
        <div className="foundation-intro">
          <span>{t("Colour")}</span>
          <p>
            {t(
              "Primitive values map to semantic roles. Components consume only semantic tokens, ready for a future dark theme.",
            )}
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
          <span>{t("Typography")}</span>
          <p>
            {t(
              "Source Sans 3 is highly legible and supports every product language, including é, ñ, ü, ß and ë.",
            )}
          </p>
        </div>
        <div className="type-specimens">
          <div>
            <span>{t("Display / 48")}</span>
            <h2>{t("Every word opens a door.")}</h2>
          </div>
          <div>
            <span>{t("Heading / 30")}</span>
            <h3>
              <span lang="es">Aprender</span> · <span lang="de">lernen</span> ·{" "}
              <span lang="fr">apprendre</span>
            </h3>
          </div>
          <div>
            <span>{t("Body / 16")}</span>
            <p>
              {t(
                "Clear forms and generous line spacing keep longer translations comfortable to read.",
              )}
            </p>
          </div>
          <div>
            <span>{t("Label / 13")}</span>
            <strong>{t("SPANISH · PRESENT INDICATIVE")}</strong>
          </div>
        </div>
      </section>
      <section className="foundation-section foundation-grid">
        <div>
          <span className="foundation-label">{t("Spacing")}</span>
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
          <span className="foundation-label">{t("Shape & elevation")}</span>
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
              {t("subtle")}
            </div>
          </div>
        </div>
        <div>
          <span className="foundation-label">{t("Focus & motion")}</span>
          <div className="focus-demo">{t("Visible focus ring")}</div>
          <p className="small-note">
            {t(
              "Fast 160ms transitions. Motion is removed when the operating system requests reduced motion.",
            )}
          </p>
        </div>
      </section>
      <Alert tone="neutral" title={t("Responsive rule")}>
        {t(
          "The app uses a compact sidebar from 960px and bottom navigation below it. Content has a readable maximum width while tables scroll horizontally on small screens.",
        )}
      </Alert>
    </main>
  )
}

function ComponentsView() {
  const { t } = useI18n()

  const [tab, setTab] = useState("Default")
  const [toast, setToast] = useState(false)
  return (
    <main className="page system-page">
      <PageHeader
        eyebrow={t("Design system / 02")}
        title={t("Components")}
        description={t(
          "Reusable, accessible patterns with consistent states, anatomy and language.",
        )}
      />
      <section className="showcase">
        <div className="showcase-heading">
          <span>01</span>
          <div>
            <h2>{t("Actions")}</h2>
            <p>
              {t(
                "Primary is reserved for one clear next step. Secondary supports; text and icon actions stay quiet.",
              )}
            </p>
          </div>
        </div>
        <div className="component-demo">
          <Button variant="primary">{t("Primary action")}</Button>
          <Button variant="secondary">{t("Secondary")}</Button>
          <Button variant="text">{t("Text action")}</Button>
          <IconButton label={t("Bookmark")} icon="bookmark" />
          <Button variant="primary" loading>
            {t("Translating")}
          </Button>
          <Button variant="primary" disabled>
            {t("Disabled")}
          </Button>
        </div>
        <div className="anatomy">
          <Badge>{t("1 · Label")}</Badge>
          <Badge>{t("2 · Optional icon")}</Badge>
          <Badge>{t("3 · State feedback")}</Badge>
        </div>
      </section>
      <section className="showcase">
        <div className="showcase-heading">
          <span>02</span>
          <div>
            <h2>{t("Inputs & selection")}</h2>
            <p>
              {t(
                "Labels remain visible. Validation pairs colour with icons and explanatory copy.",
              )}
            </p>
          </div>
        </div>
        <div className="input-demo">
          <Field label={t("Default input")} hint={t("Helpful guidance")}>
            <input placeholder={t("Type a word…")} />
          </Field>
          <Field
            label={t("Validated input")}
            error={t("Enter a word before continuing")}
          >
            <input className="invalid" defaultValue="" />
          </Field>
          <LanguageSelect
            label={t("Language")}
            value="Spanish"
            options={languages}
          />
          <SearchField
            label={t("Search")}
            value=""
            onChange={() => {}}
            placeholder={t("Search vocabulary…")}
          />
        </div>
        <div className="component-demo">
          <Chip>{t("French")}</Chip>
          <Chip selected>{t("Spanish")}</Chip>
          <Chip disabled>{t("German")}</Chip>
        </div>
      </section>
      <section className="showcase">
        <div className="showcase-heading">
          <span>03</span>
          <div>
            <h2>{t("Navigation & feedback")}</h2>
            <p>
              {t(
                "Tabs switch peer content. Alerts persist; toasts confirm lightweight actions; dialogs protect destructive actions.",
              )}
            </p>
          </div>
        </div>
        <Tabs
          items={["Default", "Selected", "Disabled"]}
          selected={tab}
          onChange={setTab}
        />
        <div className="feedback-grid">
          <Alert tone="success" title={t("Saved to your notebook")}>
            {t("“aprender” is available for offline practice.")}
          </Alert>
          <Alert tone="error" title={t("Daily translation limit reached")}>
            {t(
              "Saved vocabulary and practice are still available. Try new translations tomorrow.",
            )}
          </Alert>
          <Alert tone="warning" title={t("You’re offline")}>
            {t(
              "New translations require internet. Your notebook and supported practice remain available.",
            )}
          </Alert>
          <Alert tone="neutral" title={t("Information unavailable")}>
            {t("No etymology was found for this entry.")}
          </Alert>
        </div>
        <Button variant="secondary" onClick={() => setToast(true)}>
          {t("Show save confirmation")}
        </Button>
      </section>
      <section className="showcase">
        <div className="showcase-heading">
          <span>04</span>
          <div>
            <h2>{t("Loading, empty & progress")}</h2>
            <p>
              {t(
                "Skeletons preserve layout while data loads. Empty states explain both what happened and what to do next.",
              )}
            </p>
          </div>
        </div>
        <div className="state-grid">
          <Skeleton />
          <EmptyState
            icon="book"
            title={t("No saved words yet")}
            description={t(
              "Save a translation to build your personal notebook.",
            )}
          />
          <div className="progress-demo">
            <Progress value={60} />
            <span>
              {t("{count} of {total} complete", { count: 6, total: 10 })}
            </span>
          </div>
        </div>
      </section>
      <Toast
        open={toast}
        onClose={() => setToast(false)}
        title={t("Saved to notebook")}
        description={t("“aprender” is now available offline.")}
      />
    </main>
  )
}

