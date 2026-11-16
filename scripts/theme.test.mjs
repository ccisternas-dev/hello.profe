import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parseThemePreference, resolveTheme, themeStorageKey } from "../src/theme.ts"

test("theme preference defaults to the device setting and resolves light or dark", () => {
  assert.equal(parseThemePreference(null), "system")
  assert.equal(parseThemePreference("purple"), "system")
  assert.equal(parseThemePreference("dark"), "dark")
  assert.equal(resolveTheme("system", true), "dark")
  assert.equal(resolveTheme("system", false), "light")
  assert.equal(resolveTheme("light", true), "light")
  assert.equal(resolveTheme("dark", false), "dark")
})

test("index.html applies the saved theme before the app loads, using the same storage key", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8")
  assert.ok(html.indexOf(themeStorageKey) > 0 && html.indexOf(themeStorageKey) < html.indexOf("/src/main.tsx"))
})
