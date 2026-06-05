import { View, Text } from '@tarojs/components'
import type { FC } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = FC<any>

interface CategoryCardProps {
  title: string
  subtitle: string
  icon: IconComponent
  iconColor?: string
  iconBg?: string
  onClick?: () => void
}

/**
 * 分类入口卡片组件
 * 用于发现页等功能分类展示
 * 默认使用薄荷绿图标底色
 */
const CategoryCard: FC<CategoryCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = '#2E9E5A',
  iconBg = 'bg-green-50',
  onClick,
}) => {
  return (
    <View
      className="bg-white rounded-2xl shadow-soft p-4"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
      onClick={onClick}
    >
      <View className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon size={22} color={iconColor} />
      </View>
      <Text className="block text-base font-semibold text-gray-900">{title}</Text>
      <Text className="block text-xs mt-1 leading-tight text-gray-500">{subtitle}</Text>
    </View>
  )
}

export default CategoryCard
