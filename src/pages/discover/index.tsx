import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { ChevronDown, ChevronUp, ChevronRight, Moon, Sun, Heart, Cloud, Sparkles, RefreshCw, BookOpen } from 'lucide-react-taro'

// 周期阶段图标和颜色配置
const phaseConfig: Record<string, { icon: typeof Heart; color: string; bgColor: string }> = {
  menstrual: { icon: Moon, color: '#6B7280', bgColor: 'bg-gray-100' },
  follicular: { icon: Sun, color: '#10B981', bgColor: 'bg-emerald-50' },
  ovulation: { icon: Heart, color: '#EC4899', bgColor: 'bg-pink-50' },
  luteal_early: { icon: Sun, color: '#3B82F6', bgColor: 'bg-blue-50' },
  luteal_mid: { icon: Cloud, color: '#F59E0B', bgColor: 'bg-amber-50' },
  luteal_late: { icon: Moon, color: '#EF4444', bgColor: 'bg-red-50' },
}

interface HormoneCycleKnowledge {
  id: number
  phase_key: string
  phase_name: string
  day_range: string
  description: string | null
  hormone_status: Record<string, string>
  characteristics: {
    emotion?: string
    thinking?: string
    social?: string
    body?: string
    libido?: string
    appearance?: string
  }
  recommendations: {
    best_actions?: string[]
    avoid_actions?: string[]
    self_care?: string[]
  } | null
  partner_tips: string | null
  sort_order: number
}

interface IcebreakerTopic {
  id: number
  topic: string
  category: string
}

const DiscoverPage: FC = () => {
  const [cycleKnowledge, setCycleKnowledge] = useState<HormoneCycleKnowledge[]>([])
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)
  const [icebreakerTopics, setIcebreakerTopics] = useState<IcebreakerTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [topicsLoading, setTopicsLoading] = useState(false)

  useLoad(() => {
    console.log('Discover page loaded.')
  })

  useDidShow(() => {
    fetchCycleKnowledge()
    fetchIcebreakerTopics()
  })

  const fetchCycleKnowledge = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/knowledge/hormone-cycle' })
      console.log('Cycle knowledge response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setCycleKnowledge(res.data.data)
      }
    } catch (error) {
      console.error('Fetch cycle knowledge error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchIcebreakerTopics = async () => {
    try {
      setTopicsLoading(true)
      const res = await Network.request({ url: '/api/topic/icebreaker' })
      console.log('Icebreaker topics response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setIcebreakerTopics(res.data.data)
      }
    } catch (error) {
      console.error('Fetch icebreaker topics error:', error)
    } finally {
      setTopicsLoading(false)
    }
  }

  const togglePhase = (phaseKey: string) => {
    setExpandedPhase(prev => prev === phaseKey ? null : phaseKey)
  }

  const goToPhaseDetail = (phaseKey: string) => {
    navigateTo({ url: `/pages/knowledge-detail/index?phaseKey=${phaseKey}` })
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部 - 与首页风格一致 */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="block text-xl font-bold text-gray-900">发现</Text>
      </View>

      {/* 周期知识区域 */}
      <View className="p-4">
        <View className="flex items-center gap-2 mb-3">
          <BookOpen size={16} color="#111827" />
          <Text className="block text-sm font-semibold text-gray-900">周期科学</Text>
        </View>

        {loading ? (
          <View className="text-center py-8">
            <Text className="block text-gray-400">加载中...</Text>
          </View>
        ) : (
          <View className="space-y-2">
            {cycleKnowledge.map((phase) => {
              const config = phaseConfig[phase.phase_key] || phaseConfig.menstrual
              const PhaseIcon = config.icon
              const isExpanded = expandedPhase === phase.phase_key

              return (
                <View
                  key={phase.phase_key}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                >
                  {/* 折叠标题栏 */}
                  <View
                    className="flex items-center justify-between p-4"
                    onClick={() => togglePhase(phase.phase_key)}
                  >
                    <View className="flex items-center gap-3">
                      <View className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                        <PhaseIcon size={16} color={config.color} />
                      </View>
                      <View>
                        <View className="flex items-center gap-2">
                          <Text className="block text-sm font-semibold text-gray-900">{phase.phase_name}</Text>
                          <Text className="block text-xs text-gray-400">Day {phase.day_range}</Text>
                        </View>
                        <Text className="block text-xs text-gray-500 mt-1 line-clamp-1">
                          {phase.description || ''}
                        </Text>
                      </View>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color="#9CA3AF" />
                    ) : (
                      <ChevronDown size={20} color="#9CA3AF" />
                    )}
                  </View>

                  {/* 展开内容 */}
                  {isExpanded && (
                    <View className="px-4 pb-4 border-t border-gray-50">
                      {/* 阶段特点 */}
                      <View className="mt-3">
                        <Text className="block text-xs font-medium text-gray-700 mb-2">阶段特点</Text>
                        <View className="space-y-2">
                          {phase.characteristics?.emotion && (
                            <View className="flex items-start gap-2">
                              <Text className="block text-xs text-gray-400 w-12 shrink-0">情绪</Text>
                              <Text className="block text-xs text-gray-600">{phase.characteristics.emotion}</Text>
                            </View>
                          )}
                          {phase.characteristics?.social && (
                            <View className="flex items-start gap-2">
                              <Text className="block text-xs text-gray-400 w-12 shrink-0">社交</Text>
                              <Text className="block text-xs text-gray-600">{phase.characteristics.social}</Text>
                            </View>
                          )}
                          {phase.characteristics?.body && (
                            <View className="flex items-start gap-2">
                              <Text className="block text-xs text-gray-400 w-12 shrink-0">身体</Text>
                              <Text className="block text-xs text-gray-600">{phase.characteristics.body}</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* 伴侣建议 */}
                      {phase.partner_tips && (
                        <View className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <Text className="block text-xs font-medium text-gray-700 mb-1">给TA的建议</Text>
                          <Text className="block text-xs text-gray-600">{phase.partner_tips}</Text>
                        </View>
                      )}

                      {/* 查看详情 */}
                      <View
                        className="mt-3 flex items-center justify-end gap-1"
                        onClick={() => goToPhaseDetail(phase.phase_key)}
                      >
                        <Text className="block text-xs text-gray-500">查看完整知识</Text>
                        <ChevronRight size={14} color="#9CA3AF" />
                      </View>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}
      </View>

      {/* 破冰话题区域 */}
      <View className="p-4 pt-0">
        <View className="flex items-center justify-between mb-3">
          <View className="flex items-center gap-2">
            <Sparkles size={16} color="#111827" />
            <Text className="block text-sm font-semibold text-gray-900">破冰话题</Text>
          </View>
          <View
            className="flex items-center gap-1 text-gray-500"
            onClick={fetchIcebreakerTopics}
          >
            <RefreshCw size={14} color="#9CA3AF" className={topicsLoading ? 'animate-spin' : ''} />
            <Text className="block text-xs">换一批</Text>
          </View>
        </View>

        {topicsLoading && icebreakerTopics.length === 0 ? (
          <View className="text-center py-8">
            <Text className="block text-gray-400">加载中...</Text>
          </View>
        ) : icebreakerTopics.length > 0 ? (
          <View className="space-y-2">
            {icebreakerTopics.map((topic, index) => (
              <View
                key={topic.id || index}
                className="bg-white rounded-xl border border-gray-100 p-4"
              >
                <View className="flex items-start gap-3">
                  <View className="w-6 h-6 rounded-full bg-black flex items-center justify-center shrink-0">
                    <Text className="block text-xs text-white font-medium">{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="block text-sm font-medium text-gray-900 mb-1">{topic.topic}</Text>
                    <Text className="block text-xs text-gray-500">{topic.category}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <Text className="block text-gray-400">暂无话题推荐</Text>
            <Text className="block text-xs text-gray-300 mt-1">点击上方「换一批」重试</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default DiscoverPage
