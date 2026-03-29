import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, useRouter, navigateTo, navigateBack } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Heart,
  Plus,
  Sparkles,
  Loader,
  Pencil,
  Trash2
} from 'lucide-react-taro'

interface DateRecord {
  id: number
  matchId: number
  date: string
  location: string
  activity: string
  duration: string
  mood: 'excellent' | 'good' | 'normal' | 'not_good'
  highlights: string[]
  notes: string
  keyInfoExtracted: Array<{
    type: string
    label: string
    value: string
    confidence: number
  }>
  nextSuggestions: string[]
}

interface DateStats {
  totalDates: number
  excellentDates: number
  goodDates: number
  totalHours: number
  lastDate: {
    date: string
    activity: string
    mood: string
  } | null
}

const moodConfig = {
  excellent: { label: '非常愉快', color: 'bg-pink-500', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
  good: { label: '比较愉快', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-600' },
  normal: { label: '一般', color: 'bg-gray-400', bgColor: 'bg-gray-50', textColor: 'text-gray-600' },
  not_good: { label: '不太愉快', color: 'bg-red-400', bgColor: 'bg-red-50', textColor: 'text-red-600' },
}

const DatesPage: FC = () => {
  const router = useRouter()
  const matchId = router.params.matchId
  const [records, setRecords] = useState<DateRecord[]>([])
  const [stats, setStats] = useState<DateStats | null>(null)
  const [loading, setLoading] = useState(false)

  useLoad(() => {
    console.log('Dates page loaded. matchId:', matchId)
  })

  useDidShow(() => {
    fetchRecords()
    fetchStats()
  })

  const fetchRecords = async () => {
    if (!matchId) return
    
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/date-record/list?matchId=${matchId}`
      })
      console.log('Records response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setRecords(res.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch records:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!matchId) return
    
    try {
      const res = await Network.request({
        url: `/api/date-record/stats?matchId=${matchId}`
      })
      console.log('Stats response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setStats(res.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const goBack = () => {
    navigateBack()
  }

  const goToCreate = () => {
    navigateTo({ url: `/pages/date-edit/index?matchId=${matchId}` })
  }

  const goToEdit = (recordId: number) => {
    navigateTo({ url: `/pages/date-edit/index?matchId=${matchId}&id=${recordId}` })
  }

  const deleteRecord = async (recordId: number) => {
    try {
      const res = await Network.request({
        url: `/api/date-record/delete/${recordId}`,
        method: 'POST'
      })
      console.log('Delete response:', res.data)
      if (res.data?.code === 200) {
        fetchRecords()
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to delete record:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      {/* 头部 */}
      <View className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 rounded-b-3xl">
        <View className="flex items-center justify-between mb-4">
          <View onClick={goBack}>
            <ArrowLeft size={24} color="#fff" />
          </View>
          <Text className="block text-white text-lg font-semibold">约会记录</Text>
          <View onClick={goToCreate}>
            <Plus size={24} color="#fff" />
          </View>
        </View>

        {/* 统计卡片 */}
        {stats && (
          <View className="bg-white bg-opacity-20 rounded-2xl p-4">
            <View className="grid grid-cols-3 gap-4 text-center">
              <View>
                <Text className="block text-white text-2xl font-bold">{stats.totalDates}</Text>
                <Text className="block text-white text-opacity-80 text-xs">约会次数</Text>
              </View>
              <View>
                <Text className="block text-white text-2xl font-bold">{stats.totalHours}</Text>
                <Text className="block text-white text-opacity-80 text-xs">相处时长(h)</Text>
              </View>
              <View>
                <Text className="block text-white text-2xl font-bold">{stats.excellentDates}</Text>
                <Text className="block text-white text-opacity-80 text-xs">愉快约会</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 记录列表 */}
      <View className="p-4">
        {loading ? (
          <View className="text-center py-8">
            <Loader size={32} color="#6366F1" className="animate-spin" />
            <Text className="block text-gray-400 mt-2">加载中...</Text>
          </View>
        ) : records.length === 0 ? (
          <Card className="shadow-sm border-0">
            <CardContent className="p-8 text-center">
              <View className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
                <Heart size={32} color="#EC4899" />
              </View>
              <Text className="block text-gray-800 font-semibold mb-2">还没有约会记录</Text>
              <Text className="block text-sm text-gray-400 mb-4">
                记录每一次约会，AI会自动提取关键信息
              </Text>
              <Button className="bg-pink-500" onClick={goToCreate}>
                <Plus size={16} color="#fff" />
                <Text className="ml-1 text-white">添加约会记录</Text>
              </Button>
            </CardContent>
          </Card>
        ) : (
          records.map((record) => {
            const moodInfo = moodConfig[record.mood]
            return (
              <Card key={record.id} className="mb-4 shadow-sm border-0">
                <CardContent className="p-4">
                  {/* 头部信息 */}
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex items-center gap-2 mb-1">
                        <Calendar size={14} color="#6366F1" />
                        <Text className="block text-sm text-gray-500">{formatDate(record.date)}</Text>
                        <Badge className={moodInfo.bgColor + ' ' + moodInfo.textColor}>
                          {moodInfo.label}
                        </Badge>
                      </View>
                      <Text className="block text-lg font-semibold text-gray-800 mb-1">
                        {record.activity}
                      </Text>
                      <View className="flex items-center gap-3 text-sm text-gray-500">
                        <View className="flex items-center gap-1">
                          <MapPin size={12} color="#9CA3AF" />
                          <Text>{record.location}</Text>
                        </View>
                        <View className="flex items-center gap-1">
                          <Clock size={12} color="#9CA3AF" />
                          <Text>{record.duration}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 精彩瞬间 */}
                  {record.highlights && record.highlights.length > 0 && (
                    <View className="flex flex-wrap gap-2 mb-3">
                      {record.highlights.map((highlight, i) => (
                        <Badge key={i} variant="outline" className="text-pink-500 border-pink-200">
                          ✨ {highlight}
                        </Badge>
                      ))}
                    </View>
                  )}

                  {/* 笔记摘要 */}
                  {record.notes && (
                    <View className="bg-gray-50 rounded-lg p-3 mb-3">
                      <Text className="block text-sm text-gray-600 line-clamp-2">
                        {record.notes}
                      </Text>
                    </View>
                  )}

                  {/* AI提取的关键信息 */}
                  {record.keyInfoExtracted && record.keyInfoExtracted.length > 0 && (
                    <View className="bg-amber-50 rounded-lg p-3 mb-3">
                      <View className="flex items-center gap-1 mb-2">
                        <Sparkles size={14} color="#F59E0B" />
                        <Text className="block text-xs text-amber-600 font-medium">AI提取的关键信息</Text>
                      </View>
                      <View className="space-y-1">
                        {record.keyInfoExtracted.map((info, i) => (
                          <View key={i} className="flex items-start gap-2">
                            <Text className="block text-xs text-amber-700">{info.label}:</Text>
                            <Text className="block text-xs text-amber-600 flex-1">{info.value}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* 操作按钮 */}
                  <View className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => goToEdit(record.id)}
                    >
                      <Pencil size={14} color="#6366F1" />
                      <Text className="ml-1 text-indigo-600">编辑</Text>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRecord(record.id)}
                    >
                      <Trash2 size={14} color="#EF4444" />
                      <Text className="ml-1 text-red-500">删除</Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            )
          })
        )}
      </View>

      {/* 底部添加按钮 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <Button className="w-full bg-pink-500" onClick={goToCreate}>
          <Plus size={16} color="#fff" />
          <Text className="ml-1 text-white">记录新约会</Text>
        </Button>
      </View>
    </View>
  )
}

export default DatesPage
