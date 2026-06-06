import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import React, { useState, useEffect, useCallback } from 'react'
import { Network } from '@/network'
import { ArrowLeft, Send, Ghost, Trash2, Shield, Flame, Handshake, SlidersHorizontal, ChevronDown, ChevronUp, Zap, Lightbulb, LightbulbOff } from 'lucide-react-taro'
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

// 距离-渴望模型：关系状态
interface RelationshipState {
  safety: number
  desire: number
  closeness: number
  stage: string
  tension: number
  attitudeAnchor: string
  safetyTrend: number[]
  desireTrend: number[]
}

// 情绪状态
interface EmotionalStateRecord {
  emotion: string
  emotionIntensity: number
  attitudeAnchor: string
  tension: number
}

// AI 提示
interface TwinHint {
  insight: string
  suggestion?: string
  severity: 'positive' | 'info' | 'warning' | 'critical'
  deltas: {
    safety: number
    desire: number
    closeness: number
  }
}

// 提示级别配色
const HINT_SEVERITY_CONFIG: Record<string, { color: string; bgColor: string; borderColor: string; label: string }> = {
  positive: { color: '#4ECB71', bgColor: 'rgba(78, 203, 113, 0.08)', borderColor: '#4ECB71', label: '好信号' },
  info: { color: '#71767B', bgColor: 'rgba(113, 118, 123, 0.06)', borderColor: '#71767B', label: '提示' },
  warning: { color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.08)', borderColor: '#F59E0B', label: '注意' },
  critical: { color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.08)', borderColor: '#EF4444', label: '警示' },
}

// 关系阶段中文映射
const STAGE_LABELS: Record<string, string> = {
  stranger: '陌生人',
  acquaintance: '点头之交',
  familiar: '熟悉的朋友',
  close: '亲密好友',
  intimate: '恋人般亲密',
}

// 态度锚点中文映射
const ANCHOR_LABELS: Record<string, string> = {
  cold: '冷淡疏远',
  guarded: '警惕防备',
  neutral: '不冷不热',
  curious: '有点好奇',
  longing: '渴望靠近但不敢',
  fond: '有好感',
  attached: '深深依恋',
}

// 情绪中文映射+颜色
const EMOTION_CONFIG: Record<string, { label: string; color: string }> = {
  neutral: { label: '平静', color: '#71767B' },
  warm: { label: '温暖', color: '#F59E0B' },
  happy: { label: '开心', color: '#4ECB71' },
  touched: { label: '感动', color: '#EC4899' },
  anxious: { label: '焦虑', color: '#EF4444' },
  defensive: { label: '防御', color: '#8B5CF6' },
  hurt: { label: '受伤', color: '#DC2626' },
  cold: { label: '冷淡', color: '#6B7280' },
  guarded: { label: '警惕', color: '#8B5CF6' },
  playful: { label: '调皮', color: '#10B981' },
  longing: { label: '想念', color: '#F472B6' },
  fond: { label: '有好感', color: '#F59E0B' },
  attached: { label: '依恋', color: '#EC4899' },
  content: { label: '满足', color: '#4ECB71' },
  excited: { label: '兴奋', color: '#F97316' },
  confused: { label: '困惑', color: '#8B5CF6' },
  annoyed: { label: '烦躁', color: '#EF4444' },
}

// 情绪选项（调整面板用）
const EMOTION_OPTIONS = Object.entries(EMOTION_CONFIG).map(([value, { label }]) => ({ value, label }))

// 态度锚点选项
const ANCHOR_OPTIONS = Object.entries(ANCHOR_LABELS).map(([value, label]) => ({ value, label }))

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
  const [emotionalState, setEmotionalState] = useState<EmotionalStateRecord | null>(null)
  const [showStatusPanel, setShowStatusPanel] = useState(false)
  const [showAdjustPanel, setShowAdjustPanel] = useState(false)
  const [hintsEnabled, setHintsEnabled] = useState(() => {
    const stored = Taro.getStorageSync('twin_hints_enabled')
    return stored === '' ? true : stored === 'true'
  })
  const [latestHint, setLatestHint] = useState<TwinHint | null>(null)

  // 调整面板本地状态
  const [adjustSafety, setAdjustSafety] = useState(30)
  const [adjustDesire, setAdjustDesire] = useState(0)
  const [adjustCloseness, setAdjustCloseness] = useState(0)
  const [adjustEmotion, setAdjustEmotion] = useState('neutral')
  const [adjustIntensity, setAdjustIntensity] = useState(50)
  const [adjustAnchor, setAdjustAnchor] = useState('neutral')
  const [saving, setSaving] = useState(false)

  // 获取状态栏高度
  useEffect(() => {
    const systemInfo = Taro.getSystemInfoSync()
    setStatusBarHeight(systemInfo.statusBarHeight || 0)
  }, [])

  // 同步 relationship → adjust 面板
  useEffect(() => {
    if (relationship) {
      setAdjustSafety(relationship.safety)
      setAdjustDesire(relationship.desire)
      setAdjustCloseness(relationship.closeness)
    }
  }, [relationship])

  // 同步 emotionalState → adjust 面板
  useEffect(() => {
    if (emotionalState) {
      setAdjustEmotion(emotionalState.emotion)
      setAdjustIntensity(emotionalState.emotionIntensity)
      setAdjustAnchor(emotionalState.attitudeAnchor)
    }
  }, [emotionalState])

  // 切换 AI 提示
  const toggleHints = () => {
    const next = !hintsEnabled
    setHintsEnabled(next)
    Taro.setStorageSync('twin_hints_enabled', String(next))
    if (!next) setLatestHint(null)
  }

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

      if (data?.relationship) setRelationship(data.relationship)
      if (data?.emotionalState) setEmotionalState(data.emotionalState)

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
    setLatestHint(null)

    try {
      const res = await Network.request({
        url: '/api/twin/chat',
        method: 'POST',
        data: { matchId, message: text, hintsEnabled }
      })
      console.log('[TwinChat] sendMessage response:', res.data)
      const data = res.data?.data
      const reply = data?.reply || '...'
      setMessages(prev => [...prev, { role: 'assistant', content: reply, createdAt: new Date().toISOString() }])

      if (data?.relationship) setRelationship(data.relationship)
      if (data?.emotionalState) setEmotionalState(data.emotionalState)
      if (data?.hint) setLatestHint(data.hint)

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

  // 保存手动调整
  const saveAdjustment = async () => {
    setSaving(true)
    try {
      const res = await Network.request({
        url: '/api/twin/relationship',
        method: 'PATCH',
        data: {
          matchId,
          safety: adjustSafety,
          desire: adjustDesire,
          closeness: adjustCloseness,
          emotion: adjustEmotion,
          emotionIntensity: adjustIntensity,
          attitudeAnchor: adjustAnchor,
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

  const shouldShowTime = (index: number) => {
    if (index === 0) return true
    const prev = messages[index - 1]
    const curr = messages[index]
    if (!prev.createdAt || !curr.createdAt) return false
    const diff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime()
    return diff > 5 * 60 * 1000
  }

  const getEmotionColor = () => {
    if (!emotionalState) return '#71767B'
    return EMOTION_CONFIG[emotionalState.emotion]?.color || '#71767B'
  }

  const getEmotionLabel = () => {
    if (!emotionalState) return '平静'
    return EMOTION_CONFIG[emotionalState.emotion]?.label || '平静'
  }

  const getStageLabel = () => {
    if (!relationship) return '陌生人'
    return STAGE_LABELS[relationship.stage] || '陌生人'
  }

  // 状态条：渐变色+数值
  const renderStateBar = (icon: React.ReactNode, label: string, value: number, color: string, maxVal: number = 100) => (
    <View style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
          {icon}
          <Text style={{ color: '#71767B', fontSize: '11px' }}>{label}</Text>
        </View>
        <Text style={{ color, fontSize: '11px', fontWeight: '600' }}>{value}/{maxVal}</Text>
      </View>
      <View style={{ height: '4px', backgroundColor: '#202327', borderRadius: '2px' }}>
        <View style={{ width: `${Math.min(100, (value / maxVal) * 100)}%`, height: '4px', backgroundColor: color, borderRadius: '2px' }} />
      </View>
    </View>
  )

  // 滑条
  const renderSlider = (label: string, value: number, onChange: (v: number) => void, color: string = '#4ECB71') => (
    <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#71767B', fontSize: '12px' }}>{label}</Text>
        <Text style={{ color, fontSize: '12px', fontWeight: '600' }}>{value}</Text>
      </View>
      <View style={{ position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
        <View style={{ width: '100%', height: '4px', backgroundColor: '#202327', borderRadius: '2px' }}>
          <View style={{ width: `${value}%`, height: '4px', backgroundColor: color, borderRadius: '2px' }} />
        </View>
        <View style={{ position: 'absolute', left: 0, right: 0, height: '20px', display: 'flex', flexDirection: 'row' }}>
          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => (
            <View key={v} style={{ flex: 1, height: '20px' }} onClick={() => onChange(v)} />
          ))}
        </View>
      </View>
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: '#52525B', fontSize: '10px' }}>0</Text>
        <Text style={{ color: '#52525B', fontSize: '10px' }}>50</Text>
        <Text style={{ color: '#52525B', fontSize: '10px' }}>100</Text>
      </View>
    </View>
  )

  // 选择器
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
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: '44px', padding: '0 12px' }}>
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
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
            <View onClick={toggleHints} style={{ padding: '8px' }}>
              {hintsEnabled ? <Lightbulb size={18} color="#F59E0B" /> : <LightbulbOff size={18} color="#71767B" />}
            </View>
            <View onClick={() => setShowClearDialog(true)} style={{ padding: '8px' }}>
              <Trash2 size={18} color="#71767B" />
            </View>
          </View>
        </View>

        {/* 状态面板 */}
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
            {/* 关系阶段 + 张力 */}
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: '#E7E9EA', fontSize: '13px', fontWeight: '500' }}>
                {getStageLabel()}
              </Text>
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                {relationship.tension > 30 && (
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '3px' }}>
                    <Zap size={12} color="#F59E0B" />
                    <Text style={{ color: '#F59E0B', fontSize: '10px' }}>张力{relationship.tension}</Text>
                  </View>
                )}
                <View
                  onClick={() => setShowAdjustPanel(!showAdjustPanel)}
                  style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#202327', borderRadius: '8px' }}
                >
                  <SlidersHorizontal size={12} color="#4ECB71" />
                  <Text style={{ color: '#4ECB71', fontSize: '11px' }}>调整</Text>
                  {showAdjustPanel ? <ChevronUp size={12} color="#4ECB71" /> : <ChevronDown size={12} color="#4ECB71" />}
                </View>
              </View>
            </View>

            {/* 安全感 */}
            {renderStateBar(<Shield size={12} color="#4ECB71" />, '安全感', relationship.safety, '#4ECB71')}

            {/* 渴望度 */}
            {renderStateBar(<Flame size={12} color="#F97316" />, '渴望度', relationship.desire, '#F97316')}

            {/* 亲密度 */}
            {renderStateBar(<Handshake size={12} color="#F472B6" />, '亲密度', relationship.closeness, '#F472B6')}

            {/* 态度锚点 */}
            {emotionalState && (
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                <Text style={{ color: '#71767B', fontSize: '11px' }}>态度：</Text>
                <Text style={{ color: '#E7E9EA', fontSize: '11px' }}>
                  {ANCHOR_LABELS[emotionalState.attitudeAnchor] || emotionalState.attitudeAnchor}
                </Text>
                <Text style={{ color: '#52525B', fontSize: '11px' }}>|</Text>
                <Text style={{ color: '#71767B', fontSize: '11px' }}>情绪：</Text>
                <Text style={{ color: getEmotionColor(), fontSize: '11px' }}>
                  {getEmotionLabel()} {emotionalState.emotionIntensity}%
                </Text>
              </View>
            )}

            {/* 张力说明 */}
            {relationship.tension > 20 && (
              <Text style={{ color: '#52525B', fontSize: '10px' }}>
                {relationship.tension > 50
                  ? '内心非常纠结，渴望和距离差距巨大'
                  : relationship.desire > relationship.closeness
                    ? '渴望靠近，但实际距离还不够近'
                    : '距离比渴望更近，有些不自在'}
              </Text>
            )}

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
                <Text style={{ color: '#4ECB71', fontSize: '12px', fontWeight: '600' }}>调整关系状态</Text>

                {renderSlider('安全感', adjustSafety, setAdjustSafety, '#4ECB71')}
                {renderSlider('渴望度', adjustDesire, setAdjustDesire, '#F97316')}
                {renderSlider('亲密度', adjustCloseness, setAdjustCloseness, '#F472B6')}

                <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Text style={{ color: '#71767B', fontSize: '12px' }}>情绪</Text>
                  {renderSelector(EMOTION_OPTIONS, adjustEmotion, setAdjustEmotion)}
                </View>

                {renderSlider('情绪强度', adjustIntensity, setAdjustIntensity, EMOTION_CONFIG[adjustEmotion]?.color || '#71767B')}

                <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Text style={{ color: '#71767B', fontSize: '12px' }}>态度锚点</Text>
                  {renderSelector(ANCHOR_OPTIONS, adjustAnchor, setAdjustAnchor)}
                </View>

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
      <ScrollView scrollY style={{ flex: 1, height: '0' }} scrollTop={scrollTop}>
        <View style={{ padding: '16px', paddingBottom: '24px' }}>
          {/* 空状态引导 */}
          {messages.length === 0 && !historyLoading && (
            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '80px' }}>
              <Ghost size={48} color="#4ECB71" />
              <Text
                className="block text-center"
                style={{ color: '#71767B', fontSize: '14px', marginTop: '16px' }}
              >
                {`这是${matchName}的数字孪生体\n基于你记录的维度数据创建\n试试跟 TA 说点什么吧`}
              </Text>
            </View>
          )}

          {historyLoading && (
            <View style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Text style={{ color: '#71767B', fontSize: '13px' }}>加载中...</Text>
            </View>
          )}

          {messages.map((msg, idx) => (
            <View key={msg.id || idx}>
              {shouldShowTime(idx) && msg.createdAt && (
                <View style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 12px' }}>
                  <Text style={{ color: '#71767B', fontSize: '11px' }}>{formatTime(msg.createdAt)}</Text>
                </View>
              )}

              {msg.role === 'user' ? (
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <View style={{ maxWidth: '75%', backgroundColor: '#4ECB71', borderRadius: '16px 16px 4px 16px', padding: '10px 14px' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: '14px', lineHeight: '1.5' }}>{msg.content}</Text>
                  </View>
                </View>
              ) : (
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', marginBottom: '8px' }}>
                  <View style={{ maxWidth: '75%', backgroundColor: '#1E2A3A', borderRadius: '16px 16px 16px 4px', padding: '10px 14px' }}>
                    <Text style={{ color: '#E7E9EA', fontSize: '14px', lineHeight: '1.5' }}>{msg.content}</Text>
                  </View>
                </View>
              )}
            </View>
          ))}

          {loading && (
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', marginBottom: '8px' }}>
              <View style={{ backgroundColor: '#1E2A3A', borderRadius: '16px 16px 16px 4px', padding: '12px 18px', display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center' }}>
                <Text style={{ color: '#71767B', fontSize: '13px' }}>正在输入...</Text>
              </View>
            </View>
          )}

          {/* AI 提示卡片 */}
          {hintsEnabled && latestHint && !loading && (() => {
            const cfg = HINT_SEVERITY_CONFIG[latestHint.severity] || HINT_SEVERITY_CONFIG.info
            const d = latestHint.deltas
            return (
              <View
                style={{
                  margin: '8px 0',
                  padding: '10px 14px',
                  backgroundColor: cfg.bgColor,
                  borderRadius: '12px',
                  borderLeft: `3px solid ${cfg.borderColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {/* 标题行：图标+标签+变化量 */}
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '5px' }}>
                    <Lightbulb size={13} color={cfg.color} />
                    <Text style={{ color: cfg.color, fontSize: '11px', fontWeight: '600' }}>{cfg.label}</Text>
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                    {d.safety !== 0 && (
                      <Text style={{ color: d.safety > 0 ? '#4ECB71' : '#EF4444', fontSize: '10px', fontWeight: '500' }}>
                        安全{d.safety > 0 ? '↑' : '↓'}{Math.abs(d.safety)}
                      </Text>
                    )}
                    {d.desire !== 0 && (
                      <Text style={{ color: d.desire > 0 ? '#F97316' : '#6B7280', fontSize: '10px', fontWeight: '500' }}>
                        渴望{d.desire > 0 ? '↑' : '↓'}{Math.abs(d.desire)}
                      </Text>
                    )}
                    {d.closeness !== 0 && (
                      <Text style={{ color: d.closeness > 0 ? '#F472B6' : '#6B7280', fontSize: '10px', fontWeight: '500' }}>
                        亲密{d.closeness > 0 ? '↑' : '↓'}{Math.abs(d.closeness)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* 解读内容 */}
                <Text style={{ color: '#D4D4D8', fontSize: '12px', lineHeight: '1.6' }}>
                  {latestHint.insight}
                </Text>

                {/* 策略建议 */}
                {latestHint.suggestion && (
                  <Text style={{ color: cfg.color, fontSize: '11px', lineHeight: '1.5', opacity: 0.85 }}>
                    💡 {latestHint.suggestion}
                  </Text>
                )}
              </View>
            )
          })()}
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
