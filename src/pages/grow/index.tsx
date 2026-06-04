import { useState, useEffect, useCallback } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import type { FC } from 'react'
import {
  Calendar,
  Target,
  BookHeart,
  Heart,
  Plus,
  Clock,
  Trash2,
  Sparkles,
  RotateCw,
} from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/toast'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Network } from '@/network'

interface Anniversary {
  id: number
  title: string
  date: string
  icon: string
}

interface Goal {
  id: number
  title: string
  progress: number
  total: number
  completed: boolean
}

interface Memory {
  id: number
  content: string
  date: string
}

interface PromiseItem {
  id: number
  content: string
  completed: boolean
}

// 推荐目标池
const goalPool = [
  { title: '一起读完10本书', total: 10 },
  { title: '每周一次约会', total: 52 },
  { title: '一起健身100天', total: 100 },
  { title: '学会一道新菜', total: 1 },
  { title: '一起看日出', total: 1 },
  { title: '攒够旅行基金', total: 10000 },
  { title: '一起看完100部电影', total: 100 },
  { title: '每天说早安晚安', total: 30 },
  { title: '一起学一门新技能', total: 1 },
  { title: '一起做志愿者', total: 5 },
  { title: '一起去游乐园', total: 3 },
  { title: '一起养一盆花', total: 1 },
  { title: '一起做早餐30天', total: 30 },
  { title: '一起跑步50公里', total: 50 },
  { title: '一起写日记', total: 100 },
  { title: '一起看演唱会', total: 2 },
  { title: '一起学跳舞', total: 12 },
  { title: '一起画画', total: 10 },
  { title: '一起做手工', total: 5 },
  { title: '一起去露营', total: 2 },
  { title: '一起学游泳', total: 10 },
  { title: '一起骑自行车郊游', total: 4 },
  { title: '一起拍照100张', total: 100 },
  { title: '一起做饭50道', total: 50 },
]

// 推荐约定池
const promisePool = [
  '吵架不过夜，当天解决',
  '每天早晚各说一次我想你',
  '每月至少一次约会',
  '每周一起看一部电影',
  '出门前给对方一个拥抱',
  '记得所有重要纪念日',
  '每天分享一件开心的事',
  '睡前聊十分钟天',
  '一起做家务',
  '不拿对方和别人比较',
  '有矛盾直接说出来',
  '每周一起做饭一次',
  '一起规划未来',
  '给对方留私人空间',
  '不轻易说分手',
  '一起存钱实现梦想',
  '互相鼓励对方爱好',
  '一起早起晨跑',
  '睡前互道晚安',
  '有话好好说，不冷战',
  '一起看书学习',
  '定期给惊喜',
  '尊重对方家人朋友',
  '一起做年度计划',
]

const shuffleArray = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const getRandomItems = <T,>(arr: T[], count: number): T[] => {
  return shuffleArray(arr).slice(0, count)
}

const GrowPage: FC = () => {
  const router = useRouter()
  const matchId = Number(router.params.matchId) || 0

  const [activeTab, setActiveTab] = useState('anniversary')
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [promises, setPromises] = useState<PromiseItem[]>([])
  const [loading, setLoading] = useState(true)

  // 推荐目标
  const [recommendedGoals, setRecommendedGoals] = useState<{ title: string; total: number }[]>(
    getRandomItems(goalPool, 5)
  )
  const [addedGoals, setAddedGoals] = useState<Set<string>>(new Set())

  // 推荐约定
  const [recommendedPromises, setRecommendedPromises] = useState<string[]>(
    getRandomItems(promisePool, 5)
  )
  const [addedPromises, setAddedPromises] = useState<Set<string>>(new Set())

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addType, setAddType] = useState<'anniversary' | 'goal' | 'memory' | 'promise'>('anniversary')
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newGoalTotal, setNewGoalTotal] = useState('')

  // 目标增量输入
  const [goalDeltaInput, setGoalDeltaInput] = useState<Record<number, string>>({})

  // 删除确认
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number } | null>(null)

  // 加载数据
  const loadData = useCallback(async () => {
    if (!matchId) {
      setLoading(false)
      return
    }
    try {
      const res = await Network.request({
        url: `/api/grow?matchId=${matchId}`,
      })
      console.log('Grow data response:', res.data)
      const d = res.data?.data
      if (d) {
        setAnniversaries(d.anniversaries || [])
        const loadedGoals: Goal[] = d.goals || []
        setGoals(loadedGoals)
        setMemories(d.memories || [])
        const loadedPromises: PromiseItem[] = d.promises || []
        setPromises(loadedPromises)
        // 同步推荐项的"已添加"状态
        setAddedGoals(prev => {
          const goalTitles = new Set(loadedGoals.map((g: Goal) => g.title))
          return new Set([...prev, ...goalTitles])
        })
        setAddedPromises(prev => {
          const promiseContents = new Set(loadedPromises.map((p: PromiseItem) => p.content))
          return new Set([...prev, ...promiseContents])
        })
      }
    } catch (err) {
      console.error('Load grow data error:', err)
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 日期工具
  const getDaysUntil = (dateStr: string) => {
    const target = new Date(dateStr)
    const now = new Date()
    const diffTime = target.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getNextAnniversary = (dateStr: string) => {
    const target = new Date(dateStr)
    const now = new Date()
    const thisYear = new Date(now.getFullYear(), target.getMonth(), target.getDate())
    return thisYear < now
      ? new Date(now.getFullYear() + 1, target.getMonth(), target.getDate())
      : thisYear
  }

  const getYearsTogether = (dateStr: string) => {
    const target = new Date(dateStr)
    const now = new Date()
    let years = now.getFullYear() - target.getFullYear()
    const monthDiff = now.getMonth() - target.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < target.getDate())) {
      years--
    }
    return years
  }

  const handleAdd = async () => {
    if (addType === 'anniversary') {
      if (!newTitle || !newDate) {
        toast.error('请填写名称和日期')
        return
      }
      const res = await Network.request({
        url: '/api/grow/anniversary',
        method: 'POST',
        data: { matchId, title: newTitle, date: newDate, icon: '💝' },
      })
      console.log('Add anniversary response:', res.data)
      if (res.data?.code === 200) {
        toast.success('纪念日已添加')
        loadData()
      }
    } else if (addType === 'goal') {
      if (!newTitle || !newGoalTotal) {
        toast.error('请填写目标和数量')
        return
      }
      const total = parseInt(newGoalTotal)
      if (Number.isNaN(total) || total <= 0) {
        toast.error('目标数量需大于0')
        return
      }
      const res = await Network.request({
        url: '/api/grow/goal',
        method: 'POST',
        data: { matchId, title: newTitle, total },
      })
      console.log('Add goal response:', res.data)
      if (res.data?.code === 200) {
        toast.success('目标已添加')
        loadData()
      }
    } else if (addType === 'memory') {
      if (!newContent) {
        toast.error('请写下你的回忆')
        return
      }
      const res = await Network.request({
        url: '/api/grow/memory',
        method: 'POST',
        data: { matchId, content: newContent },
      })
      console.log('Add memory response:', res.data)
      if (res.data?.code === 200) {
        toast.success('回忆已记录')
        loadData()
      }
    } else if (addType === 'promise') {
      if (!newContent) {
        toast.error('请填写约定内容')
        return
      }
      const res = await Network.request({
        url: '/api/grow/promise',
        method: 'POST',
        data: { matchId, content: newContent },
      })
      console.log('Add promise response:', res.data)
      if (res.data?.code === 200) {
        toast.success('约定已添加')
        loadData()
      }
    }
    setShowAddDialog(false)
    setNewTitle('')
    setNewDate('')
    setNewContent('')
    setNewGoalTotal('')
  }

  const handleTogglePromise = async (id: number) => {
    const res = await Network.request({
      url: `/api/grow/promise/${id}/toggle`,
      method: 'POST',
    })
    console.log('Toggle promise response:', res.data)
    if (res.data?.code === 200) {
      loadData()
    }
  }

  const handleUpdateGoal = async (id: number, delta: number) => {
    // 防止进度减到负数
    const goal = goals.find(g => g.id === id)
    if (!goal) return
    const newProgress = goal.progress + delta
    if (newProgress < 0) {
      toast.error('进度不能小于0')
      return
    }
    const res = await Network.request({
      url: `/api/grow/goal/${id}/progress`,
      method: 'POST',
      data: { delta },
    })
    console.log('Update goal progress response:', res.data)
    if (res.data?.code === 200) {
      const updatedGoal = res.data?.data
      if (updatedGoal?.completed) {
        toast.success(`恭喜完成目标「${updatedGoal.title}」！`)
      }
      loadData()
    }
  }

  // 自定义增量更新目标
  const handleCustomGoalUpdate = async (id: number) => {
    const deltaStr = goalDeltaInput[id]
    if (!deltaStr) return
    const delta = parseInt(deltaStr)
    if (Number.isNaN(delta) || delta === 0) return
    await handleUpdateGoal(id, delta)
    setGoalDeltaInput(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    const { type, id } = deleteTarget
    const endpointMap: Record<string, string> = {
      anniversary: `/api/grow/anniversary/${id}`,
      goal: `/api/grow/goal/${id}`,
      memory: `/api/grow/memory/${id}`,
      promise: `/api/grow/promise/${id}`,
    }
    const res = await Network.request({
      url: endpointMap[type],
      method: 'DELETE',
    })
    console.log('Delete response:', res.data)
    if (res.data?.code === 200) {
      toast.success('已删除')
      loadData()
    }
    setShowDeleteDialog(false)
    setDeleteTarget(null)
  }

  const handleDeleteClick = (type: string, id: number) => {
    setDeleteTarget({ type, id })
    setShowDeleteDialog(true)
  }

  const handleRegenerateGoals = () => {
    setRecommendedGoals(getRandomItems(goalPool, 5))
    setAddedGoals(new Set())
  }

  const handleAddRecommendedGoal = async (goal: { title: string; total: number }) => {
    const res = await Network.request({
      url: '/api/grow/goal',
      method: 'POST',
      data: { matchId, title: goal.title, total: goal.total },
    })
    if (res.data?.code === 200) {
      setAddedGoals(prev => new Set([...prev, goal.title]))
      toast.success('目标已添加')
      loadData()
    }
  }

  const handleRegeneratePromises = () => {
    setRecommendedPromises(getRandomItems(promisePool, 5))
    setAddedPromises(new Set())
  }

  const handleAddRecommendedPromise = async (promise: string) => {
    const res = await Network.request({
      url: '/api/grow/promise',
      method: 'POST',
      data: { matchId, content: promise },
    })
    if (res.data?.code === 200) {
      setAddedPromises(prev => new Set([...prev, promise]))
      toast.success('约定已添加')
      loadData()
    }
  }

  const openAddDialog = (type: 'anniversary' | 'goal' | 'memory' | 'promise') => {
    setAddType(type)
    setShowAddDialog(true)
  }

  const getDialogTitle = () => {
    switch (addType) {
      case 'anniversary': return '添加纪念日'
      case 'goal': return '添加目标'
      case 'memory': return '记录回忆'
      case 'promise': return '添加约定'
      default: return ''
    }
  }

  const tabs = [
    { value: 'anniversary', label: '纪念日', icon: Calendar, count: anniversaries.length },
    { value: 'goal', label: '目标', icon: Target, count: goals.filter(g => !g.completed).length },
    { value: 'memory', label: '日记', icon: BookHeart, count: memories.length },
    { value: 'promise', label: '约定', icon: Heart, count: promises.filter(p => !p.completed).length },
  ]

  // 日期选择器变更
  const handleDateChange = (e: { detail: { value: string } }) => {
    setNewDate(e.detail.value)
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部 */}
      <View className="bg-black px-4 py-6">
        <Text className="block text-xl font-bold text-white mb-1">共同成长</Text>
        <Text className="block text-xs text-gray-400">
          一起变得更好的每一天
        </Text>
      </View>

      {/* Tab切换 */}
      <View className="bg-white px-4 pt-3 border-b border-gray-100">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-gray-100 rounded-lg h-10">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 rounded-md"
                >
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <Icon size={14} color={activeTab === tab.value ? '#000000' : '#9ca3af'} />
                    <Text
                      className="ml-1 text-xs"
                      style={{ color: activeTab === tab.value ? '#000000' : '#9ca3af' }}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </View>

      {/* 无效matchId提示 */}
      {!matchId && (
        <View className="flex flex-col items-center py-16">
          <Text className="block text-sm text-gray-400">无效的页面参数</Text>
          <Text className="block text-xs text-gray-300 mt-1">请从正确的入口进入</Text>
        </View>
      )}

      {/* 加载态 */}
      {matchId && loading && (
        <View className="flex flex-col items-center py-16">
          <Text className="block text-sm text-gray-400">加载中...</Text>
        </View>
      )}

      {/* 内容区域 */}
      {matchId && !loading && (
        <View className="p-4">
          <TabsContent value="anniversary">
            <Text className="block text-xs text-gray-400">重要时刻</Text>

            {anniversaries.map((item) => {
              const nextDate = getNextAnniversary(item.date)
              const daysUntil = getDaysUntil(nextDate.toISOString().split('T')[0])
              const years = getYearsTogether(item.date)

              return (
                <Card key={item.id} className="mb-3 overflow-hidden">
                  <View className="bg-gray-800 px-4 py-4">
                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <Text className="text-2xl mr-3">{item.icon}</Text>
                        <View>
                          <Text className="block text-base font-semibold text-white">{item.title}</Text>
                          <Text className="block text-xs text-gray-300">
                            在一起 {years} 年
                          </Text>
                        </View>
                      </View>
                      <View>
                        <Text className="block text-2xl font-bold text-white text-right">{daysUntil}</Text>
                        <Text className="block text-xs text-gray-300 text-right">天后</Text>
                      </View>
                    </View>
                  </View>
                  <CardContent className="py-3 px-4">
                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <Clock size={12} color="#9ca3af" />
                        <Text className="block text-xs text-gray-500 ml-1">{item.date}</Text>
                      </View>
                      <View onClick={() => handleDeleteClick('anniversary', item.id)} className="p-1">
                        <Trash2 size={14} color="#ef4444" />
                      </View>
                    </View>
                  </CardContent>
                </Card>
              )
            })}

            {anniversaries.length === 0 && (
              <Card className="p-8">
                <View className="flex flex-col items-center">
                  <Calendar size={40} color="#d1d5db" />
                  <Text className="block text-sm text-gray-400 mt-3">还没有纪念日</Text>
                  <Text className="block text-xs text-gray-300 mt-1">点击右上角添加你们的第一个纪念日</Text>
                </View>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="goal">
            <Text className="block text-xs text-gray-400">努力方向</Text>

            {/* 推荐目标 */}
            <Card className="mb-4 p-4 bg-gray-50">
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <Sparkles size={16} color="#000000" />
                  <Text className="block text-xs font-medium text-black ml-2">推荐目标</Text>
                </View>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerateGoals}
                >
                  <RotateCw size={12} color="#6b7280" />
                  <Text className="text-xs text-gray-500 ml-1">换一批</Text>
                </Button>
              </View>
              <View className="mt-3">
                {recommendedGoals.map((goal, index) => (
                  <View key={index} className="mb-2 last:mb-0">
                    <View
                      onClick={() => !addedGoals.has(goal.title) && handleAddRecommendedGoal(goal)}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: addedGoals.has(goal.title) ? '#f9fafb' : '#ffffff',
                        borderRadius: '8px',
                        border: `1px solid ${addedGoals.has(goal.title) ? '#d1d5db' : '#e5e7eb'}`
                      }}
                    >
                      <View className="flex-1">
                        <Text className={`block text-xs ${addedGoals.has(goal.title) ? 'text-gray-400' : 'text-gray-700'}`}>{goal.title}</Text>
                        <Text className="block text-xs text-gray-400 mt-1">
                          目标: {goal.total}{goal.total >= 1000 ? '元' : '次'}
                        </Text>
                      </View>
                      {addedGoals.has(goal.title) ? (
                        <Text className="block text-xs text-gray-400">已添加</Text>
                      ) : (
                        <Plus size={16} color="#000000" />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            {goals.map((item) => (
              <Card key={item.id} className="mb-3">
                <CardContent className="py-4">
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View className="flex-1">
                      <Text className={`block text-sm font-medium ${item.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {item.title}
                      </Text>
                      <Text className="block text-xs text-gray-500 mt-1">
                        {item.progress} / {item.total}{item.total >= 1000 ? '元' : ' 次'}
                      </Text>
                    </View>
                    <View onClick={() => handleDeleteClick('goal', item.id)} className="p-1">
                      <Trash2 size={14} color="#ef4444" />
                    </View>
                  </View>
                  <View className="mt-3 mb-3">
                    <Progress value={(item.progress / item.total) * 100} className="h-2" />
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text className="block text-xs text-gray-500">
                      {Math.round((item.progress / item.total) * 100)}% 完成
                    </Text>
                    {!item.completed && (
                      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <View
                          onClick={() => handleUpdateGoal(item.id, -1)}
                          style={{ width: '28px', height: '28px', borderRadius: '14px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Text className="block text-sm text-gray-600">-</Text>
                        </View>
                        <View
                          onClick={() => handleUpdateGoal(item.id, 1)}
                          style={{ width: '28px', height: '28px', borderRadius: '14px', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '8px' }}
                        >
                          <Text className="block text-sm text-white">+</Text>
                        </View>
                        {/* 自定义增量 */}
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginLeft: '8px' }}>
                          <View style={{ width: '50px', backgroundColor: '#f9fafb', borderRadius: '6px', padding: '2px 6px' }}>
                            <Input
                              style={{ width: '100%', fontSize: '12px', textAlign: 'center' }}
                              type="number"
                              placeholder="N"
                              value={goalDeltaInput[item.id] || ''}
                              onInput={(e) => setGoalDeltaInput(prev => ({ ...prev, [item.id]: e.detail.value }))}
                            />
                          </View>
                          <View
                            onClick={() => handleCustomGoalUpdate(item.id)}
                            style={{ marginLeft: '4px', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Text className="block text-xs text-white">Go</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </CardContent>
              </Card>
            ))}

            {goals.length === 0 && (
              <Card className="p-8">
                <View className="flex flex-col items-center">
                  <Target size={40} color="#d1d5db" />
                  <Text className="block text-sm text-gray-400 mt-3">还没有共同目标</Text>
                  <Text className="block text-xs text-gray-300 mt-1">设定一个一起努力的目标吧</Text>
                </View>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="memory">
            <Text className="block text-xs text-gray-400">美好回忆</Text>

            {memories.map((item) => (
              <Card key={item.id} className="mb-3">
                <CardContent className="py-4">
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View className="flex-1">
                      <Text className="block text-sm text-gray-800 leading-relaxed">{item.content}</Text>
                      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }} className="mt-2">
                        <Calendar size={12} color="#9ca3af" />
                        <Text className="block text-xs text-gray-500 ml-1">{item.date}</Text>
                      </View>
                    </View>
                    <View onClick={() => handleDeleteClick('memory', item.id)} className="p-1 ml-2">
                      <Trash2 size={14} color="#ef4444" />
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}

            {memories.length === 0 && (
              <Card className="p-8">
                <View className="flex flex-col items-center">
                  <BookHeart size={40} color="#d1d5db" />
                  <Text className="block text-sm text-gray-400 mt-3">还没有记录</Text>
                  <Text className="block text-xs text-gray-300 mt-1">记录你们的第一个美好时刻</Text>
                </View>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="promise">
            <Text className="block text-xs text-gray-400">我们的承诺</Text>

            {/* 推荐约定 */}
            <Card className="mb-4 p-4 bg-gray-50">
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <Sparkles size={16} color="#000000" />
                  <Text className="block text-xs font-medium text-black ml-2">推荐约定</Text>
                </View>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegeneratePromises}
                >
                  <RotateCw size={12} color="#6b7280" />
                  <Text className="text-xs text-gray-500 ml-1">换一批</Text>
                </Button>
              </View>
              <View className="mt-3">
                {recommendedPromises.map((promise, index) => (
                  <View key={index} className="mb-2 last:mb-0">
                    <View
                      onClick={() => !addedPromises.has(promise) && handleAddRecommendedPromise(promise)}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: addedPromises.has(promise) ? '#f9fafb' : '#ffffff',
                        borderRadius: '8px',
                        border: `1px solid ${addedPromises.has(promise) ? '#d1d5db' : '#e5e7eb'}`
                      }}
                    >
                      <View className="flex-1">
                        <Text className={`block text-xs ${addedPromises.has(promise) ? 'text-gray-400' : 'text-gray-700'}`}>{promise}</Text>
                      </View>
                      {addedPromises.has(promise) ? (
                        <Text className="block text-xs text-gray-400">已添加</Text>
                      ) : (
                        <Plus size={16} color="#000000" />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            {/* 完成进度 */}
            {promises.length > 0 && (
              <Card className="mb-3 p-4 bg-gray-50">
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <Heart size={16} color="#000000" />
                  <Text className="block text-xs text-gray-700 ml-2">
                    已完成 {promises.filter(p => p.completed).length} / {promises.length} 个约定
                  </Text>
                </View>
              </Card>
            )}

            {promises.map((item) => (
              <Card key={item.id} className="mb-3">
                <CardContent className="py-4">
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View
                      style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}
                    >
                      <View className="mr-3 mt-1">
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => handleTogglePromise(item.id)}
                        />
                      </View>
                      <Text className={`block text-sm flex-1 ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {item.content}
                      </Text>
                    </View>
                    <View onClick={() => handleDeleteClick('promise', item.id)} className="p-1 ml-2">
                      <Trash2 size={14} color="#ef4444" />
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}

            {promises.length === 0 && (
              <Card className="p-8">
                <View className="flex flex-col items-center">
                  <Heart size={40} color="#d1d5db" />
                  <Text className="block text-sm text-gray-400 mt-3">还没有约定</Text>
                  <Text className="block text-xs text-gray-300 mt-1">添加你们的第一个约定吧</Text>
                </View>
              </Card>
            )}
          </TabsContent>
        </View>
      )}

      {/* 底部浮动添加按钮 */}
      {matchId && !loading && (
        <View
          style={{
            position: 'fixed',
            bottom: 50,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 16px',
            zIndex: 100,
          }}
        >
          <Button
            onClick={() => openAddDialog(activeTab as 'anniversary' | 'goal' | 'memory' | 'promise')}
            className="w-full bg-black hover:bg-gray-800 rounded-xl py-5 shadow-lg"
          >
            <Plus size={20} color="#ffffff" />
            <Text className="block text-base font-semibold text-white ml-2">
              {activeTab === 'anniversary' && '添加纪念日'}
              {activeTab === 'goal' && '添加新目标'}
              {activeTab === 'memory' && '记录这一刻'}
              {activeTab === 'promise' && '添加约定'}
            </Text>
          </Button>
        </View>
      )}

      {/* 删除确认弹窗 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Text className="block text-lg font-semibold">确认删除</Text>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Text className="block text-sm text-gray-500">确定要删除吗？删除后无法恢复。</Text>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text className="block">取消</Text>
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              <Text className="block text-red-500">删除</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 添加弹窗 */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => setShowAddDialog(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <View className="py-4">
            {addType === 'anniversary' && (
              <View>
                <View className="mb-4">
                  <Text className="block text-xs text-gray-500 mb-1">名称</Text>
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Input
                      value={newTitle}
                      onInput={(e) => setNewTitle(e.detail.value)}
                      placeholder="如：相识纪念、在一起"
                    />
                  </View>
                </View>
                <View className="mb-4">
                  <Text className="block text-xs text-gray-500 mb-1">日期</Text>
                  <Picker mode="date" onChange={handleDateChange} value={newDate || ''}>
                    <View className="bg-gray-50 rounded-xl px-4 py-3">
                      <Text className={`block ${newDate ? 'text-gray-900' : 'text-gray-400'}`}>
                        {newDate || '请选择日期'}
                      </Text>
                    </View>
                  </Picker>
                </View>
              </View>
            )}

            {addType === 'goal' && (
              <View>
                <View className="mb-4">
                  <Text className="block text-xs text-gray-500 mb-1">目标</Text>
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Input
                      value={newTitle}
                      onInput={(e) => setNewTitle(e.detail.value)}
                      placeholder="如：一起读完10本书"
                    />
                  </View>
                </View>
                <View className="mb-4">
                  <Text className="block text-xs text-gray-500 mb-1">目标数量</Text>
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Input
                      value={newGoalTotal}
                      onInput={(e) => setNewGoalTotal(e.detail.value)}
                      placeholder="如：10"
                      type="number"
                    />
                  </View>
                </View>
              </View>
            )}

            {addType === 'memory' && (
              <View className="mb-4">
                <Text className="block text-xs text-gray-500 mb-1">记录这一刻</Text>
                <Textarea
                  value={newContent}
                  onInput={(e) => setNewContent(e.detail.value)}
                  placeholder="写下今天最想记住的瞬间..."
                  maxlength={500}
                />
              </View>
            )}

            {addType === 'promise' && (
              <View className="mb-4">
                <Text className="block text-xs text-gray-500 mb-1">约定内容</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    value={newContent}
                    onInput={(e) => setNewContent(e.detail.value)}
                    placeholder="如：每周一起看一部电影"
                  />
                </View>
              </View>
            )}

            <View style={{ display: 'flex', flexDirection: 'row' }}>
              <Button
                variant="secondary"
                style={{ flex: 1 }}
                onClick={() => setShowAddDialog(false)}
              >
                <Text className="block">取消</Text>
              </Button>
              <Button
                style={{ flex: 1, backgroundColor: '#000000', marginLeft: '12px' }}
                onClick={handleAdd}
              >
                <Text className="block text-white">保存</Text>
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default GrowPage
