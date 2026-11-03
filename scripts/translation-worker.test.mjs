import test from 'node:test'
import assert from 'node:assert/strict'
import { createHandler } from '../worker/src/index.ts'
import { translateM2M100 } from '../worker/src/provider.ts'

const token = 'test-only-token-not-a-real-secret-123456789'
const env = (extra = {}) => ({
  AI: { run: async () => ({ translated_text: 'Ich möchte Deutsch lernen.' }) },
  REQUEST_LIMITER: { limit: async () => ({ success: true }) },
  TRANSLATION_ENABLED: 'true', POC_TOKEN: token, ALLOWED_ORIGINS: 'http://localhost:8443', ...extra,
})
const input = { text: 'Quiero aprender alemán.', source: 'es', target: 'de' }
const request = (body = input, extra = {}) => new Request('http://localhost:8787/api/translate', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Origin: 'http://localhost:8443' },
  body: JSON.stringify(body), ...extra,
})
const code = async response => (await response.json()).error.code

test('Spanish → German uses the original text and explicit language codes; validates output', async () => {
  const calls = []
  const response = await createHandler()(request(), env({ AI: { run: async (...args) => {
    calls.push(args); return { translated_text: 'Ich möchte Deutsch lernen.' }
  } } }))
  assert.equal(response.status, 200)
  assert.deepEqual(calls, [['@cf/meta/m2m100-1.2b', { text: input.text, source_lang: 'es', target_lang: 'de' }]])
  assert.deepEqual(await response.json(), { source: 'es', target: 'de', translatedText: 'Ich möchte Deutsch lernen.' })
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:8443')
  for (const output of [null, {}, { request_id: 'not-a-translation' }, { translated_text: ' ' }, { translated_text: 3 }]) {
    const response = await createHandler()(request(), env({ AI: { run: async () => output } }))
    assert.equal(await code(response), 'invalid_provider_response')
  }
})

test('invalid inputs never reach the provider, including streamed oversized bodies', async () => {
  let calls = 0
  const handle = createHandler(async () => { calls++; return 'unused' })
  for (const body of [null, [], {}, { ...input, text: ' ' }, { ...input, text: 'a'.repeat(501) },
    { ...input, source: 'auto' }, { ...input, target: 'fr' }, { ...input, prompt: 'extra' }]) {
    assert.equal((await handle(request(body), env())).status, 400)
  }
  assert.equal((await handle(request(input, { body: '{' }), env())).status, 400)
  assert.equal((await handle(request(input, { headers: { Authorization: `Bearer ${token}` } }), env())).status, 415)
  const stream = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(4097)); c.close() } })
  assert.equal((await handle(request(input, { body: stream, duplex: 'half' }), env())).status, 413)
  assert.equal(calls, 0)
})

test('disabled/missing controls, unauthorized clients and rate limits fail closed', async () => {
  let calls = 0
  const handle = createHandler(async () => { calls++; return 'unused' })
  for (const extra of [{ TRANSLATION_ENABLED: 'false' }, { POC_TOKEN: undefined }, { POC_TOKEN: 'short' }, { REQUEST_LIMITER: undefined }, { AI: undefined }]) {
    assert.equal((await handle(request(), env(extra))).status, 503)
  }
  assert.equal((await handle(request(input, { headers: { 'Content-Type': 'application/json' } }), env())).status, 401)
  const limited = await handle(request(), env({ REQUEST_LIMITER: { limit: async () => ({ success: false }) } }))
  assert.equal(limited.status, 429)
  assert.equal(limited.headers.get('retry-after'), '60')
  assert.equal(calls, 0)
})

test('CORS is exact-origin and preflight/method/path checks never call AI', async () => {
  let calls = 0
  const handle = createHandler(async () => { calls++; return 'unused' })
  const allowed = await handle(request(input, { method: 'OPTIONS', body: undefined, headers: { Origin: 'http://localhost:8443', 'Access-Control-Request-Method': 'POST' } }), env())
  assert.equal(allowed.status, 204)
  const blocked = await handle(request(input, { headers: { Origin: 'http://localhost:8443.evil.test' } }), env())
  assert.equal(blocked.status, 403)
  assert.equal(blocked.headers.get('access-control-allow-origin'), null)
  assert.equal((await handle(new Request('http://localhost:8787/api/translate'), env())).status, 405)
  assert.equal((await handle(new Request('http://localhost:8787/other'), env())).status, 404)
  assert.equal(calls, 0)
})

test('provider timeout, quota and failure errors do not expose submitted text', async () => {
  const timed = await createHandler(() => new Promise(() => {}), 5)(request(), env())
  assert.equal(timed.status, 504)
  assert.equal(await code(timed), 'provider_timeout')
  for (const [internal, expected, status] of [['3036', 'quota_exhausted', 429], ['3040', 'provider_busy', 503], ['3007', 'provider_timeout', 504], ['5035', 'provider_unavailable', 502]]) {
    const response = await createHandler()(request(), env({ AI: { run: async () => { throw new Error(`${internal}: ${input.text}`) } } }))
    assert.equal(response.status, status)
    assert.deepEqual(await response.json(), { error: { code: expected } })
  }
  await assert.rejects(() => translateM2M100({ run: async () => { throw { code: 3036 } } }, input), { code: 'quota_exhausted' })
})

test('public requests require exact origin, edge IP, and both limiters but no private token', async () => {
  const keys = []
  let calls = 0
  const publicEnv = env({ ACCESS_MODE: 'public', POC_TOKEN: undefined, ALLOWED_ORIGINS: 'https://ccisternas-dev.github.io',
    REQUEST_LIMITER: {limit: async ({key}) => {keys.push(key); return {success:true}}},
    SHARED_LIMITER: {limit: async ({key}) => {keys.push(key); return {success:true}}} })
  const headers = {'Content-Type':'application/json', Origin:'https://ccisternas-dev.github.io', 'CF-Connecting-IP':'192.0.2.1'}
  const handle = createHandler(async () => {calls++; return 'Hallo'})
  const response = await handle(request(input, {headers}), publicEnv)
  assert.equal(response.status,200)
  assert.equal(response.headers.get('access-control-allow-origin'),headers.Origin)
  assert.deepEqual(keys,['192.0.2.1','public-translation'])
  assert.equal((await handle(request(input,{headers:{...headers,Origin:'https://evil.test'}}),publicEnv)).status,403)
  const noOrigin = {...headers}; delete noOrigin.Origin
  assert.equal((await handle(request(input,{headers:noOrigin}),publicEnv)).status,403)
  const noIp = {...headers}; delete noIp['CF-Connecting-IP']
  assert.equal((await handle(request(input,{headers:noIp}),publicEnv)).status,503)
  assert.equal((await handle(request(input,{headers}),{...publicEnv,SHARED_LIMITER:undefined})).status,503)
  const limited = {...publicEnv,SHARED_LIMITER:{limit:async()=>({success:false})}}
  assert.equal((await handle(request(input,{headers}),limited)).status,429)
  assert.equal(calls,1)
})
