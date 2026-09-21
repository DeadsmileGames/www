import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/services/api.js', import.meta.url), 'utf8')
  .replace("import { friendlyErrorMessage } from '../utils/friendlyErrors';", readFileSync(new URL('../src/utils/friendlyErrors.js', import.meta.url), 'utf8').replace('export function friendlyErrorMessage', 'function friendlyErrorMessage'))
  .replaceAll('import.meta.env.DEV', 'false')
  .replaceAll('import.meta.env.PROD', 'true')
  .replaceAll('import.meta.env.VITE_API_URL', 'undefined');
let sequence = 0;
async function client(handler) {
  globalThis.window = { setTimeout, clearTimeout, dispatchEvent() {} };
  globalThis.fetch = handler;
  return (await import(`data:text/javascript;base64,${Buffer.from(source + `\n// ${sequence++}`).toString('base64')}`)).api;
}
function response(data, status = 200) { return new Response(JSON.stringify(data), { status }); }

test('newsletter uses CSRF, credentials and the API response envelope', async () => {
  const requests = [];
  const api = await client(async (url, options) => {
    requests.push({url, ...options});
    return response({data:url.endsWith('/csrf') ? {token:'test-csrf'} : {received:true}});
  });
  assert.deepEqual(await api.post('/newsletter', {email:'player@example.test'}), {received:true});
  assert.equal(requests.length, 2);
  assert.equal(requests[1].headers['X-CSRF-Token'], 'test-csrf');
  assert.equal(requests[1].credentials, 'include');
  assert.equal(JSON.parse(requests[1].body).email, 'player@example.test');
});
test('a rotated CSRF token is retried once, without losing the request body', async () => {
  let tokens = 0, writes = 0;
  const api = await client(async (url, options) => {
    if (url.endsWith('/csrf')) return response({data:{token:`token-${++tokens}`}});
    writes++;
    if (writes === 1) return response({error:{code:'CSRF_VALIDATION_FAILED'}},403);
    assert.equal(options.headers['X-CSRF-Token'],'token-2');
    assert.deepEqual(JSON.parse(options.body), {token:'newsletter-token'});
    return response({data:{confirmed:true}});
  });
  assert.deepEqual(await api.post('/newsletter/confirm',{token:'newsletter-token'}),{confirmed:true});
  assert.equal(writes,2);
});
test('network errors and API validation errors remain actionable', async () => {
  let api = await client(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(api.get('/games'), error => error.code === 'NETWORK_ERROR');
  api = await client(async () => response({error:{message:'Video not found.',code:'VIDEO_NOT_FOUND'}},404));
  await assert.rejects(api.get('/videos/missing'), error => error.message === 'This page or action could not be found.' && error.status === 404);
});
test('external and protocol-relative API paths are rejected', async () => {
  const api = await client(async () => { assert.fail('Invalid path must never be fetched'); });
  await assert.rejects(api.get('//other.example'), error => error.code === 'INVALID_REQUEST_PATH');
  await assert.rejects(api.get('https://other.example'), error => error.code === 'INVALID_REQUEST_PATH');
});
