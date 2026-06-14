import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, useRouter } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { RefreshCw, MessageCircle, User } from 'lucide-react-taro'

interface IcebreakerTopic {
  id: number
  topic: string
  category: string
}

interface MatchInfo {
  id: number
  name: string
  avatar_url?: string
}

// 分类配置
const categoryConfig: Record<string, { icon: typeof MessageCircle; color: string; bgColor: string }> = {
  '童年回忆': { icon: MessageCircle, color: '#EC4899', bgColor: 'bg-pink-50' },
  '成长话题': { icon: MessageCircle, color: '#10B981', bgColor: 'bg-green-50' },
  '价值观': { icon: MessageCircle, color: '#3B82F6', bgColor: 'bg-blue-50' },
  '浪漫话题': { icon: MessageCircle, color: '#F59E0B', bgColor: 'bg-amber-50' },
  '旅行梦想': { icon: MessageCircle, color: '#8B5CF6', bgColor: 'bg-purple-50' },
  '兴趣爱好': { icon: MessageCircle, color: '#06B6D4', bgColor: 'bg-cyan-50' },
  '生活方式': { icon: MessageCircle, color: '#84CC16', bgColor: 'bg-lime-50' },
  '美食话题': { icon: MessageCircle, color: '#F97316', bgColor: 'bg-white' },
  'AI生成': { icon: MessageCircle, color: '#6366F1', bgColor: 'bg-green-50' },
}

const KnowledgeIcebreakerPage: FC = () => {
  const router = useRouter()
  const matchId = router.params.matchId
  const [topics, setTopics] = useState<IcebreakerTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null)

  useLoad(() => {
    console.log('Knowledge icebreaker page loaded, matchId:', matchId)
    // 如果有 matchId，获取对象基础信息用于展示
    if (matchId) {
      fetchMatchInfo(Number(matchId))
    }
  })

  useDidShow(() => {
    fetchTopics()
  })

  const fetchMatchInfo = async (id: number) => {
    try {
      const res = await Network.request({ url: `/api/match/${id}` })
      if (res.data?.code === 200 && res.data?.data) {
        setMatchInfo({
          id: res.data.data.id,
          name: res.data.data.name,
          avatar_url: res.data.data.avatar_url,
        })
      }
    } catch (error) {
      console.error('Fetch match info error:', error)
    }
  }

  const fetchTopics = async () => {
    try {
      setLoading(true)
      // 如果有 matchId，带上 matchId 参数请求个性化话题
      const url = matchId ? `/api/topic/icebreaker?matchId=${matchId}` : '/api/topic/icebreaker'
      const res = await Network.request({ url })
      console.log('Icebreaker topics response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setTopics(res.data.data)
      }
    } catch (error) {
      console.error('Fetch icebreaker topics error:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshTopics = async () => {
    try {
      setLoading(true)
      const url = matchId ? `/api/topic/icebreaker?matchId=${matchId}` : '/api/topic/icebreaker'
      const res = await Network.request({ url })
      if (res.data?.code === 200 && res.data?.data) {
        setTopics(res.data.data)
      }
    } catch (error) {
      console.error('Refresh topics error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen pb-6" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="破冰话题" />

      {/* 对象信息卡片 - 仅从档案页进入时显示 */}
      {matchInfo && (
        <View className="px-4 pt-2 pb-2">
          <View className="bg-white rounded-2xl shadow-soft p-3 flex items-center gap-3">
            <User size={18} color="#374151" />
            <Text className="block text-sm text-gray-600">
              为 <Text className="font-medium text-gray-900">{matchInfo.name}</Text> 推荐的个性化话题
            </Text>
          </View>
        </View>
      )}

      {/* 简介 */}
      <View className="px-4 py-4">
        <Text className="block text-sm text-gray-600 leading-relaxed">
          {matchId
            ? '根据对象的已知信息，AI 为你推荐最合适的破冰话题，让聊天更自然。'
            : '不知道聊什么？这里有一些话题建议，帮助你轻松开启对话，了解彼此。'
          }
        </Text>
      </View>

      {/* 刷新按钮 */}
      <View className="px-4 mb-4">
        <View
          className="flex items-center justify-center gap-3 py-3 bg-white rounded-xl"
          onClick={refreshTopics}
        >
          <RefreshCw size={16} color="#6B7280" className={loading ? 'animate-spin' : ''} />
          <Text className="block text-sm text-gray-600">换一批话题</Text>
        </View>
      </View>

      {/* 话题列表 */}
      <View className="px-4">
        {loading && topics.length === 0 ? (
          <View className="text-center py-12">
            <Text className="block text-gray-400">{matchId ? 'AI 生成中...' : '加载中...'}</Text>
          </View>
        ) : topics.length === 0 ? (
          <View className="text-center py-12">
            <Text className="block text-gray-400">暂无话题</Text>
          </View>
        ) : (
          <View className="space-y-2">
            {/* 直接展示话题卡片 */}
            {topics.map((topic, index) => {
              const config = categoryConfig[topic.category] || categoryConfig['兴趣爱好']
              return (
                <View
                  key={topic.id || index}
                  className="bg-white rounded-2xl shadow-soft p-4"
                >
                  <View className="flex items-start gap-4">
                    <View className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center shrink-0`}>
                      <Text className="block text-sm font-semibold text-gray-900">{index + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="block text-sm font-medium text-gray-900 mb-1">{topic.topic}</Text>
                      <Text className="block text-xs text-gray-400">{topic.category}</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </View>

      {/* 使用提示 */}
      <View className="px-4 mt-6">
        <View className="bg-gray-100 rounded-xl p-4">
          <Text className="block text-xs font-medium text-gray-700 mb-2">使用提示</Text>
          <Text className="block text-xs text-gray-500 leading-relaxed">
            {matchId
              ? '这些话题基于对象的已知信息生成，更容易引起共鸣。选择一个轻松的话题开始，根据对方的反应自然延续对话。'
              : '这些话题适合在约会、聊天时使用。选择一个轻松的话题开始，根据对方的反应自然延续对话。记住，真诚比技巧更重要。'
            }
          </Text>
        </View>
      </View>
    </View>
  )
}

export default KnowledgeIcebreakerPage
