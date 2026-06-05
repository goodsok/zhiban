import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { Progress } from '@/components/ui/progress'

interface DimensionCardProps {
  title: string
  icon: string
  dimensions: Array<{
    name: string
    value: number
    description?: string
  }>
  color?: string
}

const DimensionCard: FC<DimensionCardProps> = ({
  title,
  icon,
  dimensions,
}) => {
  return (
    <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
      <View className="flex items-center gap-3 mb-4">
        <Text className="block text-lg">{icon}</Text>
        <Text className="block text-sm font-semibold text-gray-900">{title}</Text>
      </View>
      
      {dimensions.map((dim, i) => (
        <View key={i} className="mb-4">
          <View className="flex items-center justify-between mb-1">
            <Text className="block text-xs text-gray-500">{dim.name}</Text>
            <Text className="block text-sm font-semibold text-gray-700">{dim.value}</Text>
          </View>
          <Progress 
            value={dim.value} 
            className="h-2 bg-gray-100"
          />
          {dim.description && (
            <Text className="block text-xs text-gray-400 mt-1">{dim.description}</Text>
          )}
        </View>
      ))}
    </View>
  )
}

export default DimensionCard
