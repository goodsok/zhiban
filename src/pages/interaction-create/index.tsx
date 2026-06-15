import { View, Text, Picker } from '@tarojs/components'
import { Textarea } from '@/components/ui/textarea'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import CustomHeader from '@/components/custom-header'
import InteractionTypeTab, { InteractionType as InteractionTypeEnum, INTERACTION_TYPE_MAP, INTERACTION_TYPE_CONFIG } from '@/components/interaction-type-tab'
import {
  Calendar, Users,
  Clock, User, Sparkles, Zap, Upload, Image, X,
  LoaderCircle, ChevronDown
} from 'lucide-react-taro'

// 互动类型
type InteractionType = InteractionTypeEnum
type Mood = 'excellent' | 'good' | 'neutral' | 'awkward' | 'bad'
type Initiator = 'self' | 'partner' | 'mutual'
// 聊天录入：单页面模式（不再分步骤）

// 聊天记录来源选项
const CHAT_SOURCE_OPTIONS = [
  { value: 'wechat', label: '微信' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'tinder', label: 'Tinder' },
  { value: 'manual', label: '手动输入' },
  { value: 'other', label: '其他' },
]

// 互动类型配置已移至共享组件 @/components/interaction-type-tab

// 心情选项
const MOOD_OPTIONS: Array<{ value: Mood; label: string; emoji: string; color: string }> = [
  { value: 'excellent', label: '超开心', emoji: '🥰', color: 'bg-rose-100 border-rose-300' },
  { value: 'good', label: '挺不错', emoji: '😊', color: 'bg-amber-100 border-amber-300' },
  { value: 'neutral', label: '还行吧', emoji: '😐', color: 'bg-gray-100 border-gray-300' },
  { value: 'awkward', label: '有点尬', emoji: '😅', color: 'bg-blue-100 border-blue-300' },
  { value: 'bad', label: '不太好', emoji: '😞', color: 'bg-slate-100 border-slate-300' },
]

// 发起方选项
const INITIATOR_OPTIONS: Array<{ value: Initiator; label: string; icon: typeof User }> = [
  { value: 'self', label: '我主动', icon: User },
  { value: 'partner', label: '对方主动', icon: User },
  { value: 'mutual', label: '共同决定', icon: Users },
]

// 时长预设选项
const DURATION_OPTIONS = [
  { label: '15分钟', value: 15 },
  { label: '30分钟', value: 30 },
  { label: '1小时', value: 60 },
  { label: '2小时', value: 120 },
  { label: '半天', value: 240 },
  { label: '整天', value: 480 },
]

// 活动 tag 预设
const ACTIVITY_PRESETS: Record<InteractionType, string[]> = {
  date: [
    '吃饭', '看电影', '散步', '喝咖啡', '逛街', '旅行',
    '看展', '游乐园', '露营', '唱K', '做饭', '泡温泉',
    '看演出', '逛市集', '密室逃脱', '桌游', '自驾游',
  ],
  chat: [
    '日常闲聊', '深入话题', '暧昧调情', '倾诉心事',
    '分享趣事', '讨论计划', '回忆往事', '谈心',
    '聊梦想', '聊烦恼', '聊童年', '聊未来',
  ],
  call: [
    '晚安电话', '通勤聊天', '深夜长谈',
    '早安电话', '午休闲聊', '加班陪伴', '睡前故事',
  ],
  video: [
    '视频约会', '一起看电影', '远程陪伴',
    '视频做饭', '云逛街', '连麦学习', '一起打游戏',
  ],
  gift: [
    '鲜花', '零食', '饰品', '惊喜快递',
    '手工礼物', '数码产品', '书籍', '护肤品',
    '衣服', '蛋糕', '公仔', '红包',
  ],
  physical: [
    '牵手', '拥抱', '亲吻',
    '靠肩', '摸头', '背抱', '依偎',
    '挽臂', '十指紧扣', '额头吻',
  ],
  social: [
    '朋友聚会', '家庭见面',
    '同学会', '同事聚餐', '生日会',
    '户外活动', '唱K聚会', '旅行团建',
  ],
  other: ['其他'],
}

// 聊天记录卡片类型
interface ChatRecordCard {
  id: number
  contentType: 'text' | 'image'
  rawContent: string | null
  source: string
  summary: string | null
  imageKey: string | null
  uploading: boolean
}

// AI 分析结果类型
interface AnalysisResult {
  parsedMessages: Array<{ sender: string; content: string; timestamp: string }>
  summary: string
  keyTopics: string[]
  sentiment: string
  messageCount: number
  inferredMood: Mood | null
  inferredActivities: string[]
  inferredDurationMinutes: number | null
  interestSignals: string[]
  redFlags: string[]
  conversationFlow: {
    initiator: string
    myMessageCount: number
    otherMessageCount: number
    avgResponseHint: string
  } | null
  emotionalArc: string
  chemistryScore: number | null
  communicationStyle: {
    me: string
    other: string
  } | null
  keyMoments: string[]
  suggestions: string[]
  warmthLevel: number | null
  depthLevel: string
}

// 本地日期格式化（避免 UTC 偏移）
const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formatLocalTime = (date: Date): string => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 设计指南主色：选中态统一使用
const PRIMARY_COLOR = '#4ECB71'

export default function InteractionCreatePage() {
  const router = useRouter()
  const matchId = Number(router.params.matchId) || 0

  const [submitting, setSubmitting] = useState(false)
  const tempIdCounter = useRef(0)
  // 追踪聊天文本是否已入库（防止重复入库）
  const chatTextSavedRef = useRef(false)
  // 分析请求的 AbortController（用于取消分析）
  const analyzeAbortRef = useRef<AbortController | null>(null)

  // 表单状态
  const [interactionType, setInteractionType] = useState<InteractionType>('date')
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [customDuration, setCustomDuration] = useState('')
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [initiator, setInitiator] = useState<Initiator>('mutual')
  const [location, setLocation] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mood, setMood] = useState<Mood>('good')
  const [breakthroughMoment, setBreakthroughMoment] = useState('')
  const [issuesEncountered, setIssuesEncountered] = useState('')

  // 可选项折叠状态
  const [moodOpen, setMoodOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [optionalOpen, setOptionalOpen] = useState(false)

  // 对方名称
  const [matchName, setMatchName] = useState('')

  // 活动标签
  const [activities, setActivities] = useState<string[]>([])
  const [customActivity, setCustomActivity] = useState('')
  const [showCustomActivityInput, setShowCustomActivityInput] = useState(false)

  // 聊天记录相关状态
  const [chatRecords, setChatRecords] = useState<ChatRecordCard[]>([])
  const [chatTextInput, setChatTextInput] = useState('')
  const chatTextInputRef = useRef(chatTextInput)
  chatTextInputRef.current = chatTextInput
  const [chatSource, setChatSource] = useState('wechat')


  // 聊天类型专用：分析结果（直接展示在录入页）
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  // 能量预览
  const [energyPreview, setEnergyPreview] = useState<{
    totalEnergy: number
    activeBoosters: string[]
    bonusEnergy: number
  } | null>(null)
  const [energyLoading, setEnergyLoading] = useState(false)

  // 是否展示聊天记录上传区域（消息/通话/视频类型时展示）


  // 表单是否已填写内容（用于返回确认）
  const hasContent = !!(
    title || description || location || breakthroughMoment || issuesEncountered
    || activities.length > 0 || chatRecords.length > 0
    || durationMinutes !== null || customDuration || startedAt !== null
    || (interactionType === 'chat' && (chatTextInput.trim().length > 0 || chatRecords.length > 0))
  )

  // 是否有上传中的聊天记录
  const hasUploadingRecords = chatRecords.some(r => r.uploading)

  // 初始化默认值
  useEffect(() => {
    setStartedAt(new Date())
    setDurationMinutes(30)
    setInitiator('mutual')
  }, [])

  // 初始化：从路由参数读取 type
  useEffect(() => {
    const type = router.params.type as InteractionType
    if (type && INTERACTION_TYPE_CONFIG.some(t => t.type === type)) {
      setInteractionType(type)
    }
  }, []) // 仅初始化时执行一次

  // 加载对方名称
  useEffect(() => {
    if (!matchId) return
    Network.request({ url: `/api/match/${matchId}` })
      .then(res => {
        if (res.data?.code === 200 && res.data?.data) {
          setMatchName(res.data.data.name || '')
        }
      })
      .catch(() => { /* 静默处理 */ })
  }, [matchId])

  // 获取当前选中的类型配置
  const currentType = INTERACTION_TYPE_MAP[interactionType] || INTERACTION_TYPE_CONFIG[0]
  // 类型图标在类型选择器中通过 currentType.icon 使用

  // 自动推断互动分类
  const interactionCategory = currentType.category

  // 获取实际时长
  const actualDuration = useMemo(() => {
    if (showCustomDuration && customDuration) {
      const parsed = parseInt(customDuration, 10)
      return Number.isNaN(parsed) ? null : parsed
    }
    return durationMinutes
  }, [showCustomDuration, customDuration, durationMinutes])

  // 能量预览请求（带防抖）
  const energyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!matchId) return
    if (energyDebounceRef.current) clearTimeout(energyDebounceRef.current)
    energyDebounceRef.current = setTimeout(async () => {
      setEnergyLoading(true)
      try {
        const res = await Network.request({
          url: `/api/interaction/match/${matchId}/energy/preview`,
          method: 'POST',
          data: {
            interactionType,
            mood,
            breakthrough: !!breakthroughMoment,
            duration: actualDuration || undefined,
          },
        })
        console.log('Energy preview response:', res.data)
        if (res.data?.code === 200 && res.data?.data) {
          setEnergyPreview({
            totalEnergy: res.data.data.totalEnergy,
            activeBoosters: res.data.data.activeBoosters || [],
            bonusEnergy: res.data.data.bonusEnergy || 0,
          })
        }
      } catch {
        // 预览失败静默处理
      } finally {
        setEnergyLoading(false)
      }
    }, 400)
    return () => { if (energyDebounceRef.current) clearTimeout(energyDebounceRef.current) }
  }, [matchId, interactionType, mood, breakthroughMoment, actualDuration])

  // 切换类型时重置
  useEffect(() => {
    setActivities([])
    setChatTextInput('')
    setCustomDuration('')
    setShowCustomDuration(false)
    setLocation('')
    if (interactionType === 'chat') {
      setAnalysisResult(null)
    }
  }, [interactionType])

  // 活动标签切换
  const toggleActivity = (tag: string) => {
    setActivities(prev =>
      prev.includes(tag) ? prev.filter(a => a !== tag) : [...prev, tag]
    )
  }

  // ========== 聊天类型：录入驱动流程 ==========

  // 跳过AI分析，直接进入确认填写页（适用于已上传截图、无需粘贴文字的场景）
  // 仅保存聊天记录（不做 AI 分析）
  const handleSaveChatOnly = useCallback(async () => {
    if (!matchId) return
    if (hasUploadingRecords) {
      Taro.showToast({ title: '聊天记录上传中，请稍候', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      // 先保存文字聊天记录
      let finalChatRecordIds = chatRecords.map(r => r.id).filter(id => id > 0)
      const cleanChatText = chatTextInput.replace(/\[图片解析失败[^\]]*\]/g, '').trim()
      if (cleanChatText && !chatTextSavedRef.current) {
        try {
          const textRes = await Network.request({
            url: `/api/chat-record/match/${matchId}/text`,
            method: 'POST',
            data: {
              contentType: 'text',
              rawContent: cleanChatText,
              source: chatSource,
            },
          })
          if (textRes.data?.code === 200 && textRes.data?.data?.id) {
            finalChatRecordIds = [...finalChatRecordIds, textRes.data.data.id]
            chatTextSavedRef.current = true
          }
        } catch (err) {
          console.error('Save chat text error:', err)
        }
      }

      const payload = {
        interactionType,
        interactionCategory,
        startedAt: startedAt ? startedAt.toISOString() : new Date().toISOString(),
        durationMinutes: actualDuration,
        initiator,
        location: location || null,
        title: title || '聊天记录',
        description: description || null,
        activities: activities.length > 0 ? activities : undefined,
        mood,
        breakthroughMoment: breakthroughMoment || null,
        issuesEncountered: issuesEncountered || null,
        chatRecordIds: finalChatRecordIds.length > 0 ? finalChatRecordIds : undefined,
      }

      console.log('Save chat only payload:', payload)

      const res = await Network.request({
        url: `/api/interaction/match/${matchId}`,
        method: 'POST',
        data: payload,
      })

      console.log('Save chat only response:', res.data)

      if (res.data?.code === 200) {
        Taro.showToast({ title: '保存成功', icon: 'success' })
        Taro.eventCenter.trigger('interaction:created')
        setTimeout(() => { Taro.navigateBack() }, 1500)
      } else {
        Taro.showToast({ title: res.data?.message || res.data?.msg || '保存失败', icon: 'error' })
      }
    } catch (error) {
      console.error('Save chat only error:', error)
      Taro.showToast({ title: '保存失败', icon: 'error' })
    } finally {
      setSubmitting(false)
    }
  }, [matchId, interactionType, interactionCategory, startedAt, actualDuration, initiator, location, title, description, activities, mood, breakthroughMoment, issuesEncountered, chatRecords, chatTextInput, chatSource, hasUploadingRecords])

  // AI 分析聊天内容
  const handleAnalyzeChat = useCallback(async () => {
    const currentText = chatTextInputRef.current
    console.log('handleAnalyzeChat triggered, chatTextInput:', currentText?.slice(0, 50), 'matchId:', matchId)
    // 过滤掉 OCR 解析失败的提示文字
    const cleanContent = currentText.replace(/\[图片解析失败[^\]]*\]/g, '').trim()
    if (!cleanContent) {
      Taro.showToast({ title: '请先输入聊天内容', icon: 'none' })
      return
    }
    if (!matchId) return

    // 取消之前可能还在进行中的分析
    if (analyzeAbortRef.current) {
      analyzeAbortRef.current.abort()
    }
    const abortController = new AbortController()
    analyzeAbortRef.current = abortController

    setAnalyzing(true)

    // 30 秒超时
    const timeoutId = setTimeout(() => {
      if (abortController.signal.aborted) return
      abortController.abort()
      Taro.showToast({ title: '分析超时，请重试', icon: 'none' })
      setAnalyzing(false)
    }, 30000)

    try {
      const res = await Network.request({
        url: `/api/chat-record/match/${matchId}/analyze`,
        method: 'POST',
        data: {
          rawContent: cleanContent,
          source: chatSource,
        },
      })

      // 检查是否已被取消
      if (abortController.signal.aborted) return

      console.log('Chat analyze response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const data = res.data.data as AnalysisResult

        // 校验 inferredMood 是否合法
        const validMoods: Mood[] = ['excellent', 'good', 'neutral', 'awkward', 'bad']
        const safeMood = data.inferredMood && validMoods.includes(data.inferredMood)
          ? data.inferredMood
          : null

        setAnalysisResult({ ...data, inferredMood: safeMood })

        // 自动填充推断结果
        if (safeMood) setMood(safeMood)
        if (data.inferredActivities?.length > 0) {
          const presets = ACTIVITY_PRESETS.chat || []
          const matched = data.inferredActivities.filter(a => presets.includes(a))
          setActivities(matched.length > 0 ? matched : data.inferredActivities.slice(0, 3))
        }
        if (data.summary) {
          setTitle('聊天记录')
          setDescription(data.summary)
        }
        if (data.inferredDurationMinutes) {
          setDurationMinutes(data.inferredDurationMinutes)
        }

        Taro.showToast({ title: 'AI 分析完成', icon: 'success' })
      } else {
        Taro.showToast({ title: '分析失败，请重试', icon: 'none' })
      }
    } catch (error) {
      // 如果是取消导致的，不提示
      if (abortController.signal.aborted) return
      console.error('Chat analyze error:', error)
      Taro.showToast({ title: '分析失败，请重试', icon: 'none' })
    } finally {
      clearTimeout(timeoutId)
      if (!abortController.signal.aborted) {
        setAnalyzing(false)
      }
    }
  }, [matchId, chatSource])

  // 重新分析：重置 AI 自动填充的状态
  const handleReAnalyze = useCallback(() => {
    setAnalysisResult(null)
    chatTextSavedRef.current = false
    // 重置 AI 自动填充的状态，避免残留
    setMood('good')
    setActivities([])
    setTitle('')
    setDescription('')
    setDurationMinutes(null)
    setShowCustomDuration(false)
    setCustomDuration('')
  }, [])

  // ========== 聊天记录相关操作 ==========

  // 上传聊天截图
  const handleUploadChatImage = useCallback(async () => {
    try {
      const chooseRes = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })

      const tempFilePath = chooseRes.tempFilePaths[0]
      console.log('Selected chat image:', tempFilePath)

      // 先在列表中添加一个上传中的占位
      const tempId = -(++tempIdCounter.current)
      setChatRecords(prev => [...prev, {
        id: tempId,
        contentType: 'image',
        rawContent: null,
        source: chatSource,
        summary: null,
        imageKey: null,
        uploading: true,
      }])

      const uploadRes = await Network.uploadFile({
        url: `/api/chat-record/match/${matchId}/image`,
        filePath: tempFilePath,
        name: 'file',
        formData: {
          source: chatSource,
          contentType: 'image',
        },
      })

      console.log('Upload chat image response:', uploadRes.data)

      // 解析返回数据（uploadFile 返回的 data 可能是 string）
      const result: any = typeof uploadRes.data === 'string'
        ? (() => { try { return JSON.parse(uploadRes.data) } catch { return null } })()
        : uploadRes.data

      if (result?.code === 200 && result?.data) {
        const recognizedText = (result.data.rawContent as string) || ''
        // 过滤 OCR 解析失败的提示，不填入 textarea
        const validText = recognizedText.replace(/\[图片解析失败[^\]]*\]/g, '').trim()
        setChatRecords(prev => prev.map(r =>
          r.id === tempId
            ? {
                id: result.data.id as number,
                contentType: 'image' as const,
                rawContent: recognizedText || null,
                source: chatSource,
                summary: (result.data.summary as string) || null,
                imageKey: (result.data.imageKey as string) || null,
                uploading: false,
              }
            : r
        ))
        // 自动将识别内容追加到粘贴聊天记录 textarea
        if (validText) {
          setChatTextInput(prev => prev ? `${prev}\n${validText}` : validText)
          Taro.showToast({ title: '截图已识别', icon: 'success' })
        } else {
          Taro.showToast({ title: '请手动输入聊天内容', icon: 'none' })
        }
      } else {
        // 精确移除当前失败的占位
        setChatRecords(prev => prev.filter(r => r.id !== tempId))
        Taro.showToast({ title: result?.message || '上传失败', icon: 'none' })
      }
    } catch (error) {
      console.error('Upload chat image error:', error)
      // 精确移除当前失败的占位（通过最新的 tempId）
      const failedId = -tempIdCounter.current
      setChatRecords(prev => prev.filter(r => r.id !== failedId))
      Taro.showToast({ title: '选择图片失败', icon: 'none' })
    }
  }, [matchId, chatSource])

  // 删除聊天记录
  const handleDeleteChatRecord = useCallback((recordId: number) => {
    Taro.showModal({
      title: '删除聊天记录',
      content: '确定要删除这条聊天记录吗？',
      confirmText: '删除',
      confirmColor: '#EF4444',
    }).then(async (res) => {
      if (!res.confirm) return
      try {
        await Network.request({
          url: `/api/chat-record/${recordId}`,
          method: 'DELETE',
        })
        setChatRecords(prev => prev.filter(r => r.id !== recordId))
      } catch (err) {
        console.error('Delete chat record error:', err)
        Taro.showToast({ title: '删除失败，请重试', icon: 'none' })
      }
    })
  }, [])

  // ========== 提交表单 ==========
  const handleSubmit = useCallback(async () => {
    if (!matchId) {
      Taro.showToast({ title: '参数错误', icon: 'error' })
      return
    }

    // 阻止提交：有正在上传的聊天记录
    if (hasUploadingRecords) {
      Taro.showToast({ title: '聊天记录上传中，请稍候', icon: 'none' })
      return
    }

    // 校验：至少填写互动内容或详细描述
    if (!title && !description) {
      Taro.showToast({ title: '请输入互动内容或详细描述', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const chatRecordIds = chatRecords.map(r => r.id).filter(id => id > 0)

      // chat 类型：先把聊天内容入库，再创建互动
      let finalChatRecordIds = chatRecordIds
      if (interactionType === 'chat' && chatTextInput.trim() && !chatTextSavedRef.current) {
        try {
          const textRes = await Network.request({
            url: `/api/chat-record/match/${matchId}/text`,
            method: 'POST',
            data: {
              contentType: 'text',
              rawContent: chatTextInput.replace(/\[图片解析失败[^\]]*\]/g, '').trim(),
              source: chatSource,
            },
          })
          if (textRes.data?.code === 200 && textRes.data?.data?.id) {
            finalChatRecordIds = [...finalChatRecordIds, textRes.data.data.id]
            chatTextSavedRef.current = true
          }
        } catch (err) {
          console.error('Save chat text error:', err)
        }
      }

      const payload = {
        interactionType,
        interactionCategory,
        startedAt: startedAt ? startedAt.toISOString() : new Date().toISOString(),
        durationMinutes: actualDuration,
        initiator,
        location: location || null,
        title: title || null,
        description: description || null,
        activities: activities.length > 0 ? activities : undefined,
        mood,
        breakthroughMoment: breakthroughMoment || null,
        issuesEncountered: issuesEncountered || null,
        chatRecordIds: finalChatRecordIds.length > 0 ? finalChatRecordIds : undefined,
      }

      console.log('Create interaction payload:', payload)

      const res = await Network.request({
        url: `/api/interaction/match/${matchId}`,
        method: 'POST',
        data: payload,
      })

      console.log('Create interaction response:', res.data)

      if (res.data?.code === 200) {
        Taro.showToast({ title: '记录成功', icon: 'success' })
        // 通知列表页刷新数据
        Taro.eventCenter.trigger('interaction:created')
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({ title: res.data?.message || res.data?.msg || '创建失败', icon: 'error' })
      }
    } catch (error) {
      console.error('Create interaction error:', error)
      Taro.showToast({ title: '创建失败', icon: 'error' })
    } finally {
      setSubmitting(false)
    }
  }, [matchId, interactionType, interactionCategory, startedAt, actualDuration, initiator, location, title, description, activities, mood, breakthroughMoment, issuesEncountered, chatRecords, chatTextInput, chatSource, hasUploadingRecords])

  // ========== 渲染辅助 ==========
  const pageTitle = matchName ? `和${matchName}的互动` : '记录互动'

  // 聊天类型：返回确认
  const handleBack = useCallback(() => {
    if (interactionType === 'chat') {
      // 分析中返回：取消分析
      if (analyzing) {
        setAnalyzing(false)
        return
      }
      // 检查是否有内容
      if (chatTextInput.trim() || chatRecords.length > 0) {
        Taro.showModal({
          title: '放弃编辑',
          content: '你已填写的内容将不会保存，确定要离开吗？',
          confirmText: '离开',
          confirmColor: '#EF4444',
        }).then(res => {
          if (res.confirm) Taro.navigateBack()
        })
        return
      }
    }
    if (hasContent) {
      Taro.showModal({
        title: '放弃编辑',
        content: '你已填写的内容将不会保存，确定要离开吗？',
        confirmText: '离开',
        confirmColor: '#EF4444',
      }).then(res => {
        if (res.confirm) Taro.navigateBack()
      })
    } else {
      Taro.navigateBack()
    }
  }, [hasContent, interactionType, analyzing, chatTextInput, chatRecords])

  // ========== 聊天类型：Step 1 - 录入 ==========
  const renderChatInput = () => (
    <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA', paddingBottom: '120px' }}>
      <CustomHeader title="记录聊天" onBack={handleBack} />

      {/* 互动类型选择 */}
      <InteractionTypeTab value={interactionType} onChange={(t) => { setInteractionType(t as InteractionType) }} />

      {/* 聊天来源 */}
      <View className="p-4 pb-2">
        <Text className="block text-sm font-medium text-gray-700 mb-3">聊天来源</Text>
        <View className="flex flex-row flex-wrap gap-2">
          {CHAT_SOURCE_OPTIONS.map(opt => (
            <View
              key={opt.value}
              className={`px-4 py-2 rounded-full ${chatSource === opt.value ? 'bg-blue-500' : 'bg-gray-100'}`}
              onClick={() => setChatSource(opt.value)}
            >
              <Text className={`block text-xs ${chatSource === opt.value ? 'text-white' : 'text-gray-600'}`}>
                {opt.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 上传聊天截图（优先展示） */}
      {/* 聊天输入区 */}
      <View className="px-4 space-y-4">
        {/* 上传截图 */}
        <View>
          <Text className="block text-sm font-medium text-gray-700 mb-2">聊天截图</Text>
          <View
            className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50"
            onClick={handleUploadChatImage}
          >
            <Upload size={16} color="#9CA3AF" />
            <Text className="block text-xs text-gray-500">选择截图</Text>
          </View>
          {chatRecords.length > 0 && (
            <View className="mt-2 space-y-2">
              {chatRecords.map(record => (
                <View key={record.id} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50">
                  <Image size={14} color="#8B5CF6" />
                  <View className="flex-1" style={{ flex: 1, minWidth: 0 }}>
                    {record.uploading ? (
                      <Text className="block text-xs text-gray-400">上传中...</Text>
                    ) : (
                      <Text className="block text-xs text-gray-700">聊天截图</Text>
                    )}
                  </View>
                  {!record.uploading && (
                    <View onClick={() => handleDeleteChatRecord(record.id)} className="p-1">
                      <X size={12} color="#9CA3AF" />
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 粘贴聊天记录 */}
        <View>
          <View className="flex items-center gap-2 mb-2">
            <Text className="block text-sm font-medium text-gray-700">聊天内容</Text>
            {chatRecords.length > 0 && (
              <Text className="block text-xs text-gray-400">可选，粘贴后可 AI 分析</Text>
            )}
          </View>
          <Textarea
            wrapperClassName="bg-gray-50 border-gray-200"
            style={{ width: '100%', fontSize: '13px', minHeight: '10rem' }}
            placeholder="粘贴或输入聊天记录...\n\n格式示例：\n我: 你今天怎么样？\n她: 还不错呀，刚下班~\n我: 辛苦啦，要不要一起吃饭？\n她: 好呀好呀！"
            value={chatTextInput}
            onInput={e => setChatTextInput(e.detail.value)}
            maxlength={5000}
          />
          <Text className="block text-xs text-gray-400 mt-1">{chatTextInput.length}/5000 字</Text>
          {/* AI 分析按钮 - 有内容时显示 */}
          {chatTextInput.replace(/\[图片解析失败[^\]]*\]/g, '').trim() && (
            <View
              className="w-full mt-3 py-2 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: analyzing ? '#93C5FD' : '#3B82F6' }}
              onClick={analyzing ? undefined : handleAnalyzeChat}
            >
              <Sparkles size={16} color="#fff" />
              <Text className="block text-sm font-medium text-white ml-2">
                {analyzing ? 'AI 分析中...' : 'AI 智能分析'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* AI 分析结果（分析完成后直接展示） */}
      {analysisResult && (
        <View className="px-4 mt-4">
          <View className="flex items-center gap-2 mb-3">
            <Sparkles size={16} color="#3B82F6" />
            <Text className="block text-sm font-semibold text-gray-800">AI 分析结果</Text>
            <Text className="block text-xs text-blue-500 ml-auto" onClick={handleReAnalyze}>重新分析</Text>
          </View>

          {/* 评分指标行 */}
          {(analysisResult.chemistryScore || analysisResult.warmthLevel) && (
            <View className="flex flex-row gap-2 mb-3">
              {analysisResult.chemistryScore && (
                <View className="flex-1 p-3 rounded-xl bg-pink-50">
                  <Text className="block text-xs text-gray-500">化学反应</Text>
                  <Text className="block text-lg font-bold text-pink-500">{analysisResult.chemistryScore}<Text className="text-xs text-gray-400 font-normal">/10</Text></Text>
                </View>
              )}
              {analysisResult.warmthLevel && (
                <View className="flex-1 p-3 rounded-xl bg-orange-50">
                  <Text className="block text-xs text-gray-500">亲密温度</Text>
                  <Text className="block text-lg font-bold text-orange-500">{analysisResult.warmthLevel}<Text className="text-xs text-gray-400 font-normal">/10</Text></Text>
                </View>
              )}
              {analysisResult.depthLevel && (
                <View className="flex-1 p-3 rounded-xl bg-violet-50">
                  <Text className="block text-xs text-gray-500">对话深度</Text>
                  <Text className="block text-sm font-medium text-gray-800 mt-1">
                    {analysisResult.depthLevel === 'deep' ? '深入交流' : analysisResult.depthLevel === 'medium' ? '有深度' : '浅层闲聊'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 摘要 */}
          {analysisResult.summary && (
            <View className="p-3 rounded-xl bg-gray-50 mb-3">
              <Text className="block text-sm text-gray-700">{analysisResult.summary}</Text>
            </View>
          )}

          {/* 对话走向 */}
          {analysisResult.conversationFlow && (
            <View className="p-3 rounded-xl bg-gray-50 mb-3">
              <Text className="block text-xs text-gray-500 mb-2">对话走向</Text>
              <View className="flex flex-row gap-4">
                <View>
                  <Text className="block text-xs text-gray-400">谁主导</Text>
                  <Text className="block text-sm font-medium text-gray-800">
                    {analysisResult.conversationFlow.initiator === '我方' ? '我方主动' :
                     analysisResult.conversationFlow.initiator === '对方' ? '对方主动' : '双方均衡'}
                  </Text>
                </View>
                {analysisResult.conversationFlow.myMessageCount > 0 && (
                  <View>
                    <Text className="block text-xs text-gray-400">我的消息</Text>
                    <Text className="block text-sm font-medium text-gray-800">{analysisResult.conversationFlow.myMessageCount} 条</Text>
                  </View>
                )}
                {analysisResult.conversationFlow.otherMessageCount > 0 && (
                  <View>
                    <Text className="block text-xs text-gray-400">对方消息</Text>
                    <Text className="block text-sm font-medium text-gray-800">{analysisResult.conversationFlow.otherMessageCount} 条</Text>
                  </View>
                )}
                {analysisResult.conversationFlow.avgResponseHint && (
                  <View>
                    <Text className="block text-xs text-gray-400">回复速度</Text>
                    <Text className="block text-sm font-medium text-gray-800">{analysisResult.conversationFlow.avgResponseHint}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* 情感轨迹 */}
          {analysisResult.emotionalArc && (
            <View className="p-3 rounded-xl bg-gray-50 mb-3">
              <Text className="block text-xs text-gray-500 mb-1">情感轨迹</Text>
              <Text className="block text-sm text-gray-800">{analysisResult.emotionalArc}</Text>
            </View>
          )}

          {/* 话题标签 + 活动选择 */}
          {analysisResult.keyTopics?.length > 0 && (
            <View className="mb-3">
              <Text className="block text-xs text-gray-500 mb-2">识别到的话题（点击选择）</Text>
              <View className="flex flex-row flex-wrap gap-2">
                {analysisResult.keyTopics.map(topic => {
                  const isSelected = activities.includes(topic)
                  return (
                    <View
                      key={topic}
                      className="px-3 py-1 rounded-full bg-gray-100"
                      style={isSelected ? { backgroundColor: PRIMARY_COLOR } : undefined}
                      onClick={() => toggleActivity(topic)}
                    >
                      <Text className={`block text-xs ${isSelected ? 'text-white' : 'text-gray-600'}`}>{topic}</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {/* 关键时刻 */}
          {analysisResult.keyMoments?.length > 0 && (
            <View className="mb-3">
              <Text className="block text-xs text-gray-500 mb-2">关键时刻</Text>
              <View className="flex flex-col gap-2">
                {analysisResult.keyMoments.map((moment, idx) => (
                  <View key={idx} className="flex flex-row items-start gap-2">
                    <View className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-1">
                      <Text className="block text-xs text-purple-600">{idx + 1}</Text>
                    </View>
                    <Text className="block text-sm text-gray-800">{moment}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 兴趣信号 + 冷淡信号 */}
          <View className="flex flex-row flex-wrap gap-2 mb-3">
            {analysisResult.interestSignals?.map((signal, idx) => (
              <View key={`interest-${idx}`} className="px-3 py-1 rounded-full bg-amber-100">
                <Text className="block text-xs text-amber-700">{signal}</Text>
              </View>
            ))}
            {analysisResult.redFlags?.map((flag, idx) => (
              <View key={`red-${idx}`} className="px-3 py-1 rounded-full bg-red-50">
                <Text className="block text-xs text-red-600">{flag}</Text>
              </View>
            ))}
          </View>

          {/* 沟通风格 */}
          {analysisResult.communicationStyle && (
            <View className="p-3 rounded-xl bg-gray-50 mb-3">
              <Text className="block text-xs text-gray-500 mb-2">沟通风格</Text>
              <View className="flex flex-row gap-4">
                {analysisResult.communicationStyle.me && (
                  <View className="flex-1">
                    <Text className="block text-xs text-gray-400">我</Text>
                    <Text className="block text-sm text-gray-800">{analysisResult.communicationStyle.me}</Text>
                  </View>
                )}
                {analysisResult.communicationStyle.other && (
                  <View className="flex-1">
                    <Text className="block text-xs text-gray-400">对方</Text>
                    <Text className="block text-sm text-gray-800">{analysisResult.communicationStyle.other}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* AI 建议 */}
          {analysisResult.suggestions?.length > 0 && (
            <View className="p-3 rounded-xl bg-blue-50 mb-3">
              <Text className="block text-xs text-blue-500 mb-2">下一步建议</Text>
              <View className="flex flex-col gap-1">
                {analysisResult.suggestions.map((suggestion, idx) => (
                  <View key={idx} className="flex flex-row items-start gap-2">
                    <Text className="block text-xs text-blue-400 shrink-0">•</Text>
                    <Text className="block text-sm text-blue-800">{suggestion}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 消息数量和推断时长 */}
          <View className="flex flex-row gap-4">
            {analysisResult.messageCount > 0 && (
              <View>
                <Text className="block text-xs text-gray-500">消息数量</Text>
                <Text className="block text-sm font-medium text-gray-800">{analysisResult.messageCount} 条</Text>
              </View>
            )}
            {analysisResult.inferredDurationMinutes && (
              <View>
                <Text className="block text-xs text-gray-500">推断时长</Text>
                <Text className="block text-sm font-medium text-gray-800">约 {analysisResult.inferredDurationMinutes} 分钟</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 分析中提示 */}
      {analyzing && (
        <View className="px-4 pb-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <LoaderCircle size={20} color="#3B82F6" />
              </View>
              <Text className="block text-sm text-gray-600">AI 正在分析聊天内容...</Text>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 心情选择 - 默认折叠 */}
      <View className="px-4 pb-4">
        <Collapsible open={moodOpen} onOpenChange={setMoodOpen}>
          <Card>
            <CardContent className="p-4 flex flex-col gap-4">
              <CollapsibleTrigger className="flex items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                  <Sparkles size={16} color="#F59E0B" />
                </View>
                <Text className="block text-sm font-medium text-gray-700">这次感觉怎么样？</Text>
                {mood && !moodOpen && (
                  <Text className="block text-xs text-gray-400">{MOOD_OPTIONS.find(m => m.value === mood)?.emoji} {MOOD_OPTIONS.find(m => m.value === mood)?.label}</Text>
                )}
                {analysisResult?.inferredMood && !mood && !moodOpen && (
                  <Text className="block text-xs text-blue-500">AI: {MOOD_OPTIONS.find(m => m.value === analysisResult.inferredMood)?.label}</Text>
                )}
                <View className="flex-1" />
                <ChevronDown size={16} color="#9CA3AF" className={`transition-transform ${moodOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <View className="flex flex-row flex-wrap gap-2">
                  {MOOD_OPTIONS.map(opt => {
                    const isActive = mood === opt.value
                    const isInferred = analysisResult?.inferredMood === opt.value
                    return (
                      <View
                        key={opt.value}
                        className={`flex flex-col items-center py-2 px-3 rounded-xl border-2 ${
                          isActive ? opt.color : isInferred ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-transparent'
                        }`}
                        style={{ minWidth: '56px' }}
                        onClick={() => setMood(opt.value)}
                      >
                        <Text className="block text-lg mb-1">{opt.emoji}</Text>
                        <Text className={`block text-xs ${isActive ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                          {opt.label}
                        </Text>
                      </View>
                    )
                  })}
                </View>

                {/* 能量预览条 */}
                {(energyPreview || energyLoading) && (
                  <View className="mt-2 flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
                    <Zap size={16} color="#4ECB71" />
                    {energyLoading ? (
                      <Text className="block text-xs text-gray-400">能量计算中...</Text>
                    ) : energyPreview ? (
                      <>
                        <Text className="block text-xs text-emerald-700 font-medium">
                          预计获得 {energyPreview.totalEnergy} 能量
                        </Text>
                        {energyPreview.bonusEnergy > 0 && (
                          <Text className="block text-xs text-green-500">
                            (+{energyPreview.bonusEnergy} 加成)
                          </Text>
                        )}
                      </>
                    ) : null}
                  </View>
                )}
              </CollapsibleContent>
            </CardContent>
          </Card>
        </Collapsible>
      </View>

      {/* 补充信息：时间/时长/发起方/突破性时刻 - 默认折叠 */}
      <View className="px-4 pb-4">
        <Collapsible open={detailOpen} onOpenChange={setDetailOpen}>
          <Card>
            <CardContent className="p-4 flex flex-col gap-5">
              <CollapsibleTrigger className="flex items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Clock size={16} color="#6B7280" />
                </View>
                <Text className="block text-sm font-medium text-gray-700">补充信息</Text>
                <Text className="block text-xs text-gray-400">可选</Text>
                <View className="flex-1" />
                <ChevronDown size={16} color="#9CA3AF" className={`transition-transform ${detailOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
            {/* 互动时间 */}
            <View>
              <View className="flex items-center gap-3 mb-3">
                <View className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Clock size={16} color="#6B7280" />
                </View>
                <Text className="block text-sm font-medium text-gray-700">互动时间</Text>
                <Text className="block text-xs text-gray-400">可选</Text>
              </View>
              <View style={{ marginLeft: '44px' }} className="flex flex-row gap-3">
                <Picker
                  mode="date"
                  value={startedAt ? formatLocalDate(startedAt) : formatLocalDate(new Date())}
                  onChange={e => {
                    const d = new Date(e.detail.value)
                    if (startedAt) d.setHours(startedAt.getHours(), startedAt.getMinutes())
                    setStartedAt(d)
                  }}
                >
                  <View className="px-3 py-2 bg-gray-50 rounded-xl flex items-center gap-1">
                    <Calendar size={14} color="#6B7280" />
                    <Text className="block text-xs text-gray-700">
                      {startedAt ? startedAt.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '选择日期'}
                    </Text>
                  </View>
                </Picker>
                <Picker
                  mode="time"
                  value={startedAt ? formatLocalTime(startedAt) : formatLocalTime(new Date())}
                  onChange={e => {
                    const [h, m] = (e.detail.value as string).split(':').map(Number)
                    const d = startedAt ? new Date(startedAt) : new Date()
                    d.setHours(h, m)
                    setStartedAt(d)
                  }}
                >
                  <View className="px-3 py-2 bg-gray-50 rounded-xl flex items-center gap-1">
                    <Clock size={14} color="#6B7280" />
                    <Text className="block text-xs text-gray-700">
                      {startedAt ? formatLocalTime(startedAt) : '选择时间'}
                    </Text>
                  </View>
                </Picker>
              </View>
            </View>

            {/* 时长 */}
            <View>
              <View className="flex items-center gap-3 mb-3">
                <View className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Clock size={16} color="#6B7280" />
                </View>
                <Text className="block text-sm font-medium text-gray-700">持续时长</Text>
                <Text className="block text-xs text-gray-400">可选</Text>
                {analysisResult?.inferredDurationMinutes && !actualDuration && (
                  <Text className="block text-xs text-blue-500">AI 建议: 约{analysisResult.inferredDurationMinutes}分钟</Text>
                )}
              </View>
              <View style={{ marginLeft: '44px' }} className="flex flex-row flex-wrap gap-2">
                {DURATION_OPTIONS.map(opt => {
                  const isSelected = !showCustomDuration && durationMinutes === opt.value
                  return (
                    <View
                      key={opt.value}
                      className="px-3 py-2 rounded-xl bg-gray-100"
                      style={isSelected ? { backgroundColor: PRIMARY_COLOR } : undefined}
                      onClick={() => {
                        setDurationMinutes(opt.value)
                        setShowCustomDuration(false)
                      }}
                    >
                      <Text className={`block text-xs ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                        {opt.label}
                      </Text>
                    </View>
                  )
                })}
                <View
                  className="px-3 py-2 rounded-xl bg-gray-100"
                  style={showCustomDuration ? { backgroundColor: PRIMARY_COLOR } : undefined}
                  onClick={() => setShowCustomDuration(!showCustomDuration)}
                >
                  <Text className={`block text-xs ${showCustomDuration ? 'text-white' : 'text-gray-600'}`}>
                    自定义
                  </Text>
                </View>
              </View>
              {showCustomDuration && (
                <View className="mt-2" style={{ marginLeft: '44px' }}>
                  <View className="flex flex-row items-center gap-1">
                    <Input
                      className="bg-gray-50 border-gray-200 h-9 w-20"
                      style={{ fontSize: '14px' }}
                      type="number"
                      placeholder="60"
                      value={customDuration}
                      onInput={e => setCustomDuration(e.detail.value)}
                    />
                    <Text className="block text-xs text-gray-500 ml-1">分钟</Text>
                  </View>
                </View>
              )}
            </View>

            {/* 发起方 */}
            <View>
              <View className="flex items-center gap-3 mb-3">
                <View className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={16} color="#6B7280" />
                </View>
                <Text className="block text-sm font-medium text-gray-700">谁发起的</Text>
                <Text className="block text-xs text-gray-400">可选</Text>
              </View>
              <View style={{ marginLeft: '44px' }} className="flex flex-row gap-3">
                {INITIATOR_OPTIONS.map(opt => {
                  const IconComponent = opt.icon
                  const isActive = initiator === opt.value
                  return (
                    <View
                      key={opt.value}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gray-100"
                      style={isActive ? { backgroundColor: PRIMARY_COLOR } : undefined}
                      onClick={() => setInitiator(opt.value)}
                    >
                      <IconComponent size={14} color={isActive ? '#fff' : '#6B7280'} />
                      <Text className={`block text-xs ${isActive ? 'text-white' : 'text-gray-600'}`}>
                        {opt.label}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>

            {/* 突破性时刻 */}
            <View>
              <View className="flex items-center gap-3 mb-3">
                <View className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                  <Sparkles size={16} color="#F59E0B" />
                </View>
                <Text className="block text-sm font-medium text-gray-700">突破性时刻</Text>
                <Text className="block text-xs text-gray-400">可选</Text>
              </View>
              <Textarea
                wrapperClassName="bg-gray-50 border-gray-200"
                wrapperStyle={{ marginLeft: '44px' }}
                style={{ width: '100%', minHeight: '60px', fontSize: '14px' }}
                placeholder="有没有什么特别的进展？"
                value={breakthroughMoment}
                onInput={e => setBreakthroughMoment(e.detail.value)}
              />
            </View>
              </CollapsibleContent>
            </CardContent>
          </Card>
        </Collapsible>
      </View>

      {/* 底部按钮 */}
      <View
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '12px 16px', backgroundColor: '#fff',
          borderTop: '1px solid #f3f4f6', zIndex: 100,
        }}
      >
        <Button
          className="w-full text-white py-3 rounded-xl"
          style={{ backgroundColor: '#3B82F6' }}
          disabled={!chatTextInput.replace(/\[图片解析失败[^\]]*\]/g, '').trim() && chatRecords.length === 0}
          onClick={handleSaveChatOnly}
        >
          <Text className="block text-base font-medium text-white">
            {submitting ? '保存中...' : '保存聊天记录'}
          </Text>
        </Button>
        <Text
          className="block text-xs text-gray-400 mt-2"
          onClick={() => Taro.navigateTo({ url: `/pages/interactions/index?matchId=${matchId}` })}
        >
          查看历史记录 →
        </Text>
      </View>
    </View>
  )

  // ========== 聊天类型路由 ==========
  if (interactionType === 'chat') {
    return renderChatInput()
  }

  // ========== 非聊天类型：原有表单流程 ==========
  // 根据互动类型确定必填项
  const durationIsRequired = ['call', 'video'].includes(interactionType)
  const activityIsRequired = !durationIsRequired

  // 已选活动标签的摘要文字
  const optionalSummary = [
    startedAt ? startedAt.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + formatLocalTime(startedAt) : '',
    !durationIsRequired && durationMinutes ? `${durationMinutes}分钟` : '',
    initiator !== 'mutual' ? INITIATOR_OPTIONS.find(o => o.value === initiator)?.label || '' : '',
    location,
    mood !== 'good' ? MOOD_OPTIONS.find(o => o.value === mood)?.label || '' : '',
  ].filter(Boolean).join(' · ') || '点击补充'

  return (
    <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA', paddingBottom: '120px' }}>
      <CustomHeader
        title={pageTitle}
        onBack={handleBack}
      />

      {/* 互动类型选择 */}
      <InteractionTypeTab value={interactionType} onChange={(t) => { setInteractionType(t as InteractionType) }} />

      {/* 必填项 */}
      <View className="px-4 pt-4">
        {/* 通话/视频：时长 */}
        {durationIsRequired && (
          <View className="mb-4">
            <Text className="block text-xs font-medium text-gray-400 mb-2">通话时长</Text>
            <View className="flex flex-row flex-wrap gap-2">
              {DURATION_OPTIONS.map(opt => {
                const isSelected = !showCustomDuration && durationMinutes === opt.value
                return (
                  <View
                    key={opt.value}
                    className="px-3 py-2 rounded-full"
                    style={{ backgroundColor: isSelected ? currentType.color : '#F3F4F6' }}
                    onClick={() => { setDurationMinutes(opt.value); setShowCustomDuration(false) }}
                  >
                    <Text className={`block text-xs ${isSelected ? 'text-white' : 'text-gray-600'}`}>{opt.label}</Text>
                  </View>
                )
              })}
              <View
                className="px-3 py-2 rounded-full border border-dashed border-gray-300"
                style={showCustomDuration ? { backgroundColor: currentType.color, borderColor: currentType.color } : undefined}
                onClick={() => setShowCustomDuration(!showCustomDuration)}
              >
                <Text className={`block text-xs ${showCustomDuration ? 'text-white' : 'text-gray-400'}`}>自定义</Text>
              </View>
            </View>
            {showCustomDuration && (
              <View className="flex flex-row items-center gap-2 mt-2">
                <View className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                  <Input style={{ fontSize: '14px' }} type="number" placeholder="60" value={customDuration} onInput={e => setCustomDuration(e.detail.value)} />
                </View>
                <Text className="block text-xs text-gray-500">分钟</Text>
              </View>
            )}
          </View>
        )}

        {/* 活动标签 */}
        {activityIsRequired && ACTIVITY_PRESETS[interactionType]?.length > 0 && (
          <View className="mb-4">
            <Text className="block text-xs font-medium text-gray-400 mb-2">
              {interactionType === 'gift' ? '送了什么' : interactionType === 'physical' ? '亲密行为' : '活动内容'}
            </Text>
            <View className="flex flex-row flex-wrap gap-2">
              {ACTIVITY_PRESETS[interactionType].map(tag => {
                const isActive = activities.includes(tag)
                return (
                  <View
                    key={tag}
                    className="px-3 py-2 rounded-full"
                    style={{ backgroundColor: isActive ? currentType.color : '#F3F4F6' }}
                    onClick={() => toggleActivity(tag)}
                  >
                    <Text className={`block text-xs ${isActive ? 'text-white' : 'text-gray-600'}`}>
                      {isActive ? '✓ ' : ''}{tag}
                    </Text>
                  </View>
                )
              })}
              <View
                className="px-3 py-2 rounded-full border border-dashed border-gray-300"
                onClick={() => setShowCustomActivityInput(!showCustomActivityInput)}
              >
                <Text className="block text-xs text-gray-400">+ 自定义</Text>
              </View>
            </View>
            {showCustomActivityInput && (
              <View className="flex flex-row gap-2 mt-2">
                <View className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                  <Input
                    style={{ fontSize: '14px' }}
                    placeholder="输入后回车添加"
                    value={customActivity}
                    onInput={e => setCustomActivity(e.detail.value)}
                    onConfirm={() => {
                      if (customActivity.trim() && !activities.includes(customActivity.trim())) {
                        setActivities([...activities, customActivity.trim()])
                        setCustomActivity('')
                      }
                    }}
                  />
                </View>
                <View
                  className="px-4 py-2 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: currentType.color }}
                  onClick={() => {
                    if (customActivity.trim() && !activities.includes(customActivity.trim())) {
                      setActivities([...activities, customActivity.trim()])
                      setCustomActivity('')
                    }
                  }}
                >
                  <Text className="block text-xs text-white">添加</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* 其他：标题 */}
        {interactionType === 'other' && (
          <View className="mb-4">
            <Text className="block text-xs font-medium text-gray-400 mb-2">互动内容</Text>
            <View className="bg-gray-50 rounded-xl px-3 py-2">
              <Input style={{ fontSize: '14px' }} placeholder="简单描述一下..." value={title} onInput={e => setTitle(e.detail.value)} />
            </View>
          </View>
        )}
      </View>

      {/* 快捷信息行：心情 · 时间 · 发起方 */}
      <View className="px-4 mb-3">
        <View className="flex flex-row items-center gap-2">
          {/* 心情 */}
          <View
            className="flex flex-row items-center gap-1 px-3 py-2 rounded-full"
            style={{ backgroundColor: mood !== 'good' ? '#FEF3C7' : '#F3F4F6' }}
            onClick={() => setMoodOpen(!moodOpen)}
          >
            <Text className="block text-sm">{MOOD_OPTIONS.find(o => o.value === mood)?.emoji}</Text>
            <Text className="block text-xs text-gray-600">{MOOD_OPTIONS.find(o => o.value === mood)?.label}</Text>
          </View>
          {/* 时间 */}
          <Picker
            mode="date"
            value={startedAt ? formatLocalDate(startedAt) : formatLocalDate(new Date())}
            onChange={e => {
              const d = new Date(e.detail.value)
              if (startedAt) d.setHours(startedAt.getHours(), startedAt.getMinutes())
              setStartedAt(d)
            }}
          >
            <View className="flex flex-row items-center gap-1 px-3 py-2 rounded-full bg-gray-100">
              <Calendar size={12} color="#9CA3AF" />
              <Text className="block text-xs text-gray-600">
                {startedAt ? `${startedAt.getMonth() + 1}/${startedAt.getDate()}` : '日期'}
              </Text>
            </View>
          </Picker>
          <Picker
            mode="time"
            value={startedAt ? formatLocalTime(startedAt) : formatLocalTime(new Date())}
            onChange={e => {
              const [h, m] = (e.detail.value as string).split(':').map(Number)
              const d = startedAt ? new Date(startedAt) : new Date()
              d.setHours(h, m)
              setStartedAt(d)
            }}
          >
            <View className="flex flex-row items-center gap-1 px-3 py-2 rounded-full bg-gray-100">
              <Clock size={12} color="#9CA3AF" />
              <Text className="block text-xs text-gray-600">
                {startedAt ? formatLocalTime(startedAt) : '时间'}
              </Text>
            </View>
          </Picker>
          {/* 发起方 */}
          <View
            className="flex flex-row items-center gap-1 px-3 py-2 rounded-full bg-gray-100"
            onClick={() => {
              const next = initiator === 'mutual' ? 'self' : initiator === 'self' ? 'partner' : 'mutual'
              setInitiator(next)
            }}
          >
            <User size={12} color="#9CA3AF" />
            <Text className="block text-xs text-gray-600">
              {INITIATOR_OPTIONS.find(o => o.value === initiator)?.label || '共同'}
            </Text>
          </View>
        </View>

        {/* 心情展开 */}
        {moodOpen && (
          <View className="flex flex-row flex-wrap gap-2 mt-2 p-3 bg-white rounded-xl">
            {MOOD_OPTIONS.map(opt => {
              const isActive = mood === opt.value
              return (
                <View
                  key={opt.value}
                  className={`flex flex-col items-center py-2 px-3 rounded-xl ${isActive ? 'ring-2 ring-emerald-300' : ''}`}
                  style={{ backgroundColor: isActive ? '#ECFDF5' : '#F9FAFB' }}
                  onClick={() => { setMood(opt.value); setMoodOpen(false) }}
                >
                  <Text className="block text-lg">{opt.emoji}</Text>
                  <Text className="block text-xs text-gray-500">{opt.label}</Text>
                </View>
              )
            })}
          </View>
        )}
      </View>

      {/* 更多细节（默认折叠） */}
      <View className="px-4 pb-4">
        <Collapsible open={optionalOpen} onOpenChange={setOptionalOpen}>
          <View
            className="flex flex-row items-center justify-between px-3 py-3 bg-white rounded-xl"
            onClick={() => setOptionalOpen(!optionalOpen)}
          >
            <Text className="block text-xs text-gray-400">更多细节</Text>
            <View className="flex flex-row items-center gap-1">
              <Text className="block text-xs text-gray-300">{optionalOpen ? '收起' : optionalSummary}</Text>
              <ChevronDown size={14} color="#D1D5DB" className={optionalOpen ? 'rotate-180' : ''} />
            </View>
          </View>
          {optionalOpen && (
            <View className="mt-2 p-4 bg-white rounded-xl flex flex-col gap-4">
              {/* 地点 */}
              {(interactionType === 'date' || interactionType === 'social') && (
                <View>
                  <Text className="block text-xs font-medium text-gray-400 mb-2">地点</Text>
                  <View className="bg-gray-50 rounded-xl px-3 py-2">
                    <Input style={{ fontSize: '14px' }} placeholder="在哪里呢..." value={location} onInput={e => setLocation(e.detail.value)} />
                  </View>
                </View>
              )}
              {/* 时长（非通话/视频） */}
              {!durationIsRequired && (
                <View>
                  <Text className="block text-xs font-medium text-gray-400 mb-2">持续时长</Text>
                  <View className="flex flex-row flex-wrap gap-2">
                    {DURATION_OPTIONS.map(opt => {
                      const isSelected = !showCustomDuration && durationMinutes === opt.value
                      return (
                        <View
                          key={opt.value}
                          className="px-3 py-2 rounded-full"
                          style={{ backgroundColor: isSelected ? currentType.color : '#F3F4F6' }}
                          onClick={() => { setDurationMinutes(opt.value); setShowCustomDuration(false) }}
                        >
                          <Text className={`block text-xs ${isSelected ? 'text-white' : 'text-gray-600'}`}>{opt.label}</Text>
                        </View>
                      )
                    })}
                    <View
                      className="px-3 py-2 rounded-full border border-dashed border-gray-300"
                      style={showCustomDuration ? { backgroundColor: currentType.color, borderColor: currentType.color } : undefined}
                      onClick={() => setShowCustomDuration(!showCustomDuration)}
                    >
                      <Text className={`block text-xs ${showCustomDuration ? 'text-white' : 'text-gray-400'}`}>自定义</Text>
                    </View>
                  </View>
                  {showCustomDuration && (
                    <View className="flex flex-row items-center gap-2 mt-2">
                      <View className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                        <Input style={{ fontSize: '14px' }} type="number" placeholder="60" value={customDuration} onInput={e => setCustomDuration(e.detail.value)} />
                      </View>
                      <Text className="block text-xs text-gray-500">分钟</Text>
                    </View>
                  )}
                </View>
              )}
              {/* 主题/标题 */}
              {interactionType !== 'other' && (
                <View>
                  <Text className="block text-xs font-medium text-gray-400 mb-2">
                    {interactionType === 'date' ? '约会主题' : '互动内容'}
                  </Text>
                  <View className="bg-gray-50 rounded-xl px-3 py-2">
                    <Input style={{ fontSize: '14px' }} placeholder={interactionType === 'date' ? '给这次约会起个名字...' : '简单描述一下...'} value={title} onInput={e => setTitle(e.detail.value)} />
                  </View>
                </View>
              )}
              {/* 详细记录 */}
              <View>
                <Text className="block text-xs font-medium text-gray-400 mb-2">详细记录</Text>
                <Textarea
                  wrapperClassName="bg-gray-50 border-gray-200"
                  style={{ width: '100%', fontSize: '14px', minHeight: '5rem' }}
                  placeholder="记录细节、感受、有趣的对话..."
                  value={description}
                  onInput={e => setDescription(e.detail.value)}
                />
              </View>
              {/* 突破性时刻 */}
              <View>
                <Text className="block text-xs font-medium text-gray-400 mb-2">突破性时刻</Text>
                <Textarea
                  wrapperClassName="bg-amber-50 border-amber-200"
                  style={{ width: '100%', fontSize: '14px', minHeight: '3.5rem' }}
                  placeholder="第一次牵手、第一次说喜欢..."
                  value={breakthroughMoment}
                  onInput={e => setBreakthroughMoment(e.detail.value)}
                />
              </View>
              {/* 遇到的问题 */}
              <View>
                <Text className="block text-xs font-medium text-gray-400 mb-2">遇到的问题</Text>
                <Textarea
                  wrapperClassName="bg-gray-50 border-gray-200"
                  style={{ width: '100%', fontSize: '14px', minHeight: '3.5rem' }}
                  placeholder="冷场了、说错话了..."
                  value={issuesEncountered}
                  onInput={e => setIssuesEncountered(e.detail.value)}
                />
              </View>
              {/* 能量预览 */}
              {energyPreview && (
                <View className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
                  <Zap size={14} color="#4ECB71" />
                  <Text className="block text-xs text-emerald-700 font-medium">
                    预计 +{energyPreview.totalEnergy} 能量
                  </Text>
                  {energyPreview.bonusEnergy > 0 && (
                    <Text className="block text-xs text-green-500">(+{energyPreview.bonusEnergy} 加成)</Text>
                  )}
                </View>
              )}
            </View>
          )}
        </Collapsible>
      </View>

      {/* 底部提交按钮 */}
      <View
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '12px 16px', backgroundColor: '#fff',
          borderTop: '1px solid #f3f4f6', zIndex: 100,
        }}
      >
        <Button
          className="w-full text-white py-3 rounded-xl"
          style={{ backgroundColor: currentType.color }}
          onClick={handleSubmit}
          disabled={submitting || hasUploadingRecords || (activityIsRequired && activities.length === 0 && interactionType !== 'other') || (durationIsRequired && !durationMinutes && !customDuration)}
        >
          <Text className="block text-base font-medium text-white">
            {submitting ? '保存中...' : '保存记录'}
          </Text>
        </Button>
        <Text
          className="block text-xs text-gray-400 mt-2"
          onClick={() => Taro.navigateTo({ url: `/pages/interactions/index?matchId=${matchId}` })}
        >
          查看历史记录 →
        </Text>
      </View>
    </View>
  )
}
