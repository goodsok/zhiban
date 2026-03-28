import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Plus, Heart, MessageCircle } from 'lucide-react-taro'
import { useState } from 'react'
import { Network } from '@/network'

// 见面场景
const meetingScenes = [
  { id: 'blind_date', label: '相亲', icon: '💑', desc: '介绍人安排' },
  { id: 'pickup', label: '搭讪', icon: '👋', desc: '偶遇心动' },
  { id: 'app_meetup', label: 'App线下见面', icon: '📱', desc: '交友软件' },
  { id: 'party', label: '聚会社交', icon: '🎉', desc: '朋友聚会' },
  { id: 'workplace', label: '职场', icon: '💼', desc: '工作认识' },
  { id: 'school', label: '学校', icon: '📚', desc: '同学校友' },
  { id: 'activity', label: '兴趣活动', icon: '🎯', desc: '运动爱好' },
  { id: 'other', label: '其他', icon: '✨', desc: '其他场景' },
]

// 关系状态
const statusConfig = {
  new: { label: '新认识', color: 'text-blue-500 bg-blue-50' },
  contacting: { label: '接触中', color: 'text-purple-500 bg-purple-50' },
  dating: { label: '约会中', color: 'text-pink-500 bg-pink-50' },
  progressing: { label: '发展中', color: 'text-emerald-500 bg-emerald-50' },
  paused: { label: '暂停', color: 'text-gray-500 bg-gray-50' },
}

interface MatchItem {
  id: number
  name: string
  age: number
  occupation: string
  mbti: string
  zodiac: string
  meetingScene: string
  impression: number
  status: string
  interests: string[]
  lastContact: string
  nextAction: string
}

const IndexPage: FC = () => {
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/match',
        method: 'GET'
      })
      console.log('Fetch matches response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setMatches(res.data.data)
      }
    } catch (error) {
      console.error('Fetch matches error:', error)
    } finally {
      setLoading(false)
    }
  }

  useLoad(() => {
    console.log('Index page loaded.')
    fetchMatches()
  })

  // 每次显示页面时刷新数据
  useDidShow(() => {
    console.log('Index page showed, refreshing data...')
    fetchMatches()
  })

  const goToCreate = () => {
    navigateTo({ url: '/pages/create/index' })
  }

  const goToDetail = (id: number) => {
    navigateTo({ url: `/pages/detail/index?id=${id}` })
  }

  const getSceneLabel = (sceneId: string) => {
    return meetingScenes.find(s => s.id === sceneId)?.label || '其他'
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <View className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 rounded-b-3xl">
        <View className="flex items-center justify-between mb-4">
          <View>
            <Text className="block text-white text-2xl font-bold">心动助手</Text>
            <Text className="block text-white text-opacity-80 text-sm mt-1">管理你的心动对象</Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
            <Users size={24} color="#fff" />
          </View>
        </View>

        {/* 统计 */}
        <View className="flex gap-4">
          <View className="flex-1 bg-white bg-opacity-20 rounded-xl p-3 text-center">
            <Text className="block text-white text-2xl font-bold">{matches.length}</Text>
            <Text className="block text-white text-opacity-80 text-xs">正在接触</Text>
          </View>
          <View className="flex-1 bg-white bg-opacity-20 rounded-xl p-3 text-center">
            <Text className="block text-white text-2xl font-bold">{matches.filter(m => m.status === 'dating').length}</Text>
            <Text className="block text-white text-opacity-80 text-xs">约会中</Text>
          </View>
          <View className="flex-1 bg-white bg-opacity-20 rounded-xl p-3 text-center">
            <Text className="block text-white text-2xl font-bold">{matches.filter(m => m.impression >= 4).length}</Text>
            <Text className="block text-white text-opacity-80 text-xs">高意向</Text>
          </View>
        </View>
      </View>

      {/* 对象列表 */}
      <View className="p-4">
        <View className="flex items-center justify-between mb-3">
          <Text className="block text-lg font-semibold text-gray-800">我的对象</Text>
          <Button size="sm" className="bg-indigo-500" onClick={goToCreate}>
            <Plus size={16} color="#fff" />
            <Text className="ml-1 text-white">添加</Text>
          </Button>
        </View>

        {loading ? (
          <View className="text-center py-12">
            <Text className="block text-gray-400">加载中...</Text>
          </View>
        ) : (
          matches.map((match) => (
            <Card 
              key={match.id} 
              className="mb-3 shadow-sm border-0"
              onClick={() => goToDetail(match.id)}
            >
              <CardContent className="p-4">
                <View className="flex items-start gap-3">
                  {/* 头像 */}
                  <View className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Text className="block text-indigo-600 text-lg font-semibold">
                      {match.name.charAt(0)}
                    </Text>
                  </View>

                  {/* 信息 */}
                  <View className="flex-1">
                    <View className="flex items-center gap-2 mb-1">
                      <Text className="block font-semibold text-gray-800">{match.name}</Text>
                      <Text className="block text-sm text-gray-500">{match.age}岁</Text>
                      <Badge className={statusConfig[match.status as keyof typeof statusConfig]?.color || 'text-gray-500 bg-gray-50'}>
                        {statusConfig[match.status as keyof typeof statusConfig]?.label || '未知'}
                      </Badge>
                    </View>
                    <Text className="block text-sm text-gray-500 mb-2">
                      {match.occupation} · {getSceneLabel(match.meetingScene)}
                    </Text>
                    <View className="flex flex-wrap gap-1">
                      {match.interests?.slice(0, 3).map((interest, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </View>
                  </View>

                  {/* 心动度 */}
                  <View className="text-right">
                    <View className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Heart 
                          key={i} 
                          size={12} 
                          color={i < match.impression ? '#EC4899' : '#E5E7EB'}
                        />
                      ))}
                    </View>
                    <Text className="block text-xs text-gray-400">{match.lastContact}</Text>
                  </View>
                </View>

                {/* 下一步行动 */}
                <View className="mt-3 pt-3 border-t border-gray-100">
                  <View className="flex items-center gap-2">
                    <MessageCircle size={14} color="#6366F1" />
                    <Text className="block text-sm text-indigo-600">下一步：{match.nextAction}</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))
        )}

        {/* 空状态 */}
        {!loading && matches.length === 0 && (
          <View className="text-center py-12">
            <Users size={48} color="#D1D5DB" />
            <Text className="block text-gray-400 mt-4 mb-4">还没有添加心动对象</Text>
            <Button className="bg-indigo-500" onClick={goToCreate}>
              <Plus size={16} color="#fff" />
              <Text className="ml-1 text-white">添加第一个对象</Text>
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}

export default IndexPage
