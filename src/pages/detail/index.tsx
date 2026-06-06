import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, useRouter, navigateTo, eventCenter, switchTab } from '@tarojs/taro'
import type { FC } from 'react'
import { useState, useCallback, useEffect } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import ChatDialog from '@/components/chat-dialog'
import DimensionViewer from '@/components/dimension-viewer'
import CustomHeader from '@/components/custom-header'
import { SkeletonProfile } from '@/components/skeleton'
import { getMatchDetailWithCache, clearDimensionCache } from '@/utils/cache'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { 
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
  Pencil,
  MessageCirclePlus,
  ClipboardList,
  Zap,
  ChartPie,
  Trash2,
  Sparkles,
  Search,
  BookOpen,
  Gamepad2,
  Theater,
  Ghost
} from 'lucide-react-taro'

// 关系类型
type RelationshipType = 'long_term' | 'short_term' | 'both' | 'undefined'

// 关系类型配置
const RELATIONSHIP_TYPE_CONFIG: Record<RelationshipType, { label: string; color: string; bgColor: string; description: string }> = {
  long_term: { 
    label: '长期关系', 
    color: '#4ECB71', 
    bgColor: 'bg-green-50',
    description: '小火慢炖，稳扎稳打'
  },
  short_term: { 
    label: '短期关系', 
    color: '#F0C75E', 
    bgColor: 'bg-amber-50',
    description: '下猛药，快速推进'
  },
  both: { 
    label: '灵活关系', 
    color: '#A78BFA', 
    bgColor: 'bg-violet-50',
    description: '看情况，随机应变'
  },
  undefined: { 
    label: '未设置', 
    color: '#A8A29E', 
    bgColor: 'bg-gray-50',
    description: '点击设置关系类型'
  },
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
  occupation?: string
  relationshipType: RelationshipType
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
  menstrual: { icon: Moon, color: '#78716C', bgColor: 'bg-gray-100' },
  follicular: { icon: Sun, color: '#4ECB71', bgColor: 'bg-green-50' },
  ovulation: { icon: Heart, color: '#EC4899', bgColor: 'bg-pink-50' },
  luteal_early: { icon: Sun, color: '#60A5FA', bgColor: 'bg-blue-50' },
  luteal_mid: { icon: Cloud, color: '#F0C75E', bgColor: 'bg-amber-50' },
  luteal_late: { icon: Moon, color: '#E87461', bgColor: 'bg-white' },
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
  
  // 关系类型选择状态
  const [selectingRelationshipType, setSelectingRelationshipType] = useState(false)
  
  // 数据概览展开状态
  const [showDataOverview, setShowDataOverview] = useState(false)
  
  // 维度组件刷新触发器
  const [dimensionRefreshKey, setDimensionRefreshKey] = useState(0)

  // 删除确认状态
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 处理维度编辑
  const handleDimensionEdit = useCallback((dimensionKey: string) => {
    navigateTo({
      url: `/pages/dimension-edit/index?matchId=${detail?.id}&dimensionKey=${dimensionKey}`
    })
  }, [detail?.id])

  // 监听维度保存成功事件
  useEffect(() => {
    const handleDimensionSaved = () => {
      // 清除缓存
      clearDimensionCache(Number(router.params.id))
      // 触发维度组件刷新
      setDimensionRefreshKey(prev => prev + 1)
    }
    
    eventCenter.on('dimension:saved', handleDimensionSaved)
    
    return () => {
      eventCenter.off('dimension:saved', handleDimensionSaved)
    }
  }, [router.params.id])

  useLoad(() => {
    console.log('Detail page loaded.', router.params.id)
    fetchDetail()
  })

  // 从周期页面返回时刷新周期数据
  useDidShow(() => {
    const id = router.params.id
    if (id) {
      Network.request({ url: `/api/match/${id}/cycle` }).then(cycleRes => {
        console.log('Cycle info response in useDidShow:', cycleRes.data)
        if (cycleRes.data?.code === 200 && cycleRes.data?.data) {
          setCycleInfo(cycleRes.data.data)
        } else {
          setCycleInfo(null)
        }
      }).catch(() => {})
    }
  })

  const fetchDetail = async (retryCount = 0) => {
    const id = router.params.id
    if (!id) return

    try {
      setLoading(true)
      
      // 使用缓存获取数据
      const { data } = await getMatchDetailWithCache(
        Number(id),
        () => Network.request({
          url: `/api/match/${id}`,
          method: 'GET'
        }).then(res => res.data)
      )
      
      if (data?.code === 200 && data?.data) {
        setDetail(data.data)
        setNameValue(data.data.name || '')
        setNotesValue(data.data.notes || '')
        
        // 周期信息：始终尝试获取（不论是否来自缓存、不论是否有cycleStartDate）
        try {
          const cycleRes = await Network.request({ url: `/api/match/${id}/cycle` })
          if (cycleRes.data?.code === 200 && cycleRes.data?.data) {
            setCycleInfo(cycleRes.data.data)
          }
        } catch (e) {
          console.error('Fetch cycle info error:', e)
        }
      } else if (retryCount < 2) {
        // 数据异常时自动重试
        console.warn('Detail response invalid, retrying...', retryCount + 1)
        await new Promise(r => setTimeout(r, 500))
        return fetchDetail(retryCount + 1)
      }
    } catch (error) {
      if (retryCount < 2) {
        console.warn('Fetch detail error, retrying...', retryCount + 1, error)
        await new Promise(r => setTimeout(r, 500))
        return fetchDetail(retryCount + 1)
      }
      console.error('Fetch detail error after retries:', error)
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

  // 保存关系类型
  const saveRelationshipType = useCallback(async (type: RelationshipType) => {
    if (!detail) return
    
    try {
      setSaving(true)
      await Network.request({
        url: `/api/match/${detail.id}`,
        method: 'PUT',
        data: { relationshipType: type }
      })
      
      setDetail(prev => prev ? { ...prev, relationshipType: type } : prev)
      setSelectingRelationshipType(false)
    } catch (error) {
      console.error('Save relationship type error:', error)
    } finally {
      setSaving(false)
    }
  }, [detail])

  const goToTasks = () => navigateTo({ url: `/pages/tasks/index?matchId=${detail?.id}` })
  const goToPortrait = () => navigateTo({ url: `/pages/portrait/index?matchId=${detail?.id}` })

  const handleDelete = async () => {
    if (!detail || deleting) return
    try {
      setDeleting(true)
      const res = await Network.request({
        url: `/api/match/${detail.id}/delete`,
        method: 'POST',
      })
      console.log('Delete match response:', res?.data)
      const responseData = res?.data
      if (responseData?.code === 200) {
        switchTab({ url: '/pages/index/index' })
      }
    } catch (error) {
      console.error('Delete match error:', error)
    } finally {
      setDeleting(false)
    }
  }

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
    return <SkeletonProfile />
  }

  if (!detail) {
    return (
      <View className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F8FA' }}>
        <Text className="block text-gray-400">未找到对象信息</Text>
      </View>
    )
  }

  const relationTypeConfig = RELATIONSHIP_TYPE_CONFIG[detail.relationshipType || 'undefined']

  return (
    <View className="min-h-screen pb-24" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader 
        title="档案" 
        rightAction={
          <Trash2 size={20} color="#EF4444" onClick={() => setShowDeleteDialog(true)} />
        }
      />

      {/* ==================== 第一屏：核心信息 ==================== */}
      
      {/* 基本信息卡片：姓名 + 关系类型 */}
      <View className="p-4">
        <Card className="border">
          <CardContent className="p-4">
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              {/* 左侧：姓名 + 关系类型 */}
              <View style={{ flex: 1 }}>
                {/* 姓名可编辑 */}
                {editingName ? (
                  <View className="flex items-center gap-3 mb-4">
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
                        className="p-2 bg-green-500 rounded-lg"
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
                  <View className="flex items-center gap-3 mb-4" onClick={() => setEditingName(true)}>
                    <Text className="block text-xl font-bold text-gray-900">{detail.name}</Text>
                    <Pencil size={14} color="#9CA3AF" />
                  </View>
                )}
                
                {/* 关系类型标签 */}
                {selectingRelationshipType ? (
                  <View className="mt-2">
                    <Text className="block text-xs text-gray-500 mb-2">选择关系类型</Text>
                    <View className="flex flex-wrap gap-3">
                      {(['long_term', 'short_term', 'both'] as RelationshipType[]).map(type => {
                        const config = RELATIONSHIP_TYPE_CONFIG[type]
                        const isSelected = detail?.relationshipType === type
                        return (
                          <View
                            key={type}
                            className={`px-3 py-2 rounded-full border-2 ${
                              isSelected ? 'border-green-500' : 'bg-gray-50'
                            }`}
                            style={{ backgroundColor: isSelected ? config.bgColor.replace('bg-', '') : 'transparent' }}
                            onClick={() => saveRelationshipType(type)}
                          >
                            <Text 
                              className="block text-xs font-medium"
                              style={{ color: isSelected ? config.color : '#6B7280' }}
                            >
                              {config.label}
                            </Text>
                          </View>
                        )
                      })}
                      <View 
                        className="px-3 py-2 rounded-full"
                        onClick={() => setSelectingRelationshipType(false)}
                      >
                        <Text className="block text-xs text-gray-400">取消</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View 
                    className="flex items-center gap-3"
                    onClick={() => setSelectingRelationshipType(true)}
                  >
                    <View 
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: relationTypeConfig.bgColor.replace('bg-', '') }}
                    >
                      <Text 
                        className="block text-xs font-medium"
                        style={{ color: relationTypeConfig.color }}
                      >
                        {relationTypeConfig.label}
                      </Text>
                    </View>
                    <Pencil size={12} color="#9CA3AF" />
                  </View>
                )}
              </View>
              
              {/* 右侧：孪生体按钮 */}
              <View 
                style={{ flexShrink: 0, marginLeft: '12px' }}
                className="flex flex-col items-center justify-center"
                onClick={() => {
                  const tags = [detail.gender, detail.occupation].filter(Boolean).join(' · ')
                  navigateTo({ url: `/pages/twin-chat/index?matchId=${detail.id}&matchName=${encodeURIComponent(detail.name)}&matchTags=${encodeURIComponent(tags)}` })
                }}
              >
                <View className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-1">
                  <Ghost size={24} color="#4ECB71" />
                </View>
                <Text className="block text-xs text-gray-700 font-medium">孪生体</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 快捷操作：网格布局 */}
      <View className="px-4 pb-4">
        <View className="grid grid-cols-4 gap-2">
          {/* 记录互动 */}
          <View 
            className="flex flex-col items-center justify-center p-2 bg-white rounded-xl"
            onClick={() => navigateTo({ url: `/pages/interaction-create/index?matchId=${detail.id}` })}
          >
            <View className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-1">
              <MessageCirclePlus size={20} color="#4ECB71" />
            </View>
            <Text className="block text-xs text-gray-700">记录互动</Text>
          </View>
          
          {/* 互动任务 */}
          <View 
            className="flex flex-col items-center justify-center p-2 bg-white rounded-xl"
            onClick={goToTasks}
          >
            <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1">
              <ClipboardList size={20} color="#374151" />
            </View>
            <Text className="block text-xs text-gray-700">任务</Text>
            {detail.stats.tasks > 0 && (
              <Text className="block text-xs text-gray-400">
                {detail.stats.completedTasks}/{detail.stats.tasks}
              </Text>
            )}
          </View>
          
          {/* 人物画像 */}
          <View 
            className="flex flex-col items-center justify-center p-2 bg-white rounded-xl"
            onClick={goToPortrait}
          >
            <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1">
              <Brain size={20} color="#374151" />
            </View>
            <Text className="block text-xs text-gray-700">画像</Text>
          </View>
          
          {/* 周期追踪 */}
          {cycleInfo ? (
            <View 
              className="flex flex-col items-center justify-center p-2 bg-white rounded-xl"
              onClick={() => navigateTo({ url: `/pages/cycle/index?matchId=${detail.id}` })}
            >
              <View className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center mb-1">
                <Activity size={20} color="#EC4899" />
              </View>
              <Text className="block text-xs text-gray-700">周期</Text>
              <Text className="block text-xs text-gray-400">Day {cycleInfo.day}</Text>
            </View>
          ) : (
            <View 
              className="flex flex-col items-center justify-center p-2 bg-white rounded-xl"
              onClick={() => navigateTo({ url: `/pages/cycle/index?matchId=${detail.id}` })}
            >
              <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                <Activity size={20} color="#9CA3AF" />
              </View>
              <Text className="block text-xs text-gray-700">周期</Text>
            </View>
          )}
        </View>
      </View>

      {/* 智能助手：关联发现页功能的快捷入口 */}
      <View className="px-4 pb-4">
        <View className="flex items-center gap-3 mb-4">
          <Sparkles size={14} color="#4ECB71" />
          <Text className="block text-sm font-semibold text-gray-900">智能助手</Text>
          <Text className="block text-xs text-gray-400">基于 TA 的档案，为你推荐</Text>
        </View>
        <View className="bg-white rounded-2xl shadow-soft p-4">
          <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginLeft: '-8px' }}>
            {/* 速推方案 */}
            <View
              style={{ width: '25%', paddingLeft: '8px', marginBottom: '12px' }}
              onClick={() => navigateTo({ url: `/pages/speed-plan/index?matchId=${detail.id}` })}
            >
              <View className="flex flex-col items-center">
                <View className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-1">
                  <Zap size={18} color="#F59E0B" />
                </View>
                <Text className="block text-xs text-gray-700">速推方案</Text>
              </View>
            </View>
            {/* 朋友圈分析 */}
            <View
              style={{ width: '25%', paddingLeft: '8px', marginBottom: '12px' }}
              onClick={() => navigateTo({ url: `/pages/moments-analyze/index?matchId=${detail.id}` })}
            >
              <View className="flex flex-col items-center">
                <View className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-1">
                  <Search size={18} color="#4ECB71" />
                </View>
                <Text className="block text-xs text-gray-700">朋友圈</Text>
              </View>
            </View>
            {/* 破冰话题 */}
            <View
              style={{ width: '25%', paddingLeft: '8px', marginBottom: '12px' }}
              onClick={() => navigateTo({ url: `/pages/knowledge-icebreaker/index?matchId=${detail.id}` })}
            >
              <View className="flex flex-col items-center">
                <View className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-1">
                  <MessageCircle size={18} color="#4ECB71" />
                </View>
                <Text className="block text-xs text-gray-700">破冰话题</Text>
              </View>
            </View>
            {/* 开场白生成 */}
            <View
              style={{ width: '25%', paddingLeft: '8px', marginBottom: '12px' }}
              onClick={() => navigateTo({ url: `/pages/dating-opener/index?matchId=${detail.id}` })}
            >
              <View className="flex flex-col items-center">
                <View className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-1">
                  <BookOpen size={18} color="#22C55E" />
                </View>
                <Text className="block text-xs text-gray-700">开场白</Text>
              </View>
            </View>
            {/* 共同成长 */}
            <View
              style={{ width: '25%', paddingLeft: '8px' }}
              onClick={() => navigateTo({ url: `/pages/grow/index?matchId=${detail.id}` })}
            >
              <View className="flex flex-col items-center">
                <View className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mb-1">
                  <TrendingUp size={18} color="#F43F5E" />
                </View>
                <Text className="block text-xs text-gray-700">共同成长</Text>
              </View>
            </View>
            {/* 互动游戏 */}
            <View
              style={{ width: '25%', paddingLeft: '8px' }}
              onClick={() => navigateTo({ url: `/pages/interactive-games/index?matchId=${detail.id}` })}
            >
              <View className="flex flex-col items-center">
                <View className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mb-1">
                  <Gamepad2 size={18} color="#8B5CF6" />
                </View>
                <Text className="block text-xs text-gray-700">互动游戏</Text>
              </View>
            </View>
            {/* 场景演练 */}
            <View
              style={{ width: '25%', paddingLeft: '8px' }}
              onClick={() => navigateTo({ url: `/pages/knowledge-scenario/index?matchId=${detail.id}` })}
            >
              <View className="flex flex-col items-center">
                <View className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-1">
                  <Theater size={18} color="#3B82F6" />
                </View>
                <Text className="block text-xs text-gray-700">场景演练</Text>
              </View>
            </View>
            {/* 周期科学 */}
            <View
              style={{ width: '25%', paddingLeft: '8px' }}
              onClick={() => navigateTo({ url: `/pages/knowledge-cycle/index?matchId=${detail.id}` })}
            >
              <View className="flex flex-col items-center">
                <View className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center mb-1">
                  <Moon size={18} color="#EC4899" />
                </View>
                <Text className="block text-xs text-gray-700">周期科学</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 关键数据概览 */}
      <View className="px-4 pb-4">
        <View className="bg-white rounded-xl overflow-hidden">
          {/* 概览标题栏 - 可点击展开 */}
          <View 
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={() => setShowDataOverview(!showDataOverview)}
          >
            <View className="flex items-center gap-3">
              <ChartPie size={16} color="#2E9E5A" />
              <Text className="block text-sm font-semibold text-gray-900">数据概览</Text>
            </View>
            <View className="flex items-center gap-3">
              {/* 简要数据 */}
              <View className="flex items-center gap-4">
                {detail.progressScore && (
                  <View className="flex items-center gap-1">
                    <TrendingUp size={12} color="#4ECB71" />
                    <Text className="block text-xs font-medium text-gray-600">{detail.progressScore.total}</Text>
                  </View>
                )}
                {detail.energy && (
                  <View className="flex items-center gap-1">
                    <Zap size={12} color="#F59E0B" />
                    <Text className="block text-xs font-medium text-gray-600">{detail.energy.current}</Text>
                  </View>
                )}
              </View>
              {showDataOverview ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
            </View>
          </View>
          
          {/* 展开的详细数据 */}
          {showDataOverview && (
            <View className="px-4 pb-4 border-t">
              {/* 推进值 */}
              {detail.progressScore && (
                <View className="mt-3">
                  <View className="flex items-center justify-between mb-2">
                    <Text className="block text-xs text-gray-500">关系推进</Text>
                    <View className="flex items-center gap-1">
                      <Text className="block text-lg font-bold text-gray-900">{detail.progressScore.total}</Text>
                      <Text className="block text-xs text-gray-400">/100</Text>
                    </View>
                  </View>
                  <Progress value={detail.progressScore.total} className="h-1 bg-gray-100" />
                  <Text className="block text-xs text-gray-500 mt-1">{detail.progressScore.stage.name}</Text>
                </View>
              )}
              
              {/* 关系能量 */}
              {detail.energy && (
                <View 
                  className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg"
                  onClick={() => navigateTo({ url: `/pages/interactions/index?matchId=${detail.id}` })}
                >
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-3">
                      <Sun size={14} color="#F59E0B" />
                      <Text className="block text-xs text-gray-600">关系能量</Text>
                    </View>
                    <View className="flex items-center gap-3">
                      <Text className="block text-lg font-bold text-amber-600">{detail.energy.current}</Text>
                      <Text className="block text-xs text-gray-400">本周 {detail.energy.thisWeek} 次</Text>
                      <ChevronRight size={14} color="#D1D5DB" />
                    </View>
                  </View>
                </View>
              )}
              
              {/* 周期状态 */}
              {cycleInfo && (
                <View className="mt-3">
                  {(() => {
                    const phaseConf = phaseConfig[cycleInfo.phase] || phaseConfig.follicular
                    const PhaseIcon = phaseConf.icon
                    return (
                      <View className={`${phaseConf.bgColor} rounded-lg p-3`}>
                        <View className="flex items-center justify-between">
                          <View className="flex items-center gap-3">
                            <PhaseIcon size={14} color={phaseConf.color} />
                            <Text className="block text-xs font-medium" style={{ color: phaseConf.color }}>
                              {cycleInfo.phaseName}
                            </Text>
                          </View>
                          <Text className="block text-xs text-gray-500">Day {cycleInfo.day}</Text>
                        </View>
                        <Text className="block text-xs text-gray-600 mt-1">{cycleInfo.description}</Text>
                      </View>
                    )
                  })()}
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* ==================== 第二屏：维度数据 ==================== */}
      
      <View className="px-4 pb-4">
        <View className="flex items-center gap-3 mb-2">
          <Database size={14} color="#2E9E5A" />
          <Text className="block text-sm font-semibold text-gray-900">档案维度</Text>
          <Text className="block text-xs text-gray-400">点击编辑</Text>
        </View>
        <DimensionViewer matchId={detail.id} relationshipType={detail.relationshipType} refreshKey={dimensionRefreshKey} onEdit={handleDimensionEdit} />
      </View>

      {/* ==================== 第三屏：备注 ==================== */}
      
      <View className="px-4 pb-4">
        <Text className="block text-sm font-semibold text-gray-900 mb-2">备注</Text>
        {editingNotes ? (
          <View className="bg-white rounded-2xl shadow-soft p-4">
            <View className="bg-gray-50 rounded-lg p-3 mb-4">
              <Input
                className="w-full text-sm"
                value={notesValue}
                onInput={(e) => setNotesValue(e.detail.value)}
                placeholder="添加备注..."
                autoFocus
              />
            </View>
            <View className="flex justify-end gap-3">
              <View 
                className="px-4 py-2 bg-gray-200 rounded-lg"
                onClick={() => { setEditingNotes(false); setNotesValue(detail.notes || '') }}
              >
                <Text className="block text-sm text-gray-600">取消</Text>
              </View>
              <View 
                className="px-4 py-2 bg-green-500 rounded-lg flex items-center gap-1"
                onClick={saveNotes}
              >
                {saving ? <Loader size={14} color="#fff" className="animate-spin" /> : <Check size={14} color="#fff" />}
                <Text className="block text-sm text-white">保存</Text>
              </View>
            </View>
          </View>
        ) : (
          <View 
            className="bg-white rounded-2xl shadow-soft p-4"
            onClick={() => setEditingNotes(true)}
          >
            {detail.notes ? (
              <View className="flex items-start gap-3">
                <Text className="block text-sm text-gray-600 flex-1">{detail.notes}</Text>
                <Pencil size={14} color="#D1D5DB" />
              </View>
            ) : (
              <View className="flex items-center gap-3">
                <Text className="block text-sm text-gray-400">点击添加备注...</Text>
                <Pencil size={14} color="#D1D5DB" />
              </View>
            )}
          </View>
        )}
      </View>

      {/* 底部操作 */}
      <View 
        className="fixed left-0 right-0 bg-white border-t"
        style={{ bottom: 0, paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <View className="p-4">
          <Button className="w-full bg-green-500" onClick={() => setChatOpen(true)}>
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

      {/* 删除确认弹窗 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Text className="block text-lg font-semibold">确认删除</Text>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Text className="block text-sm text-gray-500">确定要删除「{detail?.name}」的档案吗？删除后无法恢复。</Text>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text className="block">取消</Text>
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              <Text className="block text-red-500">{deleting ? '删除中...' : '删除'}</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  )
}

export default DetailPage
