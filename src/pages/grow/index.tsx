import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import {
  Calendar,
  Target,
  BookHeart,
  Heart,
  Plus,
  Clock,
  Trash2,
  Circle,
  Sparkles,
  RotateCw,
  Check
} from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

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

interface GrowthModule {
  id: string
  name: string
  icon: any
  description: string
  count: number
  color: string
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
  const [activeTab, setActiveTab] = useState<'anniversary' | 'goal' | 'memory' | 'promise'>('anniversary')
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

  useLoad(() => {
    console.log('Grow page loaded.')
  })

  const getDaysUntil = (dateStr: string) => {
    const target = new Date(dateStr)
    const now = new Date()
    const diffTime = target.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getNextAnniversary = (dateStr: string) => {
    const target = new Date(dateStr)
    const now = new Date()
    const thisYear = new Date(now.getFullYear(), target.getMonth(), target.getDate())
    const nextAnniversary = thisYear < now
      ? new Date(now.getFullYear() + 1, target.getMonth(), target.getDate())
      : thisYear
    return nextAnniversary
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
    } else if (addType === 'goal' && newTitle && newGoalTotal) {
      const newItem: Goal = {
        id: Date.now().toString(),
        title: newTitle,
        progress: 0,
        total: parseInt(newGoalTotal),
        completed: false
      }
      setGoals([...goals, newItem])
    } else if (addType === 'memory' && newContent) {
      const newItem: Memory = {
        id: Date.now().toString(),
        content: newContent,
        date: new Date().toISOString().split('T')[0]
      }
      setMemories([newItem, ...memories])
    } else if (addType === 'promise' && newContent) {
      const newItem: PromiseItem = {
        id: Date.now().toString(),
        content: newContent,
        completed: false
      }
      setPromises([...promises, newItem])
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
        return { ...g, progress: newProgress, completed: newProgress >= g.total }
      }
      return g
    }))
  }

  const handleDelete = (type: string, id: string) => {
    if (type === 'anniversary') {
      setAnniversaries(anniversaries.filter(a => a.id !== id))
    } else if (type === 'goal') {
      setGoals(goals.filter(g => g.id !== id))
    } else if (type === 'memory') {
      setMemories(memories.filter(m => m.id !== id))
    } else if (type === 'promise') {
      setPromises(promises.filter(p => p.id !== id))
    }
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
  }

  const modules: GrowthModule[] = [
    { id: 'anniversary', name: '纪念日', icon: Calendar, description: '重要日期倒计时', count: anniversaries.length, color: 'from-pink-400 to-rose-500' },
    { id: 'goal', name: '共同目标', icon: Target, description: '一起努力的方向', count: goals.filter(g => !g.completed).length, color: 'from-emerald-400 to-teal-500' },
    { id: 'memory', name: '成长日记', icon: BookHeart, description: '记录美好回忆', count: memories.length, color: 'from-amber-400 to-orange-500' },
    { id: 'promise', name: '甜蜜约定', icon: Heart, description: '我们的承诺', count: promises.filter(p => !p.completed).length, color: 'from-violet-400 to-purple-500' },
  ]

  const currentModule = modules.find(m => m.id === activeTab)

  const getDialogTitle = () => {
    switch (addType) {
      case 'anniversary': return '添加纪念日'
      case 'goal': return '添加目标'
      case 'memory': return '记录回忆'
      case 'promise': return '添加约定'
      default: return ''
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部 */}
      <View className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-1">共同成长</Text>
        <Text className="block text-sm text-emerald-100">
          一起变得更好的每一天
        </Text>
      </View>

      {/* Tab切换 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View style={{ display: 'flex', flexDirection: 'row' }}>
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <View
                key={module.id}
                onClick={() => setActiveTab(module.id as any)}
                style={{
                  flex: 1,
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  paddingLeft: '8px',
                  paddingRight: '8px',
                  borderRadius: '8px',
                  backgroundColor: activeTab === module.id ? '#ecfdf5' : 'transparent',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon size={14} color={activeTab === module.id ? '#10b981' : '#9ca3af'} />
                <Text
                  style={{
                    fontSize: '12px',
                    marginLeft: '4px',
                    color: activeTab === module.id ? '#059669' : '#9ca3af'
                  }}
                >
                  {module.name}
                </Text>
              </View>
            )
          })}
        </View>
      </View>

      {/* 内容区域 */}
      <View className="p-4">
        {/* 纪念日 */}
        {activeTab === 'anniversary' && (
          <>
            <View className="flex flex-row items-center justify-between mb-3">
              <Text className="text-sm font-medium text-gray-500">重要时刻</Text>
              <View
                onClick={() => {
                  setAddType('anniversary')
                  setShowAddDialog(true)
                }}
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '4px 8px' }}
              >
                <Plus size={14} color="#10b981" />
                <Text className="text-xs text-emerald-600 ml-1">添加</Text>
              </View>
            </View>

            {anniversaries.map((item) => {
              const nextDate = getNextAnniversary(item.date)
              const daysUntil = getDaysUntil(nextDate.toISOString().split('T')[0])
              const years = getYearsTogether(item.date)

              return (
                <Card key={item.id} className="mb-3 overflow-hidden">
                  <View className={`bg-gradient-to-r ${currentModule?.color} px-4 py-4`}>
                    <View className="flex flex-row items-center justify-between">
                      <View className="flex flex-row items-center">
                        <Text className="text-2xl mr-3">{item.icon}</Text>
                        <View>
                          <Text className="block text-base font-semibold text-white">{item.title}</Text>
                          <Text className="block text-xs text-white opacity-80">
                            在一起 {years} 年
                          </Text>
                        </View>
                      </View>
                      <View className="text-right">
                        <Text className="block text-2xl font-bold text-white">{daysUntil}</Text>
                        <Text className="block text-xs text-white opacity-80">天后</Text>
                      </View>
                    </View>
                  </View>
                  <CardContent className="py-3 px-4">
                    <View className="flex flex-row items-center justify-between">
                      <View className="flex flex-row items-center">
                        <Clock size={12} color="#9ca3af" />
                        <Text className="text-xs text-gray-500 ml-1">{item.date}</Text>
                      </View>
                      <View
                        onClick={() => handleDelete('anniversary', item.id)}
                        className="p-1"
                      >
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
                  <Text className="block text-xs text-gray-400 mt-1">点击右上角添加你们的第一个纪念日</Text>
                </View>
              </Card>
            )}
          </>
        )}

        {/* 共同目标 */}
        {activeTab === 'goal' && (
          <>
            <View className="flex flex-row items-center justify-between mb-3">
              <Text className="text-sm font-medium text-gray-500">努力方向</Text>
              <View
                onClick={() => {
                  setAddType('goal')
                  setShowAddDialog(true)
                }}
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '4px 8px' }}
              >
                <Plus size={14} color="#10b981" />
                <Text className="text-xs text-emerald-600 ml-1">添加</Text>
              </View>
            </View>

            {/* 推荐目标 */}
            <Card className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
              <View className="flex flex-row items-center justify-between mb-3">
                <View className="flex flex-row items-center">
                  <Sparkles size={16} color="#10b981" />
                  <Text className="text-xs font-medium text-emerald-600 ml-2">推荐目标</Text>
                </View>
                <View
                  onClick={handleRegenerateGoals}
                  style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '4px 8px' }}
                >
                  <RotateCw size={12} color="#10b981" />
                  <Text className="text-xs text-emerald-600 ml-1">重新生成</Text>
                </View>
              </View>
              <View>
                {recommendedGoals.map((goal, index) => (
                  <View
                    key={index}
                    className="mb-2 last:mb-0"
                  >
                    <View
                      onClick={() => handleAddRecommendedGoal(goal)}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: addedGoals.has(goal.title) ? '#f0fdf4' : '#ffffff',
                        borderRadius: '8px',
                        border: `1px solid ${addedGoals.has(goal.title) ? '#86efac' : '#e5e7eb'}`
                      }}
                    >
                      <View className="flex-1">
                        <Text
                          className="text-xs"
                          style={{ color: addedGoals.has(goal.title) ? '#22c55e' : '#374151' }}
                        >
                          {goal.title}
                        </Text>
                        <Text className="text-xs text-gray-400 mt-1">
                          目标: {goal.total > 100 ? `${goal.total}元` : `${goal.total}次`}
                        </Text>
                      </View>
                      {addedGoals.has(goal.title) ? (
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                          <Check size={14} color="#22c55e" />
                          <Text className="text-xs text-green-500 ml-1">已添加</Text>
                        </View>
                      ) : (
                        <View
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '12px',
                            backgroundColor: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Plus size={14} color="#ffffff" />
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            {goals.map((item) => (
              <Card key={item.id} className="mb-3">
                <CardContent className="py-4">
                  <View className="flex flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="block text-sm font-medium text-gray-900">{item.title}</Text>
                      <Text className="block text-xs text-gray-500 mt-1">
                        {item.progress} / {item.total}
                        {item.total > 100 ? '' : ' 次'}
                      </Text>
                    </View>
                    <View
                      onClick={() => handleDelete('goal', item.id)}
                      className="p-1"
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </View>
                  </View>
                  <View className="bg-gray-100 rounded-full h-2 mb-3">
                    <View
                      className={`bg-gradient-to-r ${currentModule?.color} h-2 rounded-full transition-all`}
                      style={{ width: `${(item.progress / item.total) * 100}%` }}
                    />
                  </View>
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-xs text-emerald-600">
                      {Math.round((item.progress / item.total) * 100)}% 完成
                    </Text>
                    <View className="flex flex-row items-center">
                      <View
                        onClick={() => handleUpdateGoal(item.id, -1)}
                        style={{ width: '28px', height: '28px', borderRadius: '14px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text className="text-sm text-gray-600">-</Text>
                      </View>
                      <View
                        onClick={() => handleUpdateGoal(item.id, 1)}
                        style={{ width: '28px', height: '28px', borderRadius: '14px', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '8px' }}
                      >
                        <Text className="text-sm text-emerald-600">+</Text>
                      </View>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}

            {goals.length === 0 && (
              <Card className="p-8">
                <View className="flex flex-col items-center">
                  <Target size={40} color="#d1d5db" />
                  <Text className="block text-sm text-gray-400 mt-3">还没有共同目标</Text>
                  <Text className="block text-xs text-gray-400 mt-1">设定一个一起努力的目标吧</Text>
                </View>
              </Card>
            )}
          </>
        )}

        {/* 成长日记 */}
        {activeTab === 'memory' && (
          <>
            <View className="flex flex-row items-center justify-between mb-3">
              <Text className="text-sm font-medium text-gray-500">美好回忆</Text>
              <View
                onClick={() => {
                  setAddType('memory')
                  setShowAddDialog(true)
                }}
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '4px 8px' }}
              >
                <Plus size={14} color="#10b981" />
                <Text className="text-xs text-emerald-600 ml-1">记录</Text>
              </View>
            </View>

            {memories.map((item) => (
              <Card key={item.id} className="mb-3">
                <CardContent className="py-4">
                  <View className="flex flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="block text-sm text-gray-800 leading-relaxed">{item.content}</Text>
                      <View className="flex flex-row items-center mt-2">
                        <Calendar size={12} color="#9ca3af" />
                        <Text className="text-xs text-gray-500 ml-1">{item.date}</Text>
                      </View>
                    </View>
                    <View
                      onClick={() => handleDelete('memory', item.id)}
                      className="p-1 ml-2"
                    >
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
                  <Text className="block text-xs text-gray-400 mt-1">记录你们的第一个美好时刻</Text>
                </View>
              </Card>
            )}
          </>
        )}

        {/* 甜蜜约定 */}
        {activeTab === 'promise' && (
          <>
            <View className="flex flex-row items-center justify-between mb-3">
              <Text className="text-sm font-medium text-gray-500">我们的承诺</Text>
              <View
                onClick={() => {
                  setAddType('promise')
                  setShowAddDialog(true)
                }}
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '4px 8px' }}
              >
                <Plus size={14} color="#10b981" />
                <Text className="text-xs text-emerald-600 ml-1">添加</Text>
              </View>
            </View>

            {/* 推荐约定 */}
            <Card className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100">
              <View className="flex flex-row items-center justify-between mb-3">
                <View className="flex flex-row items-center">
                  <Sparkles size={16} color="#ec4899" />
                  <Text className="text-xs font-medium text-pink-600 ml-2">推荐约定</Text>
                </View>
                <View
                  onClick={handleRegeneratePromises}
                  style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '4px 8px' }}
                >
                  <RotateCw size={12} color="#ec4899" />
                  <Text className="text-xs text-pink-600 ml-1">重新生成</Text>
                </View>
              </View>
              <View>
                {recommendedPromises.map((promise, index) => (
                  <View
                    key={index}
                    className="mb-2 last:mb-0"
                  >
                    <View
                      onClick={() => handleAddRecommendedPromise(promise)}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: addedPromises.has(promise) ? '#fdf2f8' : '#ffffff',
                        borderRadius: '8px',
                        border: `1px solid ${addedPromises.has(promise) ? '#f9a8d4' : '#e5e7eb'}`
                      }}
                    >
                      <View className="flex-1">
                        <Text
                          className="text-xs"
                          style={{ color: addedPromises.has(promise) ? '#ec4899' : '#374151' }}
                        >
                          {promise}
                        </Text>
                      </View>
                      {addedPromises.has(promise) ? (
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                          <Check size={14} color="#ec4899" />
                          <Text className="text-xs ml-1" style={{ color: '#ec4899' }}>已添加</Text>
                        </View>
                      ) : (
                        <View
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '12px',
                            backgroundColor: '#ec4899',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Plus size={14} color="#ffffff" />
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            <Card className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100">
              <View className="flex flex-row items-center">
                <Heart size={16} color="#ec4899" />
                <Text className="block text-xs text-pink-600 ml-2">
                  已完成 {promises.filter(p => p.completed).length} / {promises.length} 个约定
                </Text>
              </View>
            </Card>

            {promises.map((item) => (
              <Card key={item.id} className="mb-3">
                <CardContent className="py-4">
                  <View className="flex flex-row items-start justify-between">
                    <View
                      onClick={() => handleTogglePromise(item.id)}
                      className="flex flex-row items-start flex-1"
                    >
                      {item.completed ? (
                        <View style={{ width: '20px', height: '20px', marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Circle size={20} color="#10b981" filled />
                        </View>
                      ) : (
                        <Circle size={20} color="#d1d5db" className="mr-3" />
                      )}
                      <Text className={`text-sm flex-1 ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {item.content}
                      </Text>
                    </View>
                    <View
                      onClick={() => handleDelete('promise', item.id)}
                      className="p-1 ml-2"
                    >
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
                  <Text className="block text-xs text-gray-400 mt-1">添加你们的第一个约定吧</Text>
                </View>
              </Card>
            )}
          </>
        )}
      </View>

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
                    />
                  </View>
                </View>
              </View>
            )}

            {addType === 'memory' && (
              <View className="mb-4">
                <Text className="block text-xs text-gray-500 mb-1">记录这一刻</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    value={newContent}
                    onInput={(e) => setNewContent(e.detail.value)}
                    placeholder="写下今天最想记住的瞬间..."
                    style={{ width: '100%', minHeight: '80px' }}
                  />
                </View>
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
                取消
              </Button>
              <Button
                style={{ flex: 1, backgroundColor: '#10b981', marginLeft: '12px' }}
                onClick={handleAdd}
              >
                保存
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default GrowPage
