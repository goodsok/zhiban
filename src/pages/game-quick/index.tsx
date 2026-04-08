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
  difficulty: string
  questions: Question[]
}

const categories: Category[] = [
  {
    id: 'emotion',
    name: '情感观念',
    icon: Heart,
    color: 'from-pink-400 to-rose-500',
    description: '深入了解TA的爱情观',
    difficulty: '⭐⭐⭐⭐',
    questions: [
      {
        id: 'e1',
        text: 'TA和前任分手的主要原因是什么？',
        options: ['性格不合', '出轨', '现实问题', '感情淡了', '其他'],
        answers: [0, 3, 4],
      },
      {
        id: 'e2',
        text: 'TA认为在一段关系中，最重要的是什么？',
        options: ['激情', '信任', '金钱', '外貌', '共同价值观'],
        answers: [1, 4],
      },
      {
        id: 'e3',
        text: 'TA最不能接受伴侣的行为是？',
        options: ['出轨', '撒谎', '控制欲强', '冷暴力', '都不接受'],
        answers: [0, 1, 3],
      },
      {
        id: 'e4',
        text: 'TA认为多久可以同居？',
        options: ['认识1个月内', '3-6个月', '6个月-1年', '结婚后', '不确定'],
        answers: [1, 2],
      },
      {
        id: 'e5',
        text: 'TA对婚前性行为的态度是？',
        options: ['绝对不行', '可以考虑', '正常情况', '看感情发展', '无所谓'],
        answers: [2, 3],
      },
      {
        id: 'e6',
        text: 'TA认为多久可以见父母？',
        options: ['稳定后', '准备结婚', '半年左右', '看情况', '没必要'],
        answers: [1, 2],
      },
      {
        id: 'e7',
        text: 'TA最讨厌什么样的恋人？',
        options: ['粘人型', '冷淡型', '控制欲强', '情绪化', '都讨厌'],
        answers: [2, 3, 4],
      },
      {
        id: 'e8',
        text: 'TA理想中结婚的年龄是？',
        options: ['25岁以下', '25-28岁', '28-30岁', '30-35岁', '不着急'],
        answers: [2, 3, 4],
      },
      {
        id: 'e9',
        text: 'TA最看重伴侣的哪个品质？',
        options: ['颜值', '经济', '人品', '家庭背景', '都看重'],
        answers: [2, 4],
      },
      {
        id: 'e10',
        text: 'TA认为爱情应该保持多久的新鲜感？',
        options: ['3个月', '半年', '1年', '永远', '看经营'],
        answers: [3, 4],
      },
      {
        id: 'e11',
        text: 'TA最容易被什么样的异性吸引？',
        options: ['好看的', '有才华的', '有钱的', '幽默的', '自信的'],
        answers: [1, 4],
      },
      {
        id: 'e12',
        text: 'TA认为吵架后应该怎么做？',
        options: ['立即道歉', '冷静后再沟通', '等对方道歉', '冷战到和解', '看谁先低头'],
        answers: [1],
      },
      {
        id: 'e13',
        text: 'TA最难忘的一段感情维持了多久？',
        options: ['不到3个月', '3-6个月', '6个月-1年', '1-2年', '2年以上'],
        answers: [2, 3, 4],
      },
      {
        id: 'e14',
        text: 'TA认为恋人之间应该保留多少个人空间？',
        options: ['完全透明', '大部分透明', '适当保留', '保持独立', '看情况'],
        answers: [2, 3],
      },
      {
        id: 'e15',
        text: 'TA最在意对方过去的什么经历？',
        options: ['前任数量', '同居史', '出轨史', '债务', '都不在意'],
        answers: [2, 4],
      },
    ],
  },
  {
    id: 'values',
    name: '价值观',
    icon: Target,
    color: 'from-indigo-400 to-blue-500',
    description: '了解TA的人生观',
    difficulty: '⭐⭐⭐⭐⭐',
    questions: [
      {
        id: 'v1',
        text: 'TA认为人生最重要的是什么？',
        options: ['事业成功', '家庭幸福', '财富自由', '自我实现', '健康'],
        answers: [1, 3, 4],
      },
      {
        id: 'v2',
        text: 'TA最想从伴侣那里得到什么？',
        options: ['物质支持', '情感支持', '社会地位', '安全感', '都想要'],
        answers: [1, 4],
      },
      {
        id: 'v3',
        text: 'TA认为成功的定义是什么？',
        options: ['有钱', '有权', '有影响力', '内心满足', '家庭幸福'],
        answers: [3, 4],
      },
      {
        id: 'v4',
        text: 'TA愿意为感情放弃事业吗？',
        options: ['愿意', '不愿意', '看情况', '不会放弃但会平衡', '不确定'],
        answers: [1, 3],
      },
      {
        id: 'v5',
        text: 'TA对父母催婚的态度是？',
        options: ['听从', '反抗', '敷衍', '有选择地听', '不催最好'],
        answers: [2, 4],
      },
      {
        id: 'v6',
        text: 'TA认为子女教育中，最重要的是什么？',
        options: ['成绩', '品德', '才艺', '独立思考', '全面培养'],
        answers: [1, 3, 4],
      },
      {
        id: 'v7',
        text: 'TA最看重朋友的什么品质？',
        options: ['忠诚', '有用', '有趣', '有共同话题', '真诚'],
        answers: [0, 4],
      },
      {
        id: 'v8',
        text: 'TA认为婚前应该了解对方什么？',
        options: ['经济状况', '家庭背景', '性格', '过往感情', '都要了解'],
        answers: [2, 4],
      },
      {
        id: 'v9',
        text: 'TA对金钱的态度是？',
        options: ['花钱要花在刀刃上', '人生苦短，及时行乐', '能省则省', '该花就花，该省就省', '享受生活最重要'],
        answers: [0, 3],
      },
      {
        id: 'v10',
        text: 'TA认为什么是最不可原谅的？',
        options: ['背叛', '欺骗', '伤害家人', '背叛朋友', '都不可原谅'],
        answers: [0, 1, 4],
      },
      {
        id: 'v11',
        text: 'TA对生活的态度是？',
        options: ['积极进取', '随遇而安', '及时行乐', '得过且过', '看心情'],
        answers: [0, 1],
      },
      {
        id: 'v12',
        text: 'TA认为什么样的生活才是好生活？',
        options: ['有钱有势', '自由自在', '家庭美满', '事业有成', '内心满足'],
        answers: [1, 2, 4],
      },
      {
        id: 'v13',
        text: 'TA对婚姻的态度是？',
        options: ['必须结婚', '看缘分', '不想结婚', '单身也挺好', '不一定'],
        answers: [1, 4],
      },
      {
        id: 'v14',
        text: 'TA最讨厌什么样的人？',
        options: ['虚伪', '自私', '八卦', '势利', '都讨厌'],
        answers: [0, 1, 4],
      },
      {
        id: 'v15',
        text: 'TA认为友谊和爱情哪个更重要？',
        options: ['友谊', '爱情', '都重要', '看情况', '无法比较'],
        answers: [2, 4],
      },
    ],
  },
  {
    id: 'personality',
    name: '性格特点',
    icon: Star,
    color: 'from-purple-400 to-violet-500',
    description: '深入了解TA的性格',
    difficulty: '⭐⭐⭐⭐',
    questions: [
      {
        id: 'p1',
        text: 'TA最怕别人知道的缺点是？',
        options: ['控制欲强', '容易嫉妒', '脾气暴躁', '不自信', '其他'],
        answers: [1, 3],
      },
      {
        id: 'p2',
        text: 'TA在压力下会怎么做？',
        options: ['发泄', '沉默', '找人倾诉', '逃避', '积极解决'],
        answers: [1, 4],
      },
      {
        id: 'p3',
        text: 'TA最容易被什么激怒？',
        options: ['被误解', '被忽视', '被背叛', '被控制', '都容易'],
        answers: [0, 2],
      },
      {
        id: 'p4',
        text: 'TA表达情绪的方式通常是？',
        options: ['直接说出', '行动表达', '沉默', '找人倾诉', '藏在心里'],
        answers: [0, 4],
      },
      {
        id: 'p5',
        text: 'TA最讨厌什么样的社交场合？',
        options: ['陌生聚会', '商务应酬', '婚礼', '同学聚会', '都喜欢'],
        answers: [0, 1],
      },
      {
        id: 'p6',
        text: 'TA在陌生人面前通常是什么状态？',
        options: ['主动', '安静', '观察', '礼貌', '紧张'],
        answers: [1, 2, 3],
      },
      {
        id: 'p7',
        text: 'TA最容易被什么样的人吸引？',
        options: ['和自己像的', '和自己相反的', '有趣的', '温柔的', '优秀的'],
        answers: [1, 2, 4],
      },
      {
        id: 'p8',
        text: 'TA做决定时主要靠什么？',
        options: ['理性分析', '直觉', '他人建议', '情感', '看情况'],
        answers: [0, 4],
      },
      {
        id: 'p9',
        text: 'TA最无法忍受的环境是？',
        options: ['嘈杂', '安静', '拥挤', '孤独', '都不介意'],
        answers: [0, 2],
      },
      {
        id: 'p10',
        text: 'TA最容易被什么样的情绪影响？',
        options: ['焦虑', '抑郁', '愤怒', '感动', '都容易'],
        answers: [3, 4],
      },
      {
        id: 'p11',
        text: 'TA认为自己的优点是什么？',
        options: ['善良', '聪明', '幽默', '有责任心', '都有'],
        answers: [0, 3, 4],
      },
      {
        id: 'p12',
        text: 'TA最在意别人怎么看自己？',
        options: ['不在意', '在意某些人', '很在意', '假装不在意', '看情况'],
        answers: [1, 4],
      },
    ],
  },
  {
    id: 'private',
    name: '私密话题',
    icon: Coffee,
    color: 'from-amber-400 to-orange-500',
    description: '那些不敢问但想知道的',
    difficulty: '⭐⭐⭐⭐⭐',
    questions: [
      {
        id: 'pr1',
        text: 'TA有过一夜情的经历吗？',
        options: ['有', '没有', '不想说', '不算一夜情', '不确定'],
        answers: [1, 3],
      },
      {
        id: 'pr2',
        text: 'TA能接受伴侣有过多次性经历吗？',
        options: ['完全不能', '能接受', '次数不能太多', '只要过去就没事', '看情况'],
        answers: [1, 2],
      },
      {
        id: 'pr3',
        text: 'TA认为性生活对感情多重要？',
        options: ['非常重要', '重要', '一般', '不重要', '因人而异'],
        answers: [0, 1],
      },
      {
        id: 'pr4',
        text: 'TA会主动告诉伴侣自己的性经历吗？',
        options: ['会', '不会', '问就说', '不想问就不说', '看情况'],
        answers: [1, 2, 3],
      },
      {
        id: 'pr5',
        text: 'TA能接受伴侣和前任做朋友吗？',
        options: ['完全不能', '能接受', '保持距离可以', '不主动联系', '看情况'],
        answers: [1, 2],
      },
      {
        id: 'pr6',
        text: 'TA认为伴侣应该看对方的手机吗？',
        options: ['应该', '不应该', '互相看', '可以偶尔看', '看信任程度'],
        answers: [1, 2],
      },
      {
        id: 'pr7',
        text: 'TA能接受伴侣有异性闺蜜吗？',
        options: ['不能', '能接受', '要有界限', '不能太亲密', '看人品'],
        answers: [2, 3, 4],
      },
      {
        id: 'pr8',
        text: 'TA最想改变自己身体的哪方面？',
        options: ['体重', '身高', '五官', '身材', '都满意'],
        answers: [0, 3],
      },
      {
        id: 'pr9',
        text: 'TA最怕伴侣发现自己的什么？',
        options: ['过往', '缺点', '秘密', '债务', '没什么怕的'],
        answers: [0, 1, 3],
      },
      {
        id: 'pr10',
        text: 'TA认为什么才是真正的成熟？',
        options: ['年龄', '经历', '独立', '承担责任', '内心强大'],
        answers: [3, 4],
      },
    ],
  },
]

const QuickPage: FC = () => {
  const [step, setStep] = useState<'select' | 'play' | 'result'>('select')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(3)
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
    setTimeLeft(3)
    setScore(0)
    setTotalCorrect(0)
    setIsTimerActive(true)
  }

  const handleToggleOption = (index: number) => {
    if (!selectedCategory) return

    const currentQuestion = selectedCategory.questions[currentQuestionIndex]

    if (currentQuestion.answers.length > 1) {
      const newSelected = new Set(selectedOptions)
      if (newSelected.has(index)) {
        newSelected.delete(index)
      } else {
        newSelected.add(index)
      }
      setSelectedOptions(newSelected)
    } else {
      setSelectedOptions(new Set([index]))
    }
  }

  const handleSubmitAnswer = () => {
    if (!selectedCategory || selectedOptions.size === 0) return

    const currentQuestion = selectedCategory.questions[currentQuestionIndex]
    const correctAnswers = new Set(currentQuestion.answers)

    let isCorrect = true
    for (const answer of correctAnswers) {
      if (!selectedOptions.has(answer)) {
        isCorrect = false
        break
      }
    }
    for (const selected of selectedOptions) {
      if (!correctAnswers.has(selected)) {
        isCorrect = false
        break
      }
    }

    if (isCorrect) {
      setScore((prev) => prev + (timeLeft > 0 ? 100 + timeLeft * 10 : 100))
      setTotalCorrect((prev) => prev + 1)
    }

    if (currentQuestionIndex < selectedCategory.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOptions(new Set())
      setTimeLeft(3)
      setIsTimerActive(true)
    } else {
      setStep('result')
      setIsTimerActive(false)
    }
  }

  const handleTimeUp = () => {
    if (selectedCategory && currentQuestionIndex < selectedCategory.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOptions(new Set())
      setTimeLeft(3)
      setIsTimerActive(true)
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
    setTimeLeft(3)
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
          3秒倒计时，真正了解TA
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
                    ⚠️ 本游戏包含深入、私密的问题，请确保双方都准备好后再开始。建议轮流提问和回答。
                  </Text>
                </View>
              </CardContent>
            </Card>
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
                <Clock size={16} color={timeLeft === 3 ? '#6b7280' : timeLeft === 2 ? '#f59e0b' : '#ef4444'} />
                <Text className={`text-sm font-bold ml-2 ${timeLeft === 3 ? 'text-gray-700' : timeLeft === 2 ? 'text-amber-500' : 'text-red-500'}`}>
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
            <Card className="mb-4 border-2 border-purple-200">
              <CardContent className="py-5">
                <View className="flex flex-row items-start">
                  <View className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mr-3 flex-shrink-0">
                    <Text className="text-sm font-bold text-white">
                      {currentQuestionIndex + 1}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-purple-600 mb-2">
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
                确认答案
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
                  <Text className="block text-xs text-gray-500 mb-1">了解程度</Text>
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
                    {3 - Math.round(score / 100 - selectedCategory.questions.length)}s
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
                        ? '你对TA的了解非常深入！继续保持这种沟通和了解。'
                        : getMatchRate() >= 60
                          ? '你对TA有一定了解，还可以通过更多深入交流加深。'
                          : getMatchRate() >= 40
                            ? '你们之间还有很多不了解的地方，建议多进行深入对话。'
                            : '你们之间还有很多未知，建议多花时间了解对方的想法。'}
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
            提示：只有3秒！快速回答获得额外加分
          </Text>
        </View>
      </View>
    </View>
  )
}

export default QuickPage
