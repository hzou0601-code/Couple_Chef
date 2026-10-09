import type { Ingredient, InventoryQuery } from '../../api/storageClient'

export type InventoryListState =
  | { status: 'loading' }
  | { status: 'ready'; items: Ingredient[] }
  | { status: 'error'; message: string }

export function inventoryFilters(search: string, category?: InventoryQuery['category'], expiringDays?: number): InventoryQuery {
  return { search: search.trim() || undefined, category, expiringDays }
}

// Each page owns its loader. A newer query or page hide invalidates older responses.
export function createInventoryLoader(fetchItems: (query: InventoryQuery) => Promise<Ingredient[]>,
  publish: (state: InventoryListState) => void) {
  let generation = 0
  return {
    async load(query: InventoryQuery): Promise<void> {
      const request = ++generation
      publish({ status: 'loading' })
      try {
        const items = await fetchItems({ ...query })
        if (request === generation) publish({ status: 'ready', items })
      } catch (error) {
        if (request !== generation) return
        const message = error instanceof Error && error.name === 'InventoryApiError'
          ? error.message : '库存加载失败，请稍后重试'
        publish({ status: 'error', message })
      }
    },
    invalidate() { generation++ },
  }
}
