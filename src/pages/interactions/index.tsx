import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, useRouter, useDidShow } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import CustomHeader from '@/components/custom-header'
import { 
  Plus, Calendar, MessageCircle, Phone, Video, Gift, Heart, Users, 
  Clock, MapPin, Sparkles, ChevronRight, TrendingUp, Image
} from 'lucide-react-taro'

// 互动类型
type InteractionType = 'date' | 'chat' | 'call' | 'video' | 'message' | 'gift' | 'physical' | 'social' | 'other'

// 互动事件接口
interface InteractionEvent {
  id: number
  matchId: number
  interactionType: InteractionType
  interactionCategory: string | null
  startedAt: string | null
  durationMinutes: number | null
  initiator: string | null
  location: string | null
  title: string | null
  description: string | null
  activities: string[]
  mood: string | null
  energyChange: number
  breakthroughMoment: string | null
  chatRecordIds: number[]
  createdAt: string
}

// 关系能量接口
interface EnergyData {
  current: number
  trend: string
  totalInteractions: number
}

// 互动类型配置
const INTERACTION_TYPE_CONFIG: Record<InteractionType, {
  label: string
  icon: typeof Calendar
  color: string
}> = {
  date: { label: '约会', icon: Calendar, color: '#EC4899' },
  chat: { label: '聊天', icon: MessageCircle, color: '#3B82F6' },
  call: { label: '通话', icon: Phone, color: '#10B981' },
  video: { label: '视频', icon: Video, color: '#8B5CF6' },
  message: { label: '消息', icon: MessageCircle, color: '#F59E0B' },
  gift: { label: '礼物', icon: Gift, color: '#EF4444' },
  physical: { label: '亲密', icon: Heart, color: '#EC4899' },
  social: { label: '社交', icon: Users, color: '#06B6D4' },
  other: { label: '其他', icon: Calendar, color: '#6B7280' },
}

// 心情配置
const MOOD_CONFIG: Record<string, { label: string; emoji: string }> = {
  excellent: { label: '超开心', emoji: '🥰' },
  good: { label: '挺不错', emoji: '😊' },
  neutral: { label: '还行吧', emoji: '😐' },
  awkward: { label: '有点尬', emoji: '😅' },
  bad: { label: '不太好', emoji: '😞' },
}

export default function InteractionsPage() {
  const router = useRouter()
  const matchId = Number(router.params.matchId)

  const [events, setEvents] = useState<InteractionEvent[]>([])
  const [energy, setEnergy] = useState<EnergyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<InteractionType | 'all'>('all')

  // 加载数据
  const loadData = useCallback(async () => {
    if (!matchId) return

    setLoading(true)
    try {
      const [eventsRes, energyRes] = await Promise.all([
        Network.request({ url: `/api/interaction/match/${matchId}` }),
        Network.request({ url: `/api/interaction/match/${matchId}/energy` }),
      ])

      console.log('Load interactions response:', eventsRes.data)
      console.log('Load energy response:', energyRes.data)

      if (eventsRes.data?.code === 200) {
        setEvents(eventsRes.data.data?.list || [])
      }
      
      if (energyRes.data?.code === 200) {
        setEnergy(energyRes.data.data)
      }
    } catch (error) {
      console.error('Load data error:', error)
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useLoad(() => {
    loadData()
  })

  // 从创建页返回时刷新列表
  useDidShow(() => {
    if (events.length > 0 || !loading) {
      loadData()
    }
  })

  // 过滤事件
  const filteredEvents = activeType === 'all'
    ? events
    : events.filter(e => e.interactionType === activeType)

  // 按日期分组
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = formatDateGroup(event.startedAt || event.createdAt)
    if (!groups[date]) groups[date] = []
    groups[date].push(event)
    return groups
  }, {} as Record<string, InteractionEvent[]>)

  // 格式化日期分组
  function formatDateGroup(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  // 格式化时间
  function formatTime(dateStr: string | null): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  // 格式化时长
  function formatDuration(minutes: number | null): string {
    if (!minutes) return ''
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h${mins}min` : `${hours}小时`
  }

  // 跳转到创建互动
  const goCreateInteraction = () => {
    Taro.navigateTo({ url: `/pages/interaction-create/index?matchId=${matchId}` })
  }

  // 跳转到互动详情
  const goEventDetail = (eventId: number) => {
    Taro.navigateTo({ url: `/pages/interaction-detail/index?id=${eventId}` })
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      <CustomHeader title="互动记录" />

      {/* 能量概览卡片 */}
      {energy && (
        <View className="mx-4 mt-4 mb-3">
          <View 
            className="rounded-2xl p-4 border border-amber-100"
            style={{ background: 'linear-gradient(to right, #FFFBEB, #FFF7ED)' }}
          >
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <View className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
                  <Sparkles size={16} color="#F59E0B" />
                </View>
                <Text className="block text-sm font-medium text-gray-900">关系能量</Text>
              </View>
              <View className="flex items-center gap-1">
                {energy.trend === 'rising' && <TrendingUp size={14} color="#10B981" />}
                <Text className="block text-xs text-gray-500">
                  {energy.trend === 'rising' ? '上升中' : energy.trend === 'declining' ? '下降中' : '稳定'}
                </Text>
              </View>
            </View>
            
            <View className="flex items-end justify-between">
              <View className="flex items-end gap-2">
                <Text className="block text-4xl font-bold text-amber-600">{energy.current}</Text>
                <Text className="block text-sm text-gray-400 pb-1">/ 100</Text>
              </View>
              <View className="text-right">
                <Text className="block text-xs text-gray-400">累计互动</Text>
                <Text className="block text-lg font-semibold text-gray-900">{energy.totalInteractions}</Text>
                <Text className="block text-xs text-gray-400">次</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 类型筛选 - ScrollView 横向滚动 */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView scrollX className="flex flex-row px-4 py-3 gap-2" style={{ whiteSpace: 'nowrap' }}>
          <View
            className="flex-shrink-0 px-4 py-2 rounded-full"
            style={{ 
              backgroundColor: activeType === 'all' ? '#1f2937' : '#f3f4f6',
            }}
            onClick={() => setActiveType('all')}
          >
            <Text className="block text-sm" style={{ color: activeType === 'all' ? '#fff' : '#4b5563' }}>全部</Text>
          </View>
          {Object.entries(INTERACTION_TYPE_CONFIG).map(([type, config]) => {
            const isActive = activeType === type
            return (
              <View
                key={type}
                className="flex-shrink-0 px-4 py-2 rounded-full"
                style={{ backgroundColor: isActive ? '#1f2937' : '#f3f4f6' }}
                onClick={() => setActiveType(type as InteractionType)}
              >
                <Text className="block text-sm" style={{ color: isActive ? '#fff' : '#4b5563' }}>{config.label}</Text>
              </View>
            )
          })}
        </ScrollView>
      </View>

      {/* 互动列表 */}
      <View className="p-4">
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="block text-gray-400">加载中...</Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <View className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Calendar size={32} color="#D1D5DB" />
            </View>
            <Text className="block text-base text-gray-500 mb-2">暂无互动记录</Text>
            <Text className="block text-sm text-gray-400 mb-6">点击下方按钮记录你们的互动</Text>
          </View>
        ) : (
          Object.entries(groupedEvents).map(([date, dateEvents]) => (
            <View key={date} className="mb-6">
              {/* 日期标题 */}
              <View className="flex items-center gap-2 mb-3 px-1">
                <Text className="block text-sm font-medium text-gray-500">{date}</Text>
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="block text-xs text-gray-400">{dateEvents.length}次</Text>
              </View>

              {/* 该日期的事件列表 */}
              {dateEvents.map(event => {
                const typeConfig = INTERACTION_TYPE_CONFIG[event.interactionType] || INTERACTION_TYPE_CONFIG.other
                const moodConfig = event.mood ? MOOD_CONFIG[event.mood] : null
                const IconComponent = typeConfig.icon

                return (
                  <Card
                    key={event.id}
                    className="mb-3 border border-gray-100 overflow-hidden"
                    onClick={() => goEventDetail(event.id)}
                  >
                    <CardContent className="p-0">
                      {/* 左侧色条 */}
                      <View className="flex flex-row">
                        <View 
                          className="w-1"
                          style={{ backgroundColor: typeConfig.color }}
                        />
                        
                        <View className="flex-1 p-4">
                          {/* 头部：类型 + 时间 */}
                          <View className="flex items-center justify-between mb-2">
                            <View className="flex items-center gap-2">
                              <View 
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${typeConfig.color}20` }}
                              >
                                <IconComponent size={14} color={typeConfig.color} />
                              </View>
                              <Text className="block text-sm font-medium" style={{ color: typeConfig.color }}>
                                {typeConfig.label}
                              </Text>
                            </View>
                            <Text className="block text-xs text-gray-400">
                              {formatTime(event.startedAt)}
                            </Text>
                          </View>

                          {/* 标题 */}
                          <Text className="block text-base font-medium text-gray-900 mb-2">
                            {event.title || '互动记录'}
                          </Text>

                          {/* 元信息 */}
                          <View className="flex flex-row flex-wrap gap-3 mb-2">
                            {event.durationMinutes ? (
                              <View className="flex items-center gap-1">
                                <Clock size={12} color="#9CA3AF" />
                                <Text className="block text-xs text-gray-500">{formatDuration(event.durationMinutes)}</Text>
                              </View>
                            ) : null}
                            {event.location ? (
                              <View className="flex items-center gap-1">
                                <MapPin size={12} color="#9CA3AF" />
                                <Text className="block text-xs text-gray-500">{event.location}</Text>
                              </View>
                            ) : null}
                            {moodConfig ? (
                              <View className="flex items-center gap-1">
                                <Text className="block text-xs">{moodConfig.emoji}</Text>
                                <Text className="block text-xs text-gray-500">{moodConfig.label}</Text>
                              </View>
                            ) : null}
                            {event.chatRecordIds && event.chatRecordIds.length > 0 ? (
                              <View className="flex items-center gap-1">
                                <Image size={12} color="#9CA3AF" />
                                <Text className="block text-xs text-gray-500">{event.chatRecordIds.length}条聊天记录</Text>
                              </View>
                            ) : null}
                          </View>

                          {/* 活动标签 */}
                          {event.activities && event.activities.length > 0 && (
                            <View className="flex flex-row flex-wrap gap-1 mb-2">
                              {event.activities.map((activity, idx) => (
                                <View key={idx} className="px-2 py-1 rounded-full" style={{ backgroundColor: '#f3f4f6' }}>
                                  <Text className="block text-xs text-gray-600">{activity}</Text>
                                </View>
                              ))}
                            </View>
                          )}

                          {/* 底部：能量 + 突破 */}
                          <View className="flex items-center justify-between pt-2 border-t border-gray-50">
                            <View className="flex items-center gap-2">
                              {event.energyChange > 0 ? (
                                <View className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: '#FFFBEB' }}>
                                  <Sparkles size={10} color="#F59E0B" />
                                  <Text className="block text-xs text-amber-600">+{event.energyChange.toFixed(0)}</Text>
                                </View>
                              ) : null}
                              {event.breakthroughMoment ? (
                                <View className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: '#FFF1F2' }}>
                                  <Heart size={10} color="#EC4899" />
                                  <Text className="block text-xs text-rose-600">突破</Text>
                                </View>
                              ) : null}
                            </View>
                            <ChevronRight size={16} color="#D1D5DB" />
                          </View>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                )
              })}
            </View>
          ))
        )}
      </View>

      {/* 底部浮动按钮 - 避开 TabBar */}
      <View 
        style={{
          position: 'fixed', bottom: 60, left: 16, right: 16,
          zIndex: 100
        }}
      >
        <Button
          className="w-full py-4 rounded-2xl shadow-lg"
          style={{ backgroundColor: '#1f2937' }}
          onClick={goCreateInteraction}
        >
          <View className="flex items-center justify-center gap-2">
            <Plus size={20} color="#fff" />
            <Text className="block text-base font-medium text-white">
              {events.length === 0 ? '记录第一次互动' : '记录新互动'}
            </Text>
          </View>
        </Button>
      </View>
    </View>
  )
}
