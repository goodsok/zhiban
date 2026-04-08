import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Brain, ArrowRight, Users, Heart, Sparkles, RefreshCw, Check } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Question {
  id: number
  question: string
  options: string[]
}

interface TacitTestCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  questions: Question[]
}

const categories: TacitTestCategory[] = [
  {
    id: 'values',
    name: '价值观匹配',
    description: '测试你们在人生观、价值观上的契合度',
    icon: '⚖️',
    color: 'from-blue-400 to-cyan-500',
    questions: [
      {
        id: 1,
        question: '你认为最幸福的生活是什么样的？',
        options: ['安稳平淡的生活', '充满挑战和变化', '有成就感和认可', '自由自在无拘束'],
      },
      {
        id: 2,
        question: '面对困难时，你通常的做法是？',
        options: ['自己默默解决', '寻求朋友帮助', '和家人商量', '顺其自然'],
      },
      {
        id: 3,
        question: '你认为最重要的品质是？',
        options: ['诚实守信', '善良体贴', '幽默风趣', '聪明智慧'],
      },
      {
        id: 4,
        question: '你对未来的规划更看重？',
        options: ['稳定的工作和收入', '追求个人梦想', '家庭幸福', '自由的时间'],
      },
      {
        id: 5,
        question: '你觉得什么样的朋友最值得珍惜？',
        options: ['真心待你的朋友', '能共同成长的朋友', '有趣好玩的朋友', '可靠的朋友'],
      },
    ],
  },
  {
    id: 'lifestyle',
    name: '生活方式',
    description: '了解你们的日常生活习惯是否相似',
    icon: '🏠',
    color: 'from-green-400 to-emerald-500',
    questions: [
      {
        id: 1,
        question: '你理想的周末是怎么度过的？',
        options: ['宅在家里休息', '和朋友聚会', '户外运动', '学习提升'],
      },
      {
        id: 2,
        question: '你对美食的态度是？',
        options: ['随便吃就行', '喜欢尝试各种美食', '自己动手做饭', '注重健康饮食'],
      },
      {
        id: 3,
        question: '你喜欢的旅行方式是？',
        options: ['跟团省心', '自由行探索', '度假村放松', '深度体验当地文化'],
      },
      {
        id: 4,
        question: '你通常几点睡觉？',
        options: ['晚上10点左右', '晚上11点左右', '凌晨12点以后', '看情况而定'],
      },
      {
        id: 5,
        question: '你觉得家里最重要的部分是？',
        options: ['舒适的卧室', '宽敞的客厅', '功能齐全的厨房', '安静的书房'],
      },
    ],
  },
  {
    id: 'personality',
    name: '性格互补',
    description: '发现你们的性格特点和互补性',
    icon: '💭',
    color: 'from-purple-400 to-violet-500',
    questions: [
      {
        id: 1,
        question: '在社交场合，你通常？',
        options: ['主动交流认识新朋友', '和熟悉的人聊天', '安静观察', '害羞躲在角落'],
      },
      {
        id: 2,
        question: '做决定时，你更倾向于？',
        options: ['快速果断', '深思熟虑', '征求他人意见', '犹豫不决'],
      },
      {
        id: 3,
        question: '面对压力，你会？',
        options: ['努力克服', '寻求帮助', '逃避一下', '抱怨发泄'],
      },
      {
        id: 4,
        question: '你更喜欢哪种工作方式？',
        options: ['独立完成', '团队合作', '领导指挥', '执行任务'],
      },
      {
        id: 5,
        question: '你觉得自己是？',
        options: ['乐观开朗', '理性冷静', '感性敏感', '稳重踏实'],
      },
    ],
  },
  {
    id: 'love',
    name: '感情观念',
    description: '测试你们对感情和恋爱的看法',
    icon: '❤️',
    color: 'from-rose-400 to-pink-500',
    questions: [
      {
        id: 1,
        question: '你认为理想的爱情应该是？',
        options: ['轰轰烈烈的激情', '细水长流的陪伴', '互相理解和支持', '有共同的目标'],
      },
      {
        id: 2,
        question: '在恋爱中，你更看重？',
        options: ['外貌和吸引力', '性格和人品', '经济条件', '共同兴趣'],
      },
      {
        id: 3,
        question: '你觉得吵架后应该怎么做？',
        options: ['主动道歉', '等对方冷静', '一起解决问题', '各自冷静一段时间'],
      },
      {
        id: 4,
        question: '你理想的约会频率是？',
        options: ['天天见面', '一周2-3次', '一周1次', '看心情和时间'],
      },
      {
        id: 5,
        question: '你对婚姻的态度是？',
        options: ['一定要结婚', '顺其自然', '不一定结婚', '暂时不考虑'],
      },
    ],
  },
]

const TacitPage: FC = () => {
  const [step, setStep] = useState<'select' | 'intro' | 'player-a' | 'player-b' | 'result'>('select')
  const [selectedCategory, setSelectedCategory] = useState<TacitTestCategory | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [playerAAnswers, setPlayerAAnswers] = useState<number[]>([])
  const [playerBAnswers, setPlayerBAnswers] = useState<number[]>([])

  useLoad(() => {
    console.log('Tacit game loaded.')
  })

  const handleSelectCategory = (category: TacitTestCategory) => {
    setSelectedCategory(category)
    setStep('intro')
  }

  const handleStartTest = () => {
    setStep('player-a')
    setCurrentQuestionIndex(0)
    setPlayerAAnswers([])
    setPlayerBAnswers([])
  }

  const handleAnswer = (optionIndex: number) => {
    if (step === 'player-a') {
      const newAnswers = [...playerAAnswers, optionIndex]
      setPlayerAAnswers(newAnswers)
      
      if (currentQuestionIndex < selectedCategory!.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        // A回答完成，切换到B
        setCurrentQuestionIndex(0)
        setStep('player-b')
      }
    } else if (step === 'player-b') {
      const newAnswers = [...playerBAnswers, optionIndex]
      setPlayerBAnswers(newAnswers)
      
      if (currentQuestionIndex < selectedCategory!.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        // 测试完成
        setStep('result')
      }
    }
  }

  const handleReset = () => {
    setStep('select')
    setSelectedCategory(null)
    setCurrentQuestionIndex(0)
    setPlayerAAnswers([])
    setPlayerBAnswers([])
  }

  const calculateScore = () => {
    if (!selectedCategory) return { matchCount: 0, total: 0, score: 0 }
    
    let matchCount = 0
    const total = selectedCategory.questions.length
    
    for (let i = 0; i < total; i++) {
      if (playerAAnswers[i] === playerBAnswers[i]) {
        matchCount++
      }
    }
    
    const score = Math.round((matchCount / total) * 100)
    return { matchCount, total, score }
  }

  const getRating = (score: number) => {
    if (score >= 80) return { text: '灵魂伴侣', color: 'text-rose-600', emoji: '💕' }
    if (score >= 60) return { text: '高度默契', color: 'text-purple-600', emoji: '💜' }
    if (score >= 40) return { text: '需要了解', color: 'text-blue-600', emoji: '💙' }
    return { text: '互补性格', color: 'text-amber-600', emoji: '💛' }
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部 */}
      <View className="bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-2">默契测试</Text>
        <Text className="block text-sm text-gray-200">
          测试你们的默契程度，发现彼此的契合点
        </Text>
      </View>

      {/* 游戏区域 */}
      <View className="p-4">
        {step === 'select' && (
          <>
            <Text className="block text-sm font-medium text-gray-500 mb-3">选择测试类型</Text>
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className="mb-3 overflow-hidden"
                onClick={() => handleSelectCategory(category)}
              >
                <View className={`bg-gradient-to-r ${category.color} px-4 py-4`}>
                  <View className="flex flex-row items-center">
                    <Text className="text-2xl mr-3">{category.icon}</Text>
                    <View className="flex-1">
                      <Text className="block text-base font-semibold text-white">
                        {category.name}
                      </Text>
                      <Text className="block text-xs text-gray-200">
                        {category.description}
                      </Text>
                    </View>
                    <ArrowRight size={20} color="white" />
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}

        {step === 'intro' && selectedCategory && (
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
            <CardContent className="py-8">
              <View className="flex flex-col items-center">
                <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Brain size={32} color="#3b82f6" />
                </View>
                <Text className="block text-lg font-semibold text-gray-900 mb-2">
                  {selectedCategory.name}
                </Text>
                <Text className="block text-sm text-gray-500 text-center mb-4 leading-relaxed">
                  {selectedCategory.description}
                </Text>
                <View className="flex flex-row items-center mb-6">
                  <Users size={16} color="#6b7280" />
                  <Text className="text-sm text-gray-500 ml-2">
                    共 {selectedCategory.questions.length} 道题
                  </Text>
                </View>
                <Text className="block text-xs text-gray-400 text-center mb-6">
                  两人分别回答相同的问题，系统会自动计算你们的默契度
                </Text>
                <Button
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl px-8 py-3"
                  onClick={handleStartTest}
                >
                  <Text className="text-white font-medium">开始测试</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        )}

        {(step === 'player-a' || step === 'player-b') && selectedCategory && (
          <>
            {/* 进度和当前玩家 */}
            <View className="bg-white rounded-xl px-4 py-3 mb-4 flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                <Users size={16} color="#3b82f6" />
                <Text className="text-sm font-medium text-gray-700 ml-2">
                  {step === 'player-a' ? 'A 回答中' : 'B 回答中'}
                </Text>
              </View>
              <Text className="text-sm text-blue-600 font-medium">
                {currentQuestionIndex + 1} / {selectedCategory.questions.length}
              </Text>
            </View>

            {/* 问题卡片 */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100 mb-4">
              <CardContent className="py-6">
                <Text className="block text-base font-semibold text-gray-900 text-center leading-relaxed px-2">
                  {selectedCategory.questions[currentQuestionIndex].question}
                </Text>
              </CardContent>
            </Card>

            {/* 选项 */}
            <View className="space-y-3">
              {selectedCategory.questions[currentQuestionIndex].options.map((option, index) => (
                <Card
                  key={index}
                  className="border-gray-200 active:bg-gray-50"
                  onClick={() => handleAnswer(index)}
                >
                  <CardContent className="py-4">
                    <View className="flex flex-row items-center">
                      <View className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <Text className="text-sm font-semibold text-blue-600">
                          {String.fromCharCode(65 + index)}
                        </Text>
                      </View>
                      <Text className="text-sm text-gray-700 flex-1">{option}</Text>
                      <Check size={16} color="#d1d5db" />
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          </>
        )}

        {step === 'result' && selectedCategory && (
          <>
            {/* 结果卡片 */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100 mb-4">
              <CardContent className="py-8">
                <View className="flex flex-col items-center">
                  <View className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <Heart size={36} color="#a855f7" />
                  </View>
                  <Text className="block text-sm text-gray-500 mb-1">默契度</Text>
                  <Text className="block text-5xl font-bold text-gray-900 mb-2">
                    {calculateScore().score}%
                  </Text>
                  <View className="flex flex-row items-center mb-2">
                    <Text className="text-2xl mr-2">{getRating(calculateScore().score).emoji}</Text>
                    <Text className={`text-lg font-semibold ${getRating(calculateScore().score).color}`}>
                      {getRating(calculateScore().score).text}
                    </Text>
                  </View>
                  <Text className="block text-sm text-gray-500 text-center leading-relaxed mt-4">
                    你们在 {calculateScore().matchCount} 道题目上选择了相同的答案
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* 答案对比 */}
            <Card className="mb-4">
              <CardContent className="py-4">
                <View className="flex flex-row items-center mb-3">
                  <Sparkles size={16} color="#a855f7" />
                  <Text className="text-sm font-semibold text-gray-900 ml-2">答案对比</Text>
                </View>
                <View className="space-y-2">
                  {selectedCategory.questions.map((q, index) => {
                    const isMatch = playerAAnswers[index] === playerBAnswers[index]
                    return (
                      <View key={q.id} className="border border-gray-100 rounded-lg p-3">
                        <Text className="text-sm text-gray-500 mb-2">{q.question}</Text>
                        <View className="flex flex-row">
                          <View className="flex-1 mr-2">
                            <Text className="text-xs text-gray-400 mb-1">A</Text>
                            <Text className="text-sm text-gray-700">{q.options[playerAAnswers[index]]}</Text>
                          </View>
                          <View className="w-px bg-gray-200 mr-2" />
                          <View className="flex-1 mr-2">
                            <Text className="text-xs text-gray-400 mb-1">B</Text>
                            <Text className="text-sm text-gray-700">{q.options[playerBAnswers[index]]}</Text>
                          </View>
                          <View className="flex items-center">
                            {isMatch ? (
                              <Check size={18} color="#22c55e" />
                            ) : (
                              <Text className="text-xs text-gray-400">✗</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    )
                  })}
                </View>
              </CardContent>
            </Card>

            {/* 重新测试 */}
            <Button
              variant="secondary"
              className="rounded-xl py-3"
              onClick={handleReset}
            >
              <View className="flex flex-row items-center justify-center">
                <RefreshCw size={18} color="#6b7280" />
                <Text className="ml-2">重新测试</Text>
              </View>
            </Button>
          </>
        )}
      </View>

      {/* 底部提示 */}
      <View className="bg-white border-t border-gray-100 px-4 py-3 mt-4">
        <View className="flex flex-row items-center">
          <Sparkles size={16} color="#3b82f6" />
          <Text className="block text-xs text-gray-500 ml-2">
            提示：两人独立回答，不要看对方的答案，结果更准确
          </Text>
        </View>
      </View>
    </View>
  )
}

export default TacitPage
