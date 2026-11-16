// Design drift check. Enforces docs/design-rules.md.
// Existing violations are listed in scripts/design-baseline.json. The check fails only when
// a violation is new or more frequent than recorded, so the baseline can only shrink.
// Run with --update after fixing violations to rewrite the baseline.
import { readFileSync, writeFileSync, readdirSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"

const ALLOWED_BREAKPOINTS = new Set(["600px", "1199px"])
const ALLOWED_SPACING_PX = new Set(["0px", "1px", "2px"])
const SPACING_PROPERTY = /^(margin|padding)(-(top|right|bottom|left|inline|block)(-(start|end))?)?$|^(row-|column-)?gap$/
const COMPONENT_FILES = new Set(["components.tsx", "DesignSystem.tsx"])

const stripFunctions = (value) => value.replace(/\b(var|env)\([^()]*(\([^()]*\)[^()]*)*\)/g, "")

function declarationViolations(prop, value) {
  const found = []
  const raw = stripFunctions(value)
  if (/var\(--primitive-/.test(value)) found.push("primitive-token")
  if (/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?)\(/i.test(raw)) found.push("raw-color")
  if (prop === "font-size" && !/^(var\(|inherit$)/.test(value)) found.push("raw-font-size")
  if (prop === "font-weight" && /^\d+$/.test(value)) found.push("raw-font-weight")
  if (prop === "line-height" && /^[\d.]+$/.test(value)) found.push("raw-line-height")
  if (prop === "z-index" && /^-?\d+$/.test(value)) found.push("raw-z-index")
  if (prop === "border-radius" && value !== "999px" && value !== "50%" && /\d(px|rem|em)\b/.test(raw)) found.push("raw-radius")
  if (SPACING_PROPERTY.test(prop)) {
    const lengths = raw.match(/-?\d*\.?\d+(px|rem|em)\b/g) || []
    if (lengths.some((length) => !ALLOWED_SPACING_PX.has(length.replace(/^-/, "")))) found.push("raw-spacing")
  }
  return found
}

export function cssViolations(css, file = "src/index.css") {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "))
  const violations = []
  const stack = []
  let buffer = ""
  let line = 1
  let bufferLine = 1
  const flush = () => {
    const declaration = buffer.trim()
    buffer = ""
    const colon = declaration.indexOf(":")
    if (!stack.length || colon < 1 || stack.includes(":root")) return
    const prop = declaration.slice(0, colon).trim().toLowerCase()
    if (prop.startsWith("--")) return
    const value = declaration.slice(colon + 1).replace(/\s*!important$/, "").trim()
    const selector = stack.filter((entry) => !entry.startsWith("@")).at(-1) || stack.at(-1)
    for (const rule of declarationViolations(prop, value)) {
      violations.push({ file, line: bufferLine, rule, key: `${file} | ${rule} | ${selector} | ${prop}: ${value}` })
    }
  }
  for (const char of text) {
    if (!buffer.trim() && char.trim()) bufferLine = line
    if (char === "\n") line += 1
    if (char === "{") {
      const block = buffer.trim()
      buffer = ""
      if (block.startsWith("@media")) {
        for (const width of block.match(/(min|max)-width:\s*[\d.]+px/g) || []) {
          const px = width.split(":")[1].trim()
          if (!ALLOWED_BREAKPOINTS.has(px)) violations.push({ file, line: bufferLine, rule: "breakpoint", key: `${file} | breakpoint | ${block}` })
        }
      }
      stack.push(block)
    } else if (char === "}") {
      flush()
      stack.pop()
    } else if (char === ";") {
      flush()
    } else {
      buffer += char
    }
  }
  return violations
}

export function tsxViolations(source, file) {
  const violations = []
  source.split("\n").forEach((text, index) => {
    for (const _ of text.matchAll(/<button\b/g)) violations.push({ file, line: index + 1, rule: "raw-button", key: `${file} | raw-button` })
    for (const _ of text.matchAll(/\bstyle=\{\{/g)) violations.push({ file, line: index + 1, rule: "inline-style", key: `${file} | inline-style` })
  })
  return violations
}

export const countKeys = (violations) =>
  violations.reduce((counts, { key }) => ({ ...counts, [key]: (counts[key] || 0) + 1 }), {})

export function compare(violations, baseline) {
  const counts = countKeys(violations)
  const seen = {}
  const added = violations.filter(({ key }) => {
    seen[key] = (seen[key] || 0) + 1
    return seen[key] > (baseline[key] || 0)
  })
  const fixed = Object.keys(baseline).filter((key) => (counts[key] || 0) < baseline[key])
  return { added, fixed, counts }
}

export function collect(root) {
  const src = new URL("src/", root)
  const violations = cssViolations(readFileSync(new URL("index.css", src), "utf8"))
  for (const name of readdirSync(src).filter((entry) => entry.endsWith(".tsx")).sort()) {
    if (!COMPONENT_FILES.has(name)) violations.push(...tsxViolations(readFileSync(new URL(name, src), "utf8"), `src/${name}`))
  }
  return violations
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = new URL("../", import.meta.url)
  const baselinePath = new URL("scripts/design-baseline.json", root)
  const violations = collect(root)
  if (process.argv.includes("--update")) {
    const counts = countKeys(violations)
    const sorted = Object.fromEntries(Object.keys(counts).sort().map((key) => [key, counts[key]]))
    writeFileSync(baselinePath, `${JSON.stringify(sorted, null, 2)}\n`)
    console.log(`Design baseline updated: ${violations.length} known violations in ${fileURLToPath(baselinePath)}`)
    process.exit(0)
  }
  const baseline = JSON.parse(readFileSync(baselinePath, "utf8"))
  const { added, fixed } = compare(violations, baseline)
  if (fixed.length) console.log(`${fixed.length} baseline entries are fixed. Run the check with --update to shrink scripts/design-baseline.json.`)
  if (added.length) {
    console.error(`Design check failed: ${added.length} new violation(s). See docs/design-rules.md.`)
    for (const { file, line, rule, key } of added) console.error(`  ${file}:${line}  ${rule}  ${key.split(" | ").slice(2).join(" | ")}`)
    process.exit(1)
  }
  console.log(`Design check passed (${violations.length} known violations in baseline).`)
}
