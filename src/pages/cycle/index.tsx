import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Picker } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Calendar, ChevronLeft, Heart, Moon, Sun, Cloud, Info } from 'lucide-react-taro'
import { Network } from '@/network'

interface CycleInfo {
  day: number
  phase: string
  phaseName: string
  description: string
  recommendations: string[]
  cycleLength: number
  startDate: string
}

const phaseConfig: Record<string, { icon: typeof Heart; color: string; bgColor: string; name: string; range: string }> = {
  menstrual: { icon: Moon, color: '#6B7280', bgColor: '#F3F4F6', name: '月经期', range: '第1-5天' },
  follicular: { icon: Sun, color: '#10B981', bgColor: '#ECFDF5', name: '卵泡期', range: '第6-14天' },
  ovulation: { icon: Heart, color: '#EC4899', bgColor: '#FDF2F8', name: '排卵期', range: '第15-17天' },
  luteal_early: { icon: Sun, color: '#3B82F6', bgColor: '#EFF6FF', name: '黄体早期', range: '第18-21天' },
  luteal_mid: { icon: Cloud, color: '#F59E0B', bgColor: '#FFFBEB', name: '黄体中期', range: '第22-25天' },
  luteal_late: { icon: Moon, color: '#EF4444', bgColor: '#FEF2F2', name: '黄体晚期', range: '第26-28天' },
}

const phaseOrder = ['menstrual', 'follicular', 'ovulation', 'luteal_early', 'luteal_mid', 'luteal_late']

export default function CyclePage() {
  const router = useRouter()
  const matchId = Number(router.params.matchId) || 0
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cycleStartDate, setCycleStartDate] = useState('')
  const [cycleLength, setCycleLength] = useState(28)
  const [hasRecord, setHasRecord] = useState(false)

  useEffect(() => {
    fetchCycleInfo()
  }, [])

  const fetchCycleInfo = async () => {
    if (!matchId) return
    setLoading(true)
    try {
      const res = await Network.request({ url: `/api/match/${matchId}/cycle` })
      console.log('Cycle info response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setCycleInfo(res.data.data)
        setCycleLength(res.data.data.cycleLength || 28)
        setCycleStartDate(res.data.data.startDate || '')
        setHasRecord(true)
      } else {
        setHasRecord(false)
      }
    } catch (error) {
      console.error('Fetch cycle info error:', error)
      setHasRecord(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!matchId) return
    if (!cycleStartDate) {
      Taro.showToast({ title: '请选择开始日期', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      const res = await Network.request({
        url: `/api/match/${matchId}/cycle`,
        method: 'POST',
        data: { cycleStartDate, cycleLength }
      })
      console.log('Save cycle response:', res.data)
      if (res.data?.code === 200) {
        Taro.showToast({ title: '保存成功', icon: 'success' })
        setHasRecord(true)
        fetchCycleInfo()
      } else {
        Taro.showToast({ title: res.data?.msg || '保存失败', icon: 'none' })
      }
    } catch (error) {
      console.error('Save cycle error:', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const handleDateChange = (e) => {
    setCycleStartDate(e.detail.value)
  }

  const onCycleLengthChange = (val: number) => {
    setCycleLength(val)
  }

  const renderProgressBar = () => {
    if (!cycleInfo) return null
    const totalDays = cycleInfo.cycleLength || 28
    const currentDay = cycleInfo.day

    const phases = [
      { key: 'menstrual', start: 1, end: 5 },
      { key: 'follicular', start: 6, end: 14 },
      { key: 'ovulation', start: 15, end: 17 },
      { key: 'luteal_early', start: 18, end: 21 },
      { key: 'luteal_mid', start: 22, end: 25 },
      { key: 'luteal_late', start: 26, end: totalDays },
    ]

    return (
      <View className="mb-4">
        <View className="flex items-center justify-between mb-2">
          <Text className="block text-sm font-medium text-gray-700">周期进度</Text>
          <Text className="block text-sm text-gray-500">第 {currentDay} 天 / 共 {totalDays} 天</Text>
        </View>
        <View className="relative h-8 rounded-full overflow-hidden flex" style={{ backgroundColor: '#F3F4F6' }}>
          {phases.map((p) => {
            const conf = phaseConfig[p.key]
            const widthPct = ((p.end - p.start + 1) / totalDays) * 100
            const isActive = currentDay >= p.start && currentDay <= p.end
            return (
              <View
                key={p.key}
                className="relative flex items-center justify-center"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: conf.bgColor,
                  opacity: isActive ? 1 : 0.5,
                  borderRight: p.key === 'luteal_late' ? 'none' : '1px solid rgba(255,255,255,0.6)',
                }}
              >
                {isActive && (
                  <View
                    className="absolute rounded-full"
                    style={{
                      width: '12px', height: '12px', backgroundColor: conf.color,
                      border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }}
                  />
                )}
              </View>
            )
          })}
        </View>
        <View className="flex mt-1">
          {phases.map((p) => {
            const conf = phaseConfig[p.key]
            const widthPct = ((p.end - p.start + 1) / totalDays) * 100
            return (
              <View key={p.key} style={{ width: `${widthPct}%` }} className="text-center">
                <Text className="block text-center" style={{ fontSize: '9px', color: conf.color }}>
                  {conf.name}
                </Text>
              </View>
            )
          })}
        </View>
      </View>
    )
  }

  const renderCurrentPhase = () => {
    if (!cycleInfo) return null
    const conf = phaseConfig[cycleInfo.phase] || phaseConfig.follicular
    const PhaseIcon = conf.icon

    return (
      <Card className="mb-4 overflow-hidden">
        <View style={{ backgroundColor: conf.bgColor }} className="p-4">
          <View className="flex items-center gap-3 mb-3">
            <View className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}>
              <PhaseIcon size={24} color={conf.color} />
            </View>
            <View className="flex-1">
              <Text className="block text-lg font-bold" style={{ color: conf.color }}>
                {cycleInfo.phaseName}
              </Text>
              <Text className="block text-sm text-gray-600 mt-1">{conf.range}</Text>
            </View>
            <View className="bg-white rounded-xl px-3 py-1">
              <Text className="block text-xl font-bold" style={{ color: conf.color }}>
                Day {cycleInfo.day}
              </Text>
            </View>
          </View>
          <Text className="block text-sm text-gray-700 leading-relaxed">{cycleInfo.description}</Text>
        </View>
        {cycleInfo.recommendations && cycleInfo.recommendations.length > 0 && (
          <CardContent className="pt-4">
            <Text className="block text-sm font-medium text-gray-700 mb-3">相处建议</Text>
            {cycleInfo.recommendations.map((rec, idx) => (
              <View key={idx} className="flex items-start gap-2 mb-2">
                <View className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: conf.bgColor }}>
                  <Text className="block" style={{ fontSize: '10px', color: conf.color }}>{idx + 1}</Text>
                </View>
                <Text className="block text-sm text-gray-600 leading-relaxed">{rec}</Text>
              </View>
            ))}
          </CardContent>
        )}
      </Card>
    )
  }

  const renderPhaseOverview = () => {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">周期阶段概览</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {phaseOrder.map((key) => {
            const conf = phaseConfig[key]
            const PhaseIcon = conf.icon
            const isActive = cycleInfo?.phase === key
            return (
              <View
                key={key}
                className="flex items-center gap-3 py-2"
                style={{
                  borderBottom: key !== 'luteal_late' ? '1px solid #F3F4F6' : 'none',
                  backgroundColor: isActive ? conf.bgColor : 'transparent',
                  margin: isActive ? '0 -16px' : '0',
                  padding: isActive ? '10px 16px' : '10px 0',
                  borderRadius: isActive ? '8px' : '0',
                }}
              >
                <View className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.8)' : conf.bgColor }}>
                  <PhaseIcon size={16} color={conf.color} />
                </View>
                <View className="flex-1">
                  <View className="flex items-center gap-2">
                    <Text className="block text-sm font-medium" style={{ color: isActive ? conf.color : '#374151' }}>
                      {conf.name}
                    </Text>
                    <Text className="block text-xs text-gray-400">{conf.range}</Text>
                    {isActive && (
                      <View className="px-1 py-1 rounded-full" style={{ backgroundColor: conf.color }}>
                        <Text className="block text-white" style={{ fontSize: '9px' }}>当前</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  const renderSettings = () => {
    const lengthOptions = [21, 25, 28, 30, 32, 35]

    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{hasRecord ? '修改周期设置' : '记录周期'}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <View className="mb-4">
            <Text className="block text-sm text-gray-500 mb-2">上次开始日期</Text>
            <Picker mode="date" value={cycleStartDate} onChange={handleDateChange}>
              <View className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <View className="flex items-center gap-2">
                  <Calendar size={16} color="#6B7280" />
                  <Text className="block text-sm" style={{ color: cycleStartDate ? '#374151' : '#9CA3AF' }}>
                    {cycleStartDate || '请选择日期'}
                  </Text>
                </View>
                <ChevronLeft size={16} color="#9CA3AF" />
              </View>
            </Picker>
          </View>

          <View className="mb-4">
            <Text className="block text-sm text-gray-500 mb-2">周期天数</Text>
            <View className="flex flex-wrap gap-2">
              {lengthOptions.map((len) => (
                <View
                  key={len}
                  className="px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor: cycleLength === len ? '#EC4899' : '#F3F4F6',
                    border: cycleLength === len ? 'none' : '1px solid #E5E7EB',
                  }}
                  onClick={() => onCycleLengthChange(len)}
                >
                  <Text className="block text-sm" style={{ color: cycleLength === len ? '#FFFFFF' : '#6B7280' }}>
                    {len}天
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Button
            className="w-full"
            style={{ backgroundColor: '#EC4899', color: '#FFFFFF' }}
            onClick={handleSave}
            disabled={saving}
          >
            <Text className="text-white">{saving ? '保存中...' : (hasRecord ? '更新周期' : '开始记录')}</Text>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 min-h-screen">
        <View className="flex items-center justify-center" style={{ height: '60vh' }}>
          <Activity size={24} color="#EC4899" />
          <Text className="block text-gray-400 ml-2">加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50 min-h-screen pb-8">
      <View className="bg-gradient-to-b from-pink-50 to-gray-50 px-4 pt-12 pb-4">
        <View className="flex items-center gap-3 mb-2">
          <View className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
            <Activity size={20} color="#EC4899" />
          </View>
          <View className="flex-1">
            <Text className="block text-lg font-bold text-gray-800">周期追踪</Text>
            <Text className="block text-xs text-gray-500">了解她，从了解她的周期开始</Text>
          </View>
        </View>
      </View>

      <View className="px-4">
        {renderSettings()}

        {hasRecord && cycleInfo && (
          <>
            {renderProgressBar()}
            {renderCurrentPhase()}
            {renderPhaseOverview()}
          </>
        )}

        <Card className="mb-4">
          <CardContent className="pt-4">
            <View className="flex items-start gap-2">
              <Info size={16} color="#9CA3AF" />
              <Text className="block text-xs text-gray-400 leading-relaxed">
                周期追踪仅作为参考，帮助您更好地了解和关心对方。每个人的身体状况不同，如有健康疑问请咨询专业医生。数据仅保存在您的设备上。
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
