import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useLoad, useDidShow, useRouter } from '@tarojs/taro'
import type { FC } from 'react'
import { useState, useRef, useCallback } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, User, Target, Sparkles, Check, LoaderCircle, Send, CircleDot, CircleCheck, CircleX } from 'lucide-react-taro'

// 本地存储key
const STORAGE_KEY = 'speed_plan_draft'

// 行为层级定义
const BEHAVIOR_LEVELS = [
  { level: 1, code: 'get_contact', name: '交换联系方式', intimacy: 10 },
  { level: 1, code: 'first_chat', name: '第一次聊天', intimacy: 15 },
  { level: 1, code: 'agree_meet', name: '约定见面', intimacy: 20 },
  { level: 2, code: 'first_meet', name: '第一次见面', intimacy: 30 },
  { level: 2, code: 'show_interest', name: '对方表现兴趣', intimacy: 35 },
  { level: 2, code: 'second_meet', name: '同意第二次见面', intimacy: 40 },
  { level: 3, code: 'light_touch', name: '肢体接触', intimacy: 50 },
  { level: 3, code: 'hold_hands', name: '牵手', intimacy: 55 },
  { level: 3, code: 'hug', name: '拥抱', intimacy: 60 },
  { level: 4, code: 'pet_name', name: '亲密称呼', intimacy: 65 },
  { level: 4, code: 'kiss', name: '接吻', intimacy: 75 },
  { level: 4, code: 'cuddle', name: '依偎', intimacy: 70 },
  { level: 5, code: 'intimate_touch', name: '亲密抚摸', intimacy: 85 },
  { level: 5, code: 'stay_over', name: '过夜', intimacy: 90 },
  { level: 5, code: 'sex', name: '发生关系', intimacy: 100 },
  { level: 6, code: 'relationship', name: '确认恋爱', intimacy: 80 },
]

// 当前进展分组
const PROGRESS_GROUPS = [
  {
    title: '初识阶段',
    levels: [1, 2],
    items: BEHAVIOR_LEVELS.filter(b => b.level <= 2)
  },
  {
    title: '暧昧阶段',
    levels: [3, 4],
    items: BEHAVIOR_LEVELS.filter(b => b.level === 3 || b.level === 4)
  },
  {
    title: '亲密阶段',
    levels: [5],
    items: BEHAVIOR_LEVELS.filter(b => b.level === 5)
  },
  {
    title: '关系阶段',
    levels: [6],
    items: BEHAVIOR_LEVELS.filter(b => b.level === 6)
  },
]

// 常用目标行为（按层级递进）
const TARGET_BEHAVIORS = [
  { code: 'get_contact', name: '交换联系方式' },
  { code: 'first_chat', name: '第一次聊天' },
  { code: 'agree_meet', name: '约定见面' },
  { code: 'first_meet', name: '约出来见面' },
  { code: 'show_interest', name: '对方表现兴趣' },
  { code: 'second_meet', name: '同意第二次见面' },
  { code: 'light_touch', name: '肢体接触' },
  { code: 'hold_hands', name: '牵手' },
  { code: 'hug', name: '拥抱' },
  { code: 'pet_name', name: '亲密称呼' },
  { code: 'cuddle', name: '依偎' },
  { code: 'kiss', name: '接吻' },
  { code: 'intimate_touch', name: '亲密抚摸' },
  { code: 'stay_over', name: '过夜' },
  { code: 'sex', name: '发生关系' },
  { code: 'relationship', name: '确认恋爱关系' },
]

// 生成唯一ID
const generateId = () => Date.now() + Math.floor(Math.random() * 10000)

interface Match {
  id: number
  name: string
  avatar_url?: string
  relationship_type?: string
  progress_score?: number
  cycleStartDate?: string
  status?: string
}

interface MatchDetail extends Match {
  mbti?: string
  attachment_type?: string
  cycle_phase?: string
  relationship_energy?: number
  interaction_count?: number
}

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface StepItem {
  id: string
  title: string
  status: 'pending' | 'done' | 'failed'
}

interface PlanDetail {
  id: number
  match_id: number
  background: string
  current_progress: string[]
  target_hours: number
  target_behavior: string
  difficulty_score: number
  difficulty_level: string
  matches?: {
    id: number
    name: string
    avatar_url?: string
    relationship_type?: string
  }
}

interface DraftData {
  background: string
  currentProgress: string[]
  selectedMatchId?: number
  targetHours: number
  targetBehavior: string
}

/**
 * 前端难度计算（与后端 calculateDifficulty 逻辑对齐）
 */
const calculateLocalDifficulty = (
  currentProgress: string[],
  targetBehavior: string,
  matchDetail: MatchDetail | null,
  targetHours: number
): { score: number; level: string; factors: string[] } => {
  // 计算当前层级
  let maxLevel = 0
  currentProgress.forEach(code => {
    const behavior = BEHAVIOR_LEVELS.find(b => b.code === code)
    if (behavior && behavior.level > maxLevel) {
      maxLevel = behavior.level
    }
  })

  const target = BEHAVIOR_LEVELS.find(b => b.code === targetBehavior)
  const targetLevel = target?.level || 3
  const levelGap = Math.max(0, targetLevel - maxLevel)
  const baseDifficulty = levelGap * 2

  const baseTime = 72
  const timePressure = baseTime / Math.max(targetHours, 1)
  const timeFactor = Math.min(timePressure, 3)

  let relationshipFactor = 1
  const relType = matchDetail?.relationship_type
  if (relType === 'long_term' || relType === 'serious_dating') {
    relationshipFactor = 1.2
  } else if (relType === 'short_term') {
    relationshipFactor = 0.8
  }

  let attachmentFactor = 1
  const attachType = matchDetail?.attachment_type
  if (attachType === 'secure') {
    attachmentFactor = 0.9
  } else if (attachType === 'anxious') {
    attachmentFactor = 0.8
  } else if (attachType === 'avoidant' || attachType === 'fearful') {
    attachmentFactor = 1.3
  }

  const interactionCount = matchDetail?.interaction_count || 0
  const interactionFactor = Math.max(0.7, 1 - interactionCount / 20)

  const energy = matchDetail?.relationship_energy || 0
  const energyFactor = Math.max(0.6, 1 - energy / 200)

  const totalDifficulty = baseDifficulty * timeFactor * relationshipFactor * attachmentFactor * interactionFactor * energyFactor
  const score = Math.min(10, Math.max(1, Math.round(totalDifficulty)))

  let level = '简单'
  if (score >= 8) level = '极难'
  else if (score >= 6) level = '困难'
  else if (score >= 4) level = '中等'
  else if (score >= 2) level = '较易'

  const factors: string[] = []
  if (levelGap > 0) factors.push(`层级差距${levelGap}级`)
  if (timeFactor > 1.5) factors.push('时间紧迫')
  if (relationshipFactor > 1) factors.push('长期关系需要耐心')
  if (attachmentFactor > 1) factors.push('回避/恐惧型依恋')
  if (energy > 30) factors.push('关系能量充足')
  if (interactionCount > 5) factors.push('互动基础较好')

  return { score, level, factors }
}

/**
 * 从 AI 方案文本中解析出步骤
 */
const parseStepsFromContent = (content: string): StepItem[] => {
  const steps: StepItem[] = []
  // 匹配 "1. 第X步：xxx" 或 "1. xxx（时间：xxx）" 格式
  const stepRegex = /\d+\.\s*(第\d+步[：:]\s*[^（(\n]+)/g
  let match
  while ((match = stepRegex.exec(content)) !== null) {
    const title = match[1].trim()
    if (title) {
      steps.push({ id: `step-${steps.length}`, title, status: 'pending' })
    }
  }
  // 如果没匹配到"第X步"格式，尝试匹配"1. xxx"格式
  if (steps.length === 0) {
    const simpleStepRegex = /(\d+)\.\s*(.{2,30}?)(?:\n|（|\(|$)/g
    while ((match = simpleStepRegex.exec(content)) !== null) {
      const title = match[2].trim()
      if (title && !title.startsWith('【')) {
        steps.push({ id: `step-${steps.length}`, title, status: 'pending' })
      }
    }
  }
  return steps.slice(0, 8) // 最多8步
}

/**
 * 根据方案内容生成动态快捷回复
 */
const generateQuickReplies = (plan: PlanDetail | null, steps: StepItem[]): string[] => {
  const replies: string[] = []

  if (steps.length > 0) {
    const pendingStep = steps.find(s => s.status === 'pending')
    if (pendingStep) {
      replies.push(`${pendingStep.title}怎么做更好`)
    }
    const doneStep = steps.find(s => s.status === 'done')
    if (doneStep) {
      replies.push('下一步怎么做')
    }
    const failedStep = steps.find(s => s.status === 'failed')
    if (failedStep) {
      replies.push('这步失败了怎么办')
    }
  }

  if (plan) {
    if (plan.difficulty_score >= 6) {
      replies.push('有没有更稳妥的方式')
    }
    if (plan.target_hours <= 48) {
      replies.push('时间快到了怎么办')
    }
  }

  // 确保至少有2个快捷回复
  if (replies.length < 2) {
    if (!replies.includes('调整方案')) replies.push('调整方案')
    if (!replies.includes('换个思路')) replies.push('换个思路')
  }

  return replies.slice(0, 4)
}

const SpeedPlanPage: FC = () => {
  const router = useRouter()
  const planId = router.params.id ? Number(router.params.id) : null
  
  // 模式：新建 or 查看
  const isViewMode = !!planId
  
  // 查看模式状态
  const [plan, setPlan] = useState<PlanDetail | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set())
  
  // 步骤打卡状态
  const [steps, setSteps] = useState<StepItem[]>([])

  // 滚动相关
  const [scrollTop, setScrollTop] = useState(0)

  // 新建模式状态
  const [currentStep, setCurrentStep] = useState(1)
  const [background, setBackground] = useState('')
  const [currentProgress, setCurrentProgress] = useState<string[]>([])
  const [selectedMatch, setSelectedMatch] = useState<MatchDetail | null>(null)
  const [targetHours, setTargetHours] = useState(72)
  const [targetBehavior, setTargetBehavior] = useState('kiss')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  // 难度预估（实时计算）
  const difficultyResult = calculateLocalDifficulty(currentProgress, targetBehavior, selectedMatch, targetHours)

  // 动态快捷回复
  const quickReplies = generateQuickReplies(plan, steps)

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      // 使用一个较大的 scrollTop 值来确保滚到底部
      setScrollTop(prev => prev + 9999)
    }, 100)
  }, [])

  // 当消息变化时自动滚到底部
  const prevMsgCountRef = useRef(0)

  useLoad(() => {
    console.log('Speed plan page loaded, planId:', planId)
    if (isViewMode) {
      loadPlanDetail()
    } else {
      loadDraft()
      // 如果 URL 带了 matchId，自动选中该对象并跳转到背景步骤
      const urlMatchId = router.params.matchId
      if (urlMatchId) {
        fetchMatchDetail(Number(urlMatchId))
        setCurrentStep(2) // 跳过选择对象步骤，直接进入互动背景
      }
    }
  })

  useDidShow(() => {
    if (!isViewMode) {
      fetchMatches()
    }
  })

  // 消息变化自动滚底
  const currentMsgCount = messages.length + (sending ? 1 : 0)
  if (currentMsgCount !== prevMsgCountRef.current) {
    prevMsgCountRef.current = currentMsgCount
    scrollToBottom()
  }

  // 加载方案详情
  const loadPlanDetail = async () => {
    if (!planId) return
    
    try {
      setLoading(true)
      const res = await Network.request({ url: `/api/speed-plan/${planId}` })
      console.log('Load plan detail response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const planData = res.data.data.plan
        setPlan(planData)
        const msgs = res.data.data.messages || []
        setMessages(msgs)
        // 从第一条AI消息中解析步骤
        const firstAiMsg = msgs.find((m: Message) => m.role === 'assistant')
        if (firstAiMsg) {
          setSteps(parseStepsFromContent(firstAiMsg.content))
        }
        scrollToBottom()
      }
    } catch (error) {
      console.error('Load plan detail error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 发送消息
  const sendMessage = async () => {
    if (!chatInput.trim() || !planId) return
    
    const userMessage = chatInput.trim()
    setChatInput('')
    setSending(true)
    
    // 先添加用户消息到列表
    const tempUserMsg: Message = {
      id: generateId(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempUserMsg])
    
    try {
      const res = await Network.request({
        url: `/api/speed-plan/${planId}/chat`,
        method: 'POST',
        data: { message: userMessage },
      })
      console.log('Send message response:', res.data)
      
      if (res.data?.code === 200 && res.data?.data?.reply) {
        // 添加AI回复
        const aiMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: res.data.data.reply,
          created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, aiMsg])
      }
    } catch (error) {
      console.error('Send message error:', error)
    } finally {
      setSending(false)
    }
  }

  // 切换消息展开状态
  const toggleMessageExpand = (msgId: number) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(msgId)) {
        newSet.delete(msgId)
      } else {
        newSet.add(msgId)
      }
      return newSet
    })
  }

  // 步骤打卡
  const updateStepStatus = (stepId: string, status: StepItem['status']) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status } : s))
  }

  const handleQuickReply = (text: string) => {
    setChatInput(text)
  }

  // 以下是新建模式的逻辑
  const loadDraft = async () => {
    try {
      const draftStr = await Taro.getStorageSync(STORAGE_KEY)
      if (draftStr) {
        const draft: DraftData = JSON.parse(draftStr)
        setBackground(draft.background || '')
        setCurrentProgress(draft.currentProgress || [])
        setTargetHours(draft.targetHours || 72)
        setTargetBehavior(draft.targetBehavior || 'kiss')
        if (draft.selectedMatchId) {
          fetchMatchDetail(draft.selectedMatchId)
        }
      }
    } catch (error) {
      console.error('Load draft error:', error)
    }
  }

  const saveDraft = async (data: Partial<DraftData>) => {
    try {
      const draft: DraftData = {
        background: data.background ?? background,
        currentProgress: data.currentProgress ?? currentProgress,
        selectedMatchId: data.selectedMatchId ?? selectedMatch?.id,
        targetHours: data.targetHours ?? targetHours,
        targetBehavior: data.targetBehavior ?? targetBehavior,
      }
      await Taro.setStorageSync(STORAGE_KEY, JSON.stringify(draft))
    } catch (error) {
      console.error('Save draft error:', error)
    }
  }

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/match/list' })
      console.log('Fetch matches response:', res.data)
      if (res.data?.code === 200 && res.data?.data?.list) {
        setMatches(res.data.data.list.filter((m: Match) => m.status !== 'hidden'))
      }
    } catch (error) {
      console.error('Fetch matches error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMatchDetail = async (matchId: number) => {
    try {
      const res = await Network.request({ url: `/api/match/${matchId}` })
      console.log('Fetch match detail response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const detail = res.data.data
        if (detail.cycleStartDate) {
          const cycleRes = await Network.request({ url: `/api/match/${matchId}/cycle` })
          if (cycleRes.data?.code === 200 && cycleRes.data?.data) {
            detail.cycle_phase = cycleRes.data.data.phase
          }
        }
        const energyRes = await Network.request({ url: `/api/interaction/match/${matchId}/energy` })
        if (energyRes.data?.code === 200 && energyRes.data?.data) {
          detail.relationship_energy = energyRes.data.data.energy
          detail.interaction_count = energyRes.data.data.totalInteractions
        }
        setSelectedMatch(detail)
        saveDraft({ selectedMatchId: matchId })
      }
    } catch (error) {
      console.error('Fetch match detail error:', error)
    }
  }

  const toggleProgress = (code: string) => {
    const newProgress = currentProgress.includes(code) 
      ? currentProgress.filter(c => c !== code)
      : [...currentProgress, code]
    setCurrentProgress(newProgress)
    saveDraft({ currentProgress: newProgress })
  }

  const handleMatchSelect = async (match: Match) => {
    await fetchMatchDetail(match.id)
  }

  const createPlan = async () => {
    if (!selectedMatch) return
    
    try {
      setGenerating(true)
      const res = await Network.request({
        url: '/api/speed-plan/create',
        method: 'POST',
        data: {
          background,
          currentProgress,
          matchId: selectedMatch.id,
          targetHours,
          targetBehavior,
        }
      })
      console.log('Create plan response:', res.data)
      
      if (res.data?.code === 200 && res.data?.data) {
        // 添加初始消息
        const initialMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: res.data.data.initialMessage,
          created_at: new Date().toISOString(),
        }
        setMessages([initialMsg])
        // 解析步骤
        setSteps(parseStepsFromContent(res.data.data.initialMessage))
        setPlan({
          id: res.data.data.planId,
          match_id: selectedMatch.id,
          background,
          current_progress: currentProgress,
          target_hours: targetHours,
          target_behavior: targetBehavior,
          difficulty_score: res.data.data.difficulty,
          difficulty_level: res.data.data.difficultyLevel,
          matches: { id: selectedMatch.id, name: selectedMatch.name, avatar_url: selectedMatch.avatar_url },
        })
        // 切换到聊天模式
        setCurrentStep(4)
        // 清除草稿
        Taro.removeStorageSync(STORAGE_KEY)
        scrollToBottom()
      }
    } catch (error) {
      console.error('Create plan error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleBackgroundChange = (value: string) => {
    setBackground(value)
    saveDraft({ background: value })
  }

  const handleTargetHoursChange = (hours: number) => {
    setTargetHours(hours)
    saveDraft({ targetHours: hours })
  }

  const handleTargetBehaviorChange = (behavior: string) => {
    setTargetBehavior(behavior)
    saveDraft({ targetBehavior: behavior })
  }

  const getRelationshipTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      long_term: '长期',
      short_term: '短期',
      both: '灵活',
    }
    return labels[type || ''] || ''
  }

  const getCyclePhaseLabel = (phase?: string) => {
    const labels: Record<string, string> = {
      menstrual: '经期',
      follicular: '卵泡期',
      ovulation: '排卵期',
      luteal_early: '黄体早期',
      luteal_mid: '黄体中期',
      luteal_late: '黄体晚期',
    }
    return labels[phase || ''] || ''
  }

  const getBehaviorName = (code: string) => {
    const behavior = BEHAVIOR_LEVELS.find(b => b.code === code)
    return behavior?.name || code
  }

  const getDifficultyColor = (score: number) => {
    if (score <= 2) return 'text-green-600'
    if (score <= 4) return 'text-green-600'
    if (score <= 6) return 'text-amber-600'
    if (score <= 8) return 'text-orange-600'
    return 'text-red-600'
  }

  // 渲染对象头像（支持图片和首字回退）
  const renderAvatar = (name: string, avatarUrl?: string, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
    const textSizeClass = size === 'sm' ? 'text-xs' : 'text-sm'
    if (avatarUrl) {
      return (
        <Image 
          className={`${sizeClass} rounded-full`} 
          src={avatarUrl} 
          mode="aspectFill"
        />
      )
    }
    return (
      <View className={`${sizeClass} rounded-full bg-gray-100 flex items-center justify-center`}>
        <Text className={`block ${textSizeClass} font-medium text-gray-600`}>
          {name.charAt(0)}
        </Text>
      </View>
    )
  }

  // 聊天模式渲染
  if (isViewMode || currentStep === 4) {
    const doneSteps = steps.filter(s => s.status === 'done').length
    const totalSteps = steps.length

    return (
      <View className="min-h-screen flex flex-col" style={{ backgroundColor: '#F7F8FA' }}>
        <CustomHeader title="速推方案" />

        {/* 方案信息卡片 */}
        {plan && (
          <View className="bg-white px-4 py-3 border-b">
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-3">
                {renderAvatar(plan.matches?.name || '?', plan.matches?.avatar_url)}
                <View>
                  <Text className="block text-sm font-medium text-gray-900">{plan.matches?.name}</Text>
                  <View className="flex items-center gap-3 mt-1">
                    <Text className="block text-xs text-gray-500">
                      目标：{getBehaviorName(plan.target_behavior)}
                    </Text>
                    <Text className="block text-xs text-gray-400">|</Text>
                    <Text className="block text-xs text-gray-500">
                      {plan.target_hours >= 24 ? `${plan.target_hours / 24}天` : `${plan.target_hours}小时`}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="text-right">
                <Text className="block text-xs text-gray-400">难度</Text>
                <Text className={`block text-sm ${getDifficultyColor(plan.difficulty_score)}`}>
                  {plan.difficulty_level} {plan.difficulty_score}/10
                </Text>
              </View>
            </View>

            {/* 步骤进度条 */}
            {totalSteps > 0 && (
              <View className="mt-3 pt-3 border-t">
                <View className="flex items-center justify-between mb-1">
                  <Text className="block text-xs text-gray-500">执行进度</Text>
                  <Text className="block text-xs text-gray-400">{doneSteps}/{totalSteps} 步完成</Text>
                </View>
                <View className="w-full bg-gray-100 rounded-full h-2">
                  <View 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${totalSteps > 0 ? (doneSteps / totalSteps * 100) : 0}%` }}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* 步骤打卡区域 */}
        {steps.length > 0 && (
          <View className="bg-white mx-4 mt-3 rounded-xl overflow-hidden">
            <View className="px-3 py-2 bg-gray-50 border-b">
              <View className="flex items-center gap-1">
                <CircleDot size={14} color="#6B7280" />
                <Text className="block text-xs font-medium text-gray-600">方案步骤</Text>
              </View>
            </View>
            {steps.map((step, idx) => (
              <View 
                key={step.id} 
                className={`px-3 py-2 flex items-center justify-between ${
                  idx < steps.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex items-center gap-3 flex-1 mr-2">
                  {step.status === 'done' ? (
                    <CircleCheck size={16} color="#4ECB71" />
                  ) : step.status === 'failed' ? (
                    <CircleX size={16} color="#EF4444" />
                  ) : (
                    <CircleDot size={16} color="#9CA3AF" />
                  )}
                  <Text
                    className={`block text-sm ${
                      step.status === 'done' ? 'text-gray-400 line-through' :
                      step.status === 'failed' ? 'text-red-500' : 'text-gray-700'
                    }`}
                  >
                    {step.title}
                  </Text>
                </View>
                {step.status === 'pending' && (
                  <View className="flex items-center gap-1 shrink-0">
                    <View
                      className="px-2 py-1 rounded bg-green-50"
                      onClick={() => updateStepStatus(step.id, 'done')}
                    >
                      <Text className="block text-xs text-green-600">完成</Text>
                    </View>
                    <View
                      className="px-2 py-1 rounded bg-red-50"
                      onClick={() => updateStepStatus(step.id, 'failed')}
                    >
                      <Text className="block text-xs text-red-500">卡住</Text>
                    </View>
                  </View>
                )}
                {step.status === 'done' && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    <Text className="text-xs">已完成</Text>
                  </Badge>
                )}
                {step.status === 'failed' && (
                  <View
                    className="px-2 py-1 rounded bg-amber-50"
                    onClick={() => {
                      updateStepStatus(step.id, 'pending')
                      setChatInput(`「${step.title}」这步卡住了，怎么办？`)
                    }}
                  >
                    <Text className="block text-xs text-amber-600">求助</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 消息列表 */}
        <ScrollView 
          className="message-list flex-1 p-4"
          scrollY
          scrollWithAnimation
          scrollTop={scrollTop}
        >
          {messages.map((msg) => {
            const isExpanded = expandedMessages.has(msg.id)
            const isLong = msg.content.length > 300
            
            return (
              <View
                key={msg.id}
                className={`mb-4 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                style={{ display: 'flex' }}
              >
                <View
                  className={`max-w-[85%] rounded-2xl p-3 ${
                    msg.role === 'user' 
                      ? 'bg-green-500' 
                      : 'bg-white'
                  }`}
                >
                  <Text 
                    className={`block text-sm whitespace-pre-wrap ${
                      msg.role === 'user' ? 'text-white' : 'text-gray-700'
                    } ${isLong && !isExpanded ? 'line-clamp-8' : ''}`}
                  >
                    {msg.content}
                  </Text>
                  {isLong && (
                    <View
                      className={`mt-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                      style={{ display: 'flex' }}
                      onClick={() => toggleMessageExpand(msg.id)}
                    >
                      <Text className={`block text-xs ${msg.role === 'user' ? 'text-gray-300' : 'text-green-500'}`}>
                        {isExpanded ? '收起' : '展开全部'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )
          })}

          {sending && (
            <View className="mb-4 items-start" style={{ display: 'flex' }}>
              <View className="bg-white rounded-2xl shadow-soft p-3">
                <View className="flex items-center gap-3">
                  <LoaderCircle size={14} color="#9CA3AF" className="animate-spin" />
                  <Text className="block text-sm text-gray-400">正在思考...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* 快捷回复 */}
        <View className="bg-white px-4 py-2 border-t">
          <ScrollView scrollX className="whitespace-nowrap">
            <View className="flex gap-3">
              {quickReplies.map((text) => (
                <View
                  key={text}
                  className="px-3 py-2 rounded-full bg-gray-100 shrink-0"
                  onClick={() => handleQuickReply(text)}
                >
                  <Text className="block text-xs text-gray-600">{text}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 输入框 */}
        <View className="bg-white px-4 py-3 border-t">
          <View style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
            <View style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: '12px', padding: '8px 12px' }}>
              <Input
                style={{ width: '100%', fontSize: '14px' }}
                placeholder="输入问题或反馈..."
                value={chatInput}
                onInput={(e) => setChatInput(e.detail.value)}
                onConfirm={sendMessage}
                confirmType="send"
              />
            </View>
            <View
              style={{
                width: '40px', height: '40px', borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: chatInput.trim() ? '#000' : '#e5e7eb',
                flexShrink: 0,
              }}
              onClick={sendMessage}
            >
              <Send size={18} color={chatInput.trim() ? '#fff' : '#9CA3AF'} />
            </View>
          </View>
        </View>

        {/* 底部安全区 */}
        <View className="h-4 bg-white" />
      </View>
    )
  }

  // 新建模式渲染（Step 1-3）
  return (
    <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="速推方案" />

      {/* 进度指示器 */}
      <View className="bg-white px-4 py-3 border-b">
        <View className="flex items-center justify-between">
          {['对象', '背景', '目标', '方案'].map((label, index) => {
            const stepNum = index + 1
            const isActive = currentStep === stepNum
            const isCompleted = currentStep > stepNum
            
            return (
              <View key={label} className="flex items-center">
                <View 
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500' : isActive ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={14} color="#fff" />
                  ) : (
                    <Text className={`block text-xs ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {stepNum}
                    </Text>
                  )}
                </View>
                <Text className={`block text-xs ml-1 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {label}
                </Text>
                {index < 3 && (
                  <View
                    className={`w-6 h-1 mx-2 rounded ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </View>
            )
          })}
        </View>
      </View>

      {/* Step 1: 选择对象 */}
      {currentStep === 1 && (
        <View className="p-4">
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <View className="flex items-center gap-3 mb-4">
              <User size={18} color="#374151" />
              <Text className="block text-base font-semibold text-gray-900">选择对象</Text>
            </View>
            
            {loading ? (
              <View className="py-8 text-center">
                <Text className="block text-gray-400">加载中...</Text>
              </View>
            ) : matches.length === 0 ? (
              <View className="py-8 text-center">
                <Text className="block text-gray-400">还没有对象，请先添加</Text>
              </View>
            ) : (
              <View className="flex flex-col gap-3">
                {matches.map((match) => {
                  const isSelected = selectedMatch?.id === match.id
                  return (
                    <View
                      key={match.id}
                      className={`p-3 rounded-xl flex items-center justify-between ${
                        isSelected ? 'bg-green-500' : 'bg-gray-50'
                      }`}
                      onClick={() => handleMatchSelect(match)}
                    >
                      <View className="flex items-center gap-4">
                        {isSelected ? (
                          <View className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                            <Text className="block text-sm font-medium text-green-500">
                              {match.name.charAt(0)}
                            </Text>
                          </View>
                        ) : match.avatar_url ? (
                          <Image className="w-10 h-10 rounded-full" src={match.avatar_url} mode="aspectFill" />
                        ) : (
                          <View className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Text className="block text-sm font-medium text-gray-600">
                              {match.name.charAt(0)}
                            </Text>
                          </View>
                        )}
                        <View>
                          <Text className={`block font-medium ${
                            isSelected ? 'text-white' : 'text-gray-900'
                          }`}
                          >
                            {match.name}
                          </Text>
                          <Text className={`block text-xs ${
                            isSelected ? 'text-gray-300' : 'text-gray-500'
                          }`}
                          >
                            {getRelationshipTypeLabel(match.relationship_type)}
                            {match.progress_score !== undefined && ` · 推进值${match.progress_score}`}
                          </Text>
                        </View>
                      </View>
                      {isSelected && <Check size={18} color="#fff" />}
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {selectedMatch && (
            <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
              <Text className="block text-sm text-gray-500 mb-2">对象分析</Text>
              <View className="grid grid-cols-2 gap-4">
                {selectedMatch.mbti && (
                  <View className="bg-gray-50 rounded-lg p-2">
                    <Text className="block text-xs text-gray-400">MBTI</Text>
                    <Text className="block text-sm font-medium text-gray-900">{selectedMatch.mbti}</Text>
                  </View>
                )}
                {selectedMatch.attachment_type && (
                  <View className="bg-gray-50 rounded-lg p-2">
                    <Text className="block text-xs text-gray-400">依恋类型</Text>
                    <Text className="block text-sm font-medium text-gray-900">{selectedMatch.attachment_type}</Text>
                  </View>
                )}
                {selectedMatch.cycle_phase && (
                  <View className="bg-gray-50 rounded-lg p-2">
                    <Text className="block text-xs text-gray-400">周期阶段</Text>
                    <Text className="block text-sm font-medium text-gray-900">{getCyclePhaseLabel(selectedMatch.cycle_phase)}</Text>
                  </View>
                )}
                {selectedMatch.relationship_energy !== undefined && (
                  <View className="bg-gray-50 rounded-lg p-2">
                    <Text className="block text-xs text-gray-400">关系能量</Text>
                    <Text className="block text-sm font-medium text-gray-900">{selectedMatch.relationship_energy}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <Button
            className={`w-full rounded-xl py-3 ${selectedMatch ? 'bg-green-500' : 'bg-gray-200'}`}
            disabled={!selectedMatch}
            onClick={() => selectedMatch && setCurrentStep(2)}
          >
            <Text className={`block font-medium ${selectedMatch ? 'text-white' : 'text-gray-400'}`}>
              下一步
            </Text>
            <ChevronRight size={18} color={selectedMatch ? '#fff' : '#9CA3AF'} />
          </Button>
        </View>
      )}

      {/* Step 2: 互动背景 */}
      {currentStep === 2 && (
        <View className="p-4">
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <View className="flex items-center gap-3 mb-4">
              <User size={18} color="#374151" />
              <Text className="block text-base font-semibold text-gray-900">互动背景</Text>
            </View>
            
            <View className="w-full mb-4">
              <Textarea
                className="w-full h-24"
                placeholder="描述互动背景，例如：相亲认识一周，微信聊了几天..."
                value={background}
                onInput={(e) => handleBackgroundChange(e.detail.value)}
              />
            </View>

            <Text className="block text-sm text-gray-500 mb-4">当前进展（可多选）</Text>
            
            {PROGRESS_GROUPS.map((group) => (
              <View key={group.title} className="mb-4">
                <Text className="block text-xs text-gray-400 mb-2">{group.title}</Text>
                <View className="flex flex-wrap gap-3">
                  {group.items.map((behavior) => (
                    <View
                      key={behavior.code}
                      className={`px-3 py-2 rounded-full ${
                        currentProgress.includes(behavior.code)
                          ? 'bg-green-500'
                          : 'bg-gray-100'
                      }`}
                      onClick={() => toggleProgress(behavior.code)}
                    >
                      <Text className={`block text-xs ${
                        currentProgress.includes(behavior.code) ? 'text-white' : 'text-gray-600'
                      }`}
                      >
                        {behavior.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl py-3"
              onClick={() => setCurrentStep(1)}
            >
              <Text className="text-gray-600">上一步</Text>
            </Button>
            <Button
              className="flex-1 bg-green-500 rounded-xl py-3"
              onClick={() => setCurrentStep(3)}
            >
              <Text className="text-white font-medium">下一步</Text>
              <ChevronRight size={18} color="#fff" />
            </Button>
          </View>
        </View>
      )}

      {/* Step 3: 设定目标 */}
      {currentStep === 3 && (
        <View className="p-4">
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <View className="flex items-center gap-3 mb-4">
              <Target size={18} color="#374151" />
              <Text className="block text-base font-semibold text-gray-900">设定目标</Text>
            </View>
            
            <View className="mb-4">
              <Text className="block text-sm text-gray-500 mb-2">目标时间</Text>
              <View className="flex items-center gap-3">
                <View className="bg-gray-50 rounded-xl px-4 py-3 flex-1">
                  <Input
                    style={{ width: '100%', textAlign: 'center' }}
                    type="number"
                    value={String(targetHours)}
                    onInput={(e) => handleTargetHoursChange(Number(e.detail.value))}
                  />
                </View>
                <Text className="block text-gray-600">小时内</Text>
              </View>
              
              <View className="flex flex-wrap gap-3 mt-2">
                {[12, 24, 48, 72, 120, 168, 336, 720].map((hours) => (
                  <View
                    key={hours}
                    className={`px-3 py-2 rounded-full ${
                      targetHours === hours ? 'bg-green-500' : 'bg-gray-100'
                    }`}
                    onClick={() => handleTargetHoursChange(hours)}
                  >
                    <Text className={`block text-xs ${
                      targetHours === hours ? 'text-white' : 'text-gray-600'
                    }`}
                    >
                      {hours >= 24 ? `${hours / 24}天` : `${hours}小时`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View>
              <Text className="block text-sm text-gray-500 mb-2">目标行为</Text>
              <View className="flex flex-wrap gap-3">
                {TARGET_BEHAVIORS.map((behavior) => (
                  <View
                    key={behavior.code}
                    className={`px-4 py-2 rounded-xl ${
                      targetBehavior === behavior.code ? 'bg-green-500' : 'bg-gray-100'
                    }`}
                    onClick={() => handleTargetBehaviorChange(behavior.code)}
                  >
                    <Text className={`block text-sm ${
                      targetBehavior === behavior.code ? 'text-white' : 'text-gray-600'
                    }`}
                    >
                      {behavior.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* 难度预估 - 实时计算 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <View className="flex items-center justify-between mb-2">
              <View className="flex items-center gap-3">
                <Sparkles size={18} color="#F59E0B" />
                <Text className="block text-sm font-medium text-gray-900">难度预估</Text>
              </View>
              <View className="flex items-center gap-3">
                <Text className={`block text-lg font-bold ${getDifficultyColor(difficultyResult.score)}`}>
                  {difficultyResult.score}/10
                </Text>
                <Badge variant={difficultyResult.score >= 6 ? 'default' : 'secondary'} className="text-xs px-2 py-0">
                  <Text className="text-xs">{difficultyResult.level}</Text>
                </Badge>
              </View>
            </View>
            {difficultyResult.factors.length > 0 && (
              <View className="flex flex-wrap gap-1 mt-2">
                {difficultyResult.factors.map((factor) => (
                  <View key={factor} className="px-2 py-1 rounded bg-gray-50">
                    <Text className="block text-xs text-gray-500">{factor}</Text>
                  </View>
                ))}
              </View>
            )}
            <Text className="block text-xs text-gray-400 mt-2">
              基于当前进展、对象数据和时间目标实时计算
            </Text>
          </View>

          <View className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl py-3"
              onClick={() => setCurrentStep(2)}
            >
              <Text className="text-gray-600">上一步</Text>
            </Button>
            <Button
              className="flex-1 bg-green-500 rounded-xl py-3"
              onClick={createPlan}
              disabled={generating}
            >
              {generating ? (
                <View className="flex items-center gap-3">
                  <LoaderCircle size={18} color="#fff" className="animate-spin" />
                  <Text className="text-white font-medium">生成中...</Text>
                </View>
              ) : (
                <View className="flex items-center gap-1">
                  <Sparkles size={16} color="#fff" />
                  <Text className="text-white font-medium">生成方案</Text>
                </View>
              )}
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}

export default SpeedPlanPage