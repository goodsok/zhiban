import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { MessageCircle, ArrowRight, Check, X, Lightbulb, RefreshCw, Play, TriangleAlert } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Network } from '@/network'

interface ScenarioOption {
  id: string
  text: string
  isBest: boolean
  score: number
  feedback: string
}

interface Scenario {
  id: string
  title: string
  description: string
  icon: string
  color: string
  difficulty: 'easy' | 'medium' | 'hard'
  situations: {
    id: number
    context: string
    question: string
    options: ScenarioOption[]
  }[]
}

const ScenarioPage: FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [step, setStep] = useState<'select' | 'play' | 'feedback' | 'summary'>('select')
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [currentSituationIndex, setCurrentSituationIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<ScenarioOption | null>(null)
  const [totalScore, setTotalScore] = useState(0)
  const [completedSituations, setCompletedSituations] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchGameData = async () => {
    try {
      console.log('[Scenario] Fetching game data from API...')
      const res = await Network.request({
        url: '/api/game-data/content?gameKey=scenario',
        method: 'GET',
      })
      console.log('[Scenario] Game data response:', res.data)
      const items = res.data?.data || []
      // Merge all scenario arrays from different categories
      const allScenarios: Scenario[] = []
      for (const item of items) {
        const d = item?.content_data || {}
        if (d.scenarios && Array.isArray(d.scenarios)) {
          allScenarios.push(...d.scenarios)
        }
      }
      if (allScenarios.length > 0) setScenarios(allScenarios)
    } catch (err) {
      console.error('[Scenario] Failed to fetch game data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGameData()
  }, [])

  useLoad(() => {
    console.log('Scenario game loaded.')
  })

  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario)
    setStep('play')
    setCurrentSituationIndex(0)
    setSelectedOption(null)
    setTotalScore(0)
    setCompletedSituations(0)
  }

  const handleSelectOption = (option: ScenarioOption) => {
    setSelectedOption(option)
    setTotalScore(prev => prev + option.score)
    setCompletedSituations(prev => prev + 1)
    if (selectedScenario && currentSituationIndex === selectedScenario.situations.length - 1) {
      setStep('summary')
    } else {
      setStep('feedback')
    }
  }

  const handleNextSituation = () => {
    if (!selectedScenario) return
    if (currentSituationIndex < selectedScenario.situations.length - 1) {
      setCurrentSituationIndex(currentSituationIndex + 1)
      setStep('play')
      setSelectedOption(null)
    }
  }

  const handleReset = () => {
    setStep('select')
    setSelectedScenario(null)
    setCurrentSituationIndex(0)
    setSelectedOption(null)
    setTotalScore(0)
    setCompletedSituations(0)
  }

  const getAverageScore = () => {
    if (completedSituations === 0) return 0
    return Math.round(totalScore / completedSituations)
  }

  const getPerformanceText = (score: number) => {
    if (score >= 90) return { text: '完美应对', color: 'text-green-600', icon: '🌟' }
    if (score >= 70) return { text: '表现良好', color: 'text-blue-600', icon: '👍' }
    if (score >= 50) return { text: '需要改进', color: 'text-amber-600', icon: '📝' }
    return { text: '继续努力', color: 'text-rose-600', icon: '💪' }
  }

  if (loading) {
    return (
      <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
        <View className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-6">
          <Text className="block text-2xl font-bold text-white mb-2">情景模拟</Text>
          <Text className="block text-sm text-gray-200">加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部 */}
      <View className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-2">情景模拟</Text>
        <Text className="block text-sm text-gray-200">
          模拟真实约会场景，提升应变能力
        </Text>
      </View>

      {/* 游戏区域 */}
      <View className="p-4">
        {step === 'select' && (
          <>
            <Text className="block text-sm font-medium text-gray-500 mb-4">选择场景类型</Text>
            {scenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className="mb-4 overflow-hidden"
                onClick={() => handleSelectScenario(scenario)}
              >
                <View className={`bg-gradient-to-r ${scenario.color} px-4 py-4`}>
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center flex-1">
                      <Text className="text-2xl mr-3">{scenario.icon}</Text>
                      <View className="flex-1">
                        <Text className="block text-base font-semibold text-white">
                          {scenario.title}
                        </Text>
                        <Text className="block text-xs text-gray-200">
                          {scenario.description}
                        </Text>
                      </View>
                    </View>
                    <View className="flex flex-row items-center">
                      <Text className="text-xs text-gray-200 mr-2">
                        {scenario.situations.length} 个场景
                      </Text>
                      <ArrowRight size={20} color="white" />
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}

        {step === 'play' && selectedScenario && (
          <>
            {/* 进度 */}
            <View className="bg-white rounded-2xl shadow-soft px-4 py-3 mb-4 flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                <MessageCircle size={16} color="#22c55e" />
                <Text className="text-sm font-medium text-gray-700 ml-2">
                  {selectedScenario.title}
                </Text>
              </View>
              <Text className="text-sm text-green-600 font-medium">
                {currentSituationIndex + 1} / {selectedScenario.situations.length}
              </Text>
            </View>

            {/* 情境卡片 */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 mb-4">
              <CardContent className="py-5">
                <View className="flex flex-row items-start mb-4">
                  <Play size={16} color="#22c55e" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-gray-600 flex-1 leading-relaxed">
                    {selectedScenario.situations[currentSituationIndex].context}
                  </Text>
                </View>
                <View className="bg-white rounded-lg px-3 py-2 mt-3">
                  <Text className="text-sm font-medium text-gray-900">
                    {selectedScenario.situations[currentSituationIndex].question}
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* 选项 */}
            <View className="space-y-3">
              {selectedScenario.situations[currentSituationIndex].options.map((option) => (
                <Card
                  key={option.id}
                  className="border-gray-200 active:bg-gray-50"
                  onClick={() => handleSelectOption(option)}
                >
                  <CardContent className="py-4">
                    <View className="flex flex-row items-center">
                      <View className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <Text className="text-sm font-semibold text-green-600">
                          {option.id.toUpperCase()}
                        </Text>
                      </View>
                      <Text className="text-sm text-gray-700 flex-1">{option.text}</Text>
                      <ArrowRight size={16} color="#9ca3af" />
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          </>
        )}

        {step === 'feedback' && selectedScenario && selectedOption && (
          <>
            {/* 单题反馈卡片 */}
            <Card
              className={`mb-4 ${
                selectedOption.isBest
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'
                  : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100'
              }`}
            >
              <CardContent className="py-5">
                <View className="flex flex-col items-center">
                  <View
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      selectedOption.isBest ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                  >
                    {selectedOption.isBest ? (
                      <Check size={32} color="white" />
                    ) : (
                      <X size={32} color="white" />
                    )}
                  </View>
                  <Text
                    className={`block text-lg font-semibold ${
                      selectedOption.isBest ? 'text-green-600' : 'text-amber-600'
                    }`}
                  >
                    {selectedOption.isBest ? '最佳选择！' : '还可以更好'}
                  </Text>
                  <View className="flex flex-row items-center mt-2">
                    <Text className="text-sm text-gray-500">本次得分：</Text>
                    <Text
                      className={`text-sm font-bold ml-1 ${
                        selectedOption.score >= 80
                          ? 'text-green-600'
                          : selectedOption.score >= 60
                            ? 'text-blue-600'
                            : 'text-amber-600'
                      }`}
                    >
                      {selectedOption.score}分
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 反馈 */}
            <Card className="mb-4">
              <CardContent className="py-4">
                <View className="flex flex-row items-start">
                  <Lightbulb size={16} color="#f59e0b" className="mr-2 mt-1 flex-shrink-0" />
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">反馈</Text>
                    <Text className="text-sm text-gray-700 leading-relaxed">
                      {selectedOption.feedback}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 最佳答案 */}
            {!selectedOption.isBest && (
              <Card className="mb-4 bg-blue-50 border-blue-100">
                <CardContent className="py-4">
                  <View className="flex flex-row items-start">
                    <TriangleAlert size={16} color="#3b82f6" className="mr-2 mt-1 flex-shrink-0" />
                    <View className="flex-1">
                      <Text className="text-xs text-blue-600 mb-1">最佳答案</Text>
                      {selectedScenario.situations[currentSituationIndex].options
                        .filter(opt => opt.isBest)
                        .map(opt => (
                          <Text key={opt.id} className="text-sm text-gray-700 leading-relaxed">
                            {opt.text}
                          </Text>
                        ))}
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}

            {/* 下一题按钮 */}
            <Button
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl py-3"
              onClick={handleNextSituation}
            >
              <View className="flex flex-row items-center justify-center">
                <Play size={18} color="#fff" />
                <Text className="text-white ml-2 font-medium">下一场景</Text>
              </View>
            </Button>
          </>
        )}

        {step === 'summary' && selectedScenario && selectedOption && (
          <>
            {/* 最后一题反馈 */}
            <Card
              className={`mb-4 ${
                selectedOption.isBest
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'
                  : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100'
              }`}
            >
              <CardContent className="py-5">
                <View className="flex flex-col items-center">
                  <View
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      selectedOption.isBest ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                  >
                    {selectedOption.isBest ? (
                      <Check size={32} color="white" />
                    ) : (
                      <X size={32} color="white" />
                    )}
                  </View>
                  <Text
                    className={`block text-lg font-semibold ${
                      selectedOption.isBest ? 'text-green-600' : 'text-amber-600'
                    }`}
                  >
                    {selectedOption.isBest ? '最佳选择！' : '还可以更好'}
                  </Text>
                  <View className="flex flex-row items-center mt-2">
                    <Text className="text-sm text-gray-500">本次得分：</Text>
                    <Text
                      className={`text-sm font-bold ml-1 ${
                        selectedOption.score >= 80
                          ? 'text-green-600'
                          : selectedOption.score >= 60
                            ? 'text-blue-600'
                            : 'text-amber-600'
                      }`}
                    >
                      {selectedOption.score}分
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 反馈 */}
            <Card className="mb-4">
              <CardContent className="py-4">
                <View className="flex flex-row items-start">
                  <Lightbulb size={16} color="#f59e0b" className="mr-2 mt-1 flex-shrink-0" />
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">反馈</Text>
                    <Text className="text-sm text-gray-700 leading-relaxed">
                      {selectedOption.feedback}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 最佳答案 */}
            {!selectedOption.isBest && (
              <Card className="mb-4 bg-blue-50 border-blue-100">
                <CardContent className="py-4">
                  <View className="flex flex-row items-start">
                    <TriangleAlert size={16} color="#3b82f6" className="mr-2 mt-1 flex-shrink-0" />
                    <View className="flex-1">
                      <Text className="text-xs text-blue-600 mb-1">最佳答案</Text>
                      {selectedScenario.situations[currentSituationIndex].options
                        .filter(opt => opt.isBest)
                        .map(opt => (
                          <Text key={opt.id} className="text-sm text-gray-700 leading-relaxed">
                            {opt.text}
                          </Text>
                        ))}
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}

            {/* 综合评分 */}
            <Card className="mb-4">
              <CardContent className="py-4">
                <View className="flex flex-col items-center">
                  <Text className="text-sm text-gray-500 mb-2">综合评分</Text>
                  <Text className="block text-4xl font-bold text-gray-900 mb-1">
                    {getAverageScore()}分
                  </Text>
                  <View className="flex flex-row items-center">
                    <Text className="text-xl mr-2">{getPerformanceText(getAverageScore()).icon}</Text>
                    <Text className={`text-base font-semibold ${getPerformanceText(getAverageScore()).color}`}>
                      {getPerformanceText(getAverageScore()).text}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 重新开始 */}
            <Button
              variant="secondary"
              className="rounded-xl py-3"
              onClick={handleReset}
            >
              <View className="flex flex-row items-center justify-center">
                <RefreshCw size={18} color="#6b7280" />
                <Text className="ml-2">选择其他场景</Text>
              </View>
            </Button>
          </>
        )}
      </View>

      {/* 底部提示 */}
      <View className="bg-white border-t px-4 py-3 mt-4">
        <View className="flex flex-row items-center">
          <Lightbulb size={16} color="#22c55e" />
          <Text className="block text-xs text-gray-500 ml-2">
            提示：选择你认为最合适的应对方式，学习最佳实践
          </Text>
        </View>
      </View>
    </View>
  )
}

export default ScenarioPage
