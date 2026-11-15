import test from 'node:test'
import assert from 'node:assert/strict'
import { translateMicrosoft, translateGoogle } from '../worker/src/http-providers.ts'
import { createHandler } from '../worker/src/index.ts'
import { translateWithProvider, isTranslationProvider } from '../src/translation-client.ts'
const input = {text:'Hola',source:'es',target:'de'}
const key = 'test-only-upstream-key'
const env = {
 AI:{run:async()=>{throw new Error('Wrong provider')}}, MICROSOFT_ENABLED:'true', MICROSOFT_TRANSLATOR_KEY:key,
 MICROSOFT_TRANSLATOR_REGION:'westeurope', GOOGLE_ENABLED:'true', GOOGLE_TRANSLATE_KEY:key,
 TRANSLATION_ENABLED:'true', ACCESS_MODE:'public', ALLOWED_ORIGINS:'https://ccisternas-dev.github.io',
 REQUEST_LIMITER:{limit:async()=>({success:true})}, SHARED_LIMITER:{limit:async()=>({success:true})},
}
const request=(provider,overrides={})=>new Request(`https://worker.test/api/translate/${provider}`,{
 method:'POST',headers:{Origin:env.ALLOWED_ORIGINS,'CF-Connecting-IP':'192.0.2.1','Content-Type':'application/json'},body:JSON.stringify(input),...overrides,
})
const adapters={microsoft:()=>translateMicrosoft(key,'westeurope',input),google:()=>translateGoogle(key,input)}

test('Microsoft routes explicit language pairs and authenticates only upstream, with optional region',async t=>{
 const regions=[]
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  const endpoint=new URL(url)
  assert.equal(endpoint.origin,'https://api.cognitive.microsofttranslator.com')
  assert.equal(endpoint.searchParams.get('api-version'),'3.0')
  assert.equal(endpoint.searchParams.get('from'),'es')
  assert.equal(endpoint.searchParams.get('to'),'de')
  assert.equal(endpoint.searchParams.get('textType'),'plain')
  assert(!url.includes(key)); assert.equal(options.headers['Ocp-Apim-Subscription-Key'],key)
  regions.push(options.headers['Ocp-Apim-Subscription-Region'])
  assert.deepEqual(JSON.parse(options.body),[{Text:'Hola'}]);assert.ok(options.signal)
  return Response.json([{translations:[{to:'de',text:'Hallo'}]}])
 })
 const response=await createHandler()(request('microsoft'),env)
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{source:'es',target:'de',translatedText:'Hallo'})
 assert.equal(await translateMicrosoft(key,undefined,input),'Hallo')
 assert.deepEqual(regions,['westeurope',undefined])
})
test('Google Basic uses a server-side header, NMT plain text and decodes returned entities once',async t=>{
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  assert.equal(url,'https://translation.googleapis.com/language/translate/v2')
  assert.equal(options.headers['x-goog-api-key'],key)
  assert.deepEqual(JSON.parse(options.body),{q:['Hola'],source:'es',target:'de',format:'text',model:'nmt'})
  assert.ok(options.signal)
  return Response.json({data:{translations:[{translatedText:'Hallo &amp; &quot;Welt&quot; &#39; &#x1F600; &amp;lt; &#x110000;'}]}})
 })
 const response=await createHandler()(request('google'),env)
 assert.equal(response.status,200)
 assert.equal((await response.json()).translatedText,'Hallo & "Welt" \' 😀 &lt; &#x110000;')
})
test('both providers fail closed without configuration and retain origin, input and both rate limits',async t=>{
 const upstream=t.mock.method(globalThis,'fetch',async()=>{throw new Error('Must not reach upstream')})
 for(const provider of ['microsoft','google']){
  const flag=provider==='microsoft'?'MICROSOFT_ENABLED':'GOOGLE_ENABLED'
  const secret=provider==='microsoft'?'MICROSOFT_TRANSLATOR_KEY':'GOOGLE_TRANSLATE_KEY'
  for(const extra of [{[flag]:'false'},{[secret]:undefined},{[secret]:' '},{TRANSLATION_ENABLED:'false'}]) assert.equal((await createHandler()(request(provider),{...env,...extra})).status,503)
  assert.equal((await createHandler()(request(provider,{headers:{Origin:'https://evil.test'}}),env)).status,403)
  assert.equal((await createHandler()(request(provider,{headers:{'Content-Type':'application/json'}}),env)).status,403)
  for(const limiter of ['REQUEST_LIMITER','SHARED_LIMITER']) assert.equal((await createHandler()(request(provider),{...env,[limiter]:{limit:async()=>({success:false})}})).status,429)
  assert.equal((await createHandler()(request(provider,{body:JSON.stringify({...input,text:'a'.repeat(501)})}),env)).status,400)
  const preflight=await createHandler()(request(provider,{method:'OPTIONS',body:undefined,headers:{Origin:env.ALLOWED_ORIGINS,'Access-Control-Request-Method':'POST'}}),env)
  assert.equal(preflight.status,204)
 }
 assert.equal((await createHandler()(request('deepl'),env)).status,404)
 assert.equal(upstream.mock.callCount(),0)
})
test('provider quota, rate, auth, network and timeout errors use safe codes without leaking details',async t=>{
 for(const provider of Object.keys(adapters)){
  const cases=[
   [403,provider==='microsoft'?{code:403001}:{errors:[{reason:'dailyLimitExceeded'}]},'quota_exhausted'],
   [429,{},'rate_limited'],[403,{code:403000},'provider_unavailable'],[500,{},'provider_unavailable'],
  ]
  if(provider==='google')cases.push([403,{errors:[{reason:'userRateLimitExceeded'}]},'rate_limited'])
  for(const [status,error,code] of cases){
   const mock=t.mock.method(globalThis,'fetch',async()=>Response.json({error:{...error,message:`${key} ${input.text}`}},{status}))
   const response=await createHandler()(request(provider),env)
   assert.deepEqual(await response.json(),{error:{code}})
   mock.mock.restore()
  }
  for(const [error,code] of [[new DOMException('details','TimeoutError'),'provider_timeout'],[new TypeError('network details'),'provider_unavailable']]){
   const mock=t.mock.method(globalThis,'fetch',async()=>{throw error})
   await assert.rejects(adapters[provider](),{code});mock.mock.restore()
  }
 }
})
test('both adapters reject malformed, blank, oversized and wrong-language output',async t=>{
 for(const provider of Object.keys(adapters)){
  const outputs=provider==='microsoft'
   ?[null,{},[],[{translations:[]}],[{translations:[{text:'Hallo',to:'fr'}]}],[{translations:[{text:' ',to:'de'}]}],[{translations:[{text:'x'.repeat(8001),to:'de'}]}]]
   :[null,{}, {data:{translations:[]}},{data:{translations:[null]}},{data:{translations:[{translatedText:'Hallo',detectedSourceLanguage:'fr'}]}},{data:{translations:[{translatedText:' '}]}},{data:{translations:[{translatedText:'x'.repeat(8001)}]}}]
  const mock=t.mock.method(globalThis,'fetch',async()=>Response.json(outputs.shift()))
  for(let i=0;i<7;i++)await assert.rejects(adapters[provider](),{code:'invalid_provider_response'})
  mock.mock.restore()
  const html=t.mock.method(globalThis,'fetch',async()=>new Response('<html>error</html>'))
  await assert.rejects(adapters[provider](),{code:'invalid_provider_response'});html.mock.restore()
 }
})
test('client sends only text/languages to each Worker route; removed provider is no longer valid',async t=>{
 assert.equal(isTranslationProvider('deepl'),false)
 for(const provider of ['microsoft','google']){
  const mock=t.mock.method(globalThis,'fetch',async(url,options)=>{
   assert.equal(url,`https://worker.test/api/translate/${provider}`)
   assert.deepEqual(options.headers,{'Content-Type':'application/json'})
   assert.deepEqual(JSON.parse(options.body),input)
   return Response.json({source:'es',target:'de',translatedText:'Hallo'})
  })
  assert.equal(await translateWithProvider('Hola','es','de',new AbortController().signal,{provider,endpoint:'https://worker.test/api/translate/'}),'Hallo')
  mock.mock.restore()
 }
})
