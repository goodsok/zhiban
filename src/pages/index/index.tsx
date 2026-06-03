import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Plus, ChevronRight, Sparkles, Heart, Sun, Moon, Cloud, MessageCirclePlus } from 'lucide-react-taro'

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
  menstrual: { icon: Moon, color: '#6B7280', bgColor: 'bg-gray-100' },
  follicular: { icon: Sun, color: '#10B981', bgColor: 'bg-emerald-50' },
  ovulation: { icon: Heart, color: '#EC4899', bgColor: 'bg-pink-50' },
  luteal_early: { icon: Sun, color: '#3B82F6', bgColor: 'bg-blue-50' },
  luteal_mid: { icon: Cloud, color: '#F59E0B', bgColor: 'bg-amber-50' },
  luteal_late: { icon: Moon, color: '#EF4444', bgColor: 'bg-red-50' },
}

const Index: FC = () => {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [cycleInfos, setCycleInfos] = useState<Record<number, CycleInfo>>({})

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
      // Network.request 返回 Taro.request 的结果，数据在 res.data 中
      // 后端返回 { code: 200, msg: '...', data: { list: [...] } }
      const responseData = res.data
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
      } else if (retryCount < 2) {
        // 响应数据异常时自动重试（最多2次）
        console.warn('Matches response invalid, retrying...', retryCount + 1)
        await new Promise(r => setTimeout(r, 500))
        return fetchMatches(retryCount + 1)
      } else {
        console.error('Matches response invalid after retries:', JSON.stringify(responseData)?.substring(0, 200))
      }
    } catch (error) {
      if (retryCount < 2) {
        console.warn('Fetch matches error, retrying...', retryCount + 1, error)
        await new Promise(r => setTimeout(r, 500))
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

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部 */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex items-center justify-between">
          <Text className="block text-xl font-bold text-gray-900">对象</Text>
          <View 
            className="flex items-center gap-1 text-gray-500"
            onClick={goToCreate}
          >
            <Plus size={20} color="#6B7280" />
            <Text className="block text-sm">新建</Text>
          </View>
        </View>
      </View>

      {/* 列表 */}
      <View className="p-4">
        {loading ? (
          <View className="text-center py-12">
            <Text className="block text-gray-400">加载中...</Text>
          </View>
        ) : matches.length === 0 ? (
          <View className="text-center py-12">
            <Text className="block text-gray-400 mb-4">还没有记录任何对象</Text>
            <View 
              className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg"
              onClick={goToCreate}
            >
              <Plus size={16} color="#fff" />
              <Text className="block text-sm">添加第一个对象</Text>
            </View>
          </View>
        ) : (
          matches.map((match) => {
            const cycleInfo = cycleInfos[match.id]
            const phaseConf = cycleInfo ? phaseConfig[cycleInfo.phase] : null
            const PhaseIcon = phaseConf?.icon || Heart
            
            return (
              <View
                key={match.id}
                className="bg-white rounded-xl border border-gray-100 p-4 mb-3"
              >
                <View className="flex items-center justify-between" onClick={() => goToDetail(match.id)}>
                  <View className="flex-1 min-w-0">
                    <View className="flex items-center gap-2 mb-1">
                      <Text className="block text-base font-semibold text-gray-900 flex-shrink-0">
                        {match.name}
                      </Text>
                    </View>
                    {/* 推进值显示 */}
                    {match.progressScore !== undefined && (
                      <View className="flex items-center gap-1">
                        <View className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <View 
                            className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full"
                            style={{ width: `${match.progressScore}%` }}
                          />
                        </View>
                        <Text className="block text-xs text-gray-400">{match.progressScore}分</Text>
                      </View>
                    )}
                  </View>
                  <ChevronRight size={20} color="#D1D5DB" />
                </View>
                
                {/* 快捷操作按钮 */}
                <View className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <View 
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-indigo-50 rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigateTo({ url: `/pages/interaction-create/index?matchId=${match.id}` })
                    }}
                  >
                    <MessageCirclePlus size={14} color="#6366F1" />
                    <Text className="block text-xs font-medium text-indigo-600">记录互动</Text>
                  </View>
                  <View 
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-50 rounded-lg"
                    onClick={() => goToDetail(match.id)}
                  >
                    <Sparkles size={14} color="#6B7280" />
                    <Text className="block text-xs font-medium text-gray-600">查看档案</Text>
                  </View>
                </View>
                
                {/* 周期阶段显示 */}
                {cycleInfo && phaseConf && (
                  <View className={`mt-3 pt-3 border-t border-gray-100 ${phaseConf.bgColor} -mx-4 -mb-4 px-4 py-3 rounded-b-xl`}>
                    <View className="flex items-center gap-2 mb-1">
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
