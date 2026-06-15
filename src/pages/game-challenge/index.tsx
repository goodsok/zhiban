import { useState, useEffect } from 'react'
import CustomHeader from '@/components/custom-header'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Eye, FileText, Search, Target, Clock, Trophy, RotateCcw, Check, X } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Network } from '@/network'

interface Option {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  description: string
  question: string
  options: Option[]
}

interface Challenge {
  id: string
  name: string
  icon: any
  color: string
  description: string
  readTime: number
  questions: Question[]
}

const iconMap: Record<string, any> = {
  Eye,
  Search,
  FileText,
  Target,
}

const ChallengePage: FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [step, setStep] = useState<'select' | 'read' | 'play' | 'result'>('select')
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [readTimeLeft, setReadTimeLeft] = useState(10)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [totalTimeUsed, setTotalTimeUsed] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchGameData = async () => {
    try {
      console.log('[Challenge] Fetching game data from API...')
      const res = await Network.request({
        url: '/api/game-data/content?gameKey=challenge',
        method: 'GET',
      })
      console.log('[Challenge] Game data response:', res.data)
      const items = res.data?.data || []
      const chals: Challenge[] = items.map((item: any) => {
        const d = item?.content_data || {}
        return {
          id: d.id || item.category,
          name: d.name || '',
          icon: iconMap[d.icon] || Eye,
          color: d.color || 'from-emerald-400 to-green-500',
          description: d.description || '',
          readTime: d.readTime || 10,
          questions: d.questions || [],
        }
      })
      if (chals.length > 0) setChallenges(chals)
    } catch (err) {
      console.error('[Challenge] Failed to fetch game data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGameData()
  }, [])

  useLoad(() => {
    console.log('Challenge game loaded.')
  })

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 'read' && isTimerActive && readTimeLeft > 0) {
      interval = setInterval(() => {
        setReadTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (step === 'read' && readTimeLeft === 0) {
      handleReadTimeUp()
    }
    return () => clearInterval(interval)
  }, [step, isTimerActive, readTimeLeft])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 'play' && isTimerActive && timeLeft > 0 && !showResult) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && step === 'play' && !showResult) {
      handleAnswerTimeUp()
    }
    return () => clearInterval(interval)
  }, [step, isTimerActive, timeLeft, showResult])

  const handleSelectChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setStep('read')
    setCurrentQuestionIndex(0)
    setReadTimeLeft(challenge.readTime)
    setSelectedOption(null)
    setShowResult(false)
    setTimeLeft(30)
    setScore(0)
    setCorrectCount(0)
    setIsTimerActive(true)
    setTotalTimeUsed(0)
  }

  const handleReadTimeUp = () => {
    setStep('play')
    setIsTimerActive(false)
  }

  const handleSelectOption = (optionId: string) => {
    if (!selectedChallenge) return

    const question = selectedChallenge.questions[currentQuestionIndex]
    const option = question.options.find(opt => opt.id === optionId)

    if (option) {
      setSelectedOption(optionId)
      setShowResult(true)
      setIsTimerActive(false)
      setTotalTimeUsed(prev => prev + (30 - timeLeft))

      if (option.isCorrect) {
        setScore((prev) => prev + (timeLeft > 0 ? 100 + timeLeft : 100))
        setCorrectCount((prev) => prev + 1)
      }
    }
  }

  const handleAnswerTimeUp = () => {
    setShowResult(true)
    setIsTimerActive(false)
    setTotalTimeUsed(prev => prev + 30)
  }

  const handleNextQuestion = () => {
    if (!selectedChallenge) return

    if (currentQuestionIndex < selectedChallenge.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOption(null)
      setShowResult(false)
      setReadTimeLeft(selectedChallenge.readTime)
      setTimeLeft(30)
      setStep('read')
      setIsTimerActive(true)
    } else {
      setStep('result')
    }
  }

  const handleReset = () => {
    setStep('select')
    setSelectedChallenge(null)
    setCurrentQuestionIndex(0)
    setReadTimeLeft(10)
    setSelectedOption(null)
    setShowResult(false)
    setTimeLeft(30)
    setScore(0)
    setCorrectCount(0)
    setIsTimerActive(false)
    setTotalTimeUsed(0)
  }

  const getObservationScore = () => {
    if (!selectedChallenge) return 0
    return Math.round((correctCount / selectedChallenge.questions.length) * 100)
  }

  const getObservationLevel = (observationScore: number) => {
    if (observationScore >= 80) return { text: '观察力敏锐', color: 'text-green-600', icon: '👁️' }
    if (observationScore >= 60) return { text: '观察力良好', color: 'text-blue-600', icon: '👀' }
    if (observationScore >= 40) return { text: '观察力一般', color: 'text-amber-600', icon: '🔍' }
    return { text: '需要多加观察', color: 'text-rose-600', icon: '🔎' }
  }

  if (loading) {
    return (
      <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="观察力挑战" />
        <View className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-6">
          <Text className="block text-2xl font-bold text-white mb-2">观察力挑战</Text>
          <Text className="block text-sm text-gray-200">加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部 */}
      <View className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-2">观察力挑战</Text>
        <Text className="block text-sm text-gray-200">
          快速阅读，捕捉细节
        </Text>
      </View>

      {/* 游戏区域 */}
      <View className="p-4">
        {step === 'select' && (
          <>
            <Text className="block text-sm font-medium text-gray-500 mb-4">选择挑战类型</Text>
            {challenges.map((challenge) => {
              const Icon = challenge.icon
              return (
                <Card
                  key={challenge.id}
                  className="mb-4 overflow-hidden"
                  onClick={() => handleSelectChallenge(challenge)}
                >
                  <View className={`bg-gradient-to-r ${challenge.color} px-4 py-4`}>
                    <View className="flex flex-row items-center justify-between">
                      <View className="flex flex-row items-center flex-1">
                        <View className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
                          <Icon size={20} color={challenge.color.split(' ')[0].split('-to-')[0].replace('from-', '')} />
                        </View>
                        <View className="flex-1">
                          <Text className="block text-base font-semibold text-white">
                            {challenge.name}
                          </Text>
                          <Text className="block text-xs text-gray-200">
                            {challenge.description}
                          </Text>
                        </View>
                      </View>
                      <View className="flex flex-row items-center">
                        <Text className="text-xs text-gray-200 mr-2">
                          {challenge.questions.length} 题
                        </Text>
                        <Eye size={16} color="white" />
                      </View>
                    </View>
                  </View>
                </Card>
              )
            })}
          </>
        )}

        {step === 'read' && selectedChallenge && (
          <>
            {/* 顶部信息栏 */}
            <View className="bg-white rounded-2xl shadow-soft px-4 py-3 mb-4 flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                {(() => {
                  const Icon = selectedChallenge.icon
                  return <Icon size={16} color="#6366f1" />
                })()}
                <Text className="text-sm font-medium text-gray-700 ml-2">
                  {selectedChallenge.name}
                </Text>
              </View>
              <View className="flex flex-row items-center">
                <Clock size={16} color={readTimeLeft <= 3 ? '#ef4444' : '#6b7280'} />
                <Text className={`text-sm font-medium ml-2 ${readTimeLeft <= 3 ? 'text-red-500' : 'text-gray-700'}`}>
                  {readTimeLeft}s
                </Text>
              </View>
            </View>

            {/* 进度 */}
            <View className="bg-gray-200 rounded-full h-2 mb-4">
              <View
                className={`bg-gradient-to-r ${selectedChallenge.color} h-2 rounded-full transition-all`}
                style={{ width: `${((currentQuestionIndex + 1) / selectedChallenge.questions.length) * 100}%` }}
              />
            </View>

            {/* 提示 */}
            <Card className="mb-4 bg-blue-50 border-blue-200">
              <CardContent className="py-3">
                <View className="flex flex-row items-center justify-center">
                  <Eye size={16} color="#3b82f6" />
                  <Text className="text-sm font-medium text-blue-700 ml-2">
                    请仔细阅读以下内容，{selectedChallenge.readTime}秒后隐藏
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* 描述文本 */}
            <Card className="mb-4">
              <CardContent className="py-5">
                <View className="flex flex-row items-start">
                  <FileText size={16} color="#6366f1" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-gray-800 leading-relaxed">
                    {selectedChallenge.questions[currentQuestionIndex].description}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </>
        )}

        {step === 'play' && selectedChallenge && (
          <>
            {/* 顶部信息栏 */}
            <View className="bg-white rounded-2xl shadow-soft px-4 py-3 mb-4 flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                {(() => {
                  const Icon = selectedChallenge.icon
                  return <Icon size={16} color="#6366f1" />
                })()}
                <Text className="text-sm font-medium text-gray-700 ml-2">
                  {selectedChallenge.name}
                </Text>
              </View>
              <View className="flex flex-row items-center">
                <Clock size={16} color={timeLeft <= 10 ? '#ef4444' : '#6b7280'} />
                <Text className={`text-sm font-medium ml-2 ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-700'}`}>
                  {timeLeft}s
                </Text>
              </View>
            </View>

            {/* 进度 */}
            <View className="bg-gray-200 rounded-full h-2 mb-4">
              <View
                className={`bg-gradient-to-r ${selectedChallenge.color} h-2 rounded-full transition-all`}
                style={{ width: `${((currentQuestionIndex + 1) / selectedChallenge.questions.length) * 100}%` }}
              />
            </View>

            {/* 问题 */}
            <Card className="mb-4">
              <CardContent className="py-4">
                <View className="flex flex-row items-center">
                  <Eye size={16} color="#6366f1" className="mr-2 flex-shrink-0" />
                  <Text className="text-base font-medium text-gray-900">
                    {selectedChallenge.questions[currentQuestionIndex].question}
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* 选项 */}
            <View className="space-y-3 mb-4">
              {selectedChallenge.questions[currentQuestionIndex].options.map((option) => (
                <Card
                  key={option.id}
                  className={`border-2 cursor-pointer ${
                    showResult
                      ? option.id === selectedOption
                        ? option.isCorrect
                          ? 'border-green-500 bg-green-50'
                          : 'border-rose-500 bg-rose-50'
                        : option.isCorrect
                          ? 'border-green-300 bg-green-50'
                          : 'bg-gray-50'
                      : selectedOption === option.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 active:bg-gray-50'
                  }`}
                  onClick={() => !showResult && handleSelectOption(option.id)}
                >
                  <CardContent className="py-4">
                    <View className="flex flex-row items-center">
                      <View
                        className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                          showResult
                            ? option.id === selectedOption
                              ? option.isCorrect
                                ? 'bg-green-500'
                                : 'bg-rose-500'
                              : option.isCorrect
                                ? 'bg-green-500'
                                : 'bg-gray-300'
                            : selectedOption === option.id
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                        }`}
                      >
                        {showResult && option.isCorrect && <Check size={14} color="white" />}
                        {showResult && option.id === selectedOption && !option.isCorrect && <X size={14} color="white" />}
                      </View>
                      <Text
                        className={`text-sm flex-1 ${
                          showResult && option.isCorrect
                            ? 'text-green-700 font-medium'
                            : showResult && option.id === selectedOption
                              ? 'text-rose-700 font-medium'
                              : 'text-gray-700'
                        }`}
                      >
                        {option.text}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>

            {/* 下一题按钮 */}
            {showResult && (
              <Button
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500"
                onClick={handleNextQuestion}
              >
                <Text className="text-white font-medium">
                  {currentQuestionIndex === selectedChallenge.questions.length - 1
                    ? '查看结果'
                    : '下一题'}
                </Text>
              </Button>
            )}
          </>
        )}

        {step === 'result' && selectedChallenge && (
          <>
            {/* 结果卡片 */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 mb-4">
              <CardContent className="py-6">
                <View className="flex flex-col items-center">
                  <View className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                    <Trophy size={40} color="#6366f1" />
                  </View>
                  <Text className="block text-lg font-semibold text-gray-900 mb-2">
                    挑战完成！
                  </Text>
                  <View className="flex flex-row items-center mb-4">
                    <Text className="text-2xl mr-2">{getObservationLevel(getObservationScore()).icon}</Text>
                    <Text
                      className={`text-lg font-semibold ${getObservationLevel(getObservationScore()).color}`}
                    >
                      {getObservationLevel(getObservationScore()).text}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 统计数据 */}
            <View className="grid grid-cols-2 gap-4 mb-4">
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">正确题数</Text>
                  <Text className="block text-2xl font-bold text-green-600">
                    {correctCount} / {selectedChallenge.questions.length}
                  </Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">观察力评分</Text>
                  <Text className="block text-2xl font-bold text-green-600">
                    {getObservationScore()}%
                  </Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">总得分</Text>
                  <Text className="block text-2xl font-bold text-green-600">{score}</Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">平均用时</Text>
                  <Text className="block text-2xl font-bold text-green-600">
                    {selectedChallenge.questions.length > 0
                      ? Math.round(totalTimeUsed / selectedChallenge.questions.length)
                      : 0}s
                  </Text>
                </CardContent>
              </Card>
            </View>

            {/* 建议 */}
            <Card className="mb-4">
              <CardContent className="py-4">
                <View className="flex flex-row items-start">
                  <Eye size={16} color="#6366f1" className="mr-2 mt-1 flex-shrink-0" />
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">建议</Text>
                    <Text className="text-sm text-gray-700 leading-relaxed">
                      {getObservationScore() >= 80
                        ? '你的观察力非常敏锐！继续保持这种关注度。'
                        : getObservationScore() >= 60
                          ? '你的观察力不错，可以多关注细节。'
                          : getObservationScore() >= 40
                            ? '观察力有待提升，多花时间观察。'
                            : '需要更多地关注细节，细心观察很重要。'}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 重新开始 */}
            <Button
              variant="secondary"
              className="w-full rounded-xl py-3"
              onClick={handleReset}
            >
              <View className="flex flex-row items-center justify-center">
                <RotateCcw size={18} color="#6b7280" />
                <Text className="ml-2">选择其他挑战</Text>
              </View>
            </Button>
          </>
        )}
      </View>

      {/* 底部提示 */}
      <View className="bg-white border-t px-4 py-3 mt-4">
        <View className="flex flex-row items-center">
          <Eye size={16} color="#6366f1" />
          <Text className="block text-xs text-gray-500 ml-2">
            提示：仔细阅读内容，快速回答问题
          </Text>
        </View>
      </View>
    </View>
  )
}

export default ChallengePage
