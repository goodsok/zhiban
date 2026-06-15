import { useState, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import CustomHeader from '@/components/custom-header'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, MessageSquare, Copy, Check, Lightbulb, Star, TrendingUp } from 'lucide-react-taro'
import { Network } from '@/network'

// --- Types ---
interface ProfileAnalysis {
  overallScore: number
  strengths: string[]
  improvements: string[]
  suggestions: string[]
  summary: string
  chatStyle?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// --- Platform options ---
const PLATFORMS = [
  { value: 'soul', label: 'Soul' },
  { value: 'tantan', label: '探探' },
  { value: 'wechat', label: '微信' },
  { value: 'momo', label: '陌陌' },
  { value: 'other', label: '其他' },
]

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

export default function DatingProfilePage() {
  const router = Taro.useRouter()
  const matchId = router.params.matchId ? Number(router.params.matchId) : undefined

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
      } else {
        Taro.showToast({ title: '分析失败，请重试', icon: 'none' })
      }
    } catch (err) {
      console.error('[DatingProfile] analyze error:', err)
      Taro.showToast({ title: '网络错误', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [profileText, platform, matchId])

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
          message: userMsg,
          profileText,
          platform,
          analysis,
          matchId
        }
      })
      const data = res.data?.data
      if (data?.response) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      }
    } catch {
      Taro.showToast({ title: '发送失败', icon: 'none' })
    } finally {
      setChatLoading(false)
    }
  }, [chatInput, chatLoading, profileText, platform, analysis, matchId])

  // --- Copy ---
  const handleCopy = useCallback((text: string, idx: number) => {
    Taro.setClipboardData({ data: text })
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(-1), 1500)
  }, [])

  // --- Render ---
  return (
    <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="形象诊断" />

      <View className="px-4 pt-4 pb-20">
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
            {/* Score card */}
            <View className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <View className="flex flex-row items-center gap-4 mb-4">
                <View
                  className="flex items-center justify-center rounded-full"
                  style={{ width: '64px', height: '64px', backgroundColor: `${getScoreColor(analysis.overallScore)}15` }}
                >
                  <Text className="block text-2xl font-bold" style={{ color: getScoreColor(analysis.overallScore) }}>
                    {analysis.overallScore}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="block text-lg font-semibold text-gray-800">形象评分</Text>
                  <Text className="block text-sm mt-1" style={{ color: getScoreColor(analysis.overallScore) }}>
                    {getScoreLabel(analysis.overallScore)}
                  </Text>
                  {analysis.chatStyle && (
                    <Text className="block text-xs text-gray-400 mt-1">聊天风格：{analysis.chatStyle}</Text>
                  )}
                </View>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${getScoreColor(analysis.overallScore)}15` }}
                >
                  <Text className="block text-xs font-medium" style={{ color: getScoreColor(analysis.overallScore) }}>
                    {getScoreLabel(analysis.overallScore)}
                  </Text>
                </View>
              </View>
              {/* Score bar */}
              <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${analysis.overallScore}%`,
                    backgroundColor: getScoreColor(analysis.overallScore)
                  }}
                />
              </View>
            </View>

            {/* Strengths */}
            {analysis.strengths?.length > 0 && (
              <View className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <View className="flex flex-row items-center gap-2 mb-3">
                  <Star size={18} color="#4ECB71" />
                  <Text className="block text-base font-semibold text-gray-800">亮点</Text>
                </View>
                {analysis.strengths.map((s, i) => (
                  <View key={i} className="flex flex-row items-start gap-2 mb-2 last:mb-0">
                    <View className="mt-1 w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
                    <Text className="block text-sm text-gray-600 leading-relaxed">{s}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Improvements */}
            {analysis.improvements?.length > 0 && (
              <View className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <View className="flex flex-row items-center gap-2 mb-3">
                  <TrendingUp size={18} color="#F5A623" />
                  <Text className="block text-base font-semibold text-gray-800">待提升</Text>
                </View>
                {analysis.improvements.map((s, i) => (
                  <View key={i} className="flex flex-row items-start gap-2 mb-2 last:mb-0">
                    <View className="mt-1 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                    <Text className="block text-sm text-gray-600 leading-relaxed">{s}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Suggestions */}
            {analysis.suggestions?.length > 0 && (
              <View className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <View className="flex flex-row items-center gap-2 mb-3">
                  <Lightbulb size={18} color="#4ECB71" />
                  <Text className="block text-base font-semibold text-gray-800">优化建议</Text>
                </View>
                {analysis.suggestions.map((s, i) => (
                  <View key={i} className="mb-3 last:mb-0 p-3 bg-green-50 rounded-xl">
                    <View className="flex flex-row items-start justify-between gap-2">
                      <Text className="block text-sm text-gray-700 leading-relaxed flex-1">{s}</Text>
                      <View onClick={() => handleCopy(s, i)} className="flex-shrink-0 mt-1">
                        {copiedIdx === i ? (
                          <Check size={16} color="#4ECB71" />
                        ) : (
                          <Copy size={16} color="#9ca3af" />
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Summary */}
            {analysis.summary && (
              <View className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <Text className="block text-sm text-gray-500 mb-2">综合评价</Text>
                <Text className="block text-sm text-gray-700 leading-relaxed">{analysis.summary}</Text>
              </View>
            )}

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
    </View>
  )
}
