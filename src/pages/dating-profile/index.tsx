import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Sparkles, CircleCheck, CircleAlert, MessageCircle, Send, Loader, ChevronDown, History, Trash2, Clock } from 'lucide-react-taro'
import { Network } from '@/network'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

// 平台选项
const platformOptions = [
  { value: 'tantan', label: '探探', icon: '💕', desc: '国内主流，左滑右滑' },
  { value: 'soul', label: 'Soul', icon: '🌙', desc: '灵魂社交，兴趣匹配' },
  { value: 'tinder', label: 'Tinder', icon: '🔥', desc: '国际化，简洁高效' },
  { value: 'momo', label: '陌陌', icon: '📍', desc: '附近的人，直接大方' },
  { value: 'bumble', label: 'Bumble', icon: '🐝', desc: '女性主动，高质量' },
  { value: 'hinge', label: 'Hinge', icon: '💫', desc: '严肃交友，长期关系' },
]

const DatingProfilePage: FC = () => {
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState('')
  const [platform, setPlatform] = useState('tantan')
  const [showPlatformPicker, setShowPlatformPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null)
  
  // 聊天相关状态
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // 历史记录相关状态
  const [showHistory, setShowHistory] = useState(false)
  const [historyList, setHistoryList] = useState<ProfileHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useLoad(() => {
    console.log('Dating profile optimization page loaded.')
  })

  // 加载历史记录
  useEffect(() => {
    if (showHistory) {
      loadHistory()
    }
  }, [showHistory])

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await Network.request({
        url: '/api/dating/profile/history',
        method: 'GET',
      })
      console.log('History response:', res.data)

      if (res.data?.code === 200 && res.data?.data?.list) {
        setHistoryList(res.data.data.list)
      }
    } catch (error) {
      console.error('Load history error:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const currentPlatform = platformOptions.find(p => p.value === platform) || platformOptions[0]

  const handleAnalyze = async () => {
    if (!bio.trim() && !interests.trim()) {
      return
    }

    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/dating/profile/optimize',
        method: 'POST',
        data: {
          bio: bio.trim(),
          interests: interests.trim(),
          platform,
        },
      })
      console.log('Profile optimization response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        const result = res.data.data
        setAnalysis(result)
        // 重置聊天状态
        setShowChat(false)
        setChatMessages([])

        // 保存历史记录
        try {
          await Network.request({
            url: '/api/dating/profile/history',
            method: 'POST',
            data: {
              platform,
              bio: bio.trim(),
              interests: interests.trim(),
              analysisResult: result,
            },
          })
          console.log('History saved')
        } catch (saveError) {
          console.error('Save history error:', saveError)
        }
      }
    } catch (error) {
      console.error('Profile optimization error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setBio('')
    setInterests('')
    setAnalysis(null)
    setShowChat(false)
    setChatMessages([])
  }

  const handleStartChat = () => {
    setShowChat(true)
    // 添加欢迎消息
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          role: 'assistant',
          content: `你好！我已经分析了你在${currentPlatform.label}上的资料，有什么问题想问我吗？比如想了解为什么某个建议更好，或者有其他想法想讨论～`
        }
      ])
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading || !analysis) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatLoading(true)

    try {
      const res = await Network.request({
        url: '/api/dating/profile/chat',
        method: 'POST',
        data: {
          bio: bio.trim(),
          interests: interests.trim(),
          platform,
          analysis,
          messages: chatMessages,
          currentMessage: userMessage,
        },
      })

      console.log('Chat response:', res.data)

      if (res.data?.code === 200 && res.data?.data?.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.data.reply }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，我暂时无法回答这个问题，请稍后再试。' 
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleLoadHistory = (history: ProfileHistory) => {
    setPlatform(history.platform)
    setBio(history.bio || '')
    setInterests(history.interests || '')
    setAnalysis(history.analysisResult)
    setShowHistory(false)
    setShowChat(false)
    setChatMessages([])
  }

  const handleDeleteHistory = async (id: number, e: any) => {
    e.stopPropagation()
    try {
      const res = await Network.request({
        url: `/api/dating/profile/history/${id}`,
        method: 'DELETE',
      })

      if (res.data?.code === 200) {
        setHistoryList(prev => prev.filter(h => h.id !== id))
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
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部说明 */}
      <View className="bg-blue-50 px-4 py-3">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center flex-1">
            <Sparkles size={18} color="#3b82f6" />
            <Text className="block text-sm text-blue-700 ml-2">
              输入你当前的交友软件资料，AI 将给出专业优化建议
            </Text>
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

      {/* 历史记录列表 */}
      {showHistory && (
        <View className="bg-white border-b border-gray-100">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-sm font-medium text-gray-900">历史记录</Text>
          </View>
          
          {historyLoading ? (
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
                const platformInfo = platformOptions.find(p => p.value === history.platform)
                return (
                  <View
                    key={history.id}
                    className="px-4 py-3 border-b border-gray-50 flex flex-row items-center justify-between active:bg-gray-50"
                    onClick={() => handleLoadHistory(history)}
                  >
                    <View className="flex-1 mr-3">
                      <View className="flex flex-row items-center mb-1">
                        <Text className="text-sm mr-1">{platformInfo?.icon}</Text>
                        <Text className="text-sm font-medium text-gray-900">
                          {history.bio ? history.bio.substring(0, 20) + '...' : '无简介'}
                        </Text>
                        <Text className="text-xs text-gray-400 ml-2">
                          {formatDate(history.createdAt)}
                        </Text>
                      </View>
                      <View className="flex flex-row items-center">
                        <View className="bg-blue-100 rounded-full px-2 py-1 mr-2">
                          <Text className="text-xs text-blue-600">{history.analysisResult.overallScore}分</Text>
                        </View>
                        {history.interests && (
                          <Text className="text-xs text-gray-400 line-clamp-1 flex-1">
                            {history.interests}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View
                      className="p-2 rounded-lg active:bg-gray-100"
                      onClick={(e) => handleDeleteHistory(history.id, e)}
                    >
                      <Trash2 size={16} color="#9ca3af" />
                    </View>
                  </View>
                )
              })}
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
              className="bg-gray-50 rounded-xl px-4 py-3 flex flex-row items-center justify-between"
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
              <View className="mt-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
                {platformOptions.map((option) => (
                  <View
                    key={option.value}
                    className={`px-4 py-3 flex flex-row items-center justify-between ${
                      platform === option.value ? 'bg-blue-50' : ''
                    }`}
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
                    {platform === option.value && (
                      <Text className="text-blue-500">✓</Text>
                    )}
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
          <CardContent className="space-y-4">
            {/* 个人简介 */}
            <View>
              <Text className="block text-sm font-medium text-gray-700 mb-2">个人简介</Text>
              <View className="bg-gray-50 rounded-xl p-4">
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
              <View className="bg-gray-50 rounded-xl p-4">
                <Textarea
                  style={{ width: '100%', height: '96px', backgroundColor: 'transparent' }}
                  placeholder="输入你的兴趣标签，用逗号分隔..."
                  maxlength={200}
                  value={interests}
                  onInput={(e) => setInterests(e.detail.value)}
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <View className="flex flex-row gap-3 mb-4">
          <View className="flex-1">
            <Button
              variant="default"
              className="bg-blue-500 text-white rounded-xl"
              disabled={loading || (!bio.trim() && !interests.trim())}
              onClick={handleAnalyze}
            >
              <Text className="text-white">{loading ? '分析中...' : '开始分析'}</Text>
            </Button>
          </View>
          <View className="flex-1">
            <Button
              variant="secondary"
              className="rounded-xl"
              onClick={handleReset}
            >
              <Text>重置</Text>
            </Button>
          </View>
        </View>

        {/* 分析结果 */}
        {analysis && (
          <View className="space-y-4">
            {/* 平台标签 */}
            <View className="flex flex-row items-center justify-center">
              <View className="bg-blue-100 rounded-full px-3 py-1 flex flex-row items-center">
                <Text className="text-sm mr-1">{currentPlatform.icon}</Text>
                <Text className="text-xs text-blue-600">{currentPlatform.label} 专属建议</Text>
              </View>
            </View>

            {/* 总体评分 */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600">
              <CardContent className="py-6">
                <View className="flex flex-col items-center">
                  <Text className="block text-sm text-blue-100 mb-2">资料吸引力评分</Text>
                  <Text className="block text-5xl font-bold text-white">{analysis.overallScore}</Text>
                  <Text className="block text-xs text-blue-200 mt-1">/ 100分</Text>
                </View>
              </CardContent>
            </Card>

            {/* 优势 */}
            <Card>
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
            <Card>
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
            <Card>
              <CardHeader className="pb-3">
                <Text className="block text-base font-semibold text-gray-900">优化方案</Text>
              </CardHeader>
              <CardContent>
                {analysis.suggestions.length > 0 ? (
                  analysis.suggestions.map((suggestion, index) => (
                    <View key={index} className="mb-4 pb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                      <Text className="block text-sm font-medium text-gray-900 mb-2">
                        {suggestion.field}
                      </Text>
                      <View className="bg-gray-50 rounded-lg p-3 mb-2">
                        <Text className="block text-xs text-gray-500 mb-1">原文：</Text>
                        <Text className="block text-sm text-gray-600">{suggestion.original || '（未填写）'}</Text>
                      </View>
                      <View className="bg-green-50 rounded-lg p-3 mb-2">
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
            <Card className="bg-blue-50">
              <CardContent className="py-4">
                <Text className="block text-sm text-blue-700 leading-relaxed">{analysis.summary}</Text>
              </CardContent>
            </Card>

            {/* AI聊天按钮 */}
            {!showChat && (
              <Button
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl py-3"
                onClick={handleStartChat}
              >
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
                  <ScrollView scrollY className="max-h-80 mb-3">
                    {chatMessages.map((msg, index) => (
                      <View
                        key={index}
                        className={`mb-3 ${msg.role === 'user' ? 'flex flex-row justify-end' : ''}`}
                      >
                        <View
                          className={`rounded-xl px-4 py-2 max-w-[85%] ${
                            msg.role === 'user'
                              ? 'bg-blue-500'
                              : 'bg-gray-100'
                          }`}
                        >
                          <Text
                            className={`text-sm leading-relaxed ${
                              msg.role === 'user' ? 'text-white' : 'text-gray-700'
                            }`}
                          >
                            {msg.content}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {chatLoading && (
                      <View className="flex flex-row items-center mb-3">
                        <View className="bg-gray-100 rounded-xl px-4 py-2">
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
                    <View className="flex-1 bg-gray-50 rounded-xl px-4 py-2">
                      <Textarea
                        style={{ width: '100%', minHeight: '36px', maxHeight: '80px', backgroundColor: 'transparent' }}
                        placeholder="输入你的问题..."
                        maxlength={500}
                        value={chatInput}
                        onInput={(e) => setChatInput(e.detail.value)}
                      />
                    </View>
                    <View
                      className={`rounded-xl p-2 ${
                        chatInput.trim() && !chatLoading
                          ? 'bg-blue-500'
                          : 'bg-gray-200'
                      }`}
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
