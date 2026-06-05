import { View, Text } from '@tarojs/components'
import { useLoad, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { Moon, MessageCircle, Theater, Zap, BookOpen, Smartphone, Heart, Gamepad2, TrendingUp, MessageSquareText, CalendarHeart, Flame } from 'lucide-react-taro'
import CategoryCard from '@/components/category-card'

interface KnowledgeCategory {
  id: string
  title: string
  subtitle: string
  icon: typeof Moon
  pagePath: string
  iconColor: string
  iconBg: string
}

const categories: KnowledgeCategory[] = [
  {
    id: 'cycle',
    title: '周期科学',
    subtitle: '了解周期规律，把握最佳时机',
    icon: Moon,
    pagePath: '/pages/knowledge-cycle/index',
    iconColor: '#A78BFA',
    iconBg: 'bg-violet-50',
  },
  {
    id: 'icebreaker',
    title: '破冰话题',
    subtitle: '告别尴尬，开启轻松对话',
    icon: MessageCircle,
    pagePath: '/pages/knowledge-icebreaker/index',
    iconColor: '#4ECB71',
    iconBg: 'bg-green-50',
  },
  {
    id: 'scenario',
    title: '场景演练',
    subtitle: '模拟真实场景，提升互动能力',
    icon: Theater,
    pagePath: '/pages/knowledge-scenario/index',
    iconColor: '#F0C75E',
    iconBg: 'bg-amber-50',
  },
  {
    id: 'speed-plan',
    title: '速推方案',
    subtitle: 'AI生成个性化推进方案',
    icon: Zap,
    pagePath: '/pages/speed-plan-list/index',
    iconColor: '#4ECB71',
    iconBg: 'bg-green-50',
  },
  {
    id: 'story',
    title: '故事生成器',
    subtitle: '把故事变成高能量内容',
    icon: BookOpen,
    pagePath: '/pages/story-list/index',
    iconColor: '#F0C75E',
    iconBg: 'bg-amber-50',
  },
  {
    id: 'moments',
    title: '朋友圈助手',
    subtitle: '打造有吸引力的朋友圈',
    icon: Smartphone,
    pagePath: '/pages/moments/index',
    iconColor: '#60A5FA',
    iconBg: 'bg-blue-50',
  },
  {
    id: 'dating-app',
    title: '交友软件助手',
    subtitle: '优化资料，提升匹配率',
    icon: Heart,
    pagePath: '/pages/dating-app/index',
    iconColor: '#E87461',
    iconBg: 'bg-white',
  },
  {
    id: 'games',
    title: '互动游戏',
    subtitle: '约会破冰，快速拉近距离',
    icon: Gamepad2,
    pagePath: '/pages/interactive-games/index',
    iconColor: '#A78BFA',
    iconBg: 'bg-violet-50',
  },
  {
    id: 'grow',
    title: '共同成长',
    subtitle: '一起变得更好的每一天',
    icon: TrendingUp,
    pagePath: '/pages/grow/index',
    iconColor: '#4ECB71',
    iconBg: 'bg-green-50',
  },
  {
    id: 'chat-review',
    title: '聊天复盘',
    subtitle: 'AI分析对话，洞察对方心意',
    icon: MessageSquareText,
    pagePath: '/pages/chat-review/index',
    iconColor: '#60A5FA',
    iconBg: 'bg-blue-50',
  },
  {
    id: 'date-plan',
    title: '约会计划',
    subtitle: 'AI定制专属约会方案',
    icon: CalendarHeart,
    pagePath: '/pages/date-plan/index',
    iconColor: '#EC4899',
    iconBg: 'bg-pink-50',
  },
  {
    id: 'sweet-talk',
    title: '情话生成器',
    subtitle: '自然不油腻，让对方心动',
    icon: Flame,
    pagePath: '/pages/sweet-talk/index',
    iconColor: '#E87461',
    iconBg: 'bg-white',
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
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部 */}
      <View className="bg-white px-4 py-4 border-b">
        <Text className="block text-xl font-bold text-gray-900">发现</Text>
      </View>

      {/* 知识分类入口 - 两列网格 */}
      <View className="p-4">
        <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {categories.map((category) => {
            return (
              <View
                key={category.id}
                style={{ width: '48%', marginBottom: '12px' }}
              >
                <CategoryCard
                  title={category.title}
                  subtitle={category.subtitle}
                  icon={category.icon}
                  iconColor={category.iconColor}
                  iconBg={category.iconBg}
                  onClick={() => goToCategory(category.pagePath)}
                />
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
