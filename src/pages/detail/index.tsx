import { View, Text } from '@tarojs/components'
import { useLoad, useRouter, navigateBack, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Pencil,
  ChevronRight,
  Sparkles,
  Calendar,
  ClipboardList,
  Loader,
  MessageCircle
} from 'lucide-react-taro'

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
  occupation: string
  mbti: string
  zodiac: string
  relationshipStage: string
  interactionStatus: string
  impression: number
  interests: string[]
  keyInfo: KeyInfo[]
  notes: string
  nextAction: string
  stats: {
    tasks: number
    completedTasks: number
    dates: number
  }
}

const stageLabels: Record<string, string> = {
  new: '刚认识',
  contacting: '接触中',
  dating: '约会中',
  progressing: '发展中',
}

const statusLabels: Record<string, string> = {
  just_met: '一面之缘',
  got_contact: '有联系方式',
  chatted: '聊过天',
  good_vibe: '聊得不错',
  met_up: '见过面',
  dating_regularly: '稳定约会',
  ambiguous: '暧昧期',
  confirming: '准备确认',
}

const DetailPage: FC = () => {
  const router = useRouter()
  const [detail, setDetail] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)

  useLoad(() => {
    console.log('Detail page loaded.', router.params.id)
    fetchDetail()
  })

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

  const goBack = () => navigateBack()
  const goToEdit = () => navigateTo({ url: `/pages/edit/index?id=${detail?.id}` })
  const goToTasks = () => navigateTo({ url: `/pages/tasks/index?matchId=${detail?.id}` })
  const goToDates = () => navigateTo({ url: `/pages/dates/index?matchId=${detail?.id}` })

  const getAISuggestion = async () => {
    if (!detail) return
    
    try {
      setAiLoading(true)
      const res = await Network.request({
        url: `/api/match/${detail.id}/ai-interaction`,
        method: 'POST',
        data: {}
      })
      console.log('AI suggestion response:', res.data)
      if (res.data?.code === 200 && res.data?.data?.suggestions?.[0]) {
        setAiSuggestion(res.data.data.suggestions[0].action)
      }
    } catch (error) {
      console.error('AI suggestion error:', error)
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size={24} color="#6B7280" className="animate-spin" />
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
    <View className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部 */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex items-center justify-between">
          <View onClick={goBack}>
            <ArrowLeft size={24} color="#374151" />
          </View>
          <Text className="block text-base font-semibold text-gray-900">档案</Text>
          <View onClick={goToEdit}>
            <Pencil size={20} color="#6B7280" />
          </View>
        </View>
      </View>

      {/* 基本信息 */}
      <View className="p-4">
        <Card className="border border-gray-100">
          <CardContent className="p-4">
            <View className="flex items-start justify-between mb-4">
              <View>
                <Text className="block text-xl font-bold text-gray-900 mb-1">{detail.name}</Text>
                <Text className="block text-sm text-gray-500">{detail.age}岁 · {detail.occupation}</Text>
              </View>
              <View className="flex gap-2">
                {detail.mbti && (
                  <Badge className="bg-gray-100 text-gray-600">{detail.mbti}</Badge>
                )}
                {detail.zodiac && (
                  <Badge className="bg-gray-100 text-gray-600">{detail.zodiac}</Badge>
                )}
              </View>
            </View>
            
            <View className="flex gap-4">
              <View className="flex-1 text-center py-2 bg-gray-50 rounded-lg">
                <Text className="block text-sm font-semibold text-gray-900">
                  {stageLabels[detail.relationshipStage] || detail.relationshipStage}
                </Text>
                <Text className="block text-xs text-gray-400 mt-1">关系阶段</Text>
              </View>
              <View className="flex-1 text-center py-2 bg-gray-50 rounded-lg">
                <Text className="block text-sm font-semibold text-gray-900">
                  {statusLabels[detail.interactionStatus] || detail.interactionStatus}
                </Text>
                <Text className="block text-xs text-gray-400 mt-1">互动状态</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 关键信息 */}
      <View className="px-4 pb-4">
        <View className="flex items-center justify-between mb-2">
          <Text className="block text-sm font-semibold text-gray-900">关键信息</Text>
          <View onClick={goToEdit}>
            <Text className="block text-xs text-gray-400">编辑</Text>
          </View>
        </View>
        {detail.keyInfo?.length > 0 ? (
          <View className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {detail.keyInfo.map((info) => (
              <View key={info.id} className="flex items-center px-4 py-3">
                <Text className="block text-base mr-3">{info.icon}</Text>
                <View className="flex-1">
                  <Text className="block text-xs text-gray-400">{info.label}</Text>
                  <Text className="block text-sm text-gray-700">{info.value}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <Text className="block text-sm text-gray-400">暂无关键信息，点击编辑添加</Text>
          </View>
        )}
      </View>

      {/* 兴趣标签 */}
      {detail.interests?.length > 0 && (
        <View className="px-4 pb-4">
          <Text className="block text-sm font-semibold text-gray-900 mb-2">兴趣爱好</Text>
          <View className="flex flex-wrap gap-2">
            {detail.interests.map((interest, i) => (
              <Badge key={i} className="bg-gray-100 text-gray-600">{interest}</Badge>
            ))}
          </View>
        </View>
      )}

      {/* 快捷入口 */}
      <View className="px-4 pb-4">
        <Text className="block text-sm font-semibold text-gray-900 mb-2">操作</Text>
        <View className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          <View 
            className="flex items-center justify-between px-4 py-3"
            onClick={goToTasks}
          >
            <View className="flex items-center gap-3">
              <ClipboardList size={18} color="#374151" />
              <Text className="block text-sm text-gray-700">任务</Text>
            </View>
            <View className="flex items-center gap-2">
              <Text className="block text-xs text-gray-400">
                {detail.stats.completedTasks}/{detail.stats.tasks}
              </Text>
              <ChevronRight size={16} color="#D1D5DB" />
            </View>
          </View>
          <View 
            className="flex items-center justify-between px-4 py-3"
            onClick={goToDates}
          >
            <View className="flex items-center gap-3">
              <Calendar size={18} color="#374151" />
              <Text className="block text-sm text-gray-700">约会记录</Text>
            </View>
            <View className="flex items-center gap-2">
              <Text className="block text-xs text-gray-400">{detail.stats.dates}次</Text>
              <ChevronRight size={16} color="#D1D5DB" />
            </View>
          </View>
        </View>
      </View>

      {/* AI建议 */}
      <View className="px-4 pb-4">
        <Text className="block text-sm font-semibold text-gray-900 mb-2">AI建议</Text>
        {aiSuggestion ? (
          <View className="bg-gray-900 rounded-xl p-4">
            <Text className="block text-white text-sm">{aiSuggestion}</Text>
          </View>
        ) : (
          <Button 
            variant="outline" 
            className="w-full border-gray-200"
            onClick={getAISuggestion}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <Loader size={16} color="#6B7280" className="animate-spin" />
            ) : (
              <Sparkles size={16} color="#6B7280" />
            )}
            <Text className="ml-2 text-gray-600">
              {aiLoading ? '分析中...' : '获取下一步建议'}
            </Text>
          </Button>
        )}
      </View>

      {/* 底部操作 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <Button className="w-full bg-black" onClick={getAISuggestion}>
          <MessageCircle size={16} color="#fff" />
          <Text className="ml-2 text-white">获取AI建议</Text>
        </Button>
      </View>
    </View>
  )
}

export default DetailPage
