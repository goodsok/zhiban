import { View, Text, Image } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  Heart, 
  Camera,
  Calendar,
  Plus
} from 'lucide-react-taro'

// 里程碑数据
const milestones = [
  { id: 1, title: '相识', date: '2024-01-01', icon: '👋', completed: true },
  { id: 2, title: '第一次约会', date: '2024-01-15', icon: '☕', completed: true },
  { id: 3, title: '牵手', date: '2024-01-20', icon: '🤝', completed: true },
  { id: 4, title: '确定关系', date: '2024-02-14', icon: '💕', completed: false },
  { id: 5, title: '第一次旅行', date: '', icon: '✈️', completed: false },
]

// 美好时刻数据
const moments = [
  { 
    id: 1, 
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=300&h=300&fit=crop',
    date: '2024-01-15',
    desc: '第一次约会',
  },
  { 
    id: 2, 
    image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=300&h=300&fit=crop',
    date: '2024-01-20',
    desc: '第一次看电影',
  },
  { 
    id: 3, 
    image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&h=300&fit=crop',
    date: '2024-02-05',
    desc: '一起做饭',
  },
]

const ProgressPage: FC = () => {
  useLoad(() => {
    console.log('Progress page loaded.')
  })

  const completedMilestones = milestones.filter(m => m.completed).length
  const totalMilestones = milestones.length
  const progressPercentage = (completedMilestones / totalMilestones) * 100

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 关系阶段卡片 */}
      <View className="p-4">
        <Card className="shadow border-0 bg-gradient-to-r from-pink-500 to-orange-400">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <View>
                <Text className="block text-white text-opacity-80 text-sm">当前关系阶段</Text>
                <Text className="block text-white text-2xl font-bold">相互了解中 💕</Text>
              </View>
              <View className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <TrendingUp size={24} color="#fff" />
              </View>
            </View>
            <Progress value={progressPercentage} className="h-2 bg-white bg-opacity-30" />
            <Text className="block text-white text-opacity-80 text-sm mt-2">
              已完成 {completedMilestones}/{totalMilestones} 个里程碑
            </Text>
          </CardContent>
        </Card>
      </View>

      {/* 里程碑时间线 */}
      <View className="p-4">
        <View className="flex items-center justify-between mb-3">
          <Text className="block text-lg font-semibold text-gray-800">里程碑</Text>
          <Button size="sm" variant="ghost" className="text-pink-500">
            <Plus size={16} color="#FF6B9D" />
            <Text>添加</Text>
          </Button>
        </View>

        <Card className="shadow border-0">
          <CardContent className="p-4">
            {milestones.map((milestone, index) => (
              <View 
                key={milestone.id}
                className={`flex items-start gap-3 ${
                  index < milestones.length - 1 ? 'pb-4 border-b mb-4' : ''
                }`}
              >
                <View className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  milestone.completed ? 'bg-pink-500' : 'bg-gray-200'
                }`}
                >
                  <Text className="block text-lg">{milestone.icon}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex items-center gap-2 mb-1">
                    <Text className={`block font-semibold ${
                      milestone.completed ? 'text-gray-800' : 'text-gray-400'
                    }`}
                    >
                      {milestone.title}
                    </Text>
                    {milestone.completed && (
                      <Badge className="bg-pink-50 text-pink-500 text-xs">已达成</Badge>
                    )}
                  </View>
                  {milestone.date && (
                    <View className="flex items-center gap-1">
                      <Calendar size={12} color="#9CA3AF" />
                      <Text className="block text-sm text-gray-500">{milestone.date}</Text>
                    </View>
                  )}
                </View>
                {milestone.completed ? (
                  <Heart size={20} color="#FF6B9D" />
                ) : (
                  <View className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
              </View>
            ))}
          </CardContent>
        </Card>
      </View>

      {/* 美好时刻照片墙 */}
      <View className="p-4">
        <View className="flex items-center justify-between mb-3">
          <Text className="block text-lg font-semibold text-gray-800">美好时刻</Text>
          <Button size="sm" variant="ghost" className="text-pink-500">
            <Camera size={16} color="#FF6B9D" />
            <Text>上传</Text>
          </Button>
        </View>

        <View className="grid grid-cols-3 gap-2">
          {moments.map((moment) => (
            <View key={moment.id} className="relative aspect-square rounded-xl overflow-hidden">
              <Image
                src={moment.image}
                mode="aspectFill"
                className="w-full h-full"
              />
              <View className="absolute bottom-0 left-0 right-0 bg-green-500 bg-opacity-50 p-2">
                <Text className="block text-white text-xs truncate">{moment.desc}</Text>
              </View>
            </View>
          ))}
          {/* 添加更多 */}
          <View className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
            <View className="text-center">
              <Plus size={24} color="#9CA3AF" />
              <Text className="block text-xs text-gray-400 mt-1">添加</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 统计数据 */}
      <View className="p-4">
        <Text className="block text-lg font-semibold text-gray-800 mb-3">恋爱统计</Text>
        <View className="grid grid-cols-2 gap-3">
          <Card className="shadow border-0">
            <CardContent className="p-4 text-center">
              <Text className="block text-3xl font-bold text-pink-500 mb-1">15</Text>
              <Text className="block text-sm text-gray-500">相识天数</Text>
            </CardContent>
          </Card>
          <Card className="shadow border-0">
            <CardContent className="p-4 text-center">
              <Text className="block text-3xl font-bold text-orange-500 mb-1">3</Text>
              <Text className="block text-sm text-gray-500">约会次数</Text>
            </CardContent>
          </Card>
          <Card className="shadow border-0">
            <CardContent className="p-4 text-center">
              <Text className="block text-3xl font-bold text-blue-500 mb-1">5</Text>
              <Text className="block text-sm text-gray-500">完成任务</Text>
            </CardContent>
          </Card>
          <Card className="shadow border-0">
            <CardContent className="p-4 text-center">
              <Text className="block text-3xl font-bold text-green-500 mb-1">85%</Text>
              <Text className="block text-sm text-gray-500">默契度</Text>
            </CardContent>
          </Card>
        </View>
      </View>
    </View>
  )
}

export default ProgressPage
