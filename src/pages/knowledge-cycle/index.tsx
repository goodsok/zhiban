import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { ChevronDown, ChevronUp, ChevronRight, Moon, Sun, Heart, Cloud } from 'lucide-react-taro'

// 周期阶段图标和颜色配置
const phaseConfig: Record<string, { icon: typeof Heart; color: string; bgColor: string }> = {
  menstrual: { icon: Moon, color: '#6B7280', bgColor: 'bg-gray-100' },
  follicular: { icon: Sun, color: '#10B981', bgColor: 'bg-green-50' },
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

const KnowledgeCyclePage: FC = () => {
  const [cycleKnowledge, setCycleKnowledge] = useState<HormoneCycleKnowledge[]>([])
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useLoad(() => {
    console.log('Knowledge cycle page loaded.')
  })

  useDidShow(() => {
    fetchCycleKnowledge()
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

  const togglePhase = (phaseKey: string) => {
    setExpandedPhase(prev => prev === phaseKey ? null : phaseKey)
  }

  const goToPhaseDetail = (phaseKey: string) => {
    navigateTo({ url: `/pages/knowledge-detail/index?phaseKey=${phaseKey}` })
  }

  return (
    <View className="min-h-screen pb-6" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="周期科学" />

      {/* 简介 */}
      <View className="px-4 py-4">
        <Text className="block text-sm text-gray-600 leading-relaxed">
          了解女性激素周期规律，帮助你更好地理解她的情绪变化和身体状态，选择最佳时机相处。
        </Text>
      </View>

      {/* 周期阶段列表 */}
      <View className="px-4">
        {loading ? (
          <View className="text-center py-12">
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
                  className="bg-white rounded-xl overflow-hidden"
                >
                  {/* 折叠标题栏 */}
                  <View
                    className="flex items-center justify-between p-4"
                    onClick={() => togglePhase(phase.phase_key)}
                  >
                    <View className="flex items-center gap-4">
                      <View className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                        <PhaseIcon size={16} color={config.color} />
                      </View>
                      <View>
                        <View className="flex items-center gap-3">
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
                    <View className="px-4 pb-4 border-t border-gray-100">
                      {/* 阶段特点 */}
                      <View className="mt-3">
                        <Text className="block text-xs font-medium text-gray-700 mb-2">阶段特点</Text>
                        <View className="space-y-2">
                          {phase.characteristics?.emotion && (
                            <View className="flex items-start gap-3">
                              <Text className="block text-xs text-gray-400 w-12 shrink-0">情绪</Text>
                              <Text className="block text-xs text-gray-600">{phase.characteristics.emotion}</Text>
                            </View>
                          )}
                          {phase.characteristics?.social && (
                            <View className="flex items-start gap-3">
                              <Text className="block text-xs text-gray-400 w-12 shrink-0">社交</Text>
                              <Text className="block text-xs text-gray-600">{phase.characteristics.social}</Text>
                            </View>
                          )}
                          {phase.characteristics?.body && (
                            <View className="flex items-start gap-3">
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
    </View>
  )
}

export default KnowledgeCyclePage
