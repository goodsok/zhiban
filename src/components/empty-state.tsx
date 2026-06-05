import { View, Text } from '@tarojs/components'
import type { FC, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  message: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

/**
 * 空状态组件
 * 用于列表页、搜索页等无数据时的占位展示
 */
const EmptyState: FC<EmptyStateProps> = ({ message, description, actionLabel, onAction, icon }) => {
  return (
    <View className="flex flex-col items-center justify-center py-16 px-8">
      {icon && (
        <View className="mb-4 opacity-40">{icon}</View>
      )}
      <Text className="block text-gray-500 text-center mb-2">{message}</Text>
      {description && (
        <Text className="block text-xs text-gray-400 text-center mb-6">{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button
          className="bg-green-500 text-white rounded-xl"
          onClick={onAction}
        >
          <Text>{actionLabel}</Text>
        </Button>
      )}
    </View>
  )
}

export default EmptyState
