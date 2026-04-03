import { View, Text } from '@tarojs/components'
import Taro, { useLoad, useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ChevronRight, User, Target, Sparkles, Check, LoaderCircle } from 'lucide-react-taro'

// 本地存储key
const STORAGE_KEY = 'speed_plan_draft'

// 行为层级定义
const BEHAVIOR_LEVELS = [
  { level: 1, code: 'get_contact', name: '交换联系方式', intimacy: 10 },
  { level: 1, code: 'first_chat', name: '第一次聊天', intimacy: 15 },
  { level: 1, code: 'agree_meet', name: '约定见面', intimacy: 20 },
  { level: 2, code: 'first_meet', name: '第一次见面', intimacy: 30 },
  { level: 2, code: 'show_interest', name: '对方表现兴趣', intimacy: 35 },
  { level: 2, code: 'second_meet', name: '同意第二次见面', intimacy: 40 },
  { level: 3, code: 'light_touch', name: '肢体接触', intimacy: 50 },
  { level: 3, code: 'hold_hands', name: '牵手', intimacy: 55 },
  { level: 3, code: 'hug', name: '拥抱', intimacy: 60 },
  { level: 4, code: 'pet_name', name: '亲密称呼', intimacy: 65 },
  { level: 4, code: 'kiss', name: '接吻', intimacy: 75 },
  { level: 4, code: 'cuddle', name: '依偎', intimacy: 70 },
  { level: 5, code: 'intimate_touch', name: '亲密抚摸', intimacy: 85 },
  { level: 5, code: 'stay_over', name: '过夜', intimacy: 90 },
  { level: 5, code: 'sex', name: '发生关系', intimacy: 100 },
  { level: 6, code: 'relationship', name: '确认恋爱', intimacy: 80 },
]

// 当前进展分组
const PROGRESS_GROUPS = [
  {
    title: '初识阶段',
    levels: [1, 2],
    items: BEHAVIOR_LEVELS.filter(b => b.level <= 2)
  },
  {
    title: '暧昧阶段',
    levels: [3, 4],
    items: BEHAVIOR_LEVELS.filter(b => b.level === 3 || b.level === 4)
  },
]

// 常用目标行为
const TARGET_BEHAVIORS = [
  { code: 'first_meet', name: '约出来见面' },
  { code: 'hold_hands', name: '牵手' },
  { code: 'kiss', name: '接吻' },
  { code: 'sex', name: '发生关系' },
  { code: 'relationship', name: '确认恋爱关系' },
]

interface Match {
  id: number
  name: string
  avatar_url?: string
  relationship_type?: string
  progress_score?: number
  cycleStartDate?: string
}

interface MatchDetail extends Match {
  mbti?: string
  attachment_type?: string
  cycle_phase?: string
  relationship_energy?: number
  interaction_count?: number
}

interface DraftData {
  background: string
  currentProgress: string[]
  selectedMatchId?: number
  targetHours: number
  targetBehavior: string
}

const SpeedPlanPage: FC = () => {
  // 步骤状态
  const [currentStep, setCurrentStep] = useState(1)
  
  // 表单数据
  const [background, setBackground] = useState('')
  const [currentProgress, setCurrentProgress] = useState<string[]>([])
  const [selectedMatch, setSelectedMatch] = useState<MatchDetail | null>(null)
  const [targetHours, setTargetHours] = useState(72)
  const [targetBehavior, setTargetBehavior] = useState('kiss')
  
  // 对象列表
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  // 生成结果
  const [result, setResult] = useState<string | null>(null)

  useLoad(() => {
    console.log('Speed plan page loaded.')
    loadDraft()
  })

  useDidShow(() => {
    fetchMatches()
  })

  // 加载草稿
  const loadDraft = async () => {
    try {
      const draftStr = await Taro.getStorageSync(STORAGE_KEY)
      if (draftStr) {
        const draft: DraftData = JSON.parse(draftStr)
        setBackground(draft.background || '')
        setCurrentProgress(draft.currentProgress || [])
        setTargetHours(draft.targetHours || 72)
        setTargetBehavior(draft.targetBehavior || 'kiss')
        // 如果有选中的对象，加载详情
        if (draft.selectedMatchId) {
          fetchMatchDetail(draft.selectedMatchId)
        }
      }
    } catch (error) {
      console.error('Load draft error:', error)
    }
  }

  // 保存草稿
  const saveDraft = async (data: Partial<DraftData>) => {
    try {
      const draft: DraftData = {
        background: data.background ?? background,
        currentProgress: data.currentProgress ?? currentProgress,
        selectedMatchId: data.selectedMatchId ?? selectedMatch?.id,
        targetHours: data.targetHours ?? targetHours,
        targetBehavior: data.targetBehavior ?? targetBehavior,
      }
      await Taro.setStorageSync(STORAGE_KEY, JSON.stringify(draft))
    } catch (error) {
      console.error('Save draft error:', error)
    }
  }

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/match/list' })
      if (res.data?.code === 200 && res.data?.data?.list) {
        setMatches(res.data.data.list)
      }
    } catch (error) {
      console.error('Fetch matches error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMatchDetail = async (matchId: number) => {
    try {
      const res = await Network.request({ url: `/api/match/${matchId}` })
      if (res.data?.code === 200 && res.data?.data) {
        const detail = res.data.data
        // 获取周期信息
        if (detail.cycleStartDate) {
          const cycleRes = await Network.request({ url: `/api/match/${matchId}/cycle` })
          if (cycleRes.data?.code === 200 && cycleRes.data?.data) {
            detail.cycle_phase = cycleRes.data.data.phase
          }
        }
        // 获取互动能量
        const energyRes = await Network.request({ url: `/api/interaction/match/${matchId}/energy` })
        if (energyRes.data?.code === 200 && energyRes.data?.data) {
          detail.relationship_energy = energyRes.data.data.energy
          detail.interaction_count = energyRes.data.data.totalInteractions
        }
        setSelectedMatch(detail)
        saveDraft({ selectedMatchId: matchId })
      }
    } catch (error) {
      console.error('Fetch match detail error:', error)
    }
  }

  const toggleProgress = (code: string) => {
    const newProgress = currentProgress.includes(code) 
      ? currentProgress.filter(c => c !== code)
      : [...currentProgress, code]
    setCurrentProgress(newProgress)
    saveDraft({ currentProgress: newProgress })
  }

  const handleMatchSelect = async (match: Match) => {
    await fetchMatchDetail(match.id)
  }

  const generatePlan = async () => {
    if (!selectedMatch) return
    
    try {
      setGenerating(true)
      const res = await Network.request({
        url: '/api/speed-plan/generate',
        method: 'POST',
        data: {
          background,
          currentProgress,
          matchId: selectedMatch.id,
          targetHours,
          targetBehavior,
        }
      })
      
      if (res.data?.code === 200 && res.data?.data) {
        setResult(res.data.data.plan)
        setCurrentStep(4)
      }
    } catch (error) {
      console.error('Generate plan error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleBackgroundChange = (value: string) => {
    setBackground(value)
    saveDraft({ background: value })
  }

  const handleTargetHoursChange = (hours: number) => {
    setTargetHours(hours)
    saveDraft({ targetHours: hours })
  }

  const handleTargetBehaviorChange = (behavior: string) => {
    setTargetBehavior(behavior)
    saveDraft({ targetBehavior: behavior })
  }

  const resetForm = async () => {
    setCurrentStep(1)
    setResult(null)
    setBackground('')
    setCurrentProgress([])
    setSelectedMatch(null)
    setTargetHours(72)
    setTargetBehavior('kiss')
    // 清除草稿
    try {
      await Taro.removeStorageSync(STORAGE_KEY)
    } catch (error) {
      console.error('Remove draft error:', error)
    }
  }

  const getRelationshipTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      long_term: '长期',
      short_term: '短期',
      both: '灵活',
    }
    return labels[type || ''] || ''
  }

  const getCyclePhaseLabel = (phase?: string) => {
    const labels: Record<string, string> = {
      menstrual: '经期',
      follicular: '卵泡期',
      ovulation: '排卵期',
      luteal_early: '黄体早期',
      luteal_mid: '黄体中期',
      luteal_late: '黄体晚期',
    }
    return labels[phase || ''] || ''
  }

  const getDifficultyStars = (score: number) => {
    if (score <= 2) return '⭐'
    if (score <= 4) return '⭐⭐'
    if (score <= 6) return '⭐⭐⭐'
    if (score <= 8) return '⭐⭐⭐⭐'
    return '⭐⭐⭐⭐⭐'
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <CustomHeader title="速推方案" />

      {/* 进度指示器 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex items-center justify-between">
          {['背景', '对象', '目标', '方案'].map((label, index) => {
            const stepNum = index + 1
            const isActive = currentStep === stepNum
            const isCompleted = currentStep > stepNum
            
            return (
              <View key={label} className="flex items-center">
                <View 
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500' : isActive ? 'bg-black' : 'bg-gray-200'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={14} color="#fff" />
                  ) : (
                    <Text className={`block text-xs ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {stepNum}
                    </Text>
                  )}
                </View>
                <Text className={`block text-xs ml-1 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {label}
                </Text>
                {index < 3 && (
                  <View className="w-6 h-1 bg-gray-200 mx-2" />
                )}
              </View>
            )
          })}
        </View>
      </View>

      {/* Step 1: 互动背景 */}
      {currentStep === 1 && (
        <View className="p-4">
          <View className="bg-white rounded-2xl p-4 mb-4">
            <View className="flex items-center gap-2 mb-3">
              <User size={18} color="#374151" />
              <Text className="block text-base font-semibold text-gray-900">互动背景</Text>
            </View>
            
            <View className="mb-4">
              <Textarea
                className="w-full h-24"
                placeholder="描述互动背景，例如：相亲认识一周，微信聊了几天..."
                value={background}
                onInput={(e) => handleBackgroundChange(e.detail.value)}
              />
            </View>

            <Text className="block text-sm text-gray-500 mb-3">当前进展（可多选）</Text>
            
            {PROGRESS_GROUPS.map((group) => (
              <View key={group.title} className="mb-3">
                <Text className="block text-xs text-gray-400 mb-2">{group.title}</Text>
                <View className="flex flex-wrap gap-2">
                  {group.items.map((behavior) => (
                    <View
                      key={behavior.code}
                      className={`px-3 py-2 rounded-full ${
                        currentProgress.includes(behavior.code)
                          ? 'bg-black'
                          : 'bg-gray-100'
                      }`}
                      onClick={() => toggleProgress(behavior.code)}
                    >
                      <Text className={`block text-xs ${
                        currentProgress.includes(behavior.code) ? 'text-white' : 'text-gray-600'
                      }`}
                      >
                        {behavior.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View
            className="bg-black rounded-xl py-3 flex items-center justify-center"
            onClick={() => setCurrentStep(2)}
          >
            <Text className="block text-white font-medium">下一步</Text>
            <ChevronRight size={18} color="#fff" />
          </View>
        </View>
      )}

      {/* Step 2: 选择对象 */}
      {currentStep === 2 && (
        <View className="p-4">
          <View className="bg-white rounded-2xl p-4 mb-4">
            <View className="flex items-center gap-2 mb-3">
              <User size={18} color="#374151" />
              <Text className="block text-base font-semibold text-gray-900">选择对象</Text>
            </View>
            
            {loading ? (
              <View className="py-8 text-center">
                <Text className="block text-gray-400">加载中...</Text>
              </View>
            ) : matches.length === 0 ? (
              <View className="py-8 text-center">
                <Text className="block text-gray-400">还没有对象，请先添加</Text>
              </View>
            ) : (
              <View className="flex flex-col gap-2">
                {matches.map((match) => {
                  const isSelected = selectedMatch?.id === match.id
                  return (
                    <View
                      key={match.id}
                      className={`p-3 rounded-xl flex items-center justify-between ${
                        isSelected ? 'bg-black' : 'bg-gray-50'
                      }`}
                      onClick={() => handleMatchSelect(match)}
                    >
                      <View className="flex items-center gap-3">
                        <View className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-white' : 'bg-gray-200'
                        }`}
                        >
                          <Text className={`block text-sm font-medium ${
                            isSelected ? 'text-black' : 'text-gray-600'
                          }`}
                          >
                            {match.name.charAt(0)}
                          </Text>
                        </View>
                        <View>
                          <Text className={`block font-medium ${
                            isSelected ? 'text-white' : 'text-gray-900'
                          }`}
                          >
                            {match.name}
                          </Text>
                          <Text className={`block text-xs ${
                            isSelected ? 'text-gray-300' : 'text-gray-500'
                          }`}
                          >
                            {getRelationshipTypeLabel(match.relationship_type)}
                            {match.progress_score !== undefined && ` · 推进值${match.progress_score}`}
                          </Text>
                        </View>
                      </View>
                      {isSelected && <Check size={18} color="#fff" />}
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* 对象详情 */}
          {selectedMatch && (
            <View className="bg-white rounded-2xl p-4 mb-4">
              <Text className="block text-sm text-gray-500 mb-2">对象分析</Text>
              <View className="grid grid-cols-2 gap-3">
                {selectedMatch.mbti && (
                  <View className="bg-gray-50 rounded-lg p-2">
                    <Text className="block text-xs text-gray-400">MBTI</Text>
                    <Text className="block text-sm font-medium text-gray-900">{selectedMatch.mbti}</Text>
                  </View>
                )}
                {selectedMatch.attachment_type && (
                  <View className="bg-gray-50 rounded-lg p-2">
                    <Text className="block text-xs text-gray-400">依恋类型</Text>
                    <Text className="block text-sm font-medium text-gray-900">{selectedMatch.attachment_type}</Text>
                  </View>
                )}
                {selectedMatch.cycle_phase && (
                  <View className="bg-gray-50 rounded-lg p-2">
                    <Text className="block text-xs text-gray-400">周期阶段</Text>
                    <Text className="block text-sm font-medium text-gray-900">{getCyclePhaseLabel(selectedMatch.cycle_phase)}</Text>
                  </View>
                )}
                {selectedMatch.relationship_energy !== undefined && (
                  <View className="bg-gray-50 rounded-lg p-2">
                    <Text className="block text-xs text-gray-400">关系能量</Text>
                    <Text className="block text-sm font-medium text-gray-900">{selectedMatch.relationship_energy}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View className="flex gap-3">
            <View
              className="flex-1 bg-gray-100 rounded-xl py-3 flex items-center justify-center"
              onClick={() => setCurrentStep(1)}
            >
              <Text className="block text-gray-600">上一步</Text>
            </View>
            <View
              className={`flex-1 rounded-xl py-3 flex items-center justify-center ${
                selectedMatch ? 'bg-black' : 'bg-gray-200'
              }`}
              onClick={() => selectedMatch && setCurrentStep(3)}
            >
              <Text className={`block font-medium ${selectedMatch ? 'text-white' : 'text-gray-400'}`}>
                下一步
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Step 3: 设定目标 */}
      {currentStep === 3 && (
        <View className="p-4">
          <View className="bg-white rounded-2xl p-4 mb-4">
            <View className="flex items-center gap-2 mb-3">
              <Target size={18} color="#374151" />
              <Text className="block text-base font-semibold text-gray-900">设定目标</Text>
            </View>
            
            {/* 目标时间 */}
            <View className="mb-4">
              <Text className="block text-sm text-gray-500 mb-2">目标时间</Text>
              <View className="flex items-center gap-2">
                <View className="bg-gray-50 rounded-xl px-4 py-3 flex-1">
                  <Input
                    className="w-full text-center"
                    type="number"
                    value={String(targetHours)}
                    onInput={(e) => handleTargetHoursChange(Number(e.detail.value))}
                  />
                </View>
                <Text className="block text-gray-600">小时内</Text>
              </View>
              
              {/* 快捷选择 */}
              <View className="flex gap-2 mt-2">
                {[24, 48, 72, 168].map((hours) => (
                  <View
                    key={hours}
                    className={`px-3 py-2 rounded-full ${
                      targetHours === hours ? 'bg-black' : 'bg-gray-100'
                    }`}
                    onClick={() => handleTargetHoursChange(hours)}
                  >
                    <Text className={`block text-xs ${
                      targetHours === hours ? 'text-white' : 'text-gray-600'
                    }`}
                    >
                      {hours >= 24 ? `${hours / 24}天` : `${hours}小时`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 目标行为 */}
            <View>
              <Text className="block text-sm text-gray-500 mb-2">目标行为</Text>
              <View className="flex flex-wrap gap-2">
                {TARGET_BEHAVIORS.map((behavior) => (
                  <View
                    key={behavior.code}
                    className={`px-4 py-2 rounded-xl ${
                      targetBehavior === behavior.code ? 'bg-black' : 'bg-gray-100'
                    }`}
                    onClick={() => handleTargetBehaviorChange(behavior.code)}
                  >
                    <Text className={`block text-sm ${
                      targetBehavior === behavior.code ? 'text-white' : 'text-gray-600'
                    }`}
                    >
                      {behavior.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* 难度预估 */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <View className="flex items-center gap-2 mb-2">
              <Sparkles size={18} color="#F59E0B" />
              <Text className="block text-sm font-medium text-gray-900">难度预估</Text>
            </View>
            <Text className="block text-2xl font-bold text-gray-900">
              {getDifficultyStars(3)}
            </Text>
            <Text className="block text-sm text-gray-500 mt-1">
              根据对象数据实时计算
            </Text>
          </View>

          <View className="flex gap-3">
            <View
              className="flex-1 bg-gray-100 rounded-xl py-3 flex items-center justify-center"
              onClick={() => setCurrentStep(2)}
            >
              <Text className="block text-gray-600">上一步</Text>
            </View>
            <View
              className="flex-1 bg-black rounded-xl py-3 flex items-center justify-center"
              onClick={generatePlan}
            >
              {generating ? (
                <LoaderCircle size={18} color="#fff" className="animate-spin" />
              ) : (
                <Text className="block text-white font-medium">生成方案</Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Step 4: 生成结果 */}
      {currentStep === 4 && result && (
        <View className="p-4">
          <View className="bg-white rounded-2xl p-4">
            <Text className="block text-base font-semibold text-gray-900 mb-3">速推方案</Text>
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="block text-sm text-gray-700 whitespace-pre-wrap">{result}</Text>
            </View>
          </View>
          
          <View
            className="mt-4 bg-black rounded-xl py-3 flex items-center justify-center"
            onClick={resetForm}
          >
            <Text className="block text-white font-medium">重新生成</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default SpeedPlanPage
