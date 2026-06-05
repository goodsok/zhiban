import { View, Text } from '@tarojs/components'
import Taro, { useLoad, useRouter, useDidShow } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import CustomHeader from '@/components/custom-header'
import { 
  Calendar, Clock, MapPin, User, Heart, Sparkles, 
  MessageCircle, Phone, Video, Gift, Users, Image,
  Trash2, Pencil, FileText
} from 'lucide-react-taro'

interface ChatRecordBrief {
  id: number
  contentType: string
  source: string
  summary: string | null
  messageCount: number
  createdAt: string
}

interface InteractionDetail {
  id: number
  matchId: number
  interactionType: string
  interactionCategory: string | null
  startedAt: string
  durationMinutes: number | null
  initiator: string | null
  location: string | null
  title: string | null
  description: string | null
  activities: string[]
  mood: string | null
  breakthroughMoment: string | null
  issuesEncountered: string | null
  newInsights: string[]
  energyChange: number
  qualityScore: number | null
  chatRecordIds: number[]
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

// 互动类型标签映射
const TYPE_LABELS: Record<string, string> = {
  date: '约会',
  chat: '聊天',
  call: '通话',
  video: '视频',
  message: '消息',
  gift: '礼物',
  physical: '亲密',
  social: '社交',
  other: '其他',
}

// 心情映射
const MOOD_CONFIG: Record<string, { label: string; emoji: string }> = {
  excellent: { label: '超开心', emoji: '🥰' },
  good: { label: '挺不错', emoji: '😊' },
  neutral: { label: '还行吧', emoji: '😐' },
  awkward: { label: '有点尬', emoji: '😅' },
  bad: { label: '不太好', emoji: '😞' },
}

// 发起方映射
const INITIATOR_LABELS: Record<string, string> = {
  self: '我主动发起',
  partner: '对方主动发起',
  mutual: '共同决定的',
}

// 分类映射
const CATEGORY_LABELS: Record<string, string> = {
  online: '线上互动',
  offline: '线下互动',
  hybrid: '混合互动',
}

// 来源映射
const SOURCE_LABELS: Record<string, string> = {
  wechat: '微信',
  whatsapp: 'WhatsApp',
  tinder: 'Tinder',
  manual: '手动输入',
  other: '其他',
}

export default function InteractionDetailPage() {
  const router = useRouter()
  const interactionId = Number(router.params.id)

  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<InteractionDetail | null>(null)
  const [chatRecords, setChatRecords] = useState<ChatRecordBrief[]>([])

  // 加载详情
  const loadDetail = useCallback(async () => {
    if (!interactionId) return
    try {
      setLoading(true)
      console.log('Load interaction detail:', interactionId)

      const res = await Network.request({
        url: `/api/interaction/${interactionId}`,
        method: 'GET',
      })

      console.log('Load interaction detail response:', res.data)

      if (res.data?.code === 200) {
        const data = res.data.data
        setDetail(data)

        // 如果有关联的聊天记录，加载它们的摘要
        if (data.chatRecordIds && data.chatRecordIds.length > 0 && data.matchId) {
          try {
            const chatRes = await Network.request({
              url: `/api/chat-record/match/${data.matchId}`,
              method: 'GET',
            })
            if (chatRes.data?.code === 200) {
              const allRecords: ChatRecordBrief[] = chatRes.data.data || []
              // 只保留关联的记录
              const relatedRecords = allRecords.filter((r: ChatRecordBrief) =>
                data.chatRecordIds.includes(r.id)
              )
              setChatRecords(relatedRecords)
            }
          } catch (e) {
            console.error('Load chat records error:', e)
          }
        }
      } else {
        Taro.showToast({ title: res.data?.message || '加载失败', icon: 'error' })
      }
    } catch (error) {
      console.error('Load interaction detail error:', error)
      Taro.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }, [interactionId])

  useLoad(() => {
    loadDetail()
  })

  // 从编辑页返回时刷新
  useDidShow(() => {
    if (detail) {
      loadDetail()
    }
  })

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

      if (res.data?.code === 200) {
        Taro.showToast({ title: '删除成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({ title: res.data?.message || '删除失败', icon: 'error' })
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
      <View className="min-h-screen flex items-center justify-center pt-24" style={{ backgroundColor: '#F7F8FA' }}>
        <Text className="block text-gray-400">加载中...</Text>
      </View>
    )
  }

  if (!detail) {
    return (
      <View className="min-h-screen flex items-center justify-center pt-24" style={{ backgroundColor: '#F7F8FA' }}>
        <Text className="block text-gray-500">记录不存在</Text>
      </View>
    )
  }

  const TypeIcon = TYPE_ICONS[detail.interactionType] || MessageCircle
  const typeColor = TYPE_COLORS[detail.interactionType] || '#6B7280'
  const typeLabel = TYPE_LABELS[detail.interactionType] || '互动'
  const moodInfo = detail.mood ? MOOD_CONFIG[detail.mood] : null

  return (
    <View className="min-h-screen pb-24" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="互动详情" />

      {/* 头部卡片 - 类型标识 */}
      <View className="mx-4 mt-4 rounded-2xl p-5" style={{ backgroundColor: `${typeColor}10` }}>
        <View className="flex items-center gap-4 mb-4">
          <View className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${typeColor}20` }}>
            <TypeIcon size={24} color={typeColor} />
          </View>
          <View className="flex-1">
            <Text className="block text-lg font-semibold text-gray-900">
              {detail.title || typeLabel}
            </Text>
            <View className="flex items-center gap-3 mt-1">
              <Text className="block text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${typeColor}20`, color: typeColor }}>
                {typeLabel}
              </Text>
              {detail.interactionCategory ? (
                <Text className="block text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                  {CATEGORY_LABELS[detail.interactionCategory] || detail.interactionCategory}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* 时间 + 时长 */}
        <View className="flex flex-row gap-4">
          <View className="flex items-center gap-1">
            <Calendar size={14} color="#6b7280" />
            <Text className="block text-xs text-gray-500">{formatTime(detail.startedAt)}</Text>
          </View>
          {detail.durationMinutes ? (
            <View className="flex items-center gap-1">
              <Clock size={14} color="#6b7280" />
              <Text className="block text-xs text-gray-500">{formatDuration(detail.durationMinutes)}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* 能量贡献 */}
      <View className="mx-4 mt-3">
        <Card>
          <CardContent className="p-4">
            <View className="flex items-center gap-4">
              <View className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
                <Sparkles size={20} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="block text-xs text-gray-500">关系能量贡献</Text>
                <Text className="block text-xl font-bold text-amber-600">+{detail.energyChange}</Text>
              </View>
              {detail.qualityScore ? (
                <View className="text-right">
                  <Text className="block text-xs text-gray-400">质量评分</Text>
                  <Text className="block text-lg font-semibold text-gray-700">{detail.qualityScore}</Text>
                </View>
              ) : null}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 基本信息 */}
      <View className="mx-4 mt-3">
        <Card>
          <CardContent className="p-4">
            {detail.initiator ? (
              <View className="flex items-center justify-between py-3 border-b border-gray-100">
                <View className="flex items-center gap-3">
                  <User size={16} color="#6b7280" />
                  <Text className="block text-sm text-gray-500">发起方</Text>
                </View>
                <Text className="block text-sm text-gray-900">{INITIATOR_LABELS[detail.initiator] || detail.initiator}</Text>
              </View>
            ) : null}

            {detail.location ? (
              <View className="flex items-center justify-between py-3 border-b border-gray-100">
                <View className="flex items-center gap-3">
                  <MapPin size={16} color="#6b7280" />
                  <Text className="block text-sm text-gray-500">地点</Text>
                </View>
                <Text className="block text-sm text-gray-900">{detail.location}</Text>
              </View>
            ) : null}

            {moodInfo ? (
              <View className="flex items-center justify-between py-3">
                <View className="flex items-center gap-3">
                  <Heart size={16} color="#6b7280" />
                  <Text className="block text-sm text-gray-500">心情</Text>
                </View>
                <Text className="block text-sm text-gray-900">{moodInfo.emoji} {moodInfo.label}</Text>
              </View>
            ) : null}
          </CardContent>
        </Card>
      </View>

      {/* 活动标签 */}
      {detail.activities && detail.activities.length > 0 && (
        <View className="mx-4 mt-3">
          <Card>
            <CardContent className="p-4">
              <Text className="block text-sm font-medium text-gray-500 mb-4">活动</Text>
              <View className="flex flex-row flex-wrap gap-3">
                {detail.activities.map((activity, idx) => (
                  <View key={idx} className="px-3 py-2 rounded-full" style={{ backgroundColor: `${typeColor}10` }}>
                    <Text className="block text-sm" style={{ color: typeColor }}>{activity}</Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 详细描述 */}
      {detail.description && (
        <View className="mx-4 mt-3">
          <Card>
            <CardContent className="p-4">
              <Text className="block text-sm font-medium text-gray-500 mb-2">详细描述</Text>
              <Text className="block text-sm text-gray-900 leading-relaxed">{detail.description}</Text>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 突破性时刻 */}
      {detail.breakthroughMoment && (
        <View className="mx-4 mt-3">
          <Card>
            <CardContent className="p-4" style={{ backgroundColor: '#FFFBEB' }}>
              <Text className="block text-sm font-medium text-amber-700 mb-2">✨ 突破性时刻</Text>
              <Text className="block text-sm text-amber-900 leading-relaxed">{detail.breakthroughMoment}</Text>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 遇到的问题 */}
      {detail.issuesEncountered && (
        <View className="mx-4 mt-3">
          <Card>
            <CardContent className="p-4" style={{ backgroundColor: '#FEF2F2' }}>
              <Text className="block text-sm font-medium text-red-700 mb-2">⚠️ 遇到的问题</Text>
              <Text className="block text-sm text-red-900 leading-relaxed">{detail.issuesEncountered}</Text>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 新发现 */}
      {detail.newInsights && detail.newInsights.length > 0 && (
        <View className="mx-4 mt-3">
          <Card>
            <CardContent className="p-4">
              <Text className="block text-sm font-medium text-gray-500 mb-2">💡 新发现</Text>
              {detail.newInsights.map((insight, idx) => (
                <View key={idx} className="flex items-start gap-3 mb-1">
                  <Text className="block text-xs text-gray-400 mt-1">•</Text>
                  <Text className="block text-sm text-gray-900">{insight}</Text>
                </View>
              ))}
            </CardContent>
          </Card>
        </View>
      )}

      {/* 关联聊天记录 */}
      {chatRecords.length > 0 && (
        <View className="mx-4 mt-3">
          <Card>
            <CardContent className="p-4">
              <Text className="block text-sm font-medium text-gray-500 mb-4">📎 关联聊天记录</Text>
              {chatRecords.map(record => {
                const RecordIcon = record.contentType === 'image' ? Image : FileText
                return (
                  <View key={record.id} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-b-0">
                    <View className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EFF6FF' }}>
                      <RecordIcon size={16} color="#3B82F6" />
                    </View>
                    <View className="flex-1">
                      <View className="flex items-center gap-3">
                        <Text className="block text-sm text-gray-900">
                          {record.contentType === 'image' ? '聊天截图' : '聊天文字'}
                        </Text>
                        <Text className="block text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">
                          {SOURCE_LABELS[record.source] || record.source}
                        </Text>
                      </View>
                      {record.summary ? (
                        <Text className="block text-xs text-gray-500 mt-1">{record.summary}</Text>
                      ) : null}
                      {record.messageCount > 0 ? (
                        <Text className="block text-xs text-gray-400 mt-1">{record.messageCount}条消息</Text>
                      ) : null}
                    </View>
                  </View>
                )
              })}
            </CardContent>
          </Card>
        </View>
      )}

      {/* 操作按钮 - 避开 TabBar */}
      <View 
        style={{
          position: 'fixed', bottom: 60, left: 0, right: 0,
          display: 'flex', flexDirection: 'row', gap: '12px',
          padding: '12px 16px', backgroundColor: '#fff',
          borderTop: '1px solid #f3f4f6', zIndex: 100
        }}
      >
        <View style={{ flex: 1 }}>
          <Button
            className="w-full py-3 rounded-xl"
            style={{ backgroundColor: '#6366f1' }}
            onClick={handleEdit}
          >
            <View className="flex items-center justify-center gap-3">
              <Pencil size={16} color="#fff" />
              <Text className="block text-sm font-medium text-white">编辑</Text>
            </View>
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            className="w-full py-3 rounded-xl"
            style={{ backgroundColor: '#fff', border: '1px solid #ef4444' }}
            onClick={handleDelete}
          >
            <View className="flex items-center justify-center gap-3">
              <Trash2 size={16} color="#ef4444" />
              <Text className="block text-sm font-medium" style={{ color: '#ef4444' }}>删除</Text>
            </View>
          </Button>
        </View>
      </View>
    </View>
  )
}
