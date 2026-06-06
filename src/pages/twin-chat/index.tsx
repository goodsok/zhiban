import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import { Network } from '@/network'
import { ArrowLeft, Send, Ghost, Trash2, Heart, Shield } from 'lucide-react-taro'
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
}

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

  // 获取状态栏高度
  useEffect(() => {
    const systemInfo = Taro.getSystemInfoSync()
    setStatusBarHeight(systemInfo.statusBarHeight || 0)
  }, [])

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

        {/* 关系&情感面板（可展开） */}
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
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <Heart size={14} color="#4ECB71" />
              <Text style={{ color: '#E7E9EA', fontSize: '13px', fontWeight: '500' }}>关系：{getStageLabel()}</Text>
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
