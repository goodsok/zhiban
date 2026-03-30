import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-taro'

interface HistoryItem {
  id: number
  dimension: string
  oldValue: number
  newValue: number
  changeReason: string
  evidence: string | null
  createdAt: string
}

interface PortraitHistoryProps {
  history: HistoryItem[]
  limit?: number
}

const PortraitHistory: FC<PortraitHistoryProps> = ({ history, limit = 5 }) => {
  const displayHistory = history.slice(0, limit)
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const getChangeIcon = (oldValue: number, newValue: number) => {
    const diff = newValue - oldValue
    if (diff > 5) return <TrendingUp size={14} color="#10B981" />
    if (diff < -5) return <TrendingDown size={14} color="#EF4444" />
    return <Minus size={14} color="#6B7280" />
  }

  const getChangeText = (oldValue: number, newValue: number) => {
    const diff = newValue - oldValue
    if (diff > 0) return `+${diff}`
    return `${diff}`
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      chat_analysis: '聊天分析',
      behavior_update: '行为更新',
      manual: '手动调整',
    }
    return labels[reason] || reason
  }

  if (displayHistory.length === 0) {
    return (
      <View className="bg-white rounded-xl border border-gray-100 p-4">
        <Text className="block text-sm text-gray-400 text-center">暂无画像变化记录</Text>
      </View>
    )
  }

  return (
    <View className="bg-white rounded-xl border border-gray-100">
      {displayHistory.map((item, index) => (
        <View
          key={item.id}
          className={`flex items-start gap-3 p-4 ${
            index < displayHistory.length - 1 ? 'border-b border-gray-100' : ''
          }`}
        >
          <View className="mt-1">
            {getChangeIcon(item.oldValue, item.newValue)}
          </View>
          <View className="flex-1">
            <View className="flex items-center justify-between mb-1">
              <Text className="block text-sm font-medium text-gray-800">{item.dimension}</Text>
              <Text
                className={`block text-sm font-semibold ${
                  item.newValue > item.oldValue ? 'text-emerald-600' : 
                  item.newValue < item.oldValue ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                {getChangeText(item.oldValue, item.newValue)}
              </Text>
            </View>
            <View className="flex items-center gap-2">
              <Text className="block text-xs text-gray-400">
                {item.oldValue} → {item.newValue}
              </Text>
              <Text className="block text-xs text-gray-300">|</Text>
              <Text className="block text-xs text-gray-400">
                {getReasonLabel(item.changeReason)}
              </Text>
            </View>
          </View>
          <Text className="block text-xs text-gray-400">{formatDate(item.createdAt)}</Text>
        </View>
      ))}
    </View>
  )
}

export default PortraitHistory
