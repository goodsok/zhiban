import { View, Text } from '@tarojs/components'
import { useLoad, useRouter, navigateBack } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import CustomHeader from '@/components/custom-header'
import {
  Check,
  X,
  Loader,
  Sparkles
} from 'lucide-react-taro'

const moodOptions = [
  { value: 'excellent', label: '很好', icon: '😍' },
  { value: 'good', label: '不错', icon: '😊' },
  { value: 'normal', label: '一般', icon: '😐' },
  { value: 'not_good', label: '不太好', icon: '😕' },
]

const DateEditPage: FC = () => {
  const router = useRouter()
  const matchId = router.params.matchId
  const recordId = router.params.id
  const isEdit = !!recordId

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [location, setLocation] = useState('')
  const [activity, setActivity] = useState('')
  const [duration, setDuration] = useState('')
  const [mood, setMood] = useState<'excellent' | 'good' | 'normal' | 'not_good'>('good')
  const [highlights, setHighlights] = useState<string[]>([])
  const [highlightInput, setHighlightInput] = useState('')
  const [notes, setNotes] = useState('')

  useLoad(() => {
    if (isEdit) fetchRecord()
  })

  const fetchRecord = async () => {
    if (!recordId) return
    try {
      setLoading(true)
      const res = await Network.request({ url: `/api/date-record/${recordId}` })
      if (res.data?.code === 200 && res.data?.data) {
        const r = res.data.data
        setDate(r.date)
        setLocation(r.location)
        setActivity(r.activity)
        setDuration(r.duration)
        setMood(r.mood)
        setHighlights(r.highlights || [])
        setNotes(r.notes || '')
      }
    } catch (error) {
      console.error('Failed to fetch record:', error)
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => navigateBack()

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
    if (!matchId || !date || !location || !activity || !duration) return

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
      <View className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F8FA' }}>
        <Loader size={24} color="#6B7280" className="animate-spin" />
      </View>
    )
  }

  return (
    <View className="min-h-screen pb-24" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部 */}
      <CustomHeader title={isEdit ? '编辑约会' : '记录约会'} />

      <View className="p-4">
        {/* 基本信息 */}
        <View className="mb-6">
          <Text className="block text-xs text-gray-400 mb-2">基本信息</Text>
          <View className="bg-white rounded-xl p-4">
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">日期</Text>
              <Input
                className="w-full"
                placeholder="例如：2024-03-25"
                value={date}
                onInput={(e) => setDate(e.detail.value)}
              />
            </View>
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">地点</Text>
              <Input
                className="w-full"
                placeholder="例如：星巴克（国贸店）"
                value={location}
                onInput={(e) => setLocation(e.detail.value)}
              />
            </View>
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">活动</Text>
              <Input
                className="w-full"
                placeholder="例如：喝咖啡聊天"
                value={activity}
                onInput={(e) => setActivity(e.detail.value)}
              />
            </View>
            <View>
              <Text className="block text-xs text-gray-400 mb-1">时长</Text>
              <Input
                className="w-full"
                placeholder="例如：2小时"
                value={duration}
                onInput={(e) => setDuration(e.detail.value)}
              />
            </View>
          </View>
        </View>

        {/* 感受 */}
        <View className="mb-6">
          <Text className="block text-xs text-gray-400 mb-2">约会感受</Text>
          <View className="flex gap-2">
            {moodOptions.map((option) => (
              <View
                key={option.value}
                className={`flex-1 text-center py-2 rounded-lg ${
                  mood === option.value ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600'
                }`}
                onClick={() => setMood(option.value as typeof mood)}
              >
                <Text className="block text-sm">{option.icon} {option.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 精彩瞬间 */}
        <View className="mb-6">
          <Text className="block text-xs text-gray-400 mb-2">精彩瞬间（选填）</Text>
          {highlights.length > 0 && (
            <View className="flex flex-wrap gap-2 mb-2">
              {highlights.map((h, i) => (
                <Badge key={i} className="bg-gray-100 text-gray-600 pr-1">
                  <Text className="block">{h}</Text>
                  <View 
                    className="ml-1 w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center"
                    onClick={() => removeHighlight(i)}
                  >
                    <X size={10} color="#6B7280" />
                  </View>
                </Badge>
              ))}
            </View>
          )}
          {highlights.length < 5 && (
            <View className="flex gap-2">
              <View className="flex-1">
                <Input
                  className="w-full"
                  placeholder="例如：牵手成功"
                  value={highlightInput}
                  onInput={(e) => setHighlightInput(e.detail.value)}
                />
              </View>
              <Button size="sm" variant="outline" onClick={addHighlight}>
                <Check size={14} color="#6B7280" />
              </Button>
            </View>
          )}
        </View>

        {/* 笔记 */}
        <View className="mb-6">
          <View className="flex items-center gap-1 mb-2">
            <Text className="block text-xs text-gray-400">约会笔记</Text>
            <Badge className="bg-gray-100 text-gray-500 text-xs">
              <Sparkles size={10} color="#6B7280" />
              <Text className="ml-1">AI提取</Text>
            </Badge>
          </View>
          <View className="bg-white rounded-xl p-4">
            <Textarea
              style={{ width: '100%', minHeight: '100px', backgroundColor: 'transparent' }}
              placeholder="记录约会内容，AI会自动提取关键信息..."
              value={notes}
              onInput={(e) => setNotes(e.detail.value)}
              maxlength={500}
            />
          </View>
          <Text className="block text-xs text-gray-300 text-right mt-1">{notes.length}/500</Text>
        </View>
      </View>

      {/* 底部 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <View className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={goBack}>
            取消
          </Button>
          <Button 
            className="flex-1 bg-green-500" 
            onClick={handleSave}
            disabled={saving || !date || !location || !activity || !duration}
          >
            {saving ? <Loader size={14} color="#fff" className="animate-spin" /> : <Check size={14} color="#fff" />}
            <Text className="ml-2 text-white">{saving ? '保存中...' : '保存'}</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default DateEditPage
