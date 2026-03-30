import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Loader, Check } from 'lucide-react-taro'

interface ManualBehaviorFormProps {
  matchId: number
  initialData?: {
    responseSpeed?: 'instant' | 'fast' | 'normal' | 'slow' | 'very_slow'
    activeTimeSlots?: string[]
    topicPreferences?: string[]
    communicationStyle?: 'direct' | 'indirect' | 'balanced'
  }
  onSuccess?: () => void
}

const responseSpeedOptions = [
  { value: 'instant', label: '秒回', desc: '几乎立刻回复' },
  { value: 'fast', label: '很快', desc: '几分钟内回复' },
  { value: 'normal', label: '正常', desc: '半小时左右' },
  { value: 'slow', label: '较慢', desc: '几小时才回复' },
  { value: 'very_slow', label: '很慢', desc: '经常隔天才回复' },
]

const timeSlotOptions = [
  { value: 'morning', label: '上午', icon: '🌅' },
  { value: 'afternoon', label: '下午', icon: '☀️' },
  { value: 'evening', label: '晚上', icon: '🌙' },
  { value: 'night', label: '深夜', icon: '🦉' },
]

const topicOptions = [
  { value: 'daily', label: '日常', icon: '💬' },
  { value: 'work', label: '工作', icon: '💼' },
  { value: 'emotion', label: '情感', icon: '❤️' },
  { value: 'hobby', label: '兴趣', icon: '🎯' },
  { value: 'future', label: '未来', icon: '🌟' },
  { value: 'relationship', label: '关系', icon: '💕' },
]

const styleOptions = [
  { value: 'direct', label: '直接', desc: '有什么说什么' },
  { value: 'balanced', label: '适中', desc: '看情况' },
  { value: 'indirect', label: '委婉', desc: '说话比较含蓄' },
]

const ManualBehaviorForm: FC<ManualBehaviorFormProps> = ({
  matchId,
  initialData,
  onSuccess
}) => {
  const [responseSpeed, setResponseSpeed] = useState<string>(initialData?.responseSpeed || '')
  const [activeTimeSlots, setActiveTimeSlots] = useState<string[]>(initialData?.activeTimeSlots || [])
  const [topicPreferences, setTopicPreferences] = useState<string[]>(initialData?.topicPreferences || [])
  const [communicationStyle, setCommunicationStyle] = useState<string>(initialData?.communicationStyle || '')
  const [saving, setSaving] = useState(false)

  const toggleTimeSlot = (value: string) => {
    setActiveTimeSlots(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }

  const toggleTopic = (value: string) => {
    setTopicPreferences(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await Network.request({
        url: `/api/portrait/${matchId}/manual-data`,
        method: 'POST',
        data: {
          responseSpeed,
          activeTimeSlots,
          topicPreferences,
          communicationStyle,
        }
      })

      if (res.data?.code === 200) {
        onSuccess?.()
      }
    } catch (error) {
      console.error('Save manual data error:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className="bg-white rounded-xl border border-gray-100">
      {/* 回复速度 */}
      <View className="p-4 border-b border-gray-100">
        <Text className="block text-sm font-semibold text-gray-900 mb-3">Ta通常多久回复你？</Text>
        <View className="space-y-2">
          {responseSpeedOptions.map((option) => (
            <View
              key={option.value}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                responseSpeed === option.value 
                  ? 'border-black bg-gray-50' 
                  : 'border-gray-100'
              }`}
              onClick={() => setResponseSpeed(option.value)}
            >
              <View>
                <Text className="block text-sm text-gray-800">{option.label}</Text>
                <Text className="block text-xs text-gray-400">{option.desc}</Text>
              </View>
              {responseSpeed === option.value && (
                <Check size={16} color="#000" />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* 活跃时段 */}
      <View className="p-4 border-b border-gray-100">
        <Text className="block text-sm font-semibold text-gray-900 mb-3">Ta通常什么时候活跃？（可多选）</Text>
        <View className="flex flex-wrap gap-2">
          {timeSlotOptions.map((option) => (
            <View
              key={option.value}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border ${
                activeTimeSlots.includes(option.value)
                  ? 'border-black bg-gray-50'
                  : 'border-gray-100'
              }`}
              onClick={() => toggleTimeSlot(option.value)}
            >
              <Text className="block text-base">{option.icon}</Text>
              <Text className="block text-sm text-gray-700">{option.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 话题偏好 */}
      <View className="p-4 border-b border-gray-100">
        <Text className="block text-sm font-semibold text-gray-900 mb-3">Ta喜欢聊什么话题？（可多选）</Text>
        <View className="flex flex-wrap gap-2">
          {topicOptions.map((option) => (
            <View
              key={option.value}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border ${
                topicPreferences.includes(option.value)
                  ? 'border-black bg-gray-50'
                  : 'border-gray-100'
              }`}
              onClick={() => toggleTopic(option.value)}
            >
              <Text className="block text-base">{option.icon}</Text>
              <Text className="block text-sm text-gray-700">{option.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 沟通风格 */}
      <View className="p-4 border-b border-gray-100">
        <Text className="block text-sm font-semibold text-gray-900 mb-3">Ta的沟通风格是怎样的？</Text>
        <View className="space-y-2">
          {styleOptions.map((option) => (
            <View
              key={option.value}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                communicationStyle === option.value
                  ? 'border-black bg-gray-50'
                  : 'border-gray-100'
              }`}
              onClick={() => setCommunicationStyle(option.value)}
            >
              <View>
                <Text className="block text-sm text-gray-800">{option.label}</Text>
                <Text className="block text-xs text-gray-400">{option.desc}</Text>
              </View>
              {communicationStyle === option.value && (
                <Check size={16} color="#000" />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* 保存按钮 */}
      <View className="p-4">
        <Button 
          className="w-full bg-black" 
          onClick={handleSave}
          disabled={saving || (!responseSpeed && activeTimeSlots.length === 0 && topicPreferences.length === 0 && !communicationStyle)}
        >
          {saving ? (
            <Loader size={16} color="#fff" className="animate-spin" />
          ) : null}
          <Text className="text-white">{saving ? '保存中' : '保存'}</Text>
        </Button>
      </View>
    </View>
  )
}

export default ManualBehaviorForm
