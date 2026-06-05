// 使用原生 Button 和 Input 是因为微信小程序的头像昵称填写能力需要:
// - Button open-type="chooseAvatar"
// - Input type="nickname"
/* eslint-disable no-restricted-syntax */
import { View, Text, Button, Input, Image } from '@tarojs/components'
/* eslint-enable no-restricted-syntax */
import Taro, { useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  ChevronRight,
  Heart,
  Users,
  FileText,
  Target,
  Trophy,
  Sparkles,
} from 'lucide-react-taro'

interface UserProfile {
  avatarUrl: string
  nickname: string
}

interface MatchItem {
  id: number
  name: string
  impression?: number
  progressScore?: number
}

interface AchievementItem {
  icon: typeof Target
  title: string
  bgColor: string
  iconColor: string
  unlockedIconColor: string
  unlocked: boolean
}

// 成就定义：unlockCondition 在运行时根据 stats 判断
const achievementDefinitions = [
  {
    icon: Target,
    title: '破冰达人',
    bgColor: 'bg-amber-100',
    unlockedIconColor: '#F0C75E',
    lockedIconColor: '#D1D5DB',
    check: (s: { matches: number; interactions: number; avgProgress: number }) => s.matches >= 1,
  },
  {
    icon: Heart,
    title: '心动记录',
    bgColor: 'bg-pink-100',
    unlockedIconColor: '#EC4899',
    lockedIconColor: '#D1D5DB',
    check: (s: { matches: number; interactions: number; avgProgress: number }) => s.interactions >= 1,
  },
  {
    icon: Trophy,
    title: '默契大师',
    bgColor: 'bg-green-100',
    unlockedIconColor: '#4ECB71',
    lockedIconColor: '#D1D5DB',
    check: (s: { matches: number; interactions: number; avgProgress: number }) => s.avgProgress >= 50,
  },
  {
    icon: Sparkles,
    title: '关系专家',
    bgColor: 'bg-violet-100',
    unlockedIconColor: '#A78BFA',
    lockedIconColor: '#D1D5DB',
    check: (s: { matches: number; interactions: number; avgProgress: number }) => s.avgProgress >= 80,
  },
]

const ProfilePage: FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    avatarUrl: '',
    nickname: ''
  })
  const [stats, setStats] = useState({
    matches: 0,
    interactions: 0,
    avgProgress: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState(false)
  const [achievements, setAchievements] = useState<AchievementItem[]>([])

  // 是否为小程序环境（微信 + 抖音）
  const currentEnv = Taro.getEnv()
  const isMiniApp = currentEnv === Taro.ENV_TYPE.WEAPP || currentEnv === Taro.ENV_TYPE.TT

  useDidShow(() => {
    console.log('Profile page shown.')
    loadProfile()
    loadStats()
  })

  // 加载用户信息（优先后端，回退本地缓存）
  const loadProfile = async () => {
    try {
      // 先用本地缓存快速渲染
      const saved = Taro.getStorageSync('user_profile')
      if (saved) {
        setProfile(saved)
      }
      // 再从后端获取最新昵称
      const res = await Network.request({ url: '/api/user-profile' })
      console.log('Load profile response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const serverProfile = res.data.data
        if (serverProfile.nickname) {
          const newProfile = { ...saved, nickname: serverProfile.nickname }
          setProfile(newProfile)
          Taro.setStorageSync('user_profile', newProfile)
        }
      }
    } catch (error) {
      console.error('Load profile error:', error)
    }
  }

  // 加载统计数据
  const loadStats = async () => {
    setStatsLoading(true)
    setStatsError(false)
    try {
      const res = await Network.request({ url: '/api/match/list' })
      console.log('Load stats response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const matchData = res.data.data
        // 后端返回 { list, total } 结构
        const matchList: MatchItem[] = matchData.list || matchData || []

        // 计算平均推进值
        const totalProgress = matchList.reduce(
          (sum, m) => sum + (m.progressScore || 0), 0
        )
        const avgProgress = matchList.length > 0
          ? Math.round(totalProgress / matchList.length)
          : 0

        // 计算互动总数（用 impression 近似，后续可接入 interaction 接口）
        const totalInteractions = matchList.reduce(
          (sum, m) => sum + (m.impression || 0), 0
        )

        const newStats = {
          matches: matchList.length,
          interactions: totalInteractions,
          avgProgress
        }
        setStats(newStats)

        // 基于统计数据计算成就
        updateAchievements(newStats)
      }
    } catch (error) {
      console.error('Load stats error:', error)
      setStatsError(true)
    } finally {
      setStatsLoading(false)
    }
  }

  // 根据统计数据动态计算成就解锁状态
  const updateAchievements = (currentStats: { matches: number; interactions: number; avgProgress: number }) => {
    const items: AchievementItem[] = achievementDefinitions.map(def => ({
      icon: def.icon,
      title: def.title,
      bgColor: def.check(currentStats) ? def.bgColor : 'bg-gray-100',
      iconColor: def.check(currentStats) ? def.unlockedIconColor : def.lockedIconColor,
      unlockedIconColor: def.unlockedIconColor,
      unlocked: def.check(currentStats),
    }))
    setAchievements(items)
  }

  // 同步用户资料到后端
  const syncProfileToServer = async (data: Partial<UserProfile>) => {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.nickname !== undefined) updateData.nickname = data.nickname
      await Network.request({
        url: '/api/user-profile',
        method: 'POST',
        data: updateData
      })
      console.log('Profile synced to server:', updateData)
    } catch (error) {
      console.error('Sync profile error:', error)
    }
  }

  // 选择头像（小程序）
  const handleChooseAvatar = (e: { detail: { avatarUrl: string } }) => {
    const { avatarUrl } = e.detail
    const newProfile = { ...profile, avatarUrl }
    setProfile(newProfile)
    Taro.setStorageSync('user_profile', newProfile)
    Taro.showToast({ title: '头像已更新', icon: 'success' })
  }

  // H5 端选择头像
  const handleH5ChooseAvatar = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const avatarUrl = res.tempFilePaths[0]
        const newProfile = { ...profile, avatarUrl }
        setProfile(newProfile)
        Taro.setStorageSync('user_profile', newProfile)
        Taro.showToast({ title: '头像已更新', icon: 'success' })
      }
    })
  }

  // 输入昵称（仅更新状态，不频繁写 Storage）
  const handleInputNickname = (e: { detail: { value: string } }) => {
    const nickname = e.detail.value
    setProfile(prev => ({ ...prev, nickname }))
  }

  // 失焦时保存昵称（本地 + 后端）
  const handleSaveNickname = () => {
    Taro.setStorageSync('user_profile', profile)
    syncProfileToServer({ nickname: profile.nickname })
    Taro.showToast({ title: '昵称已保存', icon: 'success' })
  }

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 用户信息卡片 */}
      <View className="p-4">
        <Card className="shadow-soft border-0 bg-green-500">
          <CardContent className="p-6">
            <View className="flex items-center gap-4">
              {/* 头像选择 */}
              {isMiniApp ? (
                // 小程序使用原生 Button 的 open-type="chooseAvatar"
                <Button
                  openType="chooseAvatar"
                  onChooseAvatar={handleChooseAvatar}
                  // eslint-disable-next-line no-restricted-syntax
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
                    <View className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
                      <User size={32} color="#fff" />
                    </View>
                  )}
                </Button>
              ) : (
                // H5 端降级为 chooseImage
                <View
                  className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: profile.avatarUrl ? 'transparent' : '#2E9E5A' }}
                  onClick={handleH5ChooseAvatar}
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
                  {/* 小程序使用原生 Input 的 type="nickname" */}
                  <Input
                    type={isMiniApp ? 'nickname' : 'text'}
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
        {statsLoading ? (
          <View className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="shadow-soft border-0">
                <CardContent className="p-3 text-center">
                  <Skeleton className="h-7 w-10 mx-auto mb-2" />
                  <Skeleton className="h-4 w-12 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </View>
        ) : statsError ? (
          <Card className="shadow-soft border-0">
            <CardContent className="p-4 text-center">
              <Text className="block text-sm text-gray-500 mb-2">统计数据加载失败</Text>
              <Text
                className="block text-sm text-green-500"
                onClick={loadStats}
              >
                点击重试
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View className="grid grid-cols-3 gap-4">
            <Card className="shadow-soft border-0">
              <CardContent className="p-3 text-center">
                <View className="flex items-center justify-center gap-1">
                  <Users size={16} color="#111827" />
                  <Text className="block text-2xl font-bold text-gray-900">{stats.matches}</Text>
                </View>
                <Text className="block text-xs text-gray-500">接触对象</Text>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-0">
              <CardContent className="p-3 text-center">
                <View className="flex items-center justify-center gap-1">
                  <Heart size={16} color="#EC4899" />
                  <Text className="block text-2xl font-bold text-pink-500">{stats.interactions}</Text>
                </View>
                <Text className="block text-xs text-gray-500">完成互动</Text>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-0">
              <CardContent className="p-3 text-center">
                <Text className="block text-2xl font-bold text-green-500">{stats.avgProgress}%</Text>
                <Text className="block text-xs text-gray-500">平均推进值</Text>
              </CardContent>
            </Card>
          </View>
        )}
      </View>

      {/* 成就 */}
      <View className="p-4">
        <Card className="shadow-soft border-0">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-4">
              <Text className="block font-semibold text-gray-800">我的成就</Text>
              <Text className="block text-xs text-gray-400">
                {achievements.filter(a => a.unlocked).length}/{achievements.length} 已解锁
              </Text>
            </View>
            <View className="flex gap-4">
              {achievements.map((item) => (
                <View className="text-center" key={item.title}>
                  <View className={`w-12 h-12 rounded-full ${item.bgColor} flex items-center justify-center mb-1`}>
                    <item.icon
                      size={24}
                      color={item.iconColor}
                    />
                  </View>
                  <Text className={`block text-xs ${item.unlocked ? 'text-gray-500' : 'text-gray-400'}`}>
                    {item.title}
                  </Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 我的档案入口 */}
      <View className="p-4">
        <Card className="shadow-soft border-0">
          <CardContent className="p-4">
            <View
              className="flex items-center gap-4"
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

      {/* 版本信息 */}
      <View className="p-4 text-center">
        <Text className="block text-xs text-gray-400">知拌 v1.0.0</Text>
      </View>
    </View>
  )
}

export default ProfilePage
