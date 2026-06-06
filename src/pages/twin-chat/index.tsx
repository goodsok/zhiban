import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import { Network } from '@/network'
import { ArrowLeft, Send, Ghost, Trash2 } from 'lucide-react-taro'
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

const TwinChatPage = () => {
  const router = Taro.useRouter()
  const matchId = Number(router.params.matchId) || 0
  const matchName = decodeURIComponent(router.params.matchName || 'TA')
  const matchTags = decodeURIComponent(router.params.matchTags || '')

  const [messages, setMessages] = useState<TwinMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [statusBarHeight, setStatusBarHeight] = useState(0)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)

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
      const history = res.data?.data?.history || []
      setMessages(history.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at
      })))
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
      const reply = res.data?.data?.reply || '...'
      setMessages(prev => [...prev, { role: 'assistant', content: reply, createdAt: new Date().toISOString() }])
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
          <View style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
              <View style={{ width: '6px', height: '6px', borderRadius: '3px', backgroundColor: '#4ECB71' }} />
              <Text style={{ color: '#E7E9EA', fontSize: '16px', fontWeight: '600' }}>{matchName}</Text>
            </View>
            {matchTags ? (
              <Text style={{ color: '#71767B', fontSize: '11px', marginTop: '1px' }}>{matchTags}</Text>
            ) : null}
          </View>
          <View onClick={() => setShowClearDialog(true)} style={{ padding: '8px' }}>
            <Trash2 size={18} color="#71767B" />
          </View>
        </View>
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
              {`确定要清空与${matchName}的所有对话记录吗？此操作不可撤销。`}
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
