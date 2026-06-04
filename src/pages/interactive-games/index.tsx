import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { Heart, Sparkles, MessageSquare, Brain, Users, Zap, ArrowRight, TrendingUp, Hand, HeartPulse } from 'lucide-react-taro'

interface GameCard {
  id: string
  title: string
  subtitle: string
  description: string
  icon: typeof Heart
  color: string
  pagePath: string
  difficulty: 'easy' | 'medium' | 'hard'
  players: number
}

const games: GameCard[] = [
  {
    id: 'truth-dare',
    title: '真心话大冒险',
    subtitle: '经典破冰游戏',
    description: '通过真心话深入了解对方，通过大冒险增加趣味性。适合初次约会、聚会场景。',
    icon: Heart,
    color: 'from-rose-400 to-pink-500',
    pagePath: '/pages/game-truth-dare/index',
    difficulty: 'easy',
    players: 2,
  },
  {
    id: 'understand',
    title: '深入了解问答',
    subtitle: '快速了解对方',
    description: '精心设计的问题，让你在轻松的氛围中了解对方的三观、兴趣和生活。',
    icon: Sparkles,
    color: 'from-amber-400 to-orange-500',
    pagePath: '/pages/game-understand/index',
    difficulty: 'easy',
    players: 2,
  },
  {
    id: 'tacit',
    title: '默契测试',
    subtitle: '测试你们有多合',
    description: '通过一系列测试题，了解你和对方的默契程度，发现彼此的契合点。',
    icon: Brain,
    color: 'from-blue-400 to-cyan-500',
    pagePath: '/pages/game-tacit/index',
    difficulty: 'medium',
    players: 2,
  },
  {
    id: 'scenario',
    title: '情景模拟',
    subtitle: '模拟真实场景',
    description: '预设约会场景，考验你们的反应和沟通能力，提前适应各种情况。',
    icon: MessageSquare,
    color: 'from-green-400 to-emerald-500',
    pagePath: '/pages/game-scenario/index',
    difficulty: 'medium',
    players: 2,
  },
  {
    id: 'quick',
    title: '快速问答',
    subtitle: '高密度信息交换',
    description: '限时快问快答，在紧张刺激中快速了解对方的真实想法。',
    icon: Zap,
    color: 'from-purple-400 to-violet-500',
    pagePath: '/pages/game-quick/index',
    difficulty: 'hard',
    players: 2,
  },
  {
    id: 'challenge',
    title: '观察力挑战',
    subtitle: '测试你的观察力',
    description: '通过观察和描述对方的外貌、神态、行为，提升你的感知力和表达能力。',
    icon: TrendingUp,
    color: 'from-indigo-400 to-blue-500',
    pagePath: '/pages/game-challenge/index',
    difficulty: 'medium',
    players: 2,
  },
  {
    id: 'touch',
    title: '手心温度',
    subtitle: '渐进式肢体接触',
    description: '从指尖到额头，7个等级循序渐进。用温柔的方式打破身体距离，让触碰自然发生。',
    icon: Hand,
    color: 'from-rose-400 to-red-500',
    pagePath: '/pages/game-touch/index',
    difficulty: 'medium',
    players: 2,
  },
  {
    id: 'mirror',
    title: '双人镜像',
    subtitle: '你做我模仿',
    description: '一人领动一人模仿，从表情到手势再到肢体互动，在模仿中自然靠近彼此。',
    icon: Sparkles,
    color: 'from-violet-400 to-purple-500',
    pagePath: '/pages/game-mirror/index',
    difficulty: 'medium',
    players: 2,
  },
  {
    id: 'pulse',
    title: '心跳同步',
    subtitle: '测量靠近时的心跳',
    description: '测量平静和靠近时的心跳差异——身体不会说谎，心跳加速就是最好的答案。',
    icon: HeartPulse,
    color: 'from-red-400 to-rose-500',
    pagePath: '/pages/game-pulse/index',
    difficulty: 'hard',
    players: 2,
  },
]

const InteractiveGamesPage: FC = () => {
  useLoad(() => {
    console.log('Interactive games page loaded.')
  })

  const goToGame = (path: string) => {
    navigateTo({ url: path })
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '简单'
      case 'medium':
        return '中等'
      case 'hard':
        return '困难'
      default:
        return ''
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-600'
      case 'medium':
        return 'bg-amber-100 text-amber-600'
      case 'hard':
        return 'bg-red-100 text-red-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部说明 */}
      <View className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-2">互动游戏</Text>
        <Text className="block text-sm text-gray-200 leading-relaxed">
          精选约会场景互动游戏，通过轻松有趣的方式快速拉近彼此距离，创造美好回忆
        </Text>
      </View>

      {/* 游戏列表 */}
      <View className="p-4">
        <Text className="block text-sm font-medium text-gray-500 mb-3">破冰交流</Text>
        
        <ScrollView scrollY className="max-h-[calc(100vh-280px)]">
          {games.filter(g => !['touch', 'mirror', 'pulse'].includes(g.id)).map((game) => {
            const GameIcon = game.icon
            return (
              <View
                key={game.id}
                className="bg-white rounded-2xl mb-4 overflow-hidden"
                onClick={() => goToGame(game.pagePath)}
              >
                {/* 游戏头部 */}
                <View className={`bg-gradient-to-r ${game.color} px-4 py-4`}>
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                        <GameIcon size={20} color="white" />
                      </View>
                      <View className="flex-1">
                        <Text className="block text-base font-semibold text-white">{game.title}</Text>
                        <Text className="block text-xs text-gray-200">{game.subtitle}</Text>
                      </View>
                    </View>
                    <View className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                      <ArrowRight size={18} color="white" />
                    </View>
                  </View>
                </View>

                {/* 游戏内容 */}
                <View className="p-4">
                  <Text className="block text-sm text-gray-600 leading-relaxed mb-3">
                    {game.description}
                  </Text>

                  {/* 游戏信息 */}
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center gap-2">
                      <View className={`px-2 py-1 rounded-full ${getDifficultyColor(game.difficulty)}`}>
                        <Text className="text-xs">{getDifficultyText(game.difficulty)}</Text>
                      </View>
                      <View className="flex flex-row items-center">
                        <Users size={14} color="#9ca3af" />
                        <Text className="text-xs text-gray-500 ml-1">{game.players} 人</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-purple-600 font-medium">开始游戏 →</Text>
                  </View>
                </View>
              </View>
            )
          })}

          {/* 肢体进挪分区 */}
          <View className="flex flex-row items-center mt-2 mb-3">
            <View className="h-px bg-rose-200 flex-1" />
            <Text className="text-sm font-medium text-rose-500 mx-3">肢体进挪</Text>
            <View className="h-px bg-rose-200 flex-1" />
          </View>

          {games.filter(g => ['touch', 'mirror', 'pulse'].includes(g.id)).map((game) => {
            const GameIcon = game.icon
            return (
              <View
                key={game.id}
                className="bg-white rounded-2xl mb-4 overflow-hidden border border-rose-100"
                onClick={() => goToGame(game.pagePath)}
              >
                {/* 游戏头部 */}
                <View className={`bg-gradient-to-r ${game.color} px-4 py-4`}>
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                        <GameIcon size={20} color="white" />
                      </View>
                      <View className="flex-1">
                        <Text className="block text-base font-semibold text-white">{game.title}</Text>
                        <Text className="block text-xs text-gray-200">{game.subtitle}</Text>
                      </View>
                    </View>
                    <View className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                      <ArrowRight size={18} color="white" />
                    </View>
                  </View>
                </View>

                {/* 游戏内容 */}
                <View className="p-4">
                  <Text className="block text-sm text-gray-600 leading-relaxed mb-3">
                    {game.description}
                  </Text>

                  {/* 游戏信息 */}
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center gap-2">
                      <View className={`px-2 py-1 rounded-full ${getDifficultyColor(game.difficulty)}`}>
                        <Text className="text-xs">{getDifficultyText(game.difficulty)}</Text>
                      </View>
                      <View className="flex flex-row items-center">
                        <Users size={14} color="#9ca3af" />
                        <Text className="text-xs text-gray-500 ml-1">{game.players} 人</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-rose-600 font-medium">开始游戏 →</Text>
                  </View>
                </View>
              </View>
            )
          })}
        </ScrollView>
      </View>

      {/* 底部提示 */}
      <View className="bg-white border-t border-gray-100 px-4 py-3 mt-4">
        <View className="flex flex-row items-center">
          <Sparkles size={16} color="#a855f7" />
          <Text className="block text-xs text-gray-500 ml-2">
            提示：选择适合当前约会阶段的游戏，循序渐进，效果更佳
          </Text>
        </View>
      </View>
    </View>
  )
}

export default InteractiveGamesPage
