/**
 * 相处模式组件
 *
 * 展示从维度数据合成的7个行为侧写模块：
 * - 沟通节奏：回复速度、沟通偏好、线上/线下风格
 * - 情感表达：情绪表达方式、共情能力、亲密需求
 * - 冲突模式：冲突处理风格、压力反应、承诺态度
 * - 社交画像：社交活跃度、社交圈特点、独处/群聚偏好
 * - 生活节奏：作息规律、兴趣偏好、消费习惯、生活态度
 * - 恋爱风格：恋爱模式、约会偏好、承诺准备、关系期望
 * - 亲密边界：身体接触偏好、隐私边界、情感投入节奏
 */

import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { MessageCircle, Heart, Swords, Users, Clock, Flame, Lock, Sparkles, RefreshCw } from 'lucide-react-taro'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'

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
  lifeRhythm: BehaviorSection
  loveStyle: BehaviorSection
  intimacyBoundary: BehaviorSection
}

interface InteractionProfileProps {
  matchId: string
}

/** 模块配置 — 7色系 */
const SECTION_CONFIG = [
  {
    key: 'communicationRhythm' as const,
    icon: MessageCircle,
    gradient: ['#3B82F6', '#60A5FA'],
    bg: '#F0F7FF',
    border: '#93C5FD',
    tag: '#DBEAFE',
  },
  {
    key: 'emotionalExpression' as const,
    icon: Heart,
    gradient: ['#EF4444', '#F87171'],
    bg: '#FFF1F2',
    border: '#FCA5A5',
    tag: '#FFE4E6',
  },
  {
    key: 'conflictPattern' as const,
    icon: Swords,
    gradient: ['#F59E0B', '#FBBF24'],
    bg: '#FFFBEB',
    border: '#FCD34D',
    tag: '#FEF3C7',
  },
  {
    key: 'socialPortrait' as const,
    icon: Users,
    gradient: ['#10B981', '#34D399'],
    bg: '#ECFDF5',
    border: '#6EE7B7',
    tag: '#D1FAE5',
  },
  {
    key: 'lifeRhythm' as const,
    icon: Clock,
    gradient: ['#8B5CF6', '#A78BFA'],
    bg: '#F5F3FF',
    border: '#C4B5FD',
    tag: '#EDE9FE',
  },
  {
    key: 'loveStyle' as const,
    icon: Flame,
    gradient: ['#EC4899', '#F472B6'],
    bg: '#FDF2F8',
    border: '#F9A8D4',
    tag: '#FCE7F3',
  },
  {
    key: 'intimacyBoundary' as const,
    icon: Lock,
    gradient: ['#6366F1', '#818CF8'],
    bg: '#EEF2FF',
    border: '#A5B4FC',
    tag: '#E0E7FF',
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
      <View className="flex flex-col items-center justify-center py-10 px-4">
        <View className="mb-3">
          <Sparkles size={44} color="#6366F1" />
        </View>
        <Text className="block text-lg font-semibold text-gray-800 mb-2">相处模式分析</Text>
        <Text className="block text-sm text-gray-500 text-center leading-relaxed mb-1">
          从维度数据中合成7个行为侧写
        </Text>
        <Text className="block text-xs text-gray-400 text-center leading-relaxed mb-6">
          沟通节奏 · 情感表达 · 冲突模式 · 社交画像{"\n"}
          生活节奏 · 恋爱风格 · 亲密边界
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
      <View className="flex flex-col items-center justify-center py-10 px-4">
        <View className="mb-3 animate-pulse">
          <Sparkles size={44} color="#6366F1" />
        </View>
        <Text className="block text-base font-medium text-gray-700 mb-2">正在扫描维度数据...</Text>
        <Text className="block text-sm text-gray-400">合成行为侧写中，请稍候</Text>
      </View>
    )
  }

  // 无数据
  if (!profile) {
    return (
      <View className="flex flex-col items-center justify-center py-10 px-4">
        <Text className="block text-sm text-gray-400">暂无相处模式数据</Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col gap-3 pb-6">
      {/* 7个行为模块 */}
      {SECTION_CONFIG.map(config => {
        const section = profile[config.key]
        if (!section) return null
        const IconComp = config.icon
        const isEmpty = !section.description || section.description === '暂无足够数据'

        return (
          <View
            key={config.key}
            className="rounded-xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${config.bg} 0%, white 100%)`,
              borderLeft: `3px solid ${config.gradient[0]}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {/* 头部 */}
            <View className="flex flex-row items-center gap-2 px-4 pt-4 pb-2">
              <View
                className="rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${config.gradient[0]}, ${config.gradient[1]})`,
                  width: '28px',
                  height: '28px',
                }}
              >
                <IconComp size={16} color="#fff" />
              </View>
              <Text className="block text-sm font-bold" style={{ color: config.gradient[0] }}>
                {section.title}
              </Text>
            </View>

            {/* 描述 */}
            <View className="px-4 pb-2">
              <Text className="block text-sm text-gray-700 leading-relaxed">
                {isEmpty ? '维度数据不足，请先填写更多维度' : section.description}
              </Text>
            </View>

            {/* 标签 */}
            {section.tags && section.tags.length > 0 && (
              <View className="flex flex-row flex-wrap gap-2 px-4 pb-4">
                {section.tags.map((tag, idx) => (
                  <View
                    key={idx}
                    className="rounded-full px-3 py-1"
                    style={{ backgroundColor: config.tag }}
                  >
                    <Text className="block text-xs font-medium" style={{ color: config.gradient[0] }}>
                      {tag.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )
      })}

      {/* 重新分析按钮 */}
      <View className="flex flex-row justify-center mt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchProfile(true)}
          disabled={loading}
          className="flex flex-row items-center gap-1"
        >
          <RefreshCw size={14} color="#9CA3AF" />
          <Text className="text-xs text-gray-400">{loading ? '分析中...' : '重新分析'}</Text>
        </Button>
      </View>
    </View>
  )
}
