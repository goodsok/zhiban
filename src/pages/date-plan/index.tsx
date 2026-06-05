import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Clock, DollarSign, Sparkles, ChevronRight, LoaderCircle, Heart, Lightbulb, Shirt } from 'lucide-react-taro'

// 对象信息
interface MatchItem {
  id: number
  name: string
  gender?: string
}

// 约会计划
interface DatePlan {
  title: string
  description: string
  schedule: Array<{
    time: string
    activity: string
    location: string
    tips: string
  }>
  totalBudget: string
  conversationTopics: string[]
  outfitSuggestion: string
  backupPlan: string
}

// 历史计划
interface PlanHistory {
  id: number
  matchId: number
  matchName: string
  title: string
  description: string
  totalBudget: string
  createdAt: string
}

// 季节选项
const SEASONS = ['春季', '夏季', '秋季', '冬季']
const DURATIONS = ['2小时', '半天', '一天', '周末两天']
const BUDGETS = ['100以内', '100-300', '300-500', '500-1000', '不限']

const DatePlanPage: FC = () => {
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null)
  const [showMatchPicker, setShowMatchPicker] = useState(false)
  const [selectedMatchName, setSelectedMatchName] = useState('')
  const [selectedSeason, setSelectedSeason] = useState('')
  const [selectedDuration, setSelectedDuration] = useState('')
  const [selectedBudget, setSelectedBudget] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [preferenceInput, setPreferenceInput] = useState('')
  const [plan, setPlan] = useState<DatePlan | null>(null)
  const [historyPlans, setHistoryPlans] = useState<PlanHistory[]>([])

  useLoad(() => {
    console.log('Date plan page loaded.')
  })

  useDidShow(() => {
    fetchMatches()
    fetchHistory()
  })

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/date-plan/matches/list' })
      console.log('Date plan matches response:', res.data)
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

  const fetchHistory = async () => {
    try {
      const res = await Network.request({ url: '/api/date-plan/list' })
      console.log('Date plan history response:', res.data)
      const responseData = res?.data
      if (responseData?.code === 200 && responseData?.data?.list) {
        setHistoryPlans(responseData.data.list)
      }
    } catch (error) {
      console.error('Fetch history error:', error)
    }
  }

  const selectMatch = (match: MatchItem) => {
    setSelectedMatchId(match.id)
    setSelectedMatchName(match.name)
    setShowMatchPicker(false)
  }

  const generatePlan = async () => {
    if (!selectedMatchId) return
    setGenerating(true)
    setPlan(null)
    try {
      const res = await Network.request({
        url: '/api/date-plan/generate',
        method: 'POST',
        data: {
          matchId: selectedMatchId,
          budget: selectedBudget || undefined,
          season: selectedSeason || undefined,
          location: locationInput || undefined,
          preference: preferenceInput || undefined,
          duration: selectedDuration || undefined,
        },
      })
      console.log('Generate date plan response:', res.data)
      const responseData = res?.data
      if (responseData?.code === 200 && responseData?.data?.plan) {
        setPlan(responseData.data.plan)
        fetchHistory()
      }
    } catch (error) {
      console.error('Generate plan error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const goToHistoryDetail = (planId: number) => {
    Taro.navigateTo({ url: `/pages/date-plan-detail/index?id=${planId}` })
  }

  // 生成结果视图
  if (generating || plan) {
    return (
      <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
        <CustomHeader title="约会计划" onBack={() => setPlan(null)} />

        <ScrollView scrollY className="px-4 pt-4 pb-20">
          {generating && !plan && (
            <Card className="mb-4">
              <CardContent className="p-8 flex flex-col items-center justify-center">
                <LoaderCircle size={32} color="#374151" className="animate-spin" />
                <Text className="block text-sm text-gray-500 mt-3">正在生成约会计划...</Text>
                <Text className="block text-xs text-gray-400 mt-1">AI 正在根据对象偏好定制方案</Text>
              </CardContent>
            </Card>
          )}

          {plan && (
            <>
              {/* 计划标题 */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <View className="flex flex-row items-center mb-2">
                    <Heart size={20} color="#374151" />
                    <Text className="block text-lg font-bold text-gray-900 ml-2">{plan.title}</Text>
                  </View>
                  <Text className="block text-sm text-gray-600">{plan.description}</Text>
                  <View className="flex flex-row items-center mt-2">
                    <DollarSign size={14} color="#6B7280" />
                    <Text className="block text-xs text-gray-500 ml-1">预估花费：{plan.totalBudget}</Text>
                  </View>
                </CardContent>
              </Card>

              {/* 行程安排 */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <View className="flex flex-row items-center mb-3">
                    <Clock size={18} color="#374151" />
                    <Text className="block text-base font-semibold text-gray-900 ml-2">行程安排</Text>
                  </View>
                  {plan.schedule.map((item, idx) => (
                    <View key={idx} className="mb-4 last:mb-0">
                      <View className="flex flex-row items-start">
                        <View className="w-12 flex-shrink-0">
                          <Badge variant="secondary">
                            <Text className="text-xs">{item.time}</Text>
                          </Badge>
                        </View>
                        <View className="flex-1 ml-2">
                          <Text className="block text-sm font-semibold text-gray-900">{item.activity}</Text>
                          <View className="flex flex-row items-center mt-1">
                            <MapPin size={12} color="#9CA3AF" />
                            <Text className="block text-xs text-gray-500 ml-1">{item.location}</Text>
                          </View>
                          <Text className="block text-xs text-gray-400 mt-1">{item.tips}</Text>
                        </View>
                      </View>
                      {idx < plan.schedule.length - 1 && (
                        <View className="ml-6 my-2 border-l-2 h-3" />
                      )}
                    </View>
                  ))}
                </CardContent>
              </Card>

              {/* 话题推荐 */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <View className="flex flex-row items-center mb-3">
                    <Lightbulb size={18} color="#374151" />
                    <Text className="block text-base font-semibold text-gray-900 ml-2">话题推荐</Text>
                  </View>
                  <View className="flex flex-row flex-wrap gap-2">
                    {plan.conversationTopics.map((topic, idx) => (
                      <Badge key={idx} variant="secondary">
                        <Text className="text-xs">{topic}</Text>
                      </Badge>
                    ))}
                  </View>
                </CardContent>
              </Card>

              {/* 穿搭建议 */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <View className="flex flex-row items-center mb-2">
                    <Shirt size={18} color="#374151" />
                    <Text className="block text-base font-semibold text-gray-900 ml-2">穿搭建议</Text>
                  </View>
                  <Text className="block text-sm text-gray-600">{plan.outfitSuggestion}</Text>
                </CardContent>
              </Card>

              {/* 备选方案 */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <View className="flex flex-row items-center mb-2">
                    <Sparkles size={18} color="#374151" />
                    <Text className="block text-base font-semibold text-gray-900 ml-2">备选方案</Text>
                  </View>
                  <Text className="block text-sm text-gray-600">{plan.backupPlan}</Text>
                </CardContent>
              </Card>
            </>
          )}
        </ScrollView>
      </View>
    )
  }

  // 主视图：输入表单 + 历史记录
  return (
    <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="约会计划" />

      <ScrollView scrollY className="px-4 pt-4 pb-20">
        {/* 对象选择 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-3">选择对象</Text>
            <View
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex flex-row items-center justify-between"
              onClick={() => setShowMatchPicker(true)}
            >
              <Text className={`block text-sm ${selectedMatchName ? 'text-gray-900' : 'text-gray-400'}`}>
                {selectedMatchName || '点击选择对象'}
              </Text>
              <ChevronRight size={16} color="#9CA3AF" />
            </View>
          </CardContent>
        </Card>

        {/* 对象选择弹层 */}
        {showMatchPicker && (
          <Card className="mb-4">
            <CardContent className="p-4">
              {loading ? (
                <Skeleton className="h-10 rounded-lg" />
              ) : (
                matches.map((match) => (
                  <View
                    key={match.id}
                    className="py-3 border-b last:border-b-0"
                    onClick={() => selectMatch(match)}
                  >
                    <Text className={`block text-sm ${selectedMatchId === match.id ? 'text-green-500 font-semibold' : 'text-gray-700'}`}>
                      {match.name}
                    </Text>
                  </View>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* 约会条件 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-3">约会条件</Text>

            {/* 季节 */}
            <Text className="block text-xs text-gray-500 mb-2">季节</Text>
            <View className="flex flex-row flex-wrap gap-2 mb-4">
              {SEASONS.map((s) => (
                <Badge
                  key={s}
                  className={selectedSeason === s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}
                  onClick={() => setSelectedSeason(s === selectedSeason ? '' : s)}
                >
                  <Text className="text-xs">{s}</Text>
                </Badge>
              ))}
            </View>

            {/* 时长 */}
            <Text className="block text-xs text-gray-500 mb-2">时长</Text>
            <View className="flex flex-row flex-wrap gap-2 mb-4">
              {DURATIONS.map((d) => (
                <Badge
                  key={d}
                  className={selectedDuration === d ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}
                  onClick={() => setSelectedDuration(d === selectedDuration ? '' : d)}
                >
                  <Text className="text-xs">{d}</Text>
                </Badge>
              ))}
            </View>

            {/* 预算 */}
            <Text className="block text-xs text-gray-500 mb-2">预算</Text>
            <View className="flex flex-row flex-wrap gap-2 mb-4">
              {BUDGETS.map((b) => (
                <Badge
                  key={b}
                  className={selectedBudget === b ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}
                  onClick={() => setSelectedBudget(b === selectedBudget ? '' : b)}
                >
                  <Text className="text-xs">{b}</Text>
                </Badge>
              ))}
            </View>

            {/* 地点偏好 */}
            <Text className="block text-xs text-gray-500 mb-2">地点偏好</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
              <Input
                className="w-full bg-transparent"
                placeholder="如：市中心、大学城附近..."
                value={locationInput}
                onInput={(e) => setLocationInput(e.detail.value)}
              />
            </View>

            {/* 特殊要求 */}
            <Text className="block text-xs text-gray-500 mb-2">特殊要求</Text>
            <View className="bg-gray-50 rounded-2xl p-4">
              <Textarea
                style={{ width: '100%', minHeight: '60px', backgroundColor: 'transparent' }}
                placeholder="如：想要浪漫一点的、第一次约会、想多聊天..."
                maxlength={200}
                value={preferenceInput}
                onInput={(e) => setPreferenceInput(e.detail.value)}
              />
            </View>
          </CardContent>
        </Card>

        {/* 生成按钮 */}
        <Button
          className="w-full mb-6"
          disabled={!selectedMatchId || generating}
          onClick={generatePlan}
        >
          <Sparkles size={16} color="#fff" className="mr-2" />
          <Text className="text-sm text-white font-semibold">AI 生成约会计划</Text>
        </Button>

        {/* 历史计划 */}
        {historyPlans.length > 0 && (
          <View>
            <Text className="block text-sm font-semibold text-gray-900 mb-3">历史计划</Text>
            {historyPlans.map((p) => (
              <Card key={p.id} className="mb-3" onClick={() => goToHistoryDetail(p.id)}>
                <CardContent className="p-4">
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="block text-sm font-semibold text-gray-900">{p.title}</Text>
                      <Text className="block text-xs text-gray-500 mt-1">{p.matchName} · {p.totalBudget}</Text>
                    </View>
                    <ChevronRight size={16} color="#9CA3AF" />
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default DatePlanPage
