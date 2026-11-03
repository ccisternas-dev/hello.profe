import test from 'node:test'
import assert from 'node:assert/strict'
import { translateSpanish } from '../src/translation-client.ts'

test('client sends original Spanish input and no secret, and accepts only German translation responses', async t => {
  const signal = new AbortController().signal
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, '/api/translate')
    assert.equal(init.signal, signal)
    assert.deepEqual(init.headers, { 'Content-Type': 'application/json' })
    assert.deepEqual(JSON.parse(init.body), { text: 'Hola', source: 'es', target: 'de' })
    return Response.json({ source: 'es', target: 'de', translatedText: 'Hallo' })
  })
  assert.equal(await translateSpanish('Hola', signal), 'Hallo')
})
test('client preserves safe server error codes for quota and retry messages', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: { code: 'quota_exhausted' } }, { status: 429 }))
  await assert.rejects(translateSpanish('Hola', new AbortController().signal), /quota_exhausted/)
})
test('client rejects HTML, wrong-language output and empty translations', async t => {
  const outputs = [new Response('<html>proxy error</html>'), Response.json(null), Response.json({source:'es',target:'fr',translatedText:'bonjour'}), Response.json({source:'es',target:'de',translatedText:' '})]
  t.mock.method(globalThis, 'fetch', async () => outputs.shift())
  for (let i = 0; i < 4; i++) await assert.rejects(translateSpanish('Hola', new AbortController().signal))
})

test('production client calls configured HTTPS Worker without authentication secrets', async t => {
  const endpoint = 'https://hello-profe-translation.cristian-cisternas-v.workers.dev/api/translate'
  t.mock.method(globalThis,'fetch',async (url,init)=>{
    assert.equal(url,endpoint)
    assert.equal(init.headers.Authorization,undefined)
    return Response.json({source:'es',target:'de',translatedText:'Hallo'})
  })
  assert.equal(await translateSpanish('Hola',new AbortController().signal,endpoint),'Hallo')
})
