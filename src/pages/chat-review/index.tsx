import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad, useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, TrendingUp, Heart, Zap, Clock, SquareChartGantt, LoaderCircle } from 'lucide-react-taro'

// 对象信息
interface MatchItem {
  id: number
  name: string
  gender?: string
  status: string
  impression: number
  chatRecordCount: number
  chatHistoryCount: number
}

// 兴趣信号
interface InterestSignal {
  signal: string
  evidence: string
  level: 'high' | 'medium' | 'low'
}

// 分析结果
interface ReviewAnalysis {
  interestSignals: InterestSignal[]
  emotionState: {
    overall: string
    trend: string
    details: string
  }
  replyRhythm: {
    speed: string
    initiative: string
    pattern: string
  }
  suggestions: string[]
  score: number
}

// 信号等级颜色
const levelConfig: Record<string, { color: string; label: string }> = {
  high: { color: 'bg-emerald-100 text-emerald-700', label: '强' },
  medium: { color: 'bg-amber-100 text-amber-700', label: '中' },
  low: { color: 'bg-stone-100 text-stone-600', label: '弱' },
}

// 情绪趋势颜色
const trendConfig: Record<string, { color: string; icon: typeof TrendingUp }> = {
  '升温中': { color: 'text-green-600', icon: TrendingUp },
  '稳定': { color: 'text-stone-600', icon: SquareChartGantt },
  '降温中': { color: 'text-red-500', icon: TrendingUp },
}

const ChatReviewPage: FC = () => {
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null)
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null)

  useLoad(() => {
    console.log('Chat review page loaded.')
  })

  useDidShow(() => {
    fetchMatches()
  })

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/chat-review/matches' })
      console.log('Chat review matches response:', res.data)
      const responseData = res?.data
      if (responseData?.code === 200 && responseData?.data?.list) {
        setMatches(responseData.data.list)
      }
    } catch (error) {
      console.error('Fetch matches error:', error)
    } finally {
      setLoading(false)
    }
  }

  const startReview = async (match: MatchItem) => {
    setSelectedMatch(match)
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const res = await Network.request({
        url: `/api/chat-review/match/${match.id}`,
        method: 'POST',
      })
      console.log('Chat review result:', res.data)
      const responseData = res?.data
      if (responseData?.code === 200 && responseData?.data?.analysis) {
        setAnalysis(responseData.data.analysis)
      }
    } catch (error) {
      console.error('Chat review error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '非常感兴趣'
    if (score >= 60) return '比较感兴趣'
    if (score >= 40) return '一般'
    if (score >= 20) return '兴趣不大'
    return '比较冷淡'
  }

  // 分析结果视图
  if (selectedMatch && (analyzing || analysis)) {
    const TrendIcon = analysis ? (trendConfig[analysis.emotionState.trend]?.icon || SquareChartGantt) : SquareChartGantt

    return (
      <View className="min-h-screen" style={{ backgroundColor: '#FFF9F0' }}>
        <CustomHeader title="聊天复盘" onBack={() => { setSelectedMatch(null); setAnalysis(null) }} />

        <ScrollView scrollY className="px-4 pt-4 pb-20">
          {/* 对象名 & 评分 */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <View className="flex flex-row items-center justify-between">
                <View className="flex flex-row items-center">
                  <View className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center mr-3">
                    <MessageSquare size={20} color="#44403C" />
                  </View>
                  <View>
                    <Text className="block text-base font-semibold text-stone-900">{selectedMatch.name}</Text>
                    <Text className="block text-xs text-stone-500">聊天复盘分析</Text>
                  </View>
                </View>
                {analysis && (
                  <View className="text-right">
                    <Text className={`block text-3xl font-bold ${getScoreColor(analysis.score)}`}>{analysis.score}</Text>
                    <Text className="block text-xs text-stone-500">{getScoreLabel(analysis.score)}</Text>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>

          {analyzing && !analysis && (
            <Card className="mb-4">
              <CardContent className="p-8 flex flex-col items-center justify-center">
                <LoaderCircle size={32} color="#44403C" className="animate-spin" />
                <Text className="block text-sm text-stone-500 mt-3">正在分析聊天记录...</Text>
                <Text className="block text-xs text-stone-400 mt-1">AI 正在深度复盘你们的对话</Text>
              </CardContent>
            </Card>
          )}

          {analysis && (
            <>
              {/* 情绪状态 */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <View className="flex flex-row items-center mb-3">
                    <Heart size={18} color="#44403C" />
                    <Text className="block text-base font-semibold text-stone-900 ml-2">情绪状态</Text>
                  </View>
                  <View className="flex flex-row items-center mb-2">
                    <Text className="block text-sm text-stone-500 mr-2">整体：</Text>
                    <Text className="block text-sm font-medium text-stone-900">{analysis.emotionState.overall}</Text>
                    <TrendIcon size={14} color={trendConfig[analysis.emotionState.trend]?.color === 'text-green-600' ? '#10B981' : trendConfig[analysis.emotionState.trend]?.color === 'text-red-500' ? '#EF4444' : '#6B7280'} className="ml-2" />
                    <Text className="block text-sm ml-1" style={{ color: trendConfig[analysis.emotionState.trend]?.color === 'text-green-600' ? '#10B981' : trendConfig[analysis.emotionState.trend]?.color === 'text-red-500' ? '#EF4444' : '#6B7280' }}>{analysis.emotionState.trend}</Text>
                  </View>
                  <Text className="block text-xs text-stone-500 leading-relaxed">{analysis.emotionState.details}</Text>
                </CardContent>
              </Card>

              {/* 回复节奏 */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <View className="flex flex-row items-center mb-3">
                    <Clock size={18} color="#44403C" />
                    <Text className="block text-base font-semibold text-stone-900 ml-2">回复节奏</Text>
                  </View>
                  <View className="flex flex-row flex-wrap gap-2 mb-2">
                    <Badge variant="secondary">{analysis.replyRhythm.speed}</Badge>
                    <Badge variant="secondary">{analysis.replyRhythm.initiative}</Badge>
                  </View>
                  <Text className="block text-xs text-stone-500 leading-relaxed">{analysis.replyRhythm.pattern}</Text>
                </CardContent>
              </Card>

              {/* 兴趣信号 */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <View className="flex flex-row items-center mb-3">
                    <Zap size={18} color="#44403C" />
                    <Text className="block text-base font-semibold text-stone-900 ml-2">兴趣信号</Text>
                  </View>
                  {analysis.interestSignals.map((signal, idx) => (
                    <View key={idx} className="mb-3 last:mb-0">
                      <View className="flex flex-row items-center mb-1">
                        <Text className="block text-sm font-medium text-stone-900 mr-2">{signal.signal}</Text>
                        <Badge className={levelConfig[signal.level]?.color || 'bg-stone-100 text-stone-600'}>
                          <Text className="text-xs">{levelConfig[signal.level]?.label || '未知'}</Text>
                        </Badge>
                      </View>
                      <Text className="block text-xs text-stone-500">{signal.evidence}</Text>
                    </View>
                  ))}
                </CardContent>
              </Card>

              {/* 建议 */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <View className="flex flex-row items-center mb-3">
                    <TrendingUp size={18} color="#44403C" />
                    <Text className="block text-base font-semibold text-stone-900 ml-2">下一步建议</Text>
                  </View>
                  {analysis.suggestions.map((suggestion, idx) => (
                    <View key={idx} className="flex flex-row mb-2 last:mb-0">
                      <Text className="block text-sm text-stone-700 mr-2">{idx + 1}.</Text>
                      <Text className="block text-sm text-stone-700 flex-1">{suggestion}</Text>
                    </View>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </ScrollView>
      </View>
    )
  }

  // 对象选择视图
  return (
    <View className="min-h-screen" style={{ backgroundColor: '#FFF9F0' }}>
      <CustomHeader title="聊天复盘" />

      <ScrollView scrollY className="px-4 pt-4 pb-20">
        <Text className="block text-sm text-stone-500 mb-4">选择对象，AI 将分析你们的聊天记录</Text>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl mb-3" />
          ))
        ) : matches.length === 0 ? (
          <Card>
            <CardContent className="p-8 flex flex-col items-center">
              <MessageSquare size={32} color="#A8A29E" />
              <Text className="block text-sm text-stone-400 mt-3">暂无对象，请先在首页添加</Text>
            </CardContent>
          </Card>
        ) : (
          matches.map((match) => {
            const hasChat = match.chatRecordCount > 0 || match.chatHistoryCount > 0
            return (
              <Card key={match.id} className="mb-3">
                <CardContent className="p-4">
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center flex-1">
                      <View className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center mr-3">
                        <MessageSquare size={18} color="#44403C" />
                      </View>
                      <View className="flex-1">
                        <Text className="block text-base font-semibold text-stone-900">{match.name}</Text>
                        <Text className="block text-xs text-stone-500 mt-1">
                          {hasChat ? `${match.chatHistoryCount}条对话 · ${match.chatRecordCount}条记录` : '暂无聊天记录'}
                        </Text>
                      </View>
                    </View>
                    {hasChat ? (
                      <Button size="sm" onClick={() => startReview(match)}>
                        <Text className="text-xs">开始复盘</Text>
                      </Button>
                    ) : (
                      <Badge variant="secondary">
                        <Text className="text-xs">无数据</Text>
                      </Badge>
                    )}
                  </View>
                </CardContent>
              </Card>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

export default ChatReviewPage
