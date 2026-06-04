import { useState, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { EyeOff, Sparkles, Check, ArrowRight, RotateCcw, HelpCircle } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

/** 触碰关卡 */
interface BlindRound {
  id: number
  name: string
  touchInstruction: string // 触碰者的动作
  guessHint: string // 给猜测者的提示
  bodyPart: string // 正确答案
  decoyOptions: string[] // 干扰选项
  intimacyScore: number
  tip: string
}

const blindRounds: BlindRound[] = [
  {
    id: 1,
    name: '指尖探路',
    touchInstruction: '用食指指尖轻轻触碰对方的手背，缓慢移动',
    guessHint: 'TA正在用指尖在你手上移动，猜猜TA用了什么？',
    bodyPart: '食指尖',
    decoyOptions: ['拇指尖', '小指尖', '笔尖'],
    intimacyScore: 10,
    tip: '指尖是最温柔的触角，慢慢感受它的温度和力度',
  },
  {
    id: 2,
    name: '掌心温度',
    touchInstruction: '把整只手掌轻轻贴在对方的小臂上，停留3秒',
    guessHint: 'TA刚刚在你手臂上做了什么？',
    bodyPart: '手掌轻贴',
    decoyOptions: ['手指弹了弹', '指甲轻划', '拳头轻碰'],
    intimacyScore: 15,
    tip: '整个手掌的温度，比指尖更温暖，也更让人安心',
  },
  {
    id: 3,
    name: '发丝轻拂',
    touchInstruction: '用手指轻轻拨开对方额前的一缕头发',
    guessHint: 'TA刚刚碰了你哪里？',
    bodyPart: '拨开额前头发',
    decoyOptions: ['摸了耳朵', '碰了脸颊', '点了鼻子'],
    intimacyScore: 20,
    tip: '拨开头发是约会中最自然又最暧昧的动作之一',
  },
  {
    id: 4,
    name: '耳畔低语',
    touchInstruction: '靠近对方耳边，轻轻吹一口气，然后说"猜猜我是谁"',
    guessHint: '你感觉到了什么？',
    bodyPart: '耳边吹气',
    decoyOptions: ['摸了脖子', '碰了耳朵', '亲了脸颊'],
    intimacyScore: 25,
    tip: '耳边的气息是最私密的感觉，距离在这一刻无限缩小',
  },
  {
    id: 5,
    name: '背后画心',
    touchInstruction: '让对方转过身，用手指在TA后背慢慢画一个爱心',
    guessHint: 'TA在你背后画了什么？',
    bodyPart: '爱心',
    decoyOptions: ['圆形', '三角形', '五角星'],
    intimacyScore: 30,
    tip: '背后的触碰让人充满期待和想象，这就是信任的力量',
  },
  {
    id: 6,
    name: '唇间糖果',
    touchInstruction: '把一颗糖果（或薄荷糖）放在自己唇边，让对方用嘴接过去',
    guessHint: '最后的挑战，你需要用最特别的方式接受TA的礼物',
    bodyPart: '唇间传糖',
    decoyOptions: ['手指喂食', '手心递糖', '肩膀放糖'],
    intimacyScore: 40,
    tip: '这是最终的信任测试——如果你们都准备好了，这将是最甜蜜的瞬间',
  },
]

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
  const [step, setStep] = useState<'intro' | 'invite' | 'touch' | 'guess' | 'correct' | 'wrong' | 'summary'>('intro')
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [selectedOption, setSelectedOption] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useLoad(() => {
    console.log('Blind touch game loaded.')
  })

  const currentRound = blindRounds[currentRoundIndex]

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

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
      setStep('correct')
    } else {
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
    clearTimer()
    setStep('intro')
    setCurrentRoundIndex(0)
    setTotalScore(0)
    setCorrectCount(0)
    setSelectedOption('')
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

  return (
    <View className="min-h-screen bg-gray-50 pb-8">
      {/* 顶部进度条 */}
      <View className="bg-white px-4 pt-2 pb-3 border-b border-gray-100">
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
                <Text className="block text-sm font-medium text-gray-700 mb-3">游戏规则</Text>
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
                  <Text className="text-sm text-amber-700 leading-relaxed">
                    核心魅力：闭上眼后，每一次触碰都会被放大。皮肤的每一寸都在专注感受对方——这就是信任的力量。
                  </Text>
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
                  "你相信吗？{'\n'}闭上眼睛之后，{'\n'}触碰会变得完全不同。{'\n'}{'\n'}我碰你，你来猜，{'\n'}猜对了有奖励哦。{'\n'}{'\n'}敢不敢闭眼试试？"
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
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center mb-3">
              <Text className="text-2xl">🙈</Text>
            </View>
            <Text className="block text-xs text-teal-500 font-medium mb-1">第 {currentRound.id} 轮 / 共 {blindRounds.length} 轮</Text>
            <Text className="block text-xl font-bold text-gray-900 mb-1">{currentRound.name}</Text>
            <Text className="block text-sm text-gray-400 mb-6">+{currentRound.intimacyScore} 亲密度</Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-5">
                <View className="flex flex-col items-center">
                  <View className="flex flex-row items-center mb-3">
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
                <HelpCircle size={18} color="white" />
                <Text className="text-white ml-2 font-medium">触碰完成，开始猜</Text>
              </View>
            </Button>
          </View>
        )}

        {/* 猜测阶段 */}
        {step === 'guess' && currentRound && (
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mb-3">
              <HelpCircle size={32} color="white" />
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
            <Text className="block text-5xl mb-3">{correctCount >= 3 ? '🫶' : '🤗'}</Text>
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
                <Text className="block text-sm font-medium text-gray-700 mb-3">挑战记录</Text>
                {blindRounds.map(round => (
                  <View key={round.id} className="flex flex-row items-center justify-between py-2">
                    <View className="flex flex-row items-center">
                      <Text className="text-sm text-gray-600 mr-2">第{round.id}轮</Text>
                      <Text className="text-sm text-gray-800">{round.name}</Text>
                    </View>
                    <Text className="text-xs text-teal-600">+{round.intimacyScore}</Text>
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
