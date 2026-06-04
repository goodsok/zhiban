import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, showToast, showModal } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { Calendar, Trash2 } from 'lucide-react-taro'

// 类型映射
const TYPE_LABELS: Record<string, string> = {
  daily: '生活日常',
  fitness: '运动健身',
  food: '美食探店',
  travel: '旅行风景',
  work: '工作成就',
  emotion: '情感表达',
  hobby: '兴趣爱好',
}

// 目的映射
const PURPOSE_LABELS: Record<string, string> = {
  attract: '吸引注意',
  show: '展示价值',
  tease: '试探反应',
  topic: '制造话题',
}

interface Post {
  id: number
  match_id: number
  content: string
  post_type: string
  purpose: string
  persona_tags: string[]
  publish_time: string
  status: string
  created_at: string
  matches?: {
    name: string
  }
}

const MomentsHistoryPage: FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useLoad(() => {
    console.log('Moments history page loaded.')
  })

  useDidShow(() => {
    fetchPosts()
  })

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/moments/posts' })
      if (res.data?.code === 200 && res.data?.data?.posts) {
        setPosts(res.data.data.posts)
      }
    } catch (error) {
      console.error('Fetch posts error:', error)
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async (id: number) => {
    try {
      const { confirm } = await showModal({
        title: '确认删除',
        content: '确定要删除这条发布记录吗？',
      })
      if (!confirm) return

      await Network.request({
        url: `/api/moments/post/${id}`,
        method: 'DELETE',
      })
      setPosts(posts.filter(p => p.id !== id))
      showToast({ title: '已删除', icon: 'success' })
    } catch (error) {
      console.error('Delete post error:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const getContentPreview = (content: string) => {
    return content.length > 80 ? content.slice(0, 80) + '...' : content
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      <CustomHeader title="发布记录" />

      {/* 列表 */}
      <View className="p-4">
        {loading ? (
          <View className="text-center py-12">
            <Text className="block text-gray-400">加载中...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View className="text-center py-12">
            <View className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} color="#9CA3AF" />
            </View>
            <Text className="block text-gray-400 mb-2">还没有发布记录</Text>
            <Text className="block text-gray-400 text-sm">使用发圈助手后，记录会显示在这里</Text>
          </View>
        ) : (
          posts.map((post) => (
            <View
              key={post.id}
              className="bg-white rounded-xl border border-gray-100 p-4 mb-3"
            >
              {/* 头部标签 */}
              <View className="flex items-center justify-between mb-3">
                <View className="flex items-center gap-2">
                  <View className="px-2 py-1 bg-indigo-50 rounded">
                    <Text className="block text-xs text-indigo-600">
                      {TYPE_LABELS[post.post_type] || post.post_type}
                    </Text>
                  </View>
                  <View className="px-2 py-1 bg-amber-50 rounded">
                    <Text className="block text-xs text-amber-600">
                      {PURPOSE_LABELS[post.purpose] || post.purpose}
                    </Text>
                  </View>
                </View>
                <View
                  className="p-2"
                  onClick={() => deletePost(post.id)}
                >
                  <Trash2 size={16} color="#EF4444" />
                </View>
              </View>

              {/* 内容预览 */}
              <Text className="block text-sm text-gray-700 mb-3 leading-relaxed">
                {getContentPreview(post.content)}
              </Text>

              {/* 人设标签 */}
              {post.persona_tags && post.persona_tags.length > 0 && (
                <View className="flex flex-wrap gap-1 mb-3">
                  {post.persona_tags.map((tag) => (
                    <View key={tag} className="px-2 py-1 bg-gray-100 rounded">
                      <Text className="block text-xs text-gray-500">{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 底部 */}
              <View className="flex items-center justify-between pt-2 border-t border-gray-100">
                {post.matches?.name && (
                  <Text className="block text-xs text-gray-400">
                    对象：{post.matches.name}
                  </Text>
                )}
                <Text className="block text-xs text-gray-400">
                  {formatDate(post.publish_time)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  )
}

export default MomentsHistoryPage
