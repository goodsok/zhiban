import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, switchTab } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Heart, MessageCircle, Gamepad2, Camera, Sparkles, RefreshCw } from 'lucide-react-taro'
import './index.css'

interface CoupleInfo {
  myName: string
  partnerName: string
  days: number
  nextDate: string
}

interface Topic {
  id: number
  topic: string
  category: string
}

const quickEntries = [
  { icon: MessageCircle, title: '开始互动', desc: '破冰话题推荐', page: 'tasks' },
  { icon: Gamepad2, title: '默契测试', desc: '了解彼此', page: 'quiz' },
  { icon: Sparkles, title: '打卡任务', desc: '增进感情', page: 'tasks' },
  { icon: Camera, title: '美好时刻', desc: '记录回忆', page: 'progress' },
]

const IndexPage: FC = () => {
  const [coupleInfo, setCoupleInfo] = useState<CoupleInfo>({
    myName: '小明',
    partnerName: '小红',
    days: 15,
    nextDate: '明天下午3点',
  })
  const [topics, setTopics] = useState<Topic[]>([])
  const [taskProgress, setTaskProgress] = useState({ completed: 0, total: 0 })

  useLoad(() => {
    console.log('Index page loaded.')
  })

  useDidShow(() => {
    fetchCoupleInfo()
    fetchTopics()
    fetchTaskProgress()
  })

  const fetchCoupleInfo = async () => {
    try {
      const res = await Network.request({ url: '/api/couple/info' })
      console.log('Couple info response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setCoupleInfo(res.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch couple info:', error)
    }
  }

  const fetchTopics = async () => {
    try {
      const res = await Network.request({ url: '/api/topic/icebreaker' })
      console.log('Topics response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setTopics(res.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error)
    }
  }

  const fetchTaskProgress = async () => {
    try {
      const res = await Network.request({ url: '/api/task/progress' })
      console.log('Task progress response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setTaskProgress(res.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch task progress:', error)
    }
  }

  const refreshTopic = async () => {
    try {
      const res = await Network.request({ 
        url: '/api/topic/generate',
        method: 'POST'
      })
      console.log('Generate topic response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setTopics([res.data.data, ...topics.slice(0, 2)])
      }
    } catch (error) {
      console.error('Failed to generate topic:', error)
    }
  }

  const handleNavigate = (page: string) => {
    switchTab({ url: `/pages/${page}/index` })
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 头部情侣信息区 */}
      <View className="bg-gradient-to-r from-pink-500 to-orange-400 p-6 rounded-b-3xl">
        <View className="flex items-center justify-between mb-4">
          <View className="flex items-center gap-3">
            <View className="w-14 h-14 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
              <Heart size={24} color="#fff" />
            </View>
            <View>
              <Text className="block text-white text-lg font-semibold">{coupleInfo.myName}</Text>
              <Text className="block text-white text-opacity-80 text-sm">和</Text>
            </View>
          </View>
          <View className="flex items-center gap-3">
            <View>
              <Text className="block text-white text-opacity-80 text-sm text-right">的</Text>
              <Text className="block text-white text-lg font-semibold">{coupleInfo.partnerName}</Text>
            </View>
            <View className="w-14 h-14 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
              <Heart size={24} color="#fff" />
            </View>
          </View>
        </View>
        
        {/* 相识天数 */}
        <View className="bg-white bg-opacity-20 rounded-2xl p-4 text-center">
          <Text className="block text-white text-opacity-80 text-sm mb-1">已相识</Text>
          <View className="flex items-baseline justify-center gap-1">
            <Text className="block text-white text-5xl font-bold">{coupleInfo.days}</Text>
            <Text className="block text-white text-lg">天</Text>
          </View>
        </View>

        {/* 下次约会提醒 */}
        <View className="mt-4 bg-white bg-opacity-10 rounded-xl p-3">
          <Text className="block text-white text-sm">
            下次约会：{coupleInfo.nextDate} ☕
          </Text>
        </View>
      </View>

      {/* 快捷入口 */}
      <View className="p-4">
        <Text className="block text-lg font-semibold text-gray-800 mb-3">快捷入口</Text>
        <View className="grid grid-cols-4 gap-3">
          {quickEntries.map((entry, index) => (
            <View 
              key={index}
              className="flex flex-col items-center"
              onClick={() => handleNavigate(entry.page)}
            >
              <View className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center mb-2">
                <entry.icon size={24} color="#FF6B9D" />
              </View>
              <Text className="block text-sm font-medium text-gray-700">{entry.title}</Text>
              <Text className="block text-xs text-gray-400">{entry.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* AI破冰话题 */}
      <View className="p-4">
        <View className="flex items-center justify-between mb-3">
          <Text className="block text-lg font-semibold text-gray-800">今日破冰话题</Text>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-pink-500"
            onClick={refreshTopic}
          >
            <RefreshCw size={16} color="#FF6B9D" />
            <Text className="ml-1">换一个</Text>
          </Button>
        </View>

        {topics.map((item) => (
          <Card key={item.id} className="mb-3 shadow-sm border-0">
            <CardContent className="p-4">
              <View className="flex items-start justify-between">
                <View className="flex-1">
                  <Badge variant="secondary" className="mb-2 bg-pink-50 text-pink-500">
                    {item.category}
                  </Badge>
                  <Text className="block text-gray-700 text-base">{item.topic}</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        ))}
      </View>

      {/* 任务进度 */}
      <View className="p-4">
        <Card className="shadow-sm border-0 bg-gradient-to-r from-pink-50 to-orange-50">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <Text className="block font-semibold text-gray-800">本周任务进度</Text>
              <Text className="block text-sm text-pink-500">{taskProgress.completed}/{taskProgress.total} 已完成</Text>
            </View>
            <Progress value={taskProgress.total > 0 ? (taskProgress.completed / taskProgress.total) * 100 : 0} className="h-2" />
            <Text className="block text-sm text-gray-500 mt-2">再完成{taskProgress.total - taskProgress.completed}个任务，解锁默契达人成就 🎉</Text>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

export default IndexPage
