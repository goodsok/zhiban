import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { 
  MessageCircle, 
  Calendar, 
  Lightbulb, 
  Heart
} from 'lucide-react-taro'

interface Strategy {
  category: string
  action: string
  reason: string
  timing: string
}

interface StrategyCardProps {
  strategies: Strategy[]
}

const StrategyCard: FC<StrategyCardProps> = ({ strategies }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '沟通':
        return <MessageCircle size={14} color="#000" />
      case '约会':
        return <Calendar size={14} color="#000" />
      case '话题':
        return <Lightbulb size={14} color="#000" />
      case '关怀':
        return <Heart size={14} color="#000" />
      default:
        return <MessageCircle size={14} color="#000" />
    }
  }

  const getCategoryBg = (category: string) => {
    switch (category) {
      case '沟通':
        return 'bg-blue-50'
      case '约会':
        return 'bg-pink-50'
      case '话题':
        return 'bg-amber-50'
      case '关怀':
        return 'bg-red-50'
      default:
        return 'bg-gray-50'
    }
  }

  if (strategies.length === 0) {
    return (
      <View className="bg-white rounded-xl border border-gray-100 p-4">
        <Text className="block text-sm text-gray-400 text-center">暂无互动策略推荐</Text>
      </View>
    )
  }

  return (
    <View className="space-y-3">
      {strategies.map((strategy, index) => (
        <View
          key={index}
          className="bg-white rounded-xl border border-gray-100 p-4"
        >
          <View className="flex items-start gap-3">
            <View className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryBg(strategy.category)}`}>
              {getCategoryIcon(strategy.category)}
            </View>
            <View className="flex-1">
              <View className="flex items-center gap-2 mb-1">
                <Text className="block text-xs text-gray-400">{strategy.category}</Text>
              </View>
              <Text className="block text-sm font-medium text-gray-800 mb-2">
                {strategy.action}
              </Text>
              <Text className="block text-xs text-gray-500 mb-2">
                {strategy.reason}
              </Text>
              <View className="flex items-center gap-1.5">
                <Text className="block text-xs text-gray-400">最佳时机:</Text>
                <Text className="block text-xs font-medium text-gray-600">{strategy.timing}</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}

export default StrategyCard
