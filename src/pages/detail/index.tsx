import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, useRouter, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState, useCallback } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
    criticalInfoMastery: number
    taskCompletion: number
  }
  insights: string[]
  nextActions: string[]
}

interface EnergyData {
  current: number
  level: string
  trend: string
  thisWeek: number
  recentCount: number
}

interface MatchDetail {
  id: number
  name: string
  gender: string
  notes: string
  status: string
  stats: {
    tasks: number
    completedTasks: number
    dates: number
  }
  progressScore?: ProgressScore
  cycleStartDate?: string
  cycleLength?: number
  energy?: EnergyData
}

interface CycleInfo {
  day: number
  phase: string
  phaseName: string
  description: string
  recommendations: string[]
}

// 周期阶段配置
const phaseConfig: Record<string, { icon: typeof Heart; color: string; bgColor: string }> = {
  menstrual: { icon: Moon, color: '#6B7280', bgColor: 'bg-gray-100' },
  follicular: { icon: Sun, color: '#10B981', bgColor: 'bg-emerald-50' },
  ovulation: { icon: Heart, color: '#EC4899', bgColor: 'bg-pink-50' },
  luteal_early: { icon: Sun, color: '#3B82F6', bgColor: 'bg-blue-50' },
  luteal_mid: { icon: Cloud, color: '#F59E0B', bgColor: 'bg-amber-50' },
  luteal_late: { icon: Moon, color: '#EF4444', bgColor: 'bg-red-50' },
}

const DetailPage: FC = () => {
  const router = useRouter()
  const [detail, setDetail] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  
  // 内联编辑状态
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [saving, setSaving] = useState(false)
  
  // 备注编辑状态
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')

  useLoad(() => {
    console.log('Detail page loaded.', router.params.id)
    fetchDetail()
  })

  useDidShow(() => {
    // 每次页面显示时刷新数据（从维度编辑页返回时会触发）
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
        setNameValue(res.data.data.name || '')
        setNotesValue(res.data.data.notes || '')
        
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

  // 保存姓名
  const saveName = useCallback(async () => {
    if (!detail || !nameValue.trim()) return
    
    try {
      setSaving(true)
      await Network.request({
        url: `/api/match/${detail.id}`,
        method: 'PUT',
        data: { name: nameValue.trim() }
      })
      
      setDetail(prev => prev ? { ...prev, name: nameValue.trim() } : prev)
      setEditingName(false)
    } catch (error) {
      console.error('Save name error:', error)
    } finally {
      setSaving(false)
    }
  }, [detail, nameValue])

  // 保存备注
  const saveNotes = useCallback(async () => {
    if (!detail) return
    
    try {
      setSaving(true)
      await Network.request({
        url: `/api/match/${detail.id}`,
        method: 'PUT',
        data: { notes: notesValue || undefined }
      })
      
      setDetail(prev => prev ? { ...prev, notes: notesValue } : prev)
      setEditingNotes(false)
    } catch (error) {
      console.error('Save notes error:', error)
    } finally {
      setSaving(false)
    }
  }, [detail, notesValue])

  const goToTasks = () => navigateTo({ url: `/pages/tasks/index?matchId=${detail?.id}` })
  const goToDates = () => navigateTo({ url: `/pages/dates/index?matchId=${detail?.id}` })
  const goToPortrait = () => navigateTo({ url: `/pages/portrait/index?matchId=${detail?.id}` })

  const getChatContext = () => {
    if (!detail) return null
    return {
      matchId: detail.id,
      matchName: detail.name,
      cycleInfo: cycleInfo ? {
        day: cycleInfo.day,
        phase: cycleInfo.phase,
        phaseName: cycleInfo.phaseName,
        description: cycleInfo.description
      } : undefined,
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
      <CustomHeader title="档案" />

      {/* 基本信息卡片 */}
      <View className="p-4">
        <Card className="border border-gray-100">
          <CardContent className="p-4">
            {/* 姓名可编辑 */}
            {editingName ? (
              <View className="flex items-center gap-2">
                <View className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="w-full text-xl font-bold"
                    value={nameValue}
                    onInput={(e) => setNameValue(e.detail.value)}
                    autoFocus
                  />
                </View>
                <View className="flex gap-1">
                  <View 
                    className="p-2 bg-black rounded-lg"
                    onClick={saveName}
                  >
                    {saving ? <Loader size={14} color="#fff" className="animate-spin" /> : <Check size={14} color="#fff" />}
                  </View>
                  <View 
                    className="p-2 bg-gray-200 rounded-lg"
                    onClick={() => { setEditingName(false); setNameValue(detail.name) }}
                  >
                    <X size={14} color="#666" />
                  </View>
                </View>
              </View>
            ) : (
              <View className="flex items-center gap-2" onClick={() => setEditingName(true)}>
                <Text className="block text-xl font-bold text-gray-900">{detail.name}</Text>
                <Pencil size={14} color="#9CA3AF" />
              </View>
            )}
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

            {/* 分项得分 */}
            <View className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
              <View className="text-center">
                <Text className="block text-xs text-gray-400">信息完整度</Text>
                <Text className="block text-sm font-semibold text-gray-700">
                  {detail.progressScore.breakdown.infoCompleteness.toFixed(0)}
                </Text>
              </View>
              <View className="text-center">
                <Text className="block text-xs text-gray-400">关键信息</Text>
                <Text className="block text-sm font-semibold text-gray-700">
                  {detail.progressScore.breakdown.criticalInfoMastery.toFixed(0)}
                </Text>
              </View>
              <View className="text-center">
                <Text className="block text-xs text-gray-400">任务完成</Text>
                <Text className="block text-sm font-semibold text-gray-700">
                  {detail.progressScore.breakdown.taskCompletion.toFixed(0)}
                </Text>
              </View>
            </View>

            {/* 洞察建议 */}
            {detail.progressScore.insights.length > 0 && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                {detail.progressScore.insights.map((insight, i) => (
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

      {/* 关系能量卡片 */}
      {detail.energy && (
        <View className="px-4 pb-4">
          <View 
            className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-4"
            onClick={() => navigateTo({ url: `/pages/interactions/index?matchId=${detail.id}` })}
          >
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Sun size={16} color="#F59E0B" />
                </View>
                <Text className="block text-sm font-semibold text-gray-900">关系能量</Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </View>
            
            <View className="flex items-end justify-between">
              <View>
                <View className="flex items-end gap-1">
                  <Text className="block text-3xl font-bold text-amber-600">{detail.energy.current}</Text>
                  <Text className="block text-sm text-gray-400 pb-1">/ 100</Text>
                </View>
                <View className="flex items-center gap-2 mt-1">
                  <Text className="block text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                    {detail.energy.level}
                  </Text>
                  <Text className="block text-xs text-gray-500">
                    {detail.energy.trend === 'rising' ? '↑ 上升中' : detail.energy.trend === 'declining' ? '↓ 下降中' : '→ 稳定'}
                  </Text>
                </View>
              </View>
              
              <View className="text-right">
                <Text className="block text-xs text-gray-400">本周互动</Text>
                <Text className="block text-lg font-semibold text-gray-900">{detail.energy.thisWeek}</Text>
                <Text className="block text-xs text-gray-400">次</Text>
              </View>
            </View>

            <View className="mt-3 pt-3 border-t border-amber-100">
              <Text className="block text-xs text-gray-500">
                最近 {detail.energy.recentCount} 次互动已贡献能量
              </Text>
            </View>
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

      {/* 维度数据 */}
      <View className="px-4 pb-4">
        <View className="flex items-center gap-2 mb-2">
          <Database size={14} color="#6B7280" />
          <Text className="block text-sm font-semibold text-gray-900">档案数据</Text>
          <Text className="block text-xs text-gray-400">点击编辑</Text>
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
        {editingNotes ? (
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            <View className="bg-gray-50 rounded-lg p-3 mb-3">
              <Input
                className="w-full text-sm"
                value={notesValue}
                onInput={(e) => setNotesValue(e.detail.value)}
                placeholder="添加备注..."
                autoFocus
              />
            </View>
            <View className="flex justify-end gap-2">
              <View 
                className="px-4 py-2 bg-gray-200 rounded-lg"
                onClick={() => { setEditingNotes(false); setNotesValue(detail.notes || '') }}
              >
                <Text className="block text-sm text-gray-600">取消</Text>
              </View>
              <View 
                className="px-4 py-2 bg-black rounded-lg flex items-center gap-1"
                onClick={saveNotes}
              >
                {saving ? <Loader size={14} color="#fff" className="animate-spin" /> : <Check size={14} color="#fff" />}
                <Text className="block text-sm text-white">保存</Text>
              </View>
            </View>
          </View>
        ) : (
          <View 
            className="bg-white rounded-xl border border-gray-100 p-4"
            onClick={() => setEditingNotes(true)}
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
