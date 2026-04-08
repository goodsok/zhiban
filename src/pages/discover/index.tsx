import { View, Text } from '@tarojs/components'
import { useLoad, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { Moon, MessageCircle, Theater, Zap, BookOpen, Smartphone, Heart, Gamepad2 } from 'lucide-react-taro'

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
    bgColor: 'bg-white border border-gray-200',
    iconBg: 'bg-gray-100',
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
  {
    id: 'scenario',
    title: '场景演练',
    subtitle: '模拟真实场景，提升互动能力',
    icon: Theater,
    pagePath: '/pages/knowledge-scenario/index',
    bgColor: 'bg-white border border-gray-200',
    iconBg: 'bg-gray-100',
  },
  {
    id: 'speed-plan',
    title: '速推方案',
    subtitle: 'AI生成个性化推进方案',
    icon: Zap,
    pagePath: '/pages/speed-plan-list/index',
    bgColor: 'bg-white border border-gray-200',
    iconBg: 'bg-gray-100',
  },
  {
    id: 'story',
    title: '故事生成器',
    subtitle: '把故事变成高能量内容',
    icon: BookOpen,
    pagePath: '/pages/story-list/index',
    bgColor: 'bg-white border border-gray-200',
    iconBg: 'bg-amber-50',
  },
  {
    id: 'moments',
    title: '朋友圈助手',
    subtitle: '打造有吸引力的朋友圈',
    icon: Smartphone,
    pagePath: '/pages/moments/index',
    bgColor: 'bg-white border border-gray-200',
    iconBg: 'bg-indigo-50',
  },
  {
    id: 'dating-app',
    title: '交友软件助手',
    subtitle: '优化资料，提升匹配率',
    icon: Heart,
    pagePath: '/pages/dating-app/index',
    bgColor: 'bg-white border border-gray-200',
    iconBg: 'bg-rose-50',
  },
  {
    id: 'games',
    title: '互动游戏',
    subtitle: '约会破冰，快速拉近距离',
    icon: Gamepad2,
    pagePath: '/pages/interactive-games/index',
    bgColor: 'bg-white border border-gray-200',
    iconBg: 'bg-purple-50',
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
        <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {categories.map((category) => {
            const CategoryIcon = category.icon
            return (
              <View
                key={category.id}
                style={{ width: '48%', marginBottom: '12px' }}
                onClick={() => goToCategory(category.pagePath)}
              >
                <View className={`${category.bgColor} rounded-2xl p-4`}>
                  {/* 图标 */}
                  <View className={`w-11 h-11 ${category.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                    <CategoryIcon size={22} color="#374151" />
                  </View>
                  {/* 标题 */}
                  <Text className="block text-base font-semibold text-gray-900">
                    {category.title}
                  </Text>
                  {/* 副标题 */}
                  <Text className="block text-xs mt-1 leading-tight text-gray-500">
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
