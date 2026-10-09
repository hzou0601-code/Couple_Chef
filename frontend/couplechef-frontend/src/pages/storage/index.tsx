import { Input, Picker, Text, View } from '@tarojs/components'
import { useDidHide, useDidShow } from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import { getStorageList } from '../../api/storage'
import type { InventoryQuery } from '../../api/storage'
import { ingredientCategories } from '../../api/storageClient'
import { ActionButton } from '../../components/ActionButton'
import { PageState } from '../../components/PageState'
import { createInventoryLoader, inventoryFilters } from '../../features/inventory/listState'
import type { InventoryListState } from '../../features/inventory/listState'
import './index.scss'

const categories = ['全部分类', ...ingredientCategories]
const expiryLabels = ['全部日期', '今天及已过期', '3天内及已过期', '7天内及已过期']
const expiryDays = [undefined, 0, 3, 7]

export default function StoragePage() {
  const [search, setSearch] = useState('')
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [expiryIndex, setExpiryIndex] = useState(0)
  const [state, setState] = useState<InventoryListState>({ status: 'loading' })
  const query = useRef<InventoryQuery>({})
  const loader = useRef<ReturnType<typeof createInventoryLoader> | null>(null)
  if (!loader.current) loader.current = createInventoryLoader(getStorageList, setState)

  useDidShow(() => { void loader.current?.load(query.current) })
  useDidHide(() => { loader.current?.invalidate() })
  useEffect(() => () => { loader.current?.invalidate() }, [])

  function apply(nextSearch = search, nextCategory = categoryIndex, nextExpiry = expiryIndex) {
    query.current = inventoryFilters(nextSearch, ingredientCategories[nextCategory - 1], expiryDays[nextExpiry])
    void loader.current?.load(query.current)
  }
  function clear() {
    setSearch('')
    setCategoryIndex(0)
    setExpiryIndex(0)
    apply('', 0, 0)
  }
  const filtered = Boolean(query.current.search || query.current.category || query.current.expiringDays !== undefined)

  return <View className='inventory-page'>
    <Text className='inventory-title'>我的冰箱</Text>
    <Text className='inventory-subtitle'>查看现有食材，为今晚做准备</Text>
    <View className='inventory-filters'>
      <View className='inventory-search'>
        <Input className='inventory-input' value={search} placeholder='搜索食材名称' maxlength={80}
          confirmType='search' onInput={event => setSearch(event.detail.value)} onConfirm={() => apply()}
        />
        <ActionButton label='搜索' onClick={() => apply()} />
      </View>
      <View className='inventory-selectors'>
        <Picker mode='selector' range={categories} value={categoryIndex} onChange={event => {
          const index = Number(event.detail.value)
          setCategoryIndex(index)
          apply(search, index, expiryIndex)
        }}
        ><View className='inventory-select'>分类：{categories[categoryIndex]} ▾</View></Picker>
        <Picker mode='selector' range={expiryLabels} value={expiryIndex} onChange={event => {
          const index = Number(event.detail.value)
          setExpiryIndex(index)
          apply(search, categoryIndex, index)
        }}
        ><View className='inventory-select'>日期：{expiryLabels[expiryIndex]} ▾</View></Picker>
      </View>
      <View className='inventory-actions'>
        <ActionButton label='清空筛选' secondary onClick={clear} />
        <ActionButton label='刷新库存' secondary onClick={() => { void loader.current?.load(query.current) }} />
      </View>
      <Text className='inventory-hint'>临期筛选包含已过期食材，请核对日期；零数量批次仍显示。</Text>
    </View>
    {state.status === 'loading' && <PageState title='正在查看库存' description='正在获取最新食材…' />}
    {state.status === 'error' && <PageState title='暂时无法加载库存' description={state.message}
      action={{ label: '重试', onClick: () => { void loader.current?.load(query.current) } }}
    />}
    {state.status === 'ready' && (state.items.length === 0
      ? <PageState title={filtered ? '没有符合条件的食材' : '冰箱里还没有食材'}
          description={filtered ? '试试其他名称、分类或日期范围。' : '记录食材后，库存会显示在这里。'}
          action={filtered ? { label: '清空筛选', onClick: clear } : undefined}
      />
      : <View>
          <Text className='inventory-count'>已加载 {state.items.length} 个食材批次</Text>
          {state.items.map(item => <View key={item.id} className='inventory-card'>
            <View className='inventory-card__heading'>
              <Text className='inventory-card__name'>{item.name}</Text>
              <Text className={`inventory-card__quantity${item.quantity === 0 ? ' inventory-card__quantity--zero' : ''}`}>
                {item.quantity} {item.unit}{item.quantity === 0 ? ' · 库存为零' : ''}
              </Text>
            </View>
            <Text className='inventory-card__details'>{item.category} · {item.location}</Text>
            <Text className='inventory-card__details'>{item.expiresOn ? `到期 ${item.expiresOn}` : '未设置到期日期'}</Text>
          </View>)}
        </View>)}
  </View>
}
