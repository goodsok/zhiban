import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, useRouter, navigateBack } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Check, 
  Loader,
  Sparkles,
  RefreshCw
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
}

const categoryLabels = {
  prepare: '准备',
  chat: '聊天',
  game: '互动',
  romantic: '浪漫',
}

const TasksPage: FC = () => {
  const router = useRouter()
  const matchId = router.params.matchId
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
      if (res.data?.code === 200) {
        fetchTasks()
        fetchProgress()
      }
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const generateTasks = async () => {
    if (!matchId) return
    try {
      setGenerating(true)
      const detailRes = await Network.request({
        url: `/api/match/${matchId}`
      })
      if (detailRes.data?.code === 200 && detailRes.data?.data) {
        const matchData = detailRes.data.data
        await Network.request({
          url: `/api/task/generate/${matchId}`,
          method: 'POST',
          data: {
            relationshipStage: matchData.relationshipStage,
            keyInfo: matchData.keyInfo || [],
            interests: matchData.interests || [],
          }
        })
        fetchTasks()
        fetchProgress()
      }
    } catch (error) {
      console.error('Failed to generate tasks:', error)
    } finally {
      setGenerating(false)
    }
  }

  const goBack = () => navigateBack()

  // 按分类分组
  const pendingTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部 */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex items-center justify-between">
          <View onClick={goBack}>
            <ArrowLeft size={24} color="#374151" />
          </View>
          <Text className="block text-base font-semibold text-gray-900">任务</Text>
          <View className="w-6" />
        </View>
      </View>

      {/* 进度 */}
      <View className="px-4 py-4">
        <View className="bg-white rounded-xl border border-gray-100 p-4">
          <View className="flex items-center justify-between mb-2">
            <Text className="block text-sm text-gray-500">完成进度</Text>
            <Text className="block text-sm font-semibold text-gray-900">
              {progress.completed}/{progress.total}
            </Text>
          </View>
          <Progress 
            value={progress.total > 0 ? (progress.completed / progress.total) * 100 : 0} 
            className="h-1 bg-gray-100" 
          />
        </View>
      </View>

      {/* 生成任务 */}
      <View className="px-4 pb-4">
        <Button 
          variant="outline" 
          className="w-full border-gray-200"
          onClick={generateTasks}
          disabled={generating}
        >
          {generating ? (
            <Loader size={16} color="#6B7280" className="animate-spin" />
          ) : (
            <RefreshCw size={16} color="#6B7280" />
          )}
          <Text className="ml-2 text-gray-600">
            {generating ? '生成中...' : '生成推荐任务'}
          </Text>
        </Button>
      </View>

      {/* 任务列表 */}
      <View className="px-4">
        {loading ? (
          <View className="text-center py-12">
            <Loader size={24} color="#6B7280" className="animate-spin" />
          </View>
        ) : tasks.length === 0 ? (
          <View className="text-center py-12">
            <Text className="block text-gray-400 mb-2">暂无任务</Text>
            <Text className="block text-xs text-gray-300">点击上方按钮生成推荐任务</Text>
          </View>
        ) : (
          <>
            {/* 待完成 */}
            {pendingTasks.length > 0 && (
              <View className="mb-4">
                <Text className="block text-xs text-gray-400 mb-2">待完成</Text>
                <View className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                  {pendingTasks.map((task) => (
                    <View key={task.id} className="flex items-center px-4 py-3">
                      <View className="flex-1">
                        <View className="flex items-center gap-2 mb-1">
                          <Text className="block text-sm text-gray-900">{task.title}</Text>
                          {task.source === 'ai' && (
                            <Sparkles size={12} color="#6366F1" />
                          )}
                        </View>
                        <View className="flex items-center gap-2">
                          <Badge className="bg-gray-100 text-gray-500 text-xs">
                            {categoryLabels[task.category]}
                          </Badge>
                          <Text className="block text-xs text-gray-400">{task.duration}</Text>
                        </View>
                      </View>
                      <View 
                        className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"
                        onClick={() => completeTask(task.id)}
                      >
                        <Check size={14} color="transparent" />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 已完成 */}
            {completedTasks.length > 0 && (
              <View>
                <Text className="block text-xs text-gray-400 mb-2">已完成</Text>
                <View className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                  {completedTasks.slice(0, 5).map((task) => (
                    <View key={task.id} className="flex items-center px-4 py-3">
                      <View className="flex-1">
                        <Text className="block text-sm text-gray-400 line-through">{task.title}</Text>
                      </View>
                      <View className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                        <Check size={14} color="#fff" />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  )
}

export default TasksPage
