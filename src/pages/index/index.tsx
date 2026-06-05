import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Plus, ChevronRight, Sparkles, Heart, Sun, Moon, Cloud, MessageCirclePlus, EyeOff, Eye } from 'lucide-react-taro'
import { Switch } from '@/components/ui/switch'
import EmptyState from '@/components/empty-state'


interface Match {
  id: number
  name: string
  gender?: string
  meetingScene?: string
  meetingDate?: string
  impression: number
  status: string
  nextAction: string
  lastContact: string
  progressScore?: number
  // 周期信息
  cycleStartDate?: string
  cycleLength?: number
}

interface CycleInfo {
  day: number
  phase: string
  phaseName: string
  description: string
  recommendations: string[]
}

// 周期阶段图标和颜色
const phaseConfig: Record<string, { icon: typeof Heart; color: string; bgColor: string }> = {
  menstrual: { icon: Moon, color: '#78716C', bgColor: 'bg-gray-100' },
  follicular: { icon: Sun, color: '#4ECB71', bgColor: 'bg-green-50' },
  ovulation: { icon: Heart, color: '#EC4899', bgColor: 'bg-pink-50' },
  luteal_early: { icon: Sun, color: '#60A5FA', bgColor: 'bg-blue-50' },
  luteal_mid: { icon: Cloud, color: '#F0C75E', bgColor: 'bg-amber-50' },
  luteal_late: { icon: Moon, color: '#E87461', bgColor: 'bg-white' },
}

const Index: FC = () => {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [cycleInfos, setCycleInfos] = useState<Record<number, CycleInfo>>({})
  const [showHidden, setShowHidden] = useState(false)

  useLoad(() => {
    console.log('Index page loaded.')
  })

  useDidShow(() => {
    fetchMatches()
  })

  const fetchMatches = async (retryCount = 0) => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/match/list' })
      console.log('Match list response:', JSON.stringify(res?.data)?.substring(0, 200))
      const responseData = res?.data
      if (responseData?.code === 200 && responseData?.data?.list) {
        setMatches(responseData.data.list)
        // 获取每个对象的周期信息
        responseData.data.list.forEach(async (match: Match) => {
          if (match.cycleStartDate) {
            try {
              const cycleRes = await Network.request({ url: `/api/match/${match.id}/cycle` })
              if (cycleRes.data?.code === 200 && cycleRes.data?.data) {
                setCycleInfos(prev => ({ ...prev, [match.id]: cycleRes.data.data }))
              }
            } catch (e) {
              console.error('Fetch cycle info error:', e)
            }
          }
        })
      } else if (retryCount < 3) {
        const delay = (retryCount + 1) * 1000
        console.warn('Matches response invalid, retrying in', delay, 'ms...', retryCount + 1)
        await new Promise(r => setTimeout(r, delay))
        return fetchMatches(retryCount + 1)
      } else {
        console.error('Matches response invalid after retries:', JSON.stringify(responseData)?.substring(0, 200))
      }
    } catch (error) {
      if (retryCount < 3) {
        const delay = (retryCount + 1) * 1000
        console.warn('Fetch matches error, retrying in', delay, 'ms...', retryCount + 1, error)
        await new Promise(r => setTimeout(r, delay))
        return fetchMatches(retryCount + 1)
      }
      console.error('Fetch matches error after retries:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToCreate = () => {
    navigateTo({ url: '/pages/create/index' })
  }

  const goToDetail = (id: number) => {
    navigateTo({ url: `/pages/detail/index?id=${id}` })
  }

  const toggleHide = async (match: Match) => {
    const newStatus = match.status === 'hidden' ? 'new' : 'hidden'
    try {
      const res = await Network.request({
        url: `/api/match/${match.id}`,
        method: 'PUT',
        data: { status: newStatus },
      })
      console.log('Toggle hide response:', res?.data)
      const responseData = res?.data
      if (responseData?.code === 200) {
        fetchMatches()
      }
    } catch (error) {
      console.error('Toggle hide error:', error)
    }
  }

  // 根据开关过滤列表
  const visibleMatches = showHidden
    ? matches
    : matches.filter(m => m.status !== 'hidden')

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部 */}
      <View className="bg-white px-4 py-4 border-b">
        <View className="flex items-center justify-between">
          <View className="flex items-center gap-3">
            <Text className="block text-xl font-bold text-gray-900">对象</Text>
            <Switch
              checked={showHidden}
              onCheckedChange={setShowHidden}
            />
          </View>
          <View
            className="flex items-center gap-1 text-gray-500"
            onClick={goToCreate}
          >
            <Plus size={20} color="#4ECB71" />
            <Text className="block text-sm text-green-600">新建</Text>
          </View>
        </View>
      </View>

      {/* 列表 */}
      <View className="p-4">
        {loading ? (
          <View className="flex items-center justify-center py-12">
            <Text className="block text-gray-400">加载中...</Text>
          </View>
        ) : visibleMatches.length === 0 ? (
          <EmptyState
            message={showHidden ? '还没有记录任何对象' : '没有可见的对象'}
            description={!showHidden && matches.length > 0 ? '打开开关查看已隐藏的对象' : undefined}
            actionLabel={(!showHidden && matches.length === 0) ? '添加第一个对象' : undefined}
            onAction={(!showHidden && matches.length === 0) ? goToCreate : undefined}
          />
        ) : (
          visibleMatches.map((match) => {
            const cycleInfo = cycleInfos[match.id]
            const phaseConf = cycleInfo ? phaseConfig[cycleInfo.phase] : null
            const PhaseIcon = phaseConf?.icon || Heart
            const isHidden = match.status === 'hidden'

            return (
              <View
                key={match.id}
                className={`bg-white rounded-2xl p-4 mb-4 ${isHidden ? 'opacity-60' : ''}`}
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              >
                <View className="flex items-center justify-between" onClick={() => goToDetail(match.id)}>
                  <View className="flex-1 min-w-0">
                    <View className="flex items-center gap-3 mb-1">
                      <Text className="block text-base font-semibold text-gray-900 flex-shrink-0">
                        {match.name}
                      </Text>
                      {isHidden && (
                        <View className="px-2 py-0 bg-gray-100 rounded-md">
                          <Text className="block text-xs text-gray-400">已隐藏</Text>
                        </View>
                      )}
                    </View>
                    {/* 推进值显示 */}
                    {match.progressScore !== undefined && (
                      <View className="flex items-center gap-1">
                        <View className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <View
                            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                            style={{ width: `${match.progressScore}%` }}
                          />
                        </View>
                        <Text className="block text-xs text-gray-400">{match.progressScore}分</Text>
                      </View>
                    )}
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </View>

                {/* 快捷操作按钮 */}
                <View className="flex items-center gap-3 mt-3 pt-3 border-t">
                  <View
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-50 rounded-xl"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigateTo({ url: `/pages/interaction-create/index?matchId=${match.id}` })
                    }}
                  >
                    <MessageCirclePlus size={14} color="#4ECB71" />
                    <Text className="block text-xs font-medium text-green-600">记录互动</Text>
                  </View>
                  <View
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-50 rounded-xl"
                    onClick={() => goToDetail(match.id)}
                  >
                    <Sparkles size={14} color="#6B7280" />
                    <Text className="block text-xs font-medium text-gray-600">查看档案</Text>
                  </View>
                  <View
                    className="flex items-center justify-center py-2 px-3 bg-gray-50 rounded-xl"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleHide(match)
                    }}
                  >
                    {isHidden ? (
                      <Eye size={14} color="#6B7280" />
                    ) : (
                      <EyeOff size={14} color="#9CA3AF" />
                    )}
                  </View>
                </View>

                {/* 周期阶段显示 */}
                {cycleInfo && phaseConf && (
                  <View className={`mt-3 pt-3 border-t ${phaseConf.bgColor} -mx-4 -mb-4 px-4 py-3 rounded-b-2xl`}>
                    <View className="flex items-center gap-3 mb-1">
                      <PhaseIcon size={14} color={phaseConf.color} />
                      <Text className="block text-xs font-medium" style={{ color: phaseConf.color }}>
                        {cycleInfo.phaseName} · Day {cycleInfo.day}
                      </Text>
                    </View>
                    <Text className="block text-xs text-gray-500">
                      {cycleInfo.recommendations[0] || '保持关注'}
                    </Text>
                  </View>
                )}
              </View>
            )
          })
        )}
      </View>
    </View>
  )
}

export default Index
