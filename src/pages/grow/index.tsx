import { useState } from 'react'
import { View, Text } from '@tarojs/components'
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

interface Anniversary {
  id: string
  title: string
  date: string
  icon: string
}

interface Goal {
  id: string
  title: string
  progress: number
  total: number
  completed: boolean
}

interface Memory {
  id: string
  content: string
  date: string
}

interface PromiseItem {
  id: string
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
  const matchId = router.params.matchId

  const [activeTab, setActiveTab] = useState('anniversary')
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([
    { id: '1', title: '相识纪念', date: '2024-01-01', icon: '💫' },
    { id: '2', title: '在一起', date: '2024-02-14', icon: '💕' },
    { id: '3', title: '第一次约会', date: '2024-02-21', icon: '🌹' },
  ])
  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', title: '一起读完5本书', progress: 3, total: 5, completed: false },
    { id: '2', title: '攒够旅行基金', progress: 8000, total: 20000, completed: false },
    { id: '3', title: '一起健身100天', progress: 45, total: 100, completed: false },
  ])
  const [memories, setMemories] = useState<Memory[]>([
    { id: '1', content: '今天一起去看了日出，她靠在我肩上说这是我最浪漫的生日礼物', date: '2024-03-15' },
    { id: '2', content: '第一次一起做饭，虽然厨房差点被烧了，但是笑得很开心', date: '2024-03-10' },
    { id: '3', content: '周末一起去逛宜家，讨论以后家的装修风格，感觉未来可期', date: '2024-03-05' },
  ])
  const [promises, setPromises] = useState<PromiseItem[]>([
    { id: '1', content: '每天早晚各说一次我想你', completed: true },
    { id: '2', content: '吵架不过夜，当天解决', completed: false },
    { id: '3', content: '每月至少一次约会', completed: true },
  ])

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

  // 删除确认
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null)

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

  const handleAdd = () => {
    if (addType === 'anniversary' && newTitle && newDate) {
      const newItem: Anniversary = {
        id: Date.now().toString(),
        title: newTitle,
        date: newDate,
        icon: '💝'
      }
      setAnniversaries([...anniversaries, newItem])
      toast.success('纪念日已添加')
    } else if (addType === 'goal' && newTitle && newGoalTotal) {
      const newItem: Goal = {
        id: Date.now().toString(),
        title: newTitle,
        progress: 0,
        total: parseInt(newGoalTotal),
        completed: false
      }
      setGoals([...goals, newItem])
      toast.success('目标已添加')
    } else if (addType === 'memory' && newContent) {
      const newItem: Memory = {
        id: Date.now().toString(),
        content: newContent,
        date: new Date().toISOString().split('T')[0]
      }
      setMemories([newItem, ...memories])
      toast.success('回忆已记录')
    } else if (addType === 'promise' && newContent) {
      const newItem: PromiseItem = {
        id: Date.now().toString(),
        content: newContent,
        completed: false
      }
      setPromises([...promises, newItem])
      toast.success('约定已添加')
    }
    setShowAddDialog(false)
    setNewTitle('')
    setNewDate('')
    setNewContent('')
    setNewGoalTotal('')
  }

  const handleTogglePromise = (id: string) => {
    setPromises(promises.map(p =>
      p.id === id ? { ...p, completed: !p.completed } : p
    ))
  }

  const handleUpdateGoal = (id: string, delta: number) => {
    setGoals(goals.map(g => {
      if (g.id === id) {
        const newProgress = Math.min(Math.max(0, g.progress + delta), g.total)
        const completed = newProgress >= g.total
        if (completed && !g.completed) {
          toast.success(`恭喜完成目标「${g.title}」！`)
        }
        return { ...g, progress: newProgress, completed }
      }
      return g
    }))
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    const { type, id } = deleteTarget
    if (type === 'anniversary') {
      setAnniversaries(anniversaries.filter(a => a.id !== id))
    } else if (type === 'goal') {
      setGoals(goals.filter(g => g.id !== id))
    } else if (type === 'memory') {
      setMemories(memories.filter(m => m.id !== id))
    } else if (type === 'promise') {
      setPromises(promises.filter(p => p.id !== id))
    }
    toast.success('已删除')
    setShowDeleteDialog(false)
    setDeleteTarget(null)
  }

  const handleDeleteClick = (type: string, id: string) => {
    setDeleteTarget({ type, id })
    setShowDeleteDialog(true)
  }

  // 重新生成推荐目标
  const handleRegenerateGoals = () => {
    setRecommendedGoals(getRandomItems(goalPool, 5))
    setAddedGoals(new Set())
  }

  // 直接添加推荐目标
  const handleAddRecommendedGoal = (goal: { title: string; total: number }) => {
    const newItem: Goal = {
      id: Date.now().toString() + Math.random(),
      title: goal.title,
      progress: 0,
      total: goal.total,
      completed: false
    }
    setGoals([...goals, newItem])
    setAddedGoals(prev => new Set([...prev, goal.title]))
    toast.success('目标已添加')
  }

  // 重新生成推荐约定
  const handleRegeneratePromises = () => {
    setRecommendedPromises(getRandomItems(promisePool, 5))
    setAddedPromises(new Set())
  }

  // 直接添加推荐约定
  const handleAddRecommendedPromise = (promise: string) => {
    const newItem: PromiseItem = {
      id: Date.now().toString() + Math.random(),
      content: promise,
      completed: false
    }
    setPromises([...promises, newItem])
    setAddedPromises(prev => new Set([...prev, promise]))
    toast.success('约定已添加')
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

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部 */}
      <View className="bg-black px-4 py-6">
        <Text className="block text-xl font-bold text-white mb-1">共同成长</Text>
        <Text className="block text-xs text-gray-400">
          一起变得更好的每一天{matchId ? ` · ID: ${matchId}` : ''}
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

      {/* 内容区域 */}
      <View className="p-4">
        <TabsContent value="anniversary">
          <View className="flex flex-row items-center justify-between mb-3">
            <Text className="block text-xs text-gray-400">重要时刻</Text>
            <View
              onClick={() => openAddDialog('anniversary')}
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '4px 8px' }}
            >
              <Plus size={14} color="#000000" />
              <Text className="block text-xs text-black ml-1">添加</Text>
            </View>
          </View>

          {anniversaries.map((item) => {
            const nextDate = getNextAnniversary(item.date)
            const daysUntil = getDaysUntil(nextDate.toISOString().split('T')[0])
            const years = getYearsTogether(item.date)

            return (
              <Card key={item.id} className="mb-3 overflow-hidden">
                <View className="bg-black px-4 py-4">
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Text className="text-2xl mr-3">{item.icon}</Text>
                      <View>
                        <Text className="block text-base font-semibold text-white">{item.title}</Text>
                        <Text className="block text-xs text-gray-400">
                          在一起 {years} 年
                        </Text>
                      </View>
                    </View>
                    <View>
                      <Text className="block text-2xl font-bold text-white text-right">{daysUntil}</Text>
                      <Text className="block text-xs text-gray-400 text-right">天后</Text>
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
          <View className="flex flex-row items-center justify-between mb-3">
            <Text className="block text-xs text-gray-400">努力方向</Text>
            <View
              onClick={() => openAddDialog('goal')}
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '4px 8px' }}
            >
              <Plus size={14} color="#000000" />
              <Text className="block text-xs text-black ml-1">添加</Text>
            </View>
          </View>

          {/* 推荐目标 */}
          <Card className="mb-4 p-4 bg-gray-50">
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Sparkles size={16} color="#000000" />
                <Text className="block text-xs font-medium text-black ml-2">推荐目标</Text>
              </View>
              <View
                onClick={handleRegenerateGoals}
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '4px 8px' }}
              >
                <RotateCw size={12} color="#6b7280" />
                <Text className="block text-xs text-gray-500 ml-1">换一批</Text>
              </View>
            </View>
            <View className="mt-3">
              {recommendedGoals.map((goal, index) => (
                <View key={index} className="mb-2 last:mb-0">
                  <View
                    onClick={() => handleAddRecommendedGoal(goal)}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      backgroundColor: addedGoals.has(goal.title) ? '#f9fafb' : '#ffffff',
                      borderRadius: '8px',
                      border: `1px solid ${addedGoals.has(goal.title) ? '#e5e7eb' : '#e5e7eb'}`
                    }}
                  >
                    <View className="flex-1">
                      <Text className="block text-xs text-gray-700">{goal.title}</Text>
                      <Text className="block text-xs text-gray-400 mt-1">
                        目标: {goal.total > 100 ? `${goal.total}元` : `${goal.total}次`}
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
                      {item.progress} / {item.total}{item.total > 100 ? '' : ' 次'}
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
          <View className="flex flex-row items-center justify-between mb-3">
            <Text className="block text-xs text-gray-400">美好回忆</Text>
            <View
              onClick={() => openAddDialog('memory')}
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '4px 8px' }}
            >
              <Plus size={14} color="#000000" />
              <Text className="block text-xs text-black ml-1">记录</Text>
            </View>
          </View>

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
          <View className="flex flex-row items-center justify-between mb-3">
            <Text className="block text-xs text-gray-400">我们的承诺</Text>
            <View
              onClick={() => openAddDialog('promise')}
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '4px 8px' }}
            >
              <Plus size={14} color="#000000" />
              <Text className="block text-xs text-black ml-1">添加</Text>
            </View>
          </View>

          {/* 推荐约定 */}
          <Card className="mb-4 p-4 bg-gray-50">
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Sparkles size={16} color="#000000" />
                <Text className="block text-xs font-medium text-black ml-2">推荐约定</Text>
              </View>
              <View
                onClick={handleRegeneratePromises}
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '4px 8px' }}
              >
                <RotateCw size={12} color="#6b7280" />
                <Text className="block text-xs text-gray-500 ml-1">换一批</Text>
              </View>
            </View>
            <View className="mt-3">
              {recommendedPromises.map((promise, index) => (
                <View key={index} className="mb-2 last:mb-0">
                  <View
                    onClick={() => handleAddRecommendedPromise(promise)}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      backgroundColor: addedPromises.has(promise) ? '#f9fafb' : '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <View className="flex-1">
                      <Text className="block text-xs text-gray-700">{promise}</Text>
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
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Input
                      value={newDate}
                      onInput={(e) => setNewDate(e.detail.value)}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
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
