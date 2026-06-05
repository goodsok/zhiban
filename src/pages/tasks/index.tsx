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
  Cloud,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ListChecks,
  Target
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
  reason?: string
  steps?: string[]
  tags?: string[]
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

const categoryColors = {
  prepare: 'bg-blue-50 text-blue-600',
  chat: 'bg-green-50 text-green-600',
  game: 'bg-white text-orange-600',
  romantic: 'bg-pink-50 text-pink-600',
}

const difficultyColors = {
  '简单': 'bg-gray-50 text-gray-500',
  '中等': 'bg-amber-50 text-amber-600',
  '困难': 'bg-red-50 text-red-600',
}

const tagColors: Record<string, string> = {
  '信息补全': 'bg-green-50 text-green-600',
  '关系推进': 'bg-violet-50 text-violet-600',
  '周期适配': 'bg-teal-50 text-teal-600',
  '互动破冰': 'bg-cyan-50 text-cyan-600',
  '情感升温': 'bg-rose-50 text-rose-600',
  '深度了解': 'bg-purple-50 text-purple-600',
  '趣味互动': 'bg-white text-orange-600',
  '浪漫约会': 'bg-pink-50 text-pink-600',
  '贴心关怀': 'bg-green-50 text-green-600',
  '话题拓展': 'bg-sky-50 text-sky-600',
  '表达心意': 'bg-red-50 text-red-500',
  '创造回忆': 'bg-amber-50 text-amber-600',
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
  
  if (task.avoidPhases?.includes(currentPhase)) {
    return { suitable: false, reason: `${phaseLabels[currentPhase]}不建议` }
  }
  
  if (task.suitablePhases?.length) {
    if (task.suitablePhases.includes(currentPhase)) {
      return { suitable: true, reason: `${phaseLabels[currentPhase]}最佳` }
    }
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
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)

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
      console.log('Fetch tasks response:', res.data)
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
      console.log('Fetch progress response:', res.data)
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
      console.log('Fetch cycle info response:', res.data)
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
      console.log('Complete task response:', res.data)
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
      await Network.request({
        url: `/api/task/generate/${matchId}`,
        method: 'POST',
      })
      fetchTasks()
      fetchProgress()
    } catch (error) {
      console.error('Failed to generate tasks:', error)
    } finally {
      setGenerating(false)
    }
  }

  const toggleExpand = (taskId: number) => {
    setExpandedTaskId(prev => prev === taskId ? null : taskId)
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
    <View className="min-h-screen pb-24" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部 */}
      <CustomHeader title="任务" />

      {/* 进度 */}
      <View className="px-4 py-4">
        <View className="bg-white rounded-xl p-4">
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
            {generating ? 'AI 生成中...' : '生成推荐任务'}
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
              <View className="mb-4 bg-gray-50 rounded-xl p-3 flex items-center gap-4">
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
                <View className="bg-white rounded-xl divide-y divide-gray-50">
                  {pendingTasks.map((task) => {
                    const phaseCheck = isTaskSuitableForPhase(task, cycleInfo?.phase || null)
                    const isExpanded = expandedTaskId === task.id
                    return (
                      <View key={task.id} className="px-4 py-3">
                        {/* 标题行 */}
                        <View className="flex items-center">
                          <View className="flex-1">
                            <View className="flex items-center gap-3 mb-1">
                              <Text className="block text-sm font-medium text-gray-900">{task.title}</Text>
                              {task.source === 'ai' && (
                                <Sparkles size={12} color="#4ECB71" />
                              )}
                            </View>
                            {/* 标签行 */}
                            <View className="flex flex-wrap items-center gap-1">
                              <Badge className={`text-xs ${categoryColors[task.category]}`}>
                                {categoryLabels[task.category]}
                              </Badge>
                              <Badge className={`text-xs ${difficultyColors[task.difficulty]}`}>
                                {task.difficulty}
                              </Badge>
                              <Text className="block text-xs text-gray-400">{task.duration}</Text>
                              {/* 周期阶段标记 */}
                              {phaseCheck.reason && (
                                <Badge className={`text-xs ${phaseCheck.suitable ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                  {phaseCheck.reason}
                                </Badge>
                              )}
                              {/* AI 生成的多维标签 */}
                              {task.tags?.map(tag => (
                                <Badge key={tag} className={`text-xs ${tagColors[tag] || 'bg-gray-50 text-gray-500'}`}>
                                  {tag}
                                </Badge>
                              ))}
                            </View>
                          </View>
                          {/* 展开按钮 */}
                          <View 
                            className="ml-2 p-1"
                            onClick={() => toggleExpand(task.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp size={16} color="#9CA3AF" />
                            ) : (
                              <ChevronDown size={16} color="#9CA3AF" />
                            )}
                          </View>
                        </View>

                        {/* 展开详情 */}
                        {isExpanded && (
                          <View className="mt-3 pt-3 border-t border-gray-100">
                            {/* 任务描述 */}
                            {task.description && (
                              <View className="mb-4">
                                <Text className="block text-xs text-gray-500 mb-1">任务说明</Text>
                                <Text className="block text-sm text-gray-700 leading-relaxed">{task.description}</Text>
                              </View>
                            )}

                            {/* 做任务的原因 */}
                            {task.reason && (
                              <View className="mb-4 bg-amber-50 rounded-lg p-3">
                                <View className="flex items-center gap-3 mb-2">
                                  <Lightbulb size={14} color="#D97706" />
                                  <Text className="block text-xs font-medium text-amber-700">为什么做</Text>
                                </View>
                                <Text className="block text-sm text-amber-800 leading-relaxed">{task.reason}</Text>
                              </View>
                            )}

                            {/* 执行步骤 */}
                            {task.steps && task.steps.length > 0 && (
                              <View className="mb-2 bg-blue-50 rounded-lg p-3">
                                <View className="flex items-center gap-3 mb-2">
                                  <ListChecks size={14} color="#2563EB" />
                                  <Text className="block text-xs font-medium text-blue-700">执行步骤</Text>
                                </View>
                                {task.steps.map((step, idx) => (
                                  <View key={idx} className="flex items-start gap-3 mb-1 last:mb-0">
                                    <View className="mt-1 w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                      <Text className="block text-xs text-blue-600">{idx + 1}</Text>
                                    </View>
                                    <Text className="block text-sm text-blue-800 leading-relaxed">{step}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        )}

                        {/* 底部操作：完成按钮 */}
                        {!isExpanded && (
                          <View className="mt-2 flex items-center justify-end">
                            <View 
                              className="flex items-center gap-3 px-3 py-1 rounded-full bg-gray-800"
                              onClick={() => completeTask(task.id)}
                            >
                              <Target size={12} color="#fff" />
                              <Text className="block text-xs text-white">完成</Text>
                            </View>
                          </View>
                        )}
                        {isExpanded && (
                          <View className="mt-3 flex items-center justify-end gap-3">
                            <View 
                              className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800"
                              onClick={() => completeTask(task.id)}
                            >
                              <Check size={14} color="#fff" />
                              <Text className="block text-sm text-white">标记完成</Text>
                            </View>
                          </View>
                        )}
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
                <View className="bg-white rounded-xl divide-y divide-gray-100">
                  {completedTasks.slice(0, 5).map((task) => (
                    <View key={task.id} className="px-4 py-3">
                      <View className="flex items-center">
                        <View className="flex-1">
                          <Text className="block text-sm text-gray-400 line-through">{task.title}</Text>
                          {task.tags && task.tags.length > 0 && (
                            <View className="flex flex-wrap gap-1 mt-1">
                              {task.tags.map(tag => (
                                <Badge key={tag} className={`text-xs opacity-50 ${tagColors[tag] || 'bg-gray-50 text-gray-400'}`}>
                                  {tag}
                                </Badge>
                              ))}
                            </View>
                          )}
                        </View>
                        <View className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                          <Check size={14} color="#fff" />
                        </View>
                      </View>
                      {/* 显示学习记录 */}
                      {task.lessonLearned && (
                        <View className="mt-2 pl-2 border-l-2 border-emerald-400">
                          <Text className="block text-xs text-gray-500">{task.lessonLearned}</Text>
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
