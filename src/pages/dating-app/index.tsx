import { View, Text } from '@tarojs/components'
import { useLoad, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { User, Image, MessageSquare, Sparkles } from 'lucide-react-taro'

interface DatingFeature {
  id: string
  title: string
  subtitle: string
  icon: typeof User
  pagePath: string
  iconBg: string
  iconColor: string
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
  },
  {
    id: 'photo',
    title: '照片评分',
    subtitle: '上传照片，AI评估吸引力并给出改进建议',
    icon: Image,
    pagePath: '/pages/dating-photo/index',
    iconBg: 'bg-amber-100',
    iconColor: '#f59e0b',
  },
  {
    id: 'opener',
    title: '开场白生成',
    subtitle: '根据对方资料，生成个性化开场白',
    icon: MessageSquare,
    pagePath: '/pages/dating-opener/index',
    iconBg: 'bg-green-100',
    iconColor: '#22c55e',
  },
]

const DatingAppPage: FC = () => {
  useLoad(() => {
    console.log('Dating app assistant page loaded.')
  })

  const goToFeature = (path: string) => {
    navigateTo({ url: path })
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
            <View
              key={feature.id}
              className="bg-white rounded-2xl p-4 mb-3 flex flex-row items-center"
              onClick={() => goToFeature(feature.pagePath)}
            >
              <View className={`w-12 h-12 ${feature.iconBg} rounded-xl flex items-center justify-center mr-4`}>
                <FeatureIcon size={24} color={feature.iconColor} />
              </View>
              <View className="flex-1">
                <Text className="block text-base font-semibold text-gray-900">
                  {feature.title}
                </Text>
                <Text className="block text-xs text-gray-500 mt-1">
                  {feature.subtitle}
                </Text>
              </View>
              <Text className="text-gray-400 text-lg">→</Text>
            </View>
          )
        })}
      </View>

      {/* 使用提示 */}
      <View className="px-4 mt-4">
        <View className="bg-rose-50 rounded-xl p-4">
          <Text className="block text-sm font-medium text-rose-700 mb-2">💡 使用技巧</Text>
          <Text className="block text-xs text-rose-600 leading-relaxed">
            建议先完成「资料优化」，再进行「照片评分」，最后使用「开场白生成」获得最佳效果。三项优化完成后，匹配率可提升 50% 以上！
          </Text>
        </View>
      </View>
    </View>
  )
}

export default DatingAppPage
