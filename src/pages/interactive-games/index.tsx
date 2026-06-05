import { View, Text } from '@tarojs/components'
import { useLoad, navigateTo } from '@tarojs/taro'
import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { ArrowRight, Users, Sparkles, Heart, Brain, MessageSquare, Zap, TrendingUp, Hand, HeartPulse, EyeOff, Magnet, Wind } from 'lucide-react-taro'
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

// 图标映射表 - 静态导入，避免动态加载时序问题
const ICON_MAP: Record<string, any> = {
  Heart,
  Sparkles,
  Brain,
  MessageSquare,
  Zap,
  TrendingUp,
  Hand,
  HeartPulse,
  EyeOff,
  Magnet,
  Wind,
}

// 分类配置 - 使用数据库 category 字段
const CATEGORY_CONFIG: Record<string, { label: string; accentColor: string; dividerColor: string; dividerTextColor: string }> = {
  icebreaker: {
    label: '破冰交流',
    accentColor: 'text-purple-600',
    dividerColor: 'bg-purple-200',
    dividerTextColor: 'text-purple-500',
  },
  physical: {
    label: '肢体进挪',
    accentColor: 'text-rose-600',
    dividerColor: 'bg-rose-200',
    dividerTextColor: 'text-rose-500',
  },
}

const InteractiveGamesPage: FC = () => {
  const [games, setGames] = useState<GameCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || Sparkles
  }

  const fetchGameList = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('[InteractiveGames] Fetching game list from API...')
      const res = await Network.request({
        url: '/api/game-data/list',
        method: 'GET',
      })
      console.log('[InteractiveGames] Game list response:', res.data)
      const gameList = res.data?.data || []
      // 按 sort_order 排序
      gameList.sort((a: GameCard, b: GameCard) => a.sort_order - b.sort_order)
      setGames(gameList)
    } catch (err) {
      console.error('[InteractiveGames] Failed to fetch game list:', err)
      setError('加载游戏列表失败，请下拉刷新重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGameList()
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

  // 按数据库 category 字段分组
  const groupedGames = games.reduce<Record<string, GameCard[]>>((acc, game) => {
    const cat = game.category || 'icebreaker'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(game)
    return acc
  }, {})

  // 按定义顺序输出分类
  const categoryOrder = ['icebreaker', 'physical']
  const orderedCategories = categoryOrder.filter(cat => groupedGames[cat]?.length)
  // 也追加未在 order 中但存在的分类
  Object.keys(groupedGames).forEach(cat => {
    if (!categoryOrder.includes(cat)) orderedCategories.push(cat)
  })

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
        ) : error ? (
          <View className="flex flex-col items-center justify-center py-16">
            <Sparkles size={48} color="#d1d5db" />
            <Text className="block text-gray-400 mt-4 mb-6">{error}</Text>
            <View
              className="px-6 py-2 bg-purple-500 rounded-full"
              onClick={fetchGameList}
            >
              <Text className="text-white text-sm">重新加载</Text>
            </View>
          </View>
        ) : games.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-16">
            <Sparkles size={48} color="#d1d5db" />
            <Text className="block text-gray-400 mt-4">暂无游戏数据</Text>
          </View>
        ) : (
          <>
            {orderedCategories.map((cat, catIdx) => {
              const config = CATEGORY_CONFIG[cat] || {
                label: cat,
                accentColor: 'text-purple-600',
                dividerColor: 'bg-gray-200',
                dividerTextColor: 'text-gray-500',
              }
              return (
                <View key={cat}>
                  {/* 分类标题（第一个分类直接显示文字，后续分类加分隔线） */}
                  {catIdx === 0 ? (
                    <Text className="block text-sm font-medium text-gray-500 mb-4">{config.label}</Text>
                  ) : (
                    <View className="flex flex-row items-center mt-2 mb-4">
                      <View className={`h-px ${config.dividerColor} flex-1`} />
                      <Text className={`text-sm font-medium ${config.dividerTextColor} mx-3`}>{config.label}</Text>
                      <View className={`h-px ${config.dividerColor} flex-1`} />
                    </View>
                  )}
                  {groupedGames[cat].map((game) => renderGameCard(game, config.accentColor))}
                </View>
              )
            })}
          </>
        )}
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
