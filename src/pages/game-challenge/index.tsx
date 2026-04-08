import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { TrendingUp, Eye, Smile, Coffee, Users, Clock, Trophy, RotateCcw, CircleAlert, Check, X } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface Question {
  id: string
  text: string
  answer: string
  tips: string[] // 提示信息
}

interface Challenge {
  id: string
  name: string
  icon: any
  color: string
  description: string
  questions: Question[]
}

const challenges: Challenge[] = [
  {
    id: 'appearance',
    name: '外貌细节',
    icon: Eye,
    color: 'from-rose-400 to-pink-500',
    description: '测试你对TA外貌的了解',
    questions: [
      {
        id: 'a1',
        text: 'TA的眼睛颜色是什么？',
        answer: '深棕色',
        tips: ['注意看TA眼睛的颜色', '棕色、黑色还是蓝色？'],
      },
      {
        id: 'a2',
        text: 'TA最喜欢的穿搭风格是？',
        answer: '简约休闲',
        tips: ['观察TA平时的着装', '正式、休闲还是运动？'],
      },
      {
        id: 'a3',
        text: 'TA通常留什么发型？',
        answer: '短发',
        tips: ['注意TA的发型', '长发、短发、卷发？'],
      },
      {
        id: 'a4',
        text: 'TA最常戴什么颜色的衣服？',
        answer: '黑色',
        tips: ['回忆TA平时的衣服颜色', '黑色、白色、蓝色？'],
      },
      {
        id: 'a5',
        text: 'TA有戴眼镜或隐形眼镜吗？',
        answer: '戴眼镜',
        tips: ['仔细看TA的眼睛', '有眼镜或隐形眼镜吗？'],
      },
    ],
  },
  {
    id: 'habit',
    name: '习惯动作',
    icon: Smile,
    color: 'from-amber-400 to-orange-500',
    description: '观察TA的生活习惯',
    questions: [
      {
        id: 'h1',
        text: 'TA说话时有什么习惯动作？',
        answer: '手舞足蹈',
        tips: ['注意TA说话时的动作', '手势、表情？'],
      },
      {
        id: 'h2',
        text: 'TA紧张时会做什么？',
        answer: '摸头发',
        tips: ['观察TA紧张时的表现', '摸头发、抖腿、深呼吸？'],
      },
      {
        id: 'h3',
        text: 'TA吃饭时有什么习惯？',
        answer: '细嚼慢咽',
        tips: ['注意TA吃饭的方式', '快还是慢？'],
      },
      {
        id: 'h4',
        text: 'TA走路时有什么特点？',
        answer: '步幅较大',
        tips: ['观察TA走路的姿态', '快还是慢？步幅大小？'],
      },
      {
        id: 'h5',
        text: 'TA思考时会做什么？',
        answer: '皱眉头',
        tips: ['注意TA思考时的表情', '皱眉头、托下巴？'],
      },
    ],
  },
  {
    id: 'preference',
    name: '喜好偏好',
    icon: Coffee,
    color: 'from-emerald-400 to-green-500',
    description: '了解TA的喜好细节',
    questions: [
      {
        id: 'p1',
        text: 'TA最常喝什么饮料？',
        answer: '奶茶',
        tips: ['回忆TA常点的饮品', '奶茶、咖啡、果汁？'],
      },
      {
        id: 'p2',
        text: 'TA最不喜欢吃的食物是？',
        answer: '香菜',
        tips: ['注意TA避开的菜', '香菜、辣椒、苦瓜？'],
      },
      {
        id: 'p3',
        text: 'TA最喜欢的品牌是？',
        answer: '无品牌偏好',
        tips: ['观察TA常用的物品', '有特定品牌偏好吗？'],
      },
      {
        id: 'p4',
        text: 'TA最喜欢的天气是？',
        answer: '晴天',
        tips: ['注意TA对天气的反应', '晴天、阴天、雨天？'],
      },
      {
        id: 'p5',
        text: 'TA最喜欢的数字是？',
        answer: '7',
        tips: ['注意TA常用的数字', '电话号码、密码习惯？'],
      },
    ],
  },
  {
    id: 'social',
    name: '社交行为',
    icon: Users,
    color: 'from-blue-400 to-indigo-500',
    description: '观察TA的社交特点',
    questions: [
      {
        id: 's1',
        text: 'TA在聚会上通常的表现是？',
        answer: '话不多但很照顾大家',
        tips: ['注意TA在社交场合的状态', '活跃、安静、观察者？'],
      },
      {
        id: 's2',
        text: 'TA和朋友相处的方式是？',
        answer: '互损型',
        tips: ['观察TA和朋友聊天', '照顾型、互损型、倾听型？'],
      },
      {
        id: 's3',
        text: 'TA初次见面时的表现是？',
        answer: '害羞但礼貌',
        tips: ['回忆第一次见面的印象', '主动、害羞、高冷？'],
      },
      {
        id: 's4',
        text: 'TA和陌生人聊天时？',
        answer: '先观察再开口',
        tips: ['注意TA和陌生人的互动', '主动、被动、回避？'],
      },
      {
        id: 's5',
        text: 'TA在团队中的角色通常是？',
        answer: '协调者',
        tips: ['观察TA在团队中的作用', '领导者、跟随者、协调者？'],
      },
    ],
  },
]

const ChallengePage: FC = () => {
  const [step, setStep] = useState<'select' | 'play' | 'result'>('select')
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [hintIndex, setHintIndex] = useState(-1)
  const [timeLeft, setTimeLeft] = useState(60)
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
    setUserAnswer('')
    setShowResult(false)
    setHintIndex(-1)
    setTimeLeft(60)
    setScore(0)
    setCorrectCount(0)
    setIsTimerActive(true)
  }

  const handleShowHint = () => {
    if (!selectedChallenge) return
    const question = selectedChallenge.questions[currentQuestionIndex]
    if (hintIndex < question.tips.length - 1) {
      setHintIndex(hintIndex + 1)
    }
  }

  const handleSubmitAnswer = () => {
    if (!selectedChallenge || !userAnswer.trim()) return

    const question = selectedChallenge.questions[currentQuestionIndex]
    const correct = userAnswer.trim().toLowerCase() === question.answer.toLowerCase()

    setIsCorrect(correct)
    setShowResult(true)
    setIsTimerActive(false)

    if (correct) {
      setScore((prev) => prev + (timeLeft > 0 ? 100 + timeLeft : 100))
      setCorrectCount((prev) => prev + 1)
    }
  }

  const handleTimeUp = () => {
    setIsCorrect(false)
    setShowResult(true)
    setIsTimerActive(false)
  }

  const handleNextQuestion = () => {
    if (!selectedChallenge) return

    if (currentQuestionIndex < selectedChallenge.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setUserAnswer('')
      setShowResult(false)
      setIsCorrect(false)
      setHintIndex(-1)
      setTimeLeft(60)
      setIsTimerActive(true)
    } else {
      // 完成所有题目
      setStep('result')
    }
  }

  const handleReset = () => {
    setStep('select')
    setSelectedChallenge(null)
    setCurrentQuestionIndex(0)
    setUserAnswer('')
    setShowResult(false)
    setIsCorrect(false)
    setHintIndex(-1)
    setTimeLeft(60)
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
          测试你对TA的关注程度
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
                        <TrendingUp size={16} color="white" />
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
                <Clock size={16} color={timeLeft <= 15 ? '#ef4444' : '#6b7280'} />
                <Text className={`text-sm font-medium ml-2 ${timeLeft <= 15 ? 'text-red-500' : 'text-gray-700'}`}>
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

            {/* 问题卡片 */}
            <Card className="mb-4">
              <CardContent className="py-5">
                <View className="flex flex-row items-start">
                  <View className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <Text className="text-sm font-bold text-indigo-600">
                      {currentQuestionIndex + 1}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900 leading-relaxed">
                      {selectedChallenge.questions[currentQuestionIndex].text}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 答案输入区 */}
            <View className="bg-white rounded-xl px-4 py-3 mb-3">
              <Text className="text-xs text-gray-500 mb-2">你的答案</Text>
              <View className="bg-gray-50 rounded-lg px-3 py-2">
                <Input
                  className="bg-transparent w-full"
                  placeholder="请输入答案..."
                  value={userAnswer}
                  onInput={(e) => setUserAnswer(e.detail.value)}
                />
              </View>
              <View className="flex flex-row gap-2 mt-2">
                {selectedChallenge.questions[currentQuestionIndex].tips.map((_tip, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className={`flex-1 ${index <= hintIndex ? 'bg-indigo-50 border-indigo-300' : ''}`}
                    onClick={handleShowHint}
                  >
                    <Text className="text-xs">提示 {index + 1}</Text>
                  </Button>
                ))}
              </View>
              {hintIndex >= 0 && (
                <View className="bg-amber-50 rounded-lg px-3 py-2 mt-3">
                  <View className="flex flex-row items-start">
                    <CircleAlert size={14} color="#f59e0b" className="mr-2 mt-1 flex-shrink-0" />
                    <Text className="text-xs text-amber-700">
                      {selectedChallenge.questions[currentQuestionIndex].tips[hintIndex]}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* 快捷答案选项（方便快速选择） */}
            <View className="mb-4">
              <Text className="text-xs text-gray-500 mb-2">快速选择</Text>
              <View className="grid grid-cols-2 gap-2">
                {[
                  selectedChallenge.questions[currentQuestionIndex].answer,
                  ...selectedChallenge.questions[currentQuestionIndex].tips,
                ]
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .slice(0, 4)
                  .map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className={`${
                        userAnswer === option ? 'bg-indigo-50 border-indigo-500' : ''
                      }`}
                      onClick={() => setUserAnswer(option)}
                    >
                      <Text className="text-xs">{option}</Text>
                    </Button>
                  ))}
              </View>
            </View>

            {/* 提交按钮 */}
            <Button
              className={`w-full py-3 rounded-xl ${
                userAnswer.trim()
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-500'
                  : 'bg-gray-300'
              }`}
              disabled={!userAnswer.trim()}
              onClick={handleSubmitAnswer}
            >
              <Text className="text-white font-medium">提交答案</Text>
            </Button>

            {/* 结果显示 */}
            {showResult && (
              <Card
                className={`mt-4 ${
                  isCorrect ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'
                }`}
              >
                <CardContent className="py-4">
                  <View className="flex flex-col items-center">
                    <View
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        isCorrect ? 'bg-green-500' : 'bg-rose-500'
                      }`}
                    >
                      {isCorrect ? <Check size={24} color="white" /> : <X size={24} color="white" />}
                    </View>
                    <Text
                      className={`block text-base font-semibold mb-1 ${
                        isCorrect ? 'text-green-600' : 'text-rose-600'
                      }`}
                    >
                      {isCorrect ? '回答正确！' : '回答错误'}
                    </Text>
                    {!isCorrect && (
                      <View className="mt-2">
                        <Text className="text-xs text-gray-500 mb-1">正确答案</Text>
                        <Text className="text-sm font-medium text-gray-900">
                          {selectedChallenge.questions[currentQuestionIndex].answer}
                        </Text>
                      </View>
                    )}
                  </View>
                </CardContent>
              </Card>
            )}

            {/* 下一题按钮 */}
            {showResult && (
              <Button
                className="w-full mt-4 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500"
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
                    {Math.round((60 * selectedChallenge.questions.length - timeLeft) / selectedChallenge.questions.length)}s
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
                          ? '你的观察力不错，可以多关注对方细节。'
                          : getObservationScore() >= 40
                            ? '观察力有待提升，多花时间观察对方。'
                            : '需要更多地关注对方，细节很重要。'}
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
          <TrendingUp size={16} color="#6366f1" />
          <Text className="block text-xs text-gray-500 ml-2">
            提示：可以使用提示功能，但会减少得分
          </Text>
        </View>
      </View>
    </View>
  )
}

export default ChallengePage
