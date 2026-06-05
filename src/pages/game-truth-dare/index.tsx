import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Heart, Shuffle, RotateCcw, Sparkles, ArrowRight, Check } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const truthQuestions = [
  '你最近一次哭是什么时候？为什么？',
  '你最大的恐惧是什么？',
  '你做过最勇敢的事情是什么？',
  '你觉得什么样的伴侣最适合你？',
  '你童年最美好的回忆是什么？',
  '你最想改变自己的哪一点？',
  '你人生中最骄傲的时刻是什么？',
  '你觉得爱情中最重要的是什么？',
  '你希望对方了解你的哪些方面？',
  '你最近的烦恼是什么？',
  '你最欣赏对方的哪个特质？',
  '你理想中的约会是什么样的？',
  '你觉得两个人之间最重要的是什么？',
  '你最近的一次成长是什么？',
  '你对未来的规划是什么？',
  '你最难忘的一次经历是什么？',
  '你觉得什么样的瞬间最浪漫？',
  '你想对对方说但没说出口的话是什么？',
  '你最近思考最多的问题是什么？',
  '你最想和对方一起做什么？',
]

const dareChallenges = [
  '给对方唱一首歌',
  '模仿一个你认识的人',
  '表演你拿手的才艺',
  '告诉对方你觉得他/她最可爱的地方',
  '和对方对视30秒不笑',
  '分享一张你的童年照片',
  '说出你最近做过最疯狂的事',
  '给对方一个真诚的赞美',
  '模仿对方的说话方式',
  '做一个鬼脸让对方笑',
  '分享你最尴尬的瞬间',
  '给对方一个拥抱',
  '说出你想和对方一起做的三件事',
  '模仿你最喜欢的电影角色',
  '告诉对方你今天最开心的事',
  '表演一个夸张的惊讶表情',
  '让对方在你的手机里随机选一张照片',
  '说出你最近学到的新东西',
  '模仿你最爱的明星',
  '做一个让你觉得害羞的动作',
]

const TruthDarePage: FC = () => {
  const [mode, setMode] = useState<'truth' | 'dare'>('truth')
  const [currentQuestion, setCurrentQuestion] = useState<string>('')
  const [isRevealed, setIsRevealed] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [usedQuestions, setUsedQuestions] = useState<string[]>([])

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

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#FFF9F0' }}>
      {/* 顶部 */}
      <View className="bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-2">真心话大冒险</Text>
        <Text className="block text-sm text-stone-200">
          经典破冰游戏，快速拉近距离
        </Text>
      </View>

      {/* 模式切换 */}
      <View className="bg-white px-4 py-3">
        <View className="flex flex-row bg-stone-100 rounded-xl p-1">
          <View 
            className={`flex-1 py-2 rounded-lg flex flex-row items-center justify-center ${
              mode === 'truth' ? 'bg-rose-500' : ''
            }`}
            onClick={() => handleSwitchMode('truth')}
          >
            <Heart size={16} color={mode === 'truth' ? '#fff' : '#9ca3af'} />
            <Text className={`text-sm ml-2 ${mode === 'truth' ? 'text-white' : 'text-stone-500'}`}>
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
            <Text className={`text-sm ml-2 ${mode === 'dare' ? 'text-white' : 'text-stone-500'}`}>
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
                <Text className="block text-lg font-semibold text-stone-900 mb-2">准备开始</Text>
                <Text className="block text-sm text-stone-500 text-center mb-6 leading-relaxed">
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
                  <Text className="block text-xs text-rose-500 font-medium mb-3">
                    {mode === 'truth' ? '真心话' : '大冒险'}
                  </Text>
                  {isRevealed ? (
                    <Text className="block text-lg text-stone-900 text-center leading-relaxed px-4">
                      {currentQuestion}
                    </Text>
                  ) : (
                    <View className="flex flex-col items-center">
                      <View className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3">
                        <Heart size={24} color="#f43f5e" className="animate-pulse" />
                      </View>
                      <Text className="block text-sm text-stone-500">准备好了吗？</Text>
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
                <Text className="block text-sm font-medium text-stone-500 mb-3">历史记录</Text>
                <View className="space-y-2">
                  {history.slice(0, 5).map((item, index) => (
                    <View key={index} className="bg-white rounded-lg px-4 py-3 flex flex-row items-start">
                      <Check size={16} color="#22c55e" className="mt-1 mr-2 flex-shrink-0" />
                      <Text className="text-sm text-stone-700 flex-1">{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {/* 底部提示 */}
      <View className="bg-white border-t border-orange-100 px-4 py-3 mt-4">
        <View className="flex flex-row items-center">
          <Sparkles size={16} color="#f43f5e" />
          <Text className="block text-xs text-stone-500 ml-2">
            提示：真诚回答会让对方更了解你，勇敢尝试增加趣味性
          </Text>
        </View>
      </View>
    </View>
  )
}

export default TruthDarePage
