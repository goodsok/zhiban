import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Heart, Shuffle, RotateCcw, Sparkles, ArrowRight, Check } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Network } from '@/network'

const TruthDarePage: FC = () => {
  const [mode, setMode] = useState<'truth' | 'dare'>('truth')
  const [currentQuestion, setCurrentQuestion] = useState<string>('')
  const [isRevealed, setIsRevealed] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [usedQuestions, setUsedQuestions] = useState<string[]>([])
  const [truthQuestions, setTruthQuestions] = useState<string[]>([])
  const [dareChallenges, setDareChallenges] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGameData = async () => {
    try {
      console.log('[TruthDare] Fetching game data from API...')
      const res = await Network.request({
        url: '/api/game-data/content?gameKey=truth-dare',
        method: 'GET',
      })
      console.log('[TruthDare] Game data response:', res.data)
      const items = res.data?.data || []
      const truths: string[] = []
      const dares: string[] = []
      for (const item of items) {
        const text = item?.content_data?.text
        if (!text) continue
        if (item.category === 'truth') truths.push(text)
        else if (item.category === 'dare') dares.push(text)
      }
      if (truths.length > 0) setTruthQuestions(truths)
      if (dares.length > 0) setDareChallenges(dares)
    } catch (err) {
      console.error('[TruthDare] Failed to fetch game data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGameData()
  }, [])

  useLoad(() => {
    console.log('Truth or Dare game loaded.')
  })

  const getRandomQuestion = (questions: string[], used: string[]): string => {
    const available = questions.filter(q => !used.includes(q))
    const pool = available.length > 0 ? available : questions
    return pool[Math.floor(Math.random() * pool.length)]
  }

  const handleNewQuestion = () => {
    const questions = mode === 'truth' ? truthQuestions : dareChallenges
    if (questions.length === 0) return
    const question = getRandomQuestion(questions, usedQuestions)
    setCurrentQuestion(question)
    setIsRevealed(false)
    const modeTag = mode === 'truth' ? '💕 真心话' : '✨ 大冒险'
    setHistory(prev => [`${modeTag}：${question}`, ...prev])
    setUsedQuestions(prev => usedQuestions.includes(question) ? prev : [...prev, question])
  }

  const handleSwitchMode = (newMode: 'truth' | 'dare') => {
    setMode(newMode)
    setIsRevealed(false)
    setCurrentQuestion('')
    setUsedQuestions([])
  }

  if (loading) {
    return (
      <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
        <View className="bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-6">
          <Text className="block text-2xl font-bold text-white mb-2">真心话大冒险</Text>
          <Text className="block text-sm text-gray-200">加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部 */}
      <View className="bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-2">真心话大冒险</Text>
        <Text className="block text-sm text-gray-200">
          经典破冰游戏，快速拉近距离
        </Text>
      </View>

      {/* 模式切换 */}
      <View className="bg-white px-4 py-3">
        <View className="flex flex-row bg-gray-100 rounded-xl p-1">
          <View 
            className={`flex-1 py-2 rounded-lg flex flex-row items-center justify-center ${
              mode === 'truth' ? 'bg-rose-500' : ''
            }`}
            onClick={() => handleSwitchMode('truth')}
          >
            <Heart size={16} color={mode === 'truth' ? '#fff' : '#9ca3af'} />
            <Text className={`text-sm ml-2 ${mode === 'truth' ? 'text-white' : 'text-gray-500'}`}>
              真心话
            </Text>
          </View>
          <View 
            className={`flex-1 py-2 rounded-lg flex flex-row items-center justify-center ${
              mode === 'dare' ? 'bg-pink-500' : ''
            }`}
            onClick={() => handleSwitchMode('dare')}
          >
            <Sparkles size={16} color={mode === 'dare' ? '#fff' : '#9ca3af'} />
            <Text className={`text-sm ml-2 ${mode === 'dare' ? 'text-white' : 'text-gray-500'}`}>
              大冒险
            </Text>
          </View>
        </View>
      </View>

      {/* 游戏区域 */}
      <View className="p-4">
        {!currentQuestion ? (
          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100">
            <CardContent className="py-8">
              <View className="flex flex-col items-center">
                <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Shuffle size={32} color="#f43f5e" />
                </View>
                <Text className="block text-lg font-semibold text-gray-900 mb-2">准备开始</Text>
                <Text className="block text-sm text-gray-500 text-center mb-6 leading-relaxed">
                  {mode === 'truth' 
                    ? '真心话时间！点击下方按钮，回答随机出现的问题，让对方更了解你。'
                    : '大冒险时间！点击下方按钮，完成随机挑战，展示你的勇气和趣味。'
                  }
                </Text>
                <Button
                  className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl px-8 py-3"
                  onClick={handleNewQuestion}
                >
                  <Text className="text-white font-medium">开始挑战</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-4">
              <CardContent className="py-8">
                <View className="flex flex-col items-center">
                  <Text className="block text-xs text-rose-500 font-medium mb-4">
                    {mode === 'truth' ? '真心话' : '大冒险'}
                  </Text>
                  {isRevealed ? (
                    <Text className="block text-lg text-gray-900 text-center leading-relaxed px-4">
                      {currentQuestion}
                    </Text>
                  ) : (
                    <View className="flex flex-col items-center">
                      <View className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                        <Heart size={24} color="#f43f5e" />
                      </View>
                      <Text className="block text-sm text-gray-500">准备好了吗？</Text>
                    </View>
                  )}
                </View>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <View className="space-y-3">
              {!isRevealed ? (
                <Button
                  className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl py-3"
                  onClick={() => setIsRevealed(true)}
                >
                  <View className="flex flex-row items-center justify-center">
                    <ArrowRight size={18} color="#fff" />
                    <Text className="text-white ml-2 font-medium">翻牌</Text>
                  </View>
                </Button>
              ) : (
                <>
                  <Button
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl py-3"
                    onClick={handleNewQuestion}
                  >
                    <View className="flex flex-row items-center justify-center">
                      <Shuffle size={18} color="#fff" />
                      <Text className="text-white ml-2 font-medium">下一个</Text>
                    </View>
                  </Button>
                  
                  <Button
                    variant="secondary"
                    className="rounded-xl py-3"
                    onClick={() => setCurrentQuestion('')}
                  >
                    <View className="flex flex-row items-center justify-center">
                      <RotateCcw size={18} color="#6b7280" />
                      <Text className="ml-2">重新开始</Text>
                    </View>
                  </Button>
                </>
              )}
            </View>

            {/* 历史记录 */}
            {history.length > 0 && (
              <View className="mt-6">
                <Text className="block text-sm font-medium text-gray-500 mb-4">历史记录</Text>
                <View className="space-y-2">
                  {history.slice(0, 5).map((item, index) => (
                    <View key={index} className="bg-white rounded-lg px-4 py-3 flex flex-row items-start">
                      <Check size={16} color="#22c55e" className="mt-1 mr-2 flex-shrink-0" />
                      <Text className="text-sm text-gray-700 flex-1">{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {/* 底部提示 */}
      <View className="bg-white border-t px-4 py-3 mt-4">
        <View className="flex flex-row items-center">
          <Sparkles size={16} color="#f43f5e" />
          <Text className="block text-xs text-gray-500 ml-2">
            提示：真诚回答会让对方更了解你，勇敢尝试增加趣味性
          </Text>
        </View>
      </View>
    </View>
  )
}

export default TruthDarePage
