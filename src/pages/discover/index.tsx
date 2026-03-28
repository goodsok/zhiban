import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Lightbulb, Heart, MessageCircle } from 'lucide-react-taro'

const discoverItems = [
  {
    id: 1,
    type: 'topic',
    title: '破冰话题：最近一次旅行',
    desc: '聊聊旅行经历，了解对方的生活态度',
    scene: '首次约会',
    hot: true,
  },
  {
    id: 2,
    type: 'tip',
    title: '约会技巧：如何制造惊喜',
    desc: '小惊喜能让感情迅速升温',
    scene: '接触中',
    hot: false,
  },
  {
    id: 3,
    type: 'topic',
    title: '深入了解：童年回忆',
    desc: '分享童年趣事，增进了解',
    scene: '约会中',
    hot: false,
  },
  {
    id: 4,
    type: 'tip',
    title: '搭讪技巧：开场白大全',
    desc: '不同场景的开场白建议',
    scene: '搭讪',
    hot: true,
  },
]

const DiscoverPage: FC = () => {
  useLoad(() => {
    console.log('Discover page loaded.')
  })

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <View className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 rounded-b-3xl">
        <Text className="block text-white text-2xl font-bold mb-2">发现</Text>
        <Text className="block text-white text-opacity-80">探索更多互动技巧和话题</Text>
      </View>

      {/* 场景推荐 */}
      <View className="p-4">
        <Text className="block font-semibold text-gray-800 mb-3">场景推荐</Text>
        <View className="grid grid-cols-2 gap-3">
          <Card className="shadow-sm border-0">
            <CardContent className="p-4 text-center">
              <View className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2">
                <Text className="block text-2xl">💑</Text>
              </View>
              <Text className="block font-medium text-gray-800">相亲</Text>
              <Text className="block text-xs text-gray-400">快速破冰技巧</Text>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0">
            <CardContent className="p-4 text-center">
              <View className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                <Text className="block text-2xl">👋</Text>
              </View>
              <Text className="block font-medium text-gray-800">搭讪</Text>
              <Text className="block text-xs text-gray-400">开场白推荐</Text>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0">
            <CardContent className="p-4 text-center">
              <View className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                <Text className="block text-2xl">📱</Text>
              </View>
              <Text className="block font-medium text-gray-800">App见面</Text>
              <Text className="block text-xs text-gray-400">线下约会建议</Text>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0">
            <CardContent className="p-4 text-center">
              <View className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <Text className="block text-2xl">🎉</Text>
              </View>
              <Text className="block font-medium text-gray-800">聚会</Text>
              <Text className="block text-xs text-gray-400">社交技巧</Text>
            </CardContent>
          </Card>
        </View>
      </View>

      {/* 热门内容 */}
      <View className="p-4">
        <View className="flex items-center justify-between mb-3">
          <Text className="block font-semibold text-gray-800">热门内容</Text>
          <Badge variant="outline" className="text-xs">
            <Sparkles size={12} color="#6366F1" />
            <Text className="ml-1">AI推荐</Text>
          </Badge>
        </View>

        {discoverItems.map((item) => (
          <Card key={item.id} className="mb-3 shadow-sm border-0">
            <CardContent className="p-4">
              <View className="flex items-start gap-3">
                <View className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.type === 'topic' ? 'bg-indigo-100' : 'bg-amber-100'
                }`}
                >
                  {item.type === 'topic' ? (
                    <MessageCircle size={20} color="#6366F1" />
                  ) : (
                    <Lightbulb size={20} color="#F59E0B" />
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex items-center gap-2 mb-1">
                    <Text className="block font-medium text-gray-800">{item.title}</Text>
                    {item.hot && (
                      <Badge className="bg-pink-500 text-white text-xs">热门</Badge>
                    )}
                  </View>
                  <Text className="block text-sm text-gray-500 mb-2">{item.desc}</Text>
                  <Badge variant="outline" className="text-xs text-gray-500">
                    适用：{item.scene}
                  </Badge>
                </View>
              </View>
            </CardContent>
          </Card>
        ))}
      </View>

      {/* 每日一题 */}
      <View className="p-4">
        <Card className="shadow-sm border-0 bg-gradient-to-r from-pink-50 to-purple-50">
          <CardContent className="p-4">
            <View className="flex items-center gap-3 mb-3">
              <Heart size={20} color="#EC4899" />
              <Text className="block font-semibold text-gray-800">每日话题</Text>
            </View>
            <Text className="block text-gray-700 mb-3">
              你觉得什么样的约会最浪漫？
            </Text>
            <Text className="block text-sm text-gray-500">
              这个问题可以帮助你了解对方的浪漫期待，为未来的约会做准备。
            </Text>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

export default DiscoverPage
