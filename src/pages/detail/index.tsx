import { View, Text } from '@tarojs/components'
import { useLoad, useRouter, navigateBack, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Gamepad2,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Pencil,
  Loader
} from 'lucide-react-taro'
import { Network } from '@/network'

// 见面场景映射
const meetingSceneLabels: Record<string, string> = {
  blind_date: '相亲',
  pickup: '搭讪',
  app_meetup: 'App线下见面',
  party: '聚会社交',
  workplace: '职场',
  school: '学校',
  activity: '兴趣活动',
  other: '其他',
}

// 关系阶段映射
const relationshipStageLabels: Record<string, string> = {
  new: '刚认识',
  contacting: '接触中',
  dating: '约会中',
  progressing: '发展中',
}

// 互动状态映射
const interactionStatusLabels: Record<string, string> = {
  just_met: '只有一面之缘',
  got_contact: '拿到了联系方式',
  chatted: '聊过几次天',
  good_vibe: '聊天氛围不错',
  met_up: '约出来见过面',
  dating_regularly: '正在稳定约会',
  ambiguous: '暧昧期',
  confirming: '准备确认关系',
}

// 关系状态
const statusConfig = {
  new: { label: '新认识', color: 'text-blue-500 bg-blue-50' },
  contacting: { label: '接触中', color: 'text-purple-500 bg-purple-50' },
  dating: { label: '约会中', color: 'text-pink-500 bg-pink-50' },
  progressing: { label: '发展中', color: 'text-emerald-500 bg-emerald-50' },
  paused: { label: '暂停', color: 'text-gray-500 bg-gray-50' },
}

// 关键信息接口
interface KeyInfo {
  id: string
  type: string
  label: string
  icon: string
  value: string
}

interface MatchDetail {
  id: number
  name: string
  age: number
  gender: string
  occupation: string
  mbti: string
  zodiac: string
  meetingScene: string
  meetingDate: string
  relationshipStage: string
  interactionStatus: string
  impression: number
  impressionTags: string[]
  interests: string[]
  keyInfo: KeyInfo[]
  status: string
  notes: string
  lastContact: string
  nextAction: string
  progress: number
  stats: {
    tasks: number
    completedTasks: number
    quizScore: number
    dates: number
  }
}

interface AITopic {
  title: string
  reason: string
  opener: string
}

interface AISuggestion {
  action: string
  reason: string
  tips: string
}

const DetailPage: FC = () => {
  const router = useRouter()
  const [detail, setDetail] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiTopics, setAiTopics] = useState<AITopic[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [topicsLoading, setTopicsLoading] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [showTopicsModal, setShowTopicsModal] = useState(false)
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false)

  const fetchDetail = async () => {
    const id = router.params.id
    if (!id) return

    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/match/${id}`,
        method: 'GET'
      })
      console.log('Fetch detail response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setDetail(res.data.data)
      }
    } catch (error) {
      console.error('Fetch detail error:', error)
    } finally {
      setLoading(false)
    }
  }

  useLoad(() => {
    console.log('Detail page loaded.', router.params.id)
    fetchDetail()
  })

  const goBack = () => {
    navigateBack()
  }

  const goToEdit = () => {
    navigateTo({ url: `/pages/edit/index?id=${detail?.id}` })
  }

  const goToTasks = () => {
    navigateTo({ url: `/pages/tasks/index?matchId=${detail?.id}` })
  }

  const goToQuiz = () => {
    navigateTo({ url: `/pages/quiz/index?matchId=${detail?.id}` })
  }

  const fetchAITopics = async () => {
    if (!detail) return
    
    try {
      setTopicsLoading(true)
      setShowTopicsModal(true)
      const res = await Network.request({
        url: `/api/match/${detail.id}/ai-topics`,
        method: 'POST'
      })
      console.log('AI topics response:', res.data)
      if (res.data?.code === 200 && res.data?.data?.topics) {
        setAiTopics(res.data.data.topics)
      }
    } catch (error) {
      console.error('AI topics error:', error)
    } finally {
      setTopicsLoading(false)
    }
  }

  const fetchAISuggestions = async () => {
    if (!detail) return
    
    try {
      setSuggestionsLoading(true)
      setShowSuggestionsModal(true)
      const res = await Network.request({
        url: `/api/match/${detail.id}/ai-interaction`,
        method: 'POST',
        data: {}
      })
      console.log('AI suggestions response:', res.data)
      if (res.data?.code === 200 && res.data?.data?.suggestions) {
        setAiSuggestions(res.data.data.suggestions)
        
        // 自动将AI建议转化为任务
        try {
          const taskRes = await Network.request({
            url: `/api/task/create-from-suggestions/${detail.id}`,
            method: 'POST',
            data: { suggestions: res.data.data.suggestions }
          })
          console.log('Create tasks from suggestions response:', taskRes.data)
        } catch (taskError) {
          console.error('Create tasks from suggestions error:', taskError)
        }
      }
    } catch (error) {
      console.error('AI suggestions error:', error)
    } finally {
      setSuggestionsLoading(false)
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size={32} color="#6366F1" className="animate-spin" />
      </View>
    )
  }

  if (!detail) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="block text-gray-400">未找到对象信息</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-32">
      {/* 头部 */}
      <View className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 rounded-b-3xl">
        <View className="flex items-center justify-between mb-4">
          <View onClick={goBack}>
            <ArrowLeft size={24} color="#fff" />
          </View>
          <View 
            className="flex items-center gap-2 bg-white bg-opacity-20 rounded-full px-3 py-1"
            onClick={goToEdit}
          >
            <Pencil size={16} color="#fff" />
            <Text className="block text-white text-sm">编辑</Text>
          </View>
        </View>

        {/* 基本信息 */}
        <View className="flex items-center gap-4">
          <View className="w-16 h-16 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
            <Text className="block text-white text-2xl font-bold">
              {detail.name.charAt(0)}
            </Text>
          </View>
          <View className="flex-1">
            <View className="flex items-center gap-2 mb-1">
              <Text className="block text-white text-xl font-semibold">{detail.name}</Text>
              <Text className="block text-white text-opacity-80">{detail.age}岁</Text>
            </View>
            <Text className="block text-white text-opacity-80 text-sm">
              {detail.occupation} · {meetingSceneLabels[detail.meetingScene] || '其他'}
            </Text>
            <Badge className={`mt-2 ${statusConfig[detail.status as keyof typeof statusConfig]?.color || 'text-gray-500 bg-gray-50'}`}>
              {statusConfig[detail.status as keyof typeof statusConfig]?.label || '未知'}
            </Badge>
          </View>
          <View className="text-right">
            <View className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Heart
                  key={i}
                  size={14}
                  color={i < detail.impression ? '#EC4899' : 'rgba(255,255,255,0.3)'}
                />
              ))}
            </View>
            <Text className="block text-white text-opacity-80 text-xs mt-1">
              相识 {Math.ceil((new Date().getTime() - new Date(detail.meetingDate).getTime()) / (1000 * 60 * 60 * 24))} 天
            </Text>
          </View>
        </View>

        {/* 进度 */}
        <View className="mt-4 bg-white bg-opacity-20 rounded-xl p-3">
          <View className="flex items-center justify-between mb-2">
            <Text className="block text-white text-sm">关系进展</Text>
            <Text className="block text-white text-sm">{detail.progress}%</Text>
          </View>
          <Progress value={detail.progress} className="h-2 bg-white bg-opacity-30" />
        </View>
      </View>

      {/* 关系阶段和互动状态 */}
      <View className="p-4">
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <Text className="block font-semibold text-gray-800">💝 关系状态</Text>
              <View onClick={goToEdit}>
                <Pencil size={16} color="#6366F1" />
              </View>
            </View>
            <View className="flex gap-4">
              <View className="flex-1 text-center">
                <Text className="block text-xs text-gray-500 mb-1">当前阶段</Text>
                <Badge className="bg-indigo-100 text-indigo-600">
                  {relationshipStageLabels[detail.relationshipStage] || detail.relationshipStage}
                </Badge>
              </View>
              <View className="flex-1 text-center">
                <Text className="block text-xs text-gray-500 mb-1">互动状态</Text>
                <Badge className="bg-pink-100 text-pink-600">
                  {interactionStatusLabels[detail.interactionStatus] || detail.interactionStatus}
                </Badge>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* MBTI和星座 */}
      {(detail.mbti || detail.zodiac) && (
        <View className="px-4 pb-4">
          <Card className="shadow-sm border-0">
            <CardContent className="p-4">
              <View className="flex items-center justify-between mb-3">
                <Text className="block font-semibold text-gray-800">📊 基础资料</Text>
                <View onClick={goToEdit}>
                  <Pencil size={16} color="#6366F1" />
                </View>
              </View>
              <View className="flex gap-4">
                {detail.mbti && (
                  <View className="flex-1 text-center">
                    <Text className="block text-xs text-gray-500 mb-1">MBTI人格</Text>
                    <Badge className="bg-indigo-100 text-indigo-600">
                      {detail.mbti}
                    </Badge>
                  </View>
                )}
                {detail.zodiac && (
                  <View className="flex-1 text-center">
                    <Text className="block text-xs text-gray-500 mb-1">星座</Text>
                    <Badge className="bg-pink-100 text-pink-600">
                      {detail.zodiac}
                    </Badge>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 兴趣标签 */}
      <View className="px-4 pb-4">
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <Text className="block font-semibold text-gray-800">🎯 兴趣爱好</Text>
              <View onClick={goToEdit}>
                <Pencil size={16} color="#6366F1" />
              </View>
            </View>
            {detail.interests?.length > 0 ? (
              <View className="flex flex-wrap gap-2">
                {detail.interests.map((interest, i) => (
                  <Badge key={i} variant="outline" className="text-indigo-600 border-indigo-200">
                    {interest}
                  </Badge>
                ))}
              </View>
            ) : (
              <Text className="block text-sm text-gray-400">暂无记录</Text>
            )}
            {detail.notes && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                <Text className="block text-sm text-gray-500">{detail.notes}</Text>
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 关键信息 */}
      <View className="px-4 pb-4">
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <Text className="block font-semibold text-gray-800">🔑 关键信息</Text>
              <View onClick={goToEdit}>
                <Pencil size={16} color="#6366F1" />
              </View>
            </View>
            {detail.keyInfo?.length > 0 ? (
              <View className="space-y-3">
                {detail.keyInfo.map((info) => (
                  <View key={info.id} className="flex items-start gap-3 bg-amber-50 rounded-lg p-3">
                    <Text className="block text-lg">{info.icon}</Text>
                    <View className="flex-1">
                      <Text className="block text-xs text-gray-500">{info.label}</Text>
                      <Text className="block text-sm text-gray-800">{info.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="block text-sm text-gray-400">暂无记录，点击编辑添加</Text>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 快捷操作 */}
      <View className="px-4 pb-4">
        <Text className="block font-semibold text-gray-800 mb-3">快捷操作</Text>
        <View className="grid grid-cols-3 gap-3">
          <Card className="shadow-sm border-0" onClick={goToTasks}>
            <CardContent className="p-4 text-center">
              <View className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-2">
                <Sparkles size={24} color="#6366F1" />
              </View>
              <Text className="block text-sm font-medium text-gray-800">互动任务</Text>
              <Text className="block text-xs text-gray-400">{detail.stats.completedTasks}/{detail.stats.tasks} 完成</Text>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0" onClick={goToQuiz}>
            <CardContent className="p-4 text-center">
              <View className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2">
                <Gamepad2 size={24} color="#EC4899" />
              </View>
              <Text className="block text-sm font-medium text-gray-800">默契测试</Text>
              <Text className="block text-xs text-gray-400">{detail.stats.quizScore}分</Text>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0">
            <CardContent className="p-4 text-center">
              <View className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <TrendingUp size={24} color="#10B981" />
              </View>
              <Text className="block text-sm font-medium text-gray-800">约会记录</Text>
              <Text className="block text-xs text-gray-400">{detail.stats.dates}次</Text>
            </CardContent>
          </Card>
        </View>
      </View>

      {/* 下一步行动 */}
      <View className="px-4 pb-4">
        <Card className="shadow-sm border-0 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardContent className="p-4">
            <View className="flex items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                <MessageCircle size={20} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="block text-sm text-indigo-600 font-medium">下一步行动</Text>
                <Text className="block text-gray-800">{detail.nextAction}</Text>
              </View>
              <ChevronRight size={20} color="#6366F1" />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部操作 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <View className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={fetchAITopics}>
            <MessageCircle size={16} color="#6366F1" />
            <Text className="ml-1 text-indigo-600">话题推荐</Text>
          </Button>
          <Button className="flex-1 bg-indigo-500" onClick={fetchAISuggestions}>
            <Sparkles size={16} color="#fff" />
            <Text className="ml-1 text-white">互动建议</Text>
          </Button>
        </View>
      </View>

      {/* 话题推荐弹窗 */}
      {showTopicsModal && (
        <View 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          onClick={() => setShowTopicsModal(false)}
        >
          <View 
            className="w-full bg-white rounded-t-3xl p-4 max-h-[70vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <View className="flex items-center justify-between mb-4">
              <Text className="block text-lg font-semibold text-gray-800">AI话题推荐</Text>
              <View onClick={() => setShowTopicsModal(false)}>
                <Text className="block text-gray-400">关闭</Text>
              </View>
            </View>
            
            {topicsLoading ? (
              <View className="text-center py-8">
                <Loader size={32} color="#6366F1" className="animate-spin" />
                <Text className="block text-gray-400 mt-2">AI正在分析中...</Text>
              </View>
            ) : (
              aiTopics.map((topic, index) => (
                <Card key={index} className="mb-3 shadow-sm border-0">
                  <CardContent className="p-4">
                    <Text className="block font-semibold text-gray-800 mb-2">
                      {index + 1}. {topic.title}
                    </Text>
                    <Text className="block text-sm text-gray-500 mb-2">
                      💡 {topic.reason}
                    </Text>
                    <View className="bg-indigo-50 rounded-lg p-3">
                      <Text className="block text-sm text-indigo-600">
                        🗣️ 开场白：{topic.opener}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        </View>
      )}

      {/* 互动建议弹窗 */}
      {showSuggestionsModal && (
        <View 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          onClick={() => setShowSuggestionsModal(false)}
        >
          <View 
            className="w-full bg-white rounded-t-3xl p-4 max-h-[70vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <View className="flex items-center justify-between mb-4">
              <Text className="block text-lg font-semibold text-gray-800">AI互动建议</Text>
              <View onClick={() => setShowSuggestionsModal(false)}>
                <Text className="block text-gray-400">关闭</Text>
              </View>
            </View>
            
            {!suggestionsLoading && aiSuggestions.length > 0 && (
              <View className="bg-green-50 rounded-lg p-3 mb-4">
                <Text className="block text-sm text-green-600">
                  ✅ 建议已自动转化为任务，可在「互动任务」中查看
                </Text>
              </View>
            )}
            
            {suggestionsLoading ? (
              <View className="text-center py-8">
                <Loader size={32} color="#6366F1" className="animate-spin" />
                <Text className="block text-gray-400 mt-2">AI正在分析中...</Text>
              </View>
            ) : (
              aiSuggestions.map((suggestion, index) => (
                <Card key={index} className="mb-3 shadow-sm border-0">
                  <CardContent className="p-4">
                    <Text className="block font-semibold text-gray-800 mb-2">
                      {index + 1}. {suggestion.action}
                    </Text>
                    <Text className="block text-sm text-gray-500 mb-2">
                      💡 {suggestion.reason}
                    </Text>
                    <View className="bg-amber-50 rounded-lg p-3">
                      <Text className="block text-sm text-amber-600">
                        ⚠️ 注意：{suggestion.tips}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
            
            {!suggestionsLoading && aiSuggestions.length > 0 && (
              <Button 
                className="w-full bg-indigo-500" 
                onClick={() => {
                  setShowSuggestionsModal(false)
                  goToTasks()
                }}
              >
                <Sparkles size={16} color="#fff" />
                <Text className="ml-1 text-white">查看任务列表</Text>
              </Button>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

export default DetailPage
