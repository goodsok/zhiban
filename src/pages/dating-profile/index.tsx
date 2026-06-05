import { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Sparkles, CircleCheck, CircleAlert, MessageCircle, Send, Loader, ChevronDown, History, Trash2, Clock } from 'lucide-react-taro'
import { Network } from '@/network'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ProfileAnalysis {
  overallScore: number
  strengths: string[]
  improvements: string[]
  suggestions: {
    field: string
    original: string
    suggested: string
    reason: string
  }[]
  summary: string
  isFallback?: boolean
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ProfileHistory {
  id: number
  platform: string
  nickname: string
  bio: string
  interests: string
  analysisResult: ProfileAnalysis
  createdAt: string
}

const platformOptions = [
  { value: 'tantan', label: '探探', icon: '💕', desc: '国内主流，左滑右滑' },
  { value: 'soul', label: 'Soul', icon: '🌙', desc: '灵魂社交，兴趣匹配' },
  { value: 'tinder', label: 'Tinder', icon: '🔥', desc: '国际化，简洁高效' },
  { value: 'momo', label: '陌陌', icon: '📍', desc: '附近的人，直接大方' },
  { value: 'bumble', label: 'Bumble', icon: '🐝', desc: '女性主动，高质量' },
  { value: 'hinge', label: 'Hinge', icon: '💫', desc: '严肃交友，长期关系' },
  { value: 'qingten', label: '青藤', icon: '🌱', desc: '高学历，优质青年' },
  { value: 'marryu', label: 'MarryU', icon: '💍', desc: '严肃婚恋，以结婚为目的' },
]

const interestOptions = [
  { value: 'music', label: '音乐', emoji: '🎵' },
  { value: 'movie', label: '电影', emoji: '🎬' },
  { value: 'travel', label: '旅行', emoji: '✈️' },
  { value: 'photography', label: '摄影', emoji: '📷' },
  { value: 'reading', label: '阅读', emoji: '📚' },
  { value: 'sports', label: '运动', emoji: '⚽' },
  { value: 'fitness', label: '健身', emoji: '💪' },
  { value: 'food', label: '美食', emoji: '🍜' },
  { value: 'cooking', label: '烹饪', emoji: '👨‍🍳' },
  { value: 'gaming', label: '游戏', emoji: '🎮' },
  { value: 'art', label: '艺术', emoji: '🎨' },
  { value: 'pet', label: '宠物', emoji: '🐕' },
  { value: 'outdoor', label: '户外', emoji: '🏕️' },
  { value: 'tech', label: '科技', emoji: '💻' },
  { value: 'fashion', label: '时尚', emoji: '👗' },
  { value: 'coffee', label: '咖啡', emoji: '☕' },
]

const PAGE_SIZE = 10

const DatingProfilePage: FC = () => {
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [platform, setPlatform] = useState('tantan')
  const [showPlatformPicker, setShowPlatformPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // 聊天相关状态
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // 历史记录相关状态
  const [showHistory, setShowHistory] = useState(false)
  const [historyList, setHistoryList] = useState<ProfileHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyOffset, setHistoryOffset] = useState(0)

  // 聊天自动滚动
  const chatScrollId = useRef('')

  useLoad(() => {
    console.log('Dating profile optimization page loaded.')
  })

  useEffect(() => {
    if (showHistory) {
      setHistoryOffset(0)
      loadHistory(0)
    }
  }, [showHistory])

  // 聊天新消息时自动滚动
  useEffect(() => {
    if (chatMessages.length > 0) {
      chatScrollId.current = `chat-msg-${chatMessages.length - 1}`
    }
  }, [chatMessages.length])

  const loadHistory = async (offset: number = 0) => {
    setHistoryLoading(true)
    try {
      const res = await Network.request({
        url: `/api/dating/profile/history?limit=${PAGE_SIZE}&offset=${offset}`,
        method: 'GET',
      })
      console.log('History response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        const newList = res.data.data.list || []
        setHistoryList(offset === 0 ? newList : [...historyList, ...newList])
        setHistoryTotal(res.data.data.total || 0)
        setHistoryOffset(offset)
      }
    } catch (error) {
      console.error('Load history error:', error)
      setErrorMsg('加载历史记录失败，请稍后重试')
    } finally {
      setHistoryLoading(false)
    }
  }

  const loadMoreHistory = () => {
    if (historyList.length < historyTotal) {
      loadHistory(historyOffset + PAGE_SIZE)
    }
  }

  const currentPlatform = platformOptions.find((p) => p.value === platform) || platformOptions[0]

  const toggleInterest = (value: string) => {
    setSelectedInterests((prev) => (prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]))
  }

  const getInterestsText = () => {
    return selectedInterests
      .map((v) => interestOptions.find((opt) => opt.value === v)?.label)
      .filter(Boolean)
      .join('、')
  }

  const canAnalyze = !loading && (bio.trim() || selectedInterests.length > 0 || nickname.trim())

  const handleAnalyze = async () => {
    const interestsText = getInterestsText()
    if (!bio.trim() && !interestsText && !nickname.trim()) {
      setErrorMsg('请至少填写昵称、简介或选择兴趣标签')
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      const res = await Network.request({
        url: '/api/dating/profile/optimize',
        method: 'POST',
        data: {
          nickname: nickname.trim(),
          bio: bio.trim(),
          interests: interestsText,
          platform,
        },
      })
      console.log('Profile optimization response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        const result = res.data.data
        setAnalysis(result)
        setShowChat(false)
        setChatMessages([])

        if (result.isFallback) {
          setErrorMsg('AI 分析遇到问题，以下为参考建议，建议稍后重试获取更精准的分析')
        }

        // 保存历史记录
        try {
          await Network.request({
            url: '/api/dating/profile/history',
            method: 'POST',
            data: {
              platform,
              nickname: nickname.trim(),
              bio: bio.trim(),
              interests: interestsText,
              analysisResult: result,
            },
          })
          console.log('History saved')
        } catch (saveError) {
          console.error('Save history error:', saveError)
        }
      } else {
        setErrorMsg('分析失败，请稍后重试')
      }
    } catch (error) {
      console.error('Profile optimization error:', error)
      setErrorMsg('网络错误，请检查网络后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setNickname('')
    setBio('')
    setSelectedInterests([])
    setAnalysis(null)
    setShowChat(false)
    setChatMessages([])
    setErrorMsg('')
  }

  const handleStartChat = () => {
    setShowChat(true)
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          role: 'assistant',
          content: `你好！我已经分析了你在${currentPlatform.label}上的资料，有什么问题想问我吗？比如想了解为什么某个建议更好，或者有其他想法想讨论～`,
        },
      ])
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading || !analysis) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setChatLoading(true)

    try {
      const res = await Network.request({
        url: '/api/dating/profile/chat',
        method: 'POST',
        data: {
          nickname: nickname.trim(),
          bio: bio.trim(),
          interests: getInterestsText(),
          platform,
          analysis,
          messages: chatMessages,
          currentMessage: userMessage,
        },
      })

      console.log('Chat response:', res.data)

      if (res.data?.code === 200 && res.data?.data?.reply) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: res.data.data.reply }])
      } else {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: '抱歉，分析遇到了问题，请稍后再试。' }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages((prev) => [...prev, { role: 'assistant', content: '网络错误，请检查网络后重试。' }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleLoadHistory = (history: ProfileHistory) => {
    setPlatform(history.platform)
    setNickname(history.nickname || '')
    setBio(history.bio || '')
    if (history.interests) {
      const interestLabels = history.interests.split(/[,、，]/).map((s) => s.trim())
      const values = interestLabels.map((label) => interestOptions.find((opt) => opt.label === label)?.value).filter(Boolean) as string[]
      setSelectedInterests(values)
    } else {
      setSelectedInterests([])
    }
    setAnalysis(history.analysisResult)
    setShowHistory(false)
    setShowChat(false)
    setChatMessages([])
    setErrorMsg('')
  }

  const handleDeleteHistory = async (id: number, e: any) => {
    e.stopPropagation()
    try {
      const res = await Network.request({
        url: `/api/dating/profile/history/${id}`,
        method: 'DELETE',
      })

      if (res.data?.code === 200) {
        setHistoryList((prev) => prev.filter((h) => h.id !== id))
        setHistoryTotal((prev) => prev - 1)
      }
    } catch (error) {
      console.error('Delete history error:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hour}:${minute}`
  }

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部说明 */}
      <View className="bg-blue-50 px-4 py-3">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center flex-1">
            <Sparkles size={18} color="#3b82f6" />
            <Text className="block text-sm text-blue-700 ml-2">输入你当前的交友软件资料，AI 将给出专业优化建议</Text>
          </View>
          <View
            className="flex flex-row items-center px-3 py-1 bg-white rounded-full"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={16} color="#3b82f6" />
            <Text className="text-xs text-blue-600 ml-1">历史</Text>
          </View>
        </View>
      </View>

      {/* 错误提示 */}
      {errorMsg && (
        <View className="mx-4 mt-3 bg-red-50 rounded-xl px-4 py-3 flex flex-row items-center">
          <CircleAlert size={16} color="#ef4444" />
          <Text className="text-sm text-red-600 ml-2 flex-1">{errorMsg}</Text>
          <View onClick={() => setErrorMsg('')}>
            <Text className="text-xs text-red-400">关闭</Text>
          </View>
        </View>
      )}

      {/* 历史记录列表 */}
      {showHistory && (
        <View className="bg-white border-b">
          <View className="px-4 py-3 border-b">
            <Text className="text-sm font-medium text-gray-900">历史记录</Text>
          </View>

          {historyLoading && historyList.length === 0 ? (
            <View className="px-4 py-8 flex flex-col items-center">
              <Loader size={20} color="#9ca3af" className="animate-spin" />
              <Text className="text-sm text-gray-400 mt-2">加载中...</Text>
            </View>
          ) : historyList.length === 0 ? (
            <View className="px-4 py-8 flex flex-col items-center">
              <Clock size={24} color="#d1d5db" />
              <Text className="text-sm text-gray-400 mt-2">暂无历史记录</Text>
            </View>
          ) : (
            <ScrollView scrollY className="max-h-80">
              {historyList.map((history) => {
                const platformInfo = platformOptions.find((p) => p.value === history.platform)
                return (
                  <View
                    key={history.id}
                    className="px-4 py-3 border-b border-gray-100 flex flex-row items-center justify-between active:bg-gray-50"
                    onClick={() => handleLoadHistory(history)}
                  >
                    <View className="flex-1 mr-3">
                      <View className="flex flex-row items-center mb-1">
                        <Text className="text-sm mr-1">{platformInfo?.icon}</Text>
                        <Text className="text-sm font-medium text-gray-900">
                          {history.bio ? history.bio.substring(0, 20) + '...' : '无简介'}
                        </Text>
                        <Text className="text-xs text-gray-400 ml-2">{formatDate(history.createdAt)}</Text>
                      </View>
                      <View className="flex flex-row items-center">
                        <View className="bg-blue-100 rounded-full px-2 py-1 mr-2">
                          <Text className="text-xs text-blue-600">{history.analysisResult.overallScore}分</Text>
                        </View>
                        {history.interests && (
                          <Text className="text-xs text-gray-400 line-clamp-1 flex-1">{history.interests}</Text>
                        )}
                      </View>
                    </View>
                    <View className="p-2 rounded-lg active:bg-gray-100" onClick={(e) => handleDeleteHistory(history.id, e)}>
                      <Trash2 size={16} color="#9ca3af" />
                    </View>
                  </View>
                )
              })}
              {historyList.length < historyTotal && (
                <View className="px-4 py-3 flex flex-col items-center" onClick={loadMoreHistory}>
                  <Text className="text-xs text-blue-500">{historyLoading ? '加载中...' : '加载更多'}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}

      {/* 输入表单 */}
      <View className="p-4">
        {/* 平台选择 */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">选择平台</CardTitle>
          </CardHeader>
          <CardContent>
            <View
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex flex-row items-center justify-between"
              onClick={() => setShowPlatformPicker(!showPlatformPicker)}
            >
              <View className="flex flex-row items-center">
                <Text className="text-lg mr-2">{currentPlatform.icon}</Text>
                <Text className="text-sm text-gray-700">{currentPlatform.label}</Text>
                <Text className="text-xs text-gray-400 ml-2">{currentPlatform.desc}</Text>
              </View>
              <ChevronDown size={18} color="#9ca3af" />
            </View>

            {showPlatformPicker && (
              <View className="mt-2 bg-white rounded-xl overflow-hidden">
                {platformOptions.map((option) => (
                  <View
                    key={option.value}
                    className={`px-4 py-3 flex flex-row items-center justify-between ${platform === option.value ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      setPlatform(option.value)
                      setShowPlatformPicker(false)
                    }}
                  >
                    <View className="flex flex-row items-center">
                      <Text className="text-lg mr-2">{option.icon}</Text>
                      <View>
                        <Text className="text-sm text-gray-700">{option.label}</Text>
                        <Text className="text-xs text-gray-400">{option.desc}</Text>
                      </View>
                    </View>
                    {platform === option.value && <Text className="text-blue-500">✓</Text>}
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 昵称输入 */}
            <View className="mb-4">
              <Text className="block text-sm font-medium text-gray-700 mb-2">昵称</Text>
              <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Input
                  style={{ width: '100%', backgroundColor: 'transparent' }}
                  placeholder="输入你在交友软件上的昵称..."
                  maxlength={30}
                  value={nickname}
                  onInput={(e) => setNickname(e.detail.value)}
                />
              </View>
              <Text className="block text-xs text-gray-400 mt-1">{nickname.length}/30</Text>
            </View>

            {/* 个人简介 */}
            <View className="mb-4">
              <Text className="block text-sm font-medium text-gray-700 mb-2">个人简介</Text>
              <View className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <Textarea
                  style={{ width: '100%', height: '256px', backgroundColor: 'transparent' }}
                  placeholder="粘贴你的个人简介..."
                  maxlength={500}
                  value={bio}
                  onInput={(e) => setBio(e.detail.value)}
                />
              </View>
              <Text className="block text-xs text-gray-400 mt-1">{bio.length}/500</Text>
            </View>

            {/* 兴趣标签 */}
            <View>
              <Text className="block text-sm font-medium text-gray-700 mb-2">兴趣标签</Text>
              <View className="flex flex-row flex-wrap gap-2">
                {interestOptions.map((option) => {
                  const isSelected = selectedInterests.includes(option.value)
                  return (
                    <View
                      key={option.value}
                      className={`rounded-full px-3 py-2 flex flex-row items-center ${isSelected ? 'bg-blue-500' : 'bg-gray-100'}`}
                      onClick={() => toggleInterest(option.value)}
                    >
                      <Text className="text-sm mr-1">{option.emoji}</Text>
                      <Text className={`text-sm ${isSelected ? 'text-white' : 'text-gray-700'}`}>{option.label}</Text>
                    </View>
                  )
                })}
              </View>
              {selectedInterests.length > 0 && (
                <Text className="block text-xs text-gray-400 mt-2">已选择 {selectedInterests.length} 个标签</Text>
              )}
            </View>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <View className="flex flex-row gap-3 mb-4">
          <View className="flex-1">
            <Button variant="default" className="bg-blue-500 text-white rounded-xl" disabled={!canAnalyze} onClick={handleAnalyze}>
              <Text className="text-white">{loading ? '分析中...' : '开始分析'}</Text>
            </Button>
          </View>
          <View className="flex-1">
            <Button variant="secondary" className="rounded-xl" onClick={handleReset}>
              <Text>重置</Text>
            </Button>
          </View>
        </View>

        {/* 空状态引导 */}
        {!analysis && !loading && !nickname.trim() && !bio.trim() && selectedInterests.length === 0 && (
          <View className="py-6 flex flex-col items-center">
            <Sparkles size={32} color="#d1d5db" />
            <Text className="text-sm text-gray-400 mt-3">填写昵称、简介或选择兴趣标签后开始分析</Text>
            <Text className="text-xs text-gray-300 mt-1">至少填写一项即可获取 AI 优化建议</Text>
          </View>
        )}

        {/* 分析结果 */}
        {analysis && (
          <View>
            {/* 兜底提示 */}
            {analysis.isFallback && (
              <View className="bg-amber-50 rounded-xl px-4 py-3 mb-4 flex flex-row items-center">
                <CircleAlert size={16} color="#f59e0b" />
                <Text className="text-xs text-amber-600 ml-2 flex-1">AI 分析遇到问题，以下为参考建议，建议稍后重试获取更精准结果</Text>
              </View>
            )}

            {/* 平台标签 */}
            <View className="flex flex-row items-center justify-center mb-4">
              <View className="bg-blue-100 rounded-full px-3 py-1 flex flex-row items-center">
                <Text className="text-sm mr-1">{currentPlatform.icon}</Text>
                <Text className="text-xs text-blue-600">{currentPlatform.label} 专属建议</Text>
              </View>
            </View>

            {/* 总体评分 */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 mb-4">
              <CardContent className="py-6">
                <View className="flex flex-col items-center">
                  <Text className="block text-sm text-blue-100 mb-2">资料吸引力评分</Text>
                  <Text className="block text-5xl font-bold text-white">{analysis.overallScore}</Text>
                  <Text className="block text-xs text-blue-200 mt-1">/ 100分</Text>
                </View>
              </CardContent>
            </Card>

            {/* 优势 */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <View className="flex flex-row items-center">
                  <CircleCheck size={18} color="#22c55e" />
                  <Text className="block text-base font-semibold text-gray-900 ml-2">当前优势</Text>
                </View>
              </CardHeader>
              <CardContent>
                {analysis.strengths.map((strength, index) => (
                  <View key={index} className="flex flex-row items-start mb-2">
                    <Text className="block text-green-500 mr-2">✓</Text>
                    <Text className="block text-sm text-gray-700 flex-1">{strength}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>

            {/* 需要改进 */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <View className="flex flex-row items-center">
                  <CircleAlert size={18} color="#f59e0b" />
                  <Text className="block text-base font-semibold text-gray-900 ml-2">改进建议</Text>
                </View>
              </CardHeader>
              <CardContent>
                {analysis.improvements.map((improvement, index) => (
                  <View key={index} className="flex flex-row items-start mb-2">
                    <Text className="block text-amber-500 mr-2">!</Text>
                    <Text className="block text-sm text-gray-700 flex-1">{improvement}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>

            {/* 具体优化建议 */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <Text className="block text-base font-semibold text-gray-900">优化方案</Text>
              </CardHeader>
              <CardContent>
                {analysis.suggestions.length > 0 ? (
                  analysis.suggestions.map((suggestion, index) => (
                    <View key={index} className="mb-4 pb-4 border-b last:border-0 last:mb-0 last:pb-0">
                      <Text className="block text-sm font-medium text-gray-900 mb-2">{suggestion.field}</Text>
                      <View className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
                        <Text className="block text-xs text-gray-500 mb-1">原文：</Text>
                        <Text className="block text-sm text-gray-600">{suggestion.original || '（未填写）'}</Text>
                      </View>
                      <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                        <Text className="block text-xs text-green-600 mb-1">建议修改为：</Text>
                        <Text className="block text-sm text-green-700">{suggestion.suggested}</Text>
                      </View>
                      <Text className="block text-xs text-gray-500 italic">{suggestion.reason}</Text>
                    </View>
                  ))
                ) : (
                  <View className="py-4 flex flex-col items-center">
                    <Text className="text-sm text-gray-400">暂无具体优化建议</Text>
                    <Text className="text-xs text-gray-300 mt-1">资料整体表现不错，继续保持～</Text>
                  </View>
                )}
              </CardContent>
            </Card>

            {/* 总结 */}
            <Card className="bg-blue-50 mb-4">
              <CardContent className="py-4">
                <Text className="block text-sm text-blue-700 leading-relaxed">{analysis.summary}</Text>
              </CardContent>
            </Card>

            {/* AI聊天按钮 */}
            {!showChat && (
              <Button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl py-3" onClick={handleStartChat}>
                <View className="flex flex-row items-center justify-center">
                  <MessageCircle size={18} color="#fff" />
                  <Text className="text-white ml-2 font-medium">继续和 AI 深入讨论</Text>
                </View>
              </Button>
            )}

            {/* AI聊天界面 */}
            {showChat && (
              <Card>
                <CardHeader className="pb-3">
                  <View className="flex flex-row items-center">
                    <MessageCircle size={18} color="#3b82f6" />
                    <Text className="block text-base font-semibold text-gray-900 ml-2">AI 顾问对话</Text>
                    <View className="ml-auto bg-blue-100 rounded-full px-2 py-1">
                      <Text className="text-xs text-blue-600">{currentPlatform.label}</Text>
                    </View>
                  </View>
                </CardHeader>
                <CardContent>
                  {/* 聊天消息列表 */}
                  <ScrollView scrollY scrollIntoView={chatScrollId.current} className="max-h-80 mb-3">
                    {chatMessages.map((msg, index) => (
                      <View
                        key={index}
                        id={`chat-msg-${index}`}
                        className={`mb-3 ${msg.role === 'user' ? 'flex flex-row justify-end' : ''}`}
                      >
                        <View className={`rounded-xl px-4 py-2 max-w-[85%] ${msg.role === 'user' ? 'bg-blue-500' : 'bg-gray-100'}`}>
                          <Text className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-700'}`}>
                            {msg.content}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {chatLoading && (
                      <View className="flex flex-row items-center mb-3">
                        <View className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-2">
                          <View className="flex flex-row items-center">
                            <Loader size={14} color="#6b7280" className="animate-spin" />
                            <Text className="text-sm text-gray-500 ml-2">思考中...</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </ScrollView>

                  {/* 输入框 */}
                  <View className="flex flex-row gap-2 items-end">
                    <View className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                      <Textarea
                        style={{ width: '100%', minHeight: '36px', maxHeight: '80px', backgroundColor: 'transparent' }}
                        placeholder="输入你的问题..."
                        maxlength={500}
                        value={chatInput}
                        onInput={(e) => setChatInput(e.detail.value)}
                      />
                    </View>
                    <View
                      className={`rounded-xl p-2 ${chatInput.trim() && !chatLoading ? 'bg-blue-500' : 'bg-gray-200'}`}
                      onClick={handleSendMessage}
                    >
                      <Send size={20} color={chatInput.trim() && !chatLoading ? '#fff' : '#9ca3af'} />
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}
          </View>
        )}
      </View>
    </View>
  )
}

export default DatingProfilePage
