import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Plus, ChevronRight, Sparkles } from 'lucide-react-taro'

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

const Index: FC = () => {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

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
          matches.map((match) => (
            <View
              key={match.id}
              className="bg-white rounded-xl border border-gray-100 p-4 mb-3"
              onClick={() => goToDetail(match.id)}
            >
              <View className="flex items-center justify-between">
                <View className="flex-1">
                  <View className="flex items-center gap-2 mb-1">
                    <Text className="block text-base font-semibold text-gray-900">
                      {match.name}
                    </Text>
                    <Text className="block text-sm text-gray-500">{match.age}岁</Text>
                    <Text className="block text-xs text-gray-400">·</Text>
                    <Text className="block text-sm text-gray-500">{match.occupation}</Text>
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
              
              {/* 下一步行动提示 */}
              {match.nextAction && (
                <View className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <Sparkles size={14} color="#6366F1" />
                  <Text className="block text-xs text-gray-500">{match.nextAction}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </View>
  )
}

export default Index
