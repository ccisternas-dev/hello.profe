import test from 'node:test'
import assert from 'node:assert/strict'
import {translateDeepL} from '../worker/src/deepl.ts'
import {createHandler} from '../worker/src/index.ts'
import {translateWithProvider} from '../src/translation-client.ts'
const input={text:'Hola',source:'es',target:'de'}
const fakeKey='test-only-deepl-key:fx'
const env={AI:{run:async()=>{throw new Error('Wrong provider')}},DEEPL_ENABLED:'true',DEEPL_KEY:fakeKey,TRANSLATION_ENABLED:'true',ACCESS_MODE:'public',ALLOWED_ORIGINS:'https://ccisternas-dev.github.io',REQUEST_LIMITER:{limit:async()=>({success:true})},SHARED_LIMITER:{limit:async()=>({success:true})}}
const request=(overrides={})=>new Request('https://worker.test/api/translate/deepl',{method:'POST',headers:{Origin:'https://ccisternas-dev.github.io','CF-Connecting-IP':'192.0.2.1','Content-Type':'application/json'},body:JSON.stringify(input),...overrides})

test('DeepL Worker uses API Free and a server-only auth header',async t=>{
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  assert.equal(url,'https://api-free.deepl.com/v2/translate')
  assert.equal(options.headers.Authorization,`DeepL-Auth-Key ${fakeKey}`)
  assert.deepEqual(JSON.parse(options.body),{text:['Hola'],source_lang:'ES',target_lang:'DE'})
  assert.ok(options.signal)
  return Response.json({translations:[{detected_source_language:'ES',text:'Hallo'}]})
 })
 const response=await createHandler()(request(),env)
 assert.equal(response.status,200)
 assert.deepEqual(await response.json(),{source:'es',target:'de',translatedText:'Hallo'})
})
test('DeepL fails closed without enablement or a secret and retains origin and both rate limits',async t=>{
 const upstream=t.mock.method(globalThis,'fetch',async()=>{throw new Error('Must not call upstream')})
 for(const extra of [{DEEPL_ENABLED:'false'},{DEEPL_KEY:undefined},{DEEPL_KEY:' '},{TRANSLATION_ENABLED:'false'}]) assert.equal((await createHandler()(request(),{...env,...extra})).status,503)
 assert.equal((await createHandler()(request({headers:{Origin:'https://evil.test'}}),env)).status,403)
 assert.equal((await createHandler()(request({headers:{'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'}}),env)).status,403)
 assert.equal((await createHandler()(request(),{...env,REQUEST_LIMITER:{limit:async()=>({success:false})}})).status,429)
 assert.equal((await createHandler()(request(),{...env,SHARED_LIMITER:{limit:async()=>({success:false})}})).status,429)
 assert.equal((await createHandler()(request({body:JSON.stringify({...input,text:'a'.repeat(501)})}),env)).status,400)
 assert.equal(upstream.mock.callCount(),0)
})
test('DeepL maps quota, throttle, authentication and timeout failures without leaking upstream details',async t=>{
 for(const [status,code] of [[456,'quota_exhausted'],[429,'rate_limited'],[403,'provider_unavailable'],[500,'provider_unavailable']]){
  const mock=t.mock.method(globalThis,'fetch',async()=>Response.json({message:`${fakeKey} ${input.text}`},{status}))
  await assert.rejects(translateDeepL(fakeKey,input),{code})
  mock.mock.restore()
 }
 t.mock.method(globalThis,'fetch',async()=>{throw new DOMException('upstream details','TimeoutError')})
 await assert.rejects(translateDeepL(fakeKey,input),{code:'provider_timeout'})
})
test('DeepL rejects malformed, empty, oversized and mismatched output',async t=>{
 const outputs=[null,{}, {translations:[]},{translations:[null]}, {translations:[{text:' '}]},{translations:[{text:'a'.repeat(8001)}]},{translations:[{text:'Bonjour',detected_source_language:'FR'}]}]
 t.mock.method(globalThis,'fetch',async()=>Response.json(outputs.shift()))
 for(let i=0;i<7;i++) await assert.rejects(translateDeepL(fakeKey,input),{code:'invalid_provider_response'})
})
test('DeepL client sends only text and languages to the configured Worker route',async t=>{
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  assert.equal(url,'https://worker.test/api/translate/deepl')
  assert.deepEqual(options.headers,{'Content-Type':'application/json'})
  assert.deepEqual(JSON.parse(options.body),input)
  return Response.json({...input,translatedText:'Hallo'})
 })
 assert.equal(await translateWithProvider('Hola','es','de',new AbortController().signal,{provider:'deepl',endpoint:'https://worker.test/api/translate/'}),'Hallo')
})
