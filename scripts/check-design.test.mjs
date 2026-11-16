import test from "node:test"
import assert from "node:assert/strict"
import { collect, cssViolations, tsxViolations } from "./check-design.mjs"

const rules = (css) => cssViolations(css).map(({ rule }) => rule)

test("tokens inside :root are not violations", () => {
  assert.deepEqual(rules(":root { --space-1: 4px; --brand: #fff; font-size: 16px; }"), [])
})

test("token-based declarations pass", () => {
  assert.deepEqual(rules(".card { padding: var(--space-4) var(--space-6); color: var(--text-primary); font-size: var(--font-size-sm); border-radius: var(--radius-md); z-index: var(--layer-toast); border: 1px solid var(--border-default); margin: 0; }"), [])
})

test("pills, circles and hairline spacing are allowed", () => {
  assert.deepEqual(rules(".chip { border-radius: 999px; padding: 1px 2px; } .dot { border-radius: 50%; }"), [])
})

test("raw values are reported by rule", () => {
  assert.deepEqual(
    rules(".a { color: #123456; font-size: 13px; font-weight: 700; line-height: 1.2; z-index: 5; border-radius: 6px; gap: 12px; background: var(--primitive-cream-50); }"),
    ["raw-color", "raw-font-size", "raw-font-weight", "raw-line-height", "raw-z-index", "raw-radius", "raw-spacing", "primitive-token"],
  )
})

test("env() and var() inside spacing are ignored, raw px beside them is not", () => {
  assert.deepEqual(rules(".nav { padding: max(var(--space-2), env(safe-area-inset-left, 0px)); }"), [])
  assert.deepEqual(rules(".nav { padding: calc(4px + env(safe-area-inset-bottom, 0px)); }"), ["raw-spacing"])
})

test("only the documented breakpoints are allowed", () => {
  assert.deepEqual(rules("@media (max-width: 600px) { .a { margin: 0; } } @media (max-width: 1199px) { .b { margin: 0; } }"), [])
  assert.deepEqual(rules("@media (max-width: 640px) { .a { margin: 0; } }"), ["breakpoint"])
})

test("declarations inside media queries keep their selector and line", () => {
  const [violation] = cssViolations("@media (max-width: 600px) {\n  .card { gap: 10px; }\n}")
  assert.equal(violation.line, 2)
  assert.match(violation.key, /\| \.card \| gap: 10px$/)
})

test("raw buttons and inline styles are reported in screen files", () => {
  const found = tsxViolations('<button type="button">\n<span style={{ width: 2 }} />', "src/Screen.tsx")
  assert.deepEqual(found.map(({ rule, line }) => [rule, line]), [["raw-button", 1], ["inline-style", 2]])
})

test("the repository has no design violations", () => {
  assert.deepEqual(collect(new URL("../", import.meta.url)).map(({ file, line, rule }) => `${file}:${line} ${rule}`), [])
})
