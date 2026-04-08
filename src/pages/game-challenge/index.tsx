import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Eye, Image as ImageIcon, Star, Map, Check, X, Clock, Trophy, RotateCcw } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Option {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  imageUrl: string
  question: string
  options: Option[]
}

interface Challenge {
  id: string
  name: string
  icon: any
  color: string
  description: string
  questions: Question[]
}

// 使用简单的色块和emoji代替图片，避免需要真实图片
const challenges: Challenge[] = [
  {
    id: 'count',
    name: '数数挑战',
    icon: ImageIcon,
    color: 'from-rose-400 to-pink-500',
    description: '快速数出图片中的元素数量',
    questions: [
      {
        id: 'c1',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZlZjNlNyIvPjx0ZXh0IHg9IjEwIiB5PSI1MCIgZm9udC1zaXplPSI0MCI+8J+UpDwvdGV4dD48dGV4dCB4PSI4MCIgeT0iMTAwIiBmb250LXNpemU9IjQwIj7wn5SkPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iNjAiIGZvbnQtc2l6ZT0iNDAiPvCflKQ8L3RleHQ+PHRleHQgeD0iMjMwIiB5PSIxMzAiIGZvbnQtc2l6ZT0iNDAiPvCflKQ8L3RleHQ+PHRleHQgeD0iOTAiIHk9IjE4MCIgZm9udC1zaXplPSI0MCI+8J+UpDwvdGV4dD48L3N2Zz4=',
        question: '图中一共有几个🌸？',
        options: [
          { id: 'a', text: '3个', isCorrect: false },
          { id: 'b', text: '4个', isCorrect: false },
          { id: 'c', text: '5个', isCorrect: true },
          { id: 'd', text: '6个', isCorrect: false },
        ],
      },
      {
        id: 'c2',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2UwZjJmZSIvPjx0ZXh0IHg9IjMwIiB5PSI0MCIgZm9udC1zaXplPSIzMCI+8J+UpjwvdGV4dD48dGV4dCB4PSIxMDAiIHk9IjgwIiBmb250LXNpemU9IjMwIj7wn5SmPC90ZXh0Pjx0ZXh0IHg9IjIwMCIgeT0iNTAiIGZvbnQtc2l6ZT0iMzAiPvCflKQ8L3RleHQ+PHRleHQgeD0iNTAiIHk9IjEzMCIgZm9udC1zaXplPSIzMCI+8J+UpjwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE1MCIgZm9udC1zaXplPSIzMCI+8J+UpDwvdGV4dD48dGV4dCB4PSIyNTAiIHk9IjEwMCIgZm9udC1zaXplPSIzMCI+8J+UpjwvdGV4dD48L3N2Zz4=',
        question: '图中一共有几个🍎？',
        options: [
          { id: 'a', text: '2个', isCorrect: false },
          { id: 'b', text: '3个', isCorrect: true },
          { id: 'c', text: '4个', isCorrect: false },
          { id: 'd', text: '5个', isCorrect: false },
        ],
      },
      {
        id: 'c3',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RmZTVkNiIvPjx0ZXh0IHg9IjQwIiB5PSI0MCIgZm9udC1zaXplPSIyNSI+8J+YpTwvdGV4dD48dGV4dCB4PSIxMjAiIHk9IjcwIiBmb250LXNpemU9IjI1Ij7wn5ilPC90ZXh0Pjx0ZXh0IHg9IjIwMCIgeT0iNDAiIGZvbnQtc2l6ZT0iMjUiPvCfmKU8L3RleHQ+PHRleHQgeD0iODAiIHk9IjEyMCIgZm9udC1zaXplPSIyNSI+8J+YpTwvdGV4dD48dGV4dCB4PSIxODAiIHk9IjE1MCIgZm9udC1zaXplPSIyNSI+8J+YpTwvdGV4dD48dGV4dCB4PSIyNjAiIHk9IjgwIiBmb250LXNpemU9IjI1Ij7wn5ilPC90ZXh0Pjwvc3ZnPg==',
        question: '图中一共有几个⭐？',
        options: [
          { id: 'a', text: '4个', isCorrect: false },
          { id: 'b', text: '5个', isCorrect: false },
          { id: 'c', text: '6个', isCorrect: true },
          { id: 'd', text: '7个', isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 'color',
    name: '颜色识别',
    icon: Star,
    color: 'from-amber-400 to-orange-500',
    description: '快速识别图片中的主色调',
    questions: [
      {
        id: 'cl1',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2IzZTNmMiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSI1MCIgcj0iMzAiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjE1MCIgcj0iMjUiIGZpbGw9IiNmZmYiLz48L3N2Zz4=',
        question: '图片的主色调是什么？',
        options: [
          { id: 'a', text: '蓝色', isCorrect: true },
          { id: 'b', text: '绿色', isCorrect: false },
          { id: 'c', text: '红色', isCorrect: false },
          { id: 'd', text: '黄色', isCorrect: false },
        ],
      },
      {
        id: 'cl2',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U5YTVmNSIvPjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iMTcwIiB5PSI3MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZmZmIi8+PC9zdmc+',
        question: '图片的主色调是什么？',
        options: [
          { id: 'a', text: '粉色', isCorrect: true },
          { id: 'b', text: '紫色', isCorrect: false },
          { id: 'c', text: '橙色', isCorrect: false },
          { id: 'd', text: '红色', isCorrect: false },
        ],
      },
      {
        id: 'cl3',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzRlZDM4NSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LXNpemU9IjgwIj7wn5SbPC90ZXh0Pjwvc3ZnPg==',
        question: '图片的主色调是什么？',
        options: [
          { id: 'a', text: '蓝色', isCorrect: false },
          { id: 'b', text: '绿色', isCorrect: true },
          { id: 'c', text: '青色', isCorrect: false },
          { id: 'd', text: '黑色', isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 'detail',
    name: '细节观察',
    icon: Eye,
    color: 'from-emerald-400 to-green-500',
    description: '找出图片中的特定元素',
    questions: [
      {
        id: 'd1',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjlmZiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSI0MCI+8J+LqjwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjEwMCIgZm9udC1zaXplPSI0MCI+8J+LqjwvdGV4dD48dGV4dCB4PSIyMzAiIHk9IjQ1IiBmb250LXNpemU9IjQwIj7wn4uyPC90ZXh0Pjwvc3ZnPg==',
        question: '图中除了☁️还有什么？',
        options: [
          { id: 'a', text: '太阳', isCorrect: false },
          { id: 'b', text: '月亮', isCorrect: false },
          { id: 'c', text: '没有其他', isCorrect: true },
          { id: 'd', text: '星星', isCorrect: false },
        ],
      },
      {
        id: 'd2',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RmZjNmZSIvPjx0ZXh0IHg9IjgwIiB5PSI2MCIgZm9udC1zaXplPSIzNSI+8J+RiTwvdGV4dD48dGV4dCB4PSIxODAiIHk9IjE1MCIgZm9udC1zaXplPSIzNSI+8J+RijwvdGV4dD48dGV4dCB4PSIyNDAiIHk9IjgwIiBmb250LXNpemU9IjM1Ij7wn5GJPC90ZXh0Pjx0ZXh0IHg9IjQwIiB5PSIxMzAiIGZvbnQtc2l6ZT0iMzUiPvCfkYY8L3RleHQ+PHRleHQgeD0iMjU1IiB5PSIxNjAiIGZvbnQtc2l6ZT0iMzUiPvCfkYg8L3RleHQ+PC9zdmc+',
        question: '图中哪个🌲数量最多？',
        options: [
          { id: 'a', text: '左侧', isCorrect: true },
          { id: 'b', text: '右侧', isCorrect: false },
          { id: 'c', text: '一样多', isCorrect: false },
          { id: 'd', text: '都不多', isCorrect: false },
        ],
      },
      {
        id: 'd3',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2UwZTdlMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMTAwIiByPSIzMCIgZmlsbD0iI2ZmNjY2NiIvPjxjaXJjbGUgY3g9IjI1MCIgY3k9IjUwIiByPSIyNSIgZmlsbD0iIzY2ZmY2NiIvPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjE1MCIgcj0iMzUiIGZpbGw9IiNmZjY2NjYiLz48L3N2Zz4=',
        question: '图中红色的圆有几个？',
        options: [
          { id: 'a', text: '1个', isCorrect: false },
          { id: 'b', text: '2个', isCorrect: true },
          { id: 'c', text: '3个', isCorrect: false },
          { id: 'd', text: '4个', isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 'position',
    name: '位置记忆',
    icon: Map,
    color: 'from-blue-400 to-indigo-500',
    description: '记住图片中元素的位置',
    questions: [
      {
        id: 'p1',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZhZmFmYSIvPjx0ZXh0IHg9IjMwIiB5PSI0MCIgZm9udC1zaXplPSIyNSI+8J+RiTwvdGV4dD48dGV4dCB4PSIyNTAiIHk9IjQwIiBmb250LXNpemU9IjI1Ij7wn5GKPC90ZXh0Pjx0ZXh0IHg9IjMwIiB5PSIxNjAiIGZvbnQtc2l6ZT0iMjUiPvCfkYg8L3RleHQ+PHRleHQgeD0iMjUwIiB5PSIxNjAiIGZvbnQtc2l6ZT0iMjUiPvCfkYY8L3RleHQ+PC9zdmc+',
        question: '哪个角落没有🌲？',
        options: [
          { id: 'a', text: '左上角', isCorrect: false },
          { id: 'b', text: '右上角', isCorrect: false },
          { id: 'c', text: '左下角', isCorrect: false },
          { id: 'd', text: '每个角落都有', isCorrect: true },
        ],
      },
      {
        id: 'p2',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZmY5OSIvPjx0ZXh0IHg9IjEwMCIgeT0iNTAiIGZvbnQtc2l6ZT0iMzAiPvCflKQ8L3RleHQ+PHRleHQgeD0iMjAwIiB5PSIxMzAiIGZvbnQtc2l6ZT0iMzAiPvCflKQ8L3RleHQ+PHRleHQgeD0iNjAiIHk9IjE0MCIgZm9udC1zaXplPSIzMCI+8J+UpDwvdGV4dD48dGV4dCB4PSIyNDAiIHk9IjYwIiBmb250LXNpemU9IjMwIj7wn5SkPC90ZXh0Pjwvc3ZnPg==',
        question: '🌸分布最多的区域是？',
        options: [
          { id: 'a', text: '上半部分', isCorrect: false },
          { id: 'b', text: '下半部分', isCorrect: true },
          { id: 'c', text: '均匀分布', isCorrect: false },
          { id: 'd', text: '集中中间', isCorrect: false },
        ],
      },
      {
        id: 'p3',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2IyZDJkMiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LXNpemU9IjQwIj7wn5SmPC90ZXh0Pjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNSI+8J+YpTwvdGV4dD48dGV4dCB4PSIyNTAiIHk9IjUwIiBmb250LXNpemU9IjI1Ij7wn5ilPC90ZXh0Pjwvc3ZnPg==',
        question: '🍎分布在图片的什么位置？',
        options: [
          { id: 'a', text: '中心位置', isCorrect: true },
          { id: 'b', text: '上方', isCorrect: false },
          { id: 'c', text: '下方', isCorrect: false },
          { id: 'd', text: '左右两侧', isCorrect: false },
        ],
      },
    ],
  },
]

const ChallengePage: FC = () => {
  const [step, setStep] = useState<'select' | 'play' | 'result'>('select')
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)

  useLoad(() => {
    console.log('Challenge game loaded.')
  })

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 'play' && isTimerActive && timeLeft > 0 && !showResult) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && step === 'play' && !showResult) {
      handleTimeUp()
    }
    return () => clearInterval(interval)
  }, [step, isTimerActive, timeLeft, showResult])

  const handleSelectChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setStep('play')
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setShowResult(false)
    setTimeLeft(30)
    setScore(0)
    setCorrectCount(0)
    setIsTimerActive(true)
  }

  const handleSelectOption = (optionId: string) => {
    if (!selectedChallenge) return

    const question = selectedChallenge.questions[currentQuestionIndex]
    const option = question.options.find(opt => opt.id === optionId)

    if (option) {
      setSelectedOption(optionId)
      setShowResult(true)
      setIsTimerActive(false)

      if (option.isCorrect) {
        setScore((prev) => prev + (timeLeft > 0 ? 100 + timeLeft : 100))
        setCorrectCount((prev) => prev + 1)
      }
    }
  }

  const handleTimeUp = () => {
    setShowResult(true)
    setIsTimerActive(false)
  }

  const handleNextQuestion = () => {
    if (!selectedChallenge) return

    if (currentQuestionIndex < selectedChallenge.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOption(null)
      setShowResult(false)
      setTimeLeft(30)
      setIsTimerActive(true)
    } else {
      setStep('result')
    }
  }

  const handleReset = () => {
    setStep('select')
    setSelectedChallenge(null)
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setShowResult(false)
    setTimeLeft(30)
    setScore(0)
    setCorrectCount(0)
    setIsTimerActive(false)
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

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部 */}
      <View className="bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-2">观察力挑战</Text>
        <Text className="block text-sm text-gray-200">
          快速观察图片，找出答案
        </Text>
      </View>

      {/* 游戏区域 */}
      <View className="p-4">
        {step === 'select' && (
          <>
            <Text className="block text-sm font-medium text-gray-500 mb-3">选择挑战类型</Text>
            {challenges.map((challenge) => {
              const Icon = challenge.icon
              return (
                <Card
                  key={challenge.id}
                  className="mb-3 overflow-hidden"
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

        {step === 'play' && selectedChallenge && (
          <>
            {/* 顶部信息栏 */}
            <View className="bg-white rounded-xl px-4 py-3 mb-4 flex flex-row items-center justify-between">
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

            {/* 图片展示 */}
            <Card className="mb-4 overflow-hidden">
              <View className="relative w-full h-48 bg-gray-100">
                <Image
                  src={selectedChallenge.questions[currentQuestionIndex].imageUrl}
                  className="w-full h-full"
                  mode="aspectFill"
                />
              </View>
            </Card>

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
                          : 'border-gray-200'
                      : selectedOption === option.id
                        ? 'border-indigo-500 bg-indigo-50'
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
                              ? 'bg-indigo-500'
                              : 'bg-gray-300'
                        }`}
                      >
                        {showResult && option.isCorrect && <Check size={14} color="white" />}
                        {showResult && option.id === selectedOption && !option.isCorrect && <X size={14} color="white" />}
                        {!showResult && selectedOption === option.id && <Check size={14} color="white" />}
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
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500"
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
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100 mb-4">
              <CardContent className="py-6">
                <View className="flex flex-col items-center">
                  <View className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                    <Trophy size={40} color="#6366f1" />
                  </View>
                  <Text className="block text-lg font-semibold text-gray-900 mb-2">
                    挑战完成！
                  </Text>
                  <View className="flex flex-row items-center mb-3">
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
            <View className="grid grid-cols-2 gap-3 mb-4">
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">正确题数</Text>
                  <Text className="block text-2xl font-bold text-indigo-600">
                    {correctCount} / {selectedChallenge.questions.length}
                  </Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">观察力评分</Text>
                  <Text className="block text-2xl font-bold text-indigo-600">
                    {getObservationScore()}%
                  </Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">总得分</Text>
                  <Text className="block text-2xl font-bold text-indigo-600">{score}</Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">平均用时</Text>
                  <Text className="block text-2xl font-bold text-indigo-600">
                    {Math.round((30 * selectedChallenge.questions.length - timeLeft) / selectedChallenge.questions.length)}s
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
      <View className="bg-white border-t border-gray-100 px-4 py-3 mt-4">
        <View className="flex flex-row items-center">
          <Eye size={16} color="#6366f1" />
          <Text className="block text-xs text-gray-500 ml-2">
            提示：快速观察图片，找出正确答案
          </Text>
        </View>
      </View>
    </View>
  )
}

export default ChallengePage
