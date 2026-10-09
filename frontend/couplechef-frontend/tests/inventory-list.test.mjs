import test from 'node:test'
import assert from 'node:assert/strict'
import { createInventoryLoader, inventoryFilters } from '../src/features/inventory/listState.ts'
import { InventoryApiError } from '../src/api/storageClient.ts'

const item = { id: 1, version: 0, name: '番茄', quantity: 0, unit: 'g', category: '蔬菜', location: '冷藏', expiresOn: null }
function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

test('combined filters trim the name and preserve today (0)', () => {
  assert.deepEqual(inventoryFilters(' 番茄 ', '蔬菜', 0), { search: '番茄', category: '蔬菜', expiringDays: 0 })
  assert.deepEqual(inventoryFilters('  '), { search: undefined, category: undefined, expiringDays: undefined })
})
test('loading transitions to exact server records, including zero stock and an empty response', async () => {
  const states = [], queries = []
  const loader = createInventoryLoader(async query => { queries.push(query); return query.search ? [item] : [] }, state => states.push(state))
  await loader.load({ search: '番茄' })
  await loader.load({})
  assert.deepEqual(states, [{ status: 'loading' }, { status: 'ready', items: [item] }, { status: 'loading' }, { status: 'ready', items: [] }])
  assert.deepEqual(queries, [{ search: '番茄' }, {}])
})
test('newer success cannot be overwritten by older success or failure', async () => {
  for (const lateFailure of [false, true]) {
    const old = deferred(), current = deferred(), states = []
    const loader = createInventoryLoader(query => query.search === 'old' ? old.promise : current.promise, state => states.push(state))
    const first = loader.load({ search: 'old' }), second = loader.load({ search: 'new' })
    current.resolve([item]); await second
    if (lateFailure) old.reject(new Error('late')); else old.resolve([])
    await first
    assert.deepEqual(states.at(-1), { status: 'ready', items: [item] })
    assert.equal(states.length, 3)
  }
})
test('latest failure stays visible when an earlier request succeeds; explicit retry can recover', async () => {
  const old = deferred(), states = []
  let calls = 0
  const loader = createInventoryLoader(() => {
    calls++
    if (calls === 1) return old.promise
    if (calls === 2) return Promise.reject(new InventoryApiError('NETWORK_ERROR', '网络不可用'))
    return Promise.resolve([item])
  }, state => states.push(state))
  const first = loader.load({})
  await loader.load({ search: 'new' })
  old.resolve([item]); await first
  assert.deepEqual(states.at(-1), { status: 'error', message: '网络不可用' })
  assert.equal(calls, 2) // no automatic retry
  await loader.load({ search: 'new' })
  assert.deepEqual(states.at(-1), { status: 'ready', items: [item] })
})
test('hide/unmount invalidation suppresses late completion; a fresh show loads again', async () => {
  for (const failure of [false, true]) {
    const pending = deferred(), states = []
    let calls = 0
    const loader = createInventoryLoader(() => ++calls === 1 ? pending.promise : Promise.resolve([]), state => states.push(state))
    const run = loader.load({})
    loader.invalidate()
    if (failure) pending.reject(new Error('hidden')); else pending.resolve([item])
    await run
    assert.deepEqual(states, [{ status: 'loading' }])
    await loader.load({})
    assert.deepEqual(states.at(-1), { status: 'ready', items: [] })
  }
})
test('unexpected failures never expose raw diagnostic details', async () => {
  const states = []
  const loader = createInventoryLoader(async () => { throw new Error('secret/token') }, state => states.push(state))
  await loader.load({})
  assert.deepEqual(states.at(-1), { status: 'error', message: '库存加载失败，请稍后重试' })
})
