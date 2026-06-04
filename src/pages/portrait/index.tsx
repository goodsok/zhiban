import { View, Text } from '@tarojs/components'
import Taro, { useLoad, useDidShow, useRouter } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { Button } from '@/components/ui/button'
import { Loader, RefreshCw, Brain, History, ArrowRight } from 'lucide-react-taro'
import RadarChart from '@/components/portrait-radar'
import DimensionCard from '@/components/portrait-dimension-card'
import DimensionOverview from '@/components/dimension-overview'
import PortraitHistory from '@/components/portrait-history'
import InsightSection from '@/components/insight-section'

// 画像维度
interface PortraitDimensions {
  personality: {
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
  }
  emotional: {
    stability: number
    expression: number
    empathy: number
    independence: number
  }
  social: {
    activity: number
    initiative: number
    intimacy: number
    trust: number
  }
  communication: {
    directness: number
    humor: number
    responsiveness: number
    depth: number
  }
}

// 历史记录
interface HistoryItem {
  id: number
  matchId: number
  dimension: string
  oldValue: number
  newValue: number
  changeReason: string
  evidence: string | null
  createdAt: string
}

// 完整画像
interface FullPortrait {
  dimensions: PortraitDimensions
  interactionStyle: 'active' | 'passive' | 'balanced'
  preferredTopicTypes: string[]
  activeTimeSlots: string[]
  confidence: number
  history: HistoryItem[]
  lastUpdated: string
  dimensionFilledCount: number
  dimensionTotalCount: number
}

const PortraitPage: FC = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [portrait, setPortrait] = useState<FullPortrait | null>(null)
  const [dimensionData, setDimensionData] = useState<Record<string, any> | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'dimensions' | 'insight' | 'history'>('overview')
  const [matchName, setMatchName] = useState('')

  useLoad(() => {
    console.log('Portrait page loaded.', router.params.matchId)
    fetchData()
  })

  useDidShow(() => {
    // 每次页面显示时刷新数据（从维度编辑页返回时会触发）
    fetchData()
  })

  const fetchData = async () => {
    const matchId = router.params.matchId
    if (!matchId) return

    try {
      setLoading(true)
      
      // 获取画像
      const portraitRes = await Network.request({
        url: `/api/portrait/${matchId}`,
        method: 'GET'
      })
      
      console.log('Portrait API response:', portraitRes.data)
      
      if (portraitRes.data?.code === 200 && portraitRes.data?.data) {
        setPortrait(portraitRes.data.data)
      }

      // 获取对象名字
      const matchRes = await Network.request({
        url: `/api/match/${matchId}`,
        method: 'GET'
      })
      
      if (matchRes.data?.code === 200 && matchRes.data?.data?.name) {
        setMatchName(matchRes.data.data.name)
      }

      // 获取维度数据
      const dimRes = await Network.request({
        url: `/api/dimension/profile/${matchId}`,
        method: 'GET'
      })
      
      if (dimRes.data?.code === 200 && dimRes.data?.data?.dimensions) {
        setDimensionData(dimRes.data.data.dimensions)
      }
    } catch (error) {
      console.error('Fetch portrait error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    const matchId = router.params.matchId
    if (!matchId) return

    try {
      setAnalyzing(true)
      const res = await Network.request({
        url: `/api/portrait/${matchId}/analyze`,
        method: 'POST'
      })
      
      if (res.data?.code === 200 && res.data?.data) {
        setPortrait(res.data.data)
      }
    } catch (error) {
      console.error('Analyze error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  // 跳转到档案维度页面
  const goToDimensionPage = () => {
    const matchId = router.params.matchId
    if (!matchId) return
    Taro.navigateTo({ url: `/pages/detail/index?id=${matchId}` })
  }

  // 准备雷达图数据
  const getRadarDimensions = () => {
    if (!portrait) return []
    const d = portrait.dimensions
    return [
      { name: '开放性', value: d.personality.openness },
      { name: '外向性', value: d.personality.extraversion },
      { name: '宜人性', value: d.personality.agreeableness },
      { name: '稳定性', value: d.emotional.stability },
      { name: '共情力', value: d.emotional.empathy },
      { name: '主动性', value: d.social.initiative },
    ]
  }

  // 获取维度描述
  const getDimensionDescription = (name: string, value: number): string => {
    const highDesc: Record<string, string> = {
      '开放性': '思维活跃，喜欢尝试新事物',
      '尽责性': '做事认真负责，注重细节',
      '外向性': '性格外向，喜欢社交',
      '宜人性': '随和友善，容易相处',
      '神经质': '情绪敏感，需要关注',
      '稳定性': '情绪平稳，心理素质好',
      '表达力': '善于表达情感，沟通顺畅',
      '共情力': '善于理解他人感受',
      '独立性': '情感独立，不依赖他人',
      '活跃度': '社交活跃，喜欢互动',
      '主动性': '主动发起交流，积极热情',
      '亲密需求': '渴望亲密关系和陪伴',
      '信任感': '容易信任他人',
      '直接度': '沟通直接，不拐弯抹角',
      '幽默感': '幽默风趣，善于调节气氛',
      '响应速度': '回复及时，关注度高',
      '深度偏好': '喜欢深度交流',
    }
    
    const lowDesc: Record<string, string> = {
      '开放性': '偏好稳定，不太追求变化',
      '尽责性': '随性自由，不拘小节',
      '外向性': '性格内向，喜欢独处',
      '宜人性': '有主见，不轻易妥协',
      '神经质': '情绪稳定，不易波动',
      '稳定性': '情绪波动较大，需要关怀',
      '表达力': '含蓄内敛，不善表达',
      '共情力': '理性客观，关注事实',
      '独立性': '情感依赖较强',
      '活跃度': '社交较少，喜欢安静',
      '主动性': '被动等待，需要引导',
      '亲密需求': '独立空间需求较大',
      '信任感': '谨慎戒备，需要时间建立信任',
      '直接度': '委婉含蓄，注意方式',
      '幽默感': '严肃认真，不苟言笑',
      '响应速度': '回复较慢，可能有其他安排',
      '深度偏好': '喜欢轻松闲聊',
    }

    if (value >= 70) return highDesc[name] || ''
    if (value <= 30) return lowDesc[name] || ''
    return ''
  }

  // 数据完成度
  const getCompletionInfo = () => {
    if (!portrait) return { filled: 0, total: 0, percent: 0 }
    const filled = portrait.dimensionFilledCount || 0
    const total = portrait.dimensionTotalCount || 0
    const percent = total > 0 ? Math.round((filled / total) * 100) : 0
    return { filled, total, percent }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size={24} color="#6B7280" className="animate-spin" />
      </View>
    )
  }

  const completion = getCompletionInfo()

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      <CustomHeader title={`${matchName ? matchName + '的' : ''}画像`} />

      {/* 数据来源提示：引导去档案维度填写 */}
      <View className="px-4 pt-4">
        <View className="bg-white rounded-xl border border-gray-100 p-4">
          <View className="flex items-start gap-3 mb-3">
            <View className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Brain size={18} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="block text-sm font-semibold text-gray-900">画像数据来源</Text>
              <Text className="block text-xs text-gray-500 mt-1">
                画像基于档案维度数据自动生成，填写越完整画像越准确
              </Text>
            </View>
          </View>

          {/* 完成度进度条 */}
          <View className="mb-3">
            <View className="flex items-center justify-between mb-1">
              <Text className="block text-xs text-gray-500">档案完成度</Text>
              <Text className="block text-xs text-gray-700 font-medium">{completion.percent}%（{completion.filled}/{completion.total}项）</Text>
            </View>
            <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <View 
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${completion.percent}%` }}
              />
            </View>
          </View>

          <Button
            size="sm"
            className="w-full bg-blue-500 text-white"
            onClick={goToDimensionPage}
          >
            <Text className="text-white">去填写档案维度</Text>
            <ArrowRight size={14} color="#ffffff" className="ml-1" />
          </Button>

          {completion.percent < 50 && (
            <View className="mt-2 flex items-start gap-1.5 p-2 bg-amber-50 rounded">
              <Text className="block text-xs text-amber-700">
                档案数据较少，画像可能不够准确，建议补充更多维度
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 置信度 & 重新分析 */}
      <View className="px-4 pt-3">
        <View className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3">
          <View className="flex items-center gap-2">
            <Brain size={16} color="#6B7280" />
            <Text className="block text-sm text-gray-600">
              画像置信度 {portrait?.confidence || 0}%
            </Text>
          </View>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-xs"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <RefreshCw size={14} color="#6B7280" className="animate-spin" />
            ) : (
              <RefreshCw size={14} color="#6B7280" />
            )}
            <Text className="ml-1 text-gray-600">{analyzing ? '分析中' : '重新分析'}</Text>
          </Button>
        </View>
      </View>

      {/* Tab 切换 */}
      <View className="px-4 pt-4">
        <View className="flex bg-gray-100 rounded-lg p-1">
          {[
            { key: 'overview', label: '概览' },
            { key: 'dimensions', label: '维度' },
            { key: 'insight', label: '洞察' },
            { key: 'history', label: '历史' },
          ].map((tab) => (
            <View
              key={tab.key}
              className={`flex-1 py-2 rounded-md text-center ${
                activeTab === tab.key ? 'bg-white shadow-sm' : ''
              }`}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
            >
              <Text
                className={`block text-sm ${
                  activeTab === tab.key ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 概览 Tab */}
      {activeTab === 'overview' && portrait && (
        <View className="p-4">
          {/* 雷达图 */}
          <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex items-center justify-center">
            <RadarChart dimensions={getRadarDimensions()} size={240} />
          </View>

          {/* 人格维度 */}
          <DimensionCard
            title="人格维度"
            icon="🧠"
            dimensions={[
              { 
                name: '开放性', 
                value: portrait.dimensions.personality.openness,
                description: getDimensionDescription('开放性', portrait.dimensions.personality.openness)
              },
              { 
                name: '尽责性', 
                value: portrait.dimensions.personality.conscientiousness,
                description: getDimensionDescription('尽责性', portrait.dimensions.personality.conscientiousness)
              },
              { 
                name: '外向性', 
                value: portrait.dimensions.personality.extraversion,
                description: getDimensionDescription('外向性', portrait.dimensions.personality.extraversion)
              },
              { 
                name: '宜人性', 
                value: portrait.dimensions.personality.agreeableness,
                description: getDimensionDescription('宜人性', portrait.dimensions.personality.agreeableness)
              },
            ]}
          />

          {/* 情感维度 */}
          <DimensionCard
            title="情感维度"
            icon="❤️"
            dimensions={[
              { 
                name: '稳定性', 
                value: portrait.dimensions.emotional.stability,
                description: getDimensionDescription('稳定性', portrait.dimensions.emotional.stability)
              },
              { 
                name: '表达力', 
                value: portrait.dimensions.emotional.expression,
                description: getDimensionDescription('表达力', portrait.dimensions.emotional.expression)
              },
              { 
                name: '共情力', 
                value: portrait.dimensions.emotional.empathy,
                description: getDimensionDescription('共情力', portrait.dimensions.emotional.empathy)
              },
            ]}
          />

          {/* 社交维度 */}
          <DimensionCard
            title="社交维度"
            icon="👥"
            dimensions={[
              { 
                name: '活跃度', 
                value: portrait.dimensions.social.activity,
                description: getDimensionDescription('活跃度', portrait.dimensions.social.activity)
              },
              { 
                name: '主动性', 
                value: portrait.dimensions.social.initiative,
                description: getDimensionDescription('主动性', portrait.dimensions.social.initiative)
              },
              { 
                name: '亲密需求', 
                value: portrait.dimensions.social.intimacy,
                description: getDimensionDescription('亲密需求', portrait.dimensions.social.intimacy)
              },
            ]}
          />

          {/* 沟通维度 */}
          <DimensionCard
            title="沟通维度"
            icon="💬"
            dimensions={[
              { 
                name: '直接度', 
                value: portrait.dimensions.communication.directness,
                description: getDimensionDescription('直接度', portrait.dimensions.communication.directness)
              },
              { 
                name: '幽默感', 
                value: portrait.dimensions.communication.humor,
                description: getDimensionDescription('幽默感', portrait.dimensions.communication.humor)
              },
              { 
                name: '响应速度', 
                value: portrait.dimensions.communication.responsiveness,
                description: getDimensionDescription('响应速度', portrait.dimensions.communication.responsiveness)
              },
            ]}
          />
        </View>
      )}

      {/* 维度 Tab */}
      {activeTab === 'dimensions' && dimensionData && (
        <View className="p-4">
          <DimensionOverview dimensions={dimensionData} />
        </View>
      )}

      {/* 洞察 Tab */}
      {activeTab === 'insight' && (
        <InsightSection matchId={router.params.matchId ?? ''} matchName={matchName || 'Ta'} />
      )}

      {/* 历史 Tab */}
      {activeTab === 'history' && portrait && (
        <View className="p-4">
          <View className="flex items-center gap-2 mb-3">
            <History size={14} color="#6B7280" />
            <Text className="block text-sm font-semibold text-gray-900">画像变化记录</Text>
          </View>
          <PortraitHistory history={portrait.history} limit={20} />
        </View>
      )}
    </View>
  )
}

export default PortraitPage
