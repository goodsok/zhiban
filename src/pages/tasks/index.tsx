import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, useRouter } from '@tarojs/taro'
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
  Star,
  RefreshCw,
  Loader,
  Trash2
} from 'lucide-react-taro'

interface Task {
  id: number
  matchId: number
  category: 'prepare' | 'chat' | 'game' | 'romantic'
  title: string
  description: string
  difficulty: '简单' | '中等' | '困难'
  duration: string
  source: 'system' | 'ai' | 'manual'
  completed: boolean
  completedAt?: string
  createdAt: string
  relatedKeyInfo?: string[]
  relatedStage?: string
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

const getSourceBadge = (source: string) => {
  switch (source) {
    case 'ai':
      return { label: 'AI推荐', color: 'bg-purple-50 text-purple-600' }
    case 'system':
      return { label: '智能生成', color: 'bg-blue-50 text-blue-600' }
    case 'manual':
      return { label: '手动添加', color: 'bg-gray-50 text-gray-600' }
    default:
      return { label: '其他', color: 'bg-gray-50 text-gray-600' }
  }
}

const TasksPage: FC = () => {
  const router = useRouter()
  const matchId = router.params.matchId
  const [activeTab, setActiveTab] = useState('prepare')
  const [tasks, setTasks] = useState<Task[]>([])
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  useLoad(() => {
    console.log('Tasks page loaded. matchId:', matchId)
  })

  useDidShow(() => {
    fetchTasks()
    fetchProgress()
  })

  const fetchTasks = async () => {
    if (!matchId) return
    
    try {
      setLoading(true)
      const res = await Network.request({ 
        url: `/api/task/list?matchId=${matchId}` 
      })
      console.log('Tasks response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setTasks(res.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProgress = async () => {
    if (!matchId) return
    
    try {
      const res = await Network.request({ 
        url: `/api/task/progress?matchId=${matchId}` 
      })
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

  const deleteTask = async (taskId: number) => {
    try {
      const res = await Network.request({
        url: '/api/task/delete',
        method: 'POST',
        data: { taskId }
      })
      console.log('Delete task response:', res.data)
      if (res.data?.code === 200) {
        fetchTasks()
        fetchProgress()
      }
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  // 生成推荐任务（根据阶段和关键信息）
  const generateRecommendedTasks = async () => {
    if (!matchId) return
    
    try {
      setGenerating(true)
      
      // 先获取对象详情
      const detailRes = await Network.request({
        url: `/api/match/${matchId}`
      })
      
      if (detailRes.data?.code === 200 && detailRes.data?.data) {
        const matchData = detailRes.data.data
        
        // 调用任务生成接口
        const res = await Network.request({
          url: `/api/task/generate/${matchId}`,
          method: 'POST',
          data: {
            relationshipStage: matchData.relationshipStage,
            keyInfo: matchData.keyInfo || [],
            interests: matchData.interests || [],
          }
        })
        
        console.log('Generate tasks response:', res.data)
        if (res.data?.code === 200) {
          fetchTasks()
          fetchProgress()
        }
      }
    } catch (error) {
      console.error('Failed to generate tasks:', error)
    } finally {
      setGenerating(false)
    }
  }

  // 过滤当前分类的任务
  const filteredTasks = tasks.filter((task) => task.category === activeTab)

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

      {/* 操作按钮 */}
      <View className="px-4 pb-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={generateRecommendedTasks}
          disabled={generating}
        >
          {generating ? (
            <Loader size={16} color="#6366F1" className="animate-spin" />
          ) : (
            <RefreshCw size={16} color="#6366F1" />
          )}
          <Text className="ml-2 text-indigo-600">
            {generating ? '生成中...' : '根据关系阶段生成推荐任务'}
          </Text>
        </Button>
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
              {loading ? (
                <View className="text-center py-8">
                  <Loader size={32} color="#6366F1" className="animate-spin" />
                  <Text className="block text-gray-400 mt-2">加载中...</Text>
                </View>
              ) : filteredTasks.length === 0 ? (
                <Card className="shadow-sm border-0">
                  <CardContent className="p-8 text-center">
                    <Text className="block text-gray-400 mb-4">暂无任务</Text>
                    <Text className="block text-sm text-gray-300">
                      点击上方按钮生成推荐任务，或在详情页获取AI互动建议
                    </Text>
                  </CardContent>
                </Card>
              ) : (
                filteredTasks.map((task) => {
                  const sourceBadge = getSourceBadge(task.source)
                  return (
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
                              <Text className={`block font-semibold ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                {task.title}
                              </Text>
                            </View>
                            <Text className="block text-sm text-gray-500 mb-2">
                              {task.description}
                            </Text>
                            <View className="flex items-center gap-2 flex-wrap">
                              <Badge className={getDifficultyColor(task.difficulty)}>
                                {task.difficulty}
                              </Badge>
                              <Badge variant="outline" className="text-gray-500">
                                {task.duration}
                              </Badge>
                              <Badge className={sourceBadge.color}>
                                {sourceBadge.label}
                              </Badge>
                            </View>
                          </View>
                        </View>
                        <View className="mt-3 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={task.completed ? 'outline' : 'default'}
                            className={task.completed ? '' : 'bg-pink-500 hover:bg-pink-600'}
                            disabled={task.completed}
                            onClick={() => completeTask(task.id)}
                          >
                            {task.completed ? '已完成 ✓' : '标记完成'}
                          </Button>
                          {!task.completed && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 size={14} color="#9CA3AF" />
                            </Button>
                          )}
                        </View>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          ))}
        </Tabs>
      </View>

      {/* 提示说明 */}
      <View className="px-4 pb-4">
        <Card className="shadow-sm border-0 bg-indigo-50">
          <CardContent className="p-4">
            <View className="flex items-start gap-3">
              <View className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} color="#6366F1" />
              </View>
              <View className="flex-1">
                <Text className="block font-medium text-indigo-800 mb-1">智能任务系统</Text>
                <Text className="block text-sm text-indigo-600">
                  任务会根据关系阶段、关键信息和互动建议自动更新。完成任务后，关系进度会相应提升。
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

export default TasksPage
