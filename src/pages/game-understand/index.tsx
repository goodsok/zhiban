import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Sparkles, Heart, ArrowRight, ChevronRight, RefreshCw } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Network } from '@/network'

interface QuestionCategory {
  id: string
  name: string
  icon: string
  color: string
  questions: string[]
}

const UnderstandPage: FC = () => {
  const [categories, setCategories] = useState<QuestionCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<string>('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [completedCategoryIds, setCompletedCategoryIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGameData = async () => {
    try {
      console.log('[Understand] Fetching game data from API...')
      const res = await Network.request({
        url: '/api/game-data/content?gameKey=understand',
        method: 'GET',
      })
      console.log('[Understand] Game data response:', res.data)
      const items = res.data?.data || []
      const cats: QuestionCategory[] = items.map((item: any) => {
        const d = item?.content_data || {}
        return {
          id: item.category,
          name: d.name || item.category,
          icon: d.icon || '💬',
          color: d.color || 'from-gray-400 to-gray-500',
          questions: d.questions || [],
        }
      })
      if (cats.length > 0) setCategories(cats)
    } catch (err) {
      console.error('[Understand] Failed to fetch game data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGameData()
  }, [])

  useLoad(() => {
    console.log('Understand game loaded.')
  })

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const shuffled = [...arr]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const handleSelectCategory = (category: QuestionCategory) => {
    const shuffledQuestions = shuffleArray(category.questions)
    setSelectedCategory({
      ...category,
      questions: shuffledQuestions,
    })
    setCurrentQuestion(shuffledQuestions[0])
    setQuestionIndex(0)
  }

  const handleNextQuestion = () => {
    if (!selectedCategory) return
    
    const nextIndex = questionIndex + 1
    if (nextIndex < selectedCategory.questions.length) {
      setQuestionIndex(nextIndex)
      setCurrentQuestion(selectedCategory.questions[nextIndex])
    } else {
      setCurrentQuestion('')
    }
  }

  const handleBack = () => {
    if (selectedCategory) {
      setCompletedCategoryIds(prev =>
        prev.includes(selectedCategory.id) ? prev : [...prev, selectedCategory.id]
      )
    }
    setSelectedCategory(null)
    setCurrentQuestion('')
    setQuestionIndex(0)
  }

  if (loading) {
    return (
      <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
        <View className="bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-6">
          <Text className="block text-2xl font-bold text-white mb-2">深入了解问答</Text>
          <Text className="block text-sm text-gray-200">加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部 */}
      <View className="bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-2">深入了解问答</Text>
        <Text className="block text-sm text-gray-200">
          精心设计的问题，快速了解对方
        </Text>
      </View>

      {/* 游戏区域 */}
      <View className="p-4">
        {!selectedCategory ? (
          <>
            {/* 类别选择 */}
            <Text className="block text-sm font-medium text-gray-500 mb-4">选择一个话题</Text>
            <ScrollView scrollY className="max-h-[calc(100vh-280px)]">
              <View className="space-y-3">
                {categories.map((category) => (
                  <View
                    key={category.id}
                    className="bg-white rounded-2xl shadow-soft overflow-hidden"
                    onClick={() => handleSelectCategory(category)}
                  >
                    <View className={`bg-gradient-to-r ${category.color} px-4 py-4`}>
                      <View className="flex flex-row items-center justify-between">
                        <View className="flex flex-row items-center flex-1">
                          <Text className="text-2xl mr-3">{category.icon}</Text>
                          <View className="flex-1">
                            <Text className="block text-base font-semibold text-white">
                              {category.name}
                            </Text>
                            <Text className="block text-xs text-gray-200">
                              {category.questions.length} 个问题
                            </Text>
                          </View>
                        </View>
                        <View className="flex flex-row items-center">
                          {completedCategoryIds.includes(category.id) && (
                            <View className="bg-white bg-opacity-30 rounded-full px-2 py-1 mr-2">
                              <Text className="text-xs text-white">已聊</Text>
                            </View>
                          )}
                          <ChevronRight size={20} color="white" />
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </>
        ) : currentQuestion ? (
          <>
            {/* 进度 */}
            <View className="bg-white rounded-2xl shadow-soft px-4 py-3 mb-4 flex flex-row items-center justify-between">
              <Text className="text-sm text-gray-500">{selectedCategory.name}</Text>
              <Text className="text-sm text-orange-600 font-medium">
                {questionIndex + 1} / {selectedCategory.questions.length}
              </Text>
            </View>

            {/* 问题卡片 */}
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 mb-4">
              <CardContent className="py-8">
                <View className="flex flex-col items-center">
                  <Text className="text-3xl mb-4">{selectedCategory.icon}</Text>
                  <Text className="block text-lg text-gray-900 text-center leading-relaxed px-4">
                    {currentQuestion}
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <View className="space-y-3">
              <Button
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl py-3"
                onClick={handleNextQuestion}
              >
                <View className="flex flex-row items-center justify-center">
                  <ArrowRight size={18} color="#fff" />
                  <Text className="text-white ml-2 font-medium">下一个问题</Text>
                </View>
              </Button>
              
              <Button
                variant="secondary"
                className="rounded-xl py-3"
                onClick={handleBack}
              >
                <View className="flex flex-row items-center justify-center">
                  <RefreshCw size={18} color="#6b7280" />
                  <Text className="ml-2">更换话题</Text>
                </View>
              </Button>
            </View>
          </>
        ) : (
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
            <CardContent className="py-8">
              <View className="flex flex-col items-center">
                <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Heart size={32} color="#22c55e" />
                </View>
                <Text className="block text-lg font-semibold text-gray-900 mb-2">已完成所有问题</Text>
                <Text className="block text-sm text-gray-500 text-center mb-6 leading-relaxed">
                  恭喜！你已经完成了这个话题的所有问题。选择其他话题继续了解对方吧！
                </Text>
                <Button
                  variant="secondary"
                  className="rounded-xl px-8 py-3"
                  onClick={handleBack}
                >
                  <Text>返回选择</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        )}
      </View>

      <View className="bg-white border-t px-4 py-3 mt-4">
        <View className="flex flex-row items-center">
          <Sparkles size={16} color="#f97316" />
          <Text className="block text-xs text-gray-500 ml-2">
            提示：真诚分享会让对方更了解你，也可以主动向对方提问
          </Text>
        </View>
      </View>
    </View>
  )
}

export default UnderstandPage
