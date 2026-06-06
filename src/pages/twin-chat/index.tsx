import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import { Network } from '@/network'
import { ArrowLeft, Send, Ghost, Trash2, Heart, Shield, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react-taro'
import { Input } from '@/components/ui/input'
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

// 消息类型
interface TwinMessage {
  id?: number
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

// 关系状态
interface RelationshipState {
  stage: string
  trust: number
  intimacy: number
  interaction_count: number
}

// 情感状态
interface EmotionalState {
  primary: string
  intensity: number
  towards_user: string
  reason: string | null
}

// 关系阶段中文映射
const STAGE_LABELS: Record<string, string> = {
  stranger: '陌生人',
  acquaintance: '认识的人',
  friend: '朋友',
  close: '好朋友',
  intimate: '暧昧中',
  partner: '在一起',
}

// 关系阶段列表（用于选择器）
const STAGE_OPTIONS = [
  { value: 'stranger', label: '陌生人' },
  { value: 'acquaintance', label: '认识的人' },
  { value: 'friend', label: '朋友' },
  { value: 'close', label: '好朋友' },
  { value: 'intimate', label: '暧昧中' },
  { value: 'partner', label: '在一起' },
]

// 情感状态中文映射+颜色
const EMOTION_CONFIG: Record<string, { label: string; color: string }> = {
  neutral: { label: '平静', color: '#71767B' },
  warm: { label: '温暖', color: '#F59E0B' },
  happy: { label: '开心', color: '#4ECB71' },
  touched: { label: '感动', color: '#EC4899' },
  anxious: { label: '不安', color: '#EF4444' },
  defensive: { label: '防备', color: '#8B5CF6' },
  hurt: { label: '受伤', color: '#DC2626' },
  cold: { label: '冷淡', color: '#6B7280' },
  playful: { label: '调皮', color: '#10B981' },
  longing: { label: '想念', color: '#F472B6' },
  slight_hurt: { label: '微微受伤', color: '#F97316' },
  embarrassed: { label: '害羞', color: '#FBBF24' },
}

// 情感选项列表
const EMOTION_OPTIONS = [
  { value: 'neutral', label: '平静' },
  { value: 'warm', label: '温暖' },
  { value: 'happy', label: '开心' },
  { value: 'touched', label: '感动' },
  { value: 'playful', label: '调皮' },
  { value: 'longing', label: '想念' },
  { value: 'anxious', label: '不安' },
  { value: 'defensive', label: '防备' },
  { value: 'hurt', label: '受伤' },
  { value: 'cold', label: '冷淡' },
  { value: 'slight_hurt', label: '微微受伤' },
  { value: 'embarrassed', label: '害羞' },
]

// 对方态度中文映射
const TOWARDS_LABELS: Record<string, string> = {
  neutral: '中立',
  curious: '好奇',
  fond: '有好感',
  attached: '依赖',
  guarded: '防备',
  resentful: '抗拒',
  longing: '想念',
}

// 对方态度选项
const TOWARDS_OPTIONS = [
  { value: 'neutral', label: '中立' },
  { value: 'curious', label: '好奇' },
  { value: 'fond', label: '有好感' },
  { value: 'attached', label: '依赖' },
  { value: 'guarded', label: '防备' },
  { value: 'resentful', label: '抗拒' },
  { value: 'longing', label: '想念' },
]

const TwinChatPage = () => {
  const router = Taro.useRouter()
  const matchId = Number(router.params.matchId) || 0
  const matchName = decodeURIComponent(router.params.matchName || 'TA')

  const [messages, setMessages] = useState<TwinMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [statusBarHeight, setStatusBarHeight] = useState(0)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)
  const [relationship, setRelationship] = useState<RelationshipState | null>(null)
  const [emotionalState, setEmotionalState] = useState<EmotionalState | null>(null)
  const [showStatusPanel, setShowStatusPanel] = useState(false)
  const [showAdjustPanel, setShowAdjustPanel] = useState(false)

  // 调整面板本地状态
  const [adjustStage, setAdjustStage] = useState('')
  const [adjustTrust, setAdjustTrust] = useState(30)
  const [adjustIntimacy, setAdjustIntimacy] = useState(0)
  const [adjustEmotion, setAdjustEmotion] = useState('neutral')
  const [adjustIntensity, setAdjustIntensity] = useState(50)
  const [adjustTowards, setAdjustTowards] = useState('neutral')
  const [saving, setSaving] = useState(false)

  // 获取状态栏高度
  useEffect(() => {
    const systemInfo = Taro.getSystemInfoSync()
    setStatusBarHeight(systemInfo.statusBarHeight || 0)
  }, [])

  // 同步 relationship → adjust 面板
  useEffect(() => {
    if (relationship) {
      setAdjustStage(relationship.stage)
      setAdjustTrust(relationship.trust)
      setAdjustIntimacy(relationship.intimacy)
    }
  }, [relationship])

  // 同步 emotionalState → adjust 面板
  useEffect(() => {
    if (emotionalState) {
      setAdjustEmotion(emotionalState.primary)
      setAdjustIntensity(emotionalState.intensity)
      setAdjustTowards(emotionalState.towards_user)
    }
  }, [emotionalState])

  // 加载聊天历史
  useEffect(() => {
    if (!matchId) return
    loadHistory()
  }, [matchId])

  // 消息变化时自动滚动
  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const loadHistory = async () => {
    try {
      setHistoryLoading(true)
      const res = await Network.request({
        url: '/api/twin/history',
        method: 'GET',
        data: { matchId, limit: 100 }
      })
      console.log('[TwinChat] loadHistory response:', res.data)
      const data = res.data?.data
      const history = data?.history || []
      setMessages(history.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at
      })))

      // 恢复关系和情感状态
      if (data?.relationship) {
        setRelationship(data.relationship)
      }
      if (data?.emotionalState) {
        setEmotionalState(data.emotionalState)
      }

      // 主动消息
      if (data?.proactiveMessages && data.proactiveMessages.length > 0) {
        for (const msg of data.proactiveMessages) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: msg,
            createdAt: new Date().toISOString()
          }])
        }
      }
    } catch (err) {
      console.error('[TwinChat] loadHistory error:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      setScrollTop(prev => prev + 999)
    }, 150)
  }, [])

  // 发送消息
  const sendMessage = async () => {
    const text = inputValue.trim()
    if (!text || loading) return

    const userMsg: TwinMessage = { role: 'user', content: text, createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setLoading(true)

    try {
      const res = await Network.request({
        url: '/api/twin/chat',
        method: 'POST',
        data: { matchId, message: text }
      })
      console.log('[TwinChat] sendMessage response:', res.data)
      const data = res.data?.data
      const reply = data?.reply || '...'
      setMessages(prev => [...prev, { role: 'assistant', content: reply, createdAt: new Date().toISOString() }])

      // 更新关系和情感状态
      if (data?.relationship) {
        setRelationship(data.relationship)
      }
      if (data?.emotionalState) {
        setEmotionalState(data.emotionalState)
      }

      // 主动消息
      if (data?.proactiveMessage) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.proactiveMessage,
            createdAt: new Date().toISOString()
          }])
        }, 2000)
      }
    } catch (err) {
      console.error('[TwinChat] sendMessage error:', err)
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，我暂时无法回复，请稍后再试~', createdAt: new Date().toISOString() }])
    } finally {
      setLoading(false)
    }
  }

  // 清空聊天记录
  const clearHistory = async () => {
    try {
      await Network.request({
        url: '/api/twin/history',
        method: 'DELETE',
        data: { matchId }
      })
      setMessages([])
      setRelationship(null)
      setEmotionalState(null)
    } catch (err) {
      console.error('[TwinChat] clearHistory error:', err)
    }
    setShowClearDialog(false)
  }

  // 保存手动调整的关系状态
  const saveAdjustment = async () => {
    setSaving(true)
    try {
      const res = await Network.request({
        url: '/api/twin/relationship',
        method: 'PATCH',
        data: {
          matchId,
          stage: adjustStage,
          trust: adjustTrust,
          intimacy: adjustIntimacy,
          emotionalPrimary: adjustEmotion,
          emotionalIntensity: adjustIntensity,
          emotionalTowardsUser: adjustTowards,
        }
      })
      console.log('[TwinChat] saveAdjustment response:', res.data)
      const data = res.data?.data
      if (data?.relationship) setRelationship(data.relationship)
      if (data?.emotionalState) setEmotionalState(data.emotionalState)
      setShowAdjustPanel(false)
    } catch (err) {
      console.error('[TwinChat] saveAdjustment error:', err)
    } finally {
      setSaving(false)
    }
  }

  // 格式化时间
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    if (isToday) return timeStr
    return `${d.getMonth() + 1}/${d.getDate()} ${timeStr}`
  }

  // 是否需要显示时间戳
  const shouldShowTime = (index: number) => {
    if (index === 0) return true
    const prev = messages[index - 1]
    const curr = messages[index]
    if (!prev.createdAt || !curr.createdAt) return false
    const diff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime()
    return diff > 5 * 60 * 1000
  }

  // 获取情感状态颜色
  const getEmotionColor = () => {
    if (!emotionalState) return '#71767B'
    return EMOTION_CONFIG[emotionalState.primary]?.color || '#71767B'
  }

  // 获取情感状态标签
  const getEmotionLabel = () => {
    if (!emotionalState) return '平静'
    return EMOTION_CONFIG[emotionalState.primary]?.label || '平静'
  }

  // 获取关系阶段标签
  const getStageLabel = () => {
    if (!relationship) return '陌生人'
    return STAGE_LABELS[relationship.stage] || '陌生人'
  }

  // 选择器按钮组
  const renderSelector = (options: { value: string; label: string }[], current: string, onChange: (v: string) => void) => (
    <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '6px' }}>
      {options.map(opt => (
        <View
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: current === opt.value ? '#4ECB71' : '#202327',
            flexShrink: 0,
          }}
        >
          <Text style={{ color: current === opt.value ? '#FFFFFF' : '#71767B', fontSize: '12px' }}>{opt.label}</Text>
        </View>
      ))}
    </View>
  )

  // 滑条
  const renderSlider = (label: string, value: number, onChange: (v: number) => void, color: string = '#4ECB71') => (
    <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#71767B', fontSize: '12px' }}>{label}</Text>
        <Text style={{ color: color, fontSize: '12px', fontWeight: '600' }}>{value}</Text>
      </View>
      <View style={{ position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
        <View style={{ width: '100%', height: '4px', backgroundColor: '#202327', borderRadius: '2px' }}>
          <View style={{ width: `${value}%`, height: '4px', backgroundColor: color, borderRadius: '2px' }} />
        </View>
        {/* 滑块点击区域 */}
        <View style={{ position: 'absolute', left: 0, right: 0, height: '20px', display: 'flex', flexDirection: 'row' }}>
          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => (
            <View
              key={v}
              style={{ flex: 1, height: '20px' }}
              onClick={() => onChange(v)}
            />
          ))}
        </View>
      </View>
      {/* 快捷值 */}
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: '#52525B', fontSize: '10px' }}>0</Text>
        <Text style={{ color: '#52525B', fontSize: '10px' }}>50</Text>
        <Text style={{ color: '#52525B', fontSize: '10px' }}>100</Text>
      </View>
    </View>
  )

  return (
    <View style={{ backgroundColor: '#0F1419', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶栏 */}
      <View
        style={{
          paddingTop: `${statusBarHeight}px`,
          backgroundColor: '#16181C',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <View
          style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: '44px', padding: '0 12px' }}
        >
          <View onClick={() => Taro.navigateBack()} style={{ padding: '8px' }}>
            <ArrowLeft size={20} color="#E7E9EA" />
          </View>
          <View
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onClick={() => setShowStatusPanel(!showStatusPanel)}
          >
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
              <View style={{ width: '6px', height: '6px', borderRadius: '3px', backgroundColor: getEmotionColor() }} />
              <Text style={{ color: '#E7E9EA', fontSize: '16px', fontWeight: '600' }}>{matchName}</Text>
            </View>
            <Text style={{ color: '#71767B', fontSize: '11px', marginTop: '1px' }}>
              {getStageLabel()} · {getEmotionLabel()}
            </Text>
          </View>
          <View onClick={() => setShowClearDialog(true)} style={{ padding: '8px' }}>
            <Trash2 size={18} color="#71767B" />
          </View>
        </View>

        {/* 关系&情感面板（可展开 - 只读展示） */}
        {showStatusPanel && relationship && (
          <View
            style={{
              margin: '0 16px 12px',
              padding: '12px 16px',
              backgroundColor: '#1E2A3A',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* 关系阶段 */}
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <Heart size={14} color="#4ECB71" />
                <Text style={{ color: '#E7E9EA', fontSize: '13px', fontWeight: '500' }}>关系：{getStageLabel()}</Text>
              </View>
              {/* 调整按钮 */}
              <View
                onClick={() => setShowAdjustPanel(!showAdjustPanel)}
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#202327', borderRadius: '8px' }}
              >
                <SlidersHorizontal size={12} color="#4ECB71" />
                <Text style={{ color: '#4ECB71', fontSize: '11px' }}>调整</Text>
                {showAdjustPanel ? <ChevronUp size={12} color="#4ECB71" /> : <ChevronDown size={12} color="#4ECB71" />}
              </View>
            </View>

            {/* 信任值 */}
            <View style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#71767B', fontSize: '11px' }}>信任</Text>
                <Text style={{ color: '#71767B', fontSize: '11px' }}>{relationship.trust}/100</Text>
              </View>
              <View style={{ height: '4px', backgroundColor: '#202327', borderRadius: '2px' }}>
                <View style={{ width: `${relationship.trust}%`, height: '4px', backgroundColor: '#4ECB71', borderRadius: '2px' }} />
              </View>
            </View>

            {/* 亲密度 */}
            <View style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#71767B', fontSize: '11px' }}>亲密</Text>
                <Text style={{ color: '#71767B', fontSize: '11px' }}>{relationship.intimacy}/100</Text>
              </View>
              <View style={{ height: '4px', backgroundColor: '#202327', borderRadius: '2px' }}>
                <View style={{ width: `${relationship.intimacy}%`, height: '4px', backgroundColor: '#F472B6', borderRadius: '2px' }} />
              </View>
            </View>

            {/* 情感状态 */}
            {emotionalState && (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <Shield size={14} color={getEmotionColor()} />
                  <Text style={{ color: '#E7E9EA', fontSize: '13px', fontWeight: '500' }}>
                    情绪：{getEmotionLabel()}
                  </Text>
                  <Text style={{ color: '#71767B', fontSize: '11px' }}>
                    强度 {emotionalState.intensity}%
                  </Text>
                </View>
                {emotionalState.towards_user && emotionalState.towards_user !== 'neutral' && (
                  <Text style={{ color: '#71767B', fontSize: '11px', paddingLeft: '22px' }}>
                    对你：{TOWARDS_LABELS[emotionalState.towards_user] || emotionalState.towards_user}
                  </Text>
                )}
                {emotionalState.reason && (
                  <Text style={{ color: '#52525B', fontSize: '11px', paddingLeft: '22px' }}>
                    {emotionalState.reason}
                  </Text>
                )}
              </View>
            )}

            {/* 互动次数 */}
            <Text style={{ color: '#52525B', fontSize: '10px' }}>
              已互动 {relationship.interaction_count} 次
            </Text>

            {/* ===== 调整面板 ===== */}
            {showAdjustPanel && (
              <View
                style={{
                  marginTop: '4px',
                  padding: '12px',
                  backgroundColor: '#0F1419',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Text style={{ color: '#4ECB71', fontSize: '12px', fontWeight: '600' }}>调整关系和情感状态</Text>

                {/* 关系阶段选择 */}
                <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Text style={{ color: '#71767B', fontSize: '12px' }}>关系阶段</Text>
                  {renderSelector(STAGE_OPTIONS, adjustStage, setAdjustStage)}
                </View>

                {/* 信任值 */}
                {renderSlider('信任值', adjustTrust, setAdjustTrust, '#4ECB71')}

                {/* 亲密度 */}
                {renderSlider('亲密度', adjustIntimacy, setAdjustIntimacy, '#F472B6')}

                {/* 情感状态选择 */}
                <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Text style={{ color: '#71767B', fontSize: '12px' }}>情感状态</Text>
                  {renderSelector(EMOTION_OPTIONS, adjustEmotion, setAdjustEmotion)}
                </View>

                {/* 情感强度 */}
                {renderSlider('情感强度', adjustIntensity, setAdjustIntensity, EMOTION_CONFIG[adjustEmotion]?.color || '#71767B')}

                {/* 对你态度 */}
                <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Text style={{ color: '#71767B', fontSize: '12px' }}>对你的态度</Text>
                  {renderSelector(TOWARDS_OPTIONS, adjustTowards, setAdjustTowards)}
                </View>

                {/* 保存按钮 */}
                <View
                  onClick={saveAdjustment}
                  style={{
                    padding: '10px',
                    backgroundColor: saving ? '#2A3A2A' : '#4ECB71',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '600' }}>
                    {saving ? '保存中...' : '应用调整'}
                  </Text>
                </View>

                <Text style={{ color: '#52525B', fontSize: '10px', textAlign: 'center' }}>
                  调整后发送消息，观察 TA 在不同状态下的反应差异
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 消息区 */}
      <ScrollView
        scrollY
        style={{ flex: 1, height: '0' }}
        scrollTop={scrollTop}
      >
        <View style={{ padding: '16px', paddingBottom: '24px' }}>
          {/* 空状态引导 */}
          {messages.length === 0 && !historyLoading && (
            <View
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '80px' }}
            >
              <Ghost size={48} color="#4ECB71" />
              <Text
                className="block text-center"
                style={{ color: '#71767B', fontSize: '14px', marginTop: '16px' }}
              >
                {`这是${matchName}的数字孪生体\n基于你记录的维度数据创建\n试试跟 TA 说点什么吧`}
              </Text>
            </View>
          )}

          {/* 加载历史 */}
          {historyLoading && (
            <View style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Text style={{ color: '#71767B', fontSize: '13px' }}>加载中...</Text>
            </View>
          )}

          {/* 消息列表 */}
          {messages.map((msg, idx) => (
            <View key={msg.id || idx}>
              {/* 时间戳 */}
              {shouldShowTime(idx) && msg.createdAt && (
                <View style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 12px' }}>
                  <Text style={{ color: '#71767B', fontSize: '11px' }}>{formatTime(msg.createdAt)}</Text>
                </View>
              )}

              {/* 用户消息 */}
              {msg.role === 'user' ? (
                <View
                  style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', marginBottom: '8px' }}
                >
                  <View
                    style={{
                      maxWidth: '75%',
                      backgroundColor: '#4ECB71',
                      borderRadius: '16px 16px 4px 16px',
                      padding: '10px 14px',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: '14px', lineHeight: '1.5' }}>{msg.content}</Text>
                  </View>
                </View>
              ) : (
                <View
                  style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', marginBottom: '8px' }}
                >
                  <View
                    style={{
                      maxWidth: '75%',
                      backgroundColor: '#1E2A3A',
                      borderRadius: '16px 16px 16px 4px',
                      padding: '10px 14px',
                    }}
                  >
                    <Text style={{ color: '#E7E9EA', fontSize: '14px', lineHeight: '1.5' }}>{msg.content}</Text>
                  </View>
                </View>
              )}
            </View>
          ))}

          {/* 打字指示器 */}
          {loading && (
            <View
              style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', marginBottom: '8px' }}
            >
              <View
                style={{
                  backgroundColor: '#1E2A3A',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '12px 18px',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '4px',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#71767B', fontSize: '13px' }}>正在输入...</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 底部输入栏 */}
      <View
        style={{
          backgroundColor: '#16181C',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 16px',
          paddingBottom: '20px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <View style={{ flex: 1 }}>
          <Input
            className="border-0 bg-[#202327] rounded-full px-4 text-white placeholder:text-gray-500"
            style={{ fontSize: '14px' }}
            placeholder={`跟${matchName}说点什么...`}
            value={inputValue}
            onInput={(e) => setInputValue(e.detail.value)}
            onConfirm={sendMessage}
            confirmType="send"
          />
        </View>
        <View
          onClick={sendMessage}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '20px',
            backgroundColor: inputValue.trim() ? '#4ECB71' : '#202327',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Send size={18} color={inputValue.trim() ? '#FFFFFF' : '#71767B'} />
        </View>
      </View>

      {/* 清空确认弹窗 */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>清空对话记录</AlertDialogTitle>
            <AlertDialogDescription>
              {`确定要清空与${matchName}的所有对话记录吗？关系进度和情感状态也将重置。此操作不可撤销。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowClearDialog(false)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={clearHistory}>确认清空</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  )
}

export default TwinChatPage
