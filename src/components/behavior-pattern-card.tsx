import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  MessageCircle, 
  Smile, 
  Send,
  TrendingUp,
  Wifi,
  MapPin
} from 'lucide-react-taro'

interface BehaviorPattern {
  avgResponseTime: number | null
  responseTimeVariance: number | null
  activeHours: Record<string, number>
  activeDays: Record<string, number>
  messageLengthAvg: number | null
  emojiUsageRate: number
  questionRate: number
  initiativeRate: number
  topicCategories: Record<string, number>
  emotionalKeywords: string[]
  totalInteractions: number
  communicationStyleOnline?: string
  communicationStyleOffline?: string
}

interface BehaviorPatternCardProps {
  pattern: BehaviorPattern
}

const styleLabels: Record<string, string> = {
  direct: '直接坦率',
  indirect: '委婉含蓄',
  playful: '活泼调皮',
  warm: '温柔体贴',
  rational: '理性冷静',
  balanced: '因人而异',
}

const BehaviorPatternCard: FC<BehaviorPatternCardProps> = ({ pattern }) => {
  // 获取最活跃时段
  const getActiveHours = () => {
    const hours = Object.entries(pattern.activeHours)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([h]) => `${h}:00`)
    return hours
  }

  // 格式化回复时间
  const formatResponseTime = (minutes: number | null) => {
    if (minutes === null) return '未知'
    if (minutes < 1) return '秒回'
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    return `${hours}小时+`
  }

  // 获取话题偏好
  const getTopTopics = () => {
    const topicLabels: Record<string, string> = {
      daily: '日常',
      work: '工作',
      emotion: '情感',
      hobby: '兴趣',
      future: '未来',
      relationship: '关系',
    }
    
    return Object.entries(pattern.topicCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => topicLabels[key] || key)
  }

  // 获取互动风格
  const getInteractionStyle = () => {
    if (pattern.initiativeRate > 60) return { label: '主动型', color: 'text-emerald-600' }
    if (pattern.initiativeRate < 40) return { label: '被动型', color: 'text-amber-600' }
    return { label: '平衡型', color: 'text-gray-600' }
  }

  // 线上线下是否有差异
  const hasStyleDifference = pattern.communicationStyleOnline && pattern.communicationStyleOffline && pattern.communicationStyleOnline !== pattern.communicationStyleOffline
  const hasAnyStyle = pattern.communicationStyleOnline || pattern.communicationStyleOffline

  const style = getInteractionStyle()

  return (
    <View className="bg-white rounded-xl border border-gray-100 p-4">
      <View className="flex items-center justify-between mb-4">
        <Text className="block text-sm font-semibold text-gray-900">行为模式</Text>
        <View className="flex items-center gap-1">
          <TrendingUp size={12} color="#6B7280" />
          <Text className="block text-xs text-gray-500">{pattern.totalInteractions}次互动</Text>
        </View>
      </View>

      <View className="grid grid-cols-2 gap-3 mb-4">
        {/* 回复时间 */}
        <View className="bg-gray-50 rounded-lg p-3">
          <View className="flex items-center gap-1.5 mb-1">
            <Clock size={14} color="#6B7280" />
            <Text className="block text-xs text-gray-500">平均回复</Text>
          </View>
          <Text className="block text-lg font-semibold text-gray-800">
            {formatResponseTime(pattern.avgResponseTime)}
          </Text>
        </View>

        {/* 消息长度 */}
        <View className="bg-gray-50 rounded-lg p-3">
          <View className="flex items-center gap-1.5 mb-1">
            <MessageCircle size={14} color="#6B7280" />
            <Text className="block text-xs text-gray-500">平均字数</Text>
          </View>
          <Text className="block text-lg font-semibold text-gray-800">
            {pattern.messageLengthAvg || '--'}
          </Text>
        </View>
      </View>

      {/* 线上/线下沟通风格 */}
      {hasAnyStyle && (
        <View className="mb-4 bg-gray-50 rounded-lg p-3">
          <Text className="block text-xs text-gray-500 mb-2">沟通风格</Text>
          <View className="flex items-start gap-3">
            {/* 线上 */}
            <View className="flex-1 bg-white rounded-lg p-3 border border-blue-100">
              <View className="flex items-center gap-1 mb-1">
                <Wifi size={12} color="#3b82f6" />
                <Text className="block text-xs text-blue-600 font-medium">线上</Text>
              </View>
              <Text className="block text-sm font-semibold text-gray-800">
                {pattern.communicationStyleOnline ? styleLabels[pattern.communicationStyleOnline] || pattern.communicationStyleOnline : '未填写'}
              </Text>
            </View>
            {/* 线下 */}
            <View className="flex-1 bg-white rounded-lg p-3 border border-orange-100">
              <View className="flex items-center gap-1 mb-1">
                <MapPin size={12} color="#f97316" />
                <Text className="block text-xs text-orange-600 font-medium">线下</Text>
              </View>
              <Text className="block text-sm font-semibold text-gray-800">
                {pattern.communicationStyleOffline ? styleLabels[pattern.communicationStyleOffline] || pattern.communicationStyleOffline : '未填写'}
              </Text>
            </View>
          </View>
          {hasStyleDifference && (
            <View className="mt-2 px-2 py-2 bg-amber-50 rounded">
              <Text className="block text-xs text-amber-700">线上线下面貌不同，需要注意场景切换</Text>
            </View>
          )}
        </View>
      )}

      {/* 行为指标 */}
      <View className="flex flex-wrap gap-2 mb-4">
        <View className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1">
          <Smile size={12} color="#6B7280" />
          <Text className="block text-xs text-gray-600">表情 {pattern.emojiUsageRate}%</Text>
        </View>
        <View className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1">
          <MessageCircle size={12} color="#6B7280" />
          <Text className="block text-xs text-gray-600">提问 {pattern.questionRate}%</Text>
        </View>
        <View className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1">
          <Send size={12} color="#6B7280" />
          <Text className="block text-xs text-gray-600">主动 {pattern.initiativeRate}%</Text>
        </View>
      </View>

      {/* 互动风格 */}
      <View className="flex items-center justify-between py-2 border-t border-gray-100">
        <Text className="block text-xs text-gray-500">互动风格</Text>
        <Text className={`block text-sm font-semibold ${style.color}`}>{style.label}</Text>
      </View>

      {/* 活跃时段 */}
      {getActiveHours().length > 0 && (
        <View className="flex items-center justify-between py-2 border-t border-gray-100">
          <Text className="block text-xs text-gray-500">活跃时段</Text>
          <View className="flex gap-1">
            {getActiveHours().map((h, i) => (
              <Badge key={i} className="bg-gray-100 text-gray-600 text-xs">{h}</Badge>
            ))}
          </View>
        </View>
      )}

      {/* 话题偏好 */}
      {getTopTopics().length > 0 && (
        <View className="flex items-center justify-between py-2 border-t border-gray-100">
          <Text className="block text-xs text-gray-500">话题偏好</Text>
          <View className="flex gap-1">
            {getTopTopics().map((t, i) => (
              <Badge key={i} className="bg-gray-100 text-gray-600 text-xs">{t}</Badge>
            ))}
          </View>
        </View>
      )}

      {/* 情绪关键词 */}
      {pattern.emotionalKeywords.length > 0 && (
        <View className="pt-3 mt-2 border-t border-gray-100">
          <Text className="block text-xs text-gray-500 mb-2">情绪关键词</Text>
          <View className="flex flex-wrap gap-2">
            {pattern.emotionalKeywords.slice(0, 6).map((keyword, i) => (
              <View 
                key={i} 
                className="px-2 py-1 bg-gray-50 rounded text-xs text-gray-600"
              >
                {keyword}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

export default BehaviorPatternCard
