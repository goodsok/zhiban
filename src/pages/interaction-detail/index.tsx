import { View, Text } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { 
  Calendar, Clock, MapPin, User, Heart, Sparkles, 
  MessageCircle, Phone, Video, Gift, Users 
} from 'lucide-react-taro'
import './index.css'

interface InteractionDetail {
  id: number
  matchId: number
  interactionType: string
  startedAt: string
  durationMinutes: number | null
  initiator: string
  location: string | null
  title: string | null
  description: string | null
  mood: string
  breakthroughMoment: string | null
  energyContribution: number
  createdAt: string
  matchName?: string
}

// 互动类型图标映射
const TYPE_ICONS: Record<string, typeof Calendar> = {
  date: Calendar,
  chat: MessageCircle,
  call: Phone,
  video: Video,
  message: MessageCircle,
  gift: Gift,
  physical: Heart,
  social: Users,
  other: MessageCircle,
}

// 互动类型颜色映射
const TYPE_COLORS: Record<string, string> = {
  date: '#EC4899',
  chat: '#3B82F6',
  call: '#10B981',
  video: '#8B5CF6',
  message: '#F59E0B',
  gift: '#EF4444',
  physical: '#EC4899',
  social: '#06B6D4',
  other: '#6B7280',
}

// 心情映射
const MOOD_EMOJIS: Record<string, string> = {
  excellent: '😄',
  good: '😊',
  neutral: '😐',
  awkward: '😅',
  bad: '😞',
}

// 发起方映射
const INITIATOR_LABELS: Record<string, string> = {
  self: '我主动发起',
  partner: '对方主动发起',
  mutual: '共同决定的',
}

export default function InteractionDetailPage() {
  const router = useRouter()
  const interactionId = Number(router.params.id)

  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<InteractionDetail | null>(null)

  useLoad(() => {
    loadDetail()
  })

  // 加载详情
  const loadDetail = async () => {
    try {
      setLoading(true)
      console.log('Load interaction detail:', interactionId)

      const res = await Network.request({
        url: `/api/interaction/${interactionId}`,
        method: 'GET',
      })

      console.log('Load interaction detail response:', res.data)

      if (res.data.code === 200) {
        setDetail(res.data.data)
      } else {
        Taro.showToast({ title: res.data.msg || '加载失败', icon: 'error' })
      }
    } catch (error) {
      console.error('Load interaction detail error:', error)
      Taro.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // 删除记录
  const handleDelete = useCallback(async () => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除吗？',
    })

    if (!result.confirm) return

    try {
      const res = await Network.request({
        url: `/api/interaction/${interactionId}`,
        method: 'DELETE',
      })

      if (res.data.code === 200) {
        Taro.showToast({ title: '删除成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({ title: res.data.msg || '删除失败', icon: 'error' })
      }
    } catch (error) {
      console.error('Delete interaction error:', error)
      Taro.showToast({ title: '删除失败', icon: 'error' })
    }
  }, [interactionId])

  // 编辑记录
  const handleEdit = useCallback(() => {
    Taro.navigateTo({
      url: `/pages/interaction-edit/index?id=${interactionId}`,
    })
  }, [interactionId])

  // 格式化时间
  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 格式化时长
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  }

  if (loading) {
    return (
      <View className="interaction-detail-page loading">
        <Text className="block loading-text">加载中...</Text>
      </View>
    )
  }

  if (!detail) {
    return (
      <View className="interaction-detail-page error">
        <Text className="block error-text">记录不存在</Text>
      </View>
    )
  }

  const TypeIcon = TYPE_ICONS[detail.interactionType] || MessageCircle
  const typeColor = TYPE_COLORS[detail.interactionType] || '#6B7280'

  return (
    <View className="interaction-detail-page">
      {/* 头部卡片 */}
      <View className="header-card" style={{ backgroundColor: `${typeColor}10` }}>
        <View className="header-icon" style={{ backgroundColor: `${typeColor}20` }}>
          <TypeIcon size={32} color={typeColor} />
        </View>
        <Text className="block header-title">
          {detail.title || '互动记录'}
        </Text>
        <View className="header-meta">
          <View className="meta-item">
            <Calendar size={14} color="#6b7280" />
            <Text className="block meta-text">{formatTime(detail.startedAt)}</Text>
          </View>
          {detail.durationMinutes && (
            <View className="meta-item">
              <Clock size={14} color="#6b7280" />
              <Text className="block meta-text">{formatDuration(detail.durationMinutes)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 能量贡献 */}
      <View className="energy-card">
        <View className="energy-icon">
          <Sparkles size={24} color="#F59E0B" />
        </View>
        <View className="energy-content">
          <Text className="block energy-label">关系能量贡献</Text>
          <Text className="block energy-value">+{detail.energyContribution}</Text>
        </View>
      </View>

      {/* 基本信息 */}
      <View className="info-section">
        <View className="info-item">
          <View className="info-label">
            <User size={16} color="#6b7280" />
            <Text className="block">发起方</Text>
          </View>
          <Text className="block info-value">{INITIATOR_LABELS[detail.initiator]}</Text>
        </View>

        {detail.location && (
          <View className="info-item">
            <View className="info-label">
              <MapPin size={16} color="#6b7280" />
              <Text className="block">地点</Text>
            </View>
            <Text className="block info-value">{detail.location}</Text>
          </View>
        )}

        <View className="info-item">
          <View className="info-label">
            <Heart size={16} color="#6b7280" />
            <Text className="block">心情</Text>
          </View>
          <Text className="block info-value">
            {MOOD_EMOJIS[detail.mood]} {detail.mood}
          </Text>
        </View>
      </View>

      {/* 详细描述 */}
      {detail.description && (
        <View className="section">
          <View className="section-title">详细描述</View>
          <Text className="block section-content">{detail.description}</Text>
        </View>
      )}

      {/* 突破性时刻 */}
      {detail.breakthroughMoment && (
        <View className="section highlight">
          <View className="section-title">突破性时刻 ✨</View>
          <Text className="block section-content">{detail.breakthroughMoment}</Text>
        </View>
      )}

      {/* 操作按钮 */}
      <View className="action-section">
        <Button 
          className="action-btn edit-btn"
          onClick={handleEdit}
        >
          编辑记录
        </Button>
        <Button 
          className="action-btn delete-btn"
          onClick={handleDelete}
        >
          删除记录
        </Button>
      </View>
    </View>
  )
}
