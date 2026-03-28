import { View, Text } from '@tarojs/components'
import { useLoad, useRouter, navigateBack, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Heart, 
  Calendar, 
  MessageCircle, 
  Gamepad2,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Pencil
} from 'lucide-react-taro'

// 模拟数据
const mockDetail = {
  id: 1,
  name: '小红',
  age: 25,
  gender: 'female',
  occupation: '产品经理',
  meetingScene: 'blind_date',
  meetingDate: '2024-03-20',
  impression: 4,
  impressionTags: ['nice', 'pretty'],
  interests: ['旅行', '摄影', '美食'],
  status: 'contacting',
  notes: '相亲认识，印象不错，喜欢户外活动',
  lastContact: '今天',
  nextAction: '约她周末去拍照',
  progress: 35,
  stats: {
    tasks: 5,
    completedTasks: 2,
    quizScore: 80,
    dates: 2,
  },
  history: [
    { type: 'date', content: '第一次约会：咖啡厅', date: '2024-03-22' },
    { type: 'task', content: '完成：分享童年趣事', date: '2024-03-21' },
    { type: 'quiz', content: '默契测试：80分', date: '2024-03-21' },
    { type: 'date', content: '第二次约会：看电影', date: '2024-03-25' },
  ],
}

const meetingSceneLabels: Record<string, string> = {
  blind_date: '相亲',
  pickup: '搭讪',
  app_meetup: 'App线下见面',
  party: '聚会社交',
  workplace: '职场',
  school: '学校',
  activity: '兴趣活动',
  other: '其他',
}

const statusConfig = {
  new: { label: '新认识', color: 'text-blue-500 bg-blue-50' },
  contacting: { label: '接触中', color: 'text-purple-500 bg-purple-50' },
  dating: { label: '约会中', color: 'text-pink-500 bg-pink-50' },
  progressing: { label: '发展中', color: 'text-emerald-500 bg-emerald-50' },
  paused: { label: '暂停', color: 'text-gray-500 bg-gray-50' },
}

const DetailPage: FC = () => {
  const router = useRouter()
  const [detail] = useState(mockDetail)

  useLoad(() => {
    console.log('Detail page loaded.', router.params.id)
  })

  const goBack = () => {
    navigateBack()
  }

  const goToTasks = () => {
    navigateTo({ url: `/pages/tasks/index?matchId=${detail.id}` })
  }

  const goToQuiz = () => {
    navigateTo({ url: `/pages/quiz/index?matchId=${detail.id}` })
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-32">
      {/* 头部 */}
      <View className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 rounded-b-3xl">
        <View className="flex items-center justify-between mb-4">
          <View onClick={goBack}>
            <ArrowLeft size={24} color="#fff" />
          </View>
          <View className="flex items-center gap-2">
            <Pencil size={20} color="#fff" />
          </View>
        </View>

        {/* 基本信息 */}
        <View className="flex items-center gap-4">
          <View className="w-16 h-16 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
            <Text className="block text-white text-2xl font-bold">
              {detail.name.charAt(0)}
            </Text>
          </View>
          <View className="flex-1">
            <View className="flex items-center gap-2 mb-1">
              <Text className="block text-white text-xl font-semibold">{detail.name}</Text>
              <Text className="block text-white text-opacity-80">{detail.age}岁</Text>
            </View>
            <Text className="block text-white text-opacity-80 text-sm">
              {detail.occupation} · {meetingSceneLabels[detail.meetingScene]}
            </Text>
            <Badge className={`mt-2 ${statusConfig[detail.status].color}`}>
              {statusConfig[detail.status].label}
            </Badge>
          </View>
          <View className="text-right">
            <View className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Heart
                  key={i}
                  size={14}
                  color={i < detail.impression ? '#EC4899' : 'rgba(255,255,255,0.3)'}
                />
              ))}
            </View>
            <Text className="block text-white text-opacity-80 text-xs mt-1">
              相识 {Math.ceil((new Date().getTime() - new Date(detail.meetingDate).getTime()) / (1000 * 60 * 60 * 24))} 天
            </Text>
          </View>
        </View>

        {/* 进度 */}
        <View className="mt-4 bg-white bg-opacity-20 rounded-xl p-3">
          <View className="flex items-center justify-between mb-2">
            <Text className="block text-white text-sm">关系进展</Text>
            <Text className="block text-white text-sm">{detail.progress}%</Text>
          </View>
          <Progress value={detail.progress} className="h-2 bg-white bg-opacity-30" />
        </View>
      </View>

      {/* 兴趣标签 */}
      <View className="p-4">
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <Text className="block font-semibold text-gray-800 mb-3">兴趣爱好</Text>
            <View className="flex flex-wrap gap-2">
              {detail.interests.map((interest, i) => (
                <Badge key={i} variant="outline" className="text-indigo-600 border-indigo-200">
                  {interest}
                </Badge>
              ))}
            </View>
            {detail.notes && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                <Text className="block text-sm text-gray-500">{detail.notes}</Text>
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 快捷操作 */}
      <View className="p-4">
        <Text className="block font-semibold text-gray-800 mb-3">快捷操作</Text>
        <View className="grid grid-cols-3 gap-3">
          <Card className="shadow-sm border-0" onClick={goToTasks}>
            <CardContent className="p-4 text-center">
              <View className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-2">
                <Sparkles size={24} color="#6366F1" />
              </View>
              <Text className="block text-sm font-medium text-gray-800">互动任务</Text>
              <Text className="block text-xs text-gray-400">{detail.stats.completedTasks}/{detail.stats.tasks} 完成</Text>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0" onClick={goToQuiz}>
            <CardContent className="p-4 text-center">
              <View className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2">
                <Gamepad2 size={24} color="#EC4899" />
              </View>
              <Text className="block text-sm font-medium text-gray-800">默契测试</Text>
              <Text className="block text-xs text-gray-400">{detail.stats.quizScore}分</Text>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0">
            <CardContent className="p-4 text-center">
              <View className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <TrendingUp size={24} color="#10B981" />
              </View>
              <Text className="block text-sm font-medium text-gray-800">约会记录</Text>
              <Text className="block text-xs text-gray-400">{detail.stats.dates}次</Text>
            </CardContent>
          </Card>
        </View>
      </View>

      {/* 下一步行动 */}
      <View className="p-4">
        <Card className="shadow-sm border-0 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardContent className="p-4">
            <View className="flex items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                <MessageCircle size={20} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="block text-sm text-indigo-600 font-medium">下一步行动</Text>
                <Text className="block text-gray-800">{detail.nextAction}</Text>
              </View>
              <ChevronRight size={20} color="#6366F1" />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 互动记录 */}
      <View className="p-4">
        <Text className="block font-semibold text-gray-800 mb-3">互动记录</Text>
        {detail.history.map((item, index) => (
          <View
            key={index}
            className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0"
          >
            <View className={`w-8 h-8 rounded-full flex items-center justify-center ${
              item.type === 'date' ? 'bg-pink-100' :
              item.type === 'task' ? 'bg-indigo-100' : 'bg-emerald-100'
            }`}
            >
              {item.type === 'date' && <Calendar size={16} color="#EC4899" />}
              {item.type === 'task' && <Sparkles size={16} color="#6366F1" />}
              {item.type === 'quiz' && <Gamepad2 size={16} color="#10B981" />}
            </View>
            <View className="flex-1">
              <Text className="block text-sm text-gray-800">{item.content}</Text>
              <Text className="block text-xs text-gray-400">{item.date}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 底部操作 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <View className="flex gap-3">
          <Button variant="outline" className="flex-1">
            <MessageCircle size={16} color="#6366F1" />
            <Text className="ml-1 text-indigo-600">话题推荐</Text>
          </Button>
          <Button className="flex-1 bg-indigo-500">
            <Calendar size={16} color="#fff" />
            <Text className="ml-1 text-white">安排约会</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default DetailPage
