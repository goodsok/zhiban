import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { ArrowRight, Users, Sparkles } from 'lucide-react-taro'
import { Network } from '@/network'
import { Skeleton } from '@/components/ui/skeleton'

interface GameCard {
  id: number
  game_key: string
  title: string
  subtitle: string
  description: string
  icon_name: string
  color: string
  page_path: string
  difficulty: string
  players: number
  category: string
  sort_order: number
}

// 图标映射表 - 在前端维护，因为 lucide-react-taro 图标是 React 组件
const ICON_MAP: Record<string, any> = {}

const InteractiveGamesPage: FC = () => {
  const [games, setGames] = useState<GameCard[]>([])
  const [loading, setLoading] = useState(true)

  // 动态加载图标
  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || Sparkles
  }

  const fetchGameList = async () => {
    try {
      console.log('[InteractiveGames] Fetching game list from API...')
      const res = await Network.request({
        url: '/api/game-data/list',
        method: 'GET',
      })
      console.log('[InteractiveGames] Game list response:', res.data)
      const gameList = res.data?.data || []
      setGames(gameList)
    } catch (err) {
      console.error('[InteractiveGames] Failed to fetch game list:', err)
    } finally {
      setLoading(false)
    }
  }

  // 动态导入图标组件
  useEffect(() => {
    const loadIcons = async () => {
      const iconNames = [
        'Heart', 'Sparkles', 'Brain', 'MessageSquare', 'Zap',
        'TrendingUp', 'Hand', 'HeartPulse', 'EyeOff', 'Magnet', 'Wind',
      ]
      try {
        const icons = await import('lucide-react-taro')
        for (const name of iconNames) {
          if (icons[name]) {
            ICON_MAP[name] = icons[name]
          }
        }
      } catch (err) {
        console.error('[InteractiveGames] Failed to load icons:', err)
      }
      // 图标加载完成后再拉数据
      fetchGameList()
    }
    loadIcons()
  }, [])

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

  const physicalKeys = ['touch', 'mirror', 'pulse', 'blind', 'distance', 'breath']
  const icebreakerGames = games.filter(g => !physicalKeys.includes(g.game_key))
  const physicalGames = games.filter(g => physicalKeys.includes(g.game_key))

  const renderGameCard = (game: GameCard, accentColor: string) => {
    const GameIcon = getIconComponent(game.icon_name)
    return (
      <View
        key={game.game_key}
        className="bg-white rounded-2xl shadow-soft mb-4 overflow-hidden"
        onClick={() => goToGame(game.page_path)}
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
          <Text className="block text-sm text-gray-600 leading-relaxed mb-4">
            {game.description}
          </Text>

          {/* 游戏信息 */}
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center gap-3">
              <View className={`px-2 py-1 rounded-full ${getDifficultyColor(game.difficulty)}`}>
                <Text className="text-xs">{getDifficultyText(game.difficulty)}</Text>
              </View>
              <View className="flex flex-row items-center">
                <Users size={14} color="#9ca3af" />
                <Text className="text-xs text-gray-500 ml-1">{game.players} 人</Text>
              </View>
            </View>
            <Text className={`text-xs ${accentColor} font-medium`}>开始游戏 →</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部说明 */}
      <View className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-2">互动游戏</Text>
        <Text className="block text-sm text-gray-200 leading-relaxed">
          精选约会场景互动游戏，通过轻松有趣的方式快速拉近彼此距离，创造美好回忆
        </Text>
      </View>

      {/* 游戏列表 */}
      <View className="p-4">
        <Text className="block text-sm font-medium text-gray-500 mb-4">破冰交流</Text>

        <ScrollView scrollY className="max-h-[calc(100vh-280px)]">
          {loading ? (
            <View className="space-y-4">
              {[1, 2, 3].map(i => (
                <View key={i} className="bg-white rounded-2xl p-4 mb-4">
                  <Skeleton className="h-16 w-full rounded-xl mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </View>
              ))}
            </View>
          ) : (
            <>
              {icebreakerGames.map((game) => renderGameCard(game, 'text-purple-600'))}

              {/* 肢体进挪分区 */}
              <View className="flex flex-row items-center mt-2 mb-4">
                <View className="h-px bg-rose-200 flex-1" />
                <Text className="text-sm font-medium text-rose-500 mx-3">肢体进挪</Text>
                <View className="h-px bg-rose-200 flex-1" />
              </View>

              {physicalGames.map((game) => renderGameCard(game, 'text-rose-600'))}
            </>
          )}
        </ScrollView>
      </View>

      {/* 底部提示 */}
      <View className="bg-white border-t px-4 py-3 mt-4">
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
