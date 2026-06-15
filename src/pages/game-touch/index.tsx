import { useState, useRef, useEffect } from 'react'
import CustomHeader from '@/components/custom-header'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Hand, Timer, Heart, ArrowRight, Check, RotateCcw, Sparkles } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Network } from '@/network'

/** 进挪等级：从低到高，循序渐进 */
interface TouchLevel {
  id: number
  name: string
  description: string
  instruction: string
  duration: number // 秒
  tip: string
  intimacyScore: number // 完成后获得的亲密度
}

const TouchPage: FC = () => {
  const [touchLevels, setTouchLevels] = useState<TouchLevel[]>([])
  const [step, setStep] = useState<'intro' | 'invite' | 'playing' | 'countdown' | 'completed' | 'summary'>('intro')
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0)
  const [completedLevels, setCompletedLevels] = useState<number[]>([])
  const [skippedLevels, setSkippedLevels] = useState<number[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchGameData = async () => {
    try {
      console.log('[Touch] Fetching game data from API...')
      const res = await Network.request({
        url: '/api/game-data/content?gameKey=touch',
        method: 'GET',
      })
      console.log('[Touch] Game data response:', res.data)
      const items = res.data?.data || []
      if (items.length > 0) {
        const d = items[0]?.content_data || {}
        const levels: TouchLevel[] = (d.levels || []).map((l: any) => ({
          id: l.id,
          name: l.name || '',
          description: l.description || '',
          instruction: l.instruction || '',
          duration: l.duration || 15,
          tip: l.tip || '',
          intimacyScore: l.intimacyScore || 10,
        }))
        if (levels.length > 0) setTouchLevels(levels)
      }
    } catch (err) {
      console.error('[Touch] Failed to fetch game data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGameData()
  }, [])

  useLoad(() => {
    console.log('Touch game loaded.')
  })

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const currentLevel = touchLevels[currentLevelIndex]

  const handleStart = () => {
    setStep('invite')
  }

  const handleInviteConfirm = () => {
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
    if (currentLevelIndex < touchLevels.length - 1) {
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
    const idx = touchLevels.findIndex(l => l.id === levelId)
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
    return ((currentLevelIndex + (step === 'completed' || step === 'summary' ? 1 : 0)) / touchLevels.length) * 100
  }

  const getSummaryTitle = () => {
    if (totalScore >= 150) return '心动巅峰'
    if (totalScore >= 100) return '亲密无间'
    if (totalScore >= 60) return '渐入佳境'
    return '初见温情'
  }

  const getSummaryEmoji = () => {
    if (totalScore >= 150) return '🔥'
    if (totalScore >= 100) return '💕'
    if (totalScore >= 60) return '✨'
    return '🌸'
  }

  const getSummaryText = () => {
    if (totalScore >= 150) return '你们已经完全打开了彼此的心门！这种深度的身体连接，是最真实的情感表达。'
    if (totalScore >= 100) return '你们之间的距离已经非常近了！每一次触碰都在拉近彼此的心灵。'
    if (totalScore >= 60) return '好的开始是成功的一半！你们正在逐步建立信任和亲密感，继续加油。'
    return '每一次触碰都是一次勇敢的尝试。慢慢来，温柔以待，感情需要时间升温。'
  }

  if (loading || touchLevels.length === 0) {
    return (
      <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="手心温度" />
        <View className="bg-gradient-to-r from-rose-400 to-pink-500 px-4 py-6">
          <Text className="block text-2xl font-bold text-white mb-2">手心温度</Text>
          <Text className="block text-sm text-gray-200">加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen pb-8" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部进度条 */}
      <View className="bg-white px-4 pt-2 pb-3 border-b">
        <View className="flex flex-row items-center justify-between mb-1">
          <Text className="text-xs text-gray-500">进挪进度</Text>
          <Text className="text-xs text-gray-500">{completedLevels.length}/{touchLevels.length}</Text>
        </View>
        <Progress value={getProgressPercent()} className="h-2" />
      </View>

      <View className="p-4">
        {/* 游戏介绍 */}
        {step === 'intro' && (
          <View className="flex flex-col items-center">
            <View className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mb-4">
              <Hand size={40} color="white" />
            </View>
            <Text className="block text-2xl font-bold text-gray-900 mb-2">手心温度</Text>
            <Text className="block text-sm text-gray-500 mb-4 text-center leading-relaxed">
              渐进式肢体接触游戏{'\n'}从指尖到心灵，一步步拉近彼此的距离
            </Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm font-medium text-gray-700 mb-4">游戏规则</Text>
                <View className="space-y-2">
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-rose-600">1</Text>
                    </View>
                    <Text className="text-sm text-gray-600">共{touchLevels.length}个等级，从轻触指尖到额头相抵</Text>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-rose-600">2</Text>
                    </View>
                    <Text className="text-sm text-gray-600">每个等级有倒计时，完成后解锁下一级</Text>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-rose-600">3</Text>
                    </View>
                    <Text className="text-sm text-gray-600">可以随时跳过不舒适的等级，尊重彼此的节奏</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card className="mb-6 w-full bg-amber-50 border-amber-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Sparkles size={16} color="#f59e0b" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-amber-700 leading-relaxed">
                    核心原则：尊重对方的边界。如果对方犹豫或不适，微笑着跳过即可，安全感才是最好的催化剂。
                  </Text>
                </View>
              </CardContent>
            </Card>

            <Button
              className="bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-xl py-3 w-full"
              onClick={handleStart}
            >
              <View className="flex flex-row items-center justify-center">
                <Heart size={18} color="white" />
                <Text className="text-white ml-2 font-medium">邀请TA一起玩</Text>
              </View>
            </Button>
          </View>
        )}

        {/* 邀请话术 */}
        {step === 'invite' && (
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mb-4">
              <Sparkles size={32} color="#f43f5e" />
            </View>
            <Text className="block text-lg font-bold text-gray-900 mb-2">把手机递给TA</Text>
            <Text className="block text-sm text-gray-500 mb-6 text-center leading-relaxed">
              让TA看到这段话，如果愿意就点「好呀」
            </Text>

            <Card className="mb-6 w-full bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100">
              <CardContent className="py-5">
                <Text className="block text-base text-gray-800 leading-loose text-center font-medium">
                  &ldquo;我想和你玩一个游戏，{'\n'}从指尖开始，{'\n'}慢慢感受彼此的温度。{'\n'}{'\n'}如果任何一步你觉得不舒服，{'\n'}我们可以随时停下来。{'\n'}{'\n'}愿意吗？&rdquo;
                </Text>
              </CardContent>
            </Card>

            <View className="w-full space-y-3">
              <Button
                className="bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-xl py-3 w-full"
                onClick={handleInviteConfirm}
              >
                <View className="flex flex-row items-center justify-center">
                  <Heart size={18} color="white" />
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
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mb-4">
              <Text className="text-2xl">🤲</Text>
            </View>
            <View className="flex flex-row items-center mb-1">
              <Text className="block text-xs text-rose-500 font-medium mr-2">等级 {currentLevel.id}/{touchLevels.length}</Text>
              <View className="px-2 py-1 rounded-full bg-rose-50">
                <Text className="text-xs text-rose-600">+{currentLevel.intimacyScore} 亲密度</Text>
              </View>
            </View>
            <Text className="block text-xl font-bold text-gray-900 mb-1">{currentLevel.name}</Text>
            <Text className="block text-sm text-gray-400 mb-6">{currentLevel.description}</Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-5">
                <View className="flex flex-col items-center">
                  <Text className="text-xs text-gray-500 mb-4">怎么做</Text>
                  <Text className="block text-base text-gray-800 text-center leading-relaxed font-medium">
                    {currentLevel.instruction}
                  </Text>
                </View>
              </CardContent>
            </Card>

            <Card className="mb-6 w-full bg-pink-50 border-pink-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Heart size={16} color="#ec4899" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-pink-700 leading-relaxed">{currentLevel.tip}</Text>
                </View>
              </CardContent>
            </Card>

            <View className="w-full space-y-3">
              <Button
                className="bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-xl py-3 w-full"
                onClick={handleBeginCountdown}
              >
                <View className="flex flex-row items-center justify-center">
                  <Timer size={18} color="white" />
                  <Text className="text-white ml-2 font-medium">开始计时 ({currentLevel.duration}s)</Text>
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
            <Text className="block text-sm text-rose-500 font-medium mb-2">{currentLevel.name}</Text>
            <View className="w-32 h-32 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mb-4">
              <Text className="block text-4xl font-bold text-white">{countdown}</Text>
            </View>
            <Text className="block text-sm text-gray-500 mb-2">保持触碰，享受这一刻</Text>
            <Text className="block text-sm text-pink-500 italic text-center px-8">{currentLevel.tip}</Text>
          </View>
        )}

        {/* 单级完成 */}
        {step === 'completed' && currentLevel && (
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4">
              <Check size={32} color="white" />
            </View>
            <Text className="block text-lg font-semibold text-green-600 mb-1">完成！</Text>
            <Text className="block text-sm text-gray-500 mb-1">+{currentLevel.intimacyScore} 亲密度</Text>
            <Text className="block text-sm text-gray-400 mb-6">
              已完成 {completedLevels.length}/{touchLevels.length} 级
            </Text>

            {currentLevelIndex < touchLevels.length - 1 ? (
              <Button
                className="bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-xl py-3 w-full"
                onClick={handleNext}
              >
                <View className="flex flex-row items-center justify-center">
                  <ArrowRight size={18} color="white" />
                  <Text className="text-white ml-2 font-medium">下一级：{touchLevels[currentLevelIndex + 1].name}</Text>
                </View>
              </Button>
            ) : (
              <Button
                className="bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-xl py-3 w-full"
                onClick={() => setStep('summary')}
              >
                <View className="flex flex-row items-center justify-center">
                  <Heart size={18} color="white" />
                  <Text className="text-white ml-2 font-medium">查看总结</Text>
                </View>
              </Button>
            )}
          </View>
        )}

        {/* 游戏总结 */}
        {step === 'summary' && (
          <View className="flex flex-col items-center">
            <Text className="block text-5xl mb-4">{getSummaryEmoji()}</Text>
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
                <Text className="block text-sm font-medium text-gray-700 mb-4">完成记录</Text>
                {touchLevels.map(level => {
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
                      {isCompleted && (
                        <Text className="text-xs text-rose-500">+{level.intimacyScore}</Text>
                      )}
                    </View>
                  )
                })}
                {skippedLevels.some(id => !completedLevels.includes(id)) && (
                  <View className="mt-3 pt-3 border-t">
                    <Text className="block text-xs text-gray-500 mb-2">补玩跳过的等级</Text>
                    <View className="flex flex-row flex-wrap gap-3">
                      {skippedLevels.filter(id => !completedLevels.includes(id)).map(id => {
                        const level = touchLevels.find(l => l.id === id)
                        return level ? (
                          <Button
                            key={id}
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
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
              variant="secondary"
              className="rounded-xl py-3 w-full"
              onClick={handleReset}
            >
              <View className="flex flex-row items-center justify-center">
                <RotateCcw size={18} color="#6b7280" />
                <Text className="ml-2">再来一次</Text>
              </View>
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}

export default TouchPage
