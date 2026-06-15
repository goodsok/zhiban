import { useState, useCallback, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import CustomHeader from '@/components/custom-header'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, MessageSquare, Copy, Check, Lightbulb, Star, TrendingUp, History, Trash2, ChevronRight } from 'lucide-react-taro'
import { Network } from '@/network'

// --- Types ---
interface SuggestionItem {
  field?: string
  reason?: string
  original?: string
  suggested?: string
}

interface ProfileAnalysis {
  overallScore: number
  strengths: string[]
  improvements: string[]
  suggestions: (string | SuggestionItem)[]
  summary: string
  chatStyle?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ProfileHistoryItem {
  id: number
  platform: string
  nickname: string
  bio: string
  interests: string
  analysisResult: ProfileAnalysis
  isFallback?: boolean
  createdAt: string
}

// --- Platform options ---
const PLATFORMS = [
  { value: 'soul', label: 'Soul' },
  { value: 'tantan', label: '探探' },
  { value: 'wechat', label: '微信' },
  { value: 'momo', label: '陌陌' },
  { value: 'other', label: '其他' },
]

const PLATFORM_LABEL_MAP: Record<string, string> = {
  soul: 'Soul',
  tantan: '探探',
  wechat: '微信',
  momo: '陌陌',
  other: '其他',
}

// --- Score color helper ---
function getScoreColor(score: number): string {
  if (score >= 80) return '#4ECB71'
  if (score >= 60) return '#F5A623'
  return '#FF6B6B'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
  return '待提升'
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

export default function DatingProfilePage() {
  const router = Taro.useRouter()
  const matchId = router.params.matchId ? Number(router.params.matchId) : undefined

  // Tab state
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze')

  // Form state
  const [profileText, setProfileText] = useState('')
  const [platform, setPlatform] = useState('soul')
  // Result state
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null)

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Copy state
  const [copiedIdx, setCopiedIdx] = useState(-1)

  // History state
  const [historyList, setHistoryList] = useState<ProfileHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedHistory, setSelectedHistory] = useState<ProfileHistoryItem | null>(null)

  // --- Fetch history ---
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      console.log('[DatingProfile] GET /api/dating/profile/history')
      const res = await Network.request({
        url: '/api/dating/profile/history',
        method: 'GET',
        data: { limit: 50, offset: 0 }
      })
      console.log('[DatingProfile] history response:', res.data)
      const data = res.data?.data
      if (data?.list) {
        setHistoryList(data.list)
      }
    } catch (err) {
      console.error('[DatingProfile] fetchHistory error:', err)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // --- Save to history after analysis ---
  const saveToHistory = useCallback(async (result: ProfileAnalysis, plat: string, text: string) => {
    try {
      console.log('[DatingProfile] POST /api/dating/profile/history')
      await Network.request({
        url: '/api/dating/profile/history',
        method: 'POST',
        data: {
          platform: plat,
          bio: text,
          analysisResult: result
        }
      })
      // Refresh history list
      fetchHistory()
    } catch (err) {
      console.error('[DatingProfile] saveHistory error:', err)
    }
  }, [fetchHistory])

  // --- Generate profile analysis ---
  const handleAnalyze = useCallback(async () => {
    if (!profileText.trim()) {
      Taro.showToast({ title: '请输入个人简介', icon: 'none' })
      return
    }
    setLoading(true)
    setAnalysis(null)
    setChatMessages([])
    try {
      console.log('[DatingProfile] POST /api/dating/profile/analyze', { platform, matchId })
      const res = await Network.request({
        url: '/api/dating/profile/analyze',
        method: 'POST',
        data: { profileText, platform, matchId }
      })
      console.log('[DatingProfile] analyze response:', res.data)
      const data = res.data?.data
      if (data) {
        setAnalysis(data)
        // Auto-save to history
        saveToHistory(data, platform, profileText)
      } else {
        Taro.showToast({ title: '分析失败，请重试', icon: 'none' })
      }
    } catch (err) {
      console.error('[DatingProfile] analyze error:', err)
      Taro.showToast({ title: '网络错误', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [profileText, platform, matchId, saveToHistory])

  // --- Chat with AI ---
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)
    try {
      const res = await Network.request({
        url: '/api/dating/profile/chat',
        method: 'POST',
        data: {
          platform,
          bio: profileText,
          analysis,
          messages: chatMessages,
          currentMessage: userMsg
        }
      })
      const reply = res.data?.data?.reply
      if (reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: reply }])
      }
    } catch (err) {
      console.error('[DatingProfile] chat error:', err)
      Taro.showToast({ title: '发送失败', icon: 'none' })
    } finally {
      setChatLoading(false)
    }
  }, [chatInput, chatLoading, platform, profileText, analysis, chatMessages])

  // --- Copy ---
  const handleCopy = useCallback((text: string, idx: number) => {
    Taro.setClipboardData({ data: text })
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(-1), 1500)
  }, [])

  // --- Delete history ---
  const handleDeleteHistory = useCallback(async (id: number) => {
    try {
      await Network.request({
        url: `/api/dating/profile/history/${id}`,
        method: 'DELETE'
      })
      Taro.showToast({ title: '已删除', icon: 'none' })
      setHistoryList(prev => prev.filter(item => item.id !== id))
      if (selectedHistory?.id === id) {
        setSelectedHistory(null)
      }
    } catch (err) {
      console.error('[DatingProfile] deleteHistory error:', err)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }, [selectedHistory])

  // --- Render analysis result ---
  const renderAnalysisResult = (result: ProfileAnalysis, showCopy?: boolean) => (
    <View>
      {/* Score card */}
      <View className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <View className="flex flex-row items-center gap-4 mb-4">
          <View
            className="flex items-center justify-center rounded-full"
            style={{ width: '64px', height: '64px', backgroundColor: `${getScoreColor(result.overallScore)}15` }}
          >
            <Text className="block text-2xl font-bold" style={{ color: getScoreColor(result.overallScore) }}>
              {result.overallScore}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="block text-lg font-semibold text-gray-800">形象评分</Text>
            <Text className="block text-sm mt-1" style={{ color: getScoreColor(result.overallScore) }}>
              {getScoreLabel(result.overallScore)}
            </Text>
            {result.chatStyle && (
              <Text className="block text-xs text-gray-400 mt-1">聊天风格：{result.chatStyle}</Text>
            )}
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: `${getScoreColor(result.overallScore)}15` }}
          >
            <Text className="block text-xs font-medium" style={{ color: getScoreColor(result.overallScore) }}>
              {getScoreLabel(result.overallScore)}
            </Text>
          </View>
        </View>
        {/* Score bar */}
        <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${result.overallScore}%`,
              backgroundColor: getScoreColor(result.overallScore)
            }}
          />
        </View>
      </View>

      {/* Strengths */}
      {result.strengths?.length > 0 && (
        <View className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <View className="flex flex-row items-center gap-2 mb-3">
            <Star size={18} color="#4ECB71" />
            <Text className="block text-base font-semibold text-gray-800">亮点</Text>
          </View>
          {result.strengths.map((s, i) => (
            <View key={i} className="flex flex-row items-start gap-2 mb-2 last:mb-0">
              <View className="mt-1 w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
              <Text className="block text-sm text-gray-600 leading-relaxed">{s}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Improvements */}
      {result.improvements?.length > 0 && (
        <View className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <View className="flex flex-row items-center gap-2 mb-3">
            <TrendingUp size={18} color="#F5A623" />
            <Text className="block text-base font-semibold text-gray-800">待提升</Text>
          </View>
          {result.improvements.map((s, i) => (
            <View key={i} className="flex flex-row items-start gap-2 mb-2 last:mb-0">
              <View className="mt-1 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
              <Text className="block text-sm text-gray-600 leading-relaxed">{s}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Suggestions */}
      {result.suggestions?.length > 0 && (
        <View className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <View className="flex flex-row items-center gap-2 mb-3">
            <Lightbulb size={18} color="#4ECB71" />
            <Text className="block text-base font-semibold text-gray-800">优化建议</Text>
          </View>
          {result.suggestions.map((s, i) => {
            const isObj = typeof s === 'object' && s !== null
            return (
              <View key={i} className="mb-3 last:mb-0 p-3 bg-green-50 rounded-xl">
                {isObj ? (
                  <View>
                    {(s as SuggestionItem).field && (
                      <Text className="block text-sm font-medium text-green-600 mb-1">{(s as SuggestionItem).field}</Text>
                    )}
                    {(s as SuggestionItem).reason && (
                      <Text className="block text-sm text-gray-600 leading-relaxed mb-2">{(s as SuggestionItem).reason}</Text>
                    )}
                    {(s as SuggestionItem).suggested && showCopy && (
                      <View className="flex flex-row items-start justify-between gap-2">
                        <Text className="block text-sm text-gray-700 leading-relaxed flex-1">{(s as SuggestionItem).suggested}</Text>
                        <View onClick={() => handleCopy((s as SuggestionItem).suggested || '', i)} className="flex-shrink-0 mt-1">
                          {copiedIdx === i ? (
                            <Check size={16} color="#4ECB71" />
                          ) : (
                            <Copy size={16} color="#9ca3af" />
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  <View className="flex flex-row items-start justify-between gap-2">
                    <Text className="block text-sm text-gray-700 leading-relaxed flex-1">{s as string}</Text>
                    {showCopy && (
                      <View onClick={() => handleCopy(s as string, i)} className="flex-shrink-0 mt-1">
                        {copiedIdx === i ? (
                          <Check size={16} color="#4ECB71" />
                        ) : (
                          <Copy size={16} color="#9ca3af" />
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )
          })}
        </View>
      )}

      {/* Summary */}
      {result.summary && (
        <View className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <Text className="block text-sm text-gray-500 mb-2">综合评价</Text>
          <Text className="block text-sm text-gray-700 leading-relaxed">{result.summary}</Text>
        </View>
      )}
    </View>
  )

  // --- Render ---
  return (
    <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="形象诊断" />

      <View className="px-4 pt-4 pb-20">
        {/* Tab toggle */}
        <View className="flex flex-row bg-gray-100 rounded-2xl p-1 mb-4">
          <View
            className={`flex-1 py-2 rounded-xl ${activeTab === 'analyze' ? 'bg-white' : ''}`}
            style={activeTab === 'analyze' ? { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : {}}
            onClick={() => { setActiveTab('analyze'); setSelectedHistory(null) }}
          >
            <Text className={`block text-center text-sm font-medium ${activeTab === 'analyze' ? 'text-gray-800' : 'text-gray-400'}`}>
              诊断
            </Text>
          </View>
          <View
            className={`flex-1 py-2 rounded-xl ${activeTab === 'history' ? 'bg-white' : ''}`}
            style={activeTab === 'history' ? { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : {}}
            onClick={() => { setActiveTab('history'); setSelectedHistory(null) }}
          >
            <Text className={`block text-center text-sm font-medium ${activeTab === 'history' ? 'text-gray-800' : 'text-gray-400'}`}>
              历史
            </Text>
          </View>
        </View>

        {/* ============ Analyze Tab ============ */}
        {activeTab === 'analyze' && (
          <View>
            {/* Platform selector */}
            <View className="mb-4">
              <Text className="block text-sm font-medium text-gray-500 mb-2">选择平台</Text>
              <View className="flex flex-row flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <View
                    key={p.value}
                    className={`px-4 py-1 rounded-full ${platform === p.value ? 'bg-green-500' : 'bg-white'}`}
                    style={platform === p.value ? { boxShadow: '0 2px 8px rgba(78,203,113,0.3)' } : { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                    onClick={() => setPlatform(p.value)}
                  >
                    <Text className={`block text-sm ${platform === p.value ? 'text-white font-medium' : 'text-gray-600'}`}>{p.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Profile input */}
            <View className="mb-4">
              <Text className="block text-sm font-medium text-gray-500 mb-2">粘贴你的个人简介</Text>
              <Textarea
                wrapperClassName="bg-white rounded-2xl p-4"
                className="w-full"
                style={{ minHeight: '120px' }}
                placeholder="把你的社交平台个人简介粘贴到这里，AI 将为你分析优化方向..."
                maxlength={2000}
                value={profileText}
                onInput={(e) => setProfileText(e.detail.value)}
              />
            </View>

            {/* Analyze button */}
            <Button
              className="w-full rounded-2xl py-3"
              style={{ backgroundColor: loading ? '#ccc' : '#4ECB71', color: '#fff' }}
              onClick={handleAnalyze}
              disabled={loading}
            >
              <View className="flex flex-row items-center justify-center gap-2">
                <Sparkles size={18} color="#fff" />
                <Text className="text-white font-medium">{loading ? '分析中...' : '开始诊断'}</Text>
              </View>
            </Button>

            {/* Loading skeleton */}
            {loading && (
              <View className="mt-6 bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-5/6 mb-6" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </View>
            )}

            {/* Analysis result */}
            {analysis && !loading && (
              <View className="mt-6">
                {renderAnalysisResult(analysis, true)}

                {/* Divider */}
                <View className="flex flex-row items-center gap-3 my-6">
                  <View className="flex-1 h-px bg-gray-200" />
                  <Text className="block text-xs text-gray-400">继续对话，深入优化</Text>
                  <View className="flex-1 h-px bg-gray-200" />
                </View>

                {/* Chat area */}
                <View className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  {chatMessages.length > 0 && (
                    <View className="mb-4 max-h-80 overflow-y-auto">
                      {chatMessages.map((msg, i) => (
                        <View key={i} className={`flex mb-3 last:mb-0 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <View className={msg.role === 'user' ? 'max-w-[80%] px-4 py-2 rounded-2xl bg-green-500' : 'max-w-[80%] px-4 py-2 rounded-2xl bg-gray-100'}>
                            <Text className={`block text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-700'}`}>
                              {msg.content}
                            </Text>
                          </View>
                        </View>
                      ))}
                      {chatLoading && (
                        <View className="flex justify-start mb-3">
                          <View className="bg-gray-100 px-4 py-2 rounded-2xl">
                            <Text className="block text-sm text-gray-400">思考中...</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Chat input */}
                  <View style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'flex-end' }}>
                    <View className="flex-1">
                      <Textarea
                        wrapperClassName="bg-gray-50 rounded-xl px-4 py-2"
                        className="w-full"
                        style={{ minHeight: '36px', maxHeight: '80px' }}
                        placeholder="输入你的问题..."
                        maxlength={500}
                        value={chatInput}
                        onInput={(e) => setChatInput(e.detail.value)}
                      />
                    </View>
                    <View
                      className={`rounded-xl p-2 ${chatInput.trim() && !chatLoading ? 'bg-green-500' : 'bg-gray-200'}`}
                      onClick={handleSendMessage}
                    >
                      <MessageSquare size={20} color={chatInput.trim() && !chatLoading ? '#fff' : '#9ca3af'} />
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ============ History Tab ============ */}
        {activeTab === 'history' && (
          <View>
            {/* History detail view */}
            {selectedHistory ? (
              <View>
                {/* Back button */}
                <View
                  className="flex flex-row items-center gap-1 mb-4"
                  onClick={() => setSelectedHistory(null)}
                >
                  <ChevronRight size={16} color="#4ECB71" className="rotate-180" />
                  <Text className="block text-sm" style={{ color: '#4ECB71' }}>返回列表</Text>
                </View>

                {/* History meta */}
                <View className="flex flex-row items-center justify-between mb-4">
                  <View className="flex flex-row items-center gap-2">
                    <View className="px-3 py-1 rounded-full bg-green-50">
                      <Text className="block text-xs font-medium text-green-600">{PLATFORM_LABEL_MAP[selectedHistory.platform] || selectedHistory.platform}</Text>
                    </View>
                    <Text className="block text-xs text-gray-400">{formatTime(selectedHistory.createdAt)}</Text>
                  </View>
                  <View
                    className="p-2 rounded-lg"
                    onClick={() => handleDeleteHistory(selectedHistory.id)}
                  >
                    <Trash2 size={16} color="#FF6B6B" />
                  </View>
                </View>

                {/* Bio preview */}
                {selectedHistory.bio && (
                  <View className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <Text className="block text-xs text-gray-400 mb-2">原文</Text>
                    <Text className="block text-sm text-gray-600 leading-relaxed">{selectedHistory.bio}</Text>
                  </View>
                )}

                {/* Analysis result */}
                {selectedHistory.analysisResult && renderAnalysisResult(selectedHistory.analysisResult)}
              </View>
            ) : (
              <View>
                {/* History list */}
                {historyLoading && historyList.length === 0 ? (
                  <View className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <Skeleton className="h-16 w-full mb-3" />
                    <Skeleton className="h-16 w-full mb-3" />
                    <Skeleton className="h-16 w-full" />
                  </View>
                ) : historyList.length === 0 ? (
                  <View className="flex items-center justify-center py-20">
                    <History size={48} color="#d1d5db" />
                    <Text className="block text-sm text-gray-400 mt-4">还没有诊断记录</Text>
                    <Text className="block text-xs text-gray-300 mt-1">完成首次诊断后会自动保存</Text>
                  </View>
                ) : (
                  historyList.map(item => {
                    const score = item.analysisResult?.overallScore || 0
                    return (
                      <View
                        key={item.id}
                        className="bg-white rounded-2xl p-4 mb-3"
                        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                        onClick={() => setSelectedHistory(item)}
                      >
                        <View className="flex flex-row items-center gap-3">
                          {/* Score circle */}
                          <View
                            className="flex items-center justify-center rounded-full flex-shrink-0"
                            style={{ width: '48px', height: '48px', backgroundColor: `${getScoreColor(score)}15` }}
                          >
                            <Text className="block text-lg font-bold" style={{ color: getScoreColor(score) }}>
                              {score}
                            </Text>
                          </View>
                          {/* Meta */}
                          <View className="flex-1 min-w-0">
                            <View className="flex flex-row items-center gap-2 mb-1">
                              <View className="px-2 py-0 rounded-full bg-green-50">
                                <Text className="block text-xs font-medium text-green-600">{PLATFORM_LABEL_MAP[item.platform] || item.platform}</Text>
                              </View>
                              <Text className="block text-xs text-gray-400">{formatTime(item.createdAt)}</Text>
                            </View>
                            <Text className="block text-sm text-gray-600 truncate">{item.bio || '无简介内容'}</Text>
                          </View>
                          {/* Arrow */}
                          <ChevronRight size={18} color="#d1d5db" />
                        </View>
                      </View>
                    )
                  })
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  )
}
