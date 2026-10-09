import Taro from '@tarojs/taro'
import { createInventoryClient } from './storageClient'
import type { IngredientInput, IngredientUpdate, InventoryQuery } from './storageClient'

function client() {
  return createInventoryClient(async options => {
    const response = await Taro.request<unknown>(options)
    return { statusCode: response.statusCode, data: response.data }
  }, INVENTORY_API_BASE_URL)
}

export const getStorageList = async (query?: InventoryQuery) => client().list(query)
export const getStorage = async (id: number) => client().get(id)
export const createStorage = async (input: IngredientInput) => client().create(input)
export const updateStorage = async (id: number, input: IngredientUpdate) => client().update(id, input)
export const deleteStorage = async (id: number, version: number) => client().remove(id, version)
export { InventoryApiError } from './storageClient'
export type { Ingredient, IngredientInput, IngredientUpdate, InventoryQuery } from './storageClient'
