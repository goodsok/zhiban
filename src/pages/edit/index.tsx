import { View, Text } from '@tarojs/components'
import { useLoad, useRouter, navigateBack } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Check, Loader, HardDrive, Cpu } from 'lucide-react-taro'
import { Network } from '@/network'

// 关系阶段
const relationshipStages = [
  { id: 'new', label: '刚认识' },
  { id: 'contacting', label: '接触中' },
  { id: 'dating', label: '约会中' },
  { id: 'progressing', label: '发展中' },
]

// 互动状态
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

interface FormData {
  name: string
  gender: string
  // 硬件信息
  hardware: {
    age: string
    height: string
    birthday: string
    zodiac: string
    bloodType: string
    bodyType: string
    style: string
    wechat: string
    phone: string
    location: string
    occupation: string
    company: string
    position: string
  }
  // 软件信息
  software: {
    mbti: string
    personality: string
    emotionalStyle: string
    interests: string[]
    hobbies: string
    schedule: string
    spendingStyle: string
    communicationStyle: string
    likes: string
    dislikes: string
    loveExpectation: string
    dealBreakers: string
  }
  relationshipStage: string
  interactionStatus: string
  notes: string
}

const EditPage: FC = () => {
  const router = useRouter()
  const id = router.params.id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    gender: 'female',
    hardware: {
      age: '',
      height: '',
      birthday: '',
      zodiac: '',
      bloodType: '',
      bodyType: '',
      style: '',
      wechat: '',
      phone: '',
      location: '',
      occupation: '',
      company: '',
      position: '',
    },
    software: {
      mbti: '',
      personality: '',
      emotionalStyle: '',
      interests: [],
      hobbies: '',
      schedule: '',
      spendingStyle: '',
      communicationStyle: '',
      likes: '',
      dislikes: '',
      loveExpectation: '',
      dealBreakers: '',
    },
    relationshipStage: 'new',
    interactionStatus: 'just_met',
    notes: '',
  })

  useLoad(() => {
    if (id) fetchDetail()
  })

  const fetchDetail = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: `/api/match/${id}` })
      if (res.data?.code === 200 && res.data?.data) {
        const d = res.data.data
        setFormData({
          name: d.name || '',
          gender: d.gender || 'female',
          hardware: {
            age: d.hardware?.age ? String(d.hardware.age) : '',
            height: d.hardware?.height || '',
            birthday: d.hardware?.birthday || '',
            zodiac: d.hardware?.zodiac || '',
            bloodType: d.hardware?.bloodType || '',
            bodyType: d.hardware?.bodyType || '',
            style: d.hardware?.style || '',
            wechat: d.hardware?.wechat || '',
            phone: d.hardware?.phone || '',
            location: d.hardware?.location || '',
            occupation: d.hardware?.occupation || '',
            company: d.hardware?.company || '',
            position: d.hardware?.position || '',
          },
          software: {
            mbti: d.software?.mbti || '',
            personality: d.software?.personality || '',
            emotionalStyle: d.software?.emotionalStyle || '',
            interests: d.software?.interests || [],
            hobbies: d.software?.hobbies || '',
            schedule: d.software?.schedule || '',
            spendingStyle: d.software?.spendingStyle || '',
            communicationStyle: d.software?.communicationStyle || '',
            likes: d.software?.likes || '',
            dislikes: d.software?.dislikes || '',
            loveExpectation: d.software?.loveExpectation || '',
            dealBreakers: d.software?.dealBreakers || '',
          },
          relationshipStage: d.relationshipStage || 'new',
          interactionStatus: d.interactionStatus || 'just_met',
          notes: d.notes || '',
        })
      }
    } catch (error) {
      console.error('Fetch detail error:', error)
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => navigateBack()

  const toggleInterest = (interest: string) => {
    const newInterests = formData.software.interests.includes(interest)
      ? formData.software.interests.filter(i => i !== interest)
      : [...formData.software.interests, interest]
    setFormData({
      ...formData,
      software: { ...formData.software, interests: newInterests }
    })
  }

  const handleSave = async () => {
    if (!id || !formData.name) return

    try {
      setSaving(true)
      await Network.request({
        url: `/api/match/${id}`,
        method: 'PUT',
        data: {
          name: formData.name,
          gender: formData.gender,
          hardware: {
            age: formData.hardware.age ? parseInt(formData.hardware.age) : undefined,
            height: formData.hardware.height || undefined,
            birthday: formData.hardware.birthday || undefined,
            zodiac: formData.hardware.zodiac || undefined,
            bloodType: formData.hardware.bloodType || undefined,
            bodyType: formData.hardware.bodyType || undefined,
            style: formData.hardware.style || undefined,
            wechat: formData.hardware.wechat || undefined,
            phone: formData.hardware.phone || undefined,
            location: formData.hardware.location || undefined,
            occupation: formData.hardware.occupation || undefined,
            company: formData.hardware.company || undefined,
            position: formData.hardware.position || undefined,
          },
          software: {
            mbti: formData.software.mbti || undefined,
            personality: formData.software.personality || undefined,
            emotionalStyle: formData.software.emotionalStyle || undefined,
            interests: formData.software.interests,
            hobbies: formData.software.hobbies || undefined,
            schedule: formData.software.schedule || undefined,
            spendingStyle: formData.software.spendingStyle || undefined,
            communicationStyle: formData.software.communicationStyle || undefined,
            likes: formData.software.likes || undefined,
            dislikes: formData.software.dislikes || undefined,
            loveExpectation: formData.software.loveExpectation || undefined,
            dealBreakers: formData.software.dealBreakers || undefined,
          },
          relationshipStage: formData.relationshipStage,
          interactionStatus: formData.interactionStatus,
          notes: formData.notes || undefined,
        }
      })
      navigateBack()
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
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
      {/* 顶部 */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex items-center justify-between">
          <View onClick={goBack}>
            <ArrowLeft size={24} color="#374151" />
          </View>
          <Text className="block text-base font-semibold text-gray-900">编辑档案</Text>
          <View className="w-6" />
        </View>
      </View>

      <View className="p-4">
        {/* 姓名 */}
        <View className="mb-4">
          <Text className="block text-xs text-gray-400 mb-2">姓名 *</Text>
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            <Input
              className="w-full"
              placeholder="输入姓名"
              value={formData.name}
              onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
            />
          </View>
        </View>

        {/* 硬件信息 */}
        <View className="mb-4">
          <View className="flex items-center gap-2 mb-2">
            <HardDrive size={14} color="#6B7280" />
            <Text className="block text-xs text-gray-400">硬件信息</Text>
            <Text className="block text-xs text-gray-300">外在属性</Text>
          </View>
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            {/* 基本信息 */}
            <Text className="block text-xs text-gray-500 mb-2">基本信息</Text>
            <View className="grid grid-cols-2 gap-3 mb-4">
              <View>
                <Text className="block text-xs text-gray-400 mb-1">年龄</Text>
                <Input
                  className="w-full"
                  type="number"
                  placeholder="年龄"
                  value={formData.hardware.age}
                  onInput={(e) => setFormData({
                    ...formData,
                    hardware: { ...formData.hardware, age: e.detail.value }
                  })}
                />
              </View>
              <View>
                <Text className="block text-xs text-gray-400 mb-1">身高</Text>
                <Input
                  className="w-full"
                  placeholder="如：165cm"
                  value={formData.hardware.height}
                  onInput={(e) => setFormData({
                    ...formData,
                    hardware: { ...formData.hardware, height: e.detail.value }
                  })}
                />
              </View>
              <View>
                <Text className="block text-xs text-gray-400 mb-1">星座</Text>
                <Input
                  className="w-full"
                  placeholder="如：双子座"
                  value={formData.hardware.zodiac}
                  onInput={(e) => setFormData({
                    ...formData,
                    hardware: { ...formData.hardware, zodiac: e.detail.value }
                  })}
                />
              </View>
              <View>
                <Text className="block text-xs text-gray-400 mb-1">血型</Text>
                <Input
                  className="w-full"
                  placeholder="如：O型"
                  value={formData.hardware.bloodType}
                  onInput={(e) => setFormData({
                    ...formData,
                    hardware: { ...formData.hardware, bloodType: e.detail.value }
                  })}
                />
              </View>
            </View>
            
            {/* 职业信息 */}
            <Text className="block text-xs text-gray-500 mb-2">职业信息</Text>
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">职业</Text>
              <Input
                className="w-full"
                placeholder="职业"
                value={formData.hardware.occupation}
                onInput={(e) => setFormData({
                  ...formData,
                  hardware: { ...formData.hardware, occupation: e.detail.value }
                })}
              />
            </View>
            <View className="grid grid-cols-2 gap-3 mb-4">
              <View>
                <Text className="block text-xs text-gray-400 mb-1">公司</Text>
                <Input
                  className="w-full"
                  placeholder="公司"
                  value={formData.hardware.company}
                  onInput={(e) => setFormData({
                    ...formData,
                    hardware: { ...formData.hardware, company: e.detail.value }
                  })}
                />
              </View>
              <View>
                <Text className="block text-xs text-gray-400 mb-1">职位</Text>
                <Input
                  className="w-full"
                  placeholder="职位"
                  value={formData.hardware.position}
                  onInput={(e) => setFormData({
                    ...formData,
                    hardware: { ...formData.hardware, position: e.detail.value }
                  })}
                />
              </View>
            </View>

            {/* 联系方式 */}
            <Text className="block text-xs text-gray-500 mb-2">联系方式</Text>
            <View className="grid grid-cols-2 gap-3 mb-4">
              <View>
                <Text className="block text-xs text-gray-400 mb-1">微信</Text>
                <Input
                  className="w-full"
                  placeholder="微信号"
                  value={formData.hardware.wechat}
                  onInput={(e) => setFormData({
                    ...formData,
                    hardware: { ...formData.hardware, wechat: e.detail.value }
                  })}
                />
              </View>
              <View>
                <Text className="block text-xs text-gray-400 mb-1">所在地</Text>
                <Input
                  className="w-full"
                  placeholder="如：北京朝阳"
                  value={formData.hardware.location}
                  onInput={(e) => setFormData({
                    ...formData,
                    hardware: { ...formData.hardware, location: e.detail.value }
                  })}
                />
              </View>
            </View>

            {/* 外貌特征 */}
            <Text className="block text-xs text-gray-500 mb-2">外貌特征</Text>
            <View className="grid grid-cols-2 gap-3">
              <View>
                <Text className="block text-xs text-gray-400 mb-1">体型</Text>
                <Input
                  className="w-full"
                  placeholder="如：匀称"
                  value={formData.hardware.bodyType}
                  onInput={(e) => setFormData({
                    ...formData,
                    hardware: { ...formData.hardware, bodyType: e.detail.value }
                  })}
                />
              </View>
              <View>
                <Text className="block text-xs text-gray-400 mb-1">穿搭风格</Text>
                <Input
                  className="w-full"
                  placeholder="如：简约文艺"
                  value={formData.hardware.style}
                  onInput={(e) => setFormData({
                    ...formData,
                    hardware: { ...formData.hardware, style: e.detail.value }
                  })}
                />
              </View>
            </View>
          </View>
        </View>

        {/* 软件信息 */}
        <View className="mb-4">
          <View className="flex items-center gap-2 mb-2">
            <Cpu size={14} color="#6B7280" />
            <Text className="block text-xs text-gray-400">软件信息</Text>
            <Text className="block text-xs text-gray-300">内在特质</Text>
          </View>
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            {/* 性格特质 */}
            <Text className="block text-xs text-gray-500 mb-2">性格特质</Text>
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">MBTI</Text>
              <Input
                className="w-full"
                placeholder="如：ENFP"
                value={formData.software.mbti}
                onInput={(e) => setFormData({
                  ...formData,
                  software: { ...formData.software, mbti: e.detail.value }
                })}
              />
            </View>
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">性格描述</Text>
              <Input
                className="w-full"
                placeholder="如：热情开朗，善于表达"
                value={formData.software.personality}
                onInput={(e) => setFormData({
                  ...formData,
                  software: { ...formData.software, personality: e.detail.value }
                })}
              />
            </View>
            <View className="mb-4">
              <Text className="block text-xs text-gray-400 mb-1">情绪特点</Text>
              <Input
                className="w-full"
                placeholder="如：情绪稳定，偶尔小脾气"
                value={formData.software.emotionalStyle}
                onInput={(e) => setFormData({
                  ...formData,
                  software: { ...formData.software, emotionalStyle: e.detail.value }
                })}
              />
            </View>

            {/* 兴趣爱好 */}
            <Text className="block text-xs text-gray-500 mb-2">兴趣爱好</Text>
            <View className="flex flex-wrap gap-2 mb-3">
              {presetInterests.map((interest) => (
                <Badge
                  key={interest}
                  className={`${
                    formData.software.interests.includes(interest)
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </View>
            <View className="mb-4">
              <Text className="block text-xs text-gray-400 mb-1">具体爱好</Text>
              <Input
                className="w-full"
                placeholder="如：周末喜欢逛展览、拍照"
                value={formData.software.hobbies}
                onInput={(e) => setFormData({
                  ...formData,
                  software: { ...formData.software, hobbies: e.detail.value }
                })}
              />
            </View>

            {/* 行为习惯 */}
            <Text className="block text-xs text-gray-500 mb-2">行为习惯</Text>
            <View className="grid grid-cols-2 gap-3 mb-4">
              <View>
                <Text className="block text-xs text-gray-400 mb-1">作息</Text>
                <Input
                  className="w-full"
                  placeholder="如：早睡早起"
                  value={formData.software.schedule}
                  onInput={(e) => setFormData({
                    ...formData,
                    software: { ...formData.software, schedule: e.detail.value }
                  })}
                />
              </View>
              <View>
                <Text className="block text-xs text-gray-400 mb-1">消费观</Text>
                <Input
                  className="w-full"
                  placeholder="如：注重品质"
                  value={formData.software.spendingStyle}
                  onInput={(e) => setFormData({
                    ...formData,
                    software: { ...formData.software, spendingStyle: e.detail.value }
                  })}
                />
              </View>
            </View>

            {/* 情感需求 */}
            <Text className="block text-xs text-gray-500 mb-2">情感需求</Text>
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">喜欢什么</Text>
              <Input
                className="w-full"
                placeholder="如：被认真对待、小惊喜"
                value={formData.software.likes}
                onInput={(e) => setFormData({
                  ...formData,
                  software: { ...formData.software, likes: e.detail.value }
                })}
              />
            </View>
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">讨厌什么</Text>
              <Input
                className="w-full"
                placeholder="如：不守时、大男子主义"
                value={formData.software.dislikes}
                onInput={(e) => setFormData({
                  ...formData,
                  software: { ...formData.software, dislikes: e.detail.value }
                })}
              />
            </View>
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">恋爱期待</Text>
              <Input
                className="w-full"
                placeholder="如：希望找到一个能一起成长的人"
                value={formData.software.loveExpectation}
                onInput={(e) => setFormData({
                  ...formData,
                  software: { ...formData.software, loveExpectation: e.detail.value }
                })}
              />
            </View>
            <View>
              <Text className="block text-xs text-gray-400 mb-1">雷区/底线</Text>
              <Input
                className="w-full"
                placeholder="如：不诚实、不尊重女性"
                value={formData.software.dealBreakers}
                onInput={(e) => setFormData({
                  ...formData,
                  software: { ...formData.software, dealBreakers: e.detail.value }
                })}
              />
            </View>
          </View>
        </View>

        {/* 关系状态 */}
        <View className="mb-4">
          <Text className="block text-xs text-gray-400 mb-2">关系状态</Text>
          <View className="grid grid-cols-4 gap-2 mb-2">
            {relationshipStages.map((stage) => (
              <View
                key={stage.id}
                className={`text-center py-2 rounded-lg ${
                  formData.relationshipStage === stage.id 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-white border border-gray-200 text-gray-600'
                }`}
                onClick={() => setFormData({ ...formData, relationshipStage: stage.id })}
              >
                <Text className="block text-sm">{stage.label}</Text>
              </View>
            ))}
          </View>
          <View className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {interactionStatuses.map((status) => (
              <View
                key={status.id}
                className="flex items-center justify-between px-4 py-2"
                onClick={() => setFormData({ ...formData, interactionStatus: status.id })}
              >
                <Text className={`block text-sm ${
                  formData.interactionStatus === status.id ? 'text-gray-900 font-medium' : 'text-gray-600'
                }`}
                >
                  {status.label}
                </Text>
                {formData.interactionStatus === status.id && <Check size={14} color="#111827" />}
              </View>
            ))}
          </View>
        </View>

        {/* 备注 */}
        <View className="mb-4">
          <Text className="block text-xs text-gray-400 mb-2">备注</Text>
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            <Input
              className="w-full"
              placeholder="添加备注..."
              value={formData.notes}
              onInput={(e) => setFormData({ ...formData, notes: e.detail.value })}
            />
          </View>
        </View>
      </View>

      {/* 底部 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <Button className="w-full bg-black" onClick={handleSave} disabled={saving}>
          {saving ? <Loader size={16} color="#fff" className="animate-spin" /> : <Check size={16} color="#fff" />}
          <Text className="ml-2 text-white">{saving ? '保存中...' : '保存'}</Text>
        </Button>
      </View>
    </View>
  )
}

export default EditPage
