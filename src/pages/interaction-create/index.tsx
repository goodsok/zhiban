import { View, Text } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Calendar, MessageCircle, Phone, Video, Gift, Heart, Users, MapPin } from 'lucide-react-taro'
import './index.css'

// 互动类型
type InteractionType = 'date' | 'chat' | 'call' | 'video' | 'message' | 'gift' | 'physical' | 'social' | 'other'
type Mood = 'excellent' | 'good' | 'neutral' | 'awkward' | 'bad'

// 互动类型配置
const INTERACTION_TYPES: Array<{
  type: InteractionType
  label: string
  icon: typeof Calendar
  color: string
}> = [
  { type: 'date', label: '约会', icon: Calendar, color: '#EC4899' },
  { type: 'chat', label: '聊天', icon: MessageCircle, color: '#3B82F6' },
  { type: 'call', label: '通话', icon: Phone, color: '#10B981' },
  { type: 'video', label: '视频', icon: Video, color: '#8B5CF6' },
  { type: 'message', label: '消息', icon: MessageCircle, color: '#F59E0B' },
  { type: 'gift', label: '礼物', icon: Gift, color: '#EF4444' },
  { type: 'physical', label: '亲密', icon: Heart, color: '#EC4899' },
  { type: 'social', label: '社交', icon: Users, color: '#06B6D4' },
]

// 心情选项
const MOOD_OPTIONS: Array<{ value: Mood; label: string; emoji: string }> = [
  { value: 'excellent', label: '非常愉快', emoji: '😄' },
  { value: 'good', label: '比较愉快', emoji: '😊' },
  { value: 'neutral', label: '一般', emoji: '😐' },
  { value: 'awkward', label: '有点尴尬', emoji: '😅' },
  { value: 'bad', label: '不太愉快', emoji: '😞' },
]

// 发起方选项
const INITIATOR_OPTIONS = [
  { value: 'self', label: '我主动' },
  { value: 'partner', label: '对方主动' },
  { value: 'mutual', label: '一起决定的' },
]

export default function InteractionCreatePage() {
  const router = useRouter()
  const matchId = Number(router.params.matchId)

  const [submitting, setSubmitting] = useState(false)

  // 表单状态
  const [formData, setFormData] = useState({
    interactionType: 'date' as InteractionType,
    startedAt: new Date().toISOString().slice(0, 16),
    durationMinutes: '',
    initiator: 'mutual' as 'self' | 'partner' | 'mutual',
    location: '',
    title: '',
    description: '',
    mood: 'good' as Mood,
    breakthroughMoment: '',
  })

  useLoad(() => {
    // 可以从上一个页面获取默认类型
    const type = router.params.type as InteractionType
    if (type) {
      setFormData(prev => ({ ...prev, interactionType: type }))
    }
  })

  // 提交表单
  const handleSubmit = useCallback(async () => {
    if (!matchId) {
      Taro.showToast({ title: '参数错误', icon: 'error' })
      return
    }

    if (!formData.title && formData.interactionType === 'date') {
      Taro.showToast({ title: '请输入约会标题', icon: 'error' })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        interactionType: formData.interactionType,
        startedAt: formData.startedAt ? new Date(formData.startedAt).toISOString() : new Date().toISOString(),
        durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
        initiator: formData.initiator,
        location: formData.location || null,
        title: formData.title || null,
        description: formData.description || null,
        mood: formData.mood,
        breakthroughMoment: formData.breakthroughMoment || null,
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
  }, [matchId, formData])

  return (
    <View className="interaction-create-page">
      {/* 互动类型选择 */}
      <View className="section">
        <View className="section-title">互动类型</View>
        <View className="type-grid">
          {INTERACTION_TYPES.map(item => {
            const IconComponent = item.icon
            const isActive = formData.interactionType === item.type
            return (
              <View
                key={item.type}
                className={`type-card ${isActive ? 'active' : ''}`}
                style={{ borderColor: isActive ? item.color : '#e5e7eb' }}
                onClick={() => setFormData(prev => ({ ...prev, interactionType: item.type }))}
              >
                <View className="type-icon" style={{ backgroundColor: `${item.color}20` }}>
                  <IconComponent size={24} color={item.color} />
                </View>
                <Text className="block type-label">{item.label}</Text>
              </View>
            )
          })}
        </View>
      </View>

      {/* 基本信息 */}
      <View className="section">
        <View className="section-title">基本信息</View>

        <View className="form-item">
          <View className="form-label">时间</View>
          <input
            className="form-input"
            type="datetime-local"
            value={formData.startedAt}
            onInput={e => setFormData(prev => ({ ...prev, startedAt: (e as any).detail.value }))}
          />
        </View>

        <View className="form-item">
          <View className="form-label">时长（分钟）</View>
          <input
            className="form-input"
            type="number"
            placeholder="如: 120"
            value={formData.durationMinutes}
            onInput={e => setFormData(prev => ({ ...prev, durationMinutes: (e as any).detail.value }))}
          />
        </View>

        <View className="form-item">
          <View className="form-label">发起方</View>
          <View className="option-group">
            {INITIATOR_OPTIONS.map(opt => (
              <View
                key={opt.value}
                className={`option-item ${formData.initiator === opt.value ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, initiator: opt.value as typeof formData.initiator }))}
              >
                {opt.label}
              </View>
            ))}
          </View>
        </View>

        {(formData.interactionType === 'date' || formData.interactionType === 'social') && (
          <View className="form-item">
            <View className="form-label">地点</View>
            <View className="input-with-icon">
              <MapPin size={18} color="#9ca3af" />
              <input
                className="form-input"
                type="text"
                placeholder="如: 某某餐厅"
                value={formData.location}
                onInput={e => setFormData(prev => ({ ...prev, location: (e as any).detail.value }))}
              />
            </View>
          </View>
        )}

        <View className="form-item">
          <View className="form-label">标题/主题</View>
          <input
            className="form-input"
            type="text"
            placeholder="给这次互动起个名字吧"
            value={formData.title}
            onInput={e => setFormData(prev => ({ ...prev, title: (e as any).detail.value }))}
          />
        </View>
      </View>

      {/* 感受评价 */}
      <View className="section">
        <View className="section-title">感受评价</View>

        <View className="form-item">
          <View className="form-label">这次互动感觉如何？</View>
          <View className="mood-grid">
            {MOOD_OPTIONS.map(opt => (
              <View
                key={opt.value}
                className={`mood-item ${formData.mood === opt.value ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, mood: opt.value }))}
              >
                <Text className="block mood-emoji">{opt.emoji}</Text>
                <Text className="block mood-label">{opt.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="form-item">
          <View className="form-label">详细描述</View>
          <textarea
            className="form-textarea"
            placeholder="记录一下这次互动的细节、感受、收获..."
            value={formData.description}
            onInput={e => setFormData(prev => ({ ...prev, description: (e as any).detail.value }))}
          />
        </View>

        <View className="form-item">
          <View className="form-label">突破性时刻 💫</View>
          <textarea
            className="form-textarea"
            placeholder="有没有什么特别的进展或突破？"
            value={formData.breakthroughMoment}
            onInput={e => setFormData(prev => ({ ...prev, breakthroughMoment: (e as any).detail.value }))}
          />
        </View>
      </View>

      {/* 提交按钮 */}
      <View className="submit-section">
        <Button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '保存中...' : '保存记录'}
        </Button>
      </View>
    </View>
  )
}
