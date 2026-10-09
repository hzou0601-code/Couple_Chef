import { Text, View } from '@tarojs/components'
import { ActionButton } from '../ActionButton'
import './index.scss'

interface PageStateProps {
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function PageState({ title, description, action }: PageStateProps) {
  return <View className='chef-state'>
    <Text className='chef-state__title'>{title}</Text>
    <Text className='chef-state__description'>{description}</Text>
    {action && <ActionButton label={action.label} onClick={action.onClick} />}
  </View>
}
