import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react-taro'

interface Prediction {
  trend: 'improving' | 'stable' | 'declining'
  confidence: number
  insights: string[]
  recommendations: string[]
}

interface RelationshipPredictionProps {
  prediction: Prediction
}

const RelationshipPrediction: FC<RelationshipPredictionProps> = ({ prediction }) => {
  const getTrendConfig = (trend: string) => {
    switch (trend) {
      case 'improving':
        return {
          icon: <TrendingUp size={24} color="#4ECB71" />,
          label: '上升趋势',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-emerald-200',
        }
      case 'declining':
        return {
          icon: <TrendingDown size={24} color="#EF4444" />,
          label: '下降趋势',
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        }
      default:
        return {
          icon: <Minus size={24} color="#6B7280" />,
          label: '稳定',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        }
    }
  }

  const config = getTrendConfig(prediction.trend)

  return (
    <View className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-4`}>
      <View className="flex items-center justify-between mb-4">
        <View className="flex items-center gap-3">
          <Sparkles size={16} color="#6B7280" />
          <Text className="block text-sm font-semibold text-gray-800">关系预测</Text>
        </View>
        <View className="flex items-center gap-3">
          {config.icon}
          <Text className={`block text-sm font-semibold ${config.color}`}>{config.label}</Text>
        </View>
      </View>

      {/* 置信度 */}
      <View className="flex items-center gap-3 mb-4">
        <View className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <View 
            className="h-full bg-gray-500 rounded-full"
            style={{ width: `${prediction.confidence}%` }}
          />
        </View>
        <Text className="block text-xs text-gray-500">置信度 {prediction.confidence}%</Text>
      </View>

      {/* 洞察 */}
      {prediction.insights.length > 0 && (
        <View className="mb-4">
          <Text className="block text-xs text-gray-500 mb-2">关键洞察</Text>
          {prediction.insights.map((insight, i) => (
            <View key={i} className="flex items-start gap-3 mb-1">
              <Text className="block text-xs text-gray-400">•</Text>
              <Text className="block text-sm text-gray-700">{insight}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 建议 */}
      {prediction.recommendations.length > 0 && (
        <View className="pt-3 border-t border-gray-200">
          <Text className="block text-xs text-gray-500 mb-2">建议</Text>
          {prediction.recommendations.map((rec, i) => (
            <View key={i} className="flex items-start gap-3 mb-1">
              <Text className="block text-xs text-gray-400">→</Text>
              <Text className="block text-sm text-gray-700">{rec}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

export default RelationshipPrediction
