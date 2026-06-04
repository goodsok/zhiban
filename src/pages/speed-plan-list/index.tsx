import { View, Text } from '@tarojs/components'
import { useDidShow, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { Plus, Clock, ChevronRight, Sparkles } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

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

const BEHAVIOR_MAP: Record<string, string> = {
  'first_meet': '约出来见面',
  'hold_hands': '牵手',
  'kiss': '接吻',
  'sex': '发生关系',
  'relationship': '确认恋爱',
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  'draft': { label: '草稿', variant: 'outline' },
  'in_progress': { label: '进行中', variant: 'default' },
  'completed': { label: '已完成', variant: 'secondary' },
}

const getBehaviorName = (code: string) => BEHAVIOR_MAP[code] || code

const formatDuration = (hours: number) => {
  if (hours >= 24) {
    const days = hours / 24
    return Number.isInteger(days) ? `${days}天` : `${days.toFixed(1)}天`
  }
  return `${hours}小时`
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const getStatusConfig = (status: string) =>
  STATUS_MAP[status] || { label: status, variant: 'outline' as const }

const SpeedPlanListPage: FC = () => {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useDidShow(() => {
    fetchPlans()
  })

  const fetchPlans = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await Network.request({ url: '/api/speed-plan/list' })
      console.log('Fetch plans response:', res.data)
      if (res.data?.code === 200 && res.data?.data?.plans) {
        setPlans(res.data.data.plans)
      }
    } catch (err) {
      console.error('Fetch plans error:', err)
      setError('加载失败，请下拉重试')
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

  // 加载骨架屏
  const renderSkeleton = () => (
    <View className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-xl border border-gray-100">
          <CardContent className="p-4">
            <View className="flex items-center gap-3 mb-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <View className="flex-1">
                <Skeleton className="h-4 w-20 mb-2 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </View>
            </View>
            <Skeleton className="h-3 w-full mb-2 rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </CardContent>
        </Card>
      ))}
    </View>
  )

  // 空状态
  const renderEmpty = () => (
    <View className="flex flex-col items-center justify-center py-20">
      <View className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Sparkles size={28} color="#9CA3AF" />
      </View>
      <Text className="block text-gray-500 mb-1">还没有创建任何方案</Text>
      <Text className="block text-xs text-gray-400 mb-6">点击上方按钮创建第一个速推方案</Text>
      <Button size="sm" onClick={goToCreate}>
        <Plus size={16} color="#fff" />
        <Text className="text-white">新建方案</Text>
      </Button>
    </View>
  )

  // 错误状态
  const renderError = () => (
    <View className="flex flex-col items-center justify-center py-20">
      <Text className="block text-gray-400 mb-4">{error}</Text>
      <Button size="sm" variant="outline" onClick={fetchPlans}>
        <Text>重新加载</Text>
      </Button>
    </View>
  )

  // 方案卡片
  const renderPlanCard = (plan: Plan) => {
    const statusConfig = getStatusConfig(plan.status)

    return (
      <Card
        key={plan.id}
        className="rounded-xl border border-gray-100"
        onClick={() => goToDetail(plan.id)}
      >
        <CardContent className="p-4">
          {/* 头部：头像 + 名称 + 状态 + 箭头 */}
          <View className="flex items-center justify-between mb-3">
            <View className="flex items-center gap-3">
              <Avatar className="w-10 h-10 bg-gray-100">
                <AvatarFallback className="text-sm font-medium text-gray-600">
                  {plan.matches?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <View>
                <View className="flex items-center gap-2">
                  <Text className="block font-medium text-gray-900">
                    {plan.matches?.name || '未知对象'}
                  </Text>
                  <Badge variant={statusConfig.variant} className="text-xs px-2 py-1">
                    <Text className="text-xs">{statusConfig.label}</Text>
                  </Badge>
                </View>
                <Text className="block text-xs text-gray-400">
                  {formatDate(plan.created_at)} 创建
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </View>

          {/* 信息区 */}
          <View className="flex items-center gap-4 pt-3 border-t border-gray-50">
            <View className="flex items-center gap-1">
              <Sparkles size={14} color="#F59E0B" />
              <Text className="block text-sm text-gray-600">
                目标：{getBehaviorName(plan.target_behavior)}
              </Text>
            </View>
            <View className="flex items-center gap-1">
              <Clock size={14} color="#6B7280" />
              <Text className="block text-sm text-gray-600">
                {formatDuration(plan.target_hours)}
              </Text>
            </View>
          </View>

          {/* 难度 */}
          <View className="flex items-center justify-between mt-2">
            <View className="flex items-center gap-2">
              <Text className="block text-sm text-gray-500">
                难度：{plan.difficulty_level}
              </Text>
              <Badge variant="outline" className="text-xs px-1 py-1">
                <Text className="text-xs text-gray-500">{plan.difficulty_score}/10</Text>
              </Badge>
            </View>
          </View>
        </CardContent>
      </Card>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <CustomHeader title="速推方案" />

      {/* 新建按钮 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <Button className="w-full rounded-xl" onClick={goToCreate}>
          <Plus size={18} color="#fff" />
          <Text className="text-white font-medium">新建方案</Text>
        </Button>
      </View>

      {/* 内容区 */}
      <View className="p-4">
        {loading ? renderSkeleton() : error ? renderError() : plans.length === 0 ? renderEmpty() : (
          <View className="flex flex-col gap-3">
            {plans.map(renderPlanCard)}
          </View>
        )}
      </View>
    </View>
  )
}

export default SpeedPlanListPage
