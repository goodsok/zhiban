import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useCallback, useEffect } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import CustomHeader from '@/components/custom-header'
import {
  Calendar, MessageCircle, Phone, Video, Gift, Heart, Users, MapPin,
  Clock, User, Sparkles, Check, Zap, Plus, Upload, Image, Paperclip, Trash2, X
} from 'lucide-react-taro'

// 互动类型
type InteractionType = 'date' | 'chat' | 'call' | 'video' | 'message' | 'gift' | 'physical' | 'social' | 'other'
type Mood = 'excellent' | 'good' | 'neutral' | 'awkward' | 'bad'
type Initiator = 'self' | 'partner' | 'mutual'
type InteractionCategory = 'online' | 'offline' | 'hybrid'

// 聊天记录来源选项
const CHAT_SOURCE_OPTIONS = [
  { value: 'wechat', label: '微信' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'tinder', label: 'Tinder' },
  { value: 'manual', label: '手动输入' },
  { value: 'other', label: '其他' },
]

// 互动类型配置
const INTERACTION_TYPES: Array<{
  type: InteractionType
  label: string
  icon: typeof Calendar
  color: string
  bgColor: string
  category: InteractionCategory
}> = [
  { type: 'date', label: '约会', icon: Calendar, color: '#EC4899', bgColor: 'bg-pink-50', category: 'offline' },
  { type: 'chat', label: '聊天', icon: MessageCircle, color: '#3B82F6', bgColor: 'bg-blue-50', category: 'online' },
  { type: 'call', label: '通话', icon: Phone, color: '#10B981', bgColor: 'bg-emerald-50', category: 'online' },
  { type: 'video', label: '视频', icon: Video, color: '#8B5CF6', bgColor: 'bg-violet-50', category: 'online' },
  { type: 'message', label: '消息', icon: MessageCircle, color: '#F59E0B', bgColor: 'bg-amber-50', category: 'online' },
  { type: 'gift', label: '礼物', icon: Gift, color: '#EF4444', bgColor: 'bg-red-50', category: 'offline' },
  { type: 'physical', label: '亲密', icon: Heart, color: '#EC4899', bgColor: 'bg-rose-50', category: 'offline' },
  { type: 'social', label: '社交', icon: Users, color: '#06B6D4', bgColor: 'bg-cyan-50', category: 'offline' },
]

// 心情选项
const MOOD_OPTIONS: Array<{ value: Mood; label: string; emoji: string; color: string }> = [
  { value: 'excellent', label: '超开心', emoji: '🥰', color: 'bg-rose-100 border-rose-300' },
  { value: 'good', label: '挺不错', emoji: '😊', color: 'bg-amber-100 border-amber-300' },
  { value: 'neutral', label: '还行吧', emoji: '😐', color: 'bg-gray-100 border-gray-300' },
  { value: 'awkward', label: '有点尬', emoji: '😅', color: 'bg-blue-100 border-blue-300' },
  { value: 'bad', label: '不太好', emoji: '😞', color: 'bg-slate-100 border-slate-300' },
]

// 发起方选项
const INITIATOR_OPTIONS: Array<{ value: Initiator; label: string; icon: typeof User }> = [
  { value: 'self', label: '我主动', icon: User },
  { value: 'partner', label: '对方主动', icon: User },
  { value: 'mutual', label: '共同决定', icon: Users },
]

// 时长预设选项
const DURATION_OPTIONS = [
  { label: '15分钟', value: 15 },
  { label: '30分钟', value: 30 },
  { label: '1小时', value: 60 },
  { label: '2小时', value: 120 },
  { label: '半天', value: 240 },
  { label: '整天', value: 480 },
]

// 活动 tag 预设
const ACTIVITY_PRESETS: Record<InteractionType, string[]> = {
  date: ['吃饭', '看电影', '散步', '喝咖啡', '逛街', '旅行'],
  chat: ['日常闲聊', '深入话题', '暧昧调情', '倾诉心事'],
  call: ['晚安电话', '通勤聊天', '深夜长谈'],
  video: ['视频约会', '一起看电影', '远程陪伴'],
  message: ['早晚问候', '分享日常', '表情包互动'],
  gift: ['鲜花', '零食', '饰品', '惊喜快递'],
  physical: ['牵手', '拥抱', '亲吻'],
  social: ['朋友聚会', '双人约会', '家庭见面'],
  other: [],
}

// 聊天记录卡片类型
interface ChatRecordCard {
  id: number
  contentType: 'text' | 'image'
  rawContent: string | null
  source: string
  summary: string | null
  imageKey: string | null
  uploading: boolean
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function InteractionCreatePage() {
  const router = useRouter()
  const matchId = Number(router.params.matchId)

  const [submitting, setSubmitting] = useState(false)

  // 表单状态
  const [interactionType, setInteractionType] = useState<InteractionType>('date')
  const [startedAt, setStartedAt] = useState(new Date())
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [customDuration, setCustomDuration] = useState('')
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [initiator, setInitiator] = useState<Initiator>('mutual')
  const [location, setLocation] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mood, setMood] = useState<Mood>('good')
  const [breakthroughMoment, setBreakthroughMoment] = useState('')

  // 活动标签
  const [activities, setActivities] = useState<string[]>([])

  // 聊天记录相关状态
  const [chatRecords, setChatRecords] = useState<ChatRecordCard[]>([])
  const [chatTextInput, setChatTextInput] = useState('')
  const [chatSource, setChatSource] = useState('wechat')
  const [showChatInput, setShowChatInput] = useState(false)
  const [chatUploading, setChatUploading] = useState(false)

  // 能量预览
  const [energyPreview, setEnergyPreview] = useState<{
    totalEnergy: number
    activeBoosters: string[]
    bonusEnergy: number
  } | null>(null)
  const [energyLoading, setEnergyLoading] = useState(false)

  // 是否展示聊天记录上传区域（聊天/消息/通话/视频类型时展示）
  const showChatUpload = ['chat', 'message', 'call', 'video'].includes(interactionType)

  // 初始化：从路由参数读取 type
  useEffect(() => {
    const type = router.params.type as InteractionType
    if (type && INTERACTION_TYPES.some(t => t.type === type)) {
      setInteractionType(type)
    }
  }, [router.params.type])

  // 获取当前选中的类型配置
  const currentType = INTERACTION_TYPES.find(t => t.type === interactionType) || INTERACTION_TYPES[0]
  const TypeIcon = currentType.icon

  // 自动推断互动分类
  const interactionCategory = currentType.category

  // 获取实际时长
  const actualDuration = showCustomDuration && customDuration
    ? parseInt(customDuration, 10) || null
    : durationMinutes

  // 能量预览请求
  useEffect(() => {
    if (!matchId) return
    let cancelled = false
    const fetchPreview = async () => {
      setEnergyLoading(true)
      try {
        const res = await Network.request({
          url: `/api/interaction/match/${matchId}/energy/preview`,
          method: 'POST',
          data: {
            interactionType,
            mood,
            breakthrough: !!breakthroughMoment,
            duration: actualDuration || undefined,
          },
        })
        console.log('Energy preview response:', res.data)
        if (!cancelled && res.data?.code === 200 && res.data?.data) {
          setEnergyPreview({
            totalEnergy: res.data.data.totalEnergy,
            activeBoosters: res.data.data.activeBoosters || [],
            bonusEnergy: res.data.data.bonusEnergy || 0,
          })
        }
      } catch {
        // 预览失败静默处理
      } finally {
        if (!cancelled) setEnergyLoading(false)
      }
    }
    fetchPreview()
    return () => { cancelled = true }
  }, [matchId, interactionType, mood, breakthroughMoment, actualDuration])

  // 切换类型时重置活动标签和聊天记录输入
  useEffect(() => {
    setActivities([])
    setShowChatInput(false)
    setChatTextInput('')
  }, [interactionType])

  // 活动标签切换
  const toggleActivity = (tag: string) => {
    setActivities(prev =>
      prev.includes(tag) ? prev.filter(a => a !== tag) : [...prev, tag]
    )
  }

  // ========== 聊天记录相关操作 ==========

  // 上传聊天文本
  const handleUploadChatText = useCallback(async () => {
    if (!chatTextInput.trim()) {
      Taro.showToast({ title: '请输入聊天内容', icon: 'none' })
      return
    }
    setChatUploading(true)
    try {
      const res = await Network.request({
        url: `/api/chat-record/match/${matchId}/text`,
        method: 'POST',
        data: {
          contentType: 'text',
          rawContent: chatTextInput,
          source: chatSource,
        },
      })
      console.log('Upload chat text response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setChatRecords(prev => [...prev, {
          id: res.data.data.id,
          contentType: 'text',
          rawContent: chatTextInput,
          source: chatSource,
          summary: res.data.data.summary,
          imageKey: null,
          uploading: false,
        }])
        setChatTextInput('')
        setShowChatInput(false)
        Taro.showToast({ title: '聊天记录已添加', icon: 'success' })
      } else {
        Taro.showToast({ title: res.data?.message || '添加失败', icon: 'none' })
      }
    } catch (error) {
      console.error('Upload chat text error:', error)
      Taro.showToast({ title: '添加失败', icon: 'error' })
    } finally {
      setChatUploading(false)
    }
  }, [matchId, chatTextInput, chatSource])

  // 上传聊天截图
  const handleUploadChatImage = useCallback(async () => {
    try {
      const chooseRes = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })

      const tempFilePath = chooseRes.tempFilePaths[0]
      console.log('Selected chat image:', tempFilePath)

      // 先在列表中添加一个上传中的占位
      const tempId = -Date.now()
      setChatRecords(prev => [...prev, {
        id: tempId,
        contentType: 'image',
        rawContent: null,
        source: chatSource,
        summary: null,
        imageKey: null,
        uploading: true,
      }])

      const uploadRes = await Network.uploadFile({
        url: `/api/chat-record/match/${matchId}/image`,
        filePath: tempFilePath,
        name: 'file',
        formData: {
          source: chatSource,
          contentType: 'image',
        },
      })

      console.log('Upload chat image response:', uploadRes.data)

      // 解析返回数据
      let result = uploadRes.data
      if (typeof result === 'string') {
        try { result = JSON.parse(result) } catch { /* ignore */ }
      }

      if (result?.code === 200 && result?.data) {
        setChatRecords(prev => prev.map(r =>
          r.id === tempId
            ? {
                id: result.data.id,
                contentType: 'image' as const,
                rawContent: result.data.rawContent,
                source: chatSource,
                summary: result.data.summary,
                imageKey: result.data.imageKey,
                uploading: false,
              }
            : r
        ))
        Taro.showToast({ title: '聊天截图已添加', icon: 'success' })
      } else {
        // 移除占位
        setChatRecords(prev => prev.filter(r => r.id !== tempId))
        Taro.showToast({ title: result?.message || '上传失败', icon: 'none' })
      }
    } catch (error) {
      console.error('Upload chat image error:', error)
      // 移除可能的占位
      setChatRecords(prev => prev.filter(r => r.id > 0))
      Taro.showToast({ title: '选择图片失败', icon: 'none' })
    }
  }, [matchId, chatSource])

  // 删除聊天记录
  const handleDeleteChatRecord = useCallback((recordId: number) => {
    setChatRecords(prev => prev.filter(r => r.id !== recordId))
    // 也调用后端删除
    Network.request({
      url: `/api/chat-record/${recordId}`,
      method: 'DELETE',
    }).catch(err => console.error('Delete chat record error:', err))
  }, [])

  // ========== 提交表单 ==========
  const handleSubmit = useCallback(async () => {
    if (!matchId) {
      Taro.showToast({ title: '参数错误', icon: 'error' })
      return
    }

    // 校验：至少填写互动内容或详细描述
    if (!title && !description) {
      Taro.showToast({ title: '请输入互动内容或详细描述', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const chatRecordIds = chatRecords.map(r => r.id).filter(id => id > 0)

      const payload = {
        interactionType,
        interactionCategory,
        startedAt: startedAt.toISOString(),
        durationMinutes: actualDuration,
        initiator,
        location: location || null,
        title: title || null,
        description: description || null,
        activities: activities.length > 0 ? activities : undefined,
        mood,
        breakthroughMoment: breakthroughMoment || null,
        chatRecordIds: chatRecordIds.length > 0 ? chatRecordIds : undefined,
      }

      console.log('Create interaction payload:', payload)

      const res = await Network.request({
        url: `/api/interaction/match/${matchId}`,
        method: 'POST',
        data: payload,
      })

      console.log('Create interaction response:', res.data)

      if (res.data?.code === 200) {
        Taro.showToast({ title: '记录成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({ title: res.data?.message || res.data?.msg || '创建失败', icon: 'error' })
      }
    } catch (error) {
      console.error('Create interaction error:', error)
      Taro.showToast({ title: '创建失败', icon: 'error' })
    } finally {
      setSubmitting(false)
    }
  }, [matchId, interactionType, interactionCategory, startedAt, actualDuration, initiator, location, title, description, activities, mood, breakthroughMoment, chatRecords])

  return (
    <View className="min-h-screen bg-gray-50" style={{ paddingBottom: '100px' }}>
      <CustomHeader title="记录互动" />

      {/* 互动类型选择 - ScrollView 横向滚动 */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <ScrollView scrollX className="flex flex-row gap-2" style={{ whiteSpace: 'nowrap' }}>
          {INTERACTION_TYPES.map(item => {
            const IconComponent = item.icon
            const isActive = interactionType === item.type
            return (
              <View
                key={item.type}
                className={`flex-shrink-0 flex flex-col items-center justify-center px-4 py-3 rounded-xl border-2 ${
                  isActive
                    ? `${item.bgColor} border-current`
                    : 'bg-gray-50 border-gray-100'
                }`}
                style={{ borderColor: isActive ? item.color : undefined, minWidth: '72px', display: 'inline-flex', verticalAlign: 'top' }}
                onClick={() => setInteractionType(item.type)}
              >
                <View className="mb-1">
                  <IconComponent size={20} color={isActive ? item.color : '#9CA3AF'} />
                </View>
                <Text
                  className="block text-xs font-medium"
                  style={{ color: isActive ? item.color : '#6B7280' }}
                >
                  {item.label}
                </Text>
              </View>
            )
          })}
        </ScrollView>
      </View>

      {/* 主要信息卡片 */}
      <View className="p-4">
        <Card className="border border-gray-100">
          <CardContent className="p-4">
            {/* 时间选择 */}
            <View className="flex items-center gap-3 pb-4 border-b border-gray-100" onClick={() => setShowTimePicker(true)}>
              <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Clock size={18} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text className="block text-xs text-gray-400 mb-1">互动时间</Text>
                <Text className="block text-sm font-medium text-gray-900">{formatDisplayDate(startedAt)}</Text>
              </View>
              <Text className="block text-xs text-indigo-500">修改</Text>
            </View>
            {showTimePicker && (
              <Picker
                mode="date"
                value={startedAt.toISOString().split('T')[0]}
                onChange={e => {
                  const d = new Date(e.detail.value)
                  d.setHours(startedAt.getHours(), startedAt.getMinutes())
                  setStartedAt(d)
                }}
              >
                <View className="py-2 px-3 bg-gray-50 rounded-lg mt-2">
                  <Text className="block text-xs text-gray-500">选择日期</Text>
                </View>
              </Picker>
            )}
            {showTimePicker && (
              <Picker
                mode="time"
                value={`${String(startedAt.getHours()).padStart(2, '0')}:${String(startedAt.getMinutes()).padStart(2, '0')}`}
                onChange={e => {
                  const [h, m] = (e.detail.value as string).split(':').map(Number)
                  const d = new Date(startedAt)
                  d.setHours(h, m)
                  setStartedAt(d)
                }}
              >
                <View className="py-2 px-3 bg-gray-50 rounded-lg mt-2">
                  <Text className="block text-xs text-gray-500">选择时间</Text>
                </View>
              </Picker>
            )}

            {/* 时长选择 */}
            <View className="pt-4 pb-4 border-b border-gray-100">
              <View className="flex items-center gap-3 mb-3">
                <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Calendar size={18} color="#6B7280" />
                </View>
                <Text className="block text-sm font-medium text-gray-700">持续时长</Text>
              </View>
              <View className="flex flex-row flex-wrap gap-2" style={{ marginLeft: '52px' }}>
                {DURATION_OPTIONS.map(opt => (
                  <View
                    key={opt.value}
                    className={`px-3 py-2 rounded-lg ${
                      !showCustomDuration && durationMinutes === opt.value
                        ? 'bg-black'
                        : 'bg-gray-100'
                    }`}
                    onClick={() => {
                      setDurationMinutes(opt.value)
                      setShowCustomDuration(false)
                    }}
                  >
                    <Text className={`block text-xs ${!showCustomDuration && durationMinutes === opt.value ? 'text-white' : 'text-gray-600'}`}>
                      {opt.label}
                    </Text>
                  </View>
                ))}
                {/* 自定义时长 */}
                <View
                  className={`px-3 py-2 rounded-lg ${showCustomDuration ? 'bg-black' : 'bg-gray-100'}`}
                  onClick={() => setShowCustomDuration(!showCustomDuration)}
                >
                  <Text className={`block text-xs ${showCustomDuration ? 'text-white' : 'text-gray-600'}`}>
                    自定义
                  </Text>
                </View>
              </View>
              {showCustomDuration && (
                <View className="mt-2" style={{ marginLeft: '52px' }}>
                  <View className="bg-gray-50 rounded-lg px-3 py-2" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <Input
                      style={{ width: '60px', fontSize: '14px', backgroundColor: 'transparent' }}
                      type="number"
                      placeholder="60"
                      value={customDuration}
                      onInput={e => setCustomDuration(e.detail.value)}
                    />
                    <Text className="block text-xs text-gray-500 ml-1">分钟</Text>
                  </View>
                </View>
              )}
            </View>

            {/* 发起方选择 */}
            <View className="pt-4 pb-4 border-b border-gray-100">
              <View className="flex items-center gap-3 mb-3">
                <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={18} color="#6B7280" />
                </View>
                <Text className="block text-sm font-medium text-gray-700">谁发起的</Text>
              </View>
              <View className="flex flex-row gap-2" style={{ marginLeft: '52px' }}>
                {INITIATOR_OPTIONS.map(opt => {
                  const IconComponent = opt.icon
                  const isActive = initiator === opt.value
                  return (
                    <View
                      key={opt.value}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${
                        isActive ? 'bg-black' : 'bg-gray-100'
                      }`}
                      onClick={() => setInitiator(opt.value)}
                    >
                      <IconComponent size={14} color={isActive ? '#fff' : '#6B7280'} />
                      <Text className={`block text-xs ${isActive ? 'text-white' : 'text-gray-600'}`}>
                        {opt.label}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>

            {/* 地点（约会/社交时显示） */}
            {(interactionType === 'date' || interactionType === 'social') && (
              <View className="pt-4 pb-4 border-b border-gray-100">
                <View className="flex items-center gap-3 mb-3">
                  <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <MapPin size={18} color="#6B7280" />
                  </View>
                  <Text className="block text-sm font-medium text-gray-700">地点</Text>
                </View>
                <View style={{ marginLeft: '52px' }}>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input
                      style={{ width: '100%', fontSize: '14px', backgroundColor: 'transparent' }}
                      placeholder="在哪里呢..."
                      value={location}
                      onInput={e => setLocation(e.detail.value)}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* 活动标签 */}
            {ACTIVITY_PRESETS[interactionType]?.length > 0 && (
              <View className="pt-4 pb-4 border-b border-gray-100">
                <View className="flex items-center gap-3 mb-3">
                  <View
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${currentType.color}15` }}
                  >
                    <Plus size={18} color={currentType.color} />
                  </View>
                  <Text className="block text-sm font-medium text-gray-700">活动内容</Text>
                </View>
                <View className="flex flex-row flex-wrap gap-2" style={{ marginLeft: '52px' }}>
                  {ACTIVITY_PRESETS[interactionType].map(tag => {
                    const isActive = activities.includes(tag)
                    return (
                      <View
                        key={tag}
                        className={`px-3 py-2 rounded-full border ${
                          isActive ? 'bg-gray-900 border-gray-900' : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => toggleActivity(tag)}
                      >
                        <Text className={`block text-xs ${isActive ? 'text-white' : 'text-gray-600'}`}>
                          {isActive ? '✓ ' : ''}{tag}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            )}

            {/* 标题/主题 */}
            <View className="pt-4">
              <View className="flex items-center gap-3 mb-3">
                <View
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${currentType.color}15` }}
                >
                  <TypeIcon size={18} color={currentType.color} />
                </View>
                <Text className="block text-sm font-medium text-gray-700">
                  {interactionType === 'date' ? '约会主题' : '互动内容'}
                </Text>
              </View>
              <View style={{ marginLeft: '52px' }}>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    style={{ width: '100%', fontSize: '14px', backgroundColor: 'transparent' }}
                    placeholder={interactionType === 'date' ? '给这次约会起个名字...' : '简单描述一下...'}
                    value={title}
                    onInput={e => setTitle(e.detail.value)}
                  />
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 聊天记录上传区域（仅在线互动类型时展示） */}
      {showChatUpload && (
        <View className="px-4 pb-4">
          <Card className="border border-blue-100" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)' }}>
            <CardContent className="p-4">
              <View className="flex items-center gap-3 mb-3">
                <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Paperclip size={18} color="#3B82F6" />
                </View>
                <Text className="block text-sm font-medium text-gray-700">聊天记录</Text>
                <Text className="block text-xs text-gray-400">可选，上传后可供 AI 分析</Text>
              </View>

              {/* 已上传的聊天记录列表 */}
              {chatRecords.length > 0 && (
                <View className="mb-3" style={{ marginLeft: '52px' }}>
                  {chatRecords.map(record => (
                    <View
                      key={record.id}
                      className="flex items-center gap-2 p-3 rounded-xl mb-2"
                      style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                    >
                      {record.contentType === 'image' ? (
                        <Image size={16} color="#3B82F6" />
                      ) : (
                        <MessageCircle size={16} color="#3B82F6" />
                      )}
                      <View className="flex-1" style={{ flex: 1, minWidth: 0 }}>
                        {record.uploading ? (
                          <Text className="block text-xs text-gray-400">上传中...</Text>
                        ) : (
                          <>
                            <Text className="block text-xs text-gray-700 font-medium">
                              {record.contentType === 'image' ? '聊天截图' : '聊天文本'}
                              <Text className="text-gray-400 font-normal"> · {CHAT_SOURCE_OPTIONS.find(s => s.value === record.source)?.label || record.source}</Text>
                            </Text>
                            {record.summary ? (
                              <Text className="block text-xs text-gray-400 mt-1" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {record.summary}
                              </Text>
                            ) : record.rawContent ? (
                              <Text className="block text-xs text-gray-400 mt-1" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {record.rawContent.slice(0, 50)}...
                              </Text>
                            ) : null}
                          </>
                        )}
                      </View>
                      {!record.uploading && (
                        <View onClick={() => handleDeleteChatRecord(record.id)} className="p-1">
                          <X size={14} color="#9CA3AF" />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* 来源选择 */}
              <View className="mb-3" style={{ marginLeft: '52px' }}>
                <Text className="block text-xs text-gray-500 mb-2">聊天来源</Text>
                <View className="flex flex-row flex-wrap gap-2">
                  {CHAT_SOURCE_OPTIONS.map(opt => (
                    <View
                      key={opt.value}
                      className={`px-3 py-2 rounded-lg ${chatSource === opt.value ? 'bg-blue-500' : 'bg-white border border-gray-200'}`}
                      onClick={() => setChatSource(opt.value)}
                    >
                      <Text className={`block text-xs ${chatSource === opt.value ? 'text-white' : 'text-gray-600'}`}>
                        {opt.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 操作按钮 */}
              <View style={{ marginLeft: '52px' }}>
                <View className="flex flex-row gap-2">
                  <View
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-blue-200"
                    onClick={() => setShowChatInput(!showChatInput)}
                  >
                    <MessageCircle size={14} color="#3B82F6" />
                    <Text className="block text-xs text-blue-600 font-medium">粘贴文字</Text>
                  </View>
                  <View
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-blue-200"
                    onClick={handleUploadChatImage}
                  >
                    <Upload size={14} color="#3B82F6" />
                    <Text className="block text-xs text-blue-600 font-medium">上传截图</Text>
                  </View>
                </View>
              </View>

              {/* 文本输入区域 */}
              {showChatInput && (
                <View className="mt-3" style={{ marginLeft: '52px' }}>
                  <View className="bg-white rounded-xl p-3 border border-blue-100">
                    <Textarea
                      style={{ width: '100%', minHeight: '120px', fontSize: '13px', backgroundColor: 'transparent' }}
                      placeholder="粘贴聊天记录，格式示例：&#10;我: 你今天怎么样？&#10;她: 还不错呀，刚下班~&#10;我: 辛苦啦，要不要一起吃饭？"
                      value={chatTextInput}
                      onInput={e => setChatTextInput(e.detail.value)}
                    />
                    <View className="flex items-center justify-between mt-2">
                      <Text className="block text-xs text-gray-400">{chatTextInput.length} 字</Text>
                      <Button
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                        onClick={handleUploadChatText}
                        disabled={chatUploading || !chatTextInput.trim()}
                      >
                        <Text className="block text-xs text-white font-medium">
                          {chatUploading ? '添加中...' : '添加'}
                        </Text>
                      </Button>
                    </View>
                  </View>
                </View>
              )}
            </CardContent>
          </Card>
        </View>
      )}

      {/* 心情评价 + 能量预览 */}
      <View className="px-4 pb-4">
        <Card className="border border-gray-100">
          <CardContent className="p-4">
            <View className="flex items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Sparkles size={18} color="#F59E0B" />
              </View>
              <Text className="block text-sm font-medium text-gray-700">这次感觉怎么样？</Text>
            </View>

            <View className="flex flex-row gap-2">
              {MOOD_OPTIONS.map(opt => {
                const isActive = mood === opt.value
                return (
                  <View
                    key={opt.value}
                    className={`relative flex-1 flex flex-col items-center py-3 rounded-xl border-2 ${
                      isActive ? opt.color : 'bg-gray-50 border-gray-100'
                    }`}
                    onClick={() => setMood(opt.value)}
                  >
                    {isActive && (
                      <View style={{ position: 'absolute', top: '4px', right: '4px' }}>
                        <Check size={12} color="#10B981" />
                      </View>
                    )}
                    <Text className="block text-xl mb-1">{opt.emoji}</Text>
                    <Text className={`block text-xs ${isActive ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                      {opt.label}
                    </Text>
                  </View>
                )
              })}
            </View>

            {/* 能量预览条 */}
            {energyPreview && (
              <View className="mt-4 flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
                <Zap size={16} color="#10B981" />
                <Text className="block text-xs text-emerald-700 font-medium">
                  预计获得 {energyPreview.totalEnergy} 能量
                </Text>
                {energyPreview.bonusEnergy > 0 && (
                  <Text className="block text-xs text-emerald-500">
                    (+{energyPreview.bonusEnergy} 加成)
                  </Text>
                )}
                {energyLoading && (
                  <Text className="block text-xs text-gray-400">计算中...</Text>
                )}
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 详细描述 */}
      <View className="px-4 pb-4">
        <Card className="border border-gray-100">
          <CardContent className="p-4">
            <Text className="block text-sm font-medium text-gray-700 mb-3">详细记录</Text>
            <View className="bg-gray-50 rounded-xl p-3">
              <Textarea
                style={{ width: '100%', minHeight: '80px', fontSize: '14px', backgroundColor: 'transparent' }}
                placeholder="记录这次互动的细节、感受、有趣的对话..."
                value={description}
                onInput={e => setDescription(e.detail.value)}
              />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 突破性时刻 */}
      <View className="px-4 pb-4">
        <Card className="border border-amber-200" style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FFF7ED 100%)' }}>
          <CardContent className="p-4">
            <View className="flex items-center gap-2 mb-3">
              <Text className="block text-base">✨</Text>
              <Text className="block text-sm font-medium text-gray-700">突破性时刻</Text>
            </View>
            <View className="rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}>
              <Textarea
                style={{ width: '100%', minHeight: '60px', fontSize: '14px', backgroundColor: 'transparent' }}
                placeholder="有没有什么特别的进展？比如第一次牵手、第一次说喜欢..."
                value={breakthroughMoment}
                onInput={e => setBreakthroughMoment(e.detail.value)}
              />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部提交按钮 */}
      <View
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          display: 'flex', flexDirection: 'row',
          padding: '12px 16px', backgroundColor: '#fff',
          borderTop: '1px solid #f3f4f6', zIndex: 100,
        }}
      >
        <Button
          className="w-full bg-black text-white py-3 rounded-xl"
          onClick={handleSubmit}
          disabled={submitting}
        >
          <Text className="block text-base font-medium text-white">
            {submitting ? '保存中...' : '保存记录'}
          </Text>
        </Button>
      </View>
    </View>
  )
}
