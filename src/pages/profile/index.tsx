import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Settings, 
  Bell,
  Shield,
  MessageCircleQuestionMark,
  ChevronRight,
  Heart,
  LogOut
} from 'lucide-react-taro'

// 菜单项
const menuItems = [
  { icon: Bell, title: '通知设置', desc: '管理消息提醒' },
  { icon: Shield, title: '隐私设置', desc: '保护你的隐私' },
  { icon: MessageCircleQuestionMark, title: '帮助与反馈', desc: '遇到问题？' },
  { icon: Settings, title: '通用设置', desc: '语言、主题等' },
]

const ProfilePage: FC = () => {
  useLoad(() => {
    console.log('Profile page loaded.')
  })

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 用户信息卡片 */}
      <View className="p-4">
        <Card className="shadow-sm border-0 bg-gradient-to-r from-pink-500 to-orange-400">
          <CardContent className="p-6">
            <View className="flex items-center gap-4">
              <View className="w-16 h-16 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
                <User size={32} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="block text-white text-xl font-semibold mb-1">小明</Text>
                <Text className="block text-white text-opacity-80 text-sm">已配对：小红</Text>
              </View>
              <ChevronRight size={20} color="#fff" />
            </View>

            {/* 配对信息 */}
            <View className="mt-4 bg-white bg-opacity-20 rounded-xl p-3">
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-2">
                  <Heart size={16} color="#fff" />
                  <Text className="block text-white text-sm">配对时间</Text>
                </View>
                <Text className="block text-white text-sm">2024年1月1日</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 数据统计 */}
      <View className="p-4">
        <View className="grid grid-cols-3 gap-3">
          <Card className="shadow-sm border-0">
            <CardContent className="p-3 text-center">
              <Text className="block text-2xl font-bold text-pink-500">5</Text>
              <Text className="block text-xs text-gray-500">完成任务</Text>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0">
            <CardContent className="p-3 text-center">
              <Text className="block text-2xl font-bold text-orange-500">3</Text>
              <Text className="block text-xs text-gray-500">记录瞬间</Text>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0">
            <CardContent className="p-3 text-center">
              <Text className="block text-2xl font-bold text-blue-500">85%</Text>
              <Text className="block text-xs text-gray-500">默契度</Text>
            </CardContent>
          </Card>
        </View>
      </View>

      {/* 功能菜单 */}
      <View className="p-4">
        <Card className="shadow-sm border-0">
          <CardContent className="p-0">
            {menuItems.map((item, index) => (
              <View key={index}>
                <View className="flex items-center gap-3 p-4">
                  <View className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                    <item.icon size={20} color="#FF6B9D" />
                  </View>
                  <View className="flex-1">
                    <Text className="block font-medium text-gray-800">{item.title}</Text>
                    <Text className="block text-sm text-gray-500">{item.desc}</Text>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </View>
                {index < menuItems.length - 1 && (
                  <View className="ml-16">
                    <Separator />
                  </View>
                )}
              </View>
            ))}
          </CardContent>
        </Card>
      </View>

      {/* 退出登录 */}
      <View className="p-4">
        <Button 
          variant="outline" 
          className="w-full text-gray-500"
        >
          <LogOut size={16} color="#9CA3AF" />
          <Text className="ml-2">退出登录</Text>
        </Button>
      </View>

      {/* 版本信息 */}
      <View className="p-4 text-center">
        <Text className="block text-xs text-gray-400">心动约会 v1.0.0</Text>
      </View>
    </View>
  )
}

export default ProfilePage
