// 使用原生 Button 和 Input 是因为微信小程序的头像昵称填写能力需要:
// - Button open-type="chooseAvatar"
// - Input type="nickname"
/* eslint-disable no-restricted-syntax */
import { View, Text, Button, Input, Image } from '@tarojs/components'
/* eslint-enable no-restricted-syntax */
import Taro, { useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { useState, useCallback } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
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
  User,
  ChevronDown,
  ChevronUp,
  Heart,
  Users,
  Trophy,
  Star,
  Target,
  MapPin,
  Briefcase,
  GraduationCap,
  Brain,
  Shield,
  Sparkles,
  MessageCircle,
  Clock,
  Compass,
  Palette,
  Eye,
  Check,
  X,
  Trash2,
  Loader,
} from 'lucide-react-taro'

// ============ 类型定义 ============

interface UserProfile {
  nickname: string
  avatarUrl: string
  gender: 'male' | 'female' | null
  birthYear: number | null
  height: number | null
  occupation: string | null
  education: string | null
  location: string | null
  mbti: string | null
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
  }
  relationshipGoal: 'serious' | 'casual' | 'marriage' | null
  attachmentStyle: 'secure' | 'anxious' | 'avoidant' | null
  loveLanguage: string[]
  hobbies: string[]
  interests: string[]
  preferredTraits: string[]
  dealBreakers: string[]
  bio: string | null
  behavior?: {
    communicationStyle: 'direct' | 'indirect' | 'balanced' | null
    communicationStyleOnline: 'direct' | 'indirect' | 'playful' | 'gentle' | 'rational' | 'variable' | null
    communicationStyleOffline: 'direct' | 'indirect' | 'playful' | 'gentle' | 'rational' | 'variable' | null
    responseSpeed: 'instant' | 'fast' | 'normal' | 'slow' | null
    activeTimeSlots: string[]
    socialEnergy: 'high' | 'medium' | 'low' | null
    expressionStyle: 'expressive' | 'reserved' | null
    preferredTopics: string[]
    topicAvoid: string[]
  }
}

interface MatchItem {
  id: number
  name: string
  impression?: number
  progressScore?: number
}

interface AchievementItem {
  icon: typeof Target
  title: string
  bgColor: string
  iconColor: string
  unlocked: boolean
}

// ============ 常量配置 ============

const achievementDefinitions = [
  {
    icon: Target,
    title: '破冰达人',
    bgColor: 'bg-amber-100',
    unlockedIconColor: '#F0C75E',
    lockedIconColor: '#D1D5DB',
    check: (s: { matches: number; interactions: number; avgProgress: number }) => s.matches >= 1,
  },
  {
    icon: Heart,
    title: '心动记录',
    bgColor: 'bg-pink-100',
    unlockedIconColor: '#EC4899',
    lockedIconColor: '#D1D5DB',
    check: (s: { matches: number; interactions: number; avgProgress: number }) => s.interactions >= 1,
  },
  {
    icon: Trophy,
    title: '默契大师',
    bgColor: 'bg-green-100',
    unlockedIconColor: '#4ECB71',
    lockedIconColor: '#D1D5DB',
    check: (s: { matches: number; interactions: number; avgProgress: number }) => s.avgProgress >= 50,
  },
  {
    icon: Star,
    title: '关系专家',
    bgColor: 'bg-violet-100',
    unlockedIconColor: '#A78BFA',
    lockedIconColor: '#D1D5DB',
    check: (s: { matches: number; interactions: number; avgProgress: number }) => s.avgProgress >= 80,
  },
]

// 层级配置
const LAYER_CONFIG: Record<number, { name: string; icon: typeof User; color: string; bgColor: string }> = {
  1: { name: '基础画像', icon: User, color: '#3B82F6', bgColor: 'bg-blue-50' },
  2: { name: '性格特质', icon: Brain, color: '#8B5CF6', bgColor: 'bg-violet-50' },
  3: { name: '情感模式', icon: Heart, color: '#EC4899', bgColor: 'bg-pink-50' },
  4: { name: '行为风格', icon: Compass, color: '#4ECB71', bgColor: 'bg-green-50' },
}

// 标签映射


// 选项配置
const genderOptions = [{ value: 'male', label: '男' }, { value: 'female', label: '女' }]
const educationOptionsArr = [
  { value: 'high_school', label: '高中' }, { value: 'college', label: '大专' },
  { value: 'bachelor', label: '本科' }, { value: 'master', label: '硕士' }, { value: 'phd', label: '博士' },
]
const mbtiOptions = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP',
]
const relationshipGoalOptions = [
  { value: 'serious', label: '认真恋爱' }, { value: 'casual', label: '轻松交友' }, { value: 'marriage', label: '奔着结婚' },
]
const attachmentStyleOptions = [
  { value: 'secure', label: '安全型' }, { value: 'anxious', label: '焦虑型' }, { value: 'avoidant', label: '回避型' },
]
const loveLanguageOptions = [
  { value: 'quality_time', label: '陪伴' }, { value: 'words', label: '肯定' }, { value: 'gifts', label: '礼物' },
  { value: 'acts', label: '服务' }, { value: 'touch', label: '接触' },
]
const communicationStyleOptions = [
  { value: 'direct', label: '直接坦率' }, { value: 'indirect', label: '委婉含蓄' }, { value: 'balanced', label: '因人而异' },
]
const communicationOnlineOptions = [
  { value: 'direct', label: '直接' }, { value: 'playful', label: '活泼' }, { value: 'gentle', label: '温柔' },
  { value: 'rational', label: '理性' }, { value: 'indirect', label: '含蓄' }, { value: 'variable', label: '因人' },
]
const communicationOfflineOptions = [
  { value: 'direct', label: '直接' }, { value: 'playful', label: '活泼' }, { value: 'gentle', label: '温柔' },
  { value: 'rational', label: '理性' }, { value: 'indirect', label: '含蓄' }, { value: 'variable', label: '因人' },
]
const responseSpeedOptions = [
  { value: 'instant', label: '秒回' }, { value: 'fast', label: '很快' },
  { value: 'normal', label: '正常' }, { value: 'slow', label: '较慢' },
]
const socialEnergyOptions = [
  { value: 'high', label: '高能量' }, { value: 'medium', label: '中等' }, { value: 'low', label: '低能量' },
]
const expressionStyleOptions = [
  { value: 'expressive', label: '直率表达' }, { value: 'reserved', label: '含蓄内敛' },
]
const hobbyOptions = [
  { value: 'reading', label: '阅读' }, { value: 'music', label: '音乐' }, { value: 'movie', label: '电影' },
  { value: 'game', label: '游戏' }, { value: 'sports', label: '运动' }, { value: 'travel', label: '旅行' },
  { value: 'food', label: '美食' }, { value: 'photography', label: '摄影' }, { value: 'art', label: '艺术' },
  { value: 'pet', label: '宠物' },
]
const interestOptions = [
  { value: 'tech', label: '科技' }, { value: 'finance', label: '金融' }, { value: 'fashion', label: '时尚' },
  { value: 'health', label: '健康养生' }, { value: 'psychology', label: '心理学' }, { value: 'history', label: '历史' },
  { value: 'nature', label: '自然' }, { value: 'car', label: '汽车' },
]
const preferredTraitOptions = [
  { value: 'kind', label: '善良' }, { value: 'smart', label: '聪明' }, { value: 'funny', label: '幽默' },
  { value: 'responsible', label: '责任感' }, { value: 'ambitious', label: '上进心' }, { value: 'gentle', label: '温柔' },
  { value: 'confident', label: '自信' }, { value: 'independent', label: '独立' },
  { value: 'family_oriented', label: '顾家' }, { value: 'open_minded', label: '开放' },
]
const dealBreakerOptions = [
  { value: 'smoking', label: '抽烟' }, { value: 'drinking', label: '酗酒' }, { value: 'gambling', label: '赌博' },
  { value: 'cheating', label: '不忠诚' }, { value: 'controlling', label: '控制欲' },
  { value: 'lazy', label: '懒惰' }, { value: 'rude', label: '不尊重' }, { value: 'jealous', label: '爱吃醋' },
]
const topicOptions = [
  { value: 'daily', label: '日常' }, { value: 'work', label: '工作' }, { value: 'emotion', label: '情感' },
  { value: 'hobby', label: '爱好' }, { value: 'future', label: '未来' }, { value: 'relationship', label: '感情' },
  { value: 'food', label: '美食' }, { value: 'travel', label: '旅行' },
]

// 标签映射（用于多选展示）
const LOVE_LANGUAGE_LABELS: Record<string, string> = {
  quality_time: '陪伴', words: '肯定', gifts: '礼物', acts: '服务', touch: '接触',
}
const HOBBY_LABELS: Record<string, string> = {
  reading: '阅读', music: '音乐', movie: '电影', game: '游戏', sports: '运动',
  travel: '旅行', food: '美食', photography: '摄影', art: '艺术', pet: '宠物',
}
const INTEREST_LABELS: Record<string, string> = {
  tech: '科技', finance: '金融', fashion: '时尚', health: '健康养生', psychology: '心理学',
  history: '历史', nature: '自然', car: '汽车',
}
const TRAIT_LABELS: Record<string, string> = {
  kind: '善良', smart: '聪明', funny: '幽默', responsible: '有责任感',
  ambitious: '有上进心', gentle: '温柔', confident: '自信', independent: '独立',
  family_oriented: '顾家', open_minded: '思想开放',
}
const DEALBREAKER_LABELS: Record<string, string> = {
  smoking: '抽烟', drinking: '酗酒', gambling: '赌博', cheating: '不忠诚',
  controlling: '控制欲强', lazy: '懒惰', rude: '不尊重人', jealous: '爱吃醋',
}
const TOPIC_LABELS: Record<string, string> = {
  daily: '日常', work: '工作', emotion: '情感', hobby: '爱好',
  future: '未来', relationship: '感情', food: '美食', travel: '旅行',
}

const defaultProfile: UserProfile = {
  nickname: '',
  avatarUrl: '',
  gender: null,
  birthYear: null,
  height: null,
  occupation: null,
  education: null,
  location: null,
  mbti: null,
  personality: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 },
  emotional: { stability: 50, expression: 50, empathy: 50 },
  relationshipGoal: null,
  attachmentStyle: null,
  loveLanguage: [],
  hobbies: [],
  interests: [],
  preferredTraits: [],
  dealBreakers: [],
  bio: null,
  behavior: {
    communicationStyle: null,
    communicationStyleOnline: null,
    communicationStyleOffline: null,
    responseSpeed: null,
    activeTimeSlots: [],
    socialEnergy: null,
    expressionStyle: null,
    preferredTopics: [],
    topicAvoid: [],
  },
}

// ============ 辅助函数 ============

const calcProfileCompleteness = (profile: UserProfile): { filled: number; total: number; byLayer: Array<{ layer: number; filled: number; total: number }> } => {
  const l1Fields = [profile.gender, profile.birthYear, profile.height, profile.occupation, profile.education, profile.location, profile.mbti]
  const l1Filled = l1Fields.filter(v => v !== null && v !== undefined && v !== '').length

  const l2Fields = [
    profile.mbti,
    profile.personality.openness !== 50 ? profile.personality.openness : null,
    profile.personality.conscientiousness !== 50 ? profile.personality.conscientiousness : null,
    profile.personality.extraversion !== 50 ? profile.personality.extraversion : null,
    profile.personality.agreeableness !== 50 ? profile.personality.agreeableness : null,
    profile.personality.neuroticism !== 50 ? profile.personality.neuroticism : null,
  ]
  const l2Filled = l2Fields.filter(v => v !== null && v !== undefined).length

  const l3Fields = [profile.relationshipGoal, profile.attachmentStyle]
  const l3ArrFields = [profile.loveLanguage]
  const l3Filled = l3Fields.filter(v => v !== null && v !== undefined).length + l3ArrFields.filter(a => a && a.length > 0).length
  const l3Total = l3Fields.length + l3ArrFields.length

  const behavior = profile.behavior
  const l4Fields = behavior ? [behavior.communicationStyle, behavior.communicationStyleOnline, behavior.communicationStyleOffline, behavior.responseSpeed, behavior.socialEnergy, behavior.expressionStyle] : []
  const l4ArrFields = behavior ? [behavior.preferredTopics, behavior.activeTimeSlots] : []
  const l4Filled = l4Fields.filter(v => v !== null && v !== undefined).length + l4ArrFields.filter(a => a && a.length > 0).length
  const l4Total = l4Fields.length + l4ArrFields.length

  const totalFilled = l1Filled + l2Filled + l3Filled + l4Filled
  const totalAll = l1Fields.length + l2Fields.length + l3Total + l4Total

  return {
    filled: totalFilled,
    total: totalAll,
    byLayer: [
      { layer: 1, filled: l1Filled, total: l1Fields.length },
      { layer: 2, filled: l2Filled, total: l2Fields.length },
      { layer: 3, filled: l3Filled, total: l3Total },
      { layer: 4, filled: l4Filled, total: l4Total },
    ],
  }
}

// ============ 页面组件 ============

const ProfilePage: FC = () => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [stats, setStats] = useState({ matches: 0, interactions: 0, avgProgress: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState(false)
  const [achievements, setAchievements] = useState<AchievementItem[]>([])
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [expandedLayers, setExpandedLayers] = useState<Set<number>>(new Set([1]))
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState<string>('')
  const [tempNumber, setTempNumber] = useState<number>(0)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingMatchId, setDeletingMatchId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [matchList, setMatchList] = useState<MatchItem[]>([])

  const currentEnv = Taro.getEnv()
  const isMiniApp = currentEnv === Taro.ENV_TYPE.WEAPP || currentEnv === Taro.ENV_TYPE.TT

  useDidShow(() => {
    console.log('Profile page shown.')
    loadBasicProfile()
    loadExtendedProfile()
    loadStats()
  })

  const loadBasicProfile = async () => {
    try {
      const saved = Taro.getStorageSync('user_profile')
      if (saved) {
        const validAvatarUrl = saved.avatarUrl && !saved.avatarUrl.startsWith('blob:') && !saved.avatarUrl.startsWith('wxfile://')
          ? saved.avatarUrl
          : ''
        setProfile(prev => ({ ...prev, avatarUrl: validAvatarUrl, nickname: saved.nickname || '' }))
      }
      const res = await Network.request({ url: '/api/user-profile' })
      console.log('Load basic profile response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const serverProfile = res.data.data
        if (serverProfile.nickname) {
          const newProfile = { ...saved, nickname: serverProfile.nickname }
          setProfile(prev => ({ ...prev, nickname: serverProfile.nickname }))
          Taro.setStorageSync('user_profile', newProfile)
        }
      }
    } catch (error) {
      console.error('Load basic profile error:', error)
    }
  }

  const loadExtendedProfile = async () => {
    try {
      const res = await Network.request({ url: '/api/user-profile' })
      console.log('Load extended profile response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const data = res.data.data
        setProfile(prev => ({
          ...prev,
          gender: data.gender ?? prev.gender,
          birthYear: data.birthYear ?? prev.birthYear,
          height: data.height ?? prev.height,
          occupation: data.occupation ?? prev.occupation,
          education: data.education ?? prev.education,
          location: data.location ?? prev.location,
          mbti: data.mbti ?? prev.mbti,
          personality: data.personality ?? prev.personality,
          emotional: data.emotional ?? prev.emotional,
          relationshipGoal: data.relationshipGoal ?? prev.relationshipGoal,
          attachmentStyle: data.attachmentStyle ?? prev.attachmentStyle,
          loveLanguage: data.loveLanguage ?? prev.loveLanguage,
          hobbies: data.hobbies ?? prev.hobbies,
          interests: data.interests ?? prev.interests,
          preferredTraits: data.preferredTraits ?? prev.preferredTraits,
          dealBreakers: data.dealBreakers ?? prev.dealBreakers,
          bio: data.bio ?? prev.bio,
          behavior: data.behavior ?? prev.behavior,
        }))
      }
    } catch (error) {
      console.error('Load extended profile error:', error)
    }
  }

  const loadStats = async () => {
    setStatsLoading(true)
    setStatsError(false)
    try {
      const res = await Network.request({ url: '/api/match/list' })
      console.log('Load stats response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const matchData = res.data.data
        const list: MatchItem[] = matchData.list || matchData || []
        setMatchList(list)
        const totalProgress = list.reduce((sum, m) => sum + (m.progressScore || 0), 0)
        const avgProgress = list.length > 0 ? Math.round(totalProgress / list.length) : 0
        const totalInteractions = list.reduce((sum, m) => sum + (m.impression || 0), 0)
        const newStats = { matches: list.length, interactions: totalInteractions, avgProgress }
        setStats(newStats)
        updateAchievements(newStats)
      }
    } catch (error) {
      console.error('Load stats error:', error)
      setStatsError(true)
    } finally {
      setStatsLoading(false)
    }
  }

  const updateAchievements = (currentStats: { matches: number; interactions: number; avgProgress: number }) => {
    const items: AchievementItem[] = achievementDefinitions.map(def => ({
      icon: def.icon,
      title: def.title,
      bgColor: def.check(currentStats) ? def.bgColor : 'bg-gray-100',
      iconColor: def.check(currentStats) ? def.unlockedIconColor : '#D1D5DB',
      unlocked: def.check(currentStats),
    }))
    setAchievements(items)
  }

  const handleDeleteMatch = async () => {
    if (!deletingMatchId || deleting) return
    try {
      setDeleting(true)
      const res = await Network.request({
        url: `/api/match/${deletingMatchId}/delete`,
        method: 'POST',
      })
      console.log('Delete match response:', res?.data)
      if (res?.data?.code === 200) {
        setShowDeleteDialog(false)
        setDeletingMatchId(null)
        loadStats()
      }
    } catch (error) {
      console.error('Delete match error:', error)
    } finally {
      setDeleting(false)
    }
  }

  const syncProfileToServer = async (data: Partial<UserProfile>) => {
    try {
      const updateData: Record<string, unknown> = { ...data }
      await Network.request({ url: '/api/user-profile', method: 'POST', data: updateData })
      console.log('Profile synced to server:', updateData)
    } catch (error) {
      console.error('Sync profile error:', error)
    }
  }

  // ============ 编辑逻辑 ============

  /** 开始编辑某个维度字段 */
  const startEdit = useCallback((field: string, currentValue?: string) => {
    setEditingField(field)
    setTempValue(currentValue || '')
  }, [])

  /** 开始编辑数值字段 */
  const startEditNumber = useCallback((field: string, currentValue: number) => {
    setEditingField(field)
    setTempNumber(currentValue)
  }, [])

  /** 取消编辑 */
  const cancelEdit = useCallback(() => {
    setEditingField(null)
    setTempValue('')
  }, [])

  /** 保存单选类型字段 */
  const saveSelectField = useCallback((field: string, value: string) => {
    // 根据字段名更新对应的 profile 属性
    if (field === 'gender') {
      const v = value as 'male' | 'female'
      setProfile(prev => ({ ...prev, gender: v }))
      syncProfileToServer({ gender: v })
    } else if (field === 'education') {
      setProfile(prev => ({ ...prev, education: value }))
      syncProfileToServer({ education: value })
    } else if (field === 'mbti') {
      setProfile(prev => ({ ...prev, mbti: value }))
      syncProfileToServer({ mbti: value })
    } else if (field === 'relationshipGoal') {
      const v = value as 'serious' | 'casual' | 'marriage'
      setProfile(prev => ({ ...prev, relationshipGoal: v }))
      syncProfileToServer({ relationshipGoal: v })
    } else if (field === 'attachmentStyle') {
      const v = value as 'secure' | 'anxious' | 'avoidant'
      setProfile(prev => ({ ...prev, attachmentStyle: v }))
      syncProfileToServer({ attachmentStyle: v })
    } else if (field === 'behavior.communicationStyle') {
      const v = value as 'direct' | 'indirect' | 'balanced'
      setProfile(prev => ({ ...prev, behavior: { ...prev.behavior!, communicationStyle: v } }))
      syncProfileToServer({ behavior: { ...profile.behavior!, communicationStyle: v } })
    } else if (field === 'behavior.communicationStyleOnline') {
      const v = value as 'direct' | 'indirect' | 'playful' | 'gentle' | 'rational' | 'variable'
      setProfile(prev => ({ ...prev, behavior: { ...prev.behavior!, communicationStyleOnline: v } }))
      syncProfileToServer({ behavior: { ...profile.behavior!, communicationStyleOnline: v } })
    } else if (field === 'behavior.communicationStyleOffline') {
      const v = value as 'direct' | 'indirect' | 'playful' | 'gentle' | 'rational' | 'variable'
      setProfile(prev => ({ ...prev, behavior: { ...prev.behavior!, communicationStyleOffline: v } }))
      syncProfileToServer({ behavior: { ...profile.behavior!, communicationStyleOffline: v } })
    } else if (field === 'behavior.responseSpeed') {
      const v = value as 'instant' | 'fast' | 'normal' | 'slow'
      setProfile(prev => ({ ...prev, behavior: { ...prev.behavior!, responseSpeed: v } }))
      syncProfileToServer({ behavior: { ...profile.behavior!, responseSpeed: v } })
    } else if (field === 'behavior.socialEnergy') {
      const v = value as 'high' | 'medium' | 'low'
      setProfile(prev => ({ ...prev, behavior: { ...prev.behavior!, socialEnergy: v } }))
      syncProfileToServer({ behavior: { ...profile.behavior!, socialEnergy: v } })
    } else if (field === 'behavior.expressionStyle') {
      const v = value as 'expressive' | 'reserved'
      setProfile(prev => ({ ...prev, behavior: { ...prev.behavior!, expressionStyle: v } }))
      syncProfileToServer({ behavior: { ...profile.behavior!, expressionStyle: v } })
    }
    setEditingField(null)
    Taro.showToast({ title: '已保存', icon: 'success', duration: 800 })
  }, [profile])

  /** 保存文本字段 */
  const saveTextField = useCallback((field: string) => {
    const val = tempValue.trim()
    if (field === 'occupation') {
      setProfile(prev => ({ ...prev, occupation: val || null }))
      syncProfileToServer({ occupation: val || null })
    } else if (field === 'location') {
      setProfile(prev => ({ ...prev, location: val || null }))
      syncProfileToServer({ location: val || null })
    }
    setEditingField(null)
    Taro.showToast({ title: '已保存', icon: 'success', duration: 800 })
  }, [tempValue])

  /** 保存数值字段 */
  const saveNumberField = useCallback((field: string) => {
    if (field === 'birthYear') {
      const val = tempNumber
      setProfile(prev => ({ ...prev, birthYear: val || null }))
      syncProfileToServer({ birthYear: val || null })
    } else if (field === 'height') {
      const val = tempNumber
      setProfile(prev => ({ ...prev, height: val || null }))
      syncProfileToServer({ height: val || null })
    }
    setEditingField(null)
    Taro.showToast({ title: '已保存', icon: 'success', duration: 800 })
  }, [tempNumber])

  /** 保存滑块字段 */
  const saveSliderField = useCallback((field: string, value: number) => {
    if (field.startsWith('personality.')) {
      const key = field.split('.')[1] as keyof UserProfile['personality']
      setProfile(prev => ({
        ...prev,
        personality: { ...prev.personality, [key]: value },
      }))
      syncProfileToServer({ personality: { ...profile.personality, [key]: value } })
    } else if (field.startsWith('emotional.')) {
      const key = field.split('.')[1] as keyof UserProfile['emotional']
      setProfile(prev => ({
        ...prev,
        emotional: { ...prev.emotional, [key]: value },
      }))
      syncProfileToServer({ emotional: { ...profile.emotional, [key]: value } })
    }
    setEditingField(null)
    Taro.showToast({ title: '已保存', icon: 'success', duration: 800 })
  }, [profile])

  /** 切换多选标签 */
  const toggleMultiSelect = useCallback((field: string, value: string) => {
    if (field === 'loveLanguage') {
      setProfile(prev => {
        const arr = prev.loveLanguage
        const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
        return { ...prev, loveLanguage: newArr }
      })
    } else if (field === 'hobbies') {
      setProfile(prev => {
        const arr = prev.hobbies
        const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
        return { ...prev, hobbies: newArr }
      })
    } else if (field === 'interests') {
      setProfile(prev => {
        const arr = prev.interests
        const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
        return { ...prev, interests: newArr }
      })
    } else if (field === 'preferredTraits') {
      setProfile(prev => {
        const arr = prev.preferredTraits
        const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
        return { ...prev, preferredTraits: newArr }
      })
    } else if (field === 'dealBreakers') {
      setProfile(prev => {
        const arr = prev.dealBreakers
        const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
        return { ...prev, dealBreakers: newArr }
      })
    } else if (field === 'behavior.preferredTopics') {
      setProfile(prev => {
        const arr = prev.behavior?.preferredTopics || []
        const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
        return { ...prev, behavior: { ...prev.behavior!, preferredTopics: newArr } }
      })
    }
  }, [])

  /** 确认多选字段（保存到服务器） */
  const confirmMultiSelect = useCallback((field: string) => {
    if (field === 'loveLanguage') {
      syncProfileToServer({ loveLanguage: profile.loveLanguage })
    } else if (field === 'hobbies') {
      syncProfileToServer({ hobbies: profile.hobbies })
    } else if (field === 'interests') {
      syncProfileToServer({ interests: profile.interests })
    } else if (field === 'preferredTraits') {
      syncProfileToServer({ preferredTraits: profile.preferredTraits })
    } else if (field === 'dealBreakers') {
      syncProfileToServer({ dealBreakers: profile.dealBreakers })
    } else if (field === 'behavior.preferredTopics') {
      syncProfileToServer({ behavior: profile.behavior })
    }
    setEditingField(null)
    Taro.showToast({ title: '已保存', icon: 'success', duration: 800 })
  }, [profile])

  // 头像和昵称处理
  const handleChooseAvatar = (e: { detail: { avatarUrl: string } }) => {
    const { avatarUrl } = e.detail
    setProfile(prev => ({ ...prev, avatarUrl }))
    setAvatarFailed(false)
    const saved = Taro.getStorageSync('user_profile') || {}
    Taro.setStorageSync('user_profile', { ...saved, avatarUrl })
    Taro.showToast({ title: '头像已更新', icon: 'success' })
  }

  const handleH5ChooseAvatar = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const avatarUrl = res.tempFilePaths[0]
        setProfile(prev => ({ ...prev, avatarUrl }))
        setAvatarFailed(false)
        const saved = Taro.getStorageSync('user_profile') || {}
        Taro.setStorageSync('user_profile', { ...saved, avatarUrl })
        Taro.showToast({ title: '头像已更新', icon: 'success' })
      },
    })
  }

  const handleInputNickname = (e: { detail: { value: string } }) => {
    const nickname = e.detail.value
    setProfile(prev => ({ ...prev, nickname }))
  }

  const handleSaveNickname = () => {
    const saved = Taro.getStorageSync('user_profile') || {}
    Taro.setStorageSync('user_profile', { ...saved, nickname: profile.nickname })
    syncProfileToServer({ nickname: profile.nickname })
    Taro.showToast({ title: '昵称已保存', icon: 'success' })
  }

  const handleAvatarError = () => {
    console.log('Avatar image load failed, falling back to default')
    setAvatarFailed(true)
    const newProfile = { ...profile, avatarUrl: '' }
    setProfile(newProfile)
    const saved = Taro.getStorageSync('user_profile') || {}
    Taro.setStorageSync('user_profile', { ...saved, avatarUrl: '' })
  }

  const toggleLayer = useCallback((layer: number) => {
    setExpandedLayers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(layer)) newSet.delete(layer)
      else newSet.add(layer)
      return newSet
    })
  }, [])

  const completeness = calcProfileCompleteness(profile)
  const totalPercent = completeness.total > 0 ? Math.round((completeness.filled / completeness.total) * 100) : 0

  // ============ 渲染辅助 ============

  /** 可编辑单选行 - 展示+选项chips */
  const renderSelectRow = (
    field: string,
    label: string,
    currentValue: string | null,
    options: Array<{ value: string; label: string }>,
    Icon: typeof MapPin,
    accentColor: string = '#4ECB71',
  ) => {
    const isEditing = editingField === field
    const displayText = currentValue ? (options.find(o => o.value === currentValue)?.label || currentValue) : ''
    return (
      <View className="border-t border-gray-100">
        <View
          className="flex items-center justify-between py-3"
          onClick={() => {
            if (!isEditing) setEditingField(field)
            else cancelEdit()
          }}
        >
          <View className="flex items-center gap-2 flex-1">
            <Icon size={12} color={currentValue ? '#6B7280' : '#D1D5DB'} />
            <Text className="block text-xs text-gray-500">{label}</Text>
          </View>
          <View className="flex items-center gap-1">
            <Text className={`block text-xs ${currentValue ? 'text-gray-800 font-medium' : 'text-gray-300'}`}>
              {displayText || '未填写'}
            </Text>
            {isEditing ? <ChevronUp size={12} color="#9CA3AF" /> : <ChevronDown size={12} color="#9CA3AF" />}
          </View>
        </View>
        {/* 展开选项 chips */}
        {isEditing && (
          <View className="pb-3 flex flex-wrap gap-2">
            {options.map(opt => (
              <View
                key={opt.value}
                className={`px-3 py-2 rounded-full border ${
                  currentValue === opt.value
                    ? 'border-transparent'
                    : 'border-gray-200 bg-white'
                }`}
                style={currentValue === opt.value ? { backgroundColor: accentColor } : {}}
                onClick={() => saveSelectField(field, opt.value)}
              >
                <Text className={`block text-xs ${currentValue === opt.value ? 'text-white font-medium' : 'text-gray-600'}`}>
                  {opt.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    )
  }

  /** 可编辑文本输入行 */
  const renderTextRow = (
    field: string,
    label: string,
    currentValue: string | null,
    placeholder: string,
    Icon: typeof MapPin,
    accentColor: string = '#4ECB71',
  ) => {
    const isEditing = editingField === field
    return (
      <View className="border-t border-gray-100">
        <View
          className="flex items-center justify-between py-3"
          onClick={() => {
            if (!isEditing) startEdit(field, currentValue || '')
            else cancelEdit()
          }}
        >
          <View className="flex items-center gap-2 flex-1">
            <Icon size={12} color={currentValue ? '#6B7280' : '#D1D5DB'} />
            <Text className="block text-xs text-gray-500">{label}</Text>
          </View>
          <View className="flex items-center gap-1">
            <Text className={`block text-xs ${currentValue ? 'text-gray-800 font-medium' : 'text-gray-300'}`}>
              {currentValue || '未填写'}
            </Text>
            {isEditing ? <ChevronUp size={12} color="#9CA3AF" /> : <ChevronDown size={12} color="#9CA3AF" />}
          </View>
        </View>
        {isEditing && (
          <View className="pb-3">
            <View className="flex items-center gap-2">
              <View className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <Input
                  className="w-full bg-transparent text-sm"
                  placeholder={placeholder}
                  value={tempValue}
                  onInput={(e) => setTempValue(e.detail.value)}
                  focus
                />
              </View>
              <View
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: accentColor }}
                onClick={() => saveTextField(field)}
              >
                <Check size={14} color="#fff" />
              </View>
              <View
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                onClick={cancelEdit}
              >
                <X size={14} color="#6B7280" />
              </View>
            </View>
          </View>
        )}
      </View>
    )
  }

  /** 可编辑数值输入行 */
  const renderNumberRow = (
    field: string,
    label: string,
    currentValue: number | null,
    placeholder: string,
    suffix: string,
    Icon: typeof MapPin,
    accentColor: string = '#4ECB71',
  ) => {
    const isEditing = editingField === field
    const displayText = currentValue ? `${currentValue}${suffix}` : ''
    return (
      <View className="border-t border-gray-100">
        <View
          className="flex items-center justify-between py-3"
          onClick={() => {
            if (!isEditing) startEditNumber(field, currentValue || 0)
            else cancelEdit()
          }}
        >
          <View className="flex items-center gap-2 flex-1">
            <Icon size={12} color={currentValue ? '#6B7280' : '#D1D5DB'} />
            <Text className="block text-xs text-gray-500">{label}</Text>
          </View>
          <View className="flex items-center gap-1">
            <Text className={`block text-xs ${currentValue ? 'text-gray-800 font-medium' : 'text-gray-300'}`}>
              {displayText || '未填写'}
            </Text>
            {isEditing ? <ChevronUp size={12} color="#9CA3AF" /> : <ChevronDown size={12} color="#9CA3AF" />}
          </View>
        </View>
        {isEditing && (
          <View className="pb-3">
            <View className="flex items-center gap-2">
              <View className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <Input
                  className="w-full bg-transparent text-sm"
                  placeholder={placeholder}
                  value={tempNumber ? String(tempNumber) : ''}
                  onInput={(e) => setTempNumber(parseInt(e.detail.value) || 0)}
                  type="number"
                  focus
                />
              </View>
              <Text className="block text-xs text-gray-500">{suffix}</Text>
              <View
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: accentColor }}
                onClick={() => saveNumberField(field)}
              >
                <Check size={14} color="#fff" />
              </View>
              <View
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                onClick={cancelEdit}
              >
                <X size={14} color="#6B7280" />
              </View>
            </View>
          </View>
        )}
      </View>
    )
  }

  /** 可编辑滑块行 */
  const renderSliderRow = (
    field: string,
    label: string,
    currentValue: number,
    colorClass: string,
    accentColor: string,
  ) => {
    const isEditing = editingField === field
    return (
      <View className="border-t border-gray-100">
        <View
          className="flex items-center justify-between py-3"
          onClick={() => {
            if (!isEditing) {
              setEditingField(field)
              setTempNumber(currentValue)
            }
            else cancelEdit()
          }}
        >
          <Text className="block text-xs text-gray-500">{label}</Text>
          <View className="flex items-center gap-1">
            <Text className="block text-xs font-medium text-gray-700">{currentValue}</Text>
            {isEditing ? <ChevronUp size={12} color="#9CA3AF" /> : <ChevronDown size={12} color="#9CA3AF" />}
          </View>
        </View>
        {/* 进度条展示（非编辑态） */}
        {!isEditing && (
          <View className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
            <View className={`h-full rounded-full ${colorClass}`} style={{ width: `${currentValue}%` }} />
          </View>
        )}
        {/* 编辑态：滑块 */}
        {isEditing && (
          <View className="pb-3">
            <Slider
              value={[tempNumber]}
              onValueChange={(val) => setTempNumber(val[0] ?? 0)}
            />
            <View className="flex items-center justify-between mt-2">
              <Text className="block text-xs text-gray-400">0</Text>
              <Text className="block text-sm font-medium text-gray-700">{tempNumber}</Text>
              <Text className="block text-xs text-gray-400">100</Text>
            </View>
            <View className="flex items-center gap-2 mt-2">
              <View
                className="flex-1 py-2 rounded-xl text-center"
                style={{ backgroundColor: accentColor }}
                onClick={() => saveSliderField(field, tempNumber)}
              >
                <Text className="block text-xs text-white font-medium">确认</Text>
              </View>
              <View
                className="flex-1 py-2 rounded-xl text-center bg-gray-100"
                onClick={cancelEdit}
              >
                <Text className="block text-xs text-gray-600">取消</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    )
  }

  /** 可编辑多选标签行 */
  const renderMultiSelectRow = (
    field: string,
    label: string,
    currentValues: string[],
    options: Array<{ value: string; label: string }>,
    labelMap: Record<string, string>,
    accentColor: string = '#4ECB71',
  ) => {
    const isEditing = editingField === field
    return (
      <View className="border-t border-gray-100">
        <View
          className="flex items-center justify-between py-3"
          onClick={() => {
            if (!isEditing) setEditingField(field)
            else cancelEdit()
          }}
        >
          <Text className="block text-xs text-gray-500">{label}</Text>
          <View className="flex items-center gap-1">
            <Text className="block text-xs text-gray-400">
              {currentValues.length > 0 ? `已选${currentValues.length}项` : '未填写'}
            </Text>
            {isEditing ? <ChevronUp size={12} color="#9CA3AF" /> : <ChevronDown size={12} color="#9CA3AF" />}
          </View>
        </View>
        {/* 标签展示（非编辑态） */}
        {!isEditing && currentValues.length > 0 && (
          <View className="flex flex-wrap gap-1 pb-2">
            {currentValues.map(v => (
              <Badge key={v} className="text-xs">{labelMap[v] || v}</Badge>
            ))}
          </View>
        )}
        {/* 编辑态：标签选择器 */}
        {isEditing && (
          <View className="pb-3">
            <View className="flex flex-wrap gap-2 mb-3">
              {options.map(opt => {
                const isSelected = currentValues.includes(opt.value)
                return (
                  <View
                    key={opt.value}
                    className={`px-3 py-2 rounded-full border ${
                      isSelected ? 'border-transparent' : 'border-gray-200 bg-white'
                    }`}
                    style={isSelected ? { backgroundColor: accentColor } : {}}
                    onClick={() => toggleMultiSelect(field, opt.value)}
                  >
                    <Text className={`block text-xs ${isSelected ? 'text-white font-medium' : 'text-gray-600'}`}>
                      {opt.label}
                    </Text>
                  </View>
                )
              })}
            </View>
            <View
              className="py-2 rounded-xl text-center"
              style={{ backgroundColor: accentColor }}
              onClick={() => confirmMultiSelect(field)}
            >
              <Text className="block text-xs text-white font-medium">确认保存</Text>
            </View>
          </View>
        )}
      </View>
    )
  }

  // ============ 主渲染 ============

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      {/* ====== 头部卡片 ====== */}
      <View className="p-4">
        <Card className="shadow-soft border-0 bg-green-500">
          <CardContent className="p-6">
            <View className="flex items-center gap-4">
              {isMiniApp ? (
                <Button
                  openType="chooseAvatar"
                  onChooseAvatar={handleChooseAvatar}
                  // eslint-disable-next-line no-restricted-syntax
                  className="w-16 h-16 rounded-full bg-transparent border-0 p-0"
                  style={{ padding: 0, background: 'transparent' }}
                >
                  {profile.avatarUrl && !avatarFailed ? (
                    <Image src={profile.avatarUrl} className="w-16 h-16 rounded-full" mode="aspectFill" onError={handleAvatarError} />
                  ) : (
                    <View className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
                      <User size={32} color="#fff" />
                    </View>
                  )}
                </Button>
              ) : (
                <View
                  className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: (profile.avatarUrl && !avatarFailed) ? 'transparent' : '#2E9E5A' }}
                  onClick={handleH5ChooseAvatar}
                >
                  {profile.avatarUrl && !avatarFailed ? (
                    <Image src={profile.avatarUrl} className="w-16 h-16 rounded-full" mode="aspectFill" onError={handleAvatarError} />
                  ) : (
                    <User size={32} color="#fff" />
                  )}
                </View>
              )}

              <View className="flex-1">
                <View className="bg-transparent rounded-xl">
                  <Input
                    type={isMiniApp ? 'nickname' : 'text'}
                    className="w-full bg-transparent"
                    placeholder="点击设置昵称"
                    placeholderClass="text-white text-opacity-60"
                    value={profile.nickname}
                    onInput={handleInputNickname}
                    onBlur={handleSaveNickname}
                    style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}
                  />
                </View>
                <View className="flex items-center gap-2 mt-1">
                  {profile.mbti && <Text className="block text-xs text-white text-opacity-80 bg-white bg-opacity-20 px-2 py-1 rounded-full">{profile.mbti}</Text>}
                  {profile.occupation && <Text className="block text-xs text-white text-opacity-70">{profile.occupation}</Text>}
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* ====== 关系数据总览 ====== */}
      <View className="px-4 pb-4">
        <Card className="shadow-soft border-0">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <Sparkles size={14} color="#4ECB71" />
                <Text className="block text-sm font-semibold text-gray-900">关系数据</Text>
              </View>
              {!statsLoading && !statsError && (
                <Text className="block text-xs text-gray-400">共 {stats.matches} 位对象</Text>
              )}
            </View>

            {statsLoading ? (
              <View className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <View key={i} className="text-center py-2">
                    <View className="h-6 w-10 mx-auto mb-1 bg-gray-100 rounded animate-pulse" />
                    <View className="h-3 w-12 mx-auto bg-gray-50 rounded animate-pulse" />
                  </View>
                ))}
              </View>
            ) : statsError ? (
              <View className="text-center py-3">
                <Text className="block text-sm text-gray-500 mb-1">加载失败</Text>
                <Text className="block text-sm text-green-500" onClick={loadStats}>点击重试</Text>
              </View>
            ) : (
              <View className="grid grid-cols-3 gap-3">
                <View className="text-center py-1">
                  <View className="flex items-center justify-center gap-1">
                    <Users size={14} color="#111827" />
                    <Text className="block text-xl font-bold text-gray-900">{stats.matches}</Text>
                  </View>
                  <Text className="block text-xs text-gray-500 mt-1">接触对象</Text>
                </View>
                <View className="text-center py-1">
                  <View className="flex items-center justify-center gap-1">
                    <Heart size={14} color="#EC4899" />
                    <Text className="block text-xl font-bold text-pink-500">{stats.interactions}</Text>
                  </View>
                  <Text className="block text-xs text-gray-500 mt-1">完成互动</Text>
                </View>
                <View className="text-center py-1">
                  <Text className="block text-xl font-bold text-green-500">{stats.avgProgress}%</Text>
                  <Text className="block text-xs text-gray-500 mt-1">平均推进</Text>
                </View>
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* ====== 我的维度档案 ====== */}
      <View className="px-4 pb-4">
        <View className="flex items-center gap-2 mb-3">
          <Eye size={14} color="#2E9E5A" />
          <Text className="block text-sm font-semibold text-gray-900">我的维度档案</Text>
          <Text className="block text-xs text-gray-400 ml-auto">点击维度即可编辑</Text>
        </View>

        {/* 档案完成度总览 */}
        <Card className="shadow-soft border-0 mb-3">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-2">
              <Text className="block text-xs text-gray-500">档案完成度</Text>
              <Text className="block text-xs font-medium text-green-600">
                {completeness.filled}/{completeness.total}
              </Text>
            </View>
            <Progress value={totalPercent} className="h-2 bg-gray-100" />
            <View className="flex flex-wrap gap-3 mt-3">
              {completeness.byLayer.map(lc => {
                const config = LAYER_CONFIG[lc.layer]
                const LayerIcon = config.icon
                return (
                  <View key={lc.layer} className="flex items-center gap-1">
                    <LayerIcon size={12} color={config.color} />
                    <Text className="block text-xs text-gray-600">{config.name}</Text>
                    <Text className="block text-xs text-gray-400">{lc.filled}/{lc.total}</Text>
                  </View>
                )
              })}
            </View>
          </CardContent>
        </Card>

        {/* 成就徽章 */}
        {achievements.length > 0 && (
          <Card className="shadow-soft border-0 mb-3">
            <CardContent className="p-4">
              <View className="flex items-center justify-between mb-3">
                <Text className="block text-xs font-semibold text-gray-700">成就徽章</Text>
                <Text className="block text-xs text-gray-400">
                  {achievements.filter(a => a.unlocked).length}/{achievements.length}
                </Text>
              </View>
              <View className="flex gap-4">
                {achievements.map(item => (
                  <View className="flex flex-col items-center" key={item.title}>
                    <View className={`w-10 h-10 rounded-full ${item.bgColor} flex items-center justify-center mb-1`}>
                      <item.icon size={20} color={item.iconColor} />
                    </View>
                    <Text className={`block text-xs ${item.unlocked ? 'text-gray-500' : 'text-gray-300'}`}>
                      {item.title}
                    </Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}

        {/* 维度层级卡片 - 每层可展开编辑 */}
        {[1, 2, 3, 4].map(layer => {
          const config = LAYER_CONFIG[layer]
          const LayerIcon = config.icon
          const isExpanded = expandedLayers.has(layer)
          const layerComp = completeness.byLayer.find(l => l.layer === layer)
          const layerPercent = layerComp && layerComp.total > 0 ? Math.round((layerComp.filled / layerComp.total) * 100) : 0

          return (
            <Card key={layer} className="shadow-soft border-0 mb-3">
              <CardContent className="p-0">
                {/* 层级标题 */}
                <View
                  className="flex items-center justify-between p-4"
                  onClick={() => toggleLayer(layer)}
                >
                  <View className="flex items-center gap-3">
                    <View className={`w-8 h-8 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                      <LayerIcon size={16} color={config.color} />
                    </View>
                    <View>
                      <Text className="block text-sm font-semibold text-gray-900">{config.name}</Text>
                      <Text className="block text-xs text-gray-400">L{layer} · {layerComp?.filled || 0}/{layerComp?.total || 0}项</Text>
                    </View>
                  </View>
                  <View className="flex items-center gap-3">
                    {layerPercent === 100 && (
                      <Badge className="bg-green-50 text-green-700 text-xs">已完整</Badge>
                    )}
                    {layerPercent === 0 && (
                      <Badge className="bg-gray-50 text-gray-400 text-xs">待填写</Badge>
                    )}
                    {isExpanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
                  </View>
                </View>

                {/* 层级完成度条 */}
                <View className="px-4 pb-2">
                  <View className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className={`h-full rounded-full ${layerPercent >= 80 ? 'bg-green-400' : layerPercent >= 40 ? 'bg-blue-400' : 'bg-gray-300'}`}
                      style={{ width: `${layerPercent}%` }}
                    />
                  </View>
                </View>

                {/* 展开后的可编辑维度 */}
                {isExpanded && (
                  <View className="px-4 pb-4">
                    {/* L1: 基础画像 */}
                    {layer === 1 && (
                      <View>
                        {renderSelectRow('gender', '性别', profile.gender, genderOptions, User, '#3B82F6')}
                        {renderNumberRow('birthYear', '年龄', profile.birthYear, '例如：1995', '岁', Clock, '#3B82F6')}
                        {renderNumberRow('height', '身高', profile.height, '例如：175', 'cm', Compass, '#3B82F6')}
                        {renderTextRow('occupation', '职业', profile.occupation, '例如：产品经理', Briefcase, '#3B82F6')}
                        {renderSelectRow('education', '学历', profile.education, educationOptionsArr, GraduationCap, '#3B82F6')}
                        {renderTextRow('location', '所在地', profile.location, '例如：北京', MapPin, '#3B82F6')}
                        {renderSelectRow('mbti', 'MBTI', profile.mbti, mbtiOptions.map(v => ({ value: v, label: v })), Brain, '#3B82F6')}
                      </View>
                    )}

                    {/* L2: 性格特质 */}
                    {layer === 2 && (
                      <View>
                        {profile.mbti && (
                          <View className="mb-3 p-3 bg-violet-50 rounded-xl">
                            <View className="flex items-center justify-between">
                              <View className="flex items-center gap-2">
                                <Text className="block text-lg font-bold text-violet-700">{profile.mbti}</Text>
                              </View>
                              <Text
                                className="block text-xs text-violet-400"
                                onClick={() => {
                                  setExpandedLayers(prev => {
                                    const newSet = new Set(prev)
                                    newSet.add(1)
                                    return newSet
                                  })
                                  setEditingField('mbti')
                                }}
                              >
                                修改
                              </Text>
                            </View>
                          </View>
                        )}
                        {renderSliderRow('personality.openness', '开放性', profile.personality.openness, 'bg-blue-500', '#8B5CF6')}
                        {renderSliderRow('personality.conscientiousness', '尽责性', profile.personality.conscientiousness, 'bg-green-500', '#8B5CF6')}
                        {renderSliderRow('personality.extraversion', '外向性', profile.personality.extraversion, 'bg-amber-500', '#8B5CF6')}
                        {renderSliderRow('personality.agreeableness', '宜人性', profile.personality.agreeableness, 'bg-pink-500', '#8B5CF6')}
                        {renderSliderRow('personality.neuroticism', '神经质', profile.personality.neuroticism, 'bg-violet-500', '#8B5CF6')}
                      </View>
                    )}

                    {/* L3: 情感模式 */}
                    {layer === 3 && (
                      <View>
                        {renderSelectRow('relationshipGoal', '恋爱目标', profile.relationshipGoal, relationshipGoalOptions, Heart, '#EC4899')}
                        {renderSelectRow('attachmentStyle', '依恋风格', profile.attachmentStyle, attachmentStyleOptions, Shield, '#EC4899')}
                        {renderMultiSelectRow('loveLanguage', '爱的语言', profile.loveLanguage, loveLanguageOptions, LOVE_LANGUAGE_LABELS, '#EC4899')}
                        {renderSliderRow('emotional.stability', '情绪稳定性', profile.emotional.stability, 'bg-blue-400', '#EC4899')}
                        {renderSliderRow('emotional.expression', '情感表达', profile.emotional.expression, 'bg-pink-400', '#EC4899')}
                        {renderSliderRow('emotional.empathy', '共情能力', profile.emotional.empathy, 'bg-violet-400', '#EC4899')}
                      </View>
                    )}

                    {/* L4: 行为风格 */}
                    {layer === 4 && (
                      <View>
                        {profile.behavior && (
                          <>
                            {renderSelectRow('behavior.communicationStyle', '沟通风格', profile.behavior.communicationStyle, communicationStyleOptions, MessageCircle, '#4ECB71')}
                            {renderSelectRow('behavior.communicationStyleOnline', '线上风格', profile.behavior.communicationStyleOnline, communicationOnlineOptions, MessageCircle, '#4ECB71')}
                            {renderSelectRow('behavior.communicationStyleOffline', '线下风格', profile.behavior.communicationStyleOffline, communicationOfflineOptions, MessageCircle, '#4ECB71')}
                            {renderSelectRow('behavior.responseSpeed', '回复速度', profile.behavior.responseSpeed, responseSpeedOptions, Clock, '#4ECB71')}
                            {renderSelectRow('behavior.socialEnergy', '社交能量', profile.behavior.socialEnergy, socialEnergyOptions, Users, '#4ECB71')}
                            {renderSelectRow('behavior.expressionStyle', '表达风格', profile.behavior.expressionStyle, expressionStyleOptions, Palette, '#4ECB71')}
                            {renderMultiSelectRow('behavior.preferredTopics', '常聊话题', profile.behavior.preferredTopics || [], topicOptions, TOPIC_LABELS, '#4ECB71')}
                          </>
                        )}
                        {renderMultiSelectRow('hobbies', '兴趣爱好', profile.hobbies, hobbyOptions, HOBBY_LABELS, '#4ECB71')}
                        {renderMultiSelectRow('interests', '关注领域', profile.interests, interestOptions, INTEREST_LABELS, '#4ECB71')}
                        {renderMultiSelectRow('preferredTraits', '期待特质', profile.preferredTraits, preferredTraitOptions, TRAIT_LABELS, '#4ECB71')}
                        {renderMultiSelectRow('dealBreakers', '雷区', profile.dealBreakers, dealBreakerOptions, DEALBREAKER_LABELS, '#EF4444')}
                      </View>
                    )}
                  </View>
                )}
              </CardContent>
            </Card>
          )
        })}
      </View>

      {/* ====== 设置 ====== */}
      <View className="px-4 pb-4">
        <Card className="shadow-soft border-0">
          <CardContent className="p-0">
            <View className="flex items-center gap-3 p-4" onClick={() => { if (matchList.length > 0) setShowDeleteDialog(true) }}>
              <View className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 size={16} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="block text-sm font-semibold text-gray-900">删除关系</Text>
                <Text className="block text-xs text-gray-400">删除后数据不可恢复</Text>
              </View>
              <ChevronDown size={16} color="#D1D5DB" className="rotate-[-90deg]" />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 版本信息 */}
      <View className="p-4 text-center">
        <Text className="block text-xs text-gray-400">知拌 v1.0.0</Text>
      </View>

      {/* 删除关系选择弹窗 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingMatchId ? '确认删除' : '选择要删除的关系'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingMatchId
                ? `确定要删除该关系吗？所有互动记录、维度数据将一并删除，此操作不可恢复。`
                : '请选择要删除的关系对象'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {!deletingMatchId ? (
            <View className="max-h-60 overflow-y-auto">
              {matchList.map(match => (
                <View
                  key={match.id}
                  className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0"
                  onClick={() => setDeletingMatchId(match.id)}
                >
                  <Text className="block text-sm text-gray-800">{match.name}</Text>
                  <Trash2 size={16} color="#EF4444" />
                </View>
              ))}
            </View>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowDeleteDialog(false); setDeletingMatchId(null) }}>
              取消
            </AlertDialogCancel>
            {deletingMatchId && (
              <AlertDialogAction onClick={handleDeleteMatch}>
                {deleting ? <Loader size={14} color="#fff" className="animate-spin" /> : '确认删除'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  )
}

export default ProfilePage
