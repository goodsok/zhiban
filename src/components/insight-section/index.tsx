import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Brain, Sparkles, Eye, Lightbulb, CircleAlert, TrendingUp, MessageSquare, Heart, Target, Shield, Search, Zap } from 'lucide-react-taro'

// 隐蔽信号
interface HiddenSignal {
  type: 'contradiction' | 'pattern' | 'risk' | 'opportunity'
  title: string
  description: string
  evidence: string
}

// AI洞察结果接口
interface InsightData {
  personalitySummary: string
  relationshipDynamics: string
  emotionalPatterns: string
  communicationStyle: string
  keyFindings: string[]
  blindSpots: string[]
  hiddenSignals: HiddenSignal[]
  growthSuggestions: string[]
  actionPriority: string
}

interface InsightSectionProps {
  matchId: string
  matchName: string
}

// 隐蔽信号图标和配色
const SIGNAL_STYLES: Record<string, { icon: typeof Eye; color: string; bg: string; border: string; label: string }> = {
  contradiction: { icon: Zap, color: '#EF4444', bg: 'bg-red-50', border: 'border-red-100', label: '矛盾信号' },
  pattern: { icon: Search, color: '#8B5CF6', bg: 'bg-violet-50', border: 'border-violet-100', label: '隐蔽模式' },
  risk: { icon: Shield, color: '#F59E0B', bg: 'bg-amber-50', border: 'border-amber-100', label: '潜在风险' },
  opportunity: { icon: Sparkles, color: '#10B981', bg: 'bg-green-50', border: 'border-emerald-100', label: '隐藏机会' },
}

const InsightSection: FC<InsightSectionProps> = ({ matchId, matchName }) => {
  const [insight, setInsight] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 页面加载时自动获取已保存的洞察
  useEffect(() => {
    if (!matchId) return
    fetchInsight(false)
  }, [matchId])

  const fetchInsight = async (forceRefresh = false) => {
    if (!matchId) return

    try {
      setLoading(true)
      setError('')
      const url = forceRefresh
        ? `/api/portrait/${matchId}/insight?forceRefresh=true`
        : `/api/portrait/${matchId}/insight`
      console.log('[Insight] Fetching AI insight for match:', matchId, 'forceRefresh:', forceRefresh)
      const res = await Network.request({
        url,
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
  if (loading && !insight) {
    return (
      <View className="p-4">
        <View className="bg-white rounded-2xl shadow-soft p-6">
          <View className="flex items-center justify-center gap-3 mb-4">
            <Brain size={20} color="#4ECB71" className="animate-pulse" />
            <Text className="block text-base font-semibold text-gray-900">AI正在深度分析</Text>
          </View>
          <View className="space-y-3">
            <View className="flex items-center gap-3">
              <View className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <Text className="block text-sm text-gray-500">扫描{matchName}的所有维度数据...</Text>
            </View>
            <View className="flex items-center gap-3">
              <View className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
              <Text className="block text-sm text-gray-500">交叉分析寻找隐蔽模式...</Text>
            </View>
            <View className="flex items-center gap-3">
              <View className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '0.6s' }} />
              <Text className="block text-sm text-gray-500">揭示你可能忽略的深层信号...</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  // 错误态
  if (error && !insight) {
    return (
      <View className="p-4">
        <View className="bg-white rounded-2xl shadow-soft p-6">
          <View className="flex items-center justify-center mb-4">
            <CircleAlert size={20} color="#EF4444" />
          </View>
          <Text className="block text-sm text-gray-500 text-center mb-4">{error}</Text>
          <View className="flex justify-center">
            <Button size="sm" onClick={() => fetchInsight(false)}>重试</Button>
          </View>
        </View>
      </View>
    )
  }

  // 未请求态 - 展示引导
  if (!insight) {
    return (
      <View className="p-4">
        <View className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-6">
          <View className="flex items-center gap-4 mb-4">
            <View className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Sparkles size={24} color="#4ECB71" />
            </View>
            <View className="flex-1">
              <Text className="block text-base font-semibold text-gray-900">AI深度洞察</Text>
              <Text className="block text-xs text-gray-500 mt-1">
                发现你看不见的隐蔽模式与深层信号
              </Text>
            </View>
          </View>

          <View className="space-y-2 mb-5">
            <View className="flex items-start gap-3">
              <Search size={14} color="#4ECB71" className="mt-1 shrink-0" />
              <Text className="block text-xs text-gray-600">交叉分析多个维度的数据，发现矛盾与张力</Text>
            </View>
            <View className="flex items-start gap-3">
              <Eye size={14} color="#4ECB71" className="mt-1 shrink-0" />
              <Text className="block text-xs text-gray-600">揭示{matchName}言行不一的隐蔽信号</Text>
            </View>
            <View className="flex items-start gap-3">
              <Lightbulb size={14} color="#4ECB71" className="mt-1 shrink-0" />
              <Text className="block text-xs text-gray-600">发现你可能忽略的盲点和被掩盖的机会</Text>
            </View>
          </View>

          <Button className="w-full bg-green-500 text-white" onClick={() => fetchInsight(true)}>
            <View className="flex items-center justify-center gap-3">
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
      {/* 隐蔽信号 — 最有价值，放在最前面 */}
      {insight.hiddenSignals && insight.hiddenSignals.length > 0 && (
        <View className="mb-4">
          <View className="flex items-center gap-3 mb-4">
            <View className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
              <Eye size={14} color="#4ECB71" />
            </View>
            <Text className="block text-sm font-semibold text-gray-900">隐蔽信号</Text>
            <Text className="block text-xs text-gray-400 ml-1">AI独有发现</Text>
          </View>
          <View className="space-y-2">
            {insight.hiddenSignals.map((signal, i) => {
              const style = SIGNAL_STYLES[signal.type] || SIGNAL_STYLES.pattern
              const Icon = style.icon
              return (
                <View key={i} className={`bg-white rounded-xl border ${style.border} p-4`}>
                  <View className="flex items-center gap-3 mb-2">
                    <View className={`w-6 h-6 rounded-md ${style.bg} flex items-center justify-center`}>
                      <Icon size={12} color={style.color} />
                    </View>
                    <Text className="block text-xs font-medium" style={{ color: style.color }}>{style.label}</Text>
                    <Text className="block text-sm font-semibold text-gray-900">{signal.title}</Text>
                  </View>
                  <Text className="block text-sm text-gray-700 leading-relaxed mb-2">{signal.description}</Text>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Text className="block text-xs text-gray-400 mb-1">判断依据</Text>
                    <Text className="block text-xs text-gray-500">{signal.evidence}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      )}

      {/* 盲点提醒 — 第二重要 */}
      {insight.blindSpots && insight.blindSpots.length > 0 && (
        <View className="bg-amber-50 rounded-xl border border-amber-100 p-4 mb-4">
          <View className="flex items-center gap-3 mb-4">
            <View className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <CircleAlert size={14} color="#F59E0B" />
            </View>
            <Text className="block text-sm font-semibold text-amber-800">你可能忽略的盲点</Text>
          </View>
          <View className="space-y-2">
            {insight.blindSpots.map((spot, i) => (
              <View key={i} className="flex items-start gap-3">
                <View className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                <Text className="block text-sm text-amber-900 leading-relaxed">{spot}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 关键发现 */}
      {insight.keyFindings && insight.keyFindings.length > 0 && (
        <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
          <View className="flex items-center gap-3 mb-4">
            <View className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
              <Lightbulb size={14} color="#4ECB71" />
            </View>
            <Text className="block text-sm font-semibold text-gray-900">关键发现</Text>
          </View>
          <View className="space-y-2">
            {insight.keyFindings.map((finding, i) => (
              <View key={i} className="flex items-start gap-3">
                <View className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-1">
                  <Text className="block text-xs text-green-600 font-medium">{i + 1}</Text>
                </View>
                <Text className="block text-sm text-gray-700 leading-relaxed">{finding}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 性格洞察 */}
      <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
        <View className="flex items-center gap-3 mb-4">
          <View className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
            <Eye size={14} color="#4ECB71" />
          </View>
          <Text className="block text-sm font-semibold text-gray-900">性格深层洞察</Text>
        </View>
        <Text className="block text-sm text-gray-700 leading-relaxed">{insight.personalitySummary}</Text>
      </View>

      {/* 关系动态 */}
      <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
        <View className="flex items-center gap-3 mb-4">
          <View className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
            <Heart size={14} color="#F43F5E" />
          </View>
          <Text className="block text-sm font-semibold text-gray-900">关系动态</Text>
        </View>
        <Text className="block text-sm text-gray-700 leading-relaxed">{insight.relationshipDynamics}</Text>
      </View>

      {/* 情感模式 */}
      <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
        <View className="flex items-center gap-3 mb-4">
          <View className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <MessageSquare size={14} color="#F59E0B" />
          </View>
          <Text className="block text-sm font-semibold text-gray-900">情感模式</Text>
        </View>
        <Text className="block text-sm text-gray-700 leading-relaxed">{insight.emotionalPatterns}</Text>
      </View>

      {/* 沟通风格 */}
      <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
        <View className="flex items-center gap-3 mb-4">
          <View className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
            <MessageSquare size={14} color="#0EA5E9" />
          </View>
          <Text className="block text-sm font-semibold text-gray-900">沟通风格</Text>
        </View>
        <Text className="block text-sm text-gray-700 leading-relaxed">{insight.communicationStyle}</Text>
      </View>

      {/* 成长建议 */}
      {insight.growthSuggestions && insight.growthSuggestions.length > 0 && (
        <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
          <View className="flex items-center gap-3 mb-4">
            <View className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <TrendingUp size={14} color="#8B5CF6" />
            </View>
            <Text className="block text-sm font-semibold text-gray-900">成长建议</Text>
          </View>
          <View className="space-y-2">
            {insight.growthSuggestions.map((suggestion, i) => (
              <View key={i} className="flex items-start gap-3">
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
        <View className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-4 mb-4">
          <View className="flex items-center gap-3 mb-2">
            <Target size={16} color="#fff" />
            <Text className="block text-sm font-semibold text-white">最优先行动</Text>
          </View>
          <Text className="block text-sm text-green-50 leading-relaxed">{insight.actionPriority}</Text>
        </View>
      )}

      {/* 重新分析按钮 */}
      <View className="mt-4 mb-8">
        <Button variant="outline" className="w-full" onClick={() => fetchInsight(true)}>
          <View className="flex items-center justify-center gap-3">
            <Sparkles size={14} color="#4ECB71" />
            <Text>重新分析</Text>
          </View>
        </Button>
      </View>
    </View>
  )
}

export default InsightSection
