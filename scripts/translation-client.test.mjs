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
  const endpoint = 'https://hello-profe-translation.ccisternasvdev-164.workers.dev/api/translate'
  t.mock.method(globalThis,'fetch',async (url,init)=>{
    assert.equal(url,endpoint)
    assert.equal(init.headers.Authorization,undefined)
    return Response.json({source:'es',target:'de',translatedText:'Hallo'})
  })
  assert.equal(await translateSpanish('Hola',new AbortController().signal,endpoint),'Hallo')
})

test('one source can translate to four targets independently, retaining partial success', async t => {
  const { translateText } = await import('../src/translation-client.ts')
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    const { text, source, target } = JSON.parse(init.body)
    assert.equal(text, 'Hola')
    assert.equal(source, 'es')
    if (target === 'nl') return Response.json({ error: { code: 'rate_limited' } }, { status: 429 })
    return Response.json({ source, target, translatedText: { en: 'Hello', de: 'Hallo', fr: 'Bonjour' }[target] })
  })
  const results = await Promise.allSettled(['en', 'de', 'fr', 'nl'].map(target => translateText('Hola', 'es', target, new AbortController().signal)))
  assert.deepEqual(results.slice(0, 3).map(result => result.value), ['Hello', 'Hallo', 'Bonjour'])
  assert.equal(results[3].reason.message, 'rate_limited')
})

test('MyMemory is the default, sends optional email, and validates successful output', async t => {
  const { translateWithProvider, defaultProvider } = await import('../src/translation-client.ts')
  assert.equal(defaultProvider, 'mymemory')
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const request = new URL(url)
    assert.equal(request.origin, 'https://api.mymemory.translated.net')
    assert.equal(request.searchParams.get('q'), 'Hola')
    assert.equal(request.searchParams.get('langpair'), 'es|de')
    assert.equal(request.searchParams.get('de'), 'user@example.com')
    assert.ok(init.signal)
    return Response.json({responseStatus:200, responseData:{translatedText:'Hallo'}})
  })
  assert.equal(await translateWithProvider('Hola','es','de',new AbortController().signal,{email:'user@example.com'}), 'Hallo')
})

test('MyMemory rejects quota warnings inside HTTP 200, malformed output and over-limit UTF-8 input', async t => {
  const { translateWithProvider } = await import('../src/translation-client.ts')
  const outputs = [
    {responseStatus:200,quotaFinished:true,responseData:{translatedText:'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY.'}},
    {responseStatus:429,responseDetails:'quota exhausted'},
    {responseStatus:200,responseData:{translatedText:'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY.'}},
    {responseStatus:200,responseData:{translatedText:' '}},
    {responseStatus:200,responseData:{translatedText:'x'.repeat(8001)}},
    null,
  ]
  const mock = t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(new URL(url).searchParams.has('de'),false)
    return Response.json(outputs.shift())
  })
  for (let i=0;i<6;i++) await assert.rejects(translateWithProvider('Hola','es','de',new AbortController().signal),i<3 ? /quota_exhausted/ : /invalid_provider_response/)
  await assert.rejects(translateWithProvider('é'.repeat(251),'fr','de',new AbortController().signal),/input_too_long_bytes/)
  assert.equal(mock.mock.callCount(),6)
})
