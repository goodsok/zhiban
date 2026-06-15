import { useState, useRef, useEffect } from 'react'
import CustomHeader from '@/components/custom-header'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { RotateCcw, ArrowRight, Sparkles, Timer } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Network } from '@/network'

/**
 * 双人镜像游戏
 * 一人做动作，另一人模仿，角色交替。
 * 动作从简单的表情逐渐过渡到肢体动作，自然创造接触机会。
 */

interface MirrorAction {
  id: string
  text: string
  bodyPart: string // 涉及的身体部位标签
  difficulty: number // 1-3
  touchLevel: 'none' | 'light' | 'close' // 是否涉及接触
  hint: string // 给"镜子"的提示
}

const MirrorPage: FC = () => {
  const [actionSets, setActionSets] = useState<MirrorAction[][]>([])
  const [step, setStep] = useState<'intro' | 'invite' | 'playing' | 'scoring' | 'result'>('intro')
  const [currentRound, setCurrentRound] = useState(0) // 0-3
  const [currentActionIndex, setCurrentActionIndex] = useState(0)
  const [isLeaderA, setIsLeaderA] = useState(true) // A是领动者
  const [scores, setScores] = useState<Array<{ total: number; aScore: number; bScore: number }>>([]) // 每轮得分
  const roundScoreRef = useRef(0)
  const leaderScoresRef = useRef({ aScore: 0, bScore: 0 })
  const [actionTimer, setActionTimer] = useState(10)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const res = await Network.request({ url: '/api/game-data/content?gameKey=mirror' })
        console.log('Mirror game data response:', res.data)
        const apiData = res.data?.data
        if (Array.isArray(apiData) && apiData.length > 0 && apiData[0].content_data?.actionSets) {
          setActionSets(apiData[0].content_data.actionSets)
        }
      } catch (err) {
        console.error('Failed to fetch mirror game data:', err)
      }
    }
    fetchGameData()
  }, [])

  useLoad(() => {
    console.log('Mirror game loaded.')
  })

  const currentActionSet = actionSets[currentRound]
  const currentAction = currentActionSet?.[currentActionIndex]

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleStart = () => {
    setStep('invite')
  }

  const handleInviteConfirm = () => {
    setStep('playing')
    setActionTimer(10)
  }

  const startActionTimer = () => {
    clearTimer()
    let remaining = 10
    setActionTimer(remaining)
    timerRef.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        clearTimer()
        setActionTimer(0)
        // 时间到自动进入评分
      } else {
        setActionTimer(remaining)
      }
    }, 1000)
  }

  // 进入下一个动作
  const handleNextAction = () => {
    clearTimer()
    if (!currentActionSet) return
    if (currentActionIndex < currentActionSet.length - 1) {
      setCurrentActionIndex(currentActionIndex + 1)
      setActionTimer(10)
    } else {
      // 本轮结束，进入评分
      setStep('scoring')
    }
  }

  const handleScore = (score: number) => {
    roundScoreRef.current += score
    if (isLeaderA) {
      leaderScoresRef.current.aScore += score
    } else {
      leaderScoresRef.current.bScore += score
    }
  }

  const handleScoringDone = () => {
    setScores(prev => [...prev, {
      total: roundScoreRef.current,
      aScore: leaderScoresRef.current.aScore,
      bScore: leaderScoresRef.current.bScore,
    }])
    roundScoreRef.current = 0
    leaderScoresRef.current = { aScore: 0, bScore: 0 }
    setIsLeaderA(prev => !prev) // 切换领动者
    setCurrentActionIndex(0)
    if (currentRound < actionSets.length - 1) {
      setCurrentRound(prev => prev + 1)
      setStep('playing')
      setActionTimer(10)
    } else {
      setStep('result')
    }
  }

  const handleReset = () => {
    setStep('intro')
    setCurrentRound(0)
    setCurrentActionIndex(0)
    setIsLeaderA(true)
    setScores([])
    roundScoreRef.current = 0
    leaderScoresRef.current = { aScore: 0, bScore: 0 }
  }

  useEffect(() => {
    if (step === 'playing' && currentAction) {
      startActionTimer()
    }
    return () => clearTimer()
  }, [step, currentActionIndex, currentRound])

  const getRoundName = (idx: number) => {
    const names = ['表情模仿', '手势模仿', '上半身动作', '互动动作']
    return names[idx] || `第${idx + 1}轮`
  }

  const getRoundEmoji = (idx: number) => {
    const emojis = ['😊', '👋', '🤸', '🤝']
    return emojis[idx] || '🎯'
  }

  const getTotalScore = scores.reduce((a, s) => a + s.total, 0)
  const getMaxScore = actionSets.reduce((a, set) => a + set.length * 3, 0)

  const getResultText = () => {
    const ratio = getMaxScore > 0 ? getTotalScore / getMaxScore : 0
    if (ratio >= 0.8) return '默契十足！你们的镜像同步率超高，是天生的灵魂搭档！'
    if (ratio >= 0.6) return '默契不错！虽然有时节奏不太一致，但你们已经很合拍了！'
    if (ratio >= 0.4) return '还在磨合中～继续练习，你们会越来越有默契的！'
    return '还需要更多互动哦～不过没关系，重要的不是分数，而是一起玩的快乐！'
  }

  if (actionSets.length === 0) {
    return (
      <View className="flex items-center justify-center h-screen bg-gradient-to-b from-violet-50 to-purple-50">
      <CustomHeader title="双人镜像" />
        <Text className="block text-gray-500">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-violet-50 to-purple-50">
      {/* Intro */}
      {step === 'intro' && (
        <View className="flex flex-col items-center px-6 py-12">
          <View className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center mb-6">
            <Sparkles size={36} color="#fff" />
          </View>
          <Text className="block text-2xl font-bold text-gray-800 mb-3">双人镜像</Text>
          <Text className="block text-base text-gray-500 text-center mb-8 leading-relaxed">
            一人领动一人模仿，从表情到手势再到肢体互动，在模仿中自然靠近彼此。
          </Text>
          <Card className="w-full mb-6">
            <CardContent className="py-4">
              <Text className="block text-sm font-medium text-gray-700 mb-3">游戏规则</Text>
              <View className="flex flex-row items-start mb-2">
                <Text className="block text-violet-500 mr-2">1.</Text>
                <Text className="block text-sm text-gray-600">A做动作，B模仿，每轮4个动作</Text>
              </View>
              <View className="flex flex-row items-start mb-2">
                <Text className="block text-violet-500 mr-2">2.</Text>
                <Text className="block text-sm text-gray-600">模仿完毕后互相评分（1-3分）</Text>
              </View>
              <View className="flex flex-row items-start">
                <Text className="block text-violet-500 mr-2">3.</Text>
                <Text className="block text-sm text-gray-600">4轮结束后看总默契分</Text>
              </View>
            </CardContent>
          </Card>
          <Button className="rounded-xl py-3 px-8" onClick={handleStart}>
            <View className="flex flex-row items-center">
              <Text>开始游戏</Text>
              <ArrowRight size={18} color="#fff" className="ml-2" />
            </View>
          </Button>
        </View>
      )}

      {/* Invite */}
      {step === 'invite' && (
        <View className="flex flex-col items-center px-6 py-12">
          <Text className="block text-xl font-bold text-gray-800 mb-4">邀请对方</Text>
          <Text className="block text-base text-gray-500 text-center mb-8">
            请把手机递给对方，告诉TA你要玩双人镜像游戏～
          </Text>
          <Button className="rounded-xl py-3 px-8" onClick={handleInviteConfirm}>
            <Text>对方已准备好</Text>
          </Button>
        </View>
      )}

      {/* Playing */}
      {step === 'playing' && currentAction && (
        <View className="flex flex-col items-center px-6 py-8">
          <View className="flex flex-row items-center justify-between w-full mb-4">
            <View className="flex flex-row items-center">
              <Text className="block text-sm font-medium text-gray-500">
                第 {currentRound + 1}/{actionSets.length} 轮
              </Text>
              <Text className="block text-sm text-gray-400 ml-2">· {getRoundName(currentRound)}</Text>
            </View>
            <View className="flex flex-row items-center">
              <Timer size={16} color="#8b5cf6" />
              <Text className="block text-sm font-medium text-violet-600 ml-1">{actionTimer}s</Text>
            </View>
          </View>
          <Progress value={(actionTimer / 10) * 100} className="w-full mb-6 h-2" />

          <Card className="w-full mb-4">
            <CardContent className="py-6">
              <Text className="block text-center text-lg font-bold text-gray-800 mb-2">
                {isLeaderA ? 'A' : 'B'} 领动
              </Text>
              <Text className="block text-center text-base text-gray-700 mb-3">
                {currentAction.text}
              </Text>
              <View className="flex flex-row items-center justify-center gap-2">
                <Text className="block text-xs text-gray-400">难度</Text>
                {Array.from({ length: 3 }).map((_, i) => (
                  <View
                    key={i}
                    className={`w-2 h-2 rounded-full ${i < currentAction.difficulty ? 'bg-violet-500' : 'bg-gray-200'}`}
                  />
                ))}
              </View>
            </CardContent>
          </Card>

          <Card className="w-full mb-6">
            <CardContent className="py-3">
              <Text className="block text-sm text-gray-500 mb-1">模仿提示</Text>
              <Text className="block text-sm text-violet-600">{currentAction.hint}</Text>
            </CardContent>
          </Card>

          <Button className="rounded-xl py-3 px-8" onClick={handleNextAction}>
            <View className="flex flex-row items-center">
              <Text>{currentActionIndex < currentActionSet.length - 1 ? '下一个动作' : '结束本轮'}</Text>
              <ArrowRight size={18} color="#fff" className="ml-2" />
            </View>
          </Button>
        </View>
      )}

      {/* Scoring */}
      {step === 'scoring' && (
        <View className="flex flex-col items-center px-6 py-8">
          <Text className="block text-xl font-bold text-gray-800 mb-2">本轮评分</Text>
          <Text className="block text-sm text-gray-500 mb-6">
            给{isLeaderA ? 'B' : 'A'}的模仿打分（1-3分）
          </Text>
          <View className="flex flex-row gap-4 mb-8">
            {[1, 2, 3].map(score => (
              <Button
                key={score}
                variant="outline"
                className="rounded-xl w-20 h-20 text-2xl font-bold"
                onClick={() => handleScore(score)}
              >
                <Text>{score}</Text>
              </Button>
            ))}
          </View>
          <Button className="rounded-xl py-3 px-8" onClick={handleScoringDone}>
            <Text>确认并进入下一轮</Text>
          </Button>
        </View>
      )}

      {/* Result */}
      {step === 'result' && (
        <View className="flex flex-col items-center px-6 py-8">
          <Text className="block text-2xl font-bold text-gray-800 mb-2">默契结果</Text>
          <View className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center my-6">
            <Text className="block text-3xl font-bold text-white">{getTotalScore}</Text>
          </View>
          <Text className="block text-sm text-gray-400 mb-6">满分 {getMaxScore} 分</Text>

          <Card className="mb-6 w-full">
            <CardContent className="py-4">
              <Text className="block text-sm text-gray-700 text-center leading-relaxed">
                {getResultText()}
              </Text>
            </CardContent>
          </Card>

          <Card className="mb-6 w-full">
            <CardContent className="py-4">
              <Text className="block text-sm font-medium text-gray-700 mb-4">各轮表现</Text>
              {actionSets.map((set, idx) => (
                <View key={idx} className="flex flex-row items-center justify-between py-2">
                  <View className="flex flex-row items-center">
                    <Text className="mr-2">{getRoundEmoji(idx)}</Text>
                    <Text className="text-sm text-gray-700">{getRoundName(idx)}</Text>
                  </View>
                  <Text className="text-sm text-violet-600 font-medium">
                    {scores[idx]?.total || 0}/{set.length * 3}
                  </Text>
                </View>
              ))}
              <View className="mt-3 pt-3 border-t">
                <Text className="block text-sm font-medium text-gray-700 mb-2">谁模仿得更好？</Text>
                <View className="flex flex-row items-center justify-between">
                  <View className="flex flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-blue-400 mr-2" />
                    <Text className="text-sm text-gray-700">A 领动时得分</Text>
                  </View>
                  <Text className="text-sm font-medium text-blue-600">
                    {scores.reduce((a, s) => a + s.aScore, 0)} 分
                  </Text>
                </View>
                <View className="flex flex-row items-center justify-between mt-1">
                  <View className="flex flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-pink-400 mr-2" />
                    <Text className="text-sm text-gray-700">B 领动时得分</Text>
                  </View>
                  <Text className="text-sm font-medium text-pink-600">
                    {scores.reduce((a, s) => a + s.bScore, 0)} 分
                  </Text>
                </View>
              </View>
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
  )
}

export default MirrorPage
