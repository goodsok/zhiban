import { useState, useEffect } from 'react'
import CustomHeader from '@/components/custom-header'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { EyeOff, Sparkles, Check, ArrowRight, RotateCcw, CircleQuestionMark } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Network } from '@/network'

/** 触碰关卡 */
interface BlindRound {
  id: number
  name: string
  touchInstruction: string
  guessHint: string
  bodyPart: string
  decoyOptions: string[]
  intimacyScore: number
  tip: string
}

/** Fisher-Yates 随机打乱选项 */
const shuffleOptions = (correct: string, decoys: string[]): string[] => {
  const all = [correct, ...decoys]
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]]
  }
  return all
}

const BlindPage: FC = () => {
  const [blindRounds, setBlindRounds] = useState<BlindRound[]>([])
  const [step, setStep] = useState<'intro' | 'invite' | 'touch' | 'guess' | 'correct' | 'wrong' | 'summary'>('intro')
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [selectedOption, setSelectedOption] = useState('')

  /** 记录每轮是否猜对 */
  const [roundResults, setRoundResults] = useState<boolean[]>([])

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const res = await Network.request({ url: '/api/game-data/content?gameKey=blind' })
        console.log('Blind game data response:', res.data)
        const apiData = res.data?.data
        if (Array.isArray(apiData) && apiData.length > 0 && apiData[0].content_data?.rounds) {
          setBlindRounds(apiData[0].content_data.rounds)
        }
      } catch (err) {
        console.error('Failed to fetch blind game data:', err)
      }
    }
    fetchGameData()
  }, [])

  useLoad(() => {
    console.log('Blind touch game loaded.')
  })

  const currentRound = blindRounds[currentRoundIndex]

  const handleStartRound = () => {
    setOptions(shuffleOptions(currentRound.bodyPart, currentRound.decoyOptions))
    setSelectedOption('')
    setStep('touch')
  }

  const handleFinishTouch = () => {
    setStep('guess')
  }

  const handleGuess = (option: string) => {
    setSelectedOption(option)
    if (option === currentRound.bodyPart) {
      setTotalScore(prev => prev + currentRound.intimacyScore)
      setCorrectCount(prev => prev + 1)
      setRoundResults(prev => [...prev, true])
      setStep('correct')
    } else {
      setRoundResults(prev => [...prev, false])
      setStep('wrong')
    }
  }

  const handleNextRound = () => {
    if (currentRoundIndex < blindRounds.length - 1) {
      setCurrentRoundIndex(prev => prev + 1)
      handleStartRound()
    } else {
      setStep('summary')
    }
  }

  const handleReset = () => {
    setStep('intro')
    setCurrentRoundIndex(0)
    setTotalScore(0)
    setCorrectCount(0)
    setSelectedOption('')
    setRoundResults([])
  }

  const getProgressPercent = () => {
    return ((currentRoundIndex + (step === 'correct' || step === 'wrong' || step === 'summary' ? 1 : 0)) / blindRounds.length) * 100
  }

  const getSummaryTitle = () => {
    if (correctCount >= 5) return '心灵相通'
    if (correctCount >= 3) return '心有灵犀'
    if (correctCount >= 1) return '渐入佳境'
    return '初探感知'
  }

  const getSummaryText = () => {
    if (correctCount >= 5) return '你们的感知力惊人！身体比大脑更懂对方，每一次触碰都在加深你们的连接。'
    if (correctCount >= 3) return '你们已经有了不错的默契，闭上眼的世界里，TA的触碰你越来越熟悉了。'
    if (correctCount >= 1) return '每一次感知都是一次靠近，慢慢来，你们的身体会越来越了解彼此。'
    return '感知需要时间培养，重要的是你们愿意为彼此闭上眼睛，这本身就是最大的信任。'
  }

  if (blindRounds.length === 0) {
    return (
      <View className="flex items-center justify-center h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="盲触感知" />
        <Text className="block text-gray-500">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen pb-8" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部进度条 */}
      <View className="bg-white px-4 pt-2 pb-3 border-b">
        <View className="flex flex-row items-center justify-between mb-1">
          <Text className="text-xs text-gray-500">感知进度</Text>
          <Text className="text-xs text-gray-500">
            {step === 'intro' || step === 'invite' ? '准备' : `${Math.min(currentRoundIndex + 1, blindRounds.length)}/${blindRounds.length}`}
          </Text>
        </View>
        <Progress value={getProgressPercent()} className="h-2" />
      </View>

      <View className="p-4">
        {/* 游戏介绍 */}
        {step === 'intro' && (
          <View className="flex flex-col items-center">
            <View className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mb-4">
              <EyeOff size={40} color="white" />
            </View>
            <Text className="block text-2xl font-bold text-gray-900 mb-2">盲触感知</Text>
            <Text className="block text-sm text-gray-500 mb-4 text-center leading-relaxed">
              闭眼感知游戏{'\n'}当视觉消失，触觉会放大100倍
            </Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm font-medium text-gray-700 mb-4">游戏规则</Text>
                <View className="space-y-2">
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-teal-600">1</Text>
                    </View>
                    <Text className="text-sm text-gray-600">一方闭眼，另一方按指示触碰TA</Text>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-teal-600">2</Text>
                    </View>
                    <Text className="text-sm text-gray-600">闭眼方根据触感猜测对方做了什么</Text>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-teal-600">3</Text>
                    </View>
                    <Text className="text-sm text-gray-600">共6轮，难度递增，猜对得分</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card className="mb-6 w-full bg-amber-50 border-amber-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Sparkles size={16} color="#f59e0b" className="mr-2 mt-1 flex-shrink-0" />
                  <View className="flex-1">
                    <Text className="block text-sm text-amber-700 leading-relaxed">
                      核心魅力：闭上眼后，每一次触碰都会被放大。皮肤的每一寸都在专注感受对方——这就是信任的力量。
                    </Text>
                    <Text className="block text-xs text-amber-600 mt-2">
                      提前准备：最后一轮需要一颗糖果（或薄荷糖），没有也可跳过
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Button
              className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-xl py-3 w-full"
              onClick={() => setStep('invite')}
            >
              <View className="flex flex-row items-center justify-center">
                <EyeOff size={18} color="white" />
                <Text className="text-white ml-2 font-medium">邀请TA一起玩</Text>
              </View>
            </Button>
          </View>
        )}

        {/* 邀请话术 */}
        {step === 'invite' && (
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center mb-4">
              <Sparkles size={32} color="#0d9488" />
            </View>
            <Text className="block text-lg font-bold text-gray-900 mb-2">把手机递给TA</Text>
            <Text className="block text-sm text-gray-500 mb-6 text-center leading-relaxed">
              让TA看到这段话，如果愿意就点「好呀」
            </Text>

            <Card className="mb-6 w-full bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-100">
              <CardContent className="py-5">
                <Text className="block text-base text-gray-800 leading-loose text-center font-medium">
                  &ldquo;你相信吗？{'\n'}闭上眼睛之后，{'\n'}触碰会变得完全不同。{'\n'}{'\n'}我碰你，你来猜，{'\n'}猜对了有奖励哦。{'\n'}{'\n'}敢不敢闭眼试试？&rdquo;
                </Text>
              </CardContent>
            </Card>

            <View className="w-full space-y-3">
              <Button
                className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-xl py-3 w-full"
                onClick={handleStartRound}
              >
                <View className="flex flex-row items-center justify-center">
                  <EyeOff size={18} color="white" />
                  <Text className="text-white ml-2 font-medium">好呀，开始吧</Text>
                </View>
              </Button>
              <Button
                variant="ghost"
                className="rounded-xl py-2 w-full"
                onClick={() => setStep('intro')}
              >
                <Text className="text-gray-400 text-sm">返回</Text>
              </Button>
            </View>
          </View>
        )}

        {/* 触碰阶段 - 展示触碰指令 */}
        {step === 'touch' && currentRound && (
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center mb-4">
              <Text className="text-2xl">🙈</Text>
            </View>
            <Text className="block text-xs text-teal-500 font-medium mb-1">第 {currentRound.id} 轮 / 共 {blindRounds.length} 轮</Text>
            <Text className="block text-xl font-bold text-gray-900 mb-1">{currentRound.name}</Text>
            <Text className="block text-sm text-gray-400 mb-6">+{currentRound.intimacyScore} 亲密度</Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-5">
                <View className="flex flex-col items-center">
                  <View className="flex flex-row items-center mb-4">
                    <EyeOff size={16} color="#0d9488" />
                    <Text className="text-xs text-teal-600 font-medium ml-1">触碰者请看（让对方闭眼）</Text>
                  </View>
                  <Text className="block text-base text-gray-800 text-center leading-relaxed font-medium">
                    {currentRound.touchInstruction}
                  </Text>
                </View>
              </CardContent>
            </Card>

            <Card className="mb-6 w-full bg-pink-50 border-pink-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Sparkles size={16} color="#ec4899" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-pink-700 leading-relaxed">{currentRound.tip}</Text>
                </View>
              </CardContent>
            </Card>

            <Button
              className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-xl py-3 w-full"
              onClick={handleFinishTouch}
            >
              <View className="flex flex-row items-center justify-center">
                <CircleQuestionMark size={18} color="white" />
                <Text className="text-white ml-2 font-medium">触碰完成，开始猜</Text>
              </View>
            </Button>
            {currentRoundIndex === blindRounds.length - 1 && (
              <Button
                variant="ghost"
                className="rounded-xl py-2 w-full mt-2"
                onClick={handleNextRound}
              >
                <Text className="text-gray-400 text-sm">没有糖果，跳过这轮</Text>
              </Button>
            )}
          </View>
        )}

        {/* 猜测阶段 */}
        {step === 'guess' && currentRound && (
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mb-4">
              <CircleQuestionMark size={32} color="white" />
            </View>
            <Text className="block text-lg font-bold text-gray-900 mb-2">睁开眼睛，开始猜测</Text>
            <Text className="block text-sm text-gray-500 mb-6 text-center leading-relaxed">
              {currentRound.guessHint}
            </Text>

            <View className="w-full space-y-3">
              {options.map((option) => (
                <Card
                  key={option}
                  className="cursor-pointer"
                  onClick={() => handleGuess(option)}
                >
                  <CardContent className="py-4">
                    <Text className="block text-base text-gray-800 text-center font-medium">
                      {option}
                    </Text>
                  </CardContent>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* 猜对 */}
        {step === 'correct' && currentRound && (
          <View className="flex flex-col items-center">
            <View className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4">
              <Check size={40} color="white" />
            </View>
            <Text className="block text-xl font-bold text-green-600 mb-1">猜对了！</Text>
            <Text className="block text-sm text-gray-500 mb-1">+{currentRound.intimacyScore} 亲密度</Text>
            <Text className="block text-sm text-gray-400 mb-6">
              正确答案：{currentRound.bodyPart}
            </Text>

            <Card className="mb-6 w-full bg-green-50 border-green-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Sparkles size={16} color="#16a34a" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-green-700 leading-relaxed">{currentRound.tip}</Text>
                </View>
              </CardContent>
            </Card>

            <Button
              className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-xl py-3 w-full"
              onClick={handleNextRound}
            >
              <View className="flex flex-row items-center justify-center">
                <ArrowRight size={18} color="white" />
                <Text className="text-white ml-2 font-medium">
                  {currentRoundIndex < blindRounds.length - 1 ? `下一轮：${blindRounds[currentRoundIndex + 1].name}` : '查看总结'}
                </Text>
              </View>
            </Button>
          </View>
        )}

        {/* 猜错 */}
        {step === 'wrong' && currentRound && (
          <View className="flex flex-col items-center">
            <View className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4">
              <Text className="block text-3xl">🤔</Text>
            </View>
            <Text className="block text-xl font-bold text-amber-600 mb-1">差一点点！</Text>
            <Text className="block text-sm text-gray-500 mb-1">你选了：{selectedOption}</Text>
            <Text className="block text-sm text-green-600 font-medium mb-6">
              正确答案：{currentRound.bodyPart}
            </Text>

            <Card className="mb-6 w-full bg-pink-50 border-pink-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Sparkles size={16} color="#ec4899" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-pink-700 leading-relaxed">{currentRound.tip}</Text>
                </View>
              </CardContent>
            </Card>

            <Button
              className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-xl py-3 w-full"
              onClick={handleNextRound}
            >
              <View className="flex flex-row items-center justify-center">
                <ArrowRight size={18} color="white" />
                <Text className="text-white ml-2 font-medium">
                  {currentRoundIndex < blindRounds.length - 1 ? `下一轮：${blindRounds[currentRoundIndex + 1].name}` : '查看总结'}
                </Text>
              </View>
            </Button>
          </View>
        )}

        {/* 游戏总结 */}
        {step === 'summary' && (
          <View className="flex flex-col items-center">
            <Text className="block text-5xl mb-4">{correctCount >= 3 ? '🫶' : '🤗'}</Text>
            <Text className="block text-2xl font-bold text-gray-900 mb-1">{getSummaryTitle()}</Text>
            <Text className="block text-sm text-gray-500 mb-2">
              猜对 {correctCount}/{blindRounds.length} · 亲密度 {totalScore} 分
            </Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm text-gray-700 leading-relaxed text-center">
                  {getSummaryText()}
                </Text>
              </CardContent>
            </Card>

            <Card className="mb-6 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm font-medium text-gray-700 mb-4">挑战记录</Text>
                {blindRounds.map((round, idx) => (
                  <View key={round.id} className="flex flex-row items-center justify-between py-2">
                    <View className="flex flex-row items-center">
                      <Text className="text-sm text-gray-600 mr-2">第{round.id}轮</Text>
                      <Text className="text-sm text-gray-800">{round.name}</Text>
                    </View>
                    {roundResults[idx] ? (
                      <Text className="text-xs text-green-600 font-medium">+{round.intimacyScore} 猜对</Text>
                    ) : (
                      <Text className="text-xs text-gray-400">未猜对</Text>
                    )}
                  </View>
                ))}
              </CardContent>
            </Card>

            <Button
              className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-xl py-3 w-full"
              onClick={handleReset}
            >
              <View className="flex flex-row items-center justify-center">
                <RotateCcw size={18} color="white" />
                <Text className="text-white ml-2 font-medium">再玩一次</Text>
              </View>
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}

export default BlindPage
