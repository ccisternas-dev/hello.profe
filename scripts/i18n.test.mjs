import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { detectLocale, formatMessage, pluralKey } from "../src/i18n-core.ts"
import { auditSource, checkCatalogs } from "./check-i18n.mjs"

test("locale choice prioritizes a valid saved preference, then supported browser language, then English", () => {
  assert.equal(detectLocale("nl", ["fr-BE"]), "nl")
  assert.equal(detectLocale(null, ["es-ES", "de-DE", "fr"]), "de")
  assert.equal(detectLocale("bad-json", ["fr-BE"]), "fr")
  assert.equal(detectLocale(null, ["nl-BE"]), "nl")
  assert.equal(detectLocale(undefined, ["pt-BR"]), "en")
  assert.equal(detectLocale(null, []), "en")
})
test(
  "every locale has complete keys and matching interpolation placeholders",
  checkCatalogs,
)
test("numeric interpolation and plural rules follow each locale, including French zero", () => {
  for (const locale of ["en", "fr", "nl", "de"]) {
    assert.equal(
      formatMessage(locale, "{count} / {total}", { count: 1000, total: 2000 }),
      `${new Intl.NumberFormat(locale).format(1000)} / ${new Intl.NumberFormat(locale).format(2000)}`,
    )
    const messages = JSON.parse(
      readFileSync(new URL(`../src/locales/${locale}.json`, import.meta.url)),
    )
    for (const count of [0, 1, 2]) {
      const key = pluralKey(
        locale,
        count,
        "Review {count} Again card",
        "Review {count} Again cards",
      )
      assert.equal(
        key.endsWith("cards"),
        count !== 1 && !(locale === "fr" && count === 0),
      )
      assert.ok(!formatMessage(locale, messages[key], { count }).includes("{"))
    }
  }
  assert.throws(
    () => formatMessage("en", "Card {count}"),
    /Missing translation parameter/,
  )
})
test("UI audit rejects new raw text, accessibility labels, dynamic messages and unreviewed variable output", () => {
  for (const source of [
    "<p>Untranslated message</p>",
    '<button aria-label="Untranslated button" />',
    "<p>{`Round ${count} complete`}</p>",
    '<p>{count + " cards"}</p>',
    '<p>{active ? "Enabled" : "Disabled"}</p>',
    'const message = "untranslated"; <p>{message}</p>',
    '<p>{t("Nonexistent translation")}</p>',
  ])
    assert.ok(auditSource(source).length > 0, source)
  assert.deepEqual(auditSource('<p>{t("Round {round}", { round: 2 })}</p>'), [])
  assert.deepEqual(
    auditSource(
      '<p className={active ? "selected" : "default"}>{t("Answer")}</p>',
    ),
    [],
  )
})
