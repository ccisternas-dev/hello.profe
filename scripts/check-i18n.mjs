import ts from "typescript"
import { readFileSync, readdirSync } from "node:fs"
import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"

const root = new URL("../", import.meta.url)
const read = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"))
const catalogs = Object.fromEntries(
  ["en", "fr", "nl", "de"].map((locale) => [
    locale,
    read(`src/locales/${locale}.json`),
  ]),
)
const exceptions = read("scripts/i18n-exceptions.json")
const dynamicContent = read("scripts/i18n-dynamic-content.json")
const textProps = new Set([
  "label",
  "title",
  "description",
  "placeholder",
  "hint",
  "error",
  "success",
  "confirmLabel",
  "aria-label",
  "aria-valuetext",
  "alt",
  "eyebrow",
])
const normalize = (value) => value.replace(/\s+/g, " ").trim()
const placeholders = (value) =>
  [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

export function auditSource(source, file = "fixture.tsx") {
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const errors = []
  const checkText = (value, node) => {
    const text = normalize(value)
    if (/[\p{L}]/u.test(text) && !exceptions[text])
      errors.push(
        `${file}:${ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1}: untranslated text: ${text}`,
      )
  }
  // Check rendered string expressions, including template/concatenated/conditional messages.
  const checkExpression = (node) => {
    if (!node) return
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      checkText(node.text, node)
    else if (
      ts.isIdentifier(node) ||
      ts.isPropertyAccessExpression(node) ||
      ts.isElementAccessExpression(node)
    ) {
      const expression = node.getText(ast)
      if (!dynamicContent[file]?.[expression])
        errors.push(`${file}: unreviewed dynamic UI content: ${expression}`)
    } else if (ts.isTemplateExpression(node)) {
      checkText(node.head.text, node)
      for (const span of node.templateSpans) {
        checkText(span.literal.text, node)
        checkExpression(span.expression)
      }
    } else if (ts.isConditionalExpression(node)) {
      checkExpression(node.whenTrue)
      checkExpression(node.whenFalse)
    } else if (ts.isBinaryExpression(node)) {
      if (node.operatorToken.kind === ts.SyntaxKind.PlusToken)
        checkExpression(node.left)
      checkExpression(node.right)
    } else if (ts.isParenthesizedExpression(node))
      checkExpression(node.expression)
  }
  function visit(node) {
    if (ts.isJsxText(node)) checkText(node.text, node)
    if (
      ts.isJsxExpression(node) &&
      (!ts.isJsxAttribute(node.parent) ||
        textProps.has(node.parent.name.getText(ast)))
    )
      checkExpression(node.expression)
    if (
      ts.isJsxAttribute(node) &&
      textProps.has(node.name.getText(ast)) &&
      node.initializer
    ) {
      if (ts.isStringLiteral(node.initializer))
        checkText(node.initializer.text, node)
    }
    if (
      ts.isCallExpression(node) &&
      ["t", "plural"].includes(node.expression.getText(ast))
    ) {
      const args = node.arguments.slice(
        0,
        node.expression.getText(ast) === "plural" ? 2 : 1,
      )
      for (const arg of args)
        if (ts.isStringLiteral(arg) && !(arg.text in catalogs.en))
          errors.push(`${file}: missing translation key: ${arg.text}`)
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return errors
}

export function checkCatalogs() {
  for (const [locale, catalog] of Object.entries(catalogs)) {
    assert.deepEqual(
      Object.keys(catalog).sort(),
      Object.keys(catalogs.en).sort(),
      `${locale}: translation keys differ`,
    )
    for (const [key, message] of Object.entries(catalog)) {
      assert.equal(typeof message, "string", `${locale}: ${key}`)
      assert.ok(message.trim(), `${locale}: empty translation ${key}`)
      assert.deepEqual(
        placeholders(message),
        placeholders(catalogs.en[key]),
        `${locale}: interpolation differs for ${key}`,
      )
    }
  }
}

function files(directory) {
  return readdirSync(new URL(directory, root), { withFileTypes: true }).flatMap(
    (entry) =>
      entry.isDirectory()
        ? files(`${directory}/${entry.name}`)
        : /\.tsx$/.test(entry.name)
          ? [`${directory}/${entry.name}`]
          : [],
  )
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkCatalogs()
  const errors = files("src").flatMap((file) =>
    auditSource(readFileSync(new URL(file, root), "utf8"), file),
  )
  if (errors.length) {
    console.error(errors.join("\n"))
    process.exitCode = 1
  } else
    console.log(
      `i18n: ${Object.keys(catalogs.en).length} complete messages × 4 locales; UI string audit passed.`,
    )
}
