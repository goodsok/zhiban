import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Zap, Clock, Heart, Star, Coffee, Target, RotateCcw, Check } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Question {
  id: string
  text: string
  options: string[]
  answers: number[] // 正确答案的索引，可以多个
}

interface Category {
  id: string
  name: string
  icon: any
  color: string
  description: string
  questions: Question[]
}

const categories: Category[] = [
  {
    id: 'interest',
    name: '兴趣爱好',
    icon: Heart,
    color: 'from-pink-400 to-rose-500',
    description: '了解对方的兴趣和爱好',
    questions: [
      {
        id: 'i1',
        text: '对方最喜欢的电影类型是？',
        options: ['动作片', '爱情片', '喜剧片', '科幻片', '恐怖片'],
        answers: [1, 3],
      },
      {
        id: 'i2',
        text: '对方最喜欢的音乐风格是？',
        options: ['流行', '摇滚', '古典', '爵士', '民谣'],
        answers: [0, 4],
      },
      {
        id: 'i3',
        text: '对方周末最喜欢的活动是？',
        options: ['宅在家', '户外运动', '逛街购物', '看电影', '朋友聚会'],
        answers: [1, 4],
      },
      {
        id: 'i4',
        text: '对方最喜欢的运动是？',
        options: ['跑步', '游泳', '篮球', '瑜伽', '不喜欢运动'],
        answers: [0, 3],
      },
      {
        id: 'i5',
        text: '对方最喜欢的旅行方式是？',
        options: ['自驾游', '跟团游', '自由行', '海岛度假', '探险旅行'],
        answers: [2, 3],
      },
    ],
  },
  {
    id: 'life',
    name: '生活态度',
    icon: Coffee,
    color: 'from-amber-400 to-orange-500',
    description: '了解对方的生活习惯',
    questions: [
      {
        id: 'l1',
        text: '对方通常几点起床？',
        options: ['6点前', '6-7点', '7-8点', '8-9点', '9点后'],
        answers: [2, 3],
      },
      {
        id: 'l2',
        text: '对方最喜欢的早餐是？',
        options: ['中式', '西式', '随便', '不吃', '奶茶咖啡'],
        answers: [0, 4],
      },
      {
        id: 'l3',
        text: '对方最喜欢的季节是？',
        options: ['春天', '夏天', '秋天', '冬天', '都喜欢'],
        answers: [1, 2],
      },
      {
        id: 'l4',
        text: '对方最喜欢的颜色是？',
        options: ['红色', '蓝色', '绿色', '紫色', '其他'],
        answers: [1, 3],
      },
      {
        id: 'l5',
        text: '对方最喜欢的动物是？',
        options: ['猫', '狗', '兔子', '其他', '不喜欢动物'],
        answers: [0, 1],
      },
    ],
  },
  {
    id: 'emotion',
    name: '情感观念',
    icon: Star,
    color: 'from-purple-400 to-violet-500',
    description: '了解对方的爱情观',
    questions: [
      {
        id: 'e1',
        text: '对方理想约会方式是？',
        options: ['浪漫餐厅', '户外郊游', '看电影', '逛街', '在家做饭'],
        answers: [0, 4],
      },
      {
        id: 'e2',
        text: '对方最看重伴侣的什么品质？',
        options: ['外貌', '性格', '经济', '才华', '都重要'],
        answers: [1, 4],
      },
      {
        id: 'e3',
        text: '对方认为爱情最重要的是？',
        options: ['激情', '陪伴', '信任', '共同成长', '都是'],
        answers: [2, 3, 4],
      },
      {
        id: 'e4',
        text: '对方表达爱意的方式通常是？',
        options: ['说甜言蜜语', '行动表现', '送礼物', '身体接触', '都是'],
        answers: [1, 4],
      },
      {
        id: 'e5',
        text: '对方最不能接受伴侣的行为是？',
        options: ['撒谎', '不专一', '不尊重', '不沟通', '都不接受'],
        answers: [0, 1],
      },
    ],
  },
  {
    id: 'values',
    name: '价值观',
    icon: Target,
    color: 'from-cyan-400 to-blue-500',
    description: '了解对方的价值取向',
    questions: [
      {
        id: 'v1',
        text: '对方最看重的生活目标是什么？',
        options: ['事业成功', '家庭幸福', '自由自在', '财富自由', '自我实现'],
        answers: [1, 4],
      },
      {
        id: 'v2',
        text: '对方认为成功最重要的是？',
        options: ['钱', '地位', '影响力', '幸福感', '自我价值'],
        answers: [3, 4],
      },
      {
        id: 'v3',
        text: '对方最想改善的生活方面是？',
        options: ['经济', '健康', '感情', '工作', '心态'],
        answers: [1, 4],
      },
      {
        id: 'v4',
        text: '对方对消费的态度是？',
        options: ['节俭', '合理', '随性', '享受', '看情况'],
        answers: [1, 4],
      },
      {
        id: 'v5',
        text: '对方最想从伴侣那里得到什么？',
        options: ['物质支持', '情感支持', '共同成长', '安全感', '都重要'],
        answers: [1, 2, 4],
      },
    ],
  },
]

const QuickPage: FC = () => {
  const [step, setStep] = useState<'select' | 'play' | 'result'>('select')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)

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

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category)
    setStep('play')
    setCurrentQuestionIndex(0)
    setSelectedOptions(new Set())
    setTimeLeft(30)
    setScore(0)
    setTotalCorrect(0)
    setIsTimerActive(true)
  }

  const handleToggleOption = (index: number) => {
    if (!selectedCategory) return

    const currentQuestion = selectedCategory.questions[currentQuestionIndex]

    // 如果是多选题，允许选择多个；单选题只能选一个
    if (currentQuestion.answers.length > 1) {
      const newSelected = new Set(selectedOptions)
      if (newSelected.has(index)) {
        newSelected.delete(index)
      } else {
        newSelected.add(index)
      }
      setSelectedOptions(newSelected)
    } else {
      // 单选题，直接选择
      setSelectedOptions(new Set([index]))
    }
  }

  const handleSubmitAnswer = () => {
    if (!selectedCategory || selectedOptions.size === 0) return

    const currentQuestion = selectedCategory.questions[currentQuestionIndex]
    const correctAnswers = new Set(currentQuestion.answers)

    // 计算得分：完全正确100分，部分正确按比例
    let isCorrect = true
    for (const answer of correctAnswers) {
      if (!selectedOptions.has(answer)) {
        isCorrect = false
        break
      }
    }
    // 还要确保没有选择错误的答案
    for (const selected of selectedOptions) {
      if (!correctAnswers.has(selected)) {
        isCorrect = false
        break
      }
    }

    if (isCorrect) {
      setScore((prev) => prev + (timeLeft > 0 ? 100 + timeLeft : 100))
      setTotalCorrect((prev) => prev + 1)
    }

    // 下一题
    if (currentQuestionIndex < selectedCategory.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOptions(new Set())
      setTimeLeft(30)
    } else {
      // 完成所有题目
      setStep('result')
      setIsTimerActive(false)
    }
  }

  const handleTimeUp = () => {
    // 超时直接进入下一题或结果页
    if (selectedCategory && currentQuestionIndex < selectedCategory.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOptions(new Set())
      setTimeLeft(30)
    } else {
      setStep('result')
      setIsTimerActive(false)
    }
  }

  const handleReset = () => {
    setStep('select')
    setSelectedCategory(null)
    setCurrentQuestionIndex(0)
    setSelectedOptions(new Set())
    setTimeLeft(30)
    setScore(0)
    setTotalCorrect(0)
    setIsTimerActive(false)
  }

  const getMatchRate = () => {
    if (!selectedCategory) return 0
    return Math.round((totalCorrect / selectedCategory.questions.length) * 100)
  }

  const getMatchText = (rate: number) => {
    if (rate >= 80) return { text: '非常了解对方', color: 'text-green-600', icon: '❤️' }
    if (rate >= 60) return { text: '比较了解对方', color: 'text-blue-600', icon: '💙' }
    if (rate >= 40) return { text: '还需更多了解', color: 'text-amber-600', icon: '💛' }
    return { text: '继续加深了解', color: 'text-rose-600', icon: '💜' }
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部 */}
      <View className="bg-gradient-to-r from-purple-500 to-violet-500 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-2">快速问答</Text>
        <Text className="block text-sm text-gray-200">
          限时30秒，快速了解对方
        </Text>
      </View>

      {/* 游戏区域 */}
      <View className="p-4">
        {step === 'select' && (
          <>
            <Text className="block text-sm font-medium text-gray-500 mb-3">选择问题类别</Text>
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Card
                  key={category.id}
                  className="mb-3 overflow-hidden"
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
                      <View className="flex flex-row items-center">
                        <Text className="text-xs text-gray-200 mr-2">
                          {category.questions.length} 题
                        </Text>
                        <Zap size={16} color="white" />
                      </View>
                    </View>
                  </View>
                </Card>
              )
            })}
          </>
        )}

        {step === 'play' && selectedCategory && (
          <>
            {/* 顶部信息栏 */}
            <View className="bg-white rounded-xl px-4 py-3 mb-4 flex flex-row items-center justify-between">
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
                <Clock size={16} color={timeLeft <= 10 ? '#ef4444' : '#6b7280'} />
                <Text className={`text-sm font-medium ml-2 ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-700'}`}>
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
            <Card className="mb-4">
              <CardContent className="py-5">
                <View className="flex flex-row items-start">
                  <View className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <Text className="text-sm font-bold text-purple-600">
                      {currentQuestionIndex + 1}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-500 mb-2">
                      {selectedCategory.questions[currentQuestionIndex].answers.length > 1
                        ? '（多选题，选择所有正确答案）'
                        : '（单选题）'}
                    </Text>
                    <Text className="text-base font-medium text-gray-900 leading-relaxed">
                      {selectedCategory.questions[currentQuestionIndex].text}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 选项 */}
            <View className="space-y-3 mb-4">
              {selectedCategory.questions[currentQuestionIndex].options.map((option, index) => (
                <Card
                  key={index}
                  className={`border-2 cursor-pointer ${
                    selectedOptions.has(index)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 active:bg-gray-50'
                  }`}
                  onClick={() => handleToggleOption(index)}
                >
                  <CardContent className="py-4">
                    <View className="flex flex-row items-center">
                      <View
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center mr-3 ${
                          selectedOptions.has(index)
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedOptions.has(index) && <Check size={14} color="white" />}
                      </View>
                      <Text
                        className={`text-sm flex-1 ${
                          selectedOptions.has(index) ? 'text-purple-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {option}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>

            {/* 提交按钮 */}
            <Button
              className={`w-full py-3 rounded-xl ${
                selectedOptions.size > 0
                  ? 'bg-gradient-to-r from-purple-500 to-violet-500'
                  : 'bg-gray-300'
              }`}
              disabled={selectedOptions.size === 0}
              onClick={handleSubmitAnswer}
            >
              <Text className="text-white font-medium">
                {currentQuestionIndex === selectedCategory.questions.length - 1 ? '提交答案' : '下一题'}
              </Text>
            </Button>
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
                  <View className="flex flex-row items-center mb-3">
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
            <View className="grid grid-cols-2 gap-3 mb-4">
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">正确题数</Text>
                  <Text className="block text-2xl font-bold text-purple-600">
                    {totalCorrect} / {selectedCategory.questions.length}
                  </Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">匹配度</Text>
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
                  <Text className="block text-xs text-gray-500 mb-1">平均用时</Text>
                  <Text className="block text-2xl font-bold text-purple-600">
                    {Math.round((30 * selectedCategory.questions.length - timeLeft) / selectedCategory.questions.length)}s
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
                    <Text className="text-xs text-gray-500 mb-1">建议</Text>
                    <Text className="text-sm text-gray-700 leading-relaxed">
                      {getMatchRate() >= 80
                        ? '你们对彼此非常了解！继续保持这种默契。'
                        : getMatchRate() >= 60
                          ? '你们对彼此有一定了解，可以继续加深。'
                          : getMatchRate() >= 40
                            ? '还有很大的了解空间，多沟通交流。'
                            : '需要更多地了解对方，多聊天多互动。'}
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
      <View className="bg-white border-t border-gray-100 px-4 py-3 mt-4">
        <View className="flex flex-row items-center">
          <Zap size={16} color="#a855f7" />
          <Text className="block text-xs text-gray-500 ml-2">
            提示：快速回答可以获得额外时间加分
          </Text>
        </View>
      </View>
    </View>
  )
}

export default QuickPage
