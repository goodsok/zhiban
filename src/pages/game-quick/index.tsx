import { useState, useEffect } from 'react'
import CustomHeader from '@/components/custom-header'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Zap, Clock, Heart, Star, Coffee, Target, RotateCcw } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Network } from '@/network'

interface Question {
  id: string
  text: string
  options: string[]
  answer: number
}

interface Category {
  id: string
  name: string
  icon: any
  color: string
  description: string
  difficulty: string
  questions: Question[]
}

const iconMap: Record<string, any> = {
  Heart,
  Target,
  Star,
  Coffee,
}

const QuickPage: FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [step, setStep] = useState<'select' | 'play' | 'result'>('select')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(8)
  const [score, setScore] = useState(0)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [totalTimeUsed, setTotalTimeUsed] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchGameData = async () => {
    try {
      console.log('[Quick] Fetching game data from API...')
      const res = await Network.request({
        url: '/api/game-data/content?gameKey=quick',
        method: 'GET',
      })
      console.log('[Quick] Game data response:', res.data)
      const items = res.data?.data || []
      const cats: Category[] = items.map((item: any) => {
        const d = item?.content_data || {}
        return {
          id: d.id || item.category,
          name: d.name || '',
          icon: iconMap[d.icon] || Zap,
          color: d.color || 'from-purple-400 to-violet-500',
          description: d.description || '',
          difficulty: d.difficulty || '',
          questions: d.questions || [],
        }
      })
      if (cats.length > 0) setCategories(cats)
    } catch (err) {
      console.error('[Quick] Failed to fetch game data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGameData()
  }, [])

  useLoad(() => {
    console.log('Quick game loaded.')
  })

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 'play' && isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && step === 'play') {
      handleTimeUp()
    }
    return () => clearInterval(interval)
  }, [step, isTimerActive, timeLeft])

  const QUESTION_TIME = 8

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category)
    setStep('play')
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setTimeLeft(QUESTION_TIME)
    setScore(0)
    setTotalCorrect(0)
    setIsTimerActive(true)
    setTotalTimeUsed(0)
    setAnsweredCount(0)
  }

  const handleSelectOption = (index: number) => {
    if (!selectedCategory || selectedOption !== null) return

    const currentQuestion = selectedCategory.questions[currentQuestionIndex]

    setSelectedOption(index)
    setIsTimerActive(false)
    setTotalTimeUsed(prev => prev + (QUESTION_TIME - timeLeft))
    setAnsweredCount(prev => prev + 1)

    if (index === currentQuestion.answer) {
      setScore((prev) => prev + (timeLeft > 0 ? 100 + timeLeft * 10 : 100))
      setTotalCorrect((prev) => prev + 1)
    }

    setTimeout(() => {
      if (currentQuestionIndex < selectedCategory.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setSelectedOption(null)
        setTimeLeft(QUESTION_TIME)
        setIsTimerActive(true)
      } else {
        setStep('result')
      }
    }, 500)
  }

  const handleTimeUp = () => {
    if (selectedCategory && currentQuestionIndex < selectedCategory.questions.length - 1) {
      setTotalTimeUsed(prev => prev + QUESTION_TIME)
      setAnsweredCount(prev => prev + 1)
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOption(null)
      setTimeLeft(QUESTION_TIME)
      setIsTimerActive(true)
    } else {
      setTotalTimeUsed(prev => prev + QUESTION_TIME)
      setAnsweredCount(prev => prev + 1)
      setStep('result')
      setIsTimerActive(false)
    }
  }

  const handleReset = () => {
    setStep('select')
    setSelectedCategory(null)
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setTimeLeft(QUESTION_TIME)
    setScore(0)
    setTotalCorrect(0)
    setIsTimerActive(false)
    setTotalTimeUsed(0)
    setAnsweredCount(0)
  }

  const getMatchRate = () => {
    if (!selectedCategory) return 0
    return Math.round((totalCorrect / selectedCategory.questions.length) * 100)
  }

  const getMatchText = (rate: number) => {
    if (rate >= 80) return { text: '默契十足', color: 'text-green-600', icon: '❤️' }
    if (rate >= 60) return { text: '心有灵犀', color: 'text-blue-600', icon: '💙' }
    if (rate >= 40) return { text: '还需磨合', color: 'text-amber-600', icon: '💛' }
    return { text: '继续探索', color: 'text-rose-600', icon: '💜' }
  }

  if (loading) {
    return (
      <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="快速问答" />
        <View className="bg-gradient-to-r from-purple-500 to-violet-500 px-4 py-6">
          <Text className="block text-2xl font-bold text-white mb-2">快速问答</Text>
          <Text className="block text-sm text-gray-200">加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部 */}
      <View className="bg-gradient-to-r from-purple-500 to-violet-500 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-2">快速问答</Text>
        <Text className="block text-sm text-gray-200">
          猜猜TA的想法，测试你们的默契
        </Text>
      </View>

      {/* 游戏区域 */}
      <View className="p-4">
        {step === 'select' && (
          <>
            <Text className="block text-sm font-medium text-gray-500 mb-4">选择问题类别</Text>
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Card
                  key={category.id}
                  className="mb-4 overflow-hidden"
                  onClick={() => handleSelectCategory(category)}
                >
                  <View className={`bg-gradient-to-r ${category.color} px-4 py-4`}>
                    <View className="flex flex-row items-center justify-between">
                      <View className="flex flex-row items-center flex-1">
                        <View className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
                          <Icon size={20} color={category.color.split(' ')[0].split('-to-')[0].replace('from-', '')} />
                        </View>
                        <View className="flex-1">
                          <Text className="block text-base font-semibold text-white">
                            {category.name}
                          </Text>
                          <Text className="block text-xs text-gray-200">
                            {category.description}
                          </Text>
                        </View>
                      </View>
                      <View className="flex flex-col items-end">
                        <Text className="text-xs text-gray-200">
                          {category.questions.length} 题
                        </Text>
                        <Text className="text-xs text-gray-300 mt-1">
                          {category.difficulty}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              )
            })}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Zap size={16} color="#f59e0b" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-xs text-amber-700 leading-relaxed">
                    💡 本游戏需要双方一起玩！一人根据对TA的了解选择答案，另一人揭晓真实想法，看看你们有多默契。每题限时8秒，快速作答获额外加分。
                  </Text>
                </View>
              </CardContent>
            </Card>
          </>
        )}

        {step === 'play' && selectedCategory && (
          <>
            {/* 顶部信息栏 */}
            <View className="bg-white rounded-2xl shadow-soft px-4 py-3 mb-4 flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                {(() => {
                  const Icon = selectedCategory.icon
                  return <Icon size={16} color="#a855f7" />
                })()}
                <Text className="text-sm font-medium text-gray-700 ml-2">
                  {selectedCategory.name}
                </Text>
              </View>
              <View className="flex flex-row items-center">
                <Clock size={16} color={timeLeft > 4 ? '#6b7280' : timeLeft > 2 ? '#f59e0b' : '#ef4444'} />
                <Text className={`text-sm font-bold ml-2 ${timeLeft > 4 ? 'text-gray-700' : timeLeft > 2 ? 'text-amber-500' : 'text-red-500'}`}>
                  {timeLeft}s
                </Text>
              </View>
            </View>

            {/* 进度 */}
            <View className="bg-gray-200 rounded-full h-2 mb-4">
              <View
                className={`bg-gradient-to-r ${selectedCategory.color} h-2 rounded-full transition-all`}
                style={{ width: `${((currentQuestionIndex + 1) / selectedCategory.questions.length) * 100}%` }}
              />
            </View>

            {/* 问题卡片 */}
            <Card className="mb-6 border-2 border-purple-200">
              <CardContent className="py-6">
                <View className="flex flex-row items-start">
                  <View className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mr-3 flex-shrink-0">
                    <Text className="text-sm font-bold text-white">
                      {currentQuestionIndex + 1}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900 leading-relaxed">
                      {selectedCategory.questions[currentQuestionIndex].text}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 选项 - 二选一 */}
            <View className="grid grid-cols-2 gap-4 mb-4">
              {selectedCategory.questions[currentQuestionIndex].options.map((option, index) => (
                <Card
                  key={index}
                  className={`border-2 cursor-pointer ${
                    selectedOption === index
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 active:bg-gray-50'
                  }`}
                  onClick={() => handleSelectOption(index)}
                >
                  <CardContent className="py-5">
                    <Text
                      className={`text-base font-medium text-center ${
                        selectedOption === index ? 'text-purple-700' : 'text-gray-700'
                      }`}
                    >
                      {option}
                    </Text>
                  </CardContent>
                </Card>
              ))}
            </View>

            {/* 倒计时提示 */}
            {timeLeft <= 3 && selectedOption === null && (
              <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <View className="flex flex-row items-center justify-center">
                  <Clock size={16} color="#ef4444" />
                  <Text className="text-sm font-medium text-red-600 ml-2">
                    快！还有 {timeLeft} 秒！
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {step === 'result' && selectedCategory && (
          <>
            {/* 结果卡片 */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100 mb-4">
              <CardContent className="py-6">
                <View className="flex flex-col items-center">
                  <View className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                    <Zap size={40} color="#a855f7" />
                  </View>
                  <Text className="block text-lg font-semibold text-gray-900 mb-2">
                    挑战完成！
                  </Text>
                  <View className="flex flex-row items-center mb-4">
                    <Text className="text-2xl mr-2">{getMatchText(getMatchRate()).icon}</Text>
                    <Text
                      className={`text-lg font-semibold ${getMatchText(getMatchRate()).color}`}
                    >
                      {getMatchText(getMatchRate()).text}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 统计数据 */}
            <View className="grid grid-cols-2 gap-4 mb-4">
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">答对题数</Text>
                  <Text className="block text-2xl font-bold text-purple-600">
                    {totalCorrect} / {selectedCategory.questions.length}
                  </Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">默契度</Text>
                  <Text className="block text-2xl font-bold text-purple-600">{getMatchRate()}%</Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">总得分</Text>
                  <Text className="block text-2xl font-bold text-purple-600">{score}</Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">平均反应时间</Text>
                  <Text className="block text-2xl font-bold text-purple-600">
                    {answeredCount > 0 ? (totalTimeUsed / answeredCount).toFixed(1) : '0'}s
                  </Text>
                </CardContent>
              </Card>
            </View>

            {/* 建议 */}
            <Card className="mb-4">
              <CardContent className="py-4">
                <View className="flex flex-row items-start">
                  <Star size={16} color="#f59e0b" className="mr-2 mt-1 flex-shrink-0" />
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">小贴士</Text>
                    <Text className="text-sm text-gray-700 leading-relaxed">
                      {getMatchRate() >= 80
                        ? '你们的默契度超棒！很多想法都不谋而合，继续珍惜这份心有灵犀。'
                        : getMatchRate() >= 60
                          ? '你们已经很有默契了！再多聊聊彼此的想法，默契度还会提升。'
                          : getMatchRate() >= 40
                            ? '你们还有很多想法不一致的地方，这正是了解彼此的好机会！'
                            : '差异也是一种魅力！多聊聊彼此的想法，发现更多共同点。'}
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
                <Text className="ml-2">选择其他类别</Text>
              </View>
            </Button>
          </>
        )}
      </View>

      {/* 底部提示 */}
      <View className="bg-white border-t px-4 py-3 mt-4">
        <View className="flex flex-row items-center">
          <Zap size={16} color="#a855f7" />
          <Text className="block text-xs text-gray-500 ml-2">
            提示：每题限时8秒，快速选择获额外加分，看看你们有多默契
          </Text>
        </View>
      </View>
    </View>
  )
}

export default QuickPage
