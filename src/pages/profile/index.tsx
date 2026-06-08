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
import {
  User,
  ChevronRight,
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
  FileText,
  Pencil,
  Eye,
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

// 层级配置 - 对齐对象的维度档案风格
const LAYER_CONFIG: Record<number, { name: string; icon: typeof User; color: string; bgColor: string }> = {
  1: { name: '基础画像', icon: User, color: '#3B82F6', bgColor: 'bg-blue-50' },
  2: { name: '性格特质', icon: Brain, color: '#8B5CF6', bgColor: 'bg-violet-50' },
  3: { name: '情感模式', icon: Heart, color: '#EC4899', bgColor: 'bg-pink-50' },
  4: { name: '行为风格', icon: Compass, color: '#4ECB71', bgColor: 'bg-green-50' },
}

// 标签映射
const GENDER_LABELS: Record<string, string> = { male: '男', female: '女' }
const EDUCATION_LABELS: Record<string, string> = {
  high_school: '高中及以下', college: '大专', bachelor: '本科', master: '硕士', phd: '博士',
}
const RELATIONSHIP_GOAL_LABELS: Record<string, string> = {
  serious: '认真恋爱', casual: '轻松交友', marriage: '奔着结婚',
}
const ATTACHMENT_STYLE_LABELS: Record<string, string> = {
  secure: '安全型', anxious: '焦虑型', avoidant: '回避型',
}
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
const COMMUNICATION_STYLE_LABELS: Record<string, string> = {
  direct: '直接坦率', indirect: '委婉含蓄', balanced: '因人而异',
  playful: '活泼调皮', gentle: '温柔体贴', rational: '理性冷静', variable: '因人而异',
}
const RESPONSE_SPEED_LABELS: Record<string, string> = {
  instant: '秒回', fast: '很快', normal: '正常', slow: '较慢',
}
const SOCIAL_ENERGY_LABELS: Record<string, string> = {
  high: '高能量', medium: '中等', low: '低能量',
}
const EXPRESSION_STYLE_LABELS: Record<string, string> = {
  expressive: '直率表达', reserved: '含蓄内敛',
}
const TOPIC_LABELS: Record<string, string> = {
  daily: '日常生活', work: '工作事业', emotion: '情感心理', hobby: '兴趣爱好',
  future: '未来规划', relationship: '感情话题', food: '美食', travel: '旅行',
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

/** 计算年龄 */
const calcAge = (birthYear: number | null): string => {
  if (!birthYear) return '未填写'
  return `${new Date().getFullYear() - birthYear}岁`
}

/** 格式化身高 */
const formatHeight = (h: number | null): string => {
  if (!h) return '未填写'
  return `${h}cm`
}

/** 格式化数组为标签文本 */
const formatArrayLabels = (arr: string[], labelMap: Record<string, string>): string[] => {
  if (!arr || arr.length === 0) return []
  return arr.map(v => labelMap[v] || v)
}

/** 计算个人档案完成度 */
const calcProfileCompleteness = (profile: UserProfile): { filled: number; total: number; byLayer: Array<{ layer: number; filled: number; total: number }> } => {
  // L1: 基础画像
  const l1Fields = [profile.gender, profile.birthYear, profile.height, profile.occupation, profile.education, profile.location, profile.mbti]
  const l1Filled = l1Fields.filter(v => v !== null && v !== undefined && v !== '').length

  // L2: 性格特质 - personality 默认 50 分不算填写
  const l2Fields = [
    profile.mbti,
    profile.personality.openness !== 50 ? profile.personality.openness : null,
    profile.personality.conscientiousness !== 50 ? profile.personality.conscientiousness : null,
    profile.personality.extraversion !== 50 ? profile.personality.extraversion : null,
    profile.personality.agreeableness !== 50 ? profile.personality.agreeableness : null,
    profile.personality.neuroticism !== 50 ? profile.personality.neuroticism : null,
  ]
  const l2Filled = l2Fields.filter(v => v !== null && v !== undefined).length

  // L3: 情感模式
  const l3Fields = [profile.relationshipGoal, profile.attachmentStyle]
  const l3ArrFields = [profile.loveLanguage]
  const l3Filled = l3Fields.filter(v => v !== null && v !== undefined).length + l3ArrFields.filter(a => a && a.length > 0).length
  const l3Total = l3Fields.length + l3ArrFields.length

  // L4: 行为风格
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

  // 是否为小程序环境（微信 + 抖音）
  const currentEnv = Taro.getEnv()
  const isMiniApp = currentEnv === Taro.ENV_TYPE.WEAPP || currentEnv === Taro.ENV_TYPE.TT

  useDidShow(() => {
    console.log('Profile page shown.')
    loadBasicProfile()
    loadExtendedProfile()
    loadStats()
  })

  // 加载头像和昵称（优先后端，回退本地缓存）
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

  // 加载完整个人档案
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

  // 加载统计数据
  const loadStats = async () => {
    setStatsLoading(true)
    setStatsError(false)
    try {
      const res = await Network.request({ url: '/api/match/list' })
      console.log('Load stats response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const matchData = res.data.data
        const matchList: MatchItem[] = matchData.list || matchData || []
        const totalProgress = matchList.reduce((sum, m) => sum + (m.progressScore || 0), 0)
        const avgProgress = matchList.length > 0 ? Math.round(totalProgress / matchList.length) : 0
        const totalInteractions = matchList.reduce((sum, m) => sum + (m.impression || 0), 0)
        const newStats = { matches: matchList.length, interactions: totalInteractions, avgProgress }
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

  // 根据统计数据动态计算成就解锁状态
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

  // 同步用户资料到后端
  const syncProfileToServer = async (data: Partial<UserProfile>) => {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.nickname !== undefined) updateData.nickname = data.nickname
      await Network.request({ url: '/api/user-profile', method: 'POST', data: updateData })
      console.log('Profile synced to server:', updateData)
    } catch (error) {
      console.error('Sync profile error:', error)
    }
  }

  // 选择头像（小程序）
  const handleChooseAvatar = (e: { detail: { avatarUrl: string } }) => {
    const { avatarUrl } = e.detail
    setProfile(prev => ({ ...prev, avatarUrl }))
    setAvatarFailed(false)
    const saved = Taro.getStorageSync('user_profile') || {}
    Taro.setStorageSync('user_profile', { ...saved, avatarUrl })
    Taro.showToast({ title: '头像已更新', icon: 'success' })
  }

  // H5 端选择头像
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

  // 输入昵称
  const handleInputNickname = (e: { detail: { value: string } }) => {
    const nickname = e.detail.value
    setProfile(prev => ({ ...prev, nickname }))
  }

  // 失焦时保存昵称
  const handleSaveNickname = () => {
    const saved = Taro.getStorageSync('user_profile') || {}
    Taro.setStorageSync('user_profile', { ...saved, nickname: profile.nickname })
    syncProfileToServer({ nickname: profile.nickname })
    Taro.showToast({ title: '昵称已保存', icon: 'success' })
  }

  // 头像加载失败回退
  const handleAvatarError = () => {
    console.log('Avatar image load failed, falling back to default')
    setAvatarFailed(true)
    const newProfile = { ...profile, avatarUrl: '' }
    setProfile(newProfile)
    const saved = Taro.getStorageSync('user_profile') || {}
    Taro.setStorageSync('user_profile', { ...saved, avatarUrl: '' })
  }

  // 折叠/展开层级
  const toggleLayer = useCallback((layer: number) => {
    setExpandedLayers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(layer)) {
        newSet.delete(layer)
      } else {
        newSet.add(layer)
      }
      return newSet
    })
  }, [])

  // 计算档案完成度
  const completeness = calcProfileCompleteness(profile)
  const totalPercent = completeness.total > 0 ? Math.round((completeness.filled / completeness.total) * 100) : 0

  // ============ 渲染 ============

  /** 渲染一条基础信息行 */
  const renderInfoRow = (label: string, value: string | null, Icon: typeof MapPin, isFilled: boolean) => (
    <View className="flex items-center justify-between py-2 border-t border-gray-100">
      <View className="flex items-center gap-2">
        <Icon size={12} color={isFilled ? '#6B7280' : '#D1D5DB'} />
        <Text className="block text-xs text-gray-500">{label}</Text>
      </View>
      <Text className={`block text-xs ${isFilled ? 'text-gray-800 font-medium' : 'text-gray-300'}`}>
        {value || '未填写'}
      </Text>
    </View>
  )

  /** 渲染分数进度条 */
  const renderScoreBar = (label: string, value: number, color: string) => (
    <View className="py-2 border-t border-gray-100">
      <View className="flex items-center justify-between mb-1">
        <Text className="block text-xs text-gray-500">{label}</Text>
        <Text className="block text-xs font-medium text-gray-700">{value}</Text>
      </View>
      <View className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
        <View className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </View>
    </View>
  )

  /** 渲染标签列表 */
  const renderTagList = (items: string[], colorClass: string = 'bg-green-50 text-green-700') => {
    if (!items || items.length === 0) return <Text className="block text-xs text-gray-300">未填写</Text>
    return (
      <View className="flex flex-wrap gap-1 mt-1">
        {items.map(item => (
          <Badge key={item} className={`${colorClass} text-xs`}>{item}</Badge>
        ))}
      </View>
    )
  }

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      {/* ====== 头部卡片 ====== */}
      <View className="p-4">
        <Card className="shadow-soft border-0 bg-green-500">
          <CardContent className="p-6">
            <View className="flex items-center gap-4">
              {/* 头像选择 */}
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

              {/* 昵称 + 标签 */}
              <View className="flex-1">
                <View className="bg-transparent rounded-lg">
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
              <ChevronRight size={20} color="#fff" />
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

        {/* 维度层级卡片 */}
        {[1, 2, 3, 4].map(layer => {
          const config = LAYER_CONFIG[layer]
          const LayerIcon = config.icon
          const isExpanded = expandedLayers.has(layer)
          const layerComp = completeness.byLayer.find(l => l.layer === layer)
          const layerPercent = layerComp && layerComp.total > 0 ? Math.round((layerComp.filled / layerComp.total) * 100) : 0

          return (
            <Card key={layer} className="shadow-soft border-0 mb-3">
              {/* 层级标题 */}
              <CardContent className="p-0">
                <View
                  className="flex items-center justify-between p-4"
                  onClick={() => toggleLayer(layer)}
                >
                  <View className="flex items-center gap-3">
                    <View className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
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

                {/* 展开后的详细内容 */}
                {isExpanded && (
                  <View className="px-4 pb-4">
                    {/* L1: 基础画像 */}
                    {layer === 1 && (
                      <View>
                        {renderInfoRow('性别', GENDER_LABELS[profile.gender || ''] || null, User, !!profile.gender)}
                        {renderInfoRow('年龄', calcAge(profile.birthYear), Clock, !!profile.birthYear)}
                        {renderInfoRow('身高', formatHeight(profile.height), Compass, !!profile.height)}
                        {renderInfoRow('职业', profile.occupation, Briefcase, !!profile.occupation)}
                        {renderInfoRow('学历', EDUCATION_LABELS[profile.education || ''] || null, GraduationCap, !!profile.education)}
                        {renderInfoRow('所在地', profile.location, MapPin, !!profile.location)}
                        {renderInfoRow('MBTI', profile.mbti, Brain, !!profile.mbti)}
                      </View>
                    )}

                    {/* L2: 性格特质 */}
                    {layer === 2 && (
                      <View>
                        {profile.mbti && (
                          <View className="mb-3 p-3 bg-violet-50 rounded-lg">
                            <View className="flex items-center gap-2">
                              <Text className="block text-lg font-bold text-violet-700">{profile.mbti}</Text>
                              <Pencil size={12} color="#8B5CF6" />
                            </View>
                          </View>
                        )}
                        {renderScoreBar('开放性', profile.personality.openness, 'bg-blue-500')}
                        {renderScoreBar('尽责性', profile.personality.conscientiousness, 'bg-green-500')}
                        {renderScoreBar('外向性', profile.personality.extraversion, 'bg-amber-500')}
                        {renderScoreBar('宜人性', profile.personality.agreeableness, 'bg-pink-500')}
                        {renderScoreBar('神经质', profile.personality.neuroticism, 'bg-violet-500')}
                      </View>
                    )}

                    {/* L3: 情感模式 */}
                    {layer === 3 && (
                      <View>
                        {renderInfoRow('恋爱目标', RELATIONSHIP_GOAL_LABELS[profile.relationshipGoal || ''] || null, Heart, !!profile.relationshipGoal)}
                        {renderInfoRow('依恋风格', ATTACHMENT_STYLE_LABELS[profile.attachmentStyle || ''] || null, Shield, !!profile.attachmentStyle)}
                        <View className="py-2 border-t border-gray-100">
                          <Text className="block text-xs text-gray-500 mb-1">爱的语言</Text>
                          {renderTagList(formatArrayLabels(profile.loveLanguage, LOVE_LANGUAGE_LABELS), 'bg-pink-50 text-pink-700')}
                        </View>
                        {renderScoreBar('情绪稳定性', profile.emotional.stability, 'bg-blue-400')}
                        {renderScoreBar('情感表达', profile.emotional.expression, 'bg-pink-400')}
                        {renderScoreBar('共情能力', profile.emotional.empathy, 'bg-violet-400')}
                      </View>
                    )}

                    {/* L4: 行为风格 */}
                    {layer === 4 && (
                      <View>
                        {profile.behavior && (
                          <>
                            {renderInfoRow('沟通风格', COMMUNICATION_STYLE_LABELS[profile.behavior.communicationStyle || ''] || null, MessageCircle, !!profile.behavior.communicationStyle)}
                            {renderInfoRow('线上风格', COMMUNICATION_STYLE_LABELS[profile.behavior.communicationStyleOnline || ''] || null, MessageCircle, !!profile.behavior.communicationStyleOnline)}
                            {renderInfoRow('线下风格', COMMUNICATION_STYLE_LABELS[profile.behavior.communicationStyleOffline || ''] || null, MessageCircle, !!profile.behavior.communicationStyleOffline)}
                            {renderInfoRow('回复速度', RESPONSE_SPEED_LABELS[profile.behavior.responseSpeed || ''] || null, Clock, !!profile.behavior.responseSpeed)}
                            {renderInfoRow('社交能量', SOCIAL_ENERGY_LABELS[profile.behavior.socialEnergy || ''] || null, Users, !!profile.behavior.socialEnergy)}
                            {renderInfoRow('表达风格', EXPRESSION_STYLE_LABELS[profile.behavior.expressionStyle || ''] || null, Palette, !!profile.behavior.expressionStyle)}
                            <View className="py-2 border-t border-gray-100">
                              <Text className="block text-xs text-gray-500 mb-1">常聊话题</Text>
                              {renderTagList(formatArrayLabels(profile.behavior.preferredTopics || [], TOPIC_LABELS), 'bg-green-50 text-green-700')}
                            </View>
                          </>
                        )}
                        <View className="py-2 border-t border-gray-100">
                          <Text className="block text-xs text-gray-500 mb-1">兴趣爱好</Text>
                          {renderTagList(formatArrayLabels(profile.hobbies, HOBBY_LABELS), 'bg-blue-50 text-blue-700')}
                        </View>
                        <View className="py-2 border-t border-gray-100">
                          <Text className="block text-xs text-gray-500 mb-1">关注领域</Text>
                          {renderTagList(formatArrayLabels(profile.interests, INTEREST_LABELS), 'bg-violet-50 text-violet-700')}
                        </View>
                        <View className="py-2 border-t border-gray-100">
                          <Text className="block text-xs text-gray-500 mb-1">期待特质</Text>
                          {renderTagList(formatArrayLabels(profile.preferredTraits, TRAIT_LABELS), 'bg-amber-50 text-amber-700')}
                        </View>
                        {profile.dealBreakers && profile.dealBreakers.length > 0 && (
                          <View className="py-2 border-t border-gray-100">
                            <Text className="block text-xs text-gray-500 mb-1">雷区</Text>
                            {renderTagList(formatArrayLabels(profile.dealBreakers, DEALBREAKER_LABELS), 'bg-red-50 text-red-700')}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </CardContent>
            </Card>
          )
        })}
      </View>

      {/* ====== 编辑档案入口 ====== */}
      <View className="px-4 pb-4">
        <Card className="shadow-soft border-0">
          <CardContent className="p-4">
            <View
              className="flex items-center gap-4"
              onClick={() => Taro.navigateTo({ url: '/pages/user-profile/index' })}
            >
              <View className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                <FileText size={24} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="block font-semibold text-gray-800">编辑我的档案</Text>
                <Text className="block text-sm text-gray-500">完善个人画像，获得更精准的AI建议</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 版本信息 */}
      <View className="p-4 text-center">
        <Text className="block text-xs text-gray-400">知拌 v1.0.0</Text>
      </View>
    </View>
  )
}

export default ProfilePage
