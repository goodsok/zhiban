import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Plus, ChevronRight, Sparkles, Heart, Sun, Moon, Cloud } from 'lucide-react-taro'

interface Match {
  id: number
  name: string
  age: number
  occupation: string
  relationshipStage: string
  interactionStatus: string
  impression: number
  status: string
  nextAction: string
  lastContact: string
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

const stageLabels: Record<string, string> = {
  new: '刚认识',
  contacting: '接触中',
  dating: '约会中',
  progressing: '发展中',
}

const statusLabels: Record<string, string> = {
  just_met: '一面之缘',
  got_contact: '有联系方式',
  chatted: '聊过天',
  good_vibe: '聊得不错',
  met_up: '见过面',
  dating_regularly: '稳定约会',
  ambiguous: '暧昧期',
  confirming: '准备确认',
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

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/match/list' })
      console.log('Matches response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setMatches(res.data.data)
        // 获取每个对象的周期信息
        res.data.data.forEach(async (match: Match) => {
          if (match.cycleStartDate) {
            const cycleRes = await Network.request({ url: `/api/match/${match.id}/cycle` })
            if (cycleRes.data?.code === 200 && cycleRes.data?.data) {
              setCycleInfos(prev => ({ ...prev, [match.id]: cycleRes.data.data }))
            }
          }
        })
      }
    } catch (error) {
      console.error('Fetch matches error:', error)
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
                onClick={() => goToDetail(match.id)}
              >
                <View className="flex items-center justify-between">
                  <View className="flex-1 min-w-0">
                    <View className="flex items-center gap-2 mb-1">
                      <Text className="block text-base font-semibold text-gray-900 flex-shrink-0">
                        {match.name}
                      </Text>
                      <Text className="block text-sm text-gray-500 flex-shrink-0">{match.age}岁</Text>
                      {match.occupation && (
                        <>
                          <Text className="block text-xs text-gray-300 flex-shrink-0">·</Text>
                          <Text className="block text-sm text-gray-500 truncate">{match.occupation}</Text>
                        </>
                      )}
                    </View>
                    <View className="flex items-center gap-2">
                      <Text className="block text-xs text-gray-400">
                        {stageLabels[match.relationshipStage] || match.relationshipStage}
                      </Text>
                      <Text className="block text-xs text-gray-300">|</Text>
                      <Text className="block text-xs text-gray-400">
                        {statusLabels[match.interactionStatus] || match.interactionStatus}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#D1D5DB" />
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
                
                {/* 下一步行动提示（无周期时显示） */}
                {!cycleInfo && match.nextAction && (
                  <View className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <Sparkles size={14} color="#6366F1" />
                    <Text className="block text-xs text-gray-500">{match.nextAction}</Text>
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
