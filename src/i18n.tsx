import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import en from "./locales/en.json"
import fr from "./locales/fr.json"
import nl from "./locales/nl.json"
import de from "./locales/de.json"
import es from "./locales/es.json"
import {
  detectLocale,
  formatMessage,
  isLocale,
  localeStorageKey,
  pluralKey,
  type Locale,
  type Values,
} from "./i18n-core"

export type MessageKey = keyof typeof en
const catalogs: Record<Locale, Record<MessageKey, string>> = {
  en,
  fr,
  nl,
  de,
  es,
}

function createTranslator(locale: Locale) {
  const t = (key: MessageKey, values?: Values) =>
    formatMessage(locale, catalogs[locale][key] ?? en[key], values)
  return {
    t,
    number: (value: number) => new Intl.NumberFormat(locale).format(value),
    percent: (value: number) =>
      new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: 0,
      }).format(value),
    plural: (
      one: MessageKey,
      other: MessageKey,
      count: number,
      values: Values = {},
    ) => t(pluralKey(locale, count, one, other), { ...values, count }),
  }
}
type Context = ReturnType<typeof createTranslator> & {
  locale: Locale
  setLocale: (locale: Locale) => void
}
const I18nContext = createContext<Context | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    let saved: unknown
    try {
      saved = localStorage.getItem(localeStorageKey)
    } catch {
      /* Device storage is optional. */
    }
    return detectLocale(saved, navigator.languages || [navigator.language])
  })
  const value = useMemo(
    () => ({
      ...createTranslator(locale),
      locale,
      setLocale: (next: Locale) => {
        if (!isLocale(next)) return
        setLocale(next)
        try {
          localStorage.setItem(localeStorageKey, next)
        } catch {
          /* Keep the in-memory choice. */
        }
      },
    }),
    [locale],
  )
  useEffect(() => {
    document.documentElement.lang = locale
    const title = value.t("hello.profe — German practice")
    const description = value.t(
      "Practice German B2 vocabulary, verb forms and temporal connectors with flashcards.",
    )
    document.title = title
    for (const [attribute, key, content] of [
      ["name", "description", description],
      ["property", "og:title", title],
      ["property", "og:description", description],
      ["name", "application-name", "hello.profe"],
    ]) {
      let meta = document.head.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${key}"]`,
      )
      if (!meta) {
        meta = document.createElement("meta")
        meta.setAttribute(attribute, key)
        document.head.append(meta)
      }
      meta.content = content
    }
  }, [locale, value])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error("useI18n requires I18nProvider")
  return context
}

const nativeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  nl: "Nederlands",
  de: "Deutsch",
  es: "Español",
}
export function LocaleSelector() {
  const { locale, setLocale, t } = useI18n()
  return (
    <label className="locale-selector">
      <span>{t("Interface language")}</span>
      <select
        value={locale}
        onChange={(event) => {
          if (isLocale(event.target.value)) setLocale(event.target.value)
        }}
      >
        {Object.entries(nativeNames).map(([code, name]) => (
          <option key={code} value={code} lang={code}>
            {name}
          </option>
        ))}
      </select>
    </label>
  )
}
