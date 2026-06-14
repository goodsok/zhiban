import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad, useRouter } from '@tarojs/taro'
import type { FC } from 'react'
import { MessageCircle, RefreshCw, Sparkles, Copy, Check, ChevronDown, History, Trash2, Clock, CircleAlert, Loader, User, Zap } from 'lucide-react-taro'
import { Network } from '@/network'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import CustomHeader from '@/components/custom-header'

interface OpenerSuggestion {
  style: string
  content: string
  reason: string
}

interface OpenerResult {
  targetAnalysis: string
  suggestions: OpenerSuggestion[]
  tips: string[]
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

interface MatchInfo {
  id: number
  name: string
  gender?: string
  relationshipType?: string
}

const platformOptions = [
  { value: 'tantan', label: '探探', icon: '💕', desc: '轻松活泼' },
  { value: 'soul', label: 'Soul', icon: '🌙', desc: '走心开场' },
  { value: 'tinder', label: 'Tinder', icon: '🔥', desc: '简洁直接' },
  { value: 'momo', label: '陌陌', icon: '📍', desc: '大方自信' },
  { value: 'bumble', label: 'Bumble', icon: '🐝', desc: '高质量' },
  { value: 'hinge', label: 'Hinge', icon: '💫', desc: '真诚有趣' },
  { value: 'qingten', label: '青藤', icon: '🌱', desc: '真诚得体' },
  { value: 'marryu', label: 'MarryU', icon: '💍', desc: '稳重婚恋' },
]

const PAGE_SIZE = 10

const DatingOpenerPage: FC = () => {
  const router = useRouter()
  const matchIdParam = router.params.matchId
  const matchId = matchIdParam ? Number(matchIdParam) : undefined
  const isFromProfile = !!matchId

  const [targetProfile, setTargetProfile] = useState('')
  const [selfProfile, setSelfProfile] = useState('')
  const [platform, setPlatform] = useState('soul')
  const [showPlatformPicker, setShowPlatformPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OpenerResult | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // 对象信息
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null)

  // 历史记录
  const [showHistory, setShowHistory] = useState(false)
  const [historyList, setHistoryList] = useState<OpenerHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyOffset, setHistoryOffset] = useState(0)

  const currentPlatform = platformOptions.find((p) => p.value === platform) || platformOptions[0]

  useLoad(() => {
    console.log('Dating opener page loaded, matchId:', matchId)
    if (matchId) {
      fetchMatchInfo(matchId)
    }
  })

  const fetchMatchInfo = async (id: number) => {
    try {
      const res = await Network.request({ url: `/api/match/${id}` })
      console.log('Fetch match info response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const match = res.data.data
        setMatchInfo({
          id: match.id,
          name: match.name,
          gender: match.gender,
          relationshipType: match.relationshipType,
        })
        // 自动填充对方资料
        const parts: string[] = []
        if (match.name) parts.push(`姓名：${match.name}`)
        if (match.gender) parts.push(`性别：${match.gender}`)
        if (match.notes) parts.push(`备注：${match.notes}`)
        if (match.relationshipType) parts.push(`关系类型：${match.relationshipType}`)
        if (parts.length > 0) {
          setTargetProfile(parts.join('，'))
        }
      }
    } catch (error) {
      console.error('Fetch match info error:', error)
    }
  }

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
    setResult(null)
    try {
      const reqData: Record<string, string | number> = {
        targetProfile: targetProfile.trim(),
        selfProfile: selfProfile.trim(),
        platform,
      }
      if (matchId) {
        reqData.matchId = matchId
      }
      const res = await Network.request({
        url: '/api/dating/opener/generate',
        method: 'POST',
        data: reqData,
      })
      console.log('Opener generation response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        const data = res.data.data
        setResult(data)
        if (data.isFallback) {
          setErrorMsg('AI 生成遇到问题，以下为参考建议，建议稍后重试')
        }
        // 保存历史
        try {
          await Network.request({
            url: '/api/dating/opener/history',
            method: 'POST',
            data: { platform, targetProfile: targetProfile.trim(), selfProfile: selfProfile.trim(), result: data },
          })
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

  const handleCopy = async (content: string, index: string) => {
    try {
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
      const res = await Network.request({ url: `/api/dating/opener/history/${id}`, method: 'DELETE' })
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

  // ==================== 渲染 ====================

  // 渲染平台选择器
  const renderPlatformPicker = () => (
    <View className="mb-3">
      <View
        className="bg-white rounded-2xl px-4 py-3 flex flex-row items-center justify-between shadow-soft"
        onClick={() => setShowPlatformPicker(!showPlatformPicker)}
      >
        <View className="flex flex-row items-center">
          <Text className="text-lg mr-2">{currentPlatform.icon}</Text>
          <Text className="text-sm text-gray-700">{currentPlatform.label}</Text>
          <Text className="text-xs text-gray-400 ml-2">{currentPlatform.desc}</Text>
        </View>
        <ChevronDown size={18} color="#9ca3af" style={{ transform: showPlatformPicker ? 'rotate(180deg)' : 'rotate(0)' }} />
      </View>
      {showPlatformPicker && (
        <View className="mt-2 bg-white rounded-2xl overflow-hidden shadow-soft">
          {platformOptions.map((option) => (
            <View
              key={option.value}
              className={`px-4 py-3 flex flex-row items-center justify-between ${platform === option.value ? 'bg-purple-50' : ''}`}
              onClick={() => { setPlatform(option.value); setShowPlatformPicker(false) }}
            >
              <View className="flex flex-row items-center">
                <Text className="text-lg mr-2">{option.icon}</Text>
                <Text className="text-sm text-gray-700">{option.label}</Text>
                <Text className="text-xs text-gray-400 ml-2">{option.desc}</Text>
              </View>
              {platform === option.value && <Text className="text-purple-500">✓</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  )

  // 渲染生成按钮
  const renderGenerateButton = () => (
    <Button
      variant="default"
      className="w-full bg-purple-500 text-white rounded-2xl h-12 mb-4"
      disabled={!canGenerate}
      onClick={handleGenerate}
    >
      <View className="flex flex-row items-center justify-center">
        <Zap size={16} color="#fff" />
        <Text className="text-white text-sm ml-2">{loading ? 'AI 生成中...' : '生成开场白'}</Text>
      </View>
    </Button>
  )

  // 渲染开场白结果
  const renderResult = () => {
    if (!result || loading) return null

    return (
      <View className="mt-2">
        {/* 对方画像 */}
        <View className="bg-white rounded-2xl p-4 shadow-soft mb-3">
          <View className="flex flex-row items-center mb-3">
            <User size={14} color="#9333ea" />
            <Text className="block text-sm font-medium text-gray-700 ml-2">对方画像分析</Text>
          </View>
          <Text className="block text-sm text-gray-600 leading-relaxed">{result.targetAnalysis}</Text>
        </View>

        {/* 平台标签 + 重新生成 */}
        <View className="flex flex-row items-center justify-between mb-3">
          <View className="bg-purple-100 rounded-full px-3 py-1 flex flex-row items-center">
            <Text className="text-sm mr-1">{currentPlatform.icon}</Text>
            <Text className="text-xs text-purple-600">{currentPlatform.label} 专属</Text>
          </View>
          <Button variant="outline" className="rounded-full border-purple-300 h-8 px-3" onClick={handleGenerate} disabled={loading}>
            <View className="flex flex-row items-center">
              <RefreshCw size={14} color="#9333ea" />
              <Text className="text-purple-600 text-xs ml-1">换一批</Text>
            </View>
          </Button>
        </View>

        {/* 兜底提示 */}
        {result.isFallback && (
          <View className="bg-amber-50 rounded-xl px-4 py-3 mb-3 flex flex-row items-center">
            <CircleAlert size={16} color="#f59e0b" />
            <Text className="text-xs text-amber-600 ml-2 flex-1">AI 生成遇到问题，以下为参考建议</Text>
          </View>
        )}

        {/* 开场白列表 */}
        {result.suggestions.map((suggestion, index) => {
          const copyKey = `${index}-${suggestion.style}`
          const isCopied = copiedIndex === copyKey
          return (
            <View key={index} className="bg-white rounded-2xl p-4 shadow-soft mb-3">
              {/* 风格标签 */}
              <View className="bg-purple-100 rounded-full px-3 py-1 self-start mb-3">
                <Text className="text-xs text-purple-700">{suggestion.style}</Text>
              </View>

              {/* 开场白内容 */}
              <View className="bg-purple-50 rounded-xl px-4 py-3 mb-3">
                <Text className="block text-base text-gray-900 leading-relaxed">{suggestion.content}</Text>
              </View>

              {/* 理由 */}
              <Text className="block text-xs text-gray-500 mb-3">{suggestion.reason}</Text>

              {/* 复制按钮 */}
              <View className="flex flex-row justify-end">
                <View
                  className={`rounded-full px-4 py-2 flex flex-row items-center ${isCopied ? 'bg-green-100' : 'bg-gray-100'}`}
                  onClick={() => handleCopy(suggestion.content, copyKey)}
                >
                  {isCopied ? <Check size={14} color="#22c55e" /> : <Copy size={14} color="#6b7280" />}
                  <Text className={`text-xs ml-1 ${isCopied ? 'text-green-600' : 'text-gray-600'}`}>
                    {isCopied ? '已复制' : '复制'}
                  </Text>
                </View>
              </View>
            </View>
          )
        })}

        {/* 发送技巧 */}
        {result.tips && result.tips.length > 0 && (
          <View className="bg-amber-50 rounded-2xl p-4 mb-3">
            <View className="flex flex-row items-center mb-2">
              <Sparkles size={14} color="#f59e0b" />
              <Text className="block text-sm font-medium text-amber-700 ml-2">发送技巧</Text>
            </View>
            {result.tips.map((tip, index) => (
              <View key={index} className="flex flex-row mb-2 last:mb-0">
                <Text className="block text-xs text-amber-600 mr-2">•</Text>
                <Text className="block text-xs text-amber-700 leading-relaxed flex-1">{tip}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    )
  }

  // 渲染历史记录面板
  const renderHistory = () => (
    showHistory && (
      <View className="mx-4 mb-3 bg-white rounded-2xl shadow-soft overflow-hidden">
        <View className="px-4 py-3 border-b border-gray-100 flex flex-row items-center justify-between">
          <Text className="text-sm font-medium text-gray-900">历史记录</Text>
          <View onClick={() => setShowHistory(false)}>
            <Text className="text-xs text-purple-500">关闭</Text>
          </View>
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
                  className="px-4 py-3 border-b border-gray-100 flex flex-row items-center justify-between active:bg-gray-50"
                  onClick={() => handleLoadHistory(history)}
                >
                  <View className="flex-1 mr-3">
                    <View className="flex flex-row items-center mb-1">
                      <Text className="text-sm mr-1">{platformInfo?.icon}</Text>
                      <Text className="text-sm text-gray-700 line-clamp-1">
                        {history.targetProfile.substring(0, 30)}...
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-400">{formatDate(history.createdAt)}</Text>
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
    )
  )

  // ==================== 主布局 ====================

  return (
    <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="开场白生成" />

      {/* ===== 从档案页进入：简洁模式 ===== */}
      {isFromProfile ? (
        <View className="px-4 pb-6">
          {/* 对象信息头部 */}
          <View className="bg-white rounded-2xl p-4 shadow-soft mb-3">
            <View className="flex flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <User size={20} color="#9333ea" />
              </View>
              <View className="flex-1">
                <Text className="block text-base font-semibold text-gray-900">
                  {matchInfo?.name || '加载中...'}
                </Text>
                <Text className="block text-xs text-gray-400 mt-1">
                  {matchInfo?.gender && `${matchInfo.gender} · `}{matchInfo?.relationshipType || ''}
                </Text>
              </View>
              <View className="bg-purple-500 rounded-full px-3 py-1 flex flex-row items-center">
                <Sparkles size={12} color="#fff" />
                <Text className="text-xs text-white ml-1">AI</Text>
              </View>
            </View>
            <Text className="block text-xs text-gray-400 mt-2">
              基于对方维度数据，AI 生成个性化开场白
            </Text>
          </View>

          {/* 平台选择 */}
          {renderPlatformPicker()}

          {/* 我的风格（选填） */}
          <View className="bg-white rounded-2xl p-4 shadow-soft mb-3">
            <Text className="block text-sm font-medium text-gray-900 mb-2">我的风格（选填）</Text>
            <View className="bg-purple-50 rounded-xl p-3">
              <Textarea
                style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                placeholder="描述你的风格偏好，如：比较幽默、喜欢直来直去..."
                maxlength={200}
                value={selfProfile}
                onInput={(e) => setSelfProfile(e.detail.value)}
              />
            </View>
          </View>

          {/* 生成按钮 */}
          {renderGenerateButton()}

          {/* 加载态 */}
          {loading && (
            <View className="py-8 flex flex-col items-center">
              <Loader size={24} color="#9333ea" className="animate-spin" />
              <Text className="text-sm text-gray-400 mt-3">AI 正在分析对方数据...</Text>
            </View>
          )}

          {/* 错误提示 */}
          {errorMsg && (
            <View className="bg-red-50 rounded-xl px-4 py-3 mb-3 flex flex-row items-center">
              <CircleAlert size={16} color="#ef4444" />
              <Text className="text-sm text-red-600 ml-2 flex-1">{errorMsg}</Text>
              <View onClick={() => setErrorMsg('')}>
                <Text className="text-xs text-red-400">关闭</Text>
              </View>
            </View>
          )}

          {/* 结果区 */}
          {renderResult()}
        </View>
      ) : (
        /* ===== 独立进入：完整模式 ===== */
        <View className="pb-6">
          {/* 顶部提示 + 历史 */}
          <View className="px-4 py-3 flex flex-row items-center justify-between">
            <View className="flex flex-row items-center flex-1">
              <MessageCircle size={16} color="#9333ea" />
              <Text className="block text-sm text-purple-700 ml-2">输入对方资料，AI 生成多种风格开场白</Text>
            </View>
            <View
              className="flex flex-row items-center px-3 py-2 bg-white rounded-full shadow-soft"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History size={14} color="#9333ea" />
              <Text className="text-xs text-purple-600 ml-1">历史</Text>
            </View>
          </View>

          {/* 历史记录 */}
          {renderHistory()}

          {/* 错误提示 */}
          {errorMsg && (
            <View className="mx-4 bg-red-50 rounded-xl px-4 py-3 mb-3 flex flex-row items-center">
              <CircleAlert size={16} color="#ef4444" />
              <Text className="text-sm text-red-600 ml-2 flex-1">{errorMsg}</Text>
              <View onClick={() => setErrorMsg('')}>
                <Text className="text-xs text-red-400">关闭</Text>
              </View>
            </View>
          )}

          <View className="px-4">
            {/* 对方资料 */}
            <View className="bg-white rounded-2xl p-4 shadow-soft mb-3">
              <Text className="block text-sm font-medium text-gray-900 mb-2">对方资料</Text>
              <View className="bg-gray-50 rounded-xl p-3">
                <Textarea
                  style={{ width: '100%', minHeight: '120px', backgroundColor: 'transparent' }}
                  placeholder="描述对方的资料，如：昵称、简介、兴趣标签、照片内容等..."
                  maxlength={500}
                  value={targetProfile}
                  onInput={(e) => setTargetProfile(e.detail.value)}
                />
              </View>
              <Text className="block text-xs text-gray-400 mt-1">{targetProfile.length}/500</Text>
            </View>

            {/* 平台选择 */}
            {renderPlatformPicker()}

            {/* 我的风格 */}
            <View className="bg-white rounded-2xl p-4 shadow-soft mb-3">
              <Text className="block text-sm font-medium text-gray-900 mb-2">我的风格（选填）</Text>
              <View className="bg-purple-50 rounded-xl p-3">
                <Textarea
                  style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                  placeholder="描述你的风格偏好，如：比较幽默、喜欢直来直去..."
                  maxlength={200}
                  value={selfProfile}
                  onInput={(e) => setSelfProfile(e.detail.value)}
                />
              </View>
            </View>

            {/* 生成按钮 */}
            {renderGenerateButton()}

            {/* 加载态 */}
            {loading && (
              <View className="py-8 flex flex-col items-center">
                <Loader size={24} color="#9333ea" className="animate-spin" />
                <Text className="text-sm text-gray-400 mt-3">AI 正在分析对方资料...</Text>
              </View>
            )}

            {/* 空状态 */}
            {!result && !loading && !targetProfile.trim() && (
              <View className="py-8 flex flex-col items-center">
                <MessageCircle size={32} color="#d1d5db" />
                <Text className="text-sm text-gray-400 mt-3">输入对方资料后即可生成开场白</Text>
                <Text className="text-xs text-gray-300 mt-1">越详细的描述，生成的开场白越精准</Text>
              </View>
            )}

            {/* 结果区 */}
            {renderResult()}
          </View>
        </View>
      )}
    </View>
  )
}

export default DatingOpenerPage
