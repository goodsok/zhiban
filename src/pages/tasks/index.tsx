import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  Sparkles, 
  MessageCircle, 
  Gamepad2, 
  Heart, 
  Check,
  Clock,
  Star
} from 'lucide-react-taro'

interface Task {
  id: number
  category: string
  title: string
  description: string
  difficulty: string
  duration: string
  completed: boolean
}

const taskCategories = [
  { id: 'prepare', label: '约会准备', icon: Sparkles },
  { id: 'chat', label: '聊天话题', icon: MessageCircle },
  { id: 'game', label: '互动游戏', icon: Gamepad2 },
  { id: 'romantic', label: '浪漫举动', icon: Heart },
]

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case '简单':
      return 'bg-green-50 text-green-600'
    case '中等':
      return 'bg-amber-50 text-amber-600'
    case '困难':
      return 'bg-red-50 text-red-600'
    default:
      return 'bg-gray-50 text-gray-600'
  }
}

const TasksPage: FC = () => {
  const [activeTab, setActiveTab] = useState('prepare')
  const [tasks, setTasks] = useState<Task[]>([])
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  
  useLoad(() => {
    console.log('Tasks page loaded.')
  })

  useDidShow(() => {
    fetchTasks()
    fetchProgress()
  })

  const fetchTasks = async () => {
    try {
      const res = await Network.request({ url: '/api/task/list' })
      console.log('Tasks response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setTasks(res.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    }
  }

  const fetchProgress = async () => {
    try {
      const res = await Network.request({ url: '/api/task/progress' })
      console.log('Progress response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setProgress(res.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    }
  }

  const completeTask = async (taskId: number) => {
    try {
      const res = await Network.request({
        url: '/api/task/complete',
        method: 'POST',
        data: { taskId }
      })
      console.log('Complete task response:', res.data)
      if (res.data?.code === 200) {
        fetchTasks()
        fetchProgress()
      }
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 统计卡片 */}
      <View className="p-4">
        <Card className="shadow-sm border-0 bg-gradient-to-r from-pink-500 to-orange-400">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <View>
                <Text className="block text-white text-opacity-80 text-sm">任务完成进度</Text>
                <View className="flex items-baseline gap-1">
                  <Text className="block text-white text-3xl font-bold">{progress.completed}</Text>
                  <Text className="block text-white text-opacity-80">/{progress.total}</Text>
                </View>
              </View>
              <View className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Star size={24} color="#fff" />
              </View>
            </View>
            <Progress value={progress.total > 0 ? (progress.completed / progress.total) * 100 : 0} className="h-2 bg-white bg-opacity-30" />
          </CardContent>
        </Card>
      </View>

      {/* 任务分类 */}
      <View className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            {taskCategories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id}>
                <cat.icon size={16} color="#6B7280" className="mr-1" />
                <Text className="text-xs">{cat.label}</Text>
              </TabsTrigger>
            ))}
          </TabsList>

          {taskCategories.map((cat) => (
            <TabsContent key={cat.id} value={cat.id}>
              {tasks
                .filter((task) => task.category === cat.id)
                .map((task) => (
                  <Card key={task.id} className="mb-3 shadow-sm border-0">
                    <CardContent className="p-4">
                      <View className="flex items-start justify-between mb-2">
                        <View className="flex-1">
                          <View className="flex items-center gap-2 mb-1">
                            {task.completed ? (
                              <Check size={16} color="#10B981" />
                            ) : (
                              <Clock size={16} color="#9CA3AF" />
                            )}
                            <Text className="block font-semibold text-gray-800">
                              {task.title}
                            </Text>
                          </View>
                          <Text className="block text-sm text-gray-500 mb-2">
                            {task.description}
                          </Text>
                          <View className="flex items-center gap-2">
                            <Badge className={getDifficultyColor(task.difficulty)}>
                              {task.difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-gray-500">
                              {task.duration}
                            </Badge>
                          </View>
                        </View>
                      </View>
                      <View className="mt-3">
                        <Button
                          size="sm"
                          variant={task.completed ? 'outline' : 'default'}
                          className={task.completed ? '' : 'bg-pink-500 hover:bg-pink-600'}
                          disabled={task.completed}
                          onClick={() => completeTask(task.id)}
                        >
                          {task.completed ? '已完成 ✓' : '标记完成'}
                        </Button>
                      </View>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          ))}
        </Tabs>
      </View>
    </View>
  )
}

export default TasksPage
