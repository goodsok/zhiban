import { View, Text } from '@tarojs/components'
import { useLoad, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { Pencil, Search, Calendar, Sparkles } from 'lucide-react-taro'
import CustomHeader from '@/components/custom-header'

const MomentsPage: FC = () => {
  useLoad(() => {
    console.log('Moments page loaded.')
  })

  const features = [
    {
      id: 'create',
      title: '发圈助手',
      subtitle: 'AI生成有吸引力的朋友圈文案',
      icon: Pencil,
      pagePath: '/pages/moments-create/index',
      bgColor: 'bg-gradient-to-br from-green-500 to-teal-500',
    },
    {
      id: 'analyze',
      title: '朋友圈分析',
      subtitle: '分析对方朋友圈，找出切入话题',
      icon: Search,
      pagePath: '/pages/moments-analyze/index',
      bgColor: 'bg-gradient-to-br from-green-400 to-teal-500',
    },
    {
      id: 'history',
      title: '发布记录',
      subtitle: '查看历史发布的朋友圈',
      icon: Calendar,
      pagePath: '/pages/moments-history/index',
      bgColor: 'bg-gradient-to-br from-green-500 to-emerald-600',
    },
  ]

  const goToFeature = (path: string) => {
    navigateTo({ url: path })
  }

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="朋友圈助手" />

      {/* 功能入口 */}
      <View className="p-4">
        {features.map((feature) => {
          const FeatureIcon = feature.icon
          return (
            <View
              key={feature.id}
              className={`${feature.bgColor} rounded-2xl p-5 mb-4 shadow-soft`}
              onClick={() => goToFeature(feature.pagePath)}
            >
              <View className="flex items-center gap-4">
                <View className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <FeatureIcon size={24} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="block text-lg font-semibold text-white">
                    {feature.title}
                  </Text>
                  <Text className="block text-sm text-white mt-1" style={{ opacity: 0.8 }}>
                    {feature.subtitle}
                  </Text>
                </View>
              </View>
            </View>
          )
        })}
      </View>

      {/* 使用提示 */}
      <View className="px-4 mt-4">
        <View className="bg-green-50 rounded-xl p-4">
          <View className="flex items-start gap-4">
            <Sparkles size={20} color="#4ECB71" />
            <View className="flex-1">
              <Text className="block text-sm font-medium text-green-800">使用技巧</Text>
              <Text className="block text-xs text-green-600 mt-1 leading-relaxed">
                发圈助手会根据对象档案信息，为你定制更吸引的朋友圈内容。建议先完善对象档案再使用。
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

export default MomentsPage
