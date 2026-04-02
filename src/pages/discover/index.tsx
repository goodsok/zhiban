import { View, Text } from '@tarojs/components'
import { useLoad, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { Moon, MessageCircle } from 'lucide-react-taro'

interface KnowledgeCategory {
  id: string
  title: string
  subtitle: string
  icon: typeof Moon
  pagePath: string
  bgColor: string
  iconBg: string
}

const categories: KnowledgeCategory[] = [
  {
    id: 'cycle',
    title: '周期科学',
    subtitle: '了解周期规律，把握最佳时机',
    icon: Moon,
    pagePath: '/pages/knowledge-cycle/index',
    bgColor: 'bg-gray-900',
    iconBg: 'bg-white',
  },
  {
    id: 'icebreaker',
    title: '破冰话题',
    subtitle: '告别尴尬，开启轻松对话',
    icon: MessageCircle,
    pagePath: '/pages/knowledge-icebreaker/index',
    bgColor: 'bg-white border border-gray-200',
    iconBg: 'bg-gray-100',
  },
]

const DiscoverPage: FC = () => {
  useLoad(() => {
    console.log('Discover page loaded.')
  })

  const goToCategory = (path: string) => {
    navigateTo({ url: path })
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部 - 与首页风格一致 */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="block text-xl font-bold text-gray-900">发现</Text>
      </View>

      {/* 知识分类入口 - 两列网格 */}
      <View className="p-4">
        <View className="flex flex-wrap gap-3">
          {categories.map((category) => {
            const CategoryIcon = category.icon
            return (
              <View
                key={category.id}
                className="w-[calc(50%-6px)]"
                onClick={() => goToCategory(category.pagePath)}
              >
                <View className={`${category.bgColor} rounded-2xl p-4 h-full`}>
                  {/* 图标 */}
                  <View className={`w-11 h-11 ${category.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                    <CategoryIcon size={22} color={category.id === 'cycle' ? '#111827' : '#374151'} />
                  </View>
                  {/* 标题 */}
                  <Text className={`block text-base font-semibold ${category.id === 'cycle' ? 'text-white' : 'text-gray-900'}`}>
                    {category.title}
                  </Text>
                  {/* 副标题 */}
                  <Text className={`block text-xs mt-1 leading-tight ${category.id === 'cycle' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {category.subtitle}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>
      </View>

      {/* 提示文字 */}
      <View className="px-4 mt-4">
        <Text className="block text-xs text-gray-400 text-center">
          更多知识内容持续更新中...
        </Text>
      </View>
    </View>
  )
}

export default DiscoverPage
