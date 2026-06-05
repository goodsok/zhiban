import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { RefreshCw, MessageCircle } from 'lucide-react-taro'

interface IcebreakerTopic {
  id: number
  topic: string
  category: string
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
  const [topics, setTopics] = useState<IcebreakerTopic[]>([])
  const [loading, setLoading] = useState(true)

  useLoad(() => {
    console.log('Knowledge icebreaker page loaded.')
  })

  useDidShow(() => {
    fetchTopics()
  })

  const fetchTopics = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/topic/icebreaker' })
      console.log('Icebreaker topics response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        // 获取更多话题（请求多次）
        const allTopics = [...res.data.data]
        // 可以多次请求获取更多话题，这里暂时只请求一次
        setTopics(allTopics)
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
      const res = await Network.request({ url: '/api/topic/icebreaker' })
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

      {/* 简介 */}
      <View className="px-4 py-4">
        <Text className="block text-sm text-gray-600 leading-relaxed">
          不知道聊什么？这里有一些话题建议，帮助你轻松开启对话，了解彼此。
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
            <Text className="block text-gray-400">加载中...</Text>
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
            这些话题适合在约会、聊天时使用。选择一个轻松的话题开始，根据对方的反应自然延续对话。记住，真诚比技巧更重要。
          </Text>
        </View>
      </View>
    </View>
  )
}

export default KnowledgeIcebreakerPage
