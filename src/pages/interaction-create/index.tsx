import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import CustomHeader from '@/components/custom-header'
import {
  Calendar, MessageCircle, Phone, Video, Gift, Heart, Users, MapPin,
  Clock, User, Sparkles, Check, Zap, Plus, Upload, Image, Paperclip, X,
  LoaderCircle, FileText
} from 'lucide-react-taro'

// 互动类型
type InteractionType = 'date' | 'chat' | 'call' | 'video' | 'gift' | 'physical' | 'social' | 'other'
type Mood = 'excellent' | 'good' | 'neutral' | 'awkward' | 'bad'
type Initiator = 'self' | 'partner' | 'mutual'
type InteractionCategory = 'online' | 'offline' | 'hybrid'

// 聊天录入：单页面模式（不再分步骤）

// 聊天记录来源选项
const CHAT_SOURCE_OPTIONS = [
  { value: 'wechat', label: '微信' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'tinder', label: 'Tinder' },
  { value: 'manual', label: '手动输入' },
  { value: 'other', label: '其他' },
]

// 互动类型配置
const INTERACTION_TYPES: Array<{
  type: InteractionType
  label: string
  icon: typeof Calendar
  color: string
  bgColor: string
  category: InteractionCategory
}> = [
  { type: 'date', label: '约会', icon: Calendar, color: '#EC4899', bgColor: 'bg-pink-50', category: 'offline' },
  { type: 'chat', label: '聊天', icon: MessageCircle, color: '#3B82F6', bgColor: 'bg-blue-50', category: 'online' },
  { type: 'call', label: '通话', icon: Phone, color: '#10B981', bgColor: 'bg-green-50', category: 'online' },
  { type: 'video', label: '视频', icon: Video, color: '#8B5CF6', bgColor: 'bg-violet-50', category: 'online' },

  { type: 'gift', label: '礼物', icon: Gift, color: '#EF4444', bgColor: 'bg-red-50', category: 'offline' },
  { type: 'physical', label: '亲密', icon: Heart, color: '#EC4899', bgColor: 'bg-rose-50', category: 'offline' },
  { type: 'social', label: '社交', icon: Users, color: '#06B6D4', bgColor: 'bg-cyan-50', category: 'offline' },
]

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
    '朋友聚会', '双人约会', '家庭见面',
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

  // 对方名称
  const [matchName, setMatchName] = useState('')

  // 活动标签
  const [activities, setActivities] = useState<string[]>([])
  const [customActivity, setCustomActivity] = useState('')
  const [showCustomActivityInput, setShowCustomActivityInput] = useState(false)

  // 聊天记录相关状态
  const [chatRecords, setChatRecords] = useState<ChatRecordCard[]>([])
  const [chatTextInput, setChatTextInput] = useState('')
  const [chatSource, setChatSource] = useState('wechat')
  const [showChatInput, setShowChatInput] = useState(false)
  const [chatUploading, setChatUploading] = useState(false)

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
  const showChatUpload = ['call', 'video'].includes(interactionType)

  // 表单是否已填写内容（用于返回确认）
  const hasContent = !!(
    title || description || location || breakthroughMoment || issuesEncountered
    || activities.length > 0 || chatRecords.length > 0
    || durationMinutes !== null || customDuration || startedAt !== null
    || (interactionType === 'chat' && (chatTextInput.trim().length > 0 || chatRecords.length > 0))
  )

  // 是否有上传中的聊天记录
  const hasUploadingRecords = chatRecords.some(r => r.uploading)

  // 初始化：从路由参数读取 type
  useEffect(() => {
    const type = router.params.type as InteractionType
    if (type && INTERACTION_TYPES.some(t => t.type === type)) {
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
  const currentType = INTERACTION_TYPES.find(t => t.type === interactionType) || INTERACTION_TYPES[0]
  const TypeIcon = currentType.icon

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
    setShowChatInput(false)
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
    console.log('handleAnalyzeChat triggered, chatTextInput:', chatTextInput?.slice(0, 50), 'matchId:', matchId)
    // 过滤掉 OCR 解析失败的提示文字
    const cleanContent = chatTextInput.replace(/\[图片解析失败[^\]]*\]/g, '').trim()
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
  }, [matchId, chatTextInput, chatSource])

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

  // ========== 聊天记录相关操作（非 chat 类型用） ==========

  // 上传聊天文本
  const handleUploadChatText = useCallback(async () => {
    if (!chatTextInput.trim()) {
      Taro.showToast({ title: '请输入聊天内容', icon: 'none' })
      return
    }
    setChatUploading(true)
    try {
      const res = await Network.request({
        url: `/api/chat-record/match/${matchId}/text`,
        method: 'POST',
        data: {
          contentType: 'text',
          rawContent: chatTextInput,
          source: chatSource,
        },
      })
      console.log('Upload chat text response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setChatRecords(prev => [...prev, {
          id: res.data.data.id,
          contentType: 'text',
          rawContent: chatTextInput.replace(/\[图片解析失败[^\]]*\]/g, '').trim(),
          source: chatSource,
          summary: res.data.data.summary,
          imageKey: null,
          uploading: false,
        }])
        setChatTextInput('')
        setShowChatInput(false)
        Taro.showToast({ title: '聊天记录已添加', icon: 'success' })
      } else {
        Taro.showToast({ title: res.data?.message || '添加失败', icon: 'none' })
      }
    } catch (error) {
      console.error('Upload chat text error:', error)
      Taro.showToast({ title: '添加失败', icon: 'error' })
    } finally {
      setChatUploading(false)
    }
  }, [matchId, chatTextInput, chatSource])

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
    <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA', paddingBottom: '100px' }}>
      <CustomHeader title="记录聊天" onBack={handleBack} />

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
      <View className="px-4 pb-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-5">
            <View className="flex items-center gap-3 mb-3">
              <View className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <Image size={16} color="#8B5CF6" />
              </View>
              <Text className="block text-sm font-medium text-gray-700">上传聊天截图</Text>
            </View>
            <View
              className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50"
              onClick={handleUploadChatImage}
            >
              <Upload size={18} color="#9CA3AF" />
              <Text className="block text-xs text-gray-500">选择截图</Text>
            </View>
            {/* 已上传的截图列表 */}
            {chatRecords.length > 0 && (
              <View className="mt-3">
                {chatRecords.map(record => (
                  <View
                    key={record.id}
                    className="flex items-center gap-3 p-3 rounded-xl mb-2 bg-gray-50"
                  >
                    <Image size={16} color="#8B5CF6" />
                    <View className="flex-1" style={{ flex: 1, minWidth: 0 }}>
                      {record.uploading ? (
                        <Text className="block text-xs text-gray-400">上传中...</Text>
                      ) : (
                        <Text className="block text-xs text-gray-700">聊天截图</Text>
                      )}
                    </View>
                    {!record.uploading && (
                      <View onClick={() => handleDeleteChatRecord(record.id)} className="p-1">
                        <X size={14} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 粘贴聊天记录（有截图时为可选） */}
      <View className="px-4 pb-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-5">
            <View className="flex items-center gap-3 mb-3">
              <View className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <MessageCircle size={16} color="#3B82F6" />
              </View>
              <Text className="block text-sm font-medium text-gray-700">粘贴聊天记录</Text>
              {chatRecords.length > 0 && (
                <Text className="block text-xs text-gray-400">可选，粘贴后可 AI 智能分析</Text>
              )}
            </View>
            <View className="bg-gray-50 rounded-xl p-3">
              <Textarea
                style={{ width: '100%', minHeight: '200px', fontSize: '13px', backgroundColor: 'transparent' }}
                placeholder="把聊天记录粘贴到这里...&#10;&#10;格式示例：&#10;我: 你今天怎么样？&#10;她: 还不错呀，刚下班~&#10;我: 辛苦啦，要不要一起吃饭？&#10;她: 好呀好呀！"
                value={chatTextInput}
                onInput={e => setChatTextInput(e.detail.value)}
                maxlength={5000}
              />
            </View>
            <View className="flex items-center justify-between mt-2">
              <Text className="block text-xs text-gray-400">{chatTextInput.length}/5000 字</Text>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* AI 分析结果（分析完成后直接展示） */}
      {analysisResult && (
        <View className="px-4 pb-4">
          <Card style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)' }}>
            <CardContent className="p-4 flex flex-col gap-4">
              <View className="flex items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Sparkles size={16} color="#3B82F6" />
                </View>
                <Text className="block text-sm font-semibold text-gray-800">AI 分析结果</Text>
                <Text className="block text-xs text-blue-500 ml-auto" onClick={handleReAnalyze}>重新分析</Text>
              </View>

              {/* 摘要 */}
              {analysisResult.summary && (
                <View className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
                  <Text className="block text-xs text-gray-500 mb-1">对话摘要</Text>
                  <Text className="block text-sm text-gray-800">{analysisResult.summary}</Text>
                </View>
              )}

              {/* 话题标签 */}
              {analysisResult.keyTopics?.length > 0 && (
                <View>
                  <Text className="block text-xs text-gray-500 mb-2">识别到的话题</Text>
                  <View className="flex flex-row flex-wrap gap-2">
                    {analysisResult.keyTopics.map(topic => {
                      const isSelected = activities.includes(topic)
                      return (
                        <View
                          key={topic}
                          className="px-3 py-1 rounded-full bg-gray-200"
                          style={isSelected ? { backgroundColor: PRIMARY_COLOR } : undefined}
                          onClick={() => toggleActivity(topic)}
                        >
                          <Text className={`block text-xs ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                            {topic}
                          </Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              )}

              {/* 情感倾向 */}
              {analysisResult.sentiment && (
                <View>
                  <Text className="block text-xs text-gray-500 mb-1">情感倾向</Text>
                  <Text className="block text-sm text-gray-800">{analysisResult.sentiment}</Text>
                </View>
              )}

              {/* 兴趣信号 */}
              {analysisResult.interestSignals?.length > 0 && (
                <View>
                  <Text className="block text-xs text-gray-500 mb-2">兴趣信号</Text>
                  <View className="flex flex-row flex-wrap gap-2">
                    {analysisResult.interestSignals.map((signal, idx) => (
                      <View key={idx} className="px-3 py-1 rounded-full bg-amber-100">
                        <Text className="block text-xs text-amber-700">{signal}</Text>
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
            </CardContent>
          </Card>
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

      {/* 心情选择 */}
      <View className="px-4 pb-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-4">
            <View className="flex items-center gap-3">
              <View className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                <Sparkles size={16} color="#F59E0B" />
              </View>
              <Text className="block text-sm font-medium text-gray-700">这次感觉怎么样？</Text>
              {analysisResult?.inferredMood && (
                <Text className="block text-xs text-blue-500">AI 推断: {MOOD_OPTIONS.find(m => m.value === analysisResult.inferredMood)?.label}</Text>
              )}
            </View>
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
          </CardContent>
        </Card>
      </View>

      {/* 补充信息：时间/时长/发起方/突破性时刻 */}
      <View className="px-4 pb-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-5">
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
                  <View className="px-3 py-2 bg-gray-50 rounded-lg flex items-center gap-1">
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
                  <View className="px-3 py-2 bg-gray-50 rounded-lg flex items-center gap-1">
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
                      className="px-3 py-2 rounded-lg bg-gray-100"
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
                  className="px-3 py-2 rounded-lg bg-gray-100"
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
                  <View className="bg-gray-50 rounded-lg px-3 py-2" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <Input
                      style={{ width: '60px', fontSize: '14px', backgroundColor: 'transparent' }}
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
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100"
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
              <View style={{ marginLeft: '44px' }} className="bg-gray-50 rounded-xl p-3">
                <Textarea
                  style={{ width: '100%', minHeight: '60px', fontSize: '14px', backgroundColor: 'transparent' }}
                  placeholder="有没有什么特别的进展？"
                  value={breakthroughMoment}
                  onInput={e => setBreakthroughMoment(e.detail.value)}
                />
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部：双操作按钮 */}
      <View
        style={{
          position: 'fixed', bottom: 50, left: 0, right: 0,
          display: 'flex', flexDirection: 'row', gap: '12px',
          padding: '12px 16px', backgroundColor: '#fff',
          borderTop: '1px solid #f3f4f6', zIndex: 100,
        }}
      >
        {/* 保存聊天记录 */}
        <View style={{ flex: 1 }}>
          <Button
            className="w-full py-3 rounded-xl"
            style={{ backgroundColor: '#F3F4F6' }}
            disabled={!chatTextInput.replace(/\[图片解析失败[^\]]*\]/g, '').trim() && chatRecords.length === 0}
            onClick={handleSaveChatOnly}
          >
            <Text className="block text-base font-medium text-gray-700">保存聊天记录</Text>
          </Button>
        </View>
        {/* AI 分析 */}
        <View style={{ flex: 1 }}>
          <Button
            className="w-full text-white py-3 rounded-xl"
            style={{ backgroundColor: '#3B82F6' }}
            disabled={!chatTextInput.replace(/\[图片解析失败[^\]]*\]/g, '').trim() || analyzing}
            onClick={handleAnalyzeChat}
          >
            <View className="flex items-center justify-center gap-2">
              <Sparkles size={16} color="#fff" />
              <Text className="block text-base font-medium text-white">
                {analyzing ? '分析中...' : 'AI分析'}
              </Text>
            </View>
          </Button>
        </View>
      </View>
    </View>
  )

  // ========== 聊天类型路由 ==========
  if (interactionType === 'chat') {
    return renderChatInput()
  }

  // ========== 非聊天类型：原有表单流程 ==========
  return (
    <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA', paddingBottom: '100px' }}>
      <CustomHeader
        title={pageTitle}
        onBack={handleBack}
      />

      {/* 互动类型选择 - ScrollView 横向滚动 */}
      <View className="bg-white px-4 py-4 border-b">
        <ScrollView scrollX className="flex flex-row gap-3" style={{ whiteSpace: 'nowrap' }}>
          {INTERACTION_TYPES.map(item => {
            const IconComponent = item.icon
            const isActive = interactionType === item.type
            return (
              <View
                key={item.type}
                className={`flex-shrink-0 flex flex-col items-center justify-center px-4 py-3 rounded-xl border-2 ${
                  isActive
                    ? `${item.bgColor} border-current`
                    : 'bg-gray-50'
                }`}
                style={{ borderColor: isActive ? item.color : undefined, minWidth: '72px', display: 'inline-flex', verticalAlign: 'top' }}
                onClick={() => setInteractionType(item.type)}
              >
                <View className="mb-1">
                  <IconComponent size={20} color={isActive ? item.color : '#9CA3AF'} />
                </View>
                <Text
                  className="block text-xs font-medium"
                  style={{ color: isActive ? item.color : '#6B7280' }}
                >
                  {item.label}
                </Text>
              </View>
            )
          })}
        </ScrollView>
      </View>

      {/* 主要信息卡片 */}
      <View className="p-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-5">
            {/* 时间选择 */}
            <View>
              <View className="flex items-center gap-4 mb-2">
                <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Clock size={18} color="#6B7280" />
                </View>
                <Text className="block text-sm font-medium text-gray-700">互动时间</Text>
              </View>
              <View className="flex flex-row gap-3" style={{ marginLeft: '52px' }}>
                <Picker
                  mode="date"
                  value={startedAt ? formatLocalDate(startedAt) : formatLocalDate(new Date())}
                  onChange={e => {
                    const d = new Date(e.detail.value)
                    if (startedAt) d.setHours(startedAt.getHours(), startedAt.getMinutes())
                    setStartedAt(d)
                  }}
                >
                  <View className="px-3 py-2 bg-gray-50 rounded-lg flex items-center gap-1">
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
                  <View className="px-3 py-2 bg-gray-50 rounded-lg flex items-center gap-1">
                    <Clock size={14} color="#6B7280" />
                    <Text className="block text-xs text-gray-700">
                      {startedAt ? formatLocalTime(startedAt) : '选择时间'}
                    </Text>
                  </View>
                </Picker>
              </View>
            </View>

            {/* 时长选择 */}
            <View>
              <View className="flex items-center gap-4 mb-4">
                <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Calendar size={18} color="#6B7280" />
                </View>
                <Text className="block text-sm font-medium text-gray-700">持续时长</Text>
              </View>
              <View className="flex flex-row flex-wrap gap-3" style={{ marginLeft: '52px' }}>
                {DURATION_OPTIONS.map(opt => {
                  const isSelected = !showCustomDuration && durationMinutes === opt.value
                  return (
                    <View
                      key={opt.value}
                      className="px-3 py-2 rounded-lg bg-gray-100"
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
                {/* 自定义时长 */}
                <View
                  className="px-3 py-2 rounded-lg bg-gray-100"
                  style={showCustomDuration ? { backgroundColor: PRIMARY_COLOR } : undefined}
                  onClick={() => setShowCustomDuration(!showCustomDuration)}
                >
                  <Text className={`block text-xs ${showCustomDuration ? 'text-white' : 'text-gray-600'}`}>
                    自定义
                  </Text>
                </View>
              </View>
              {showCustomDuration && (
                <View className="mt-2" style={{ marginLeft: '52px' }}>
                  <View className="bg-gray-50 rounded-lg px-3 py-2" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <Input
                      style={{ width: '60px', fontSize: '14px', backgroundColor: 'transparent' }}
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

            {/* 发起方选择 */}
            <View>
              <View className="flex items-center gap-4 mb-4">
                <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={18} color="#6B7280" />
                </View>
                <Text className="block text-sm font-medium text-gray-700">谁发起的</Text>
              </View>
              <View className="flex flex-row gap-3" style={{ marginLeft: '52px' }}>
                {INITIATOR_OPTIONS.map(opt => {
                  const IconComponent = opt.icon
                  const isActive = initiator === opt.value
                  return (
                    <View
                      key={opt.value}
                      className="flex-1 flex items-center justify-center gap-3 px-3 py-2 rounded-lg bg-gray-100"
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

            {/* 地点（约会/社交时显示） */}
            {(interactionType === 'date' || interactionType === 'social') && (
              <View>
                <View className="flex items-center gap-4 mb-4">
                  <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <MapPin size={18} color="#6B7280" />
                  </View>
                  <Text className="block text-sm font-medium text-gray-700">地点</Text>
                </View>
                <View style={{ marginLeft: '52px' }}>
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Input
                      style={{ width: '100%', fontSize: '14px', backgroundColor: 'transparent' }}
                      placeholder="在哪里呢..."
                      value={location}
                      onInput={e => setLocation(e.detail.value)}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* 活动标签 */}
            {ACTIVITY_PRESETS[interactionType]?.length > 0 && (
              <View>
                <View className="flex items-center gap-4 mb-4">
                  <View
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${currentType.color}15` }}
                  >
                    <Plus size={18} color={currentType.color} />
                  </View>
                  <Text className="block text-sm font-medium text-gray-700">活动内容</Text>
                </View>
                <View className="flex flex-row flex-wrap gap-3" style={{ marginLeft: '52px' }}>
                  {ACTIVITY_PRESETS[interactionType].map(tag => {
                    const isActive = activities.includes(tag)
                    return (
                      <View
                        key={tag}
                        className="px-3 py-2 rounded-full bg-gray-100"
                        style={isActive ? { backgroundColor: PRIMARY_COLOR } : undefined}
                        onClick={() => toggleActivity(tag)}
                      >
                        <Text className={`block text-xs ${isActive ? 'text-white' : 'text-gray-600'}`}>
                          {isActive ? '✓ ' : ''}{tag}
                        </Text>
                      </View>
                    )
                  })}
                  {/* 自定义标签按钮 */}
                  <View
                    className="px-3 py-2 rounded-full border border-dashed border-gray-300 bg-gray-50"
                    onClick={() => setShowCustomActivityInput(!showCustomActivityInput)}
                  >
                    <Text className="block text-xs text-gray-400">+ 自定义</Text>
                  </View>
                </View>
                {/* 自定义标签输入框 */}
                {showCustomActivityInput && (
                  <View style={{ marginLeft: '52px', marginTop: '8px' }} className="flex flex-row gap-3">
                    <View className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                      <Input
                        style={{ width: '100%', fontSize: '14px', backgroundColor: 'transparent' }}
                        placeholder="输入后按回车或点添加"
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
                      className="px-4 py-2 rounded-lg"
                      style={{ backgroundColor: PRIMARY_COLOR }}
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

            {/* 标题/主题 */}
            <View>
              <View className="flex items-center gap-4 mb-4">
                <View
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${currentType.color}15` }}
                >
                  <TypeIcon size={18} color={currentType.color} />
                </View>
                <Text className="block text-sm font-medium text-gray-700">
                  {interactionType === 'date' ? '约会主题' : '互动内容'}
                </Text>
              </View>
              <View style={{ marginLeft: '52px' }}>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    style={{ width: '100%', fontSize: '14px', backgroundColor: 'transparent' }}
                    placeholder={interactionType === 'date' ? '给这次约会起个名字...' : '简单描述一下...'}
                    value={title}
                    onInput={e => setTitle(e.detail.value)}
                  />
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 聊天记录上传区域（仅消息/通话/视频类型时展示） */}
      {showChatUpload && (
        <View className="px-4 pb-4">
          <Card style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)' }}>
            <CardContent className="p-4 flex flex-col gap-5">
              <View className="flex items-center gap-4 mb-4">
                <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Paperclip size={18} color="#3B82F6" />
                </View>
                <Text className="block text-sm font-medium text-gray-700">聊天记录</Text>
                <Text className="block text-xs text-gray-400">可选</Text>
              </View>

              {/* 已上传的聊天记录列表 */}
              {chatRecords.length > 0 && (
                <View className="mb-4" style={{ marginLeft: '52px' }}>
                  {chatRecords.map(record => (
                    <View
                      key={record.id}
                      className="flex items-center gap-3 p-3 rounded-xl mb-2"
                      style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                    >
                      {record.contentType === 'image' ? (
                        <Image size={16} color="#3B82F6" />
                      ) : (
                        <MessageCircle size={16} color="#3B82F6" />
                      )}
                      <View className="flex-1" style={{ flex: 1, minWidth: 0 }}>
                        {record.uploading ? (
                          <Text className="block text-xs text-gray-400">上传中...</Text>
                        ) : (
                          <>
                            <Text className="block text-xs text-gray-700 font-medium">
                              {record.contentType === 'image' ? '聊天截图' : '聊天文本'}
                              <Text className="text-gray-400 font-normal"> · {CHAT_SOURCE_OPTIONS.find(s => s.value === record.source)?.label || record.source}</Text>
                            </Text>
                            {record.summary ? (
                              <Text className="block text-xs text-gray-400 mt-1">
                                {record.summary.length > 40 ? record.summary.slice(0, 40) + '...' : record.summary}
                              </Text>
                            ) : record.rawContent ? (
                              <Text className="block text-xs text-gray-400 mt-1">
                                {record.rawContent.slice(0, 40)}...
                              </Text>
                            ) : null}
                          </>
                        )}
                      </View>
                      {!record.uploading && (
                        <View onClick={() => handleDeleteChatRecord(record.id)} className="p-1">
                          <X size={14} color="#9CA3AF" />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* 来源选择 */}
              <View className="mb-4" style={{ marginLeft: '52px' }}>
                <Text className="block text-xs text-gray-500 mb-2">聊天来源</Text>
                <View className="flex flex-row flex-wrap gap-2">
                  {CHAT_SOURCE_OPTIONS.map(opt => (
                    <View
                      key={opt.value}
                      className={`px-3 py-2 rounded-lg ${chatSource === opt.value ? 'bg-blue-500' : 'bg-gray-100'}`}
                      onClick={() => setChatSource(opt.value)}
                    >
                      <Text className={`block text-xs ${chatSource === opt.value ? 'text-white' : 'text-gray-600'}`}>
                        {opt.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 操作按钮 */}
              <View style={{ marginLeft: '52px' }}>
                <View className="flex flex-row gap-3">
                  <View
                    className="flex-1 flex items-center justify-center gap-3 py-3 rounded-xl bg-white border border-blue-200"
                    onClick={() => setShowChatInput(!showChatInput)}
                  >
                    <MessageCircle size={14} color="#3B82F6" />
                    <Text className="block text-xs text-blue-600 font-medium">粘贴文字</Text>
                  </View>
                  <View
                    className="flex-1 flex items-center justify-center gap-3 py-3 rounded-xl bg-white border border-blue-200"
                    onClick={handleUploadChatImage}
                  >
                    <Upload size={14} color="#3B82F6" />
                    <Text className="block text-xs text-blue-600 font-medium">上传截图</Text>
                  </View>
                </View>
              </View>

              {/* 文本输入区域 */}
              {showChatInput && (
                <View className="mt-3" style={{ marginLeft: '52px' }}>
                  <View className="bg-white rounded-xl p-3 border border-blue-100">
                    <Textarea
                      style={{ width: '100%', minHeight: '120px', fontSize: '13px', backgroundColor: 'transparent' }}
                      placeholder="粘贴聊天记录，格式示例：&#10;我: 你今天怎么样？&#10;她: 还不错呀，刚下班~"
                      value={chatTextInput}
                      onInput={e => setChatTextInput(e.detail.value)}
                      maxlength={5000}
                    />
                    <View className="flex items-center justify-between mt-2">
                      <Text className="block text-xs text-gray-400">{chatTextInput.length}/5000 字</Text>
                      <Button
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                        onClick={handleUploadChatText}
                        disabled={chatUploading || !chatTextInput.trim()}
                      >
                        <Text className="block text-xs text-white font-medium">
                          {chatUploading ? '添加中...' : '添加'}
                        </Text>
                      </Button>
                    </View>
                  </View>
                </View>
              )}
            </CardContent>
          </Card>
        </View>
      )}

      {/* 心情评价 + 能量预览 */}
      <View className="px-4 pb-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-5">
            <View className="flex items-center gap-4 mb-4">
              <View className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Sparkles size={18} color="#F59E0B" />
              </View>
              <Text className="block text-sm font-medium text-gray-700">这次感觉怎么样？</Text>
            </View>

            <View className="flex flex-row flex-wrap gap-2">
              {MOOD_OPTIONS.map(opt => {
                const isActive = mood === opt.value
                return (
                  <View
                    key={opt.value}
                    className={`flex flex-col items-center py-2 px-3 rounded-xl border-2 ${
                      isActive ? opt.color : 'bg-gray-50 border-transparent'
                    }`}
                    style={{ minWidth: '56px' }}
                    onClick={() => setMood(opt.value)}
                  >
                    {isActive && (
                      <View style={{ position: 'absolute', top: '2px', right: '2px' }}>
                        <Check size={10} color="#4ECB71" />
                      </View>
                    )}
                    <Text className="block text-lg mb-1">{opt.emoji}</Text>
                    <Text className={`block text-xs ${isActive ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                      {opt.label}
                    </Text>
                  </View>
                )
              })}
            </View>

            {/* 能量预览条 */}
            {energyPreview && (
              <View className="mt-4 flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
                <Zap size={16} color="#4ECB71" />
                <Text className="block text-xs text-emerald-700 font-medium">
                  预计获得 {energyPreview.totalEnergy} 能量
                </Text>
                {energyPreview.bonusEnergy > 0 && (
                  <Text className="block text-xs text-green-500">
                    (+{energyPreview.bonusEnergy} 加成)
                  </Text>
                )}
                {energyLoading && (
                  <Text className="block text-xs text-gray-400">计算中...</Text>
                )}
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 详细描述 */}
      <View className="px-4 pb-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-5">
            <View className="flex items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText size={18} color="#6B7280" />
              </View>
              <Text className="block text-sm font-medium text-gray-700">详细记录</Text>
            </View>
            <View className="bg-gray-50 rounded-xl p-3">
              <Textarea
                style={{ width: '100%', minHeight: '80px', fontSize: '14px', backgroundColor: 'transparent' }}
                placeholder="记录这次互动的细节、感受、有趣的对话..."
                value={description}
                onInput={e => setDescription(e.detail.value)}
              />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 突破性时刻 */}
      <View className="px-4 pb-4">
        <Card style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FFF7ED 100%)' }}>
          <CardContent className="p-4 flex flex-col gap-5">
            <View className="flex items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Sparkles size={18} color="#F59E0B" />
              </View>
              <Text className="block text-sm font-medium text-gray-700">突破性时刻</Text>
            </View>
            <View className="bg-white rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}>
              <Textarea
                style={{ width: '100%', minHeight: '60px', fontSize: '14px', backgroundColor: 'transparent' }}
                placeholder="有没有什么特别的进展？比如第一次牵手、第一次说喜欢..."
                value={breakthroughMoment}
                onInput={e => setBreakthroughMoment(e.detail.value)}
              />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 遇到的问题 */}
      <View className="px-4 pb-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-5">
            <View className="flex items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText size={18} color="#6B7280" />
              </View>
              <Text className="block text-sm font-medium text-gray-700">遇到的问题</Text>
              <Text className="block text-xs text-gray-400">可选</Text>
            </View>
            <View className="bg-gray-50 rounded-xl p-3">
              <Textarea
                style={{ width: '100%', minHeight: '60px', fontSize: '14px', backgroundColor: 'transparent' }}
                placeholder="有没有什么尴尬、误会或问题？比如冷场了、说错话了..."
                value={issuesEncountered}
                onInput={e => setIssuesEncountered(e.detail.value)}
              />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部提交按钮 */}
      <View
        style={{
          position: 'fixed', bottom: 50, left: 0, right: 0,
          display: 'flex', flexDirection: 'row', gap: '12px',
          padding: '12px 16px', backgroundColor: '#fff',
          borderTop: '1px solid #f3f4f6', zIndex: 100,
        }}
      >
        <Button
          variant="outline"
          className="py-3 rounded-xl"
          onClick={() => Taro.navigateTo({ url: `/pages/interactions/index?matchId=${matchId}` })}
          disabled={submitting}
        >
          <Text className="block text-sm font-medium text-gray-600">历史记录</Text>
        </Button>
        <Button
          className="flex-1 text-white py-3 rounded-xl"
          style={{ backgroundColor: '#4ECB71' }}
          onClick={handleSubmit}
          disabled={submitting || hasUploadingRecords}
        >
          <Text className="block text-base font-medium text-white">
            {submitting ? '保存中...' : '保存记录'}
          </Text>
        </Button>
      </View>
    </View>
  )
}
