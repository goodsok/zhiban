import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow, useRouter, navigateTo, navigateBack } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import CustomHeader from '@/components/custom-header'
import { 
  Plus, 
  Calendar,
  MapPin,
  Clock,
  Loader,
  Sparkles,
  ChevronRight
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
  }>
}

interface DateStats {
  totalDates: number
  totalHours: number
}

const moodLabels = {
  excellent: '很好',
  good: '不错',
  normal: '一般',
  not_good: '不太好',
}

const DatesPage: FC = () => {
  const router = useRouter()
  const matchId = router.params.matchId
  const [records, setRecords] = useState<DateRecord[]>([])
  const [stats, setStats] = useState<DateStats>({ totalDates: 0, totalHours: 0 })
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
      if (res.data?.code === 200 && res.data?.data) {
        setStats(res.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const goBack = () => navigateBack()
  const goToCreate = () => navigateTo({ url: `/pages/date-edit/index?matchId=${matchId}` })
  const goToEdit = (recordId: number) => {
    navigateTo({ url: `/pages/date-edit/index?matchId=${matchId}&id=${recordId}` })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <View className="min-h-screen pb-28" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部 */}
      <CustomHeader 
        title="约会记录" 
        onBack={goBack}
      />

      {/* 统计 */}
      <View className="px-4 py-4">
        <View className="flex gap-4">
          <View className="flex-1 bg-white rounded-2xl shadow-soft p-4 text-center">
            <Text className="block text-2xl font-bold text-gray-900">{stats.totalDates}</Text>
            <Text className="block text-xs text-gray-400 mt-1">约会次数</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl shadow-soft p-4 text-center">
            <Text className="block text-2xl font-bold text-gray-900">{stats.totalHours}</Text>
            <Text className="block text-xs text-gray-400 mt-1">相处时长(h)</Text>
          </View>
        </View>
      </View>

      {/* 记录列表 */}
      <View className="px-4">
        {loading ? (
          <View className="text-center py-12">
            <Loader size={24} color="#6B7280" className="animate-spin" />
          </View>
        ) : records.length === 0 ? (
          <View className="text-center py-12">
            <Text className="block text-gray-400 mb-4">还没有约会记录</Text>
            <Button className="bg-green-500" onClick={goToCreate}>
              <Plus size={16} color="#fff" />
              <Text className="ml-1 text-white">记录第一次约会</Text>
            </Button>
          </View>
        ) : (
          records.map((record) => (
            <View
              key={record.id}
              className="bg-white rounded-2xl shadow-soft p-4 mb-4"
              onClick={() => goToEdit(record.id)}
            >
              <View className="flex items-start justify-between mb-2">
                <View className="flex-1">
                  <Text className="block text-base font-semibold text-gray-900 mb-1">
                    {record.activity}
                  </Text>
                  <View className="flex items-center gap-3 text-xs text-gray-400">
                    <View className="flex items-center gap-1">
                      <Calendar size={12} color="#9CA3AF" />
                      <Text>{formatDate(record.date)}</Text>
                    </View>
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
                <Badge className="bg-gray-100 text-gray-600">{moodLabels[record.mood]}</Badge>
              </View>

              {/* 精彩瞬间 */}
              {record.highlights?.length > 0 && (
                <View className="flex flex-wrap gap-1 mb-2">
                  {record.highlights.map((h, i) => (
                    <Badge key={i} className="bg-gray-50 text-gray-500 text-xs">{h}</Badge>
                  ))}
                </View>
              )}

              {/* AI提取信息 */}
              {record.keyInfoExtracted?.length > 0 && (
                <View className="mt-2 pt-2 border-t">
                  <View className="flex items-center gap-1 mb-1">
                    <Sparkles size={12} color="#4ECB71" />
                    <Text className="block text-xs text-gray-400">提取的关键信息</Text>
                  </View>
                  {record.keyInfoExtracted.map((info, i) => (
                    <View key={i} className="flex items-center gap-3">
                      <Text className="block text-xs text-gray-500">{info.label}:</Text>
                      <Text className="block text-xs text-gray-600">{info.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View className="flex justify-end mt-2">
                <ChevronRight size={16} color="#D1D5DB" />
              </View>
            </View>
          ))
        )}
      </View>

      {/* 底部 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <Button className="w-full bg-green-500" onClick={goToCreate}>
          <Plus size={16} color="#fff" />
          <Text className="ml-1 text-white">记录新约会</Text>
        </Button>
      </View>
    </View>
  )
}

export default DatesPage
