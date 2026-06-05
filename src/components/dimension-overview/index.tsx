import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { ChevronRight } from 'lucide-react-taro'
import { Badge } from '@/components/ui/badge'

// 维度定义
interface DimensionDefinition {
  dimension_key: string
  display_name: string
  description?: string
  layer: number
  category: string
  data_type: 'int' | 'string' | 'enum' | 'boolean' | 'string[]' | 'float'
  enum_options?: Array<{ value: string; label: string }> | null
  importance?: number
}

// 维度值
interface DimensionValue {
  value: unknown
  source?: string
  confidence?: number | null
}

// 单个维度项
interface DimensionItem {
  definition: DimensionDefinition
  value: DimensionValue | null
}

// 分类配置
const LAYER_CONFIG: Record<number, { name: string; icon: string; color: string; bgColor: string }> = {
  1: { name: '基础画像', icon: '👤', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  2: { name: '关系定位', icon: '💞', color: 'text-pink-700', bgColor: 'bg-pink-50' },
  3: { name: '深层模式', icon: '🔮', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  4: { name: '生活方式', icon: '🌊', color: 'text-emerald-700', bgColor: 'bg-green-50' },
}

const CATEGORY_LABELS: Record<string, string> = {
  identity: '身份信息',
  appearance: '外形特征',
  core_personality: '核心人格',
  education: '教育背景',
  family: '家庭背景',
  life_stage: '人生阶段',
  location: '地域信息',
  relationship_intent: '恋爱意图',
  attachment_style: '依恋风格',
  love_language: '爱的语言',
  communication_style: '沟通风格',
  conflict_style: '冲突处理',
  emotional_pattern: '情感模式',
  personality_detail: '人格细节',
  trust_pattern: '信任模式',
  value_system: '价值观',
  boundary: '边界模式',
  past_experience: '过往经验',
  current_focus: '当下关注',
  emotional_investment: '情感投入',
  relationship_form: '关系形式',
  sexual_intimacy: '亲密偏好',
  time_availability: '时间可用性',
  lifestyle: '生活偏好',
  social_style: '社交风格',
  hobby_interest: '兴趣偏好',
  daily_habit: '日常习惯',
}

interface DimensionOverviewProps {
  dimensions: Record<string, DimensionItem>
  onCategoryClick?: (layer: number, category: string) => void
}

/** 格式化维度值为可读文本 */
const formatValue = (val: unknown, definition: DimensionDefinition): string => {
  if (val === null || val === undefined || val === '') return '未填写'

  // enum 类型，从 enum_options 查找 label
  if (definition.data_type === 'enum' && definition.enum_options) {
    const option = definition.enum_options.find((o) => o.value === val)
    return option?.label || String(val)
  }

  // 数组类型
  if (Array.isArray(val)) {
    if (definition.data_type === 'string[]' && definition.enum_options) {
      return val
        .map((v) => {
          const option = definition.enum_options?.find((o) => o.value === v)
          return option?.label || String(v)
        })
        .join('、')
    }
    return val.join('、')
  }

  // boolean
  if (typeof val === 'boolean') return val ? '是' : '否'

  // int/float 类型（0-100 范围内显示为分数条）
  if (typeof val === 'number' && definition.data_type !== 'int') {
    return String(val)
  }

  return String(val)
}

/** 判断是否为分数型维度（0-100 数值） */
const isScoreDimension = (definition: DimensionDefinition, val: unknown): boolean => {
  if (typeof val !== 'number') return false
  if (definition.data_type === 'int' && val >= 0 && val <= 100) {
    // 区分分数型与普通 int（如出生年份）
    const scoreKeys = [
      'openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism',
      'emotionalStability', 'emotionalExpression', 'empathyLevel', 'emotionalIndependence',
      'socialActivity', 'socialInitiative', 'intimacyNeed', 'trustTendency',
      'communicationDirectness', 'humorStyle', 'responsiveness', 'conversationDepth',
      'jealousyLevel', 'angerExpression', 'selfDisclosure', 'adaptability',
    ]
    return scoreKeys.includes(definition.dimension_key)
  }
  return false
}

/** 获取分数颜色 */
const getScoreColor = (score: number): string => {
  if (score >= 70) return 'bg-blue-500'
  if (score >= 40) return 'bg-blue-400'
  return 'bg-blue-300'
}

const DimensionOverview: FC<DimensionOverviewProps> = ({ dimensions, onCategoryClick }) => {
  // 按层+分类聚合
  const grouped = new Map<string, {
    layer: number
    category: string
    items: Array<{ key: string; definition: DimensionDefinition; value: unknown }>
  }>()

  for (const [key, dim] of Object.entries(dimensions)) {
    const defn = dim.definition
    const groupKey = `${defn.layer}_${defn.category}`
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, { layer: defn.layer, category: defn.category, items: [] })
    }
    const actualVal = dim.value?.value ?? null
    grouped.get(groupKey)!.items.push({ key, definition: defn, value: actualVal })
  }

  // 排序：按层+分类
  const sortedGroups = [...grouped.entries()].sort((a, b) => {
    if (a[1].layer !== b[1].layer) return a[1].layer - b[1].layer
    return a[1].category.localeCompare(b[1].category)
  })

  // 统计
  const totalStats = { total: 0, filled: 0 }
  for (const [, group] of sortedGroups) {
    for (const item of group.items) {
      totalStats.total += 1
      if (item.value !== null && item.value !== undefined && item.value !== '') {
        totalStats.filled += 1
      }
    }
  }

  return (
    <View className="space-y-3">
      {/* 总览进度 */}
      <View className="bg-white rounded-xl p-4">
        <View className="flex items-center justify-between mb-3">
          <Text className="block text-sm font-semibold text-gray-900">维度完成度</Text>
          <Text className="block text-sm font-medium text-blue-600">
            {totalStats.filled}/{totalStats.total}
          </Text>
        </View>
        <View className="w-full h-2 bg-gray-100 border border-gray-300 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${totalStats.total > 0 ? Math.round((totalStats.filled / totalStats.total) * 100) : 0}%` }}
          />
        </View>
        <View className="flex flex-wrap gap-2 mt-3">
          {[1, 2, 3, 4].map((layer) => {
            const config = LAYER_CONFIG[layer]
            const layerItems = sortedGroups.filter(([, g]) => g.layer === layer)
            let filled = 0, total = 0
            for (const [, g] of layerItems) {
              for (const item of g.items) {
                total += 1
                if (item.value !== null && item.value !== undefined && item.value !== '') filled += 1
              }
            }
            return (
              <View key={layer} className="flex items-center gap-1">
                <Text className="block text-xs">{config.icon}</Text>
                <Text className="block text-xs text-gray-600">{config.name}</Text>
                <Text className="block text-xs text-gray-400">{filled}/{total}</Text>
              </View>
            )
          })}
        </View>
      </View>

      {/* 各分类卡片 */}
      {sortedGroups.map(([groupKey, group]) => {
        const config = LAYER_CONFIG[group.layer] || LAYER_CONFIG[1]
        const catLabel = CATEGORY_LABELS[group.category] || group.category
        const filledCount = group.items.filter(
          (i) => i.value !== null && i.value !== undefined && i.value !== ''
        ).length
        const totalCount = group.items.length
        const fillPercent = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0

        return (
          <View
            key={groupKey}
            className="bg-white rounded-xl overflow-hidden"
            onClick={() => onCategoryClick?.(group.layer, group.category)}
          >
            {/* 分类标题 */}
            <View className="flex items-center justify-between px-4 pt-3 pb-2">
              <View className="flex items-center gap-2">
                <View className={`w-6 h-6 rounded flex items-center justify-center ${config.bgColor}`}>
                  <Text className="block text-xs">{config.icon}</Text>
                </View>
                <View>
                  <Text className="block text-sm font-semibold text-gray-900">{catLabel}</Text>
                  <Text className="block text-xs text-gray-400">
                    L{group.layer} · {filledCount}/{totalCount}项
                  </Text>
                </View>
              </View>
              <View className="flex items-center gap-2">
                {fillPercent === 100 && (
                  <Badge className="bg-green-50 text-green-700 text-xs">已完整</Badge>
                )}
                {fillPercent === 0 && (
                  <Badge className="bg-gray-50 text-gray-500 text-xs">待填写</Badge>
                )}
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </View>

            {/* 完成度条 */}
            <View className="px-4 pb-2">
              <View className="w-full h-1 bg-gray-100 border border-gray-300 rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full transition-all ${fillPercent >= 80 ? 'bg-green-400' : fillPercent >= 40 ? 'bg-blue-400' : 'bg-gray-300'}`}
                  style={{ width: `${fillPercent}%` }}
                />
              </View>
            </View>

            {/* 维度值列表 */}
            <View className="px-4 pb-3">
              {group.items.map((item) => {
                const isFilled = item.value !== null && item.value !== undefined && item.value !== ''
                const isScore = isFilled && isScoreDimension(item.definition, item.value)
                const scoreVal = isScore ? (item.value as number) : 0

                return (
                  <View
                    key={item.key}
                    className="flex items-center justify-between py-2 border-t border-gray-100"
                  >
                    <Text className="block text-xs text-gray-500">{item.definition.display_name}</Text>

                    {isScore ? (
                      /* 分数型维度 */
                      <View className="flex items-center gap-2">
                        <View className="w-16 h-1 bg-gray-100 border border-gray-300 rounded-full overflow-hidden">
                          <View
                            className={`h-full rounded-full ${getScoreColor(scoreVal)}`}
                            style={{ width: `${scoreVal}%` }}
                          />
                        </View>
                        <Text className="block text-xs font-medium text-gray-700 w-6 text-right">
                          {scoreVal}
                        </Text>
                      </View>
                    ) : (
                      /* 文本型维度 */
                      <Text
                        className={`block text-xs max-w-[60%] text-right ${isFilled ? 'text-gray-800 font-medium' : 'text-gray-300'}`}
                      >
                        {formatValue(item.value, item.definition)}
                      </Text>
                    )}
                  </View>
                )
              })}
            </View>
          </View>
        )
      })}
    </View>
  )
}

export default DimensionOverview
