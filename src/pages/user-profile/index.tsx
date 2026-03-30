import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader, User, Heart, Sparkles, MessageCircle, Save } from 'lucide-react-taro'

interface UserProfile {
  nickname: string | null
  gender: 'male' | 'female' | null
  birthYear: number | null
  height: number | null
  occupation: string | null
  education: string | null
  location: string | null
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
    responseSpeed: 'instant' | 'fast' | 'normal' | 'slow' | null
    activeTimeSlots: string[]
    socialEnergy: 'high' | 'medium' | 'low' | null
    expressionStyle: 'expressive' | 'reserved' | null
    preferredTopics: string[]
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

const communicationStyleOptions = [
  { value: 'direct', label: '直接', desc: '有什么说什么' },
  { value: 'balanced', label: '适中', desc: '看情况调整' },
  { value: 'indirect', label: '委婉', desc: '比较含蓄' },
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

const UserProfilePage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [activeSection, setActiveSection] = useState<'basic' | 'personality' | 'relationship' | 'behavior'>('basic')

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
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size={24} color="#6B7280" className="animate-spin" />
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      <CustomHeader title="我的档案" />

      {/* 置信度提示 */}
      <View className="px-4 pt-4">
        <View className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3">
          <View className="flex items-center gap-2">
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
        <View className="flex bg-gray-100 rounded-lg p-1">
          {[
            { key: 'basic', label: '基本信息' },
            { key: 'personality', label: '性格情感' },
            { key: 'relationship', label: '恋爱观' },
            { key: 'behavior', label: '行为偏好' },
          ].map((tab) => (
            <View
              key={tab.key}
              className={`flex-1 py-2 rounded-md text-center ${
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
      </View>

      {/* 基本信息 */}
      {activeSection === 'basic' && (
        <View className="p-4">
          <View className="bg-white rounded-xl border border-gray-100 p-4">
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
              <View className="flex gap-3">
                {genderOptions.map((option) => (
                  <View
                    key={option.value}
                    className={`flex-1 py-3 rounded-lg text-center ${
                      profile.gender === option.value ? 'bg-black' : 'bg-gray-50'
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
          <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <View className="flex items-center gap-2 mb-4">
              <Sparkles size={16} color="#6B7280" />
              <Text className="block text-sm font-semibold text-gray-900">性格自评</Text>
            </View>

            {/* 开放性 */}
            <View className="mb-4">
              <View className="flex items-center justify-between mb-2">
                <Text className="block text-sm text-gray-700">开放性</Text>
                <Text className="block text-xs text-gray-500">{profile.personality.openness}</Text>
              </View>
              <View className="flex items-center gap-2">
                <Text className="block text-xs text-gray-400">传统</Text>
                <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View className="h-full bg-black rounded-full" style={{ width: `${profile.personality.openness}%` }} />
                </View>
                <Text className="block text-xs text-gray-400">开放</Text>
              </View>
            </View>

            {/* 外向性 */}
            <View className="mb-4">
              <View className="flex items-center justify-between mb-2">
                <Text className="block text-sm text-gray-700">外向性</Text>
                <Text className="block text-xs text-gray-500">{profile.personality.extraversion}</Text>
              </View>
              <View className="flex items-center gap-2">
                <Text className="block text-xs text-gray-400">内向</Text>
                <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View className="h-full bg-black rounded-full" style={{ width: `${profile.personality.extraversion}%` }} />
                </View>
                <Text className="block text-xs text-gray-400">外向</Text>
              </View>
            </View>

            {/* 宜人性 */}
            <View className="mb-4">
              <View className="flex items-center justify-between mb-2">
                <Text className="block text-sm text-gray-700">宜人性</Text>
                <Text className="block text-xs text-gray-500">{profile.personality.agreeableness}</Text>
              </View>
              <View className="flex items-center gap-2">
                <Text className="block text-xs text-gray-400">直接</Text>
                <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View className="h-full bg-black rounded-full" style={{ width: `${profile.personality.agreeableness}%` }} />
                </View>
                <Text className="block text-xs text-gray-400">温和</Text>
              </View>
            </View>
          </View>

          <View className="bg-white rounded-xl border border-gray-100 p-4">
            <View className="flex items-center gap-2 mb-4">
              <Heart size={16} color="#6B7280" />
              <Text className="block text-sm font-semibold text-gray-900">情感特点</Text>
            </View>

            {/* 情绪稳定性 */}
            <View className="mb-4">
              <View className="flex items-center justify-between mb-2">
                <Text className="block text-sm text-gray-700">情绪稳定性</Text>
                <Text className="block text-xs text-gray-500">{profile.emotional.stability}</Text>
              </View>
              <View className="flex items-center gap-2">
                <Text className="block text-xs text-gray-400">敏感</Text>
                <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View className="h-full bg-black rounded-full" style={{ width: `${profile.emotional.stability}%` }} />
                </View>
                <Text className="block text-xs text-gray-400">稳定</Text>
              </View>
            </View>

            {/* 情感表达 */}
            <View className="mb-4">
              <View className="flex items-center justify-between mb-2">
                <Text className="block text-sm text-gray-700">情感表达</Text>
                <Text className="block text-xs text-gray-500">{profile.emotional.expression}</Text>
              </View>
              <View className="flex items-center gap-2">
                <Text className="block text-xs text-gray-400">含蓄</Text>
                <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View className="h-full bg-black rounded-full" style={{ width: `${profile.emotional.expression}%` }} />
                </View>
                <Text className="block text-xs text-gray-400">表达</Text>
              </View>
            </View>

            {/* 共情能力 */}
            <View className="mb-4">
              <View className="flex items-center justify-between mb-2">
                <Text className="block text-sm text-gray-700">共情能力</Text>
                <Text className="block text-xs text-gray-500">{profile.emotional.empathy}</Text>
              </View>
              <View className="flex items-center gap-2">
                <Text className="block text-xs text-gray-400">理性</Text>
                <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View className="h-full bg-black rounded-full" style={{ width: `${profile.emotional.empathy}%` }} />
                </View>
                <Text className="block text-xs text-gray-400">共情</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 恋爱观 */}
      {activeSection === 'relationship' && (
        <View className="p-4">
          {/* 恋爱目标 */}
          <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-3">恋爱目标</Text>
            <View className="space-y-2">
              {relationshipGoalOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    profile.relationshipGoal === option.value ? 'border-black bg-gray-50' : 'border-gray-100'
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
          <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-3">依恋类型</Text>
            <View className="space-y-2">
              {attachmentStyleOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    profile.attachmentStyle === option.value ? 'border-black bg-gray-50' : 'border-gray-100'
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
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-3">爱的语言（可多选）</Text>
            <View className="flex flex-wrap gap-2">
              {loveLanguageOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border ${
                    profile.loveLanguage.includes(option.value) ? 'border-black bg-gray-50' : 'border-gray-100'
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

      {/* 行为偏好 */}
      {activeSection === 'behavior' && (
        <View className="p-4">
          {/* 沟通风格 */}
          <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <View className="flex items-center gap-2 mb-3">
              <MessageCircle size={14} color="#6B7280" />
              <Text className="block text-sm font-semibold text-gray-900">沟通风格</Text>
            </View>
            <View className="space-y-2">
              {communicationStyleOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    profile.behavior?.communicationStyle === option.value ? 'border-black bg-gray-50' : 'border-gray-100'
                  }`}
                  onClick={() => setProfile(prev => ({
                    ...prev,
                    behavior: { ...prev.behavior, communicationStyle: option.value as any } as any,
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

          {/* 回复速度 */}
          <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-3">你通常多久回复消息？</Text>
            <View className="space-y-2">
              {responseSpeedOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    profile.behavior?.responseSpeed === option.value ? 'border-black bg-gray-50' : 'border-gray-100'
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
          <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-3">社交能量</Text>
            <View className="space-y-2">
              {socialEnergyOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    profile.behavior?.socialEnergy === option.value ? 'border-black bg-gray-50' : 'border-gray-100'
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
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            <Text className="block text-sm font-semibold text-gray-900 mb-3">活跃时段（可多选）</Text>
            <View className="flex flex-wrap gap-2">
              {timeSlotOptions.map((option) => (
                <View
                  key={option.value}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border ${
                    (profile.behavior?.activeTimeSlots || []).includes(option.value) ? 'border-black bg-gray-50' : 'border-gray-100'
                  }`}
                  onClick={() => toggleBehaviorArray('activeTimeSlots', option.value)}
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
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <Button className="w-full bg-black" onClick={handleSave} disabled={saving}>
          {saving ? <Loader size={16} color="#fff" className="animate-spin" /> : <Save size={16} color="#fff" />}
          <Text className="text-white ml-2">{saving ? '保存中' : '保存档案'}</Text>
        </Button>
      </View>
    </View>
  )
}

export default UserProfilePage
