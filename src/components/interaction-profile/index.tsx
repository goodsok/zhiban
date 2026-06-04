/**
 * 相处模式组件
 *
 * 展示从维度数据合成的4个行为侧写模块：
 * - 沟通节奏：回复速度、沟通偏好、线上/线下风格
 * - 情感表达：情绪表达方式、共情能力、亲密需求
 * - 冲突模式：冲突处理风格、压力反应、承诺态度
 * - 社交画像：社交活跃度、社交圈特点、独处/群聚偏好
 */

import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { MessageCircle, Heart, Swords, Users, Sparkles, RefreshCw } from 'lucide-react-taro'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/** 行为标签 */
interface BehaviorTag {
  label: string
  dimensionKey: string
}

/** 行为模块 */
interface BehaviorSection {
  title: string
  description: string
  tags: BehaviorTag[]
}

/** 相处模式数据 */
export interface InteractionProfileData {
  communicationRhythm: BehaviorSection
  emotionalExpression: BehaviorSection
  conflictPattern: BehaviorSection
  socialPortrait: BehaviorSection
}

interface InteractionProfileProps {
  matchId: string
}

/** 模块配置 */
const SECTION_CONFIG = [
  {
    key: 'communicationRhythm' as const,
    icon: MessageCircle,
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  {
    key: 'emotionalExpression' as const,
    icon: Heart,
    color: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  {
    key: 'conflictPattern' as const,
    icon: Swords,
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  {
    key: 'socialPortrait' as const,
    icon: Users,
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
]

export default function InteractionProfile({ matchId }: InteractionProfileProps) {
  const [profile, setProfile] = useState<InteractionProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [requested, setRequested] = useState(false)

  // 页面加载时尝试获取已缓存的相处模式
  useEffect(() => {
    fetchProfile(false)
  }, [matchId])

  const fetchProfile = async (forceRefresh = false) => {
    if (loading) return
    setLoading(true)
    setRequested(true)

    try {
      console.log('[InteractionProfile] Fetching profile for match:', matchId, 'forceRefresh:', forceRefresh)
      const url = forceRefresh
        ? `/api/portrait/${matchId}/interaction-profile?forceRefresh=true`
        : `/api/portrait/${matchId}/interaction-profile`
      const res = await Network.request({
        url,
        method: 'GET',
      })
      console.log('[InteractionProfile] Response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setProfile(res.data.data)
      }
    } catch (error) {
      console.error('[InteractionProfile] Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 未请求态：展示说明 + 开始按钮
  if (!requested && !loading && !profile) {
    return (
      <View className="flex flex-col items-center justify-center py-12 px-4">
        <View className="mb-4">
          <Sparkles size={48} color="#6366F1" />
        </View>
        <Text className="block text-lg font-semibold text-gray-800 mb-2">相处模式分析</Text>
        <Text className="block text-sm text-gray-500 text-center leading-relaxed mb-6">
          基于维度数据，合成对方在日常相处中的行为侧写{"\n"}
          沟通节奏 · 情感表达 · 冲突模式 · 社交画像
        </Text>
        <Button onClick={() => fetchProfile(false)} size="sm">
          <Text>开始分析</Text>
        </Button>
      </View>
    )
  }

  // 加载态
  if (loading && !profile) {
    return (
      <View className="flex flex-col items-center justify-center py-12 px-4">
        <View className="mb-4 animate-pulse">
          <Sparkles size={48} color="#6366F1" />
        </View>
        <Text className="block text-base font-medium text-gray-700 mb-2">正在扫描维度数据...</Text>
        <Text className="block text-sm text-gray-400">合成行为侧写中，请稍候</Text>
      </View>
    )
  }

  // 无数据
  if (!profile) {
    return (
      <View className="flex flex-col items-center justify-center py-12 px-4">
        <Text className="block text-sm text-gray-400">暂无相处模式数据</Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col gap-4 pb-6">
      {/* 4个行为模块 */}
      {SECTION_CONFIG.map(config => {
        const section = profile[config.key]
        if (!section) return null
        const IconComp = config.icon

        return (
          <Card key={config.key} className="border-0 shadow-sm" style={{ borderLeft: `3px solid ${config.color}` }}>
            <CardContent className="p-4">
              {/* 标题行 */}
              <View className="flex flex-row items-center gap-2 mb-3">
                <IconComp size={18} color={config.color} />
                <Text className="block text-base font-semibold" style={{ color: config.color }}>{section.title}</Text>
              </View>

              {/* 描述 */}
              <Text className="block text-sm text-gray-700 leading-relaxed mb-3">{section.description}</Text>

              {/* 标签 */}
              {section.tags && section.tags.length > 0 && (
                <View className="flex flex-row flex-wrap gap-2">
                  {section.tags.map((tag, idx) => (
                    <View
                      key={idx}
                      className="rounded-full px-3 py-1"
                      style={{ backgroundColor: config.bgColor, borderColor: config.borderColor, borderWidth: "1px" }}
                    >
                      <Text className="block text-xs font-medium" style={{ color: config.color }}>{tag.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* 重新分析按钮 */}
      <View className="flex flex-row justify-center mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchProfile(true)}
          disabled={loading}
          className="flex flex-row items-center gap-1"
        >
          <RefreshCw size={14} color="#9CA3AF" />
          <Text className="text-xs text-gray-400">{loading ? "分析中..." : "重新分析"}</Text>
        </Button>
      </View>
    </View>
  )
}
