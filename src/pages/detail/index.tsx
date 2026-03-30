import { View, Text } from '@tarojs/components'
import { useLoad, useRouter, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState, useCallback } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import ChatDialog from '@/components/chat-dialog'
import DimensionViewer from '@/components/dimension-viewer'
import CustomHeader from '@/components/custom-header'
import { 
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
  Activity,
  TrendingUp,
  Brain,
  Database,
  Check,
  X,
  Pencil
} from 'lucide-react-taro'

// 硬件信息接口
interface HardwareInfo {
  age?: number
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

// 推进值接口
interface ProgressScore {
  total: number
  stage: {
    key: string
    name: string
    minScore: number
    maxScore: number
    description: string
    focus: string
  }
  breakdown: {
    infoCompleteness: number
    interactionDepth: number
    taskCompletion: number
    keyInfoMastery: number
    timeActivity: number
  }
  insights: string[]
  nextActions: string[]
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
  progressScore?: ProgressScore
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

// 关系阶段选项
const relationshipStages = [
  { id: 'new', label: '刚认识' },
  { id: 'contacting', label: '接触中' },
  { id: 'dating', label: '约会中' },
  { id: 'progressing', label: '发展中' },
]

// 互动状态选项
const interactionStatuses = [
  { id: 'just_met', label: '一面之缘' },
  { id: 'got_contact', label: '有联系方式' },
  { id: 'chatted', label: '聊过天' },
  { id: 'good_vibe', label: '聊得不错' },
  { id: 'met_up', label: '见过面' },
  { id: 'dating_regularly', label: '稳定约会' },
  { id: 'ambiguous', label: '暧昧期' },
  { id: 'confirming', label: '准备确认' },
]

// 预设兴趣
const presetInterests = [
  '旅行', '摄影', '美食', '健身', '电影', '音乐', '阅读', '游戏',
  '绘画', '烹饪', '瑜伽', '游泳', '骑行', '露营', '养宠', '追剧',
]

// 周期阶段配置
const phaseConfig: Record<string, { icon: typeof Heart; color: string; bgColor: string }> = {
  menstrual: { icon: Moon, color: '#6B7280', bgColor: 'bg-gray-100' },
  follicular: { icon: Sun, color: '#10B981', bgColor: 'bg-emerald-50' },
  ovulation: { icon: Heart, color: '#EC4899', bgColor: 'bg-pink-50' },
  luteal_early: { icon: Sun, color: '#3B82F6', bgColor: 'bg-blue-50' },
  luteal_mid: { icon: Cloud, color: '#F59E0B', bgColor: 'bg-amber-50' },
  luteal_late: { icon: Moon, color: '#EF4444', bgColor: 'bg-red-50' },
}

// 硬件字段标签
const hardwareFieldLabels: Record<string, { label: string; icon: string; type?: string }> = {
  age: { label: '年龄', icon: '👤', type: 'number' },
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

// 可编辑字段类型
type EditableField = {
  category: 'name' | 'hardware' | 'software' | 'notes'
  key: string
}

const DetailPage: FC = () => {
  const router = useRouter()
  const [detail, setDetail] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  
  // 内联编辑状态
  const [editingField, setEditingField] = useState<EditableField | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [saving, setSaving] = useState(false)

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

  // 开始编辑字段
  const startEdit = useCallback((field: EditableField) => {
    if (!detail) return
    
    let value = ''
    if (field.category === 'name') {
      value = detail.name
    } else if (field.category === 'hardware') {
      value = String(detail.hardware?.[field.key as keyof HardwareInfo] || '')
    } else if (field.category === 'software') {
      value = String(detail.software?.[field.key as keyof SoftwareInfo] || '')
    } else if (field.category === 'notes') {
      value = detail.notes || ''
    }
    
    setEditValue(value)
    setEditingField(field)
  }, [detail])

  // 取消编辑
  const cancelEdit = useCallback(() => {
    setEditingField(null)
    setEditValue('')
  }, [])

  // 保存编辑
  const saveEdit = useCallback(async () => {
    if (!detail || !editingField) return
    
    try {
      setSaving(true)
      const updateData: Record<string, unknown> = {}
      
      if (editingField.category === 'name') {
        updateData.name = editValue
      } else if (editingField.category === 'hardware') {
        updateData.hardware = {
          ...detail.hardware,
          [editingField.key]: hardwareFieldLabels[editingField.key]?.type === 'number' 
            ? (editValue ? parseInt(editValue) : undefined)
            : editValue || undefined
        }
      } else if (editingField.category === 'software') {
        updateData.software = {
          ...detail.software,
          [editingField.key]: editValue || undefined
        }
      } else if (editingField.category === 'notes') {
        updateData.notes = editValue || undefined
      }
      
      await Network.request({
        url: `/api/match/${detail.id}`,
        method: 'PUT',
        data: updateData
      })
      
      // 更新本地状态
      setDetail(prev => {
        if (!prev) return prev
        const updated = { ...prev }
        if (editingField.category === 'name') {
          updated.name = editValue
        } else if (editingField.category === 'hardware') {
          updated.hardware = {
            ...updated.hardware,
            [editingField.key]: hardwareFieldLabels[editingField.key]?.type === 'number'
              ? (editValue ? parseInt(editValue) : undefined)
              : editValue || undefined
          }
        } else if (editingField.category === 'software') {
          updated.software = {
            ...updated.software,
            [editingField.key]: editValue || undefined
          }
        } else if (editingField.category === 'notes') {
          updated.notes = editValue
        }
        return updated
      })
      
      setEditingField(null)
      setEditValue('')
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }, [detail, editingField, editValue])

  // 切换兴趣标签
  const toggleInterest = useCallback(async (interest: string) => {
    if (!detail) return
    
    const newInterests = detail.software?.interests?.includes(interest)
      ? (detail.software.interests || []).filter(i => i !== interest)
      : [...(detail.software.interests || []), interest]
    
    try {
      await Network.request({
        url: `/api/match/${detail.id}`,
        method: 'PUT',
        data: {
          software: {
            ...detail.software,
            interests: newInterests
          }
        }
      })
      
      setDetail(prev => {
        if (!prev) return prev
        return {
          ...prev,
          software: {
            ...prev.software,
            interests: newInterests
          }
        }
      })
    } catch (error) {
      console.error('Toggle interest error:', error)
    }
  }, [detail])

  // 更新关系阶段
  const updateRelationshipStage = useCallback(async (stage: string) => {
    if (!detail) return
    
    try {
      await Network.request({
        url: `/api/match/${detail.id}`,
        method: 'PUT',
        data: { relationshipStage: stage }
      })
      
      setDetail(prev => prev ? { ...prev, relationshipStage: stage } : prev)
    } catch (error) {
      console.error('Update relationship stage error:', error)
    }
  }, [detail])

  // 更新互动状态
  const updateInteractionStatus = useCallback(async (status: string) => {
    if (!detail) return
    
    try {
      await Network.request({
        url: `/api/match/${detail.id}`,
        method: 'PUT',
        data: { interactionStatus: status }
      })
      
      setDetail(prev => prev ? { ...prev, interactionStatus: status } : prev)
    } catch (error) {
      console.error('Update interaction status error:', error)
    }
  }, [detail])

  const goToTasks = () => navigateTo({ url: `/pages/tasks/index?matchId=${detail?.id}` })
  const goToDates = () => navigateTo({ url: `/pages/dates/index?matchId=${detail?.id}` })
  const goToPortrait = () => navigateTo({ url: `/pages/portrait/index?matchId=${detail?.id}` })

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

  // 渲染可编辑字段
  const renderEditableItem = (category: EditableField['category'], key: string, label: string, icon: string, value: string) => {
    const isEditing = editingField?.category === category && editingField?.key === key
    
    return (
      <View 
        key={key} 
        className="flex items-center px-4 py-3"
        onClick={() => !isEditing && startEdit({ category, key })}
      >
        <Text className="block text-base mr-3">{icon}</Text>
        <View className="flex-1">
          <Text className="block text-xs text-gray-400">{label}</Text>
          {isEditing ? (
            <View className="flex items-center gap-2 mt-1">
              <View className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                <Input
                  className="w-full text-sm"
                  value={editValue}
                  onInput={(e) => setEditValue(e.detail.value)}
                  autoFocus
                />
              </View>
              <View className="flex gap-1">
                <View 
                  className="p-2 bg-black rounded-lg"
                  onClick={(e) => { e.stopPropagation(); saveEdit() }}
                >
                  {saving ? <Loader size={14} color="#fff" className="animate-spin" /> : <Check size={14} color="#fff" />}
                </View>
                <View 
                  className="p-2 bg-gray-200 rounded-lg"
                  onClick={(e) => { e.stopPropagation(); cancelEdit() }}
                >
                  <X size={14} color="#666" />
                </View>
              </View>
            </View>
          ) : (
            <View className="flex items-center gap-1">
              <Text className="block text-sm text-gray-700">{value || '点击填写'}</Text>
              <Pencil size={12} color="#D1D5DB" />
            </View>
          )}
        </View>
      </View>
    )
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

  const interests = detail.software?.interests || []

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      <CustomHeader title="档案" />

      {/* 基本信息卡片 */}
      <View className="p-4">
        <Card className="border border-gray-100">
          <CardContent className="p-4">
            <View className="flex items-start justify-between mb-3">
              <View className="flex-1">
                {/* 姓名可编辑 */}
                {editingField?.category === 'name' ? (
                  <View className="flex items-center gap-2">
                    <View className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                      <Input
                        className="w-full text-xl font-bold"
                        value={editValue}
                        onInput={(e) => setEditValue(e.detail.value)}
                        autoFocus
                      />
                    </View>
                    <View className="flex gap-1">
                      <View 
                        className="p-2 bg-black rounded-lg"
                        onClick={saveEdit}
                      >
                        {saving ? <Loader size={14} color="#fff" className="animate-spin" /> : <Check size={14} color="#fff" />}
                      </View>
                      <View 
                        className="p-2 bg-gray-200 rounded-lg"
                        onClick={cancelEdit}
                      >
                        <X size={14} color="#666" />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View className="flex items-center gap-2" onClick={() => startEdit({ category: 'name', key: 'name' })}>
                    <Text className="block text-xl font-bold text-gray-900">{detail.name}</Text>
                    <Pencil size={14} color="#9CA3AF" />
                  </View>
                )}
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
            
            {/* 关系阶段选择 */}
            <View className="grid grid-cols-4 gap-2 mb-2">
              {relationshipStages.map((stage) => (
                <View
                  key={stage.id}
                  className={`text-center py-2 rounded-lg ${
                    detail.relationshipStage === stage.id 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  onClick={() => updateRelationshipStage(stage.id)}
                >
                  <Text className="block text-xs">{stage.label}</Text>
                </View>
              ))}
            </View>

            {/* 互动状态选择 */}
            <View className="bg-white rounded-xl border border-gray-100">
              {interactionStatuses.map((status, index) => (
                <View
                  key={status.id}
                  className={`flex items-center justify-between px-4 py-2 ${index < interactionStatuses.length - 1 ? 'border-b border-gray-100' : ''}`}
                  onClick={() => updateInteractionStatus(status.id)}
                >
                  <Text className={`block text-sm ${
                    detail.interactionStatus === status.id ? 'text-gray-900 font-medium' : 'text-gray-600'
                  }`}
                  >
                    {status.label}
                  </Text>
                  {detail.interactionStatus === status.id && <Check size={14} color="#111827" />}
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 推进值卡片 */}
      {detail.progressScore && (
        <View className="px-4 pb-4">
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <TrendingUp size={16} color="#000" />
                <Text className="block text-sm font-semibold text-gray-900">关系推进</Text>
              </View>
              <View className="flex items-center gap-1">
                <Text className="block text-2xl font-bold text-gray-900">{detail.progressScore.total}</Text>
                <Text className="block text-xs text-gray-400">/100</Text>
              </View>
            </View>
            
            <View className="mb-3">
              <Progress 
                value={detail.progressScore.total} 
                className="h-2 bg-gray-100" 
              />
            </View>

            <View className="flex items-center justify-between mb-2">
              <View className="flex items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="block text-sm font-medium text-gray-900">
                  {detail.progressScore.stage.name}
                </Text>
              </View>
              <Text className="block text-xs text-gray-500">
                {detail.progressScore.stage.description}
              </Text>
            </View>

            <View className="grid grid-cols-5 gap-1 mt-3 pt-3 border-t border-gray-100">
              <View className="text-center">
                <Text className="block text-xs text-gray-400">信息</Text>
                <Text className="block text-sm font-semibold text-gray-700">
                  {detail.progressScore.breakdown.infoCompleteness.toFixed(0)}
                </Text>
              </View>
              <View className="text-center">
                <Text className="block text-xs text-gray-400">互动</Text>
                <Text className="block text-sm font-semibold text-gray-700">
                  {detail.progressScore.breakdown.interactionDepth.toFixed(0)}
                </Text>
              </View>
              <View className="text-center">
                <Text className="block text-xs text-gray-400">任务</Text>
                <Text className="block text-sm font-semibold text-gray-700">
                  {detail.progressScore.breakdown.taskCompletion.toFixed(0)}
                </Text>
              </View>
              <View className="text-center">
                <Text className="block text-xs text-gray-400">关键</Text>
                <Text className="block text-sm font-semibold text-gray-700">
                  {detail.progressScore.breakdown.keyInfoMastery.toFixed(0)}
                </Text>
              </View>
              <View className="text-center">
                <Text className="block text-xs text-gray-400">活跃</Text>
                <Text className="block text-sm font-semibold text-gray-700">
                  {detail.progressScore.breakdown.timeActivity.toFixed(0)}
                </Text>
              </View>
            </View>

            {detail.progressScore.insights.length > 0 && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                {detail.progressScore.insights.slice(0, 2).map((insight, i) => (
                  <View key={i} className="flex items-start gap-2 mb-1">
                    <Text className="block text-xs text-gray-400">•</Text>
                    <Text className="block text-xs text-gray-600">{insight}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* 硬件信息 */}
      <View className="px-4 pb-4">
        <View className="flex items-center gap-2 mb-2">
          <HardDrive size={14} color="#6B7280" />
          <Text className="block text-sm font-semibold text-gray-900">硬件信息</Text>
          <Text className="block text-xs text-gray-400">点击编辑</Text>
        </View>
        <View className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {Object.keys(hardwareFieldLabels).map((key) => {
            const field = hardwareFieldLabels[key]
            const value = detail.hardware?.[key as keyof HardwareInfo]
            return renderEditableItem('hardware', key, field.label, field.icon, String(value || ''))
          })}
        </View>
      </View>

      {/* 软件信息 */}
      <View className="px-4 pb-4">
        <View className="flex items-center gap-2 mb-2">
          <Cpu size={14} color="#6B7280" />
          <Text className="block text-sm font-semibold text-gray-900">软件信息</Text>
          <Text className="block text-xs text-gray-400">点击编辑</Text>
        </View>
        <View className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {Object.keys(softwareFieldLabels).map((key) => {
            const field = softwareFieldLabels[key]
            const value = detail.software?.[key as keyof SoftwareInfo]
            return renderEditableItem('software', key, field.label, field.icon, String(value || ''))
          })}
        </View>
      </View>

      {/* 兴趣标签 */}
      <View className="px-4 pb-4">
        <Text className="block text-sm font-semibold text-gray-900 mb-2">兴趣爱好</Text>
        <View className="flex flex-wrap gap-2">
          {presetInterests.map((interest) => (
            <Badge
              key={interest}
              className={`${
                interests.includes(interest)
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </Badge>
          ))}
        </View>
      </View>

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

      {/* 维度数据 */}
      <View className="px-4 pb-4">
        <View className="flex items-center gap-2 mb-2">
          <Database size={14} color="#6B7280" />
          <Text className="block text-sm font-semibold text-gray-900">维度数据</Text>
          <Text className="block text-xs text-gray-400">按层级组织</Text>
        </View>
        <DimensionViewer matchId={detail.id} />
      </View>

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
          <View 
            className="flex items-center justify-between px-4 py-3"
            onClick={goToPortrait}
          >
            <View className="flex items-center gap-3">
              <Brain size={18} color="#374151" />
              <Text className="block text-sm text-gray-700">人物画像</Text>
            </View>
            <View className="flex items-center gap-2">
              <Text className="block text-xs text-gray-400">AI分析</Text>
              <ChevronRight size={16} color="#D1D5DB" />
            </View>
          </View>
        </View>
      </View>

      {/* 备注 */}
      <View className="px-4 pb-4">
        <Text className="block text-sm font-semibold text-gray-900 mb-2">备注</Text>
        {editingField?.category === 'notes' ? (
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            <View className="bg-gray-50 rounded-lg p-3 mb-3">
              <Input
                className="w-full text-sm"
                value={editValue}
                onInput={(e) => setEditValue(e.detail.value)}
                placeholder="添加备注..."
                autoFocus
              />
            </View>
            <View className="flex justify-end gap-2">
              <View 
                className="px-4 py-2 bg-gray-200 rounded-lg"
                onClick={cancelEdit}
              >
                <Text className="block text-sm text-gray-600">取消</Text>
              </View>
              <View 
                className="px-4 py-2 bg-black rounded-lg flex items-center gap-1"
                onClick={saveEdit}
              >
                {saving ? <Loader size={14} color="#fff" className="animate-spin" /> : <Check size={14} color="#fff" />}
                <Text className="block text-sm text-white">保存</Text>
              </View>
            </View>
          </View>
        ) : (
          <View 
            className="bg-white rounded-xl border border-gray-100 p-4"
            onClick={() => startEdit({ category: 'notes', key: 'notes' })}
          >
            {detail.notes ? (
              <View className="flex items-start gap-2">
                <Text className="block text-sm text-gray-600 flex-1">{detail.notes}</Text>
                <Pencil size={14} color="#D1D5DB" />
              </View>
            ) : (
              <View className="flex items-center gap-2">
                <Text className="block text-sm text-gray-400">点击添加备注...</Text>
                <Pencil size={14} color="#D1D5DB" />
              </View>
            )}
          </View>
        )}
      </View>

      {/* 底部操作 */}
      <View 
        className="fixed left-0 right-0 bg-white border-t border-gray-100"
        style={{ bottom: 0, paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <View className="p-4">
          <Button className="w-full bg-black" onClick={() => setChatOpen(true)}>
            <MessageCircle size={16} color="#fff" />
            <Text className="ml-2 text-white">AI 助手</Text>
          </Button>
        </View>
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
