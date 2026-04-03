import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { Plus, Clock, ChevronRight, Sparkles } from 'lucide-react-taro'

interface Plan {
  id: number
  match_id: number
  background: string
  target_hours: number
  target_behavior: string
  difficulty_score: number
  difficulty_level: string
  status: string
  created_at: string
  matches?: {
    name: string
  }
}

const SpeedPlanListPage: FC = () => {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)

  useLoad(() => {
    console.log('Speed plan list page loaded.')
  })

  useDidShow(() => {
    fetchPlans()
  })

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/speed-plan/list' })
      if (res.data?.code === 200 && res.data?.data?.plans) {
        setPlans(res.data.data.plans)
      }
    } catch (error) {
      console.error('Fetch plans error:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToCreate = () => {
    navigateTo({ url: '/pages/speed-plan/index' })
  }

  const goToDetail = (planId: number) => {
    navigateTo({ url: `/pages/speed-plan/index?id=${planId}` })
  }

  const getBehaviorName = (code: string) => {
    const behaviors: Record<string, string> = {
      'first_meet': '约出来见面',
      'hold_hands': '牵手',
      'kiss': '接吻',
      'sex': '发生关系',
      'relationship': '确认恋爱',
    }
    return behaviors[code] || code
  }

  const getDifficultyStars = (score: number) => {
    if (score <= 2) return '⭐'
    if (score <= 4) return '⭐⭐'
    if (score <= 6) return '⭐⭐⭐'
    if (score <= 8) return '⭐⭐⭐⭐'
    return '⭐⭐⭐⭐⭐'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <CustomHeader title="速推方案" />

      {/* 新建按钮 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View
          className="flex items-center justify-center gap-2 bg-black rounded-xl py-3"
          onClick={goToCreate}
        >
          <Plus size={18} color="#fff" />
          <Text className="block text-white font-medium">新建方案</Text>
        </View>
      </View>

      {/* 方案列表 */}
      <View className="p-4">
        {loading ? (
          <View className="text-center py-12">
            <Text className="block text-gray-400">加载中...</Text>
          </View>
        ) : plans.length === 0 ? (
          <View className="text-center py-12">
            <Text className="block text-gray-400 mb-4">还没有创建任何方案</Text>
            <Text className="block text-sm text-gray-300">点击上方按钮创建第一个方案</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {plans.map((plan) => (
              <View
                key={plan.id}
                className="bg-white rounded-2xl p-4 border border-gray-100"
                onClick={() => goToDetail(plan.id)}
              >
                <View className="flex items-center justify-between mb-2">
                  <View className="flex items-center gap-2">
                    <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Text className="block text-sm font-medium text-gray-600">
                        {plan.matches?.name?.charAt(0) || '?'}
                      </Text>
                    </View>
                    <View>
                      <Text className="block font-medium text-gray-900">
                        {plan.matches?.name || '未知对象'}
                      </Text>
                      <Text className="block text-xs text-gray-400">
                        {formatDate(plan.created_at)} 创建
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color="#9CA3AF" />
                </View>

                <View className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                  <View className="flex items-center gap-1">
                    <Sparkles size={14} color="#F59E0B" />
                    <Text className="block text-sm text-gray-600">
                      目标：{getBehaviorName(plan.target_behavior)}
                    </Text>
                  </View>
                  <View className="flex items-center gap-1">
                    <Clock size={14} color="#6B7280" />
                    <Text className="block text-sm text-gray-600">
                      {plan.target_hours >= 24 ? `${plan.target_hours / 24}天` : `${plan.target_hours}小时`}
                    </Text>
                  </View>
                </View>

                <View className="flex items-center justify-between mt-2">
                  <Text className="block text-sm text-gray-500">
                    难度：{getDifficultyStars(plan.difficulty_score)} {plan.difficulty_level}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

export default SpeedPlanListPage
