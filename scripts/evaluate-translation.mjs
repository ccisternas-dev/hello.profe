// Explicit, opt-in live evaluation of authored fixtures against the loopback PoC.
// Routine tests never invoke this script. No production/user text is read or logged.
import { readFileSync } from 'node:fs'
const fixtures = JSON.parse(readFileSync(new URL('../worker/evaluation/es-de.json', import.meta.url), 'utf8'))
const fixture = fixtures.find(item => item.id === process.argv[2])
if (!fixture) {
  console.error(`Choose one fixture: ${fixtures.map(item => item.id).join(', ')}`)
  process.exit(1)
}
const local = readFileSync(new URL('../worker/.dev.vars', import.meta.url), 'utf8')
const token = /^POC_TOKEN=([a-f0-9]{64})$/m.exec(local)?.[1]
if (!token) throw new Error('Generate worker/.dev.vars as documented before evaluation.')
const start = performance.now()
try {
  const response = await fetch('http://127.0.0.1:8787/api/translate', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text: fixture.text, source: 'es', target: 'de' }), signal: AbortSignal.timeout(15000),
  })
  const result = await response.json()
  console.log(JSON.stringify({ fixture: fixture.id, status: response.status, milliseconds: Math.round(performance.now() - start), result }, null, 2))
  if (!response.ok) process.exitCode = 1
} catch {
  console.error('Local evaluation failed or timed out. Check that the authenticated Worker dev server is running.')
  process.exitCode = 1
}
