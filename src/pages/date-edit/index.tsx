import { View, Text } from '@tarojs/components'
import { useLoad, useRouter, navigateBack } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Heart,
  Sparkles,
  Loader,
  Check,
  X
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
}

const moodOptions = [
  { value: 'excellent', label: '非常愉快', icon: '😍', color: 'bg-pink-500' },
  { value: 'good', label: '比较愉快', icon: '😊', color: 'bg-green-500' },
  { value: 'normal', label: '一般', icon: '😐', color: 'bg-gray-400' },
  { value: 'not_good', label: '不太愉快', icon: '😕', color: 'bg-red-400' },
]

const DateEditPage: FC = () => {
  const router = useRouter()
  const matchId = router.params.matchId
  const recordId = router.params.id
  const isEdit = !!recordId

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // 表单数据
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [location, setLocation] = useState('')
  const [activity, setActivity] = useState('')
  const [duration, setDuration] = useState('')
  const [mood, setMood] = useState<'excellent' | 'good' | 'normal' | 'not_good'>('good')
  const [highlights, setHighlights] = useState<string[]>([])
  const [highlightInput, setHighlightInput] = useState('')
  const [notes, setNotes] = useState('')

  useLoad(() => {
    console.log('Date edit page loaded. matchId:', matchId, 'recordId:', recordId)
    if (isEdit) {
      fetchRecord()
    }
  })

  const fetchRecord = async () => {
    if (!recordId) return
    
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/date-record/${recordId}`
      })
      console.log('Record response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const record = res.data.data as DateRecord
        setDate(record.date)
        setLocation(record.location)
        setActivity(record.activity)
        setDuration(record.duration)
        setMood(record.mood)
        setHighlights(record.highlights || [])
        setNotes(record.notes || '')
      }
    } catch (error) {
      console.error('Failed to fetch record:', error)
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    navigateBack()
  }

  const addHighlight = () => {
    if (highlightInput.trim() && highlights.length < 5) {
      setHighlights([...highlights, highlightInput.trim()])
      setHighlightInput('')
    }
  }

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!matchId || !date || !location || !activity || !duration) {
      return
    }

    try {
      setSaving(true)
      
      const body = {
        matchId: Number(matchId),
        date,
        location,
        activity,
        duration,
        mood,
        highlights,
        notes,
      }

      const url = isEdit 
        ? `/api/date-record/update/${recordId}`
        : '/api/date-record/create'
      
      const res = await Network.request({
        url,
        method: 'POST',
        data: body
      })
      
      console.log('Save response:', res.data)
      if (res.data?.code === 200) {
        navigateBack()
      }
    } catch (error) {
      console.error('Failed to save record:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size={32} color="#6366F1" className="animate-spin" />
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      {/* 头部 */}
      <View className="bg-white p-4 border-b border-gray-100">
        <View className="flex items-center justify-between">
          <View onClick={goBack}>
            <ArrowLeft size={24} color="#374151" />
          </View>
          <Text className="block text-lg font-semibold text-gray-800">
            {isEdit ? '编辑约会记录' : '记录新约会'}
          </Text>
          <View className="w-6" />
        </View>
      </View>

      <View className="p-4">
        {/* 基本信息 */}
        <Card className="mb-4 shadow-sm border-0">
          <CardContent className="p-4">
            <Text className="block text-sm font-semibold text-gray-800 mb-4">基本信息</Text>
            
            {/* 日期 */}
            <View className="mb-4">
              <View className="flex items-center gap-2 mb-2">
                <Calendar size={16} color="#6366F1" />
                <Text className="block text-sm text-gray-600">约会日期</Text>
              </View>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="例如：2024-03-25"
                  value={date}
                  onInput={(e) => setDate(e.detail.value)}
                />
              </View>
            </View>

            {/* 地点 */}
            <View className="mb-4">
              <View className="flex items-center gap-2 mb-2">
                <MapPin size={16} color="#6366F1" />
                <Text className="block text-sm text-gray-600">约会地点</Text>
              </View>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="例如：星巴克（国贸店）"
                  value={location}
                  onInput={(e) => setLocation(e.detail.value)}
                />
              </View>
            </View>

            {/* 活动 */}
            <View className="mb-4">
              <View className="flex items-center gap-2 mb-2">
                <Heart size={16} color="#EC4899" />
                <Text className="block text-sm text-gray-600">约会活动</Text>
              </View>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="例如：喝咖啡聊天、看电影"
                  value={activity}
                  onInput={(e) => setActivity(e.detail.value)}
                />
              </View>
            </View>

            {/* 时长 */}
            <View className="mb-4">
              <View className="flex items-center gap-2 mb-2">
                <Clock size={16} color="#F59E0B" />
                <Text className="block text-sm text-gray-600">约会时长</Text>
              </View>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="例如：2小时"
                  value={duration}
                  onInput={(e) => setDuration(e.detail.value)}
                />
              </View>
            </View>

            {/* 感受 */}
            <View>
              <Text className="block text-sm text-gray-600 mb-2">约会感受</Text>
              <View className="flex gap-2 flex-wrap">
                {moodOptions.map((option) => (
                  <View
                    key={option.value}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                      mood === option.value ? option.color : 'bg-gray-100'
                    }`}
                    onClick={() => setMood(option.value as typeof mood)}
                  >
                    <Text className="block">{option.icon}</Text>
                    <Text className={`block text-sm ${mood === option.value ? 'text-white' : 'text-gray-600'}`}>
                      {option.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 精彩瞬间 */}
        <Card className="mb-4 shadow-sm border-0">
          <CardContent className="p-4">
            <Text className="block text-sm font-semibold text-gray-800 mb-2">精彩瞬间</Text>
            <Text className="block text-xs text-gray-400 mb-3">记录约会中的美好时刻（最多5个）</Text>
            
            {/* 已添加的标签 */}
            {highlights.length > 0 && (
              <View className="flex flex-wrap gap-2 mb-3">
                {highlights.map((h, i) => (
                  <Badge key={i} className="bg-pink-100 text-pink-600 pr-1">
                    <Text className="block">✨ {h}</Text>
                    <View 
                      className="ml-1 w-4 h-4 rounded-full bg-pink-200 flex items-center justify-center"
                      onClick={() => removeHighlight(i)}
                    >
                      <X size={10} color="#EC4899" />
                    </View>
                  </Badge>
                ))}
              </View>
            )}
            
            {/* 输入框 */}
            {highlights.length < 5 && (
              <View className="flex gap-2">
                <View className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="例如：牵手成功、看了日落"
                    value={highlightInput}
                    onInput={(e) => setHighlightInput(e.detail.value)}
                  />
                </View>
                <Button size="sm" variant="outline" onClick={addHighlight}>
                  <Check size={16} color="#6366F1" />
                </Button>
              </View>
            )}
          </CardContent>
        </Card>

        {/* 约会笔记 */}
        <Card className="mb-4 shadow-sm border-0">
          <CardContent className="p-4">
            <View className="flex items-center gap-2 mb-2">
              <Text className="block text-sm font-semibold text-gray-800">约会笔记</Text>
              <Badge className="bg-amber-100 text-amber-600 text-xs">
                <Sparkles size={10} color="#F59E0B" />
                <Text className="ml-1">AI提取</Text>
              </Badge>
            </View>
            <Text className="block text-xs text-gray-400 mb-3">
              详细记录约会内容，AI会自动提取关键信息更新到档案
            </Text>
            <View className="bg-gray-50 rounded-2xl p-4">
              <Textarea
                style={{ width: '100%', minHeight: '120px', backgroundColor: 'transparent' }}
                placeholder="记录约会中聊了什么、发生了什么有趣的事、对方的反应如何..."
                value={notes}
                onInput={(e) => setNotes(e.detail.value)}
                maxlength={1000}
              />
            </View>
            <Text className="block text-xs text-gray-400 text-right mt-2">
              {notes.length}/1000
            </Text>
          </CardContent>
        </Card>

        {/* AI提示 */}
        <Card className="mb-4 shadow-sm border-0 bg-indigo-50">
          <CardContent className="p-4">
            <View className="flex items-start gap-3">
              <View className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} color="#6366F1" />
              </View>
              <View className="flex-1">
                <Text className="block font-medium text-indigo-800 mb-1">智能分析</Text>
                <Text className="block text-sm text-indigo-600">
                  保存后，AI会自动分析笔记内容，提取关键信息（如生日、喜好、禁忌等）并更新到对方档案，同时生成下次约会建议。
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部按钮 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <View className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={goBack}>
            取消
          </Button>
          <Button 
            className="flex-1 bg-pink-500" 
            onClick={handleSave}
            disabled={saving || !date || !location || !activity || !duration}
          >
            {saving ? (
              <Loader size={16} color="#fff" className="animate-spin" />
            ) : (
              <Check size={16} color="#fff" />
            )}
            <Text className="ml-1 text-white">{saving ? '保存中...' : '保存'}</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default DateEditPage
