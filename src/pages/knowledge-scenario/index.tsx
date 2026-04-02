import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import CustomHeader from '@/components/custom-header'
import { ChevronDown, ChevronUp, Users, Coffee, Heart, MessageCircle } from 'lucide-react-taro'

interface Scenario {
  id: string
  title: string
  description: string
  tips: string[]
  icon: typeof Users
  color: string
  bgColor: string
}

const scenarios: Scenario[] = [
  {
    id: 'blind-date',
    title: '相亲场景',
    description: '初次见面，如何留下好印象',
    tips: [
      '提前了解对方基本情况',
      '选择舒适的环境',
      '准备几个通用话题',
      '注意倾听和互动',
    ],
    icon: Users,
    color: '#EC4899',
    bgColor: 'bg-pink-50',
  },
  {
    id: 'first-date',
    title: '首次约会',
    description: '从陌生到熟悉的破冰之旅',
    tips: [
      '选择双方都感兴趣的活动',
      '保持轻松愉快的氛围',
      '适时表达关心',
      '注意细节，展现绅士风度',
    ],
    icon: Coffee,
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
  },
  {
    id: 'daily-chat',
    title: '日常聊天',
    description: '维持热度的沟通技巧',
    tips: [
      '分享日常趣事',
      '关注对方情绪变化',
      '适时的关心和问候',
      '制造小惊喜',
    ],
    icon: MessageCircle,
    color: '#3B82F6',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'relationship-progress',
    title: '关系推进',
    description: '如何让关系更进一步',
    tips: [
      '创造共同回忆',
      '逐步深入话题',
      '表达真实的自己',
      '把握表白时机',
    ],
    icon: Heart,
    color: '#EF4444',
    bgColor: 'bg-red-50',
  },
]

const KnowledgeScenarioPage: FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useLoad(() => {
    console.log('Knowledge scenario page loaded.')
  })

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <CustomHeader title="场景演练" />

      {/* 说明 */}
      <View className="px-4 py-4 bg-white border-b border-gray-100">
        <Text className="block text-sm text-gray-600">
          模拟真实场景，掌握互动技巧，让你在任何场合都能从容应对
        </Text>
      </View>

      {/* 场景列表 */}
      <View className="p-4">
        {scenarios.map((scenario) => {
          const ScenarioIcon = scenario.icon
          const isExpanded = expandedId === scenario.id
          
          return (
            <View
              key={scenario.id}
              className="bg-white rounded-2xl mb-3 overflow-hidden"
            >
              {/* 标题区域 */}
              <View
                className="p-4 flex items-center justify-between"
                onClick={() => toggleExpand(scenario.id)}
              >
                <View className="flex items-center gap-3">
                  <View className={`w-10 h-10 ${scenario.bgColor} rounded-xl flex items-center justify-center`}>
                    <ScenarioIcon size={20} color={scenario.color} />
                  </View>
                  <View>
                    <Text className="block text-base font-semibold text-gray-900">
                      {scenario.title}
                    </Text>
                    <Text className="block text-xs text-gray-500 mt-1">
                      {scenario.description}
                    </Text>
                  </View>
                </View>
                {isExpanded ? (
                  <ChevronUp size={18} color="#9CA3AF" />
                ) : (
                  <ChevronDown size={18} color="#9CA3AF" />
                )}
              </View>

              {/* 展开内容 */}
              {isExpanded && (
                <View className="px-4 pb-4 pt-1">
                  <View className="bg-gray-50 rounded-xl p-4">
                    <Text className="block text-xs font-medium text-gray-700 mb-3">
                      实操要点
                    </Text>
                    {scenario.tips.map((tip, index) => (
                      <View key={index} className="flex items-start gap-2 mb-2 last:mb-0">
                        <View className="w-5 h-5 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1">
                          <Text className="block text-xs text-gray-500">{index + 1}</Text>
                        </View>
                        <Text className="block text-sm text-gray-600 flex-1">
                          {tip}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )
        })}
      </View>

      {/* 提示 */}
      <View className="px-4 pb-6">
        <Text className="block text-xs text-gray-400 text-center">
          更多场景演练内容持续更新中...
        </Text>
      </View>
    </View>
  )
}

export default KnowledgeScenarioPage
