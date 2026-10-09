import { Button } from '@tarojs/components'
import './index.scss'

interface ActionButtonProps {
  label: string
  onClick: () => void
  secondary?: boolean
  disabled?: boolean
}

export function ActionButton({ label, onClick, secondary = false, disabled = false }: ActionButtonProps) {
  return <Button className={`chef-button${secondary ? ' chef-button--secondary' : ''}`}
    disabled={disabled} onClick={onClick}
  >{label}</Button>
}
