import { View, Text } from '@tarojs/components'
import { useLoad, useRouter, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ChatDialog from '@/components/chat-dialog'
import CustomHeader from '@/components/custom-header'
import { 
  Pencil,
  ChevronRight,
  Calendar,
  ClipboardList,
  Loader,
  MessageCircle,
  Cpu,
  HardDrive,
  Heart,
  Sun,
  Moon,
  Cloud,
  Activity
} from 'lucide-react-taro'

// 硬件信息接口
interface HardwareInfo {
  age: number
  height?: string
  birthday?: string
  zodiac?: string
  bloodType?: string
  bodyType?: string
  style?: string
  wechat?: string
  phone?: string
  location?: string
  occupation?: string
  company?: string
  position?: string
}

// 软件信息接口
interface SoftwareInfo {
  mbti?: string
  personality?: string
  emotionalStyle?: string
  interests: string[]
  hobbies?: string
  schedule?: string
  spendingStyle?: string
  communicationStyle?: string
  likes?: string
  dislikes?: string
  loveExpectation?: string
  dealBreakers?: string
  // 新增
  communicationPreferences?: {
    effectiveWays?: string[]
    ineffectiveWays?: string[]
    landmines?: string[]
  }
  loveLanguages?: string[]
  emotionalTriggers?: {
    positive?: string[]
    negative?: string[]
  }
}

interface MatchDetail {
  id: number
  name: string
  gender: string
  hardware: HardwareInfo
  software: SoftwareInfo
  meetingScene: string
  meetingDate: string
  relationshipStage: string
  interactionStatus: string
  impression: number
  impressionTags: string[]
  keyInfo: Array<{ id: string; type: string; label: string; icon: string; value: string }>
  notes: string
  status: string
  nextAction: string
  lastContact: string
  stats: {
    tasks: number
    completedTasks: number
    dates: number
  }
  // 周期信息
  cycleStartDate?: string
  cycleLength?: number
}

interface CycleInfo {
  day: number
  phase: string
  phaseName: string
  description: string
  recommendations: string[]
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

// 周期阶段图标和颜色
const phaseConfig: Record<string, { icon: typeof Heart; color: string; bgColor: string }> = {
  menstrual: { icon: Moon, color: '#6B7280', bgColor: 'bg-gray-100' },
  follicular: { icon: Sun, color: '#10B981', bgColor: 'bg-emerald-50' },
  ovulation: { icon: Heart, color: '#EC4899', bgColor: 'bg-pink-50' },
  luteal_early: { icon: Sun, color: '#3B82F6', bgColor: 'bg-blue-50' },
  luteal_mid: { icon: Cloud, color: '#F59E0B', bgColor: 'bg-amber-50' },
  luteal_late: { icon: Moon, color: '#EF4444', bgColor: 'bg-red-50' },
}

// 硬件字段标签
const hardwareFieldLabels: Record<string, { label: string; icon: string }> = {
  age: { label: '年龄', icon: '👤' },
  height: { label: '身高', icon: '📏' },
  birthday: { label: '生日', icon: '🎂' },
  zodiac: { label: '星座', icon: '⭐' },
  bloodType: { label: '血型', icon: '🩸' },
  bodyType: { label: '体型', icon: '💪' },
  style: { label: '穿搭', icon: '👔' },
  wechat: { label: '微信', icon: '💬' },
  phone: { label: '电话', icon: '📱' },
  location: { label: '所在地', icon: '📍' },
  occupation: { label: '职业', icon: '💼' },
  company: { label: '公司', icon: '🏢' },
  position: { label: '职位', icon: '📋' },
}

// 软件字段标签
const softwareFieldLabels: Record<string, { label: string; icon: string }> = {
  mbti: { label: 'MBTI', icon: '🧠' },
  personality: { label: '性格', icon: '💫' },
  emotionalStyle: { label: '情绪', icon: '🎭' },
  hobbies: { label: '爱好', icon: '🎯' },
  schedule: { label: '作息', icon: '⏰' },
  spendingStyle: { label: '消费观', icon: '💳' },
  communicationStyle: { label: '沟通风格', icon: '🗣️' },
  likes: { label: '喜欢', icon: '❤️' },
  dislikes: { label: '讨厌', icon: '💔' },
  loveExpectation: { label: '恋爱期待', icon: '💑' },
  dealBreakers: { label: '雷区', icon: '⚠️' },
}

const DetailPage: FC = () => {
  const router = useRouter()
  const [detail, setDetail] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

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
        
        // 获取周期信息
        if (res.data.data.cycleStartDate) {
          const cycleRes = await Network.request({ url: `/api/match/${id}/cycle` })
          if (cycleRes.data?.code === 200 && cycleRes.data?.data) {
            setCycleInfo(cycleRes.data.data)
          }
        }
      }
    } catch (error) {
      console.error('Fetch detail error:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToEdit = () => navigateTo({ url: `/pages/edit/index?id=${detail?.id}` })
  const goToTasks = () => navigateTo({ url: `/pages/tasks/index?matchId=${detail?.id}` })
  const goToDates = () => navigateTo({ url: `/pages/dates/index?matchId=${detail?.id}` })

  // 构建对话上下文
  const getChatContext = () => {
    if (!detail) return null
    return {
      matchId: detail.id,
      matchName: detail.name,
      hardware: { ...detail.hardware } as Record<string, unknown>,
      software: { ...detail.software } as Record<string, unknown>,
      cycleInfo: cycleInfo ? {
        day: cycleInfo.day,
        phase: cycleInfo.phase,
        phaseName: cycleInfo.phaseName,
        description: cycleInfo.description
      } : undefined,
      relationshipStage: detail.relationshipStage,
      interactionStatus: detail.interactionStatus
    }
  }

  // 提取硬件信息项
  const getHardwareItems = (hw: HardwareInfo | undefined) => {
    if (!hw) return []
    const items: Array<{ key: string; label: string; icon: string; value: string }> = []
    Object.keys(hardwareFieldLabels).forEach(key => {
      const value = hw[key as keyof HardwareInfo]
      if (value !== undefined && value !== '' && key !== 'interests') {
        const field = hardwareFieldLabels[key]
        items.push({
          key,
          label: field.label,
          icon: field.icon,
          value: String(value)
        })
      }
    })
    return items
  }

  // 提取软件信息项
  const getSoftwareItems = (sw: SoftwareInfo | undefined) => {
    if (!sw) return []
    const items: Array<{ key: string; label: string; icon: string; value: string }> = []
    Object.keys(softwareFieldLabels).forEach(key => {
      const value = sw[key as keyof SoftwareInfo]
      if (value !== undefined && value !== '' && key !== 'interests') {
        const field = softwareFieldLabels[key]
        items.push({
          key,
          label: field.label,
          icon: field.icon,
          value: String(value)
        })
      }
    })
    return items
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

  const hardwareItems = getHardwareItems(detail.hardware)
  const softwareItems = getSoftwareItems(detail.software)
  const interests = detail.software?.interests || []

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部 */}
      <CustomHeader 
        title="档案" 
      />

      {/* 基本信息卡片 */}
      <View className="p-4">
        <Card className="border border-gray-100">
          <CardContent className="p-4">
            <View className="flex items-start justify-between mb-3">
              <View className="flex-1">
                <View className="flex items-center gap-2">
                  <Text className="block text-xl font-bold text-gray-900">{detail.name}</Text>
                  <View onClick={goToEdit} className="p-1">
                    <Pencil size={16} color="#9CA3AF" />
                  </View>
                </View>
                <Text className="block text-sm text-gray-500 mt-1">
                  {detail.hardware?.age ? `${detail.hardware.age}岁` : ''}
                  {detail.hardware?.occupation ? ` · ${detail.hardware.occupation}` : ''}
                </Text>
              </View>
              <View className="flex gap-2">
                {detail.software?.mbti && (
                  <Badge className="bg-gray-100 text-gray-600">{detail.software.mbti}</Badge>
                )}
                {detail.hardware?.zodiac && (
                  <Badge className="bg-gray-100 text-gray-600">{detail.hardware.zodiac}</Badge>
                )}
              </View>
            </View>
            
            <View className="flex gap-3">
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

      {/* 硬件信息 */}
      <View className="px-4 pb-4">
        <View className="flex items-center gap-2 mb-2">
          <HardDrive size={14} color="#6B7280" />
          <Text className="block text-sm font-semibold text-gray-900">硬件信息</Text>
          <Text className="block text-xs text-gray-400">外在属性</Text>
        </View>
        {hardwareItems.length > 0 ? (
          <View className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {hardwareItems.map((item) => (
              <View key={item.key} className="flex items-center px-4 py-3">
                <Text className="block text-base mr-3">{item.icon}</Text>
                <View className="flex-1">
                  <Text className="block text-xs text-gray-400">{item.label}</Text>
                  <Text className="block text-sm text-gray-700">{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <Text className="block text-sm text-gray-400">暂无硬件信息，点击编辑添加</Text>
          </View>
        )}
      </View>

      {/* 软件信息 */}
      <View className="px-4 pb-4">
        <View className="flex items-center gap-2 mb-2">
          <Cpu size={14} color="#6B7280" />
          <Text className="block text-sm font-semibold text-gray-900">软件信息</Text>
          <Text className="block text-xs text-gray-400">内在特质</Text>
        </View>
        {softwareItems.length > 0 ? (
          <View className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {softwareItems.map((item) => (
              <View key={item.key} className="flex items-center px-4 py-3">
                <Text className="block text-base mr-3">{item.icon}</Text>
                <View className="flex-1">
                  <Text className="block text-xs text-gray-400">{item.label}</Text>
                  <Text className="block text-sm text-gray-700">{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <Text className="block text-sm text-gray-400">暂无软件信息，点击编辑添加</Text>
          </View>
        )}
      </View>

      {/* 兴趣标签 */}
      {interests.length > 0 && (
        <View className="px-4 pb-4">
          <Text className="block text-sm font-semibold text-gray-900 mb-2">兴趣爱好</Text>
          <View className="flex flex-wrap gap-2">
            {interests.map((interest, i) => (
              <Badge key={i} className="bg-gray-100 text-gray-600">{interest}</Badge>
            ))}
          </View>
        </View>
      )}

      {/* 周期追踪 */}
      {cycleInfo && (() => {
        const phaseConf = phaseConfig[cycleInfo.phase] || phaseConfig.follicular
        const PhaseIcon = phaseConf.icon
        return (
          <View className="px-4 pb-4">
            <View className="flex items-center gap-2 mb-2">
              <Activity size={14} color="#6B7280" />
              <Text className="block text-sm font-semibold text-gray-900">周期状态</Text>
            </View>
            <View className={`${phaseConf.bgColor} rounded-xl p-4`}>
              <View className="flex items-center justify-between mb-2">
                <View className="flex items-center gap-2">
                  <PhaseIcon size={16} color={phaseConf.color} />
                  <Text className="block font-semibold" style={{ color: phaseConf.color }}>
                    {cycleInfo.phaseName}
                  </Text>
                </View>
                <Text className="block text-xs text-gray-500">Day {cycleInfo.day}</Text>
              </View>
              <Text className="block text-sm text-gray-600 mb-3">{cycleInfo.description}</Text>
              <View className="space-y-1">
                {cycleInfo.recommendations.slice(0, 3).map((rec, i) => (
                  <View key={i} className="flex items-start gap-2">
                    <Text className="block text-xs text-gray-400">•</Text>
                    <Text className="block text-xs text-gray-600">{rec}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )
      })()}

      {/* 交流偏好 */}
      {detail.software?.communicationPreferences && (
        <View className="px-4 pb-4">
          <Text className="block text-sm font-semibold text-gray-900 mb-2">交流偏好</Text>
          <View className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {detail.software.communicationPreferences.effectiveWays?.length ? (
              <View className="px-4 py-3">
                <Text className="block text-xs text-emerald-600 mb-1">✓ 有效方式</Text>
                <Text className="block text-sm text-gray-700">
                  {detail.software.communicationPreferences.effectiveWays.join('、')}
                </Text>
              </View>
            ) : null}
            {detail.software.communicationPreferences.ineffectiveWays?.length ? (
              <View className="px-4 py-3">
                <Text className="block text-xs text-amber-600 mb-1">⚠ 无效方式</Text>
                <Text className="block text-sm text-gray-700">
                  {detail.software.communicationPreferences.ineffectiveWays.join('、')}
                </Text>
              </View>
            ) : null}
            {detail.software.communicationPreferences.landmines?.length ? (
              <View className="px-4 py-3">
                <Text className="block text-xs text-red-600 mb-1">💣 雷区</Text>
                <Text className="block text-sm text-gray-700">
                  {detail.software.communicationPreferences.landmines.join('、')}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {/* 爱的语言 */}
      {detail.software?.loveLanguages?.length ? (
        <View className="px-4 pb-4">
          <Text className="block text-sm font-semibold text-gray-900 mb-2">爱的语言</Text>
          <View className="flex flex-wrap gap-2">
            {detail.software.loveLanguages.map((lang, i) => (
              <Badge key={i} className={i === 0 ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}>
                {i === 0 ? '❤️ ' : ''}{lang}
              </Badge>
            ))}
          </View>
        </View>
      ) : null}

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

      {/* 备注 */}
      {detail.notes && (
        <View className="px-4 pb-4">
          <Text className="block text-sm font-semibold text-gray-900 mb-2">备注</Text>
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            <Text className="block text-sm text-gray-600">{detail.notes}</Text>
          </View>
        </View>
      )}

      {/* 底部操作 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <Button className="w-full bg-black" onClick={() => setChatOpen(true)}>
          <MessageCircle size={16} color="#fff" />
          <Text className="ml-2 text-white">AI 助手</Text>
        </Button>
      </View>

      {/* AI 对话框 */}
      <ChatDialog 
        open={chatOpen} 
        onOpenChange={setChatOpen} 
        context={getChatContext()} 
      />
    </View>
  )
}

export default DetailPage
