import { View, Text } from '@tarojs/components'
import { useLoad, useRouter } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Badge } from '@/components/ui/badge'
import CustomHeader from '@/components/custom-header'
import { Moon, Sun, Heart, Cloud, Check, X, Lightbulb, Users } from 'lucide-react-taro'

// 周期阶段图标和颜色配置
const phaseConfig: Record<string, { icon: typeof Heart; color: string; bgColor: string; textColor: string }> = {
  menstrual: { icon: Moon, color: '#6B7280', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
  follicular: { icon: Sun, color: '#10B981', bgColor: 'bg-green-50', textColor: 'text-green-600' },
  ovulation: { icon: Heart, color: '#EC4899', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
  luteal_early: { icon: Sun, color: '#3B82F6', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  luteal_mid: { icon: Cloud, color: '#F59E0B', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  luteal_late: { icon: Moon, color: '#EF4444', bgColor: 'bg-red-50', textColor: 'text-red-600' },
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

// 激素中文名映射
const hormoneNames: Record<string, string> = {
  estrogen: '雌激素',
  progesterone: '孕激素',
  fsh: '促卵泡激素',
  lh: '促黄体激素',
  testosterone: '睾酮',
}

const KnowledgeDetailPage: FC = () => {
  const router = useRouter()
  const phaseKey = router.params.phaseKey || ''
  
  const [loading, setLoading] = useState(true)
  const [knowledge, setKnowledge] = useState<HormoneCycleKnowledge | null>(null)

  useLoad(() => {
    if (phaseKey) {
      fetchKnowledge()
    }
  })

  const fetchKnowledge = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: `/api/knowledge/hormone-cycle/${phaseKey}` })
      console.log('Knowledge detail response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setKnowledge(res.data.data)
      }
    } catch (error) {
      console.error('Fetch knowledge detail error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F8FA' }}>
        <Text className="text-gray-400">加载中...</Text>
      </View>
    )
  }

  if (!knowledge) {
    return (
      <View className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F8FA' }}>
        <Text className="text-gray-400">未找到相关知识</Text>
      </View>
    )
  }

  const config = phaseConfig[knowledge.phase_key] || phaseConfig.menstrual
  const PhaseIcon = config.icon

  return (
    <View className="min-h-screen pb-6" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title={knowledge.phase_name} />

      {/* 顶部概览卡片 */}
      <View className={`${config.bgColor} mx-4 mt-4 rounded-xl p-4`}>
        <View className="flex items-center gap-4 mb-4">
          <View className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <PhaseIcon size={20} color={config.color} />
          </View>
          <View>
            <Text className="block text-lg font-semibold text-gray-900">{knowledge.phase_name}</Text>
            <Text className="block text-xs text-gray-500">周期 Day {knowledge.day_range}</Text>
          </View>
        </View>
        {knowledge.description && (
          <Text className="block text-sm text-gray-700">{knowledge.description}</Text>
        )}
      </View>

      {/* 激素状态 */}
      <View className="mx-4 mt-4">
        <Text className="block text-sm font-semibold text-gray-900 mb-2">激素状态</Text>
        <View className="bg-white rounded-xl p-4">
          <View className="flex flex-wrap gap-3">
            {Object.entries(knowledge.hormone_status || {}).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-xs">
                {hormoneNames[key] || key}: {value}
              </Badge>
            ))}
          </View>
        </View>
      </View>

      {/* 阶段特点 */}
      <View className="mx-4 mt-4">
        <Text className="block text-sm font-semibold text-gray-900 mb-2">阶段特点</Text>
        <View className="bg-white rounded-xl p-4 space-y-3">
          {knowledge.characteristics?.emotion && (
            <View className="flex items-start gap-4">
              <View className="w-6 h-6 rounded-full bg-pink-50 flex items-center justify-center shrink-0 mt-1">
                <Heart size={12} color="#EC4899" />
              </View>
              <View>
                <Text className="block text-xs font-medium text-gray-700 mb-1">情绪状态</Text>
                <Text className="block text-sm text-gray-600">{knowledge.characteristics.emotion}</Text>
              </View>
            </View>
          )}
          {knowledge.characteristics?.thinking && (
            <View className="flex items-start gap-4">
              <View className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-1">
                <Lightbulb size={12} color="#3B82F6" />
              </View>
              <View>
                <Text className="block text-xs font-medium text-gray-700 mb-1">思维特点</Text>
                <Text className="block text-sm text-gray-600">{knowledge.characteristics.thinking}</Text>
              </View>
            </View>
          )}
          {knowledge.characteristics?.social && (
            <View className="flex items-start gap-4">
              <View className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-1">
                <Users size={12} color="#4ECB71" />
              </View>
              <View>
                <Text className="block text-xs font-medium text-gray-700 mb-1">社交状态</Text>
                <Text className="block text-sm text-gray-600">{knowledge.characteristics.social}</Text>
              </View>
            </View>
          )}
          {knowledge.characteristics?.body && (
            <View className="flex items-start gap-4">
              <View className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-1">
                <Sun size={12} color="#F59E0B" />
              </View>
              <View>
                <Text className="block text-xs font-medium text-gray-700 mb-1">身体状况</Text>
                <Text className="block text-sm text-gray-600">{knowledge.characteristics.body}</Text>
              </View>
            </View>
          )}
          {knowledge.characteristics?.libido && (
            <View className="flex items-start gap-4">
              <View className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mt-1">
                <Heart size={12} color="#8B5CF6" />
              </View>
              <View>
                <Text className="block text-xs font-medium text-gray-700 mb-1">亲密需求</Text>
                <Text className="block text-sm text-gray-600">{knowledge.characteristics.libido}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 建议行动 */}
      {knowledge.recommendations && (
        <View className="mx-4 mt-4">
          <Text className="block text-sm font-semibold text-gray-900 mb-2">建议行动</Text>
          
          {/* 推荐做的事 */}
          {knowledge.recommendations.best_actions && knowledge.recommendations.best_actions.length > 0 && (
            <View className="bg-white rounded-xl p-4 mb-2">
              <View className="flex items-center gap-3 mb-2">
                <Check size={14} color="#4ECB71" />
                <Text className="block text-xs font-medium text-gray-700">推荐做的事</Text>
              </View>
              <View className="space-y-2">
                {knowledge.recommendations.best_actions.map((action, index) => (
                  <View key={index} className="flex items-start gap-3">
                    <View className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
                    <Text className="block text-sm text-gray-600">{action}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 避免做的事 */}
          {knowledge.recommendations.avoid_actions && knowledge.recommendations.avoid_actions.length > 0 && (
            <View className="bg-white rounded-xl p-4 mb-2">
              <View className="flex items-center gap-3 mb-2">
                <X size={14} color="#EF4444" />
                <Text className="block text-xs font-medium text-gray-700">避免做的事</Text>
              </View>
              <View className="space-y-2">
                {knowledge.recommendations.avoid_actions.map((action, index) => (
                  <View key={index} className="flex items-start gap-3">
                    <View className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                    <Text className="block text-sm text-gray-600">{action}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 自我照顾 */}
          {knowledge.recommendations.self_care && knowledge.recommendations.self_care.length > 0 && (
            <View className="bg-white rounded-xl p-4">
              <View className="flex items-center gap-3 mb-2">
                <Heart size={14} color="#EC4899" />
                <Text className="block text-xs font-medium text-gray-700">自我照顾</Text>
              </View>
              <View className="space-y-2">
                {knowledge.recommendations.self_care.map((action, index) => (
                  <View key={index} className="flex items-start gap-3">
                    <View className="w-2 h-2 rounded-full bg-pink-500 mt-2 shrink-0" />
                    <Text className="block text-sm text-gray-600">{action}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* 给伴侣的建议 */}
      {knowledge.partner_tips && (
        <View className="mx-4 mt-4">
          <Text className="block text-sm font-semibold text-gray-900 mb-2">给TA的建议</Text>
          <View className="bg-green-500 rounded-xl p-4">
            <Text className="block text-sm text-white leading-relaxed">{knowledge.partner_tips}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default KnowledgeDetailPage
