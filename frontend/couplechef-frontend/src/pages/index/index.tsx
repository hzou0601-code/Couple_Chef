import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useEffect } from 'react'
import { useMenuStore } from '../../store/menuStore'
import './index.scss'

export default function Index() {
  const { dishes, fetchDishes } = useMenuStore()

  useEffect(() => {
    fetchDishes()
  }, [])

  return (
    <View className='menu-page'>
      <Text className='page-title'>今日菜单</Text>

      <ScrollView className='dish-list' scrollY>
        {dishes.map((dish, index) => (
          <View key={dish.id || index} className='dish-card'>
            <Image className='dish-img' src={dish.imageUrl || '/images/default.png'} />
            <View className='dish-info'>
              <Text className='dish-name'>{dish.name}</Text>
              <Text className='dish-desc'>{dish.description || '暂无描述'}</Text>
              <Text className={`status ${dish.available ? 'available' : 'unavailable'}`}>
                {dish.available ? '可做' : '缺料'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

    </View>
  )
}
