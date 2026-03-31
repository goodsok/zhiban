import { View, Text } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import CustomHeader from '@/components/custom-header'
import { 
  Calendar, MessageCircle, Phone, Video, Gift, Heart, Users, MapPin, 
  Clock, User, Sparkles, Check
} from 'lucide-react-taro'

// 互动类型
type InteractionType = 'date' | 'chat' | 'call' | 'video' | 'message' | 'gift' | 'physical' | 'social' | 'other'
type Mood = 'excellent' | 'good' | 'neutral' | 'awkward' | 'bad'
type Initiator = 'self' | 'partner' | 'mutual'

// 互动类型配置
const INTERACTION_TYPES: Array<{
  type: InteractionType
  label: string
  icon: typeof Calendar
  color: string
  bgColor: string
}> = [
  { type: 'date', label: '约会', icon: Calendar, color: '#EC4899', bgColor: 'bg-pink-50' },
  { type: 'chat', label: '聊天', icon: MessageCircle, color: '#3B82F6', bgColor: 'bg-blue-50' },
  { type: 'call', label: '通话', icon: Phone, color: '#10B981', bgColor: 'bg-emerald-50' },
  { type: 'video', label: '视频', icon: Video, color: '#8B5CF6', bgColor: 'bg-violet-50' },
  { type: 'message', label: '消息', icon: MessageCircle, color: '#F59E0B', bgColor: 'bg-amber-50' },
  { type: 'gift', label: '礼物', icon: Gift, color: '#EF4444', bgColor: 'bg-red-50' },
  { type: 'physical', label: '亲密', icon: Heart, color: '#EC4899', bgColor: 'bg-rose-50' },
  { type: 'social', label: '社交', icon: Users, color: '#06B6D4', bgColor: 'bg-cyan-50' },
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

export default function InteractionCreatePage() {
  const router = useRouter()
  const matchId = Number(router.params.matchId)

  const [submitting, setSubmitting] = useState(false)

  // 表单状态
  const [interactionType, setInteractionType] = useState<InteractionType>('date')
  const [startedAt] = useState(new Date().toLocaleString('zh-CN'))
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [initiator, setInitiator] = useState<Initiator>('mutual')
  const [location, setLocation] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mood, setMood] = useState<Mood>('good')
  const [breakthroughMoment, setBreakthroughMoment] = useState('')

  useLoad(() => {
    const type = router.params.type as InteractionType
    if (type) {
      setInteractionType(type)
    }
  })

  // 提交表单
  const handleSubmit = useCallback(async () => {
    if (!matchId) {
      Taro.showToast({ title: '参数错误', icon: 'error' })
      return
    }

    if (!title && interactionType === 'date') {
      Taro.showToast({ title: '请输入约会标题', icon: 'error' })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        interactionType,
        startedAt: new Date().toISOString(),
        durationMinutes,
        initiator,
        location: location || null,
        title: title || null,
        description: description || null,
        mood,
        breakthroughMoment: breakthroughMoment || null,
      }

      console.log('Create interaction payload:', payload)

      const res = await Network.request({
        url: `/api/interaction/match/${matchId}`,
        method: 'POST',
        data: payload,
      })

      console.log('Create interaction response:', res.data)

      if (res.data.code === 200) {
        Taro.showToast({ title: '记录成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({ title: res.data.msg || '创建失败', icon: 'error' })
      }
    } catch (error) {
      console.error('Create interaction error:', error)
      Taro.showToast({ title: '创建失败', icon: 'error' })
    } finally {
      setSubmitting(false)
    }
  }, [matchId, interactionType, durationMinutes, initiator, location, title, description, mood, breakthroughMoment])

  // 当前选中的类型配置
  const currentType = INTERACTION_TYPES.find(t => t.type === interactionType) || INTERACTION_TYPES[0]

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      <CustomHeader title="记录互动" />

      {/* 互动类型选择 - 横向滚动 */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex flex-row gap-2 overflow-x-auto" style={{ overflowX: 'scroll' }}>
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
                style={{ borderColor: isActive ? item.color : undefined, minWidth: '72px' }}
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
        </View>
      </View>

      {/* 主要信息卡片 */}
      <View className="p-4">
        <Card className="border border-gray-100">
          <CardContent className="p-4">
            {/* 时间显示 */}
            <View className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Clock size={18} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text className="block text-xs text-gray-400 mb-1">互动时间</Text>
                <Text className="block text-sm font-medium text-gray-900">{startedAt}</Text>
              </View>
            </View>

            {/* 时长选择 */}
            <View className="pt-4 pb-4 border-b border-gray-100">
              <View className="flex items-center gap-3 mb-3">
                <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Calendar size={18} color="#6B7280" />
                </View>
                <Text className="block text-sm font-medium text-gray-700">持续时长</Text>
              </View>
              <View className="flex flex-row flex-wrap gap-2 ml-13">
                {DURATION_OPTIONS.map(opt => (
                  <View
                    key={opt.value}
                    className={`px-3 py-2 rounded-lg text-xs ${
                      durationMinutes === opt.value 
                        ? 'bg-black text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    onClick={() => setDurationMinutes(opt.value)}
                  >
                    <Text className="block">{opt.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 发起方选择 */}
            <View className="pt-4 pb-4 border-b border-gray-100">
              <View className="flex items-center gap-3 mb-3">
                <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={18} color="#6B7280" />
                </View>
                <Text className="block text-sm font-medium text-gray-700">谁发起的</Text>
              </View>
              <View className="flex flex-row gap-2 ml-13">
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
                <View className="ml-13">
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input
                      className="w-full text-sm bg-transparent"
                      placeholder="在哪里呢..."
                      value={location}
                      onInput={e => setLocation(e.detail.value)}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* 标题/主题 */}
            <View className="pt-4">
              <View className="flex items-center gap-3 mb-3">
                <View 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${currentType.color}20` }}
                >
                  <currentType.icon size={18} color={currentType.color} />
                </View>
                <Text className="block text-sm font-medium text-gray-700">
                  {interactionType === 'date' ? '约会主题' : '互动内容'}
                </Text>
              </View>
              <View className="ml-13">
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="w-full text-sm bg-transparent"
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

      {/* 心情评价 */}
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
                    className={`flex-1 flex flex-col items-center py-3 rounded-xl border-2 ${
                      isActive ? opt.color : 'bg-gray-50 border-gray-100'
                    }`}
                    onClick={() => setMood(opt.value)}
                  >
                    <Text className="block text-xl mb-1">{opt.emoji}</Text>
                    <Text className={`block text-xs ${isActive ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                      {opt.label}
                    </Text>
                    {isActive && (
                      <View className="absolute top-1 right-1">
                        <Check size={12} color="#10B981" />
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
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
                className="w-full text-sm bg-transparent"
                placeholder="记录这次互动的细节、感受、有趣的对话..."
                value={description}
                onInput={e => setDescription(e.detail.value)}
                style={{ minHeight: '80px' }}
              />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 突破性时刻 */}
      <View className="px-4 pb-4">
        <Card className="border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <View className="flex items-center gap-2 mb-3">
              <Text className="block text-base">✨</Text>
              <Text className="block text-sm font-medium text-gray-700">突破性时刻</Text>
            </View>
            <View className="bg-white bg-opacity-60 rounded-xl p-3">
              <Textarea
                className="w-full text-sm bg-transparent"
                placeholder="有没有什么特别的进展？比如第一次牵手、第一次说喜欢..."
                value={breakthroughMoment}
                onInput={e => setBreakthroughMoment(e.detail.value)}
                style={{ minHeight: '60px' }}
              />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部提交按钮 */}
      <View 
        className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
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
