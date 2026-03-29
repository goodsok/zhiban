import { View, Text } from '@tarojs/components'
import { useLoad, useRouter, navigateBack } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Check, Loader, X } from 'lucide-react-taro'
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
]

// 预设关键信息类型
const keyInfoTypes = [
  { id: 'birthday', label: '生日', icon: '🎂' },
  { id: 'food_preference', label: '饮食偏好', icon: '🍽️' },
  { id: 'pet', label: '宠物', icon: '🐱' },
  { id: 'hometown', label: '家乡', icon: '🏠' },
  { id: 'music', label: '音乐', icon: '🎵' },
  { id: 'movie', label: '电影', icon: '🎬' },
  { id: 'sports', label: '运动', icon: '⚽' },
  { id: 'taboo', label: '禁忌', icon: '⚠️' },
]

interface KeyInfo {
  id: string
  type: string
  label: string
  icon: string
  value: string
}

const EditPage: FC = () => {
  const router = useRouter()
  const id = router.params.id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    occupation: '',
    mbti: '',
    zodiac: '',
    relationshipStage: 'new',
    interactionStatus: 'just_met',
    interests: [] as string[],
    keyInfo: [] as KeyInfo[],
    notes: '',
  })

  const [showAddKeyInfo, setShowAddKeyInfo] = useState(false)
  const [newKeyInfoType, setNewKeyInfoType] = useState('')
  const [newKeyInfoValue, setNewKeyInfoValue] = useState('')

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
          name: d.name,
          age: String(d.age),
          occupation: d.occupation || '',
          mbti: d.mbti || '',
          zodiac: d.zodiac || '',
          relationshipStage: d.relationshipStage,
          interactionStatus: d.interactionStatus,
          interests: d.interests || [],
          keyInfo: d.keyInfo || [],
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
    const newInterests = formData.interests.includes(interest)
      ? formData.interests.filter(i => i !== interest)
      : [...formData.interests, interest]
    setFormData({ ...formData, interests: newInterests })
  }

  const addKeyInfo = () => {
    if (!newKeyInfoType || !newKeyInfoValue) return
    const typeInfo = keyInfoTypes.find(t => t.id === newKeyInfoType)
    const newInfo: KeyInfo = {
      id: `key_${Date.now()}`,
      type: newKeyInfoType,
      label: typeInfo?.label || newKeyInfoType,
      icon: typeInfo?.icon || '📝',
      value: newKeyInfoValue,
    }
    setFormData({
      ...formData,
      keyInfo: [...formData.keyInfo, newInfo]
    })
    setNewKeyInfoType('')
    setNewKeyInfoValue('')
    setShowAddKeyInfo(false)
  }

  const removeKeyInfo = (infoId: string) => {
    setFormData({
      ...formData,
      keyInfo: formData.keyInfo.filter(k => k.id !== infoId)
    })
  }

  const handleSave = async () => {
    if (!id || !formData.name || !formData.age) return

    try {
      setSaving(true)
      await Network.request({
        url: `/api/match/${id}`,
        method: 'PUT',
        data: {
          name: formData.name,
          age: parseInt(formData.age),
          occupation: formData.occupation,
          mbti: formData.mbti,
          zodiac: formData.zodiac,
          relationshipStage: formData.relationshipStage,
          interactionStatus: formData.interactionStatus,
          interests: formData.interests,
          keyInfo: formData.keyInfo,
          notes: formData.notes,
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
        {/* 基本信息 */}
        <View className="mb-6">
          <Text className="block text-xs text-gray-400 mb-2">基本信息</Text>
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">姓名</Text>
              <Input
                className="w-full"
                placeholder="输入姓名"
                value={formData.name}
                onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
              />
            </View>
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">年龄</Text>
              <Input
                className="w-full"
                type="number"
                placeholder="输入年龄"
                value={formData.age}
                onInput={(e) => setFormData({ ...formData, age: e.detail.value })}
              />
            </View>
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">职业</Text>
              <Input
                className="w-full"
                placeholder="输入职业"
                value={formData.occupation}
                onInput={(e) => setFormData({ ...formData, occupation: e.detail.value })}
              />
            </View>
            <View className="flex gap-3">
              <View className="flex-1">
                <Text className="block text-xs text-gray-400 mb-1">MBTI</Text>
                <Input
                  className="w-full"
                  placeholder="例如：ENFP"
                  value={formData.mbti}
                  onInput={(e) => setFormData({ ...formData, mbti: e.detail.value })}
                />
              </View>
              <View className="flex-1">
                <Text className="block text-xs text-gray-400 mb-1">星座</Text>
                <Input
                  className="w-full"
                  placeholder="例如：双子座"
                  value={formData.zodiac}
                  onInput={(e) => setFormData({ ...formData, zodiac: e.detail.value })}
                />
              </View>
            </View>
          </View>
        </View>

        {/* 关系状态 */}
        <View className="mb-6">
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

        {/* 关键信息 */}
        <View className="mb-6">
          <View className="flex items-center justify-between mb-2">
            <Text className="block text-xs text-gray-400">关键信息</Text>
            <View onClick={() => setShowAddKeyInfo(true)}>
              <Text className="block text-xs text-gray-500">+ 添加</Text>
            </View>
          </View>
          {formData.keyInfo.length > 0 ? (
            <View className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
              {formData.keyInfo.map((info) => (
                <View key={info.id} className="flex items-center px-4 py-3">
                  <Text className="block text-base mr-2">{info.icon}</Text>
                  <View className="flex-1">
                    <Text className="block text-xs text-gray-400">{info.label}</Text>
                    <Text className="block text-sm text-gray-700">{info.value}</Text>
                  </View>
                  <View onClick={() => removeKeyInfo(info.id)}>
                    <X size={16} color="#9CA3AF" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <Text className="block text-sm text-gray-400">点击添加关键信息</Text>
            </View>
          )}
          
          {/* 添加关键信息 */}
          {showAddKeyInfo && (
            <View className="bg-white rounded-xl border border-gray-100 p-4 mt-2">
              <View className="flex flex-wrap gap-2 mb-3">
                {keyInfoTypes.map((t) => (
                  <Badge
                    key={t.id}
                    className={`${
                      newKeyInfoType === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                    onClick={() => setNewKeyInfoType(t.id)}
                  >
                    {t.icon} {t.label}
                  </Badge>
                ))}
              </View>
              <View className="flex gap-2">
                <View className="flex-1">
                  <Input
                    className="w-full"
                    placeholder="输入内容"
                    value={newKeyInfoValue}
                    onInput={(e) => setNewKeyInfoValue(e.detail.value)}
                  />
                </View>
                <Button size="sm" className="bg-black" onClick={addKeyInfo}>
                  <Check size={14} color="#fff" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddKeyInfo(false)}>
                  <X size={14} color="#6B7280" />
                </Button>
              </View>
            </View>
          )}
        </View>

        {/* 兴趣爱好 */}
        <View className="mb-6">
          <Text className="block text-xs text-gray-400 mb-2">兴趣爱好</Text>
          <View className="flex flex-wrap gap-2">
            {presetInterests.map((interest) => (
              <Badge
                key={interest}
                className={`${
                  formData.interests.includes(interest)
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </Badge>
            ))}
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
