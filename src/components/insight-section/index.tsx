import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Brain, Sparkles, Eye, Lightbulb, CircleAlert, TrendingUp, MessageSquare, Heart, Target } from 'lucide-react-taro'

// AI洞察结果接口
interface InsightData {
  personalitySummary: string
  relationshipDynamics: string
  emotionalPatterns: string
  communicationStyle: string
  keyFindings: string[]
  blindSpots: string[]
  growthSuggestions: string[]
  actionPriority: string
}

interface InsightSectionProps {
  matchId: string
  matchName: string
}

const InsightSection: FC<InsightSectionProps> = ({ matchId, matchName }) => {
  const [insight, setInsight] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchInsight = async () => {
    if (!matchId) return

    try {
      setLoading(true)
      setError('')
      console.log('[Insight] Fetching AI insight for match:', matchId)
      const res = await Network.request({
        url: `/api/portrait/${matchId}/insight`,
        method: 'GET'
      })
      console.log('[Insight] Response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setInsight(res.data.data)
      } else {
        setError('洞察分析暂不可用，请稍后再试')
      }
    } catch (err) {
      console.error('[Insight] Fetch error:', err)
      setError('网络异常，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  // 加载态
  if (loading) {
    return (
      <View className="p-4">
        <View className="bg-white rounded-xl border border-gray-100 p-6">
          <View className="flex items-center justify-center gap-2 mb-4">
            <Brain size={20} color="#6366F1" className="animate-pulse" />
            <Text className="block text-base font-semibold text-gray-900">AI正在深度分析</Text>
          </View>
          <View className="space-y-3">
            <View className="flex items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <Text className="block text-sm text-gray-500">汇总{matchName}的所有行为数据...</Text>
            </View>
            <View className="flex items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
              <Text className="block text-sm text-gray-500">分析关系动态与情感模式...</Text>
            </View>
            <View className="flex items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.6s' }} />
              <Text className="block text-sm text-gray-500">生成深度洞察与行动建议...</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  // 错误态
  if (error) {
    return (
      <View className="p-4">
        <View className="bg-white rounded-xl border border-gray-100 p-6">
          <View className="flex items-center justify-center mb-3">
            <CircleAlert size={20} color="#EF4444" />
          </View>
          <Text className="block text-sm text-gray-500 text-center mb-4">{error}</Text>
          <View className="flex justify-center">
            <Button size="sm" onClick={fetchInsight}>重新分析</Button>
          </View>
        </View>
      </View>
    )
  }

  // 未请求态 - 展示引导
  if (!insight) {
    return (
      <View className="p-4">
        <View className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
          <View className="flex items-center gap-3 mb-4">
            <View className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <Sparkles size={24} color="#6366F1" />
            </View>
            <View className="flex-1">
              <Text className="block text-base font-semibold text-gray-900">AI深度洞察</Text>
              <Text className="block text-xs text-gray-500 mt-1">
                基于所有数据，AI为你生成全方位关系洞察
              </Text>
            </View>
          </View>

          <View className="space-y-2 mb-5">
            <View className="flex items-start gap-2">
              <Eye size={14} color="#6366F1" className="mt-1 shrink-0" />
              <Text className="block text-xs text-gray-600">综合分析{matchName}的性格特征、情感模式与沟通风格</Text>
            </View>
            <View className="flex items-start gap-2">
              <TrendingUp size={14} color="#6366F1" className="mt-1 shrink-0" />
              <Text className="block text-xs text-gray-600">洞察你们的关系动态和互动趋势</Text>
            </View>
            <View className="flex items-start gap-2">
              <Lightbulb size={14} color="#6366F1" className="mt-1 shrink-0" />
              <Text className="block text-xs text-gray-600">发现你的认知盲点，获取专属行动建议</Text>
            </View>
          </View>

          <Button className="w-full bg-indigo-500 text-white" onClick={fetchInsight}>
            <View className="flex items-center justify-center gap-2">
              <Brain size={16} color="#fff" />
              <Text className="text-white">开始AI洞察分析</Text>
            </View>
          </Button>
        </View>
      </View>
    )
  }

  // 有洞察数据 - 展示结果
  return (
    <View className="p-4">
      {/* 性格洞察 */}
      <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
        <View className="flex items-center gap-2 mb-3">
          <View className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Eye size={14} color="#6366F1" />
          </View>
          <Text className="block text-sm font-semibold text-gray-900">性格洞察</Text>
        </View>
        <Text className="block text-sm text-gray-700 leading-relaxed">{insight.personalitySummary}</Text>
      </View>

      {/* 关系动态 */}
      <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
        <View className="flex items-center gap-2 mb-3">
          <View className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
            <Heart size={14} color="#F43F5E" />
          </View>
          <Text className="block text-sm font-semibold text-gray-900">关系动态</Text>
        </View>
        <Text className="block text-sm text-gray-700 leading-relaxed">{insight.relationshipDynamics}</Text>
      </View>

      {/* 情感模式 */}
      <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
        <View className="flex items-center gap-2 mb-3">
          <View className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <MessageSquare size={14} color="#F59E0B" />
          </View>
          <Text className="block text-sm font-semibold text-gray-900">情感模式</Text>
        </View>
        <Text className="block text-sm text-gray-700 leading-relaxed">{insight.emotionalPatterns}</Text>
      </View>

      {/* 沟通风格 */}
      <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
        <View className="flex items-center gap-2 mb-3">
          <View className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
            <MessageSquare size={14} color="#0EA5E9" />
          </View>
          <Text className="block text-sm font-semibold text-gray-900">沟通风格</Text>
        </View>
        <Text className="block text-sm text-gray-700 leading-relaxed">{insight.communicationStyle}</Text>
      </View>

      {/* 关键发现 */}
      {insight.keyFindings.length > 0 && (
        <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
          <View className="flex items-center gap-2 mb-3">
            <View className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Lightbulb size={14} color="#10B981" />
            </View>
            <Text className="block text-sm font-semibold text-gray-900">关键发现</Text>
          </View>
          <View className="space-y-2">
            {insight.keyFindings.map((finding, i) => (
              <View key={i} className="flex items-start gap-2">
                <View className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-1">
                  <Text className="block text-xs text-emerald-600 font-medium">{i + 1}</Text>
                </View>
                <Text className="block text-sm text-gray-700 leading-relaxed">{finding}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 盲点提醒 */}
      {insight.blindSpots.length > 0 && (
        <View className="bg-amber-50 rounded-xl border border-amber-100 p-4 mb-3">
          <View className="flex items-center gap-2 mb-3">
            <View className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <CircleAlert size={14} color="#F59E0B" />
            </View>
            <Text className="block text-sm font-semibold text-amber-800">你可能忽略的盲点</Text>
          </View>
          <View className="space-y-2">
            {insight.blindSpots.map((spot, i) => (
              <View key={i} className="flex items-start gap-2">
                <View className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                <Text className="block text-sm text-amber-900 leading-relaxed">{spot}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 成长建议 */}
      {insight.growthSuggestions.length > 0 && (
        <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
          <View className="flex items-center gap-2 mb-3">
            <View className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <TrendingUp size={14} color="#8B5CF6" />
            </View>
            <Text className="block text-sm font-semibold text-gray-900">成长建议</Text>
          </View>
          <View className="space-y-2">
            {insight.growthSuggestions.map((suggestion, i) => (
              <View key={i} className="flex items-start gap-2">
                <View className="w-5 h-5 rounded-full bg-violet-50 flex items-center justify-center shrink-0 mt-1">
                  <Text className="block text-xs text-violet-600 font-medium">{i + 1}</Text>
                </View>
                <Text className="block text-sm text-gray-700 leading-relaxed">{suggestion}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 行动优先级 */}
      {insight.actionPriority && (
        <View className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 mb-3">
          <View className="flex items-center gap-2 mb-2">
            <Target size={16} color="#fff" />
            <Text className="block text-sm font-semibold text-white">最优先行动</Text>
          </View>
          <Text className="block text-sm text-indigo-50 leading-relaxed">{insight.actionPriority}</Text>
        </View>
      )}

      {/* 重新分析按钮 */}
      <View className="mt-4 mb-8">
        <Button variant="outline" className="w-full" onClick={fetchInsight}>
          <View className="flex items-center justify-center gap-2">
            <Sparkles size={14} color="#6366F1" />
            <Text>重新分析</Text>
          </View>
        </Button>
      </View>
    </View>
  )
}

export default InsightSection
