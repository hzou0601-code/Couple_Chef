export const ingredientUnits = ['g', 'kg', 'ml', 'l', '个'] as const
export const ingredientCategories = ['蔬菜', '肉禽', '水产', '蛋奶', '主食', '调味', '其他'] as const
export type IngredientUnit = typeof ingredientUnits[number]
export type IngredientCategory = typeof ingredientCategories[number]

export interface IngredientInput {
  name: string
  quantity: number
  unit: IngredientUnit
  location: string
  category: IngredientCategory
  expiresOn?: string | null
}
export interface Ingredient extends IngredientInput {
  id: number
  version: number
  expiresOn: string | null
}
export interface IngredientUpdate extends IngredientInput { version: number }
export interface InventoryQuery {
  search?: string
  category?: IngredientCategory
  expiringDays?: number
}
export interface RequestOptions {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: IngredientInput | IngredientUpdate
  header: Record<string, string>
  timeout: number
}
export type InventoryTransport = (options: RequestOptions) => Promise<{ statusCode: number; data: unknown }>

export class InventoryApiError extends Error {
  readonly code: string
  readonly status: number
  constructor(code: string, message: string, status = 0) {
    super(message)
    this.name = 'InventoryApiError'
    this.code = code
    this.status = status
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function integer(value: unknown, minimum = 0): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum
}
function isoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1 || month < 1 || month > 12 || day < 1) return false
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
}
function ingredient(value: unknown): value is Ingredient {
  return record(value) && integer(value.id, 1) && integer(value.version)
    && typeof value.name === 'string' && typeof value.quantity === 'number'
    && Number.isFinite(value.quantity) && value.quantity >= 0
    && ingredientUnits.some(unit => unit === value.unit)
    && typeof value.location === 'string'
    && ingredientCategories.some(category => category === value.category)
    && (value.expiresOn === null || isoDate(value.expiresOn))
}
function requireInteger(value: number, minimum = 0): void {
  if (!integer(value, minimum)) {
    throw new InventoryApiError('CLIENT_VALIDATION', '记录编号和版本必须是有效整数')
  }
}

export function createInventoryClient(transport: InventoryTransport, baseUrl: string) {
  // No URL/URLSearchParams dependency: those browser globals are not portable to WeChat.
  const base = baseUrl.trim().replace(/\/+$/, '')
  const address = /^https?:\/\/([a-zA-Z0-9.-]+)(?::(\d{1,5}))?(?:\/[^\s?#]*)?$/.exec(base)
  const host = address?.[1] || ''
  const labels = host.split('.')
  const validHost = labels.every(label => /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(label))
    && (!/^[\d.]+$/.test(host) || (labels.length === 4 && labels.every(label => Number(label) <= 255)))
  const validPort = !address?.[2] || (Number(address[2]) >= 1 && Number(address[2]) <= 65535)
  if (!address || !validHost || !validPort) {
    throw new InventoryApiError('CONFIG_ERROR', '请配置有效的库存 API 地址')
  }

  async function request<T>(path: string, method: RequestOptions['method'],
    validate: (data: unknown) => data is T, data?: RequestOptions['data']): Promise<T> {
    let response: { statusCode: number; data: unknown }
    try {
      response = await transport({ url: base + path, method, data,
        header: { 'content-type': 'application/json' }, timeout: 10000 })
    } catch {
      throw new InventoryApiError('NETWORK_ERROR', '网络连接失败或请求超时，请检查连接后重试')
    }
    const body = response.data
    if (response.statusCode < 200 || response.statusCode >= 300) {
      if (record(body) && body.success === false && typeof body.code === 'string'
          && typeof body.message === 'string' && body.code && body.message) {
        throw new InventoryApiError(body.code, body.message, response.statusCode)
      }
      throw new InventoryApiError('HTTP_ERROR', '服务暂不可用，请稍后重试', response.statusCode)
    }
    if (!record(body) || body.success !== true || !validate(body.data)) {
      throw new InventoryApiError('PROTOCOL_ERROR', '库存响应格式异常，请稍后重试', response.statusCode)
    }
    return body.data
  }

  return {
    async list(query: InventoryQuery = {}): Promise<Ingredient[]> {
      const params: string[] = []
      if (query.search !== undefined) params.push('search=' + encodeURIComponent(query.search))
      if (query.category !== undefined) params.push('category=' + encodeURIComponent(query.category))
      if (query.expiringDays !== undefined) {
        if (!integer(query.expiringDays) || query.expiringDays > 30) {
          throw new InventoryApiError('CLIENT_VALIDATION', '临期天数须为0至30的整数')
        }
        params.push('expiringDays=' + query.expiringDays)
      }
      return request('/storage' + (params.length ? '?' + params.join('&') : ''), 'GET',
        (data): data is Ingredient[] => Array.isArray(data) && data.every(ingredient))
    },
    async get(id: number): Promise<Ingredient> {
      requireInteger(id, 1)
      return request('/storage/' + id, 'GET', ingredient)
    },
    async create(input: IngredientInput): Promise<Ingredient> {
      return request('/storage', 'POST', ingredient, input)
    },
    async update(id: number, input: IngredientUpdate): Promise<Ingredient> {
      requireInteger(id, 1)
      requireInteger(input.version)
      return request('/storage/' + id, 'PUT', ingredient, input)
    },
    async remove(id: number, version: number): Promise<null> {
      requireInteger(id, 1)
      requireInteger(version)
      return request('/storage/' + id + '?version=' + version, 'DELETE',
        (data): data is null => data === null)
    },
  }
}
