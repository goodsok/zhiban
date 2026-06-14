import { View, Text, ScrollView } from '@tarojs/components'
import {
  Calendar, MessageCircle, Phone, Video, Gift, Heart, Users,
} from 'lucide-react-taro'

// 互动类型
export type InteractionType = 'date' | 'chat' | 'call' | 'video' | 'gift' | 'physical' | 'social' | 'other'
export type InteractionCategory = 'online' | 'offline' | 'hybrid'

// 统一的互动类型配置（所有页面共用）
export const INTERACTION_TYPE_CONFIG: Array<{
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
  { type: 'social', label: '聚会', icon: Users, color: '#06B6D4', bgColor: 'bg-cyan-50', category: 'offline' },
]

// 按 type 快速查找的 Map
export const INTERACTION_TYPE_MAP = Object.fromEntries(
  INTERACTION_TYPE_CONFIG.map(item => [item.type, item])
) as Record<InteractionType, typeof INTERACTION_TYPE_CONFIG[number]>

interface InteractionTypeTabProps {
  /** 当前选中类型 */
  value: InteractionType | 'all'
  /** 变更回调 */
  onChange: (type: InteractionType | 'all') => void
  /** 样式变体：'card' 用于创建页（带图标+卡片边框），'pill' 用于列表筛选页（药丸纯文字） */
  variant?: 'card' | 'pill'
  /** 是否显示"全部"选项（列表筛选页需要，创建页不需要） */
  showAll?: boolean
}

export default function InteractionTypeTab({
  value,
  onChange,
  variant = 'card',
  showAll = false,
}: InteractionTypeTabProps) {
  if (variant === 'pill') {
    return (
      <View className="bg-white border-b">
        <ScrollView scrollX className="flex flex-row px-4 py-3" style={{ whiteSpace: 'nowrap' }}>
          {showAll && (
            <View
              className="flex-shrink-0 px-4 py-2 rounded-full"
              style={{ backgroundColor: value === 'all' ? '#1f2937' : '#f3f4f6', marginRight: '12px' }}
              onClick={() => onChange('all')}
            >
              <Text className="block text-sm" style={{ color: value === 'all' ? '#fff' : '#4b5563' }}>全部</Text>
            </View>
          )}
          {INTERACTION_TYPE_CONFIG.map((item, idx) => {
            const isActive = value === item.type
            return (
              <View
                key={item.type}
                className="flex-shrink-0 px-4 py-2 rounded-full"
                style={{ backgroundColor: isActive ? '#1f2937' : '#f3f4f6', marginRight: idx < INTERACTION_TYPE_CONFIG.length - 1 ? '12px' : '0' }}
                onClick={() => onChange(item.type)}
              >
                <Text className="block text-sm" style={{ color: isActive ? '#fff' : '#4b5563' }}>{item.label}</Text>
              </View>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  // card 变体
  return (
    <View className="bg-white px-4 py-3 border-b">
      <ScrollView scrollX className="flex flex-row" style={{ whiteSpace: 'nowrap' }}>
        {INTERACTION_TYPE_CONFIG.map((item, idx) => {
          const IconComponent = item.icon
          const isActive = value === item.type
          return (
            <View
              key={item.type}
              className={`flex-shrink-0 flex flex-col items-center justify-center px-4 py-3 rounded-xl border-2 ${
                isActive
                  ? `${item.bgColor} border-current`
                  : 'bg-gray-50'
              }`}
              style={{ borderColor: isActive ? item.color : undefined, minWidth: '72px', display: 'inline-flex', verticalAlign: 'top', marginRight: idx < INTERACTION_TYPE_CONFIG.length - 1 ? '12px' : '0' }}
              onClick={() => onChange(item.type)}
            >
              <View className="mb-1">
                <IconComponent size={20} color={isActive ? item.color : '#9CA3AF'} />
              </View>
              <Text
                className="block text-sm font-medium"
                style={{ color: isActive ? item.color : '#6B7280' }}
              >
                {item.label}
              </Text>
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}
