import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Loader, User, Heart, Sparkles, MessageCircle, Save, Target, X } from 'lucide-react-taro'

interface UserProfile {
  nickname: string | null
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
  confidence: number
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
  lastUpdated: string
}

const defaultProfile: UserProfile = {
  nickname: null,
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
  confidence: 0,
  lastUpdated: new Date().toISOString(),
}

const genderOptions = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
]

const relationshipGoalOptions = [
  { value: 'serious', label: '认真恋爱', desc: '寻求长期稳定的关系' },
  { value: 'casual', label: '轻松交友', desc: '先接触了解，顺其自然' },
  { value: 'marriage', label: '奔着结婚', desc: '以结婚为目标交往' },
]

const attachmentStyleOptions = [
  { value: 'secure', label: '安全型', desc: '信任对方，能平衡亲密与独立' },
  { value: 'anxious', label: '焦虑型', desc: '需要更多确认和安全感' },
  { value: 'avoidant', label: '回避型', desc: '倾向于保持距离，害怕亲密' },
]

const loveLanguageOptions = [
  { value: 'quality_time', label: '陪伴', icon: '⏰' },
  { value: 'words', label: '肯定', icon: '💬' },
  { value: 'gifts', label: '礼物', icon: '🎁' },
  { value: 'acts', label: '服务', icon: '🤝' },
  { value: 'touch', label: '接触', icon: '🤗' },
]

const communicationStyleOnlineOptions = [
  { value: 'direct', label: '直接坦率', desc: '打字直来直去，不绕弯子' },
  { value: 'playful', label: '活泼调皮', desc: '喜欢发表情包、玩梗、开玩笑' },
  { value: 'gentle', label: '温柔体贴', desc: '语气柔和，关心对方感受' },
  { value: 'rational', label: '理性冷静', desc: '逻辑清晰，偏分析讨论' },
  { value: 'indirect', label: '委婉含蓄', desc: '话中有话，暗示多于明说' },
  { value: 'variable', label: '因人而异', desc: '不同人面前风格不同' },
]

const communicationStyleOfflineOptions = [
  { value: 'direct', label: '直接坦率', desc: '当面直言不讳' },
  { value: 'playful', label: '活泼调皮', desc: '见面话多、爱互动、气氛担当' },
  { value: 'gentle', label: '温柔体贴', desc: '善解人意、照顾对方感受' },
  { value: 'rational', label: '理性冷静', desc: '沉着稳重，说话有条理' },
  { value: 'indirect', label: '委婉含蓄', desc: '当面反而不太说话，比较慢热' },
  { value: 'variable', label: '因人而异', desc: '不同人面前风格不同' },
]

const responseSpeedOptions = [
  { value: 'instant', label: '秒回', desc: '几乎立刻回复' },
  { value: 'fast', label: '很快', desc: '几分钟内回复' },
  { value: 'normal', label: '正常', desc: '半小时左右' },
  { value: 'slow', label: '较慢', desc: '几小时才回复' },
]

const socialEnergyOptions = [
  { value: 'high', label: '高能量', desc: '喜欢社交，精力充沛' },
  { value: 'medium', label: '中等', desc: '适度社交，需要平衡' },
  { value: 'low', label: '低能量', desc: '更喜欢独处或小圈子' },
]

const timeSlotOptions = [
  { value: 'morning', label: '上午', icon: '🌅' },
  { value: 'afternoon', label: '下午', icon: '☀️' },
  { value: 'evening', label: '晚上', icon: '🌙' },
  { value: 'night', label: '深夜', icon: '🦉' },
]

const educationOptions = [
  { value: 'high_school', label: '高中及以下' },
  { value: 'college', label: '大专' },
  { value: 'bachelor', label: '本科' },
  { value: 'master', label: '硕士' },
  { value: 'phd', label: '博士' },
]

const expressionStyleOptions = [
  { value: 'expressive', label: '直率表达', desc: '喜欢直接表达想法和感受' },
  { value: 'reserved', label: '含蓄内敛', desc: '比较含蓄，不喜欢太直白' },
]

// MBTI 类型选项
const mbtiOptions = [
  { value: 'INTJ', label: 'INTJ', desc: '建筑师 - 富有想象力的战略家' },
  { value: 'INTP', label: 'INTP', desc: '逻辑学家 - 创新的发明家' },
  { value: 'ENTJ', label: 'ENTJ', desc: '指挥官 - 大胆的领导者' },
  { value: 'ENTP', label: 'ENTP', desc: '辩论家 - 聪明的探索者' },
  { value: 'INFJ', label: 'INFJ', desc: '提倡者 - 安静的理想主义者' },
  { value: 'INFP', label: 'INFP', desc: '调停者 - 诗意的理想家' },
  { value: 'ENFJ', label: 'ENFJ', desc: '主人公 - 富有魅力的领袖' },
  { value: 'ENFP', label: 'ENFP', desc: '竞选者 - 热情的探索者' },
  { value: 'ISTJ', label: 'ISTJ', desc: '物流师 - 可靠的实干家' },
  { value: 'ISFJ', label: 'ISFJ', desc: '守卫者 - 专注的守护者' },
  { value: 'ESTJ', label: 'ESTJ', desc: '总经理 - 高效的管理者' },
  { value: 'ESFJ', label: 'ESFJ', desc: '执政官 - 热心的助人者' },
  { value: 'ISTP', label: 'ISTP', desc: '鉴赏家 - 大胆的实验者' },
  { value: 'ISFP', label: 'ISFP', desc: '探险家 - 灵活的艺术家' },
  { value: 'ESTP', label: 'ESTP', desc: '企业家 - 精明的冒险者' },
  { value: 'ESFP', label: 'ESFP', desc: '表演者 - 自发的娱乐者' },
]

const hobbyOptions = [
  { value: 'reading', label: '阅读', icon: '📚' },
  { value: 'music', label: '音乐', icon: '🎵' },
  { value: 'movie', label: '电影', icon: '🎬' },
  { value: 'game', label: '游戏', icon: '🎮' },
  { value: 'sports', label: '运动', icon: '🏃' },
  { value: 'travel', label: '旅行', icon: '✈️' },
  { value: 'food', label: '美食', icon: '🍜' },
  { value: 'photography', label: '摄影', icon: '📷' },
  { value: 'art', label: '艺术', icon: '🎨' },
  { value: 'pet', label: '宠物', icon: '🐱' },
]

const interestOptions = [
  { value: 'tech', label: '科技', icon: '💻' },
  { value: 'finance', label: '金融', icon: '📊' },
  { value: 'fashion', label: '时尚', icon: '👗' },
  { value: 'health', label: '健康养生', icon: '🧘' },
  { value: 'psychology', label: '心理学', icon: '🧠' },
  { value: 'history', label: '历史', icon: '🏛️' },
  { value: 'nature', label: '自然', icon: '🌿' },
  { value: 'car', label: '汽车', icon: '🚗' },
]

const preferredTraitOptions = [
  { value: 'kind', label: '善良' },
  { value: 'smart', label: '聪明' },
  { value: 'funny', label: '幽默' },
  { value: 'responsible', label: '有责任感' },
  { value: 'ambitious', label: '有上进心' },
  { value: 'gentle', label: '温柔' },
  { value: 'confident', label: '自信' },
  { value: 'independent', label: '独立' },
  { value: 'family_oriented', label: '顾家' },
  { value: 'open_minded', label: '思想开放' },
]

const dealBreakerOptions = [
  { value: 'smoking', label: '抽烟' },
  { value: 'drinking', label: '酗酒' },
  { value: 'gambling', label: '赌博' },
  { value: 'cheating', label: '不忠诚' },
  { value: 'controlling', label: '控制欲强' },
  { value: 'lazy', label: '懒惰' },
  { value: 'rude', label: '不尊重人' },
  { value: 'jealous', label: '爱吃醋' },
]

const topicOptions = [
  { value: 'daily', label: '日常生活', icon: '☀️' },
  { value: 'work', label: '工作事业', icon: '💼' },
  { value: 'emotion', label: '情感心理', icon: '💗' },
  { value: 'hobby', label: '兴趣爱好', icon: '🎯' },
  { value: 'future', label: '未来规划', icon: '🔮' },
  { value: 'relationship', label: '感情话题', icon: '💕' },
  { value: 'food', label: '美食', icon: '🍽️' },
  { value: 'travel', label: '旅行', icon: '🌍' },
]

const UserProfilePage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [activeSection, setActiveSection] = useState<'basic' | 'personality' | 'relationship' | 'interests' | 'expectation' | 'behavior'>('basic')

  useLoad(() => {
    fetchProfile()
  })

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/user-profile',
        method: 'GET',
      })

      if (res.data?.code === 200 && res.data?.data) {
        setProfile(res.data.data)
      }
    } catch (error) {
      console.error('Fetch profile error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await Network.request({
        url: '/api/user-profile',
        method: 'POST',
        data: profile,
      })

      if (res.data?.code === 200) {
        Taro.showToast({ title: '保存成功', icon: 'success' })
        if (res.data?.data) {
          setProfile(res.data.data)
        }
      }
    } catch (error) {
      console.error('Save profile error:', error)
      Taro.showToast({ title: '保存失败', icon: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }

  const toggleArrayItem = (key: 'loveLanguage' | 'hobbies' | 'interests' | 'preferredTraits' | 'dealBreakers', value: string) => {
    setProfile(prev => {
      const arr = prev[key] as string[]
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      }
    })
  }

  const toggleBehaviorArray = (key: 'activeTimeSlots' | 'preferredTopics', value: string) => {
    setProfile(prev => {
      const arr = prev.behavior?.[key] || []
      const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      return {
        ...prev,
        behavior: { ...prev.behavior, [key]: newArr } as any,
      }
    })
  }

  if (loading) {
    return (
      <View className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F8FA' }}>
        <Loader size={24} color="#6B7280" className="animate-spin" />
      </View>
    )
  }

  return (
    <View className="min-h-screen pb-24" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="我的档案" />

      {/* 置信度提示 */}
      <View className="px-4 pt-4">
        <View className="flex items-center justify-between bg-white rounded-xl p-3">
          <View className="flex items-center gap-3">
            <User size={16} color="#6B7280" />
            <Text className="block text-sm text-gray-600">
              档案完整度 {profile.confidence}%
            </Text>
          </View>
          <Text className="block text-xs text-gray-400">
            完善档案可获得更精准的建议
          </Text>
        </View>
      </View>

      {/* Tab 切换 */}
      <View className="px-4 pt-4">
        <ScrollView scrollX className="whitespace-nowrap">
          <View className="flex bg-gray-100 rounded-lg p-1 inline-flex min-w-full">
            {[
              { key: 'basic', label: '基本信息' },
              { key: 'personality', label: '性格情感' },
              { key: 'relationship', label: '恋爱观' },
              { key: 'interests', label: '兴趣爱好' },
              { key: 'expectation', label: '期望对象' },
              { key: 'behavior', label: '行为偏好' },
            ].map((tab) => (
              <View
                key={tab.key}
                className={`flex-shrink-0 px-3 py-2 rounded-md text-center ${
                  activeSection === tab.key ? 'bg-white shadow-sm' : ''
                }`}
                onClick={() => setActiveSection(tab.key as typeof activeSection)}
              >
                <Text
                  className={`block text-sm ${
                    activeSection === tab.key ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 基本信息 */}
      {activeSection === 'basic' && (
        <View className="p-4">
          <View className="bg-white rounded-2xl shadow-soft p-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-4">基本信息</Text>

            {/* 昵称 */}
            <View className="mb-4">
              <Text className="block text-xs text-gray-500 mb-2">昵称</Text>
              <View className="bg-gray-50 rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent text-sm"
                  placeholder="请输入昵称"
                  value={profile.nickname || ''}
                  onInput={(e) => updateProfile({ nickname: e.detail.value })}
                  maxlength={20}
                />
              </View>
            </View>

            {/* 性别 */}
            <View className="mb-4">
              <Text className="block text-xs text-gray-500 mb-2">性别</Text>
              <View className="flex gap-4">
                {genderOptions.map((option) => (
                  <View
                    key={option.value}
                    className={`flex-1 py-3 rounded-lg text-center ${
                      profile.gender === option.value ? 'bg-green-500' : 'bg-gray-50'
                    }`}
                    onClick={() => updateProfile({ gender: option.value as 'male' | 'female' })}
                  >
                    <Text className={`block text-sm ${profile.gender === option.value ? 'text-white' : 'text-gray-700'}`}>
                      {option.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 出生年份 */}
            <View className="mb-4">
              <Text className="block text-xs text-gray-500 mb-2">出生年份</Text>
              <View className="bg-gray-50 rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent text-sm"
                  placeholder="例如：1995"
                  value={profile.birthYear?.toString() || ''}
                  onInput={(e) => updateProfile({ birthYear: parseInt(e.detail.value) || null })}
                  maxlength={4}
                  type="number"
                />
              </View>
            </View>

            {/* 身高 */}
            <View className="mb-4">
              <Text className="block text-xs text-gray-500 mb-2">身高 (cm)</Text>
              <View className="bg-gray-50 rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent text-sm"
                  placeholder="例如：175"
                  value={profile.height?.toString() || ''}
                  onInput={(e) => updateProfile({ height: parseInt(e.detail.value) || null })}
                  maxlength={3}
                  type="number"
                />
              </View>
            </View>

            {/* 学历 */}
            <View className="mb-4">
              <Text className="block text-xs text-gray-500 mb-2">学历</Text>
              <View className="flex flex-wrap gap-3">
                {educationOptions.map((option) => (
                  <View
                    key={option.value}
                    className={`px-3 py-2 rounded-lg border ${
                      profile.education === option.value ? 'border-green-500 bg-green-50' : 'bg-gray-50'
                    }`}
                    onClick={() => updateProfile({ education: option.value })}
                  >
                    <Text className="block text-sm text-gray-700">{option.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 职业 */}
            <View className="mb-4">
              <Text className="block text-xs text-gray-500 mb-2">职业</Text>
              <View className="bg-gray-50 rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent text-sm"
                  placeholder="例如：产品经理"
                  value={profile.occupation || ''}
                  onInput={(e) => updateProfile({ occupation: e.detail.value })}
                  maxlength={32}
                />
              </View>
            </View>

            {/* 所在地 */}
            <View className="mb-4">
              <Text className="block text-xs text-gray-500 mb-2">所在地</Text>
              <View className="bg-gray-50 rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent text-sm"
                  placeholder="例如：北京"
                  value={profile.location || ''}
                  onInput={(e) => updateProfile({ location: e.detail.value })}
                  maxlength={32}
                />
              </View>
            </View>

            {/* 自我介绍 */}
            <View className="mb-4">
              <Text className="block text-xs text-gray-500 mb-2">自我介绍</Text>
              <View className="bg-gray-50 rounded-lg px-4 py-3">
                <Textarea
                  className="w-full bg-transparent text-sm"
                  placeholder="写几句话介绍自己..."
                  value={profile.bio || ''}
                  onInput={(e) => updateProfile({ bio: e.detail.value })}
                  maxlength={500}
                />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 性格情感 */}
      {activeSection === 'personality' && (
        <View className="p-4">
          {/* 性格自评说明 */}
          <View className="bg-gray-50 rounded-xl p-3 mb-4">
            <Text className="block text-sm text-gray-600">
              💡 拖动滑块评估自己在每个维度上的倾向。这些信息会帮助AI更好地理解你，提供更贴合你性格的建议。
            </Text>
          </View>

          {/* MBTI 选择 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <View className="flex items-center gap-3 mb-4">
              <Text className="block text-sm font-semibold text-gray-900">MBTI 人格类型</Text>
              <Text className="block text-xs text-gray-400 ml-auto">选填</Text>
            </View>
            <Text className="block text-xs text-gray-400 mb-4">选择你的 MBTI 类型，帮助 AI 更精准地理解你的性格</Text>
            <View className="grid grid-cols-4 gap-3">
              {mbtiOptions.map((option) => (
                <View
                  key={option.value}
                  className={`rounded-lg p-2 text-center ${
                    profile.mbti === option.value
                      ? 'bg-blue-500 border-2 border-blue-500'
                      : 'bg-gray-50'
                  }`}
                  onClick={() => updateProfile({ mbti: profile.mbti === option.value ? null : option.value })}
                >
                  <Text
                    className={`block text-sm font-medium ${
                      profile.mbti === option.value ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </Text>
                </View>
              ))}
            </View>
            {profile.mbti && (
              <View className="mt-3 bg-blue-50 rounded-lg p-2">
                <Text className="block text-xs text-blue-600">
                  {mbtiOptions.find(o => o.value === profile.mbti)?.desc}
                </Text>
              </View>
            )}
          </View>

          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <View className="flex items-center gap-3 mb-4">
              <Sparkles size={16} color="#6B7280" />
              <Text className="block text-sm font-semibold text-gray-900">性格自评</Text>
              <Text className="block text-xs text-gray-400 ml-auto">基于五大人格理论</Text>
            </View>

            {/* 开放性 */}
            <View className="mb-6">
              <View className="mb-2">
                <Text className="block text-sm font-medium text-gray-800">开放性</Text>
                <Text className="block text-xs text-gray-400 mt-1">你对新事物、新想法的接受程度</Text>
              </View>
              <View className="flex items-center justify-between mb-1">
                <Text className="block text-xs text-gray-500">保守传统</Text>
                <Text className="block text-xs font-medium text-gray-700">{profile.personality.openness}</Text>
                <Text className="block text-xs text-gray-500">开放创新</Text>
              </View>
              <Slider
                className="w-full"
                min={0}
                max={100}
                value={[profile.personality.openness]}
                onValueChange={(value) => setProfile(prev => ({
                  ...prev,
                  personality: { ...prev.personality, openness: value[0] }
                }))}
              />
            </View>

            {/* 尽责性 */}
            <View className="mb-6">
              <View className="mb-2">
                <Text className="block text-sm font-medium text-gray-800">尽责性</Text>
                <Text className="block text-xs text-gray-400 mt-1">你的自律程度、目标感和执行力</Text>
              </View>
              <View className="flex items-center justify-between mb-1">
                <Text className="block text-xs text-gray-500">随性自由</Text>
                <Text className="block text-xs font-medium text-gray-700">{profile.personality.conscientiousness}</Text>
                <Text className="block text-xs text-gray-500">自律尽责</Text>
              </View>
              <Slider
                className="w-full"
                min={0}
                max={100}
                value={[profile.personality.conscientiousness]}
                onValueChange={(value) => setProfile(prev => ({
                  ...prev,
                  personality: { ...prev.personality, conscientiousness: value[0] }
                }))}
              />
            </View>

            {/* 外向性 */}
            <View className="mb-6">
              <View className="mb-2">
                <Text className="block text-sm font-medium text-gray-800">外向性</Text>
                <Text className="block text-xs text-gray-400 mt-1">你在社交场合的能量来源和表现</Text>
              </View>
              <View className="flex items-center justify-between mb-1">
                <Text className="block text-xs text-gray-500">内向沉稳</Text>
                <Text className="block text-xs font-medium text-gray-700">{profile.personality.extraversion}</Text>
                <Text className="block text-xs text-gray-500">外向活跃</Text>
              </View>
              <Slider
                className="w-full"
                min={0}
                max={100}
                value={[profile.personality.extraversion]}
                onValueChange={(value) => setProfile(prev => ({
                  ...prev,
                  personality: { ...prev.personality, extraversion: value[0] }
                }))}
              />
            </View>

            {/* 宜人性 */}
            <View className="mb-6">
              <View className="mb-2">
                <Text className="block text-sm font-medium text-gray-800">宜人性</Text>
                <Text className="block text-xs text-gray-400 mt-1">你与他人相处时的态度和方式</Text>
              </View>
              <View className="flex items-center justify-between mb-1">
                <Text className="block text-xs text-gray-500">直接有主见</Text>
                <Text className="block text-xs font-medium text-gray-700">{profile.personality.agreeableness}</Text>
                <Text className="block text-xs text-gray-500">温和友善</Text>
              </View>
              <Slider
                className="w-full"
                min={0}
                max={100}
                value={[profile.personality.agreeableness]}
                onValueChange={(value) => setProfile(prev => ({
                  ...prev,
                  personality: { ...prev.personality, agreeableness: value[0] }
                }))}
              />
            </View>

            {/* 神经质 */}
            <View className="mb-2">
              <View className="mb-2">
                <Text className="block text-sm font-medium text-gray-800">情绪敏感性</Text>
                <Text className="block text-xs text-gray-400 mt-1">你对压力和负面情绪的敏感程度</Text>
              </View>
              <View className="flex items-center justify-between mb-1">
                <Text className="block text-xs text-gray-500">情绪稳定</Text>
                <Text className="block text-xs font-medium text-gray-700">{profile.personality.neuroticism}</Text>
                <Text className="block text-xs text-gray-500">情绪敏感</Text>
              </View>
              <Slider
                className="w-full"
                min={0}
                max={100}
                value={[profile.personality.neuroticism]}
                onValueChange={(value) => setProfile(prev => ({
                  ...prev,
                  personality: { ...prev.personality, neuroticism: value[0] }
                }))}
              />
            </View>
          </View>

          <View className="bg-white rounded-2xl shadow-soft p-4">
            <View className="flex items-center gap-3 mb-4">
              <Heart size={16} color="#6B7280" />
              <Text className="block text-sm font-semibold text-gray-900">情感特点</Text>
            </View>

            {/* 情绪稳定性 */}
            <View className="mb-6">
              <View className="mb-2">
                <Text className="block text-sm font-medium text-gray-800">情绪稳定性</Text>
                <Text className="block text-xs text-gray-400 mt-1">情绪波动的频率和幅度</Text>
              </View>
              <View className="flex items-center justify-between mb-1">
                <Text className="block text-xs text-gray-500">波动较大</Text>
                <Text className="block text-xs font-medium text-gray-700">{profile.emotional.stability}</Text>
                <Text className="block text-xs text-gray-500">稳定平和</Text>
              </View>
              <Slider
                className="w-full"
                min={0}
                max={100}
                value={[profile.emotional.stability]}
                onValueChange={(value) => setProfile(prev => ({
                  ...prev,
                  emotional: { ...prev.emotional, stability: value[0] }
                }))}
              />
            </View>

            {/* 情感表达 */}
            <View className="mb-6">
              <View className="mb-2">
                <Text className="block text-sm font-medium text-gray-800">情感表达</Text>
                <Text className="block text-xs text-gray-400 mt-1">你表达情感的方式和频率</Text>
              </View>
              <View className="flex items-center justify-between mb-1">
                <Text className="block text-xs text-gray-500">含蓄内敛</Text>
                <Text className="block text-xs font-medium text-gray-700">{profile.emotional.expression}</Text>
                <Text className="block text-xs text-gray-500">善于表达</Text>
              </View>
              <Slider
                className="w-full"
                min={0}
                max={100}
                value={[profile.emotional.expression]}
                onValueChange={(value) => setProfile(prev => ({
                  ...prev,
                  emotional: { ...prev.emotional, expression: value[0] }
                }))}
              />
            </View>

            {/* 共情能力 */}
            <View className="mb-2">
              <View className="mb-2">
                <Text className="block text-sm font-medium text-gray-800">共情能力</Text>
                <Text className="block text-xs text-gray-400 mt-1">理解和感受他人情绪的能力</Text>
              </View>
              <View className="flex items-center justify-between mb-1">
                <Text className="block text-xs text-gray-500">理性客观</Text>
                <Text className="block text-xs font-medium text-gray-700">{profile.emotional.empathy}</Text>
                <Text className="block text-xs text-gray-500">共情细腻</Text>
              </View>
              <Slider
                className="w-full"
                min={0}
                max={100}
                value={[profile.emotional.empathy]}
                onValueChange={(value) => setProfile(prev => ({
                  ...prev,
                  emotional: { ...prev.emotional, empathy: value[0] }
                }))}
              />
            </View>
          </View>
        </View>
      )}

      {/* 恋爱观 */}
      {activeSection === 'relationship' && (
        <View className="p-4">
          {/* 恋爱目标 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-4">恋爱目标</Text>
            <View className="space-y-2">
              {relationshipGoalOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    profile.relationshipGoal === option.value ? 'border-green-500 bg-green-50' : 'bg-gray-50'
                  }`}
                  onClick={() => updateProfile({ relationshipGoal: option.value as any })}
                >
                  <View>
                    <Text className="block text-sm text-gray-800">{option.label}</Text>
                    <Text className="block text-xs text-gray-400">{option.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 依恋类型 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-4">依恋类型</Text>
            <View className="space-y-2">
              {attachmentStyleOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    profile.attachmentStyle === option.value ? 'border-green-500 bg-green-50' : 'bg-gray-50'
                  }`}
                  onClick={() => updateProfile({ attachmentStyle: option.value as any })}
                >
                  <View>
                    <Text className="block text-sm text-gray-800">{option.label}</Text>
                    <Text className="block text-xs text-gray-400">{option.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 爱的语言 */}
          <View className="bg-white rounded-2xl shadow-soft p-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-4">爱的语言（可多选）</Text>
            <View className="flex flex-wrap gap-3">
              {loveLanguageOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border ${
                    profile.loveLanguage.includes(option.value) ? 'border-green-500 bg-green-50' : 'bg-gray-50'
                  }`}
                  onClick={() => toggleArrayItem('loveLanguage', option.value)}
                >
                  <Text className="block text-base">{option.icon}</Text>
                  <Text className="block text-sm text-gray-700">{option.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 兴趣爱好 */}
      {activeSection === 'interests' && (
        <View className="p-4">
          {/* 爱好 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <View className="flex items-center gap-3 mb-4">
              <Heart size={14} color="#6B7280" />
              <Text className="block text-sm font-semibold text-gray-900">爱好（可多选）</Text>
            </View>
            <View className="flex flex-wrap gap-3">
              {hobbyOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border ${
                    profile.hobbies.includes(option.value) ? 'border-green-500 bg-green-50' : 'bg-gray-50'
                  }`}
                  onClick={() => toggleArrayItem('hobbies', option.value)}
                >
                  <Text className="block text-base">{option.icon}</Text>
                  <Text className="block text-sm text-gray-700">{option.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 兴趣领域 */}
          <View className="bg-white rounded-2xl shadow-soft p-4">
            <View className="flex items-center gap-3 mb-4">
              <Sparkles size={14} color="#6B7280" />
              <Text className="block text-sm font-semibold text-gray-900">兴趣领域（可多选）</Text>
            </View>
            <View className="flex flex-wrap gap-3">
              {interestOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border ${
                    profile.interests.includes(option.value) ? 'border-green-500 bg-green-50' : 'bg-gray-50'
                  }`}
                  onClick={() => toggleArrayItem('interests', option.value)}
                >
                  <Text className="block text-base">{option.icon}</Text>
                  <Text className="block text-sm text-gray-700">{option.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 期望对象 */}
      {activeSection === 'expectation' && (
        <View className="p-4">
          {/* 期望特质 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <View className="flex items-center gap-3 mb-4">
              <Target size={14} color="#6B7280" />
              <Text className="block text-sm font-semibold text-gray-900">期望的特质（可多选）</Text>
            </View>
            <View className="flex flex-wrap gap-3">
              {preferredTraitOptions.map((option) => (
                <View
                  key={option.value}
                  className={`px-3 py-2 rounded-lg border ${
                    profile.preferredTraits.includes(option.value) ? 'border-green-500 bg-green-50' : 'bg-gray-50'
                  }`}
                  onClick={() => toggleArrayItem('preferredTraits', option.value)}
                >
                  <Text className="block text-sm text-gray-700">{option.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 不能接受的点 */}
          <View className="bg-white rounded-2xl shadow-soft p-4">
            <View className="flex items-center gap-3 mb-4">
              <X size={14} color="#6B7280" />
              <Text className="block text-sm font-semibold text-gray-900">不能接受的点（可多选）</Text>
            </View>
            <View className="flex flex-wrap gap-3">
              {dealBreakerOptions.map((option) => (
                <View
                  key={option.value}
                  className={`px-3 py-2 rounded-lg border ${
                    profile.dealBreakers.includes(option.value) ? 'border-green-500 bg-green-50' : 'bg-gray-50'
                  }`}
                  onClick={() => toggleArrayItem('dealBreakers', option.value)}
                >
                  <Text className="block text-sm text-gray-700">{option.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 行为偏好 */}
      {activeSection === 'behavior' && (
        <View className="p-4">
          {/* 线上沟通风格 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <View className="flex items-center gap-3 mb-1">
              <MessageCircle size={14} color="#3B82F6" />
              <Text className="block text-sm font-semibold text-gray-900">线上沟通风格</Text>
            </View>
            <Text className="block text-xs text-gray-400 mb-4">微信/电话等线上场景</Text>
            <View className="space-y-2">
              {communicationStyleOnlineOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    profile.behavior?.communicationStyleOnline === option.value ? 'border-blue-500 bg-blue-50' : 'bg-gray-50'
                  }`}
                  onClick={() => setProfile(prev => ({
                    ...prev,
                    behavior: { ...prev.behavior, communicationStyleOnline: option.value as any } as any,
                  }))}
                >
                  <View>
                    <Text className="block text-sm text-gray-800">{option.label}</Text>
                    <Text className="block text-xs text-gray-400">{option.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 线下沟通风格 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <View className="flex items-center gap-3 mb-1">
              <MessageCircle size={14} color="#F97316" />
              <Text className="block text-sm font-semibold text-gray-900">线下沟通风格</Text>
            </View>
            <Text className="block text-xs text-gray-400 mb-4">见面时的沟通方式</Text>
            <View className="space-y-2">
              {communicationStyleOfflineOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    profile.behavior?.communicationStyleOffline === option.value ? 'border-green-500 bg-white' : 'bg-gray-50'
                  }`}
                  onClick={() => setProfile(prev => ({
                    ...prev,
                    behavior: { ...prev.behavior, communicationStyleOffline: option.value as any } as any,
                  }))}
                >
                  <View>
                    <Text className="block text-sm text-gray-800">{option.label}</Text>
                    <Text className="block text-xs text-gray-400">{option.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
            {profile.behavior?.communicationStyleOnline && profile.behavior?.communicationStyleOffline &&
             profile.behavior.communicationStyleOnline !== profile.behavior.communicationStyleOffline && (
              <View className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200">
                <Text className="block text-xs text-amber-700">线上线下风格不同，很多人都有这种反差</Text>
              </View>
            )}
          </View>

          {/* 回复速度 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-4">你通常多久回复消息？</Text>
            <View className="space-y-2">
              {responseSpeedOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    profile.behavior?.responseSpeed === option.value ? 'border-green-500 bg-green-50' : 'bg-gray-50'
                  }`}
                  onClick={() => setProfile(prev => ({
                    ...prev,
                    behavior: { ...prev.behavior, responseSpeed: option.value as any } as any,
                  }))}
                >
                  <View>
                    <Text className="block text-sm text-gray-800">{option.label}</Text>
                    <Text className="block text-xs text-gray-400">{option.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 社交能量 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-4">社交能量</Text>
            <View className="space-y-2">
              {socialEnergyOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    profile.behavior?.socialEnergy === option.value ? 'border-green-500 bg-green-50' : 'bg-gray-50'
                  }`}
                  onClick={() => setProfile(prev => ({
                    ...prev,
                    behavior: { ...prev.behavior, socialEnergy: option.value as any } as any,
                  }))}
                >
                  <View>
                    <Text className="block text-sm text-gray-800">{option.label}</Text>
                    <Text className="block text-xs text-gray-400">{option.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 活跃时段 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-4">活跃时段（可多选）</Text>
            <View className="flex flex-wrap gap-3">
              {timeSlotOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border ${
                    (profile.behavior?.activeTimeSlots || []).includes(option.value) ? 'border-green-500 bg-green-50' : 'bg-gray-50'
                  }`}
                  onClick={() => toggleBehaviorArray('activeTimeSlots', option.value)}
                >
                  <Text className="block text-base">{option.icon}</Text>
                  <Text className="block text-sm text-gray-700">{option.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 表达风格 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-4">表达风格</Text>
            <View className="space-y-2">
              {expressionStyleOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    profile.behavior?.expressionStyle === option.value ? 'border-green-500 bg-green-50' : 'bg-gray-50'
                  }`}
                  onClick={() => setProfile(prev => ({
                    ...prev,
                    behavior: { ...prev.behavior, expressionStyle: option.value as any } as any,
                  }))}
                >
                  <View>
                    <Text className="block text-sm text-gray-800">{option.label}</Text>
                    <Text className="block text-xs text-gray-400">{option.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 偏爱话题 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-4">偏爱话题（可多选）</Text>
            <View className="flex flex-wrap gap-3">
              {topicOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border ${
                    (profile.behavior?.preferredTopics || []).includes(option.value) ? 'border-green-500 bg-green-50' : 'bg-gray-50'
                  }`}
                  onClick={() => toggleBehaviorArray('preferredTopics', option.value)}
                >
                  <Text className="block text-base">{option.icon}</Text>
                  <Text className="block text-sm text-gray-700">{option.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 回避话题 */}
          <View className="bg-white rounded-2xl shadow-soft p-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-4">回避话题（可多选）</Text>
            <View className="flex flex-wrap gap-3">
              {topicOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border ${
                    (profile.behavior?.topicAvoid || []).includes(option.value) ? 'border-green-500 bg-green-50' : 'bg-gray-50'
                  }`}
                  onClick={() => {
                    const arr = profile.behavior?.topicAvoid || []
                    const newArr = arr.includes(option.value) ? arr.filter(v => v !== option.value) : [...arr, option.value]
                    setProfile(prev => ({
                      ...prev,
                      behavior: { ...prev.behavior, topicAvoid: newArr } as any,
                    }))
                  }}
                >
                  <Text className="block text-base">{option.icon}</Text>
                  <Text className="block text-sm text-gray-700">{option.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 保存按钮 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <Button className="w-full bg-green-500" onClick={handleSave} disabled={saving}>
          {saving ? <Loader size={16} color="#fff" className="animate-spin" /> : <Save size={16} color="#fff" />}
          <Text className="text-white ml-2">{saving ? '保存中' : '保存档案'}</Text>
        </Button>
      </View>
    </View>
  )
}

export default UserProfilePage
