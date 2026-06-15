import { useState, useEffect } from 'react'
import CustomHeader from '@/components/custom-header'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Brain, ArrowRight, Users, Heart, Sparkles, RefreshCw, Check } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Network } from '@/network'

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

const TacitPage: FC = () => {
  const [categories, setCategories] = useState<TacitTestCategory[]>([])
  const [step, setStep] = useState<'select' | 'intro' | 'player-a' | 'handover' | 'player-b' | 'result'>('select')
  const [selectedCategory, setSelectedCategory] = useState<TacitTestCategory | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [playerAAnswers, setPlayerAAnswers] = useState<number[]>([])
  const [playerBAnswers, setPlayerBAnswers] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGameData = async () => {
    try {
      console.log('[Tacit] Fetching game data from API...')
      const res = await Network.request({
        url: '/api/game-data/content?gameKey=tacit',
        method: 'GET',
      })
      console.log('[Tacit] Game data response:', res.data)
      const items = res.data?.data || []
      const cats: TacitTestCategory[] = items.map((item: any, idx: number) => {
        const d = item?.content_data || {}
        return {
          id: item.category || String(idx),
          name: d.name || item.category,
          description: d.description || '',
          icon: d.icon || '💬',
          color: d.color || 'from-gray-400 to-gray-500',
          questions: (d.questions || []).map((q: any, qi: number) => ({
            id: q.id || qi + 1,
            question: q.question || '',
            options: q.options || [],
          })),
        }
      })
      if (cats.length > 0) setCategories(cats)
    } catch (err) {
      console.error('[Tacit] Failed to fetch game data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGameData()
  }, [])

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
        setStep('handover')
      }
    } else if (step === 'player-b') {
      const newAnswers = [...playerBAnswers, optionIndex]
      setPlayerBAnswers(newAnswers)
      
      if (currentQuestionIndex < selectedCategory!.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        setStep('result')
      }
    }
  }

  const handleStartPlayerB = () => {
    setCurrentQuestionIndex(0)
    setStep('player-b')
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

  if (loading) {
    return (
      <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="默契测试" />
        <View className="bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-6">
          <Text className="block text-2xl font-bold text-white mb-2">默契测试</Text>
          <Text className="block text-sm text-gray-200">加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
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
            <Text className="block text-sm font-medium text-gray-500 mb-4">选择测试类型</Text>
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className="mb-4 overflow-hidden"
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

        {step === 'handover' && selectedCategory && (
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
            <CardContent className="py-10">
              <View className="flex flex-col items-center">
                <View className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <Users size={40} color="#6366f1" />
                </View>
                <Text className="block text-xl font-bold text-gray-900 mb-4">
                  请将设备交给 B
                </Text>
                <Text className="block text-sm text-gray-500 text-center mb-2 leading-relaxed">
                  A 已完成所有回答
                </Text>
                <Text className="block text-sm text-gray-500 text-center mb-8 leading-relaxed">
                  请将手机交给 B，由 B 独立回答相同的问题。{'\n'}B 准备好后点击下方按钮开始。
                </Text>
                <Button
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl px-8 py-3"
                  onClick={handleStartPlayerB}
                >
                  <Text className="text-white font-medium">B 开始作答</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        )}

        {(step === 'player-a' || step === 'player-b') && selectedCategory && (
          <>
            {/* 进度和当前玩家 */}
            <View className="bg-white rounded-2xl shadow-soft px-4 py-3 mb-4 flex flex-row items-center justify-between">
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
                <View className="flex flex-row items-center mb-4">
                  <Sparkles size={16} color="#a855f7" />
                  <Text className="text-sm font-semibold text-gray-900 ml-2">答案对比</Text>
                </View>
                <View className="space-y-2">
                  {selectedCategory.questions.map((q, index) => {
                    const isMatch = playerAAnswers[index] === playerBAnswers[index]
                    return (
                      <View key={q.id} className="border rounded-xl p-3">
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
      <View className="bg-white border-t px-4 py-3 mt-4">
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
