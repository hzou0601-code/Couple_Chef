import { View, Text, Image } from '@tarojs/components'
import './DishCard.scss'

interface Dish {
  id: number
  name: string
  available: boolean
  missing?: string[]
  image?: string
}

interface DishCardProps {
  dish: Dish
  onClick?: (dish: Dish) => void
}

export default function DishCard({ dish, onClick }: DishCardProps) {
  const handleClick = () => {
    if (onClick) onClick(dish)
  }

  return (
    <View className='dish-card' onClick={handleClick}>
      <Image
        src={dish.image || `/assets/${dish.name}.png`}
        className='dish-img'
        mode='aspectFill'
      />
      <Text className='dish-name'>{dish.name}</Text>
      <Text className={dish.available ? 'status available' : 'status unavailable'}>
        {dish.available ? '可做' : `缺料：${dish.missing?.join('、') || '未知'}`}
      </Text>
    </View>
  )
}
