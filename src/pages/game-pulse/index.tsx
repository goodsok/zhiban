import { useState, useRef, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { RotateCcw, Check, ArrowRight, Sparkles, Timer, HeartPulse } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Network } from '@/network'

/**
 * 心跳同步游戏
 * 通过测量和比较心跳，利用"靠近会增加心跳"的生理原理，
 * 自然创造亲密接触和靠近的机会。
 */

interface ProximityChallenge {
  id: number
  name: string
  description: string
  instruction: string
  duration: number
  intensity: 'calm' | 'warm' | 'hot' | 'burning'
  tip: string
}

const PulsePage: FC = () => {
  const [proximityChallenges, setProximityChallenges] = useState<ProximityChallenge[]>([])
  const [step, setStep] = useState<'intro' | 'invite' | 'measure' | 'counting' | 'input' | 'result' | 'summary'>('intro')
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [personABeats, setPersonABeats] = useState('')
  const [personBBeats, setPersonBBeats] = useState('')
  const [measurements, setMeasurements] = useState<Array<{
    challengeId: number
    challengeName: string
    aBeats: number
    bBeats: number
    intensity: string
  }>>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const res = await Network.request({ url: '/api/game-data/content?gameKey=pulse' })
        console.log('Pulse game data response:', res.data)
        const apiData = res.data?.data
        if (Array.isArray(apiData) && apiData.length > 0 && apiData[0].content_data?.challenges) {
          setProximityChallenges(apiData[0].content_data.challenges)
        }
      } catch (err) {
        console.error('Failed to fetch pulse game data:', err)
      }
    }
    fetchGameData()
  }, [])

  useLoad(() => {
    console.log('Pulse game loaded.')
  })

  const currentChallenge = proximityChallenges[currentChallengeIndex]

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleStartMeasure = () => {
    setCountdown(currentChallenge.duration)
    setStep('counting')
    let remaining = currentChallenge.duration
    timerRef.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        clearTimer()
        setCountdown(0)
        setStep('input')
      } else {
        setCountdown(remaining)
      }
    }, 1000)
  }

  const handleSubmitBeats = () => {
    const aBeatsNum = parseInt(personABeats) || 0
    const bBeatsNum = parseInt(personBBeats) || 0
    if (aBeatsNum < 1 || bBeatsNum < 1) return
    const aBpm = Math.round(aBeatsNum * (60 / currentChallenge.duration))
    const bBpm = Math.round(bBeatsNum * (60 / currentChallenge.duration))
    setMeasurements(prev => [...prev, {
      challengeId: currentChallenge.id,
      challengeName: currentChallenge.name,
      aBeats: aBpm,
      bBeats: bBpm,
      intensity: currentChallenge.intensity,
    }])
    setPersonABeats('')
    setPersonBBeats('')
    setStep('result')
  }

  const handleNext = () => {
    if (currentChallengeIndex < proximityChallenges.length - 1) {
      setCurrentChallengeIndex(prev => prev + 1)
      setStep('measure')
    } else {
      setStep('summary')
    }
  }

  const handleReset = () => {
    clearTimer()
    setStep('intro')
    setCurrentChallengeIndex(0)
    setCountdown(0)
    setPersonABeats('')
    setPersonBBeats('')
    setMeasurements([])
  }

  const getIntensityEmoji = (intensity: string) => {
    switch (intensity) {
      case 'calm': return '🧊'
      case 'warm': return '🌤️'
      case 'hot': return '🔥'
      case 'burning': return '💥'
      default: return '🧊'
    }
  }

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'calm': return 'bg-blue-100 text-blue-600'
      case 'warm': return 'bg-amber-100 text-amber-600'
      case 'hot': return 'bg-orange-100 text-orange-600'
      case 'burning': return 'bg-red-100 text-red-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getIntensityLabel = (intensity: string) => {
    switch (intensity) {
      case 'calm': return '平静'
      case 'warm': return '升温'
      case 'hot': return '火热'
      case 'burning': return '灼热'
      default: return ''
    }
  }

  const getOverallVerdict = () => {
    if (measurements.length < 2) return { emoji: '🧊', text: '还没开始升温呢' }
    const baseline = measurements[0]
    const latest = measurements[measurements.length - 1]
    const aChange = latest.aBeats - baseline.aBeats
    const bChange = latest.bBeats - baseline.bBeats
    const avgChange = (aChange + bChange) / 2

    if (avgChange >= 20) return { emoji: '💥', text: '心跳飙升！你们对彼此的吸引力已经无法掩饰了！' }
    if (avgChange >= 12) return { emoji: '🔥', text: '心跳明显加速！身体比嘴巴诚实多了。' }
    if (avgChange >= 5) return { emoji: '🌤️', text: '有心跳变化！对方正在对你产生感觉。' }
    return { emoji: '😌', text: '心跳平稳，也许TA很淡定，也许TA在努力控制。' }
  }

  if (proximityChallenges.length === 0) {
    return (
      <View className="flex items-center justify-center h-screen" style={{ backgroundColor: '#F7F8FA' }}>
        <Text className="block text-gray-500">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen pb-8" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部进度 */}
      <View className="bg-white px-4 pt-2 pb-3 border-b">
        <View className="flex flex-row items-center justify-between mb-1">
          <Text className="text-xs text-gray-500">
            {step === 'intro' ? '准备开始' : `挑战 ${currentChallengeIndex + 1}/${proximityChallenges.length}`}
          </Text>
          {step !== 'intro' && currentChallenge && (
            <View className={`px-2 py-1 rounded-full ${getIntensityColor(currentChallenge.intensity)}`}>
              <Text className="text-xs">{getIntensityLabel(currentChallenge.intensity)}</Text>
            </View>
          )}
        </View>
        <Progress
          value={step === 'intro' ? 0 : ((currentChallengeIndex + (step === 'result' || step === 'summary' ? 1 : 0)) / proximityChallenges.length) * 100}
          className="h-2"
        />
      </View>

      <View className="p-4">
        {/* 游戏介绍 */}
        {step === 'intro' && (
          <View className="flex flex-col items-center">
            <View className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center mb-4">
              <HeartPulse size={40} color="white" />
            </View>
            <Text className="block text-2xl font-bold text-gray-900 mb-2">心跳同步</Text>
            <Text className="block text-sm text-gray-500 mb-4 text-center leading-relaxed">
              测量靠近时的心跳变化{'\n'}身体不会说谎，心跳是最好的答案
            </Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm font-medium text-gray-700 mb-4">游戏规则</Text>
                <View className="space-y-2">
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-rose-600">1</Text>
                    </View>
                    <Text className="text-sm text-gray-600">先测量两人平静时的心跳作为基线</Text>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-rose-600">2</Text>
                    </View>
                    <Text className="text-sm text-gray-600">通过6个递进挑战，逐渐增加身体接触</Text>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-rose-600">3</Text>
                    </View>
                    <Text className="text-sm text-gray-600">每轮测量30秒脉搏数，观察靠近后心跳是否加速</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card className="mb-4 w-full bg-rose-50 border-rose-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <HeartPulse size={16} color="#e11d48" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-rose-700 leading-relaxed">
                    科学依据：当人面对喜欢的人靠近时，肾上腺素分泌增加，心跳会不自觉加速——这是身体最诚实的反应。
                  </Text>
                </View>
              </CardContent>
            </Card>

            <Card className="mb-6 w-full bg-amber-50 border-amber-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Sparkles size={16} color="#f59e0b" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-amber-700 leading-relaxed">
                    测量方法：将食指和中指搭在对方手腕内侧（拇指下方），感受脉搏跳动，默数30秒内跳动的次数。
                  </Text>
                </View>
              </CardContent>
            </Card>

            <Button
              className="bg-gradient-to-r from-red-400 to-rose-500 text-white rounded-xl py-3 w-full"
              onClick={() => setStep('invite')}
            >
              <View className="flex flex-row items-center justify-center">
                <HeartPulse size={18} color="white" />
                <Text className="text-white ml-2 font-medium">邀请TA一起玩</Text>
              </View>
            </Button>
          </View>
        )}

        {/* 邀请话术 */}
        {step === 'invite' && (
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-red-100 flex items-center justify-center mb-4">
              <Sparkles size={32} color="#e11d48" />
            </View>
            <Text className="block text-lg font-bold text-gray-900 mb-2">把手机递给TA</Text>
            <Text className="block text-sm text-gray-500 mb-6 text-center leading-relaxed">
              让TA看到这段话，如果愿意就点「好呀」
            </Text>

            <Card className="mb-6 w-full bg-gradient-to-br from-rose-50 to-red-50 border-rose-100">
              <CardContent className="py-5">
                <Text className="block text-base text-gray-800 leading-loose text-center font-medium">
                  &ldquo;你知道吗？{'\n'}靠近喜欢的人时，{'\n'}心跳会不自觉地加速。{'\n'}{'\n'}我们来验证一下？{'\n'}你摸我的脉搏，我摸你的，{'\n'}看看谁先&#39;露馅&#39;。{'\n'}{'\n'}敢试试吗？&rdquo;
                </Text>
              </CardContent>
            </Card>

            <View className="w-full space-y-3">
              <Button
                className="bg-gradient-to-r from-red-400 to-rose-500 text-white rounded-xl py-3 w-full"
                onClick={() => setStep('measure')}
              >
                <View className="flex flex-row items-center justify-center">
                  <HeartPulse size={18} color="white" />
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

        {/* 挑战说明 */}
        {step === 'measure' && currentChallenge && (
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-red-100 flex items-center justify-center mb-4">
              <Text className="text-2xl">{getIntensityEmoji(currentChallenge.intensity)}</Text>
            </View>
            <Text className="block text-xl font-bold text-gray-900 mb-1">{currentChallenge.name}</Text>
            <Text className="block text-sm text-gray-400 mb-6">{currentChallenge.description}</Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-5">
                <View className="flex flex-col items-center">
                  <Text className="text-xs text-gray-500 mb-4">怎么做</Text>
                  <Text className="block text-base text-gray-800 text-center leading-relaxed font-medium">
                    {currentChallenge.instruction}
                  </Text>
                  <View className="flex flex-row items-center mt-3">
                    <Timer size={14} color="#9ca3af" />
                    <Text className="text-xs text-gray-400 ml-1">测量 {currentChallenge.duration} 秒</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card className="mb-6 w-full bg-rose-50 border-rose-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Sparkles size={16} color="#e11d48" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-rose-700 leading-relaxed">{currentChallenge.tip}</Text>
                </View>
              </CardContent>
            </Card>

            <View className="w-full space-y-3">
              <Button
                className="bg-gradient-to-r from-red-400 to-rose-500 text-white rounded-xl py-3 w-full"
                onClick={handleStartMeasure}
              >
                <View className="flex flex-row items-center justify-center">
                  <Timer size={18} color="white" />
                  <Text className="text-white ml-2 font-medium">开始计时 ({currentChallenge.duration}s)</Text>
                </View>
              </Button>
              {currentChallengeIndex > 0 && (
                <Button
                  variant="ghost"
                  className="rounded-xl py-2 w-full"
                  onClick={() => {
                    setPersonABeats('')
                    setPersonBBeats('')
                    setStep('input')
                  }}
                >
                  <Text className="text-gray-400 text-sm">跳过计时，直接记录</Text>
                </Button>
              )}
            </View>
          </View>
        )}

        {/* 倒计时中 */}
        {step === 'counting' && currentChallenge && (
          <View className="flex flex-col items-center py-8">
            <Text className="block text-sm text-rose-500 font-medium mb-2">{currentChallenge.name}</Text>
            <View className="w-32 h-32 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center mb-4">
              <Text className="block text-4xl font-bold text-white">{countdown}</Text>
            </View>
            <Text className="block text-sm text-gray-500 mb-2">默数对方脉搏跳动次数</Text>
            <Text className="block text-sm text-rose-500 mb-4">专注于感受对方的心跳...</Text>
            <Card className="w-full bg-rose-50 border-rose-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Sparkles size={14} color="#e11d48" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-xs text-rose-600 leading-relaxed">
                    {currentChallenge.instruction}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* 输入心跳数 */}
        {step === 'input' && currentChallenge && (
          <View className="flex flex-col items-center">
            <Text className="block text-lg font-semibold text-gray-900 mb-2">记录心跳数据</Text>
            <Text className="block text-xs text-gray-400 mb-4 text-center leading-relaxed">
              A 数 B 的脉搏跳动次数，B 数 A 的脉搏跳动次数
            </Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm font-medium text-gray-700 mb-2">A 感受到 B 的脉搏次数（{currentChallenge.duration}秒）</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <input
                    type="number"
                    className="w-full bg-transparent text-2xl font-bold text-center text-gray-800"
                    placeholder="输入次数（至少1）"
                    value={personABeats}
                    onChange={(e) => setPersonABeats((e as React.ChangeEvent<HTMLInputElement>).target.value)}
                  />
                </View>
              </CardContent>
            </Card>

            <Card className="mb-6 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm font-medium text-gray-700 mb-2">B 感受到 A 的脉搏次数（{currentChallenge.duration}秒）</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3">
                  <input
                    type="number"
                    className="w-full bg-transparent text-2xl font-bold text-center text-gray-800"
                    placeholder="输入次数（至少1）"
                    value={personBBeats}
                    onChange={(e) => setPersonBBeats((e as React.ChangeEvent<HTMLInputElement>).target.value)}
                  />
                </View>
              </CardContent>
            </Card>

            <Button
              className="bg-gradient-to-r from-red-400 to-rose-500 text-white rounded-xl py-3 w-full"
              onClick={handleSubmitBeats}
              disabled={!personABeats || !personBBeats || (parseInt(personABeats) || 0) < 1 || (parseInt(personBBeats) || 0) < 1}
            >
              <View className="flex flex-row items-center justify-center">
                <Check size={18} color="white" />
                <Text className="text-white ml-2 font-medium">记录数据</Text>
              </View>
            </Button>
          </View>
        )}

        {/* 单轮结果 */}
        {step === 'result' && measurements.length > 0 && (
          <View className="flex flex-col items-center">
            {(() => {
              const latest = measurements[measurements.length - 1]
              const baseline = measurements[0]
              const aChange = latest.aBeats - baseline.aBeats
              const bChange = latest.bBeats - baseline.bBeats
              return (
                <>
                  <Text className="block text-3xl mb-4">{getIntensityEmoji(latest.intensity)}</Text>
                  <Text className="block text-lg font-bold text-gray-900 mb-1">{latest.challengeName} 数据</Text>
                  <Text className="block text-sm text-gray-400 mb-4">对比基线变化</Text>

                  <View className="w-full flex flex-row gap-4 mb-4">
                    <Card className="flex-1">
                      <CardContent className="py-4">
                        <View className="flex flex-col items-center">
                          <Text className="text-xs text-gray-500 mb-1">A 的心率</Text>
                          <Text className="block text-2xl font-bold text-gray-900">{latest.aBeats}</Text>
                          <Text className="block text-xs text-gray-400">BPM</Text>
                          {measurements.length > 1 && (
                            <Text className={`block text-sm font-medium mt-1 ${aChange > 0 ? 'text-rose-500' : 'text-blue-500'}`}>
                              {aChange > 0 ? '↑' : '↓'} {Math.abs(aChange)} BPM
                            </Text>
                          )}
                        </View>
                      </CardContent>
                    </Card>
                    <Card className="flex-1">
                      <CardContent className="py-4">
                        <View className="flex flex-col items-center">
                          <Text className="text-xs text-gray-500 mb-1">B 的心率</Text>
                          <Text className="block text-2xl font-bold text-gray-900">{latest.bBeats}</Text>
                          <Text className="block text-xs text-gray-400">BPM</Text>
                          {measurements.length > 1 && (
                            <Text className={`block text-sm font-medium mt-1 ${bChange > 0 ? 'text-rose-500' : 'text-blue-500'}`}>
                              {bChange > 0 ? '↑' : '↓'} {Math.abs(bChange)} BPM
                            </Text>
                          )}
                        </View>
                      </CardContent>
                    </Card>
                  </View>

                  {measurements.length > 1 && (aChange > 5 || bChange > 5) && (
                    <Card className="mb-4 w-full bg-rose-50 border-rose-100">
                      <CardContent className="py-3">
                        <View className="flex flex-row items-start">
                          <HeartPulse size={16} color="#e11d48" className="mr-2 mt-1 flex-shrink-0" />
                          <Text className="text-sm text-rose-700 leading-relaxed">
                            心跳加速了！{(aChange > 5 && bChange > 5) ? '两人都在加速，这可是双向的信号！' : aChange > 5 ? 'A 的心跳明显加快了，身体在替TA表白！' : 'B 的心跳明显加快了，TA 对你有感觉！'}
                          </Text>
                        </View>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    className="bg-gradient-to-r from-red-400 to-rose-500 text-white rounded-xl py-3 w-full"
                    onClick={handleNext}
                  >
                    <View className="flex flex-row items-center justify-center">
                      <ArrowRight size={18} color="white" />
                      <Text className="text-white ml-2 font-medium">
                        {currentChallengeIndex < proximityChallenges.length - 1
                          ? `下一挑战：${proximityChallenges[currentChallengeIndex + 1].name}`
                          : '查看总结'}
                      </Text>
                    </View>
                  </Button>
                </>
              )
            })()}
          </View>
        )}

        {/* 游戏总结 */}
        {step === 'summary' && (
          <View className="flex flex-col items-center">
            {(() => {
              const verdict = getOverallVerdict()
              return (
                <>
                  <Text className="block text-5xl mb-4">{verdict.emoji}</Text>
                  <Text className="block text-xl font-bold text-gray-900 mb-2">心跳报告</Text>
                  <Card className="mb-4 w-full">
                    <CardContent className="py-4">
                      <Text className="block text-sm text-gray-700 text-center leading-relaxed">
                        {verdict.text}
                      </Text>
                    </CardContent>
                  </Card>
                </>
              )
            })()}

            <Card className="mb-6 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm font-medium text-gray-700 mb-4">心跳变化曲线</Text>
                {measurements.map((m, idx) => (
                  <View key={idx} className="flex flex-row items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <View className="flex flex-row items-center flex-1">
                      <Text className="mr-2">{getIntensityEmoji(m.intensity)}</Text>
                      <Text className="text-sm text-gray-700">{m.challengeName}</Text>
                    </View>
                    <View className="flex flex-row items-center gap-4">
                      <View className="flex flex-row items-center">
                        <Text className="text-xs text-gray-400">A</Text>
                        <Text className="text-sm font-medium text-gray-900 ml-1">{m.aBeats}</Text>
                      </View>
                      <View className="flex flex-row items-center">
                        <Text className="text-xs text-gray-400">B</Text>
                        <Text className="text-sm font-medium text-gray-900 ml-1">{m.bBeats}</Text>
                      </View>
                    </View>
                  </View>
                ))}
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

export default PulsePage
