import { useState, useRef, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Magnet, Sparkles, Check, ArrowRight, RotateCcw, Footprints } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

/** 距离等级 */
interface DistanceLevel {
  id: number
  name: string
  distance: string // 描述距离
  instruction: string // 具体动作
  duration: number // 保持秒数
  tip: string
  intimacyScore: number
}

const distanceLevels: DistanceLevel[] = [
  {
    id: 1,
    name: '面对面站立',
    distance: '1米',
    instruction: '两人面对面站立，保持约一臂距离，看着对方的眼睛5秒不说话',
    duration: 10,
    tip: '先从对视开始——很多人连5秒对视都觉得害羞，这就是第一步',
    intimacyScore: 10,
  },
  {
    id: 2,
    name: '臂弯之距',
    distance: '50cm',
    instruction: '向前迈一步，伸出手刚好能碰到对方肩膀的距离。双手自然下垂，再对视5秒',
    duration: 10,
    tip: '已经能闻到对方的气息了，你的心跳有没有加速？',
    intimacyScore: 15,
  },
  {
    id: 3,
    name: '肩并肩',
    distance: '0cm（侧面）',
    instruction: '侧身站到对方身边，肩膀轻轻相碰，一起往前走10步',
    duration: 15,
    tip: '肩并肩是最自然的靠近方式，像老朋友一样，身体会自动放松',
    intimacyScore: 20,
  },
  {
    id: 4,
    name: '背靠背',
    distance: '0cm（背面）',
    instruction: '背靠背站立，感受对方背部的温度和呼吸节奏，一起慢慢数到10',
    duration: 15,
    tip: '背靠背时，你能感受到对方的每一次呼吸，这种同步感很奇妙',
    intimacyScore: 25,
  },
  {
    id: 5,
    name: '环腰而立',
    distance: '拥抱距离',
    instruction: '一方双手轻轻环住对方的腰，另一方双手搭在对方肩上，保持10秒',
    duration: 15,
    tip: '如果对方轻轻收紧了手臂，说明TA也想再近一点',
    intimacyScore: 35,
  },
  {
    id: 6,
    name: '相拥而立',
    distance: '零距离',
    instruction: '自然地拥抱对方，感受彼此的心跳。如果可以，轻轻在耳边说一句你想说的话',
    duration: 20,
    tip: '最远的距离变成零距离，你们做到了。记住这个拥抱的温度',
    intimacyScore: 45,
  },
]

const DistancePage: FC = () => {
  const [step, setStep] = useState<'intro' | 'invite' | 'playing' | 'countdown' | 'completed' | 'summary'>('intro')
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0)
  const [completedLevels, setCompletedLevels] = useState<number[]>([])
  const [skippedLevels, setSkippedLevels] = useState<number[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useLoad(() => {
    console.log('Distance game loaded.')
  })

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const currentLevel = distanceLevels[currentLevelIndex]

  const handleStartRound = () => {
    setStep('playing')
  }

  const handleBeginCountdown = () => {
    setCountdown(currentLevel.duration)
    setStep('countdown')
    let remaining = currentLevel.duration
    timerRef.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = null
        setCountdown(0)
        setCompletedLevels(prev => [...prev, currentLevel.id])
        setSkippedLevels(prev => prev.filter(id => id !== currentLevel.id))
        setTotalScore(prev => prev + currentLevel.intimacyScore)
        setStep('completed')
      } else {
        setCountdown(remaining)
      }
    }, 1000)
  }

  const handleNext = () => {
    if (currentLevelIndex < distanceLevels.length - 1) {
      setCurrentLevelIndex(prev => prev + 1)
      setStep('playing')
    } else {
      setStep('summary')
    }
  }

  const handleSkip = () => {
    setSkippedLevels(prev => [...prev, currentLevel.id])
    handleNext()
  }

  const handleRetrySkipped = (levelId: number) => {
    const idx = distanceLevels.findIndex(l => l.id === levelId)
    if (idx >= 0) {
      setCurrentLevelIndex(idx)
      setStep('playing')
    }
  }

  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setStep('intro')
    setCurrentLevelIndex(0)
    setCompletedLevels([])
    setSkippedLevels([])
    setTotalScore(0)
    setCountdown(0)
  }

  const getProgressPercent = () => {
    return ((currentLevelIndex + (step === 'completed' || step === 'summary' ? 1 : 0)) / distanceLevels.length) * 100
  }

  const getSummaryTitle = () => {
    if (totalScore >= 140) return '零距离恋人'
    if (totalScore >= 90) return '越靠越近'
    if (totalScore >= 50) return '勇敢靠近'
    return '迈出第一步'
  }

  const getSummaryText = () => {
    if (totalScore >= 140) return '你们跨越了所有距离！从一米到零距离，每一步都是勇气的证明。这个拥抱，值得记住。'
    if (totalScore >= 90) return '你们已经很靠近了！身体比嘴巴更诚实——靠近就是最好的告白。'
    if (totalScore >= 50) return '每一次靠近都是一次勇敢。慢慢来，你们正在一步步走向彼此。'
    return '迈出第一步最难能可贵。感情不怕慢，只怕不肯靠近。'
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-8">
      {/* 顶部进度条 */}
      <View className="bg-white px-4 pt-2 pb-3 border-b border-gray-100">
        <View className="flex flex-row items-center justify-between mb-1">
          <Text className="text-xs text-gray-500">靠近进度</Text>
          <Text className="text-xs text-gray-500">{completedLevels.length}/{distanceLevels.length}</Text>
        </View>
        <Progress value={getProgressPercent()} className="h-2" />
      </View>

      <View className="p-4">
        {/* 游戏介绍 */}
        {step === 'intro' && (
          <View className="flex flex-col items-center">
            <View className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mb-4">
              <Magnet size={40} color="white" />
            </View>
            <Text className="block text-2xl font-bold text-gray-900 mb-2">距离挑战</Text>
            <Text className="block text-sm text-gray-500 mb-4 text-center leading-relaxed">
              渐进式靠近游戏{'\n'}从一米到零距离，用6步走进对方心里
            </Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm font-medium text-gray-700 mb-3">游戏规则</Text>
                <View className="space-y-2">
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-orange-600">1</Text>
                    </View>
                    <Text className="text-sm text-gray-600">共6个等级，从1米面对面到零距离拥抱</Text>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-orange-600">2</Text>
                    </View>
                    <Text className="text-sm text-gray-600">每级需要完成指定动作并保持一段时间</Text>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-orange-600">3</Text>
                    </View>
                    <Text className="text-sm text-gray-600">可以跳过不舒适的等级，按你们的节奏来</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card className="mb-6 w-full bg-amber-50 border-amber-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Sparkles size={16} color="#f59e0b" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-amber-700 leading-relaxed">
                    核心魅力：1米到0距离，每靠近一步，空气中的暧昧浓度就翻一倍。身体不会说谎。
                  </Text>
                </View>
              </CardContent>
            </Card>

            <Button
              className="bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-xl py-3 w-full"
              onClick={() => setStep('invite')}
            >
              <View className="flex flex-row items-center justify-center">
                <Magnet size={18} color="white" />
                <Text className="text-white ml-2 font-medium">邀请TA一起玩</Text>
              </View>
            </Button>
          </View>
        )}

        {/* 邀请话术 */}
        {step === 'invite' && (
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mb-4">
              <Sparkles size={32} color="#d97706" />
            </View>
            <Text className="block text-lg font-bold text-gray-900 mb-2">把手机递给TA</Text>
            <Text className="block text-sm text-gray-500 mb-6 text-center leading-relaxed">
              让TA看到这段话，如果愿意就点「好呀」
            </Text>

            <Card className="mb-6 w-full bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
              <CardContent className="py-5">
                <Text className="block text-base text-gray-800 leading-loose text-center font-medium">
                  “你有没有想过，{'\n'}从一米远到拥抱，{'\n'}需要走几步？{'\n'}{'\n'}我们来试试，{'\n'}每一步我都会等你，{'\n'}不想走了随时可以停。{'\n'}{'\n'}一起走吗？”
                </Text>
              </CardContent>
            </Card>

            <View className="w-full space-y-3">
              <Button
                className="bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-xl py-3 w-full"
                onClick={handleStartRound}
              >
                <View className="flex flex-row items-center justify-center">
                  <Footprints size={18} color="white" />
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

        {/* 当前等级说明 */}
        {step === 'playing' && currentLevel && (
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mb-3">
              <Text className="text-2xl">🧲</Text>
            </View>
            <View className="flex flex-row items-center mb-1">
              <Text className="block text-xs text-orange-500 font-medium mr-2">等级 {currentLevel.id}/{distanceLevels.length}</Text>
              <View className="px-2 py-1 rounded-full bg-orange-50">
                <Text className="text-xs text-orange-600">+{currentLevel.intimacyScore} 亲密度</Text>
              </View>
            </View>
            <Text className="block text-xl font-bold text-gray-900 mb-1">{currentLevel.name}</Text>
            <Text className="block text-sm text-gray-400 mb-6">距离：{currentLevel.distance}</Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-5">
                <View className="flex flex-col items-center">
                  <Text className="text-xs text-gray-500 mb-3">怎么做</Text>
                  <Text className="block text-base text-gray-800 text-center leading-relaxed font-medium">
                    {currentLevel.instruction}
                  </Text>
                </View>
              </CardContent>
            </Card>

            <Card className="mb-6 w-full bg-orange-50 border-orange-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Sparkles size={16} color="#d97706" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-orange-700 leading-relaxed">{currentLevel.tip}</Text>
                </View>
              </CardContent>
            </Card>

            <View className="w-full space-y-3">
              <Button
                className="bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-xl py-3 w-full"
                onClick={handleBeginCountdown}
              >
                <View className="flex flex-row items-center justify-center">
                  <Check size={18} color="white" />
                  <Text className="text-white ml-2 font-medium">就位了，开始计时 ({currentLevel.duration}s)</Text>
                </View>
              </Button>
              <Button
                variant="ghost"
                className="rounded-xl py-2 w-full"
                onClick={handleSkip}
              >
                <Text className="text-gray-400 text-sm">跳过这一级</Text>
              </Button>
            </View>
          </View>
        )}

        {/* 倒计时进行中 */}
        {step === 'countdown' && currentLevel && (
          <View className="flex flex-col items-center py-8">
            <Text className="block text-sm text-orange-500 font-medium mb-2">{currentLevel.name}</Text>
            <View className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mb-4">
              <Text className="block text-4xl font-bold text-white">{countdown}</Text>
            </View>
            <Text className="block text-sm text-gray-500 mb-2">保持姿势，感受彼此</Text>
            <Text className="block text-sm text-orange-500 italic text-center px-8">{currentLevel.tip}</Text>
          </View>
        )}

        {/* 单级完成 */}
        {step === 'completed' && currentLevel && (
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4">
              <Check size={32} color="white" />
            </View>
            <Text className="block text-lg font-semibold text-green-600 mb-1">靠近了一步！</Text>
            <Text className="block text-sm text-gray-500 mb-1">+{currentLevel.intimacyScore} 亲密度</Text>
            <Text className="block text-sm text-gray-400 mb-6">
              已完成 {completedLevels.length}/{distanceLevels.length} 级
            </Text>

            {currentLevelIndex < distanceLevels.length - 1 ? (
              <Button
                className="bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-xl py-3 w-full"
                onClick={handleNext}
              >
                <View className="flex flex-row items-center justify-center">
                  <ArrowRight size={18} color="white" />
                  <Text className="text-white ml-2 font-medium">下一步：{distanceLevels[currentLevelIndex + 1].name}</Text>
                </View>
              </Button>
            ) : (
              <Button
                className="bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-xl py-3 w-full"
                onClick={() => setStep('summary')}
              >
                <View className="flex flex-row items-center justify-center">
                  <Sparkles size={18} color="white" />
                  <Text className="text-white ml-2 font-medium">查看总结</Text>
                </View>
              </Button>
            )}
          </View>
        )}

        {/* 游戏总结 */}
        {step === 'summary' && (
          <View className="flex flex-col items-center">
            <Text className="block text-5xl mb-3">{totalScore >= 90 ? '🫂' : '💫'}</Text>
            <Text className="block text-2xl font-bold text-gray-900 mb-1">{getSummaryTitle()}</Text>
            <Text className="block text-sm text-gray-500 mb-6">亲密度 {totalScore} 分</Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm text-gray-700 leading-relaxed text-center">
                  {getSummaryText()}
                </Text>
              </CardContent>
            </Card>

            <Card className="mb-6 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm font-medium text-gray-700 mb-3">靠近记录</Text>
                {distanceLevels.map(level => {
                  const isCompleted = completedLevels.includes(level.id)
                  const isSkipped = skippedLevels.includes(level.id)
                  return (
                    <View key={level.id} className="flex flex-row items-center justify-between py-2">
                      <View className="flex flex-row items-center">
                        {isCompleted ? (
                          <View className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-2">
                            <Check size={12} color="#16a34a" />
                          </View>
                        ) : (
                          <View className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                            <Text className="text-xs text-gray-400">-</Text>
                          </View>
                        )}
                        <Text className={`text-sm ${isCompleted ? 'text-gray-700' : isSkipped ? 'text-amber-500' : 'text-gray-400'}`}>
                          Lv.{level.id} {level.name}
                        </Text>
                        {isSkipped && !isCompleted && (
                          <Text className="text-xs text-amber-400 ml-2">已跳过</Text>
                        )}
                      </View>
                      <Text className="text-xs text-gray-400">{level.distance}</Text>
                    </View>
                  )
                })}
                {skippedLevels.some(id => !completedLevels.includes(id)) && (
                  <View className="mt-3 pt-3 border-t border-gray-100">
                    <Text className="block text-xs text-gray-500 mb-2">补玩跳过的等级</Text>
                    <View className="flex flex-row flex-wrap gap-2">
                      {skippedLevels.filter(id => !completedLevels.includes(id)).map(id => {
                        const level = distanceLevels.find(l => l.id === id)
                        return level ? (
                          <Button
                            key={id}
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            onClick={() => handleRetrySkipped(id)}
                          >
                            <Text className="text-xs">Lv.{id} {level.name}</Text>
                          </Button>
                        ) : null
                      })}
                    </View>
                  </View>
                )}
              </CardContent>
            </Card>

            <Button
              className="bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-xl py-3 w-full"
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

export default DistancePage
