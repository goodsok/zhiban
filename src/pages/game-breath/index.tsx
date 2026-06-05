import { useState, useRef, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Wind, Sparkles, Check, ArrowRight, RotateCcw } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Network } from '@/network'

/** 呼吸阶段 */
interface BreathPhase {
  id: number
  name: string
  instruction: string // 动作指令
  breathGuide: string // 呼吸引导语
  duration: number // 本阶段持续秒数
  tip: string
  intimacyScore: number
}

const BreathPage: FC = () => {
  const [breathPhases, setBreathPhases] = useState<BreathPhase[]>([])
  const [step, setStep] = useState<'intro' | 'invite' | 'playing' | 'breathing' | 'completed' | 'summary'>('intro')
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [completedPhases, setCompletedPhases] = useState<number[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [breathText, setBreathText] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const breathTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const res = await Network.request({ url: '/api/game-data/content?gameKey=breath' })
        console.log('Breath game data response:', res.data)
        const apiData = res.data?.data
        if (Array.isArray(apiData) && apiData.length > 0 && apiData[0].content_data?.phases) {
          setBreathPhases(apiData[0].content_data.phases)
        }
      } catch (err) {
        console.error('Failed to fetch breath game data:', err)
      }
    }
    fetchGameData()
  }, [])

  useLoad(() => {
    console.log('Breath sync game loaded.')
  })

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (breathTimerRef.current) clearInterval(breathTimerRef.current)
    }
  }, [])

  const currentPhase = breathPhases[currentPhaseIndex]

  const handleStartPhase = () => {
    setStep('playing')
  }

  const handleBeginBreathing = () => {
    setCountdown(currentPhase.duration)
    setStep('breathing')
    let remaining = currentPhase.duration
    // 呼吸引导：吸气3秒 呼气3秒 交替
    let breathCycle = 0
    breathTimerRef.current = setInterval(() => {
      breathCycle += 1
      if (breathCycle % 6 < 3) {
        setBreathText('吸气...')
      } else {
        setBreathText('呼气...')
      }
    }, 1000)

    timerRef.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        if (breathTimerRef.current) clearInterval(breathTimerRef.current)
        setBreathText('')
        setCountdown(0)
        setCompletedPhases(prev => [...prev, currentPhase.id])
        setTotalScore(prev => prev + currentPhase.intimacyScore)
        setStep('completed')
      } else {
        setCountdown(remaining)
      }
    }, 1000)
  }

  const handleNext = () => {
    if (currentPhaseIndex < breathPhases.length - 1) {
      setCurrentPhaseIndex(prev => prev + 1)
      setStep('playing')
    } else {
      setStep('summary')
    }
  }

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (breathTimerRef.current) clearInterval(breathTimerRef.current)
    setStep('intro')
    setCurrentPhaseIndex(0)
    setCompletedPhases([])
    setTotalScore(0)
    setCountdown(0)
    setBreathText('')
  }

  const getProgressPercent = () => {
    return ((currentPhaseIndex + (step === 'completed' || step === 'summary' ? 1 : 0)) / breathPhases.length) * 100
  }

  const getSummaryTitle = () => {
    if (totalScore >= 140) return '呼吸同频'
    if (totalScore >= 90) return '心意相通'
    if (totalScore >= 50) return '渐入佳境'
    return '静心初探'
  }

  const getSummaryText = () => {
    if (totalScore >= 140) return '你们做到了呼吸合一！当两个人的呼吸完全同步，身体会分泌催产素——这就是"在一起的安心感"。记住这种宁静。'
    if (totalScore >= 90) return '你们的呼吸越来越同频了！呼吸同步是最深层的亲密——比拥抱更深，比接吻更安静。'
    if (totalScore >= 50) return '好的开始！呼吸同步需要时间，重要的是你们愿意为彼此安静下来。'
    return '能一起安静下来，本身就是一种默契。慢慢来，呼吸会带你们靠近。'
  }

  if (breathPhases.length === 0) {
    return (
      <View className="flex items-center justify-center h-screen" style={{ backgroundColor: '#F7F8FA' }}>
        <Text className="block text-gray-500">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen pb-8" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部进度条 */}
      <View className="bg-white px-4 pt-2 pb-3 border-b">
        <View className="flex flex-row items-center justify-between mb-1">
          <Text className="text-xs text-gray-500">同步进度</Text>
          <Text className="text-xs text-gray-500">{completedPhases.length}/{breathPhases.length}</Text>
        </View>
        <Progress value={getProgressPercent()} className="h-2" />
      </View>

      <View className="p-4">
        {/* 游戏介绍 */}
        {step === 'intro' && (
          <View className="flex flex-col items-center">
            <View className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-green-500 flex items-center justify-center mb-4">
              <Wind size={40} color="white" />
            </View>
            <Text className="block text-2xl font-bold text-gray-900 mb-2">呼吸同步</Text>
            <Text className="block text-sm text-gray-500 mb-4 text-center leading-relaxed">
              最安静的亲密游戏{'\n'}当呼吸同频，心跳也会慢慢靠近
            </Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm font-medium text-gray-700 mb-4">游戏规则</Text>
                <View className="space-y-2">
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-sky-600">1</Text>
                    </View>
                    <Text className="text-sm text-gray-600">共6个阶段，从各自呼吸到呼吸合一</Text>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-sky-600">2</Text>
                    </View>
                    <Text className="text-sm text-gray-600">跟随呼吸引导，慢慢和对方同步节奏</Text>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-sky-600">3</Text>
                    </View>
                    <Text className="text-sm text-gray-600">保持安静和专注，感受对方的存在</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card className="mb-6 w-full bg-amber-50 border-amber-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Sparkles size={16} color="#f59e0b" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-amber-700 leading-relaxed">
                    科学依据：当两个人呼吸同步时，心率也会趋于一致。这种生理共振会释放催产素，让你们感到安心和亲密。
                  </Text>
                </View>
              </CardContent>
            </Card>

            <Button
              className="bg-gradient-to-r from-teal-400 to-green-500 text-white rounded-xl py-3 w-full"
              onClick={() => setStep('invite')}
            >
              <View className="flex flex-row items-center justify-center">
                <Wind size={18} color="white" />
                <Text className="text-white ml-2 font-medium">邀请TA一起玩</Text>
              </View>
            </Button>
          </View>
        )}

        {/* 邀请话术 */}
        {step === 'invite' && (
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-4">
              <Sparkles size={32} color="#4f46e5" />
            </View>
            <Text className="block text-lg font-bold text-gray-900 mb-2">把手机递给TA</Text>
            <Text className="block text-sm text-gray-500 mb-6 text-center leading-relaxed">
              让TA看到这段话，如果愿意就点「好呀」
            </Text>

            <Card className="mb-6 w-full bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
              <CardContent className="py-5">
                <Text className="block text-base text-gray-800 leading-loose text-center font-medium">
                  &ldquo;你有没有试过，{'\n'}两个人什么也不做，{'\n'}只是安静地一起呼吸？{'\n'}{'\n'}听说呼吸同步的时候，{'\n'}心跳也会慢慢一致。{'\n'}{'\n'}想试试吗？&rdquo;
                </Text>
              </CardContent>
            </Card>

            <View className="w-full space-y-3">
              <Button
                className="bg-gradient-to-r from-teal-400 to-green-500 text-white rounded-xl py-3 w-full"
                onClick={handleStartPhase}
              >
                <View className="flex flex-row items-center justify-center">
                  <Wind size={18} color="white" />
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

        {/* 当前阶段说明 */}
        {step === 'playing' && currentPhase && (
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-4">
              <Text className="text-2xl">🌬️</Text>
            </View>
            <View className="flex flex-row items-center mb-1">
              <Text className="block text-xs text-sky-500 font-medium mr-2">阶段 {currentPhase.id}/{breathPhases.length}</Text>
              <View className="px-2 py-1 rounded-full bg-sky-50">
                <Text className="text-xs text-sky-600">+{currentPhase.intimacyScore} 亲密度</Text>
              </View>
            </View>
            <Text className="block text-xl font-bold text-gray-900 mb-1">{currentPhase.name}</Text>
            <Text className="block text-sm text-gray-400 mb-6">约 {currentPhase.duration} 秒</Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-5">
                <View className="flex flex-col items-center">
                  <Text className="text-xs text-gray-500 mb-4">怎么做</Text>
                  <Text className="block text-base text-gray-800 text-center leading-relaxed font-medium">
                    {currentPhase.instruction}
                  </Text>
                </View>
              </CardContent>
            </Card>

            <Card className="mb-6 w-full bg-sky-50 border-green-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Sparkles size={16} color="#0284c7" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-sky-700 leading-relaxed">{currentPhase.tip}</Text>
                </View>
              </CardContent>
            </Card>

            <View className="w-full space-y-3">
              <Button
                className="bg-gradient-to-r from-teal-400 to-green-500 text-white rounded-xl py-3 w-full"
                onClick={handleBeginBreathing}
              >
                <View className="flex flex-row items-center justify-center">
                  <Wind size={18} color="white" />
                  <Text className="text-white ml-2 font-medium">开始呼吸引导 ({currentPhase.duration}s)</Text>
                </View>
              </Button>
              <Button
                variant="ghost"
                className="rounded-xl py-2 w-full"
                onClick={() => {
                  if (currentPhaseIndex < breathPhases.length - 1) {
                    setCurrentPhaseIndex(prev => prev + 1)
                    setStep('playing')
                  } else {
                    setStep('summary')
                  }
                }}
              >
                <Text className="text-gray-400 text-sm">跳过这一阶段</Text>
              </Button>
            </View>
          </View>
        )}

        {/* 呼吸引导中 */}
        {step === 'breathing' && currentPhase && (
          <View className="flex flex-col items-center py-8">
            <Text className="block text-sm text-sky-500 font-medium mb-4">{currentPhase.name}</Text>
            <View className="w-36 h-36 rounded-full bg-gradient-to-br from-teal-400 to-green-500 flex items-center justify-center mb-4">
              <Text className="block text-3xl font-bold text-white">{countdown}</Text>
            </View>
            <Text className="block text-xl font-medium text-sky-600 mb-4">{breathText}</Text>
            <Text className="block text-sm text-gray-400 text-center px-8 italic">{currentPhase.tip}</Text>
          </View>
        )}

        {/* 单阶段完成 */}
        {step === 'completed' && currentPhase && (
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4">
              <Check size={32} color="white" />
            </View>
            <Text className="block text-lg font-semibold text-green-600 mb-1">同步成功！</Text>
            <Text className="block text-sm text-gray-500 mb-1">+{currentPhase.intimacyScore} 亲密度</Text>
            <Text className="block text-sm text-gray-400 mb-6">
              已完成 {completedPhases.length}/{breathPhases.length} 阶段
            </Text>

            {currentPhaseIndex < breathPhases.length - 1 ? (
              <Button
                className="bg-gradient-to-r from-teal-400 to-green-500 text-white rounded-xl py-3 w-full"
                onClick={handleNext}
              >
                <View className="flex flex-row items-center justify-center">
                  <ArrowRight size={18} color="white" />
                  <Text className="text-white ml-2 font-medium">下一阶段：{breathPhases[currentPhaseIndex + 1].name}</Text>
                </View>
              </Button>
            ) : (
              <Button
                className="bg-gradient-to-r from-teal-400 to-green-500 text-white rounded-xl py-3 w-full"
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
            <Text className="block text-5xl mb-4">{totalScore >= 90 ? '💞' : '🌙'}</Text>
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
                <Text className="block text-sm font-medium text-gray-700 mb-4">同步记录</Text>
                {breathPhases.map(phase => (
                  <View key={phase.id} className="flex flex-row items-center justify-between py-2">
                    <View className="flex flex-row items-center">
                      {completedPhases.includes(phase.id) ? (
                        <View className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-2">
                          <Check size={12} color="#16a34a" />
                        </View>
                      ) : (
                        <View className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                          <Text className="text-xs text-gray-400">-</Text>
                        </View>
                      )}
                      <Text className={`text-sm ${completedPhases.includes(phase.id) ? 'text-gray-700' : 'text-gray-400'}`}>
                        阶段{phase.id} {phase.name}
                      </Text>
                    </View>
                    <Text className="text-xs text-sky-600">+{phase.intimacyScore}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>

            <Button
              className="bg-gradient-to-r from-teal-400 to-green-500 text-white rounded-xl py-3 w-full"
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

export default BreathPage
