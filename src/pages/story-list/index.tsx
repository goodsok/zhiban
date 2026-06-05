import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { BookOpen, Plus, Trash2 } from 'lucide-react-taro'

// 故事类型映射
const STORY_TYPE_LABELS: Record<string, string> = {
  travel: '旅行故事',
  growth: '成长经历',
  emotion: '情感故事',
  work: '工作故事',
  childhood: '童年回忆',
  hobby: '兴趣爱好',
  other: '其他故事',
}

// 推进阶段映射
const STAGE_LABELS: Record<string, string> = {
  stranger: '陌生人',
  acquaintance: '初识',
  friend: '朋友',
  暧昧: '暧昧',
  dating: '约会',
  relationship: '恋爱',
}

interface Story {
  id: number
  match_id: number
  story_type: string
  relationship_stage: string
  generated_story: string
  techniques_used: string[]
  status: string
  created_at: string
  matches?: {
    name: string
  }
}

const StoryListPage: FC = () => {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useLoad(() => {
    console.log('Story list page loaded.')
  })

  useDidShow(() => {
    fetchStories()
  })

  const fetchStories = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/story/list' })
      console.log('Stories response:', res.data)
      if (res.data?.code === 200 && res.data?.data?.stories) {
        setStories(res.data.data.stories)
      }
    } catch (error) {
      console.error('Fetch stories error:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToCreate = () => {
    navigateTo({ url: '/pages/story/index' })
  }

  const goToDetail = (id: number) => {
    navigateTo({ url: `/pages/story/index?id=${id}` })
  }

  const deleteStory = async (id: number, e: any) => {
    e.stopPropagation()
    
    try {
      const res = await Network.request({
        url: `/api/story/${id}`,
        method: 'DELETE',
      })
      if (res.data?.code === 200) {
        setStories(stories.filter(s => s.id !== id))
      }
    } catch (error) {
      console.error('Delete story error:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const getStoryPreview = (story: string) => {
    // 移除技巧标注
    const cleanStory = story.replace(/【.+?】/g, '')
    return cleanStory.length > 60 ? cleanStory.slice(0, 60) + '...' : cleanStory
  }

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="故事生成器" />

      {/* 列表 */}
      <View className="p-4">
        {loading ? (
          <View className="text-center py-12">
            <Text className="block text-gray-400">加载中...</Text>
          </View>
        ) : stories.length === 0 ? (
          <View className="text-center py-12">
            <View className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen size={32} color="#9CA3AF" />
            </View>
            <Text className="block text-gray-400 mb-2">还没有故事</Text>
            <Text className="block text-gray-400 text-sm mb-4">把你的故事变成高能量内容</Text>
            <View
              className="inline-flex items-center gap-3 bg-green-500 text-white px-4 py-2 rounded-lg"
              onClick={goToCreate}
            >
              <Plus size={16} color="#fff" />
              <Text className="block text-sm">创建第一个故事</Text>
            </View>
          </View>
        ) : (
          <>
            {/* 新建按钮 */}
            <View
              className="bg-green-500 rounded-xl py-3 flex items-center justify-center gap-3 mb-4"
              onClick={goToCreate}
            >
              <Plus size={18} color="#fff" />
              <Text className="block text-white font-medium">创建新故事</Text>
            </View>
            
            {stories.map((story) => (
            <View
              key={story.id}
              className="bg-white rounded-2xl shadow-soft p-4 mb-4"
              onClick={() => goToDetail(story.id)}
            >
              {/* 头部 */}
              <View className="flex items-center justify-between mb-2">
                <View className="flex items-center gap-3">
                  <View className="px-2 py-1 bg-gray-100 rounded">
                    <Text className="block text-xs text-gray-600">
                      {STORY_TYPE_LABELS[story.story_type] || story.story_type}
                    </Text>
                  </View>
                  {story.relationship_stage && (
                    <View className="px-2 py-1 bg-green-50 rounded">
                      <Text className="block text-xs text-green-600">
                        {STAGE_LABELS[story.relationship_stage] || story.relationship_stage}
                      </Text>
                    </View>
                  )}
                </View>
                <View
                  className="p-2"
                  onClick={(e) => deleteStory(story.id, e)}
                >
                  <Trash2 size={16} color="#EF4444" />
                </View>
              </View>

              {/* 预览 */}
              <Text className="block text-sm text-gray-700 mb-2">
                {getStoryPreview(story.generated_story)}
              </Text>

              {/* 技巧标签 */}
              {story.techniques_used && story.techniques_used.length > 0 && (
                <View className="flex flex-wrap gap-1 mb-2">
                  {story.techniques_used.slice(0, 4).map((tech) => (
                    <View key={tech} className="px-2 py-1 bg-amber-50 rounded">
                      <Text className="block text-xs text-amber-600">{tech}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 底部 */}
              <View className="flex items-center justify-between pt-2 border-t">
                {story.matches?.name && (
                  <Text className="block text-xs text-gray-400">
                    对象：{story.matches.name}
                  </Text>
                )}
                <Text className="block text-xs text-gray-400">
                  {formatDate(story.created_at)}
                </Text>
              </View>
            </View>
          ))
          }
          </>
        )}
      </View>
    </View>
  )
}

export default StoryListPage
