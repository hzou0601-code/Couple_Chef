// src/store/menuStore.ts
import { create } from 'zustand'
import Taro from '@tarojs/taro'

interface Dish {
  id: number
  name: string
  description?: string
  available: boolean
  imageUrl?: string | null
  tags?: string[] | null
  recipeSteps?: string[] | null
  updatedAt?: string
  ingredients?: string[]
}

interface MenuStore {
  dishes: Dish[]
  loading: boolean
  error: string | null
  fetchDishes: () => Promise<void>
}

export const useMenuStore = create<MenuStore>((set) => ({
  dishes: [],
  loading: false,
  error: null,

  fetchDishes: async () => {
    console.log('🍳 [menuStore] fetchDishes() 被调用')

    const BASE_URL =
      process.env.TARO_ENV === 'weapp'
        ? 'http://localhost:8080'
        : 'http://localhost:8080'

    try {
      set({ loading: true, error: null })
      console.log('🔗 请求接口:', `${BASE_URL}/api/menu`)

      const res = await Taro.request({
        url: `${BASE_URL}/api/menu`,
        method: 'GET',
        header: { 'Content-Type': 'application/json' },
      })

      console.log('📡 返回结果:', res.data)

      // ✅ 安全提取数据
      const dishes =
        Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
          ? res.data.data
          : []

      console.log('✅ 菜单数据:', dishes)

      set({ dishes, loading: false })
    } catch (err) {
      console.error('❌ fetchDishes error:', err)
      set({ dishes: [], loading: false, error: String(err) })
    }
  },
}))
