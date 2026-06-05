import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Heart, 
  Trophy,
  ChevronRight
} from 'lucide-react-taro'

interface Question {
  id: number
  question: string
  options: string[]
  answer?: number
}

interface QuizResult {
  score: number
  total: number
  percentage: number
  title: string
  message: string
}

const QuizPage: FC = () => {
  const [currentStep, setCurrentStep] = useState<'intro' | 'quiz' | 'result'>('intro')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)

  useLoad(() => {
    console.log('Quiz page loaded.')
  })

  const startQuiz = async () => {
    try {
      const res = await Network.request({ url: '/api/quiz/questions' })
      console.log('Questions response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setQuestions(res.data.data)
        setCurrentStep('quiz')
        setCurrentQuestion(0)
        setSelectedAnswer(null)
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    }
  }

  const selectAnswer = async (index: number) => {
    setSelectedAnswer(index)
  }

  const nextQuestion = async () => {
    if (selectedAnswer === null) return

    try {
      // 提交答案
      await Network.request({
        url: '/api/quiz/submit',
        method: 'POST',
        data: {
          questionId: questions[currentQuestion].id,
          answer: selectedAnswer
        }
      })

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
      } else {
        // 获取结果
        const res = await Network.request({ url: '/api/quiz/result' })
        console.log('Result response:', res.data)
        if (res.data?.code === 200 && res.data?.data) {
          setResult(res.data.data)
          setCurrentStep('result')
        }
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
    }
  }

  // 介绍页
  if (currentStep === 'intro') {
    return (
      <View className="min-h-screen p-4 flex flex-col items-center justify-center" style={{ backgroundColor: '#FFF9F0' }}>
        <View className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center mb-6">
          <Brain size={48} color="#FF6B9D" />
        </View>
        <Text className="block text-2xl font-bold text-stone-800 mb-2">默契测试</Text>
        <Text className="block text-stone-500 text-center mb-8">
          回答问题，测试你们对彼此的了解程度
        </Text>
        <Button 
          size="lg"
          className="bg-pink-500 hover:bg-pink-600 w-48"
          onClick={startQuiz}
        >
          <Heart size={20} color="#fff" className="mr-2" />
          <Text>开始测试</Text>
        </Button>

        {/* 历史记录 */}
        <View className="w-full mt-12">
          <Text className="block text-sm text-stone-500 mb-3">历史最佳成绩</Text>
          <Card className="shadow-sm border-0">
            <CardContent className="p-4">
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-3">
                  <Trophy size={24} color="#F59E0B" />
                  <View>
                    <Text className="block font-semibold text-stone-800">默契度 85%</Text>
                    <Text className="block text-sm text-stone-500">上次测试：3天前</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#A8A29E" />
              </View>
            </CardContent>
          </Card>
        </View>
      </View>
    )
  }

  // 答题页
  if (currentStep === 'quiz' && questions.length > 0) {
    const question = questions[currentQuestion]
    return (
      <View className="min-h-screen p-4" style={{ backgroundColor: '#FFF9F0' }}>
        {/* 进度 */}
        <View className="mb-6">
          <View className="flex items-center justify-between mb-2">
            <Text className="block text-sm text-stone-500">
              题目 {currentQuestion + 1}/{questions.length}
            </Text>
          </View>
          <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2" />
        </View>

        {/* 问题卡片 */}
        <Card className="shadow-sm border-0 mb-4">
          <CardContent className="p-6">
            <Text className="block text-xl font-semibold text-stone-800 text-center">
              {question.question}
            </Text>
          </CardContent>
        </Card>

        {/* 选项 */}
        {question.options.map((option, index) => (
          <Card 
            key={index} 
            className={`mb-3 shadow-sm border-0 ${
              selectedAnswer === index ? 'ring-2 ring-pink-500' : ''
            }`}
            onClick={() => selectAnswer(index)}
          >
            <CardContent className="p-4">
              <Text className={`block text-base ${
                selectedAnswer === index ? 'text-pink-500 font-medium' : 'text-stone-700'
              }`}
              >
                {option}
              </Text>
            </CardContent>
          </Card>
        ))}

        {/* 下一题按钮 */}
        <View className="mt-6">
          <Button
            size="lg"
            className="w-full bg-pink-500 hover:bg-pink-600"
            disabled={selectedAnswer === null}
            onClick={nextQuestion}
          >
            <Text>
              {currentQuestion < questions.length - 1 ? '下一题' : '查看结果'}
            </Text>
          </Button>
        </View>
      </View>
    )
  }

  // 结果页
  if (currentStep === 'result' && result) {
    return (
      <View className="min-h-screen p-4 flex flex-col items-center justify-center" style={{ backgroundColor: '#FFF9F0' }}>
        <Text className="block text-6xl mb-4">{result.percentage === 100 ? '🎉' : result.percentage >= 60 ? '💖' : '💪'}</Text>
        <Text className="block text-2xl font-bold text-stone-800 mb-2">{result.title}</Text>
        <Text className="block text-stone-500 mb-8">{result.message}</Text>

        <Card className="shadow-sm border-0 w-full mb-6">
          <CardContent className="p-6">
            <View className="flex items-center justify-between mb-4">
              <Text className="block text-stone-500">默契度</Text>
              <Text className="block text-3xl font-bold text-pink-500">{result.percentage}%</Text>
            </View>
            <Progress value={result.percentage} className="h-3" />
            <View className="flex items-center justify-between mt-4">
              <Text className="block text-sm text-stone-500">答对 {result.score}/{result.total} 题</Text>
            </View>
          </CardContent>
        </Card>

        <View className="flex gap-3 w-full">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => setCurrentStep('intro')}
          >
            <Text>返回首页</Text>
          </Button>
          <Button
            size="lg"
            className="flex-1 bg-pink-500 hover:bg-pink-600"
            onClick={startQuiz}
          >
            <Text>再测一次</Text>
          </Button>
        </View>
      </View>
    )
  }

  return null
}

export default QuizPage
