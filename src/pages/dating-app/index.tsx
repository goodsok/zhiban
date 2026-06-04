import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { User, Image, MessageSquare, Sparkles, ChevronRight } from 'lucide-react-taro'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'

interface FeatureStatus {
  profileCount: number
  photoCount: number
  openerCount: number
}

interface DatingFeature {
  id: string
  title: string
  subtitle: string
  icon: typeof User
  pagePath: string
  iconBg: string
  iconColor: string
  statusKey: keyof FeatureStatus
}

const features: DatingFeature[] = [
  {
    id: 'profile',
    title: '资料优化',
    subtitle: 'AI分析你的交友资料，给出专业优化建议',
    icon: User,
    pagePath: '/pages/dating-profile/index',
    iconBg: 'bg-blue-100',
    iconColor: '#3b82f6',
    statusKey: 'profileCount',
  },
  {
    id: 'photo',
    title: '照片评分',
    subtitle: '上传照片，AI评估吸引力并给出改进建议',
    icon: Image,
    pagePath: '/pages/dating-photo/index',
    iconBg: 'bg-amber-100',
    iconColor: '#f59e0b',
    statusKey: 'photoCount',
  },
  {
    id: 'opener',
    title: '开场白生成',
    subtitle: '根据对方资料，生成个性化开场白',
    icon: MessageSquare,
    pagePath: '/pages/dating-opener/index',
    iconBg: 'bg-green-100',
    iconColor: '#22c55e',
    statusKey: 'openerCount',
  },
]

const DatingAppPage: FC = () => {
  const [featureStatus, setFeatureStatus] = useState<FeatureStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useLoad(() => {
    console.log('Dating app assistant page loaded.')
  })

  useEffect(() => {
    loadFeatureStatus()
  }, [])

  const loadFeatureStatus = async () => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/dating/status',
        method: 'GET',
      })
      console.log('Feature status response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setFeatureStatus(res.data.data)
      }
    } catch (error) {
      console.error('Load feature status error:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToFeature = (path: string) => {
    navigateTo({ url: path })
  }

  const getStatusLabel = (feature: DatingFeature) => {
    if (!featureStatus) return null
    const count = featureStatus[feature.statusKey]
    if (count > 0) {
      return (
        <View className="bg-rose-100 rounded-full px-2 py-0.5">
          <Text className="text-xs text-rose-600">已用{count}次</Text>
        </View>
      )
    }
    return (
      <View className="bg-gray-100 rounded-full px-2 py-0.5">
        <Text className="text-xs text-gray-500">未使用</Text>
      </View>
    )
  }

  const getNextStep = () => {
    if (!featureStatus) return null
    if (featureStatus.profileCount === 0) return '建议先体验「资料优化」，打好基础再优化其他方面'
    if (featureStatus.photoCount === 0) return '资料优化已完成，接下来试试「照片评分」吧'
    if (featureStatus.openerCount === 0) return '照片评分已完成，最后试试「开场白生成」'
    return '三项功能都已体验，可以随时回来继续优化'
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部标题区 */}
      <View className="bg-gradient-to-br from-rose-500 to-pink-500 px-4 py-6">
        <View className="flex flex-row items-center justify-center mb-2">
          <Sparkles size={24} color="#fff" />
          <Text className="block text-xl font-bold text-white ml-2">交友软件助手</Text>
        </View>
        <Text className="block text-sm text-center text-rose-100">
          优化你的交友资料，提升匹配率
        </Text>
      </View>

      {/* 功能列表 */}
      <View className="p-4">
        {features.map((feature) => {
          const FeatureIcon = feature.icon
          return (
            <Card
              key={feature.id}
              className="mb-3"
              onClick={() => goToFeature(feature.pagePath)}
            >
              <CardContent className="py-4 flex flex-row items-center">
                <View className={`w-12 h-12 ${feature.iconBg} rounded-xl flex items-center justify-center mr-4`}>
                  <FeatureIcon size={24} color={feature.iconColor} />
                </View>
                <View className="flex-1">
                  <View className="flex flex-row items-center mb-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {feature.title}
                    </Text>
                    {getStatusLabel(feature)}
                  </View>
                  <Text className="block text-xs text-gray-500">
                    {feature.subtitle}
                  </Text>
                </View>
                <ChevronRight size={20} color="#d1d5db" />
              </CardContent>
            </Card>
          )
        })}
      </View>

      {/* 使用提示 */}
      <View className="px-4 mt-4">
        <Card className="bg-rose-50 border-0">
          <CardContent className="py-4">
            <Text className="block text-sm font-medium text-rose-700 mb-2">使用技巧</Text>
            <Text className="block text-xs text-rose-600 leading-relaxed">
              {getNextStep() || '建议先完成「资料优化」，再进行「照片评分」，最后使用「开场白生成」获得最佳效果。三项优化完成后，匹配率可提升 50% 以上！'}
            </Text>
            {!loading && featureStatus && (
              <View className="mt-3 flex flex-row gap-2">
                <View className="flex-1 bg-white rounded-lg p-2 flex flex-col items-center">
                  <Text className="block text-lg font-bold text-blue-500">{featureStatus.profileCount}</Text>
                  <Text className="block text-xs text-gray-500">资料优化</Text>
                </View>
                <View className="flex-1 bg-white rounded-lg p-2 flex flex-col items-center">
                  <Text className="block text-lg font-bold text-amber-500">{featureStatus.photoCount}</Text>
                  <Text className="block text-xs text-gray-500">照片评分</Text>
                </View>
                <View className="flex-1 bg-white rounded-lg p-2 flex flex-col items-center">
                  <Text className="block text-lg font-bold text-green-500">{featureStatus.openerCount}</Text>
                  <Text className="block text-xs text-gray-500">开场白</Text>
                </View>
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

export default DatingAppPage
