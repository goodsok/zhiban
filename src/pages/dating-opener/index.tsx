import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { MessageCircle, RefreshCw, Sparkles, Copy, Check, ChevronDown, History, Trash2, Clock, CircleAlert, Loader, User } from 'lucide-react-taro'
import { Network } from '@/network'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface OpenerResult {
  openers: {
    category: string
    style: string
    content: string
    reason: string
  }[]
  summary: string
  isFallback?: boolean
}

interface OpenerHistory {
  id: number
  platform: string
  targetProfile: string
  selfProfile: string
  result: OpenerResult
  createdAt: string
}

const platformOptions = [
  { value: 'tantan', label: '探探', icon: '💕', desc: '轻松活泼，先破冰' },
  { value: 'soul', label: 'Soul', icon: '🌙', desc: '灵魂交流，走心开场' },
  { value: 'tinder', label: 'Tinder', icon: '🔥', desc: '简洁直接，不拖泥带水' },
  { value: 'momo', label: '陌陌', icon: '📍', desc: '大方直接，展示自信' },
  { value: 'bumble', label: 'Bumble', icon: '🐝', desc: '女性主动，高质量开场' },
  { value: 'hinge', label: 'Hinge', icon: '💫', desc: '真诚有趣，回应 Prompt' },
  { value: 'qingten', label: '青藤', icon: '🌱', desc: '真诚得体，展示修养' },
  { value: 'marryu', label: 'MarryU', icon: '💍', desc: '真诚稳重，以婚恋为目标' },
]

const PAGE_SIZE = 10

const DatingOpenerPage: FC = () => {
  const [targetProfile, setTargetProfile] = useState('')
  const [selfProfile, setSelfProfile] = useState('')
  const [platform, setPlatform] = useState('tantan')
  const [showPlatformPicker, setShowPlatformPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OpenerResult | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // 历史记录
  const [showHistory, setShowHistory] = useState(false)
  const [historyList, setHistoryList] = useState<OpenerHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyOffset, setHistoryOffset] = useState(0)

  const currentPlatform = platformOptions.find((p) => p.value === platform) || platformOptions[0]

  useLoad(() => {
    console.log('Dating opener generation page loaded.')
  })

  useEffect(() => {
    if (showHistory) {
      setHistoryOffset(0)
      loadHistory(0)
    }
  }, [showHistory])

  const loadHistory = async (offset: number = 0) => {
    setHistoryLoading(true)
    try {
      const res = await Network.request({
        url: `/api/dating/opener/history?limit=${PAGE_SIZE}&offset=${offset}`,
        method: 'GET',
      })
      console.log('Opener history response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        const newList = res.data.data.list || []
        setHistoryList(offset === 0 ? newList : [...historyList, ...newList])
        setHistoryTotal(res.data.data.total || 0)
        setHistoryOffset(offset)
      }
    } catch (error) {
      console.error('Load opener history error:', error)
      setErrorMsg('加载历史记录失败')
    } finally {
      setHistoryLoading(false)
    }
  }

  const loadMoreHistory = () => {
    if (historyList.length < historyTotal) {
      loadHistory(historyOffset + PAGE_SIZE)
    }
  }

  const canGenerate = !loading && targetProfile.trim()

  const handleGenerate = async () => {
    if (!targetProfile.trim()) {
      setErrorMsg('请输入对方资料描述')
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      const res = await Network.request({
        url: '/api/dating/opener/generate',
        method: 'POST',
        data: {
          targetProfile: targetProfile.trim(),
          selfProfile: selfProfile.trim(),
          platform,
        },
      })
      console.log('Opener generation response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        const data = res.data.data
        setResult(data)

        if (data.isFallback) {
          setErrorMsg('AI 生成遇到问题，以下为参考建议，建议稍后重试')
        }

        // 保存历史记录
        try {
          await Network.request({
            url: '/api/dating/opener/history',
            method: 'POST',
            data: {
              platform,
              targetProfile: targetProfile.trim(),
              selfProfile: selfProfile.trim(),
              result: data,
            },
          })
          console.log('Opener history saved')
        } catch (saveError) {
          console.error('Save opener history error:', saveError)
        }
      } else {
        setErrorMsg('开场白生成失败，请稍后重试')
      }
    } catch (error) {
      console.error('Opener generation error:', error)
      setErrorMsg('网络错误，请检查网络后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = () => {
    handleGenerate()
  }

  const handleReset = () => {
    setTargetProfile('')
    setSelfProfile('')
    setResult(null)
    setCopiedIndex(null)
    setErrorMsg('')
  }

  const handleCopy = async (content: string, index: string) => {
    try {
      // 使用 Taro.setClipboardData 复制
      const Taro = require('@tarojs/taro')
      Taro.setClipboardData({ data: content })
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error('Copy error:', error)
    }
  }

  const handleDeleteHistory = async (id: number, e: any) => {
    e.stopPropagation()
    try {
      const res = await Network.request({
        url: `/api/dating/opener/history/${id}`,
        method: 'DELETE',
      })
      if (res.data?.code === 200) {
        setHistoryList((prev) => prev.filter((h) => h.id !== id))
        setHistoryTotal((prev) => prev - 1)
      }
    } catch (error) {
      console.error('Delete opener history error:', error)
    }
  }

  const handleLoadHistory = (history: OpenerHistory) => {
    setPlatform(history.platform)
    setTargetProfile(history.targetProfile || '')
    setSelfProfile(history.selfProfile || '')
    setResult(history.result)
    setShowHistory(false)
    setErrorMsg('')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hour}:${minute}`
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      幽默: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      真诚: { bg: 'bg-blue-100', text: 'text-blue-700' },
      好奇: { bg: 'bg-green-100', text: 'text-green-700' },
      创意: { bg: 'bg-purple-100', text: 'text-purple-700' },
      直接: { bg: 'bg-red-100', text: 'text-red-700' },
    }
    return colors[category] || { bg: 'bg-gray-100', text: 'text-gray-700' }
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部说明 */}
      <View className="bg-purple-50 px-4 py-3">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center flex-1">
            <MessageCircle size={18} color="#9333ea" />
            <Text className="block text-sm text-purple-700 ml-2">输入对方资料，AI 生成多种风格的开场白</Text>
          </View>
          <View
            className="flex flex-row items-center px-3 py-1 bg-white rounded-full"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={16} color="#9333ea" />
            <Text className="text-xs text-purple-600 ml-1">历史</Text>
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

      {/* 历史记录 */}
      {showHistory && (
        <View className="bg-white border-b border-gray-100">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-sm font-medium text-gray-900">开场白历史</Text>
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
            <View className="max-h-80 overflow-y-auto">
              {historyList.map((history) => {
                const platformInfo = platformOptions.find((p) => p.value === history.platform)
                return (
                  <View
                    key={history.id}
                    className="px-4 py-3 border-b border-gray-50 flex flex-row items-center justify-between active:bg-gray-50"
                    onClick={() => handleLoadHistory(history)}
                  >
                    <View className="flex-1 mr-3">
                      <View className="flex flex-row items-center mb-1">
                        <Text className="text-sm mr-1">{platformInfo?.icon}</Text>
                        <Text className="text-sm text-gray-700 line-clamp-1">
                          {history.targetProfile.substring(0, 30)}...
                        </Text>
                        <Text className="text-xs text-gray-400 ml-2">{formatDate(history.createdAt)}</Text>
                      </View>
                      <Text className="text-xs text-gray-400">
                        {history.result?.openers?.length || 0}条开场白
                      </Text>
                    </View>
                    <View className="p-2 rounded-lg active:bg-gray-100" onClick={(e) => handleDeleteHistory(history.id, e)}>
                      <Trash2 size={16} color="#9ca3af" />
                    </View>
                  </View>
                )
              })}
              {historyList.length < historyTotal && (
                <View className="px-4 py-3 flex flex-col items-center" onClick={loadMoreHistory}>
                  <Text className="text-xs text-purple-500">{historyLoading ? '加载中...' : '加载更多'}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

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
                    className={`px-4 py-3 flex flex-row items-center justify-between ${platform === option.value ? 'bg-purple-50' : ''}`}
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
                    {platform === option.value && <Text className="text-purple-500">✓</Text>}
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">对方资料</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="bg-gray-50 rounded-xl p-4 mb-3">
              <Textarea
                style={{ width: '100%', height: '200px', backgroundColor: 'transparent' }}
                placeholder="描述对方的资料，如：昵称、简介、兴趣标签、照片内容等..."
                maxlength={500}
                value={targetProfile}
                onInput={(e) => setTargetProfile(e.detail.value)}
              />
            </View>
            <Text className="block text-xs text-gray-400">{targetProfile.length}/500</Text>
          </CardContent>
        </Card>

        {/* 自己的资料/风格偏好 */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <View className="flex flex-row items-center">
              <User size={18} color="#9333ea" />
              <Text className="block text-base font-semibold text-gray-900 ml-2">我的风格（选填）</Text>
            </View>
          </CardHeader>
          <CardContent>
            <View className="bg-purple-50 rounded-xl p-4 mb-3">
              <Textarea
                style={{ width: '100%', height: '120px', backgroundColor: 'transparent' }}
                placeholder="描述你自己的风格偏好，如：我比较幽默、喜欢直来直去、偏内向安静..."
                maxlength={200}
                value={selfProfile}
                onInput={(e) => setSelfProfile(e.detail.value)}
              />
            </View>
            <Text className="block text-xs text-gray-400">{selfProfile.length}/200</Text>
            <Text className="block text-xs text-purple-400 mt-1">填写后 AI 会根据你的风格偏好生成更贴合的开场白</Text>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <View className="flex flex-row gap-3 mb-4">
          <View className="flex-1">
            <Button variant="default" className="bg-purple-500 text-white rounded-xl" disabled={!canGenerate} onClick={handleGenerate}>
              <Text className="text-white">{loading ? '生成中...' : '生成开场白'}</Text>
            </Button>
          </View>
          <View className="flex-1">
            <Button variant="secondary" className="rounded-xl" onClick={handleReset}>
              <Text>重置</Text>
            </Button>
          </View>
        </View>

        {/* 空状态引导 */}
        {!result && !loading && !targetProfile.trim() && (
          <View className="py-6 flex flex-col items-center">
            <MessageCircle size={32} color="#d1d5db" />
            <Text className="text-sm text-gray-400 mt-3">输入对方资料后即可生成开场白</Text>
            <Text className="text-xs text-gray-300 mt-1">越详细的描述，生成的开场白越精准</Text>
          </View>
        )}

        {/* 生成结果 */}
        {result && (
          <View>
            {/* 兜底提示 */}
            {result.isFallback && (
              <View className="bg-amber-50 rounded-xl px-4 py-3 mb-4 flex flex-row items-center">
                <CircleAlert size={16} color="#f59e0b" />
                <Text className="text-xs text-amber-600 ml-2 flex-1">AI 生成遇到问题，以下为参考建议，建议稍后重试</Text>
              </View>
            )}

            {/* 重新生成按钮 */}
            <View className="flex flex-row items-center justify-center mb-4">
              <Button variant="outline" className="rounded-full border-purple-300" onClick={handleRegenerate} disabled={loading}>
                <View className="flex flex-row items-center">
                  <RefreshCw size={16} color="#9333ea" />
                  <Text className="text-purple-600 ml-2">换一批</Text>
                </View>
              </Button>
            </View>

            {/* 平台标签 */}
            <View className="flex flex-row items-center justify-center mb-4">
              <View className="bg-purple-100 rounded-full px-3 py-1 flex flex-row items-center">
                <Text className="text-sm mr-1">{currentPlatform.icon}</Text>
                <Text className="text-xs text-purple-600">{currentPlatform.label} 专属开场白</Text>
              </View>
            </View>

            {/* 开场白列表 */}
            {result.openers.map((opener, index) => {
              const categoryColor = getCategoryColor(opener.category)
              const copyKey = `${index}-${opener.category}`
              const isCopied = copiedIndex === copyKey
              return (
                <Card key={index} className="mb-3">
                  <CardContent className="py-4">
                    {/* 分类和风格标签 */}
                    <View className="flex flex-row items-center mb-3">
                      <View className={`${categoryColor.bg} rounded-full px-3 py-1 mr-2`}>
                        <Text className={`text-xs ${categoryColor.text}`}>{opener.category}</Text>
                      </View>
                      <View className="bg-gray-100 rounded-full px-3 py-1">
                        <Text className="text-xs text-gray-600">{opener.style}</Text>
                      </View>
                    </View>

                    {/* 开场白内容 */}
                    <View className="bg-purple-50 rounded-xl px-4 py-3 mb-3">
                      <Text className="block text-base text-gray-900 leading-relaxed">{opener.content}</Text>
                    </View>

                    {/* 理由 */}
                    <Text className="block text-xs text-gray-500 mb-3">{opener.reason}</Text>

                    {/* 复制按钮 */}
                    <View className="flex flex-row justify-end">
                      <View
                        className={`rounded-full px-4 py-2 flex flex-row items-center ${isCopied ? 'bg-green-100' : 'bg-gray-100'}`}
                        onClick={() => handleCopy(opener.content, copyKey)}
                      >
                        {isCopied ? <Check size={14} color="#22c55e" /> : <Copy size={14} color="#6b7280" />}
                        <Text className={`text-xs ml-1 ${isCopied ? 'text-green-600' : 'text-gray-600'}`}>
                          {isCopied ? '已复制' : '复制'}
                        </Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              )
            })}

            {/* 总结 */}
            <Card className="bg-purple-50">
              <CardContent className="py-4">
                <View className="flex flex-row items-start">
                  <Sparkles size={16} color="#9333ea" />
                  <Text className="block text-sm text-purple-700 ml-2 leading-relaxed flex-1">{result.summary}</Text>
                </View>
              </CardContent>
            </Card>
          </View>
        )}
      </View>
    </View>
  )
}

export default DatingOpenerPage
