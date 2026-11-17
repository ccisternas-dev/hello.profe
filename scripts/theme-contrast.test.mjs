// WCAG contrast checks for the light and dark themes, read from the tokens in src/index.css.
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8")
const block = (selector) => {
  const start = css.indexOf(`${selector} {`)
  assert.ok(start >= 0, `missing ${selector}`)
  return Object.fromEntries([...css.slice(start, css.indexOf("\n}", start)).matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
}
const light = block(":root")
const themes = { light, dark: { ...light, ...block(':root[data-theme="dark"]') } }

const resolve = (tokens, value) => {
  for (let i = 0; i < 10 && value.startsWith("var("); i++) value = tokens[value.slice(4, -1)]
  return value
}
const channels = (hex) => {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
}
const luminance = (hex) => {
  const [r, g, b] = channels(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

// [foreground, background, minimum ratio]: 4.5 for text, 3 for large text and UI boundaries.
const pairs = [
  ...["surface-default", "surface-subtle", "surface-raised", "surface-learning", "surface-learning-detail", "surface-selected", "surface-callout"].flatMap((bg) => [
    ["text-primary", bg, 4.5], ["text-secondary", bg, 4.5],
  ]),
  ["text-accent", "surface-raised", 4.5], ["text-accent", "surface-learning-detail", 4.5], ["text-accent", "surface-selected", 4.5],
  ["action-primary", "surface-raised", 4.5], ["action-primary", "surface-default", 4.5], ["action-primary", "surface-learning", 4.5],
  ["text-inverse", "action-primary", 4.5], ["text-inverse", "action-primary-hover", 4.5], ["text-inverse", "feedback-error", 4.5],
  ["text-inverse", "text-primary", 4.5], ["text-inverse-secondary", "text-primary", 4.5],
  ["feedback-error", "surface-raised", 4.5], ["feedback-error", "feedback-error-subtle", 4.5],
  ["feedback-success", "surface-raised", 4.5], ["feedback-success", "feedback-success-subtle", 4.5],
  ["feedback-warning", "surface-raised", 4.5], ["feedback-warning", "feedback-warning-subtle", 4.5],
  ["text-highlight", "surface-highlight", 4.5],
  ["gender-masculine", "gender-masculine-subtle", 4.5], ["gender-feminine", "gender-feminine-subtle", 4.5], ["gender-neuter", "gender-neuter-subtle", 4.5],
  ["border-strong", "surface-raised", 3], ["focus-ring", "surface-default", 3], ["focus-ring", "surface-raised", 3],
]

for (const [name, tokens] of Object.entries(themes)) {
  test(`${name} theme meets WCAG AA contrast for text and UI boundaries`, () => {
    const failures = pairs
      .map(([fg, bg, min]) => [fg, bg, min, contrast(resolve(tokens, tokens[`--${fg}`]), resolve(tokens, tokens[`--${bg}`]))])
      .filter(([, , min, ratio]) => ratio < min)
      .map(([fg, bg, min, ratio]) => `${fg} on ${bg}: ${ratio.toFixed(2)} < ${min}`)
    assert.deepEqual(failures, [])
  })
}
