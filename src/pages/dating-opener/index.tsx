import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad, useRouter } from '@tarojs/taro'
import type { FC } from 'react'
import { MessageCircle, RefreshCw, Sparkles, Copy, Check, ChevronDown, History, Trash2, Clock, CircleAlert, Loader, User } from 'lucide-react-taro'
import { Network } from '@/network'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
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
  dimensionSummary?: string
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

// 维度 key 友好名称映射
const dimensionLabels: Record<string, string> = {
  height: '身高',
  bodyType: '体型',
  appearance: '外貌',
  fashionStyle: '穿搭风格',
  glasses: '眼镜',
  distinctiveFeatures: '特征',
  healthCondition: '健康状况',
  mbti: 'MBTI',
  enneagram: '九型人格',
  bigFive: '大五人格',
  educationLevel: '学历',
  occupation: '职业',
  incomeRange: '收入',
  hometown: '家乡',
  currentCity: '现居城市',
  housing: '住房',
  car: '车辆',
  loveLanguage: '爱语',
  attachmentStyle: '依恋类型',
  communicationStyle: '沟通方式',
  conflictStyle: '冲突处理',
  emotionalExpression: '情感表达',
  values: '价值观',
  lifeGoal: '人生目标',
  marriageView: '婚姻观',
  childPlan: '生育计划',
  religion: '宗教',
  pets: '宠物',
  exercise: '运动',
  diet: '饮食偏好',
  smoking: '吸烟',
  drinking: '饮酒',
  sleepHabit: '睡眠习惯',
  travel: '旅行偏好',
  music: '音乐',
  movies: '电影',
  books: '阅读',
  cooking: '烹饪',
  socialStyle: '社交风格',
  weekend: '周末偏好',
  annualIncome: '年收入',
  familyPlan: '家庭规划',
  hobby: '爱好',
}

// 维度分类
const dimensionCategories: Record<string, string> = {
  height: '外貌', bodyType: '外貌', appearance: '外貌', fashionStyle: '外貌', glasses: '外貌', distinctiveFeatures: '外貌',
  mbti: '性格', enneagram: '性格', bigFive: '性格', loveLanguage: '性格', attachmentStyle: '性格', communicationStyle: '性格', conflictStyle: '性格', emotionalExpression: '性格',
  educationLevel: '背景', occupation: '背景', incomeRange: '背景', hometown: '背景', currentCity: '背景', housing: '背景', car: '背景', annualIncome: '背景',
  values: '价值观', lifeGoal: '价值观', marriageView: '价值观', childPlan: '价值观', religion: '价值观', familyPlan: '价值观',
  pets: '生活', exercise: '生活', diet: '生活', smoking: '生活', drinking: '生活', sleepHabit: '生活', travel: '生活', cooking: '生活', socialStyle: '生活', weekend: '生活',
  music: '兴趣', movies: '兴趣', books: '兴趣', hobby: '兴趣',
  healthCondition: '健康',
}

const DatingOpenerPage: FC = () => {
  const router = useRouter()
  const matchIdParam = router.params.matchId
  const matchId = matchIdParam ? Number(matchIdParam) : undefined

  const [targetProfile, setTargetProfile] = useState('')
  const [selfProfile, setSelfProfile] = useState('')
  const [platform, setPlatform] = useState('tantan')
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
      const reqData: Record<string, any> = {
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

  // 解析 dimensionSummary 为分组数据
  const parseDimensionSummary = (summary: string) => {
    if (!summary) return []
    const items = summary.split('；').filter(Boolean)
    const grouped: Record<string, Array<{ key: string; label: string; value: string }>> = {}
    items.forEach((item) => {
      const [key, ...rest] = item.split(': ')
      if (!key || rest.length === 0) return
      const value = rest.join(': ')
      const label = dimensionLabels[key] || key
      const category = dimensionCategories[key] || '其他'
      if (!grouped[category]) grouped[category] = []
      grouped[category].push({ key, label, value })
    })
    return Object.entries(grouped).map(([category, dimItems]) => ({ category, items: dimItems }))
  }

  // 维度值格式化
  const formatDimensionValue = (value: string) => {
    // 去掉方括号
    let v = value.replace(/^\[|\]$/g, '')
    // 下划线替换为空格
    v = v.replace(/_/g, ' ')
    return v
  }

  const dimensionGroups = result?.dimensionSummary ? parseDimensionSummary(result.dimensionSummary) : []

  return (
    <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="开场白生成" />

      {/* 对象信息卡片（从档案页进入时显示） */}
      {matchInfo && (
        <View className="px-4 pt-2 pb-2">
          <View className="bg-white rounded-2xl shadow-soft p-3 flex items-center gap-3">
            <View className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <User size={16} color="#9333ea" />
            </View>
            <View className="flex-1">
              <Text className="block text-sm font-medium text-gray-900">
                为 <Text className="text-purple-600">{matchInfo.name}</Text> 生成专属开场白
              </Text>
              <Text className="block text-xs text-gray-400 mt-1">基于对方维度数据，AI 个性化推荐</Text>
            </View>
            <View className="bg-purple-50 rounded-full px-2 py-1">
              <Text className="text-xs text-purple-500">AI</Text>
            </View>
          </View>
        </View>
      )}

      {/* 维度概述卡片 */}
      {dimensionGroups.length > 0 && (
        <View className="px-4 pb-2">
          <Card>
            <CardContent className="py-3">
              <View className="flex flex-row items-center mb-3">
                <Sparkles size={14} color="#9333ea" />
                <Text className="block text-sm font-medium text-gray-700 ml-2">对方维度概述</Text>
              </View>
              {dimensionGroups.map((group) => (
                <View key={group.category} className="mb-2 last:mb-0">
                  <Text className="block text-xs text-gray-400 mb-1">{group.category}</Text>
                  <View className="flex flex-row flex-wrap gap-2">
                    {group.items.map((item) => (
                      <View key={item.key} className="bg-purple-50 rounded-full px-2 py-1">
                        <Text className="text-xs text-purple-700">
                          {item.label}：{formatDimensionValue(item.value)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </CardContent>
          </Card>
        </View>
      )}

      {/* 顶部提示 + 历史按钮 */}
      <View className="px-4 py-2">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center flex-1">
            <MessageCircle size={16} color="#9333ea" />
            <Text className="block text-sm text-purple-700 ml-2">
              {matchId ? 'AI 基于对方维度数据生成个性化开场白' : '输入对方资料，AI 生成多种风格的开场白'}
            </Text>
          </View>
          <View
            className="flex flex-row items-center px-3 py-2 bg-white rounded-full shadow-soft"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={14} color="#9333ea" />
            <Text className="text-xs text-purple-600 ml-1">历史</Text>
          </View>
        </View>
      </View>

      {/* 错误提示 */}
      {errorMsg && (
        <View className="mx-4 mb-3 bg-red-50 rounded-xl px-4 py-3 flex flex-row items-center">
          <CircleAlert size={16} color="#ef4444" />
          <Text className="text-sm text-red-600 ml-2 flex-1">{errorMsg}</Text>
          <View onClick={() => setErrorMsg('')}>
            <Text className="text-xs text-red-400">关闭</Text>
          </View>
        </View>
      )}

      {/* 历史记录 */}
      {showHistory && (
        <View className="mx-4 mb-3 bg-white rounded-2xl shadow-soft overflow-hidden">
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
                    className="px-4 py-3 border-b border-gray-100 flex flex-row items-center justify-between active:bg-gray-50"
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
                        {history.result?.suggestions?.length || 0}条开场白
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

      <View className="px-4 pb-6">
        {/* 平台选择 */}
        <Card className="mb-3">
          <CardContent className="py-3">
            <View
              className="bg-gray-50 rounded-xl px-4 py-3 flex flex-row items-center justify-between"
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
              <View className="mt-2 bg-white rounded-xl overflow-hidden border border-gray-100">
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

        {/* 对方资料 */}
        <Card className="mb-3">
          <CardContent className="py-3">
            <Text className="block text-sm font-medium text-gray-900 mb-2">对方资料</Text>
            <View className="bg-gray-50 rounded-xl p-3">
              <Textarea
                style={{ width: '100%', height: '160px', backgroundColor: 'transparent' }}
                placeholder="描述对方的资料，如：昵称、简介、兴趣标签、照片内容等..."
                maxlength={500}
                value={targetProfile}
                onInput={(e) => setTargetProfile(e.detail.value)}
              />
            </View>
            <Text className="block text-xs text-gray-400 mt-1">{targetProfile.length}/500</Text>
          </CardContent>
        </Card>

        {/* 我的风格 */}
        <Card className="mb-3">
          <CardContent className="py-3">
            <View className="flex flex-row items-center mb-2">
              <User size={16} color="#9333ea" />
              <Text className="block text-sm font-medium text-gray-900 ml-2">我的风格（选填）</Text>
            </View>
            <View className="bg-purple-50 rounded-xl p-3">
              <Textarea
                style={{ width: '100%', height: '100px', backgroundColor: 'transparent' }}
                placeholder="描述你自己的风格偏好，如：我比较幽默、喜欢直来直去..."
                maxlength={200}
                value={selfProfile}
                onInput={(e) => setSelfProfile(e.detail.value)}
              />
            </View>
            <Text className="block text-xs text-gray-400 mt-1">{selfProfile.length}/200</Text>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <View className="flex flex-row gap-3 mb-4">
          <View className="flex-1">
            <Button variant="default" className="bg-purple-500 text-white rounded-xl h-10" disabled={!canGenerate} onClick={handleGenerate}>
              <Text className="text-white text-sm">{loading ? 'AI 生成中...' : '生成开场白'}</Text>
            </Button>
          </View>
          <View className="flex-1">
            <Button variant="secondary" className="rounded-xl h-10" onClick={handleReset}>
              <Text className="text-sm">重置</Text>
            </Button>
          </View>
        </View>

        {/* 加载态 */}
        {loading && (
          <View className="py-8 flex flex-col items-center">
            <Loader size={24} color="#9333ea" className="animate-spin" />
            <Text className="text-sm text-gray-400 mt-3">AI 正在分析对方资料，生成个性化开场白...</Text>
          </View>
        )}

        {/* 空状态引导 */}
        {!result && !loading && !targetProfile.trim() && (
          <View className="py-8 flex flex-col items-center">
            <MessageCircle size={32} color="#d1d5db" />
            <Text className="text-sm text-gray-400 mt-3">输入对方资料后即可生成开场白</Text>
            <Text className="text-xs text-gray-300 mt-1">越详细的描述，生成的开场白越精准</Text>
          </View>
        )}

        {/* 生成结果 */}
        {result && !loading && (
          <View>
            {/* 对方画像分析 */}
            <Card className="mb-3">
              <CardContent className="py-3">
                <View className="flex flex-row items-center mb-2">
                  <User size={14} color="#9333ea" />
                  <Text className="block text-sm font-medium text-gray-700 ml-2">对方画像分析</Text>
                </View>
                <Text className="block text-sm text-gray-600 leading-relaxed">{result.targetAnalysis}</Text>
              </CardContent>
            </Card>

            {/* 重新生成 + 平台标签 */}
            <View className="flex flex-row items-center justify-between mb-3">
              <View className="bg-purple-100 rounded-full px-3 py-1 flex flex-row items-center">
                <Text className="text-sm mr-1">{currentPlatform.icon}</Text>
                <Text className="text-xs text-purple-600">{currentPlatform.label} 专属开场白</Text>
              </View>
              <Button variant="outline" className="rounded-full border-purple-300 h-8 px-3" onClick={handleRegenerate} disabled={loading}>
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
                <Text className="text-xs text-amber-600 ml-2 flex-1">AI 生成遇到问题，以下为参考建议，建议稍后重试</Text>
              </View>
            )}

            {/* 开场白列表 */}
            {result.suggestions.map((suggestion, index) => {
              const copyKey = `${index}-${suggestion.style}`
              const isCopied = copiedIndex === copyKey
              return (
                <Card key={index} className="mb-3">
                  <CardContent className="py-3">
                    {/* 风格标签 */}
                    <View className="flex flex-row items-center mb-3">
                      <View className="bg-purple-100 rounded-full px-3 py-1">
                        <Text className="text-xs text-purple-700">{suggestion.style}</Text>
                      </View>
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
                  </CardContent>
                </Card>
              )
            })}

            {/* 发送技巧 */}
            {result.tips && result.tips.length > 0 && (
              <Card className="bg-amber-50 mb-3">
                <CardContent className="py-3">
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
                </CardContent>
              </Card>
            )}
          </View>
        )}
      </View>
    </View>
  )
}

export default DatingOpenerPage
