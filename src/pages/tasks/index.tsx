import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, useRouter } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import CustomHeader from '@/components/custom-header'
import { 
  Check, 
  Loader,
  Sparkles,
  RefreshCw,
  Sun,
  Heart,
  Moon,
  Cloud
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
  suitablePhases?: string[]
  avoidPhases?: string[]
  lessonLearned?: string
}

interface CycleInfo {
  day: number
  phase: string
  phaseName: string
  description: string
  recommendations: string[]
}

const categoryLabels = {
  prepare: '准备',
  chat: '聊天',
  game: '互动',
  romantic: '浪漫',
}

const phaseLabels: Record<string, string> = {
  menstrual: '月经期',
  follicular: '卵泡期',
  ovulation: '排卵期',
  luteal_early: '黄体前期',
  luteal_mid: '黄体中期',
  luteal_late: '黄体后期',
}

// 判断任务是否适合当前周期阶段
const isTaskSuitableForPhase = (task: Task, currentPhase: string | null): { suitable: boolean; reason?: string } => {
  if (!currentPhase) return { suitable: true }
  
  // 如果任务有避免的阶段列表，检查当前阶段
  if (task.avoidPhases?.includes(currentPhase)) {
    return { suitable: false, reason: `${phaseLabels[currentPhase]}不适合` }
  }
  
  // 如果任务有适合的阶段列表
  if (task.suitablePhases?.length) {
    if (task.suitablePhases.includes(currentPhase)) {
      return { suitable: true, reason: `${phaseLabels[currentPhase]}最佳` }
    }
    // 不在适合列表，但也不在避免列表
    return { suitable: true }
  }
  
  return { suitable: true }
}

const TasksPage: FC = () => {
  const router = useRouter()
  const matchId = router.params.matchId
  const [tasks, setTasks] = useState<Task[]>([])
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null)

  useLoad(() => {
    console.log('Tasks page loaded. matchId:', matchId)
  })

  useDidShow(() => {
    fetchTasks()
    fetchProgress()
    fetchCycleInfo()
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

  const fetchCycleInfo = async () => {
    if (!matchId) return
    try {
      const res = await Network.request({ 
        url: `/api/match/${matchId}/cycle` 
      })
      if (res.data?.code === 200 && res.data?.data) {
        setCycleInfo(res.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch cycle info:', error)
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
            keyInfo: matchData.keyInfo || [],
            interests: matchData.interests || [],
            cycleStartDate: matchData.cycleStartDate,
            cycleLength: matchData.cycleLength,
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

  // 按分类分组
  const pendingTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  // 获取当前周期阶段的图标和颜色
  const getPhaseIcon = () => {
    if (!cycleInfo) return null
    const icons: Record<string, typeof Sun> = {
      menstrual: Moon,
      follicular: Sun,
      ovulation: Heart,
      luteal_early: Sun,
      luteal_mid: Cloud,
      luteal_late: Cloud,
    }
    return icons[cycleInfo.phase] || Sun
  }

  const PhaseIcon = getPhaseIcon()

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部 */}
      <CustomHeader title="任务" />

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
            {/* 周期阶段提示 */}
            {cycleInfo && PhaseIcon && (
              <View className="mb-4 bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <PhaseIcon size={20} color={cycleInfo.phase === 'luteal_late' || cycleInfo.phase === 'luteal_mid' ? '#F59E0B' : '#10B981'} />
                <View className="flex-1">
                  <Text className="block text-sm font-medium text-gray-900">
                    当前：{cycleInfo.phaseName} · Day {cycleInfo.day}
                  </Text>
                  <Text className="block text-xs text-gray-500">{cycleInfo.description}</Text>
                </View>
              </View>
            )}

            {/* 待完成 */}
            {pendingTasks.length > 0 && (
              <View className="mb-4">
                <Text className="block text-xs text-gray-400 mb-2">待完成</Text>
                <View className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                  {pendingTasks.map((task) => {
                    const phaseCheck = isTaskSuitableForPhase(task, cycleInfo?.phase || null)
                    return (
                      <View key={task.id} className="flex items-center px-4 py-3">
                        <View className="flex-1">
                          <View className="flex items-center gap-2 mb-1">
                            <Text className="block text-sm text-gray-900">{task.title}</Text>
                            {task.source === 'ai' && (
                              <Sparkles size={12} color="#6366F1" />
                            )}
                            {/* 周期阶段适合性标记 */}
                            {phaseCheck.reason && (
                              <Badge className={`text-xs ${phaseCheck.suitable ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                {phaseCheck.reason}
                              </Badge>
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
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${phaseCheck.suitable ? 'border-gray-300' : 'border-amber-300'}`}
                          onClick={() => completeTask(task.id)}
                        >
                          <Check size={14} color="transparent" />
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>
            )}

            {/* 已完成 */}
            {completedTasks.length > 0 && (
              <View>
                <Text className="block text-xs text-gray-400 mb-2">已完成</Text>
                <View className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                  {completedTasks.slice(0, 5).map((task) => (
                    <View key={task.id} className="px-4 py-3">
                      <View className="flex items-center">
                        <View className="flex-1">
                          <Text className="block text-sm text-gray-400 line-through">{task.title}</Text>
                        </View>
                        <View className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                          <Check size={14} color="#fff" />
                        </View>
                      </View>
                      {/* 显示学习记录 */}
                      {task.lessonLearned && (
                        <View className="mt-2 pl-2 border-l-2 border-emerald-400">
                          <Text className="block text-xs text-gray-500">💡 {task.lessonLearned}</Text>
                        </View>
                      )}
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
