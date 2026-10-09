import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createInventoryClient, InventoryApiError } from '../src/api/storageClient.ts'

const item = { id: 1, version: 0, name: '西红柿', quantity: 1.25,
  unit: 'kg', location: '冷藏', category: '蔬菜', expiresOn: null }
const success = data => ({ statusCode: 200, data: { success: true, message: 'ok', data } })
function fixture(result = success(item)) {
  const calls = []
  return { calls, client: createInventoryClient(async options => {
    calls.push(options)
    if (result instanceof Error) throw result
    return result
  }, 'https://api.example.com/api/') }
}

test('empty inventory remains empty and filter values are encoded with zero days retained', async () => {
  const { client, calls } = fixture(success([]))
  assert.deepEqual(await client.list({ search: '西红柿 & 蛋', category: '蔬菜', expiringDays: 0 }), [])
  assert.equal(calls[0].url, 'https://api.example.com/api/storage?search='
    + encodeURIComponent('西红柿 & 蛋') + '&category=' + encodeURIComponent('蔬菜') + '&expiringDays=0')
  assert.equal(calls[0].method, 'GET')
})

test('CRUD uses API data directly and preserves optimistic version including zero', async () => {
  const { client, calls } = fixture()
  const { id, version, ...input } = item
  assert.deepEqual(await client.get(id), item)
  assert.deepEqual(await client.create(input), item)
  assert.deepEqual(await client.update(id, { ...input, version }), item)
  assert.deepEqual(calls.map(call => call.method), ['GET', 'POST', 'PUT'])
  assert.equal(calls[2].data.version, 0)
  assert.equal(calls[1].header['content-type'], 'application/json')
  assert.equal(calls[0].timeout, 10000)
  const deleted = fixture(success(null))
  assert.equal(await deleted.client.remove(1, 0), null)
  assert.equal(deleted.calls[0].url, 'https://api.example.com/api/storage/1?version=0')
  assert.equal(deleted.calls[0].method, 'DELETE')
})

for (const [status, code] of [[400, 'VALIDATION_ERROR'], [404, 'NOT_FOUND'], [409, 'STALE_VERSION']]) {
  test(`HTTP ${status} preserves stable backend error code and never retries a write`, async () => {
    const { client, calls } = fixture({ statusCode: status,
      data: { success: false, code, message: '请刷新库存', data: null } })
    await assert.rejects(client.update(1, item), error => error instanceof InventoryApiError
      && error.status === status && error.code === code && error.message === '请刷新库存')
    assert.equal(calls.length, 1)
  })
}

test('network and timeout reject without exposing raw transport diagnostics or retrying', async () => {
  const { client, calls } = fixture(new Error('raw URL and transport diagnostics'))
  await assert.rejects(client.create(item), error => error.code === 'NETWORK_ERROR'
    && !error.message.includes('raw URL'))
  assert.equal(calls.length, 1)
})

test('unstructured server failure is an HTTP error, never a successful empty inventory', async () => {
  const { client } = fixture({ statusCode: 503, data: '<html>unavailable</html>' })
  await assert.rejects(client.list(), error => error.code === 'HTTP_ERROR' && error.status === 503)
})

test('invalid success payloads and HTTP-200 business failures cannot become valid inventory', async () => {
  for (const response of [success(null), success([{ ...item, unit: '斤' }]),
    success([{ ...item, quantity: -1 }]), success([{ ...item, version: 0.5 }]),
    { statusCode: 200, data: { success: false, message: '失败', data: [] } }]) {
    const { client } = fixture(response)
    await assert.rejects(client.list(), error => error.code === 'PROTOCOL_ERROR')
  }
})

test('invalid config, identifiers, versions and expiry filters fail before network traffic', async () => {
  for (const base of ['', 'file:///tmp', 'https://user:pass@example.com/api', 'https://example.com/api?key=x',
    'https://api.example.com:abc/api', 'https://:443/api', 'https://[::1/api',
    'https://example.com:65536/api', 'https://example.com:0/api', 'http://999.0.0.1/api']) {
    assert.throws(() => createInventoryClient(async () => success([]), base),
      error => error.code === 'CONFIG_ERROR')
  }
  const { client, calls } = fixture()
  await assert.rejects(client.get(0), error => error.code === 'CLIENT_VALIDATION')
  await assert.rejects(client.update(1, { ...item, version: 0.5 }), error => error.code === 'CLIENT_VALIDATION')
  await assert.rejects(client.remove(1, -1), error => error.code === 'CLIENT_VALIDATION')
  await assert.rejects(client.list({ expiringDays: 31 }), error => error.code === 'CLIENT_VALIDATION')
  assert.equal(calls.length, 0)
})

test('calendar-invalid expiry dates are rejected and real leap days are retained', async () => {
  for (const expiresOn of ['2026-02-30', '1900-02-29', '0000-01-01', '2026-13-01', '2026-04-31']) {
    await assert.rejects(fixture(success({ ...item, expiresOn })).client.get(1),
      error => error.code === 'PROTOCOL_ERROR')
  }
  for (const expiresOn of ['2000-02-29', '2028-02-29', '0001-01-01', '9999-12-31']) {
    assert.equal((await fixture(success({ ...item, expiresOn })).client.get(1)).expiresOn, expiresOn)
  }
})
