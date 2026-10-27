export const locales = ["en", "fr", "nl", "de", "es"] as const
export type Locale = typeof locales[number]
export type Values = Record<string, string | number>
export const localeStorageKey = "hello-profe-ui-locale"

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale)
}

export function detectLocale(
  saved: unknown,
  browserLanguages: readonly string[],
): Locale {
  if (isLocale(saved)) return saved
  for (const language of browserLanguages) {
    const base = language.toLowerCase().split(/[-_]/)[0]
    if (isLocale(base)) return base
  }
  return "en"
}

export function formatMessage(
  locale: Locale,
  template: string,
  values: Values = {},
): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = values[name]
    if (value === undefined)
      throw new Error(`Missing translation parameter: ${name}`)
    return typeof value === "number"
      ? new Intl.NumberFormat(locale).format(value)
      : value
  })
}

export function pluralKey<T>(
  locale: Locale,
  count: number,
  one: T,
  other: T,
): T {
  return new Intl.PluralRules(locale).select(count) === "one" ? one : other
}
