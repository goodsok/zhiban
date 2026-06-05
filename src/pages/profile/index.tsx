/* eslint-disable no-restricted-syntax */
// 使用原生 Button 和 Input 是因为微信小程序的头像昵称填写能力需要:
// - Button open-type="chooseAvatar"
// - Input type="nickname"
import { View, Text, Button, Input, Image } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Settings, 
  Bell,
  Shield,
  MessageCircleQuestionMark,
  ChevronRight,
  Heart,
  Users,
  FileText
} from 'lucide-react-taro'

interface UserProfile {
  avatarUrl: string
  nickname: string
}

const menuItems = [
  { icon: Bell, title: '通知设置', desc: '管理消息提醒' },
  { icon: Shield, title: '隐私设置', desc: '保护你的隐私' },
  { icon: MessageCircleQuestionMark, title: '帮助与反馈', desc: '遇到问题？' },
  { icon: Settings, title: '通用设置', desc: '语言、主题等' },
]

const ProfilePage: FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    avatarUrl: '',
    nickname: ''
  })
  const [stats, setStats] = useState({
    matches: 0,
    interactions: 0,
    compatibility: 0
  })

  useLoad(() => {
    console.log('Profile page loaded.')
    loadProfile()
    loadStats()
  })

  // 加载用户信息
  const loadProfile = () => {
    const saved = Taro.getStorageSync('user_profile')
    if (saved) {
      setProfile(saved)
    }
  }

  // 加载统计数据
  const loadStats = async () => {
    try {
      const res = await Network.request({ url: '/api/match/list' })
      if (res.data?.code === 200 && res.data?.data) {
        const matches = res.data.data
        setStats({
          matches: matches.length,
          interactions: matches.reduce((sum: number, m: { impression: number }) => sum + (m.impression || 0), 0),
          compatibility: matches.length > 0 ? 85 : 0
        })
      }
    } catch (error) {
      console.error('Load stats error:', error)
    }
  }

  // 选择头像
  const handleChooseAvatar = (e: any) => {
    const { avatarUrl } = e.detail
    const newProfile = { ...profile, avatarUrl }
    setProfile(newProfile)
    Taro.setStorageSync('user_profile', newProfile)
    Taro.showToast({ title: '头像已更新', icon: 'success' })
  }

  // 输入昵称
  const handleInputNickname = (e: any) => {
    const nickname = e.detail.value
    const newProfile = { ...profile, nickname }
    setProfile(newProfile)
    Taro.setStorageSync('user_profile', newProfile)
  }

  // 保存昵称
  const handleSaveNickname = () => {
    Taro.setStorageSync('user_profile', profile)
    Taro.showToast({ title: '昵称已保存', icon: 'success' })
  }

  // 是否为小程序环境
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 用户信息卡片 */}
      <View className="p-4">
        <Card className="shadow border-0 bg-green-600">
          <CardContent className="p-6">
            <View className="flex items-center gap-4">
              {/* 头像选择 */}
              {isWeapp ? (
                // 微信小程序使用原生 Button 的 open-type="chooseAvatar"
                <Button 
                  openType="chooseAvatar" 
                  onChooseAvatar={handleChooseAvatar}
                  className="w-16 h-16 rounded-full bg-transparent border-0 p-0"
                  style={{ padding: 0, background: 'transparent' }}
                >
                  {profile.avatarUrl ? (
                    <Image 
                      src={profile.avatarUrl} 
                      className="w-16 h-16 rounded-full"
                      mode="aspectFill"
                    />
                  ) : (
                    <View className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center">
                      <User size={32} color="#fff" />
                    </View>
                  )}
                </Button>
              ) : (
                <View 
                  className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden"
                  onClick={() => {
                    Taro.showToast({ title: '请在小程序中设置头像', icon: 'none' })
                  }}
                >
                  {profile.avatarUrl ? (
                    <Image 
                      src={profile.avatarUrl} 
                      className="w-16 h-16 rounded-full"
                      mode="aspectFill"
                    />
                  ) : (
                    <User size={32} color="#fff" />
                  )}
                </View>
              )}
              
              {/* 昵称输入 */}
              <View className="flex-1">
                <View className="bg-transparent rounded-lg">
                  {/* 微信小程序使用原生 Input 的 type="nickname" */}
                  <Input
                    type={isWeapp ? 'nickname' : 'text'}
                    className="w-full bg-transparent"
                    placeholder="点击设置昵称"
                    placeholderClass="text-white text-opacity-60"
                    value={profile.nickname}
                    onInput={handleInputNickname}
                    onBlur={handleSaveNickname}
                    style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}
                  />
                </View>
                <Text className="block text-white text-opacity-80 text-sm">让每一次心动都有结果</Text>
              </View>
              <ChevronRight size={20} color="#fff" />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 提示 */}
      {!profile.nickname && (
        <View className="px-4 -mt-2">
          <Text className="block text-xs text-gray-400 text-center">
            点击头像和昵称可设置你的个人信息
          </Text>
        </View>
      )}

      {/* 数据统计 */}
      <View className="p-4 mt-2">
        <View className="grid grid-cols-3 gap-3">
          <Card className="shadow border-0">
            <CardContent className="p-3 text-center">
              <View className="flex items-center justify-center gap-1">
                <Users size={16} color="#111827" />
                <Text className="block text-2xl font-bold text-gray-900">{stats.matches}</Text>
              </View>
              <Text className="block text-xs text-gray-500">接触对象</Text>
            </CardContent>
          </Card>
          <Card className="shadow border-0">
            <CardContent className="p-3 text-center">
              <View className="flex items-center justify-center gap-1">
                <Heart size={16} color="#EC4899" />
                <Text className="block text-2xl font-bold text-pink-500">{stats.interactions}</Text>
              </View>
              <Text className="block text-xs text-gray-500">完成互动</Text>
            </CardContent>
          </Card>
          <Card className="shadow border-0">
            <CardContent className="p-3 text-center">
              <Text className="block text-2xl font-bold text-green-500">{stats.compatibility}%</Text>
              <Text className="block text-xs text-gray-500">平均契合度</Text>
            </CardContent>
          </Card>
        </View>
      </View>

      {/* 成就 */}
      <View className="p-4">
        <Card className="shadow border-0">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <Text className="block font-semibold text-gray-800">我的成就</Text>
              <Text className="block text-sm text-gray-500">查看全部</Text>
            </View>
            <View className="flex gap-4">
              <View className="text-center">
                <View className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-1">
                  <Text className="block text-2xl">🎯</Text>
                </View>
                <Text className="block text-xs text-gray-500">破冰达人</Text>
              </View>
              <View className="text-center">
                <View className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mb-1">
                  <Text className="block text-2xl">💕</Text>
                </View>
                <Text className="block text-xs text-gray-500">心动记录</Text>
              </View>
              <View className="text-center">
                <View className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                  <Text className="block text-2xl">🏆</Text>
                </View>
                <Text className="block text-xs text-gray-500">默契大师</Text>
              </View>
              <View className="text-center">
                <View className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                  <Text className="block text-2xl text-gray-400">🔒</Text>
                </View>
                <Text className="block text-xs text-gray-400">待解锁</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 我的档案入口 */}
      <View className="p-4">
        <Card className="shadow border-0">
          <CardContent className="p-4">
            <View 
              className="flex items-center gap-3"
              onClick={() => Taro.navigateTo({ url: '/pages/user-profile/index' })}
            >
              <View className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                <FileText size={24} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="block font-semibold text-gray-800">我的档案</Text>
                <Text className="block text-sm text-gray-500">完善个人画像，获得更精准的AI建议</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 功能菜单 */}
      <View className="p-4">
        <Card className="shadow border-0">
          <CardContent className="p-0">
            {menuItems.map((item, index) => (
              <View key={index}>
                <View className="flex items-center gap-3 p-4">
                  <View className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <item.icon size={20} color="#374151" />
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

      {/* 版本信息 */}
      <View className="p-4 text-center">
        <Text className="block text-xs text-gray-400">心动助手 v1.0.0</Text>
      </View>
    </View>
  )
}

export default ProfilePage
