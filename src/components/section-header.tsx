import { View, Text } from '@tarojs/components'
import type { FC, ReactNode } from 'react'

interface SectionHeaderProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

/**
 * 信息分组标题组件
 * 用于详情页、编辑页等区域分组标题
 */
const SectionHeader: FC<SectionHeaderProps> = ({ icon, title, description, action }) => {
  return (
    <View className="flex items-center gap-2 mb-3">
      {icon && (
        <View className="w-6 h-6 rounded-md bg-green-50 flex items-center justify-center">
          {icon}
        </View>
      )}
      <Text className="block text-sm font-semibold text-gray-900">{title}</Text>
      {description && (
        <Text className="block text-xs text-gray-400">{description}</Text>
      )}
      {action && (
        <View className="ml-auto">{action}</View>
      )}
    </View>
  )
}

export default SectionHeader
