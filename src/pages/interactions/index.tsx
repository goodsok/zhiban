import { View } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Calendar, MessageCircle, Phone, Video, Gift, Heart, Users } from 'lucide-react-taro'
import './index.css'

// 互动类型
type InteractionType = 'date' | 'chat' | 'call' | 'video' | 'message' | 'gift' | 'physical' | 'social' | 'other'

// 互动事件接口
interface InteractionEvent {
  id: number
  matchId: number
  interactionType: InteractionType
  interactionCategory: string | null
  startedAt: string | null
  endedAt: string | null
  durationMinutes: number | null
  initiator: string | null
  location: string | null
  locationType: string | null
  title: string | null
  description: string | null
  activities: string[]
  qualityScore: number | null
  mood: string | null
  energyChange: number
  breakthroughMoment: string | null
  issuesEncountered: string | null
  newInsights: Array<{
    dimensionKey: string
    value: string | string[]
    source: string
    confidence: number
  }>
  createdAt: string
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

// 心情标签
const MOOD_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  excellent: { label: '非常愉快', emoji: '😄', color: '#10B981' },
  good: { label: '比较愉快', emoji: '😊', color: '#3B82F6' },
  neutral: { label: '一般', emoji: '😐', color: '#6B7280' },
  awkward: { label: '有点尴尬', emoji: '😅', color: '#F59E0B' },
  bad: { label: '不太愉快', emoji: '😞', color: '#EF4444' },
}

export default function InteractionsPage() {
  const router = useRouter()
  const matchId = Number(router.params.matchId)

  const [events, setEvents] = useState<InteractionEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<InteractionType | 'all'>('all')

  // 加载互动事件
  const loadEvents = useCallback(async () => {
    if (!matchId) return

    setLoading(true)
    try {
      const res = await Network.request({
        url: `/api/interaction/match/${matchId}`,
        method: 'GET',
      })
      console.log('Load interactions response:', res.data)

      if (res.data.code === 200) {
        setEvents(res.data.data.list || [])
      }
    } catch (error) {
      console.error('Load interactions error:', error)
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useLoad(() => {
    loadEvents()
  })

  // 过滤事件
  const filteredEvents = activeType === 'all'
    ? events
    : events.filter(e => e.interactionType === activeType)

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`

    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  // 格式化时长
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return ''
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  }

  // 跳转到创建互动
  const goCreateInteraction = () => {
    Taro.navigateTo({
      url: `/pages/interaction-create/index?matchId=${matchId}`,
    })
  }

  // 跳转到互动详情
  const goEventDetail = (eventId: number) => {
    Taro.navigateTo({
      url: `/pages/interaction-detail/index?id=${eventId}&matchId=${matchId}`,
    })
  }

  return (
    <View className="interactions-page">
      {/* 头部 */}
      <View className="header">
        <View className="header-title">互动记录</View>
        <Button size="sm" onClick={goCreateInteraction}>
          <Plus size={16} color="#fff" className="mr-1" />
          <View>记录互动</View>
        </Button>
      </View>

      {/* 类型筛选 */}
      <View className="type-filter">
        <View
          className={`type-item ${activeType === 'all' ? 'active' : ''}`}
          onClick={() => setActiveType('all')}
        >
          全部
        </View>
        {Object.entries(INTERACTION_TYPE_CONFIG).map(([type, config]) => (
          <View
            key={type}
            className={`type-item ${activeType === type ? 'active' : ''}`}
            onClick={() => setActiveType(type as InteractionType)}
          >
            {config.label}
          </View>
        ))}
      </View>

      {/* 互动列表 */}
      <View className="events-list">
        {loading ? (
          <View className="loading">加载中...</View>
        ) : filteredEvents.length === 0 ? (
          <View className="empty">
            <View className="empty-icon">📝</View>
            <View className="empty-text">暂无互动记录</View>
            <View className="empty-hint">点击右上角按钮记录你们的互动</View>
          </View>
        ) : (
          filteredEvents.map(event => {
            const typeConfig = INTERACTION_TYPE_CONFIG[event.interactionType]
            const moodConfig = event.mood ? MOOD_LABELS[event.mood] : null
            const IconComponent = typeConfig.icon

            return (
              <Card
                key={event.id}
                className="event-card"
                onClick={() => goEventDetail(event.id)}
              >
                <CardContent className="p-4">
                  <View className="event-header">
                    <View className="event-type-badge" style={{ backgroundColor: typeConfig.color }}>
                      <IconComponent size={16} color="#fff" />
                      <View className="type-label">{typeConfig.label}</View>
                    </View>
                    <View className="event-date">{formatDate(event.startedAt || event.createdAt)}</View>
                  </View>

                  <View className="event-title">{event.title || typeConfig.label}</View>

                  {event.location && (
                    <View className="event-location">📍 {event.location}</View>
                  )}

                  <View className="event-meta">
                    {event.durationMinutes && (
                      <View className="meta-item">⏱️ {formatDuration(event.durationMinutes)}</View>
                    )}
                    {moodConfig && (
                      <View className="meta-item" style={{ color: moodConfig.color }}>
                        {moodConfig.emoji} {moodConfig.label}
                      </View>
                    )}
                  </View>

                  {event.energyChange > 0 && (
                    <View className="energy-change">
                      ⚡ 能量 +{event.energyChange.toFixed(1)}
                    </View>
                  )}

                  {event.activities.length > 0 && (
                    <View className="activities">
                      {event.activities.slice(0, 3).map((activity, idx) => (
                        <View key={idx} className="activity-tag">{activity}</View>
                      ))}
                    </View>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </View>
    </View>
  )
}
