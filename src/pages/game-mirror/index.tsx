import { useState, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { RotateCcw, ArrowRight, Sparkles, Timer } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

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

const actionSets: MirrorAction[][] = [
  // 第一轮：表情模仿（热身，无接触）
  [
    { id: 'f1', text: '做出你最灿烂的笑容', bodyPart: '表情', difficulty: 1, touchLevel: 'none', hint: '注意观察TA嘴角的弧度' },
    { id: 'f2', text: '做一个"惊讶"的表情', bodyPart: '表情', difficulty: 1, touchLevel: 'none', hint: '眉毛和嘴巴要配合好' },
    { id: 'f3', text: '做一个"撒娇"的表情', bodyPart: '表情', difficulty: 2, touchLevel: 'none', hint: '嘟嘴、歪头，越可爱越好' },
    { id: 'f4', text: '用表情表达"我喜欢你"', bodyPart: '表情', difficulty: 2, touchLevel: 'none', hint: '眼神是最重要的部分' },
  ],
  // 第二轮：手势模仿（需要近距离观察）
  [
    { id: 'h1', text: '做一个比心手势', bodyPart: '手势', difficulty: 1, touchLevel: 'none', hint: '手指的弯曲要一模一样' },
    { id: 'h2', text: '用手比一个动物的形状', bodyPart: '手势', difficulty: 2, touchLevel: 'none', hint: '仔细看手指的细节' },
    { id: 'h3', text: '做一个"过来"的手势', bodyPart: '手势', difficulty: 1, touchLevel: 'none', hint: '注意手指弯曲的方向' },
    { id: 'h4', text: '两人掌心相对，比一个一样的手型', bodyPart: '手势', difficulty: 2, touchLevel: 'light', hint: '掌心靠近，感受彼此的温度' },
  ],
  // 第三轮：上半身动作（自然靠近）
  [
    { id: 'u1', text: '双手抱头，然后慢慢放下', bodyPart: '上半身', difficulty: 1, touchLevel: 'none', hint: '动作节奏要一致' },
    { id: 'u2', text: '伸出右手，停在两人中间', bodyPart: '上半身', difficulty: 1, touchLevel: 'light', hint: '手靠近但不碰到，保持悬念' },
    { id: 'u3', text: '做一个深呼吸，同时肩膀上下起伏', bodyPart: '上半身', difficulty: 1, touchLevel: 'none', hint: '呼吸节奏要同步' },
    { id: 'u4', text: '慢慢靠近对方，在最舒服的距离停下', bodyPart: '上半身', difficulty: 3, touchLevel: 'close', hint: '最近但不碰到，感受彼此的呼吸' },
  ],
  // 第四轮：互动动作（直接接触）
  [
    { id: 't1', text: '轻轻碰一下对方的鼻尖', bodyPart: '互动', difficulty: 2, touchLevel: 'light', hint: '慢慢靠近，轻轻地' },
    { id: 't2', text: '把手放在对方肩膀上', bodyPart: '互动', difficulty: 2, touchLevel: 'light', hint: '自然放置，不要用力' },
    { id: 't3', text: '两手相握，同时做一个旋转手腕的动作', bodyPart: '互动', difficulty: 2, touchLevel: 'close', hint: '手指要配合好节奏' },
    { id: 't4', text: '额头轻轻相抵，保持3秒', bodyPart: '互动', difficulty: 3, touchLevel: 'close', hint: '闭眼，感受这一刻的安静' },
  ],
]

const MirrorPage: FC = () => {
  const [step, setStep] = useState<'intro' | 'invite' | 'playing' | 'scoring' | 'result'>('intro')
  const [currentRound, setCurrentRound] = useState(0) // 0-3
  const [currentActionIndex, setCurrentActionIndex] = useState(0)
  const [isLeaderA, setIsLeaderA] = useState(true) // A是领动者
  const [scores, setScores] = useState<Array<{ total: number; aScore: number; bScore: number }>>([]) // 每轮得分
  const roundScoreRef = useRef(0)
  const leaderScoresRef = useRef({ aScore: 0, bScore: 0 })
  const [actionTimer, setActionTimer] = useState(10)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  const handleShowAction = () => {
    startActionTimer()
  }

  const handleScore = (score: number) => {
    clearTimer()
    const newRoundScore = roundScoreRef.current + score
    roundScoreRef.current = newRoundScore
    roundScoreRef.current = newRoundScore

    // Track who was leader for this action
    if (isLeaderA) {
      leaderScoresRef.current.aScore += score
    } else {
      leaderScoresRef.current.bScore += score
    }

    if (currentActionIndex < currentActionSet.length - 1) {
      // 下一题：交换领动者
      setIsLeaderA(prev => !prev)
      setCurrentActionIndex(prev => prev + 1)
      setActionTimer(10)
    } else {
      // 本轮结束
      setScores(prev => [...prev, {
        total: newRoundScore,
        aScore: leaderScoresRef.current.aScore,
        bScore: leaderScoresRef.current.bScore,
      }])
      setStep('scoring')
    }
  }

  const handleNextRound = () => {
    if (currentRound < actionSets.length - 1) {
      setCurrentRound(prev => prev + 1)
      setCurrentActionIndex(0)
      setIsLeaderA(true)
      roundScoreRef.current = 0
      leaderScoresRef.current = { aScore: 0, bScore: 0 }
      setActionTimer(10)
      setStep('playing')
    } else {
      setStep('result')
    }
  }

  const handleReset = () => {
    clearTimer()
    setStep('intro')
    setCurrentRound(0)
    setCurrentActionIndex(0)
    setIsLeaderA(true)
    setScores([])
    roundScoreRef.current = 0
    leaderScoresRef.current = { aScore: 0, bScore: 0 }
    setActionTimer(10)
  }

  const getRoundName = (round: number) => {
    const names = ['表情模仿', '手势模仿', '上半身动作', '互动挑战']
    return names[round] || ''
  }

  const getRoundEmoji = (round: number) => {
    const emojis = ['😊', '✋', '🤸', '💑']
    return emojis[round] || ''
  }

  const getTotalScore = () => scores.reduce((a, b) => a + b.total, 0)

  const getMaxScore = () => {
    // 每题最高3分，4题一轮
    return actionSets.reduce((total, set) => total + set.length * 3, 0)
  }

  const getResultTitle = () => {
    const ratio = getTotalScore() / getMaxScore()
    if (ratio >= 0.8) return '灵魂伴侣'
    if (ratio >= 0.6) return '心有灵犀'
    if (ratio >= 0.4) return '渐入佳境'
    return '初见默契'
  }

  const getResultText = () => {
    const ratio = getTotalScore() / getMaxScore()
    if (ratio >= 0.8) return '你们的默契程度惊人！每一个动作都能完美同步，这种身体语言上的共鸣非常珍贵。'
    if (ratio >= 0.6) return '你们已经很有默契了！观察和模仿的能力都很棒，继续保持这份心灵感应。'
    if (ratio >= 0.4) return '你们正在建立默契！多观察对方的小细节，身体语言往往比话语更真实。'
    return '这是一个开始！多和对方对视、观察，慢慢你们会越来越有默契。'
  }

  const getTouchLevelLabel = (level: string) => {
    switch (level) {
      case 'none': return '无接触'
      case 'light': return '轻触'
      case 'close': return '亲密'
      default: return ''
    }
  }

  const getTouchLevelColor = (level: string) => {
    switch (level) {
      case 'none': return 'bg-gray-100 text-gray-500'
      case 'light': return 'bg-rose-50 text-rose-500'
      case 'close': return 'bg-pink-50 text-pink-600'
      default: return 'bg-gray-100 text-gray-500'
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-8">
      {/* 顶部进度 */}
      <View className="bg-white px-4 pt-2 pb-3 border-b border-gray-100">
        <View className="flex flex-row items-center justify-between mb-1">
          <Text className="text-xs text-gray-500">
            {step === 'intro' ? '准备开始' : `第${currentRound + 1}轮 / 共${actionSets.length}轮`}
          </Text>
          <Text className="text-xs text-gray-500">
            {step !== 'intro' && step !== 'result' ? getRoundName(currentRound) : ''}
          </Text>
        </View>
        <Progress
          value={step === 'intro' ? 0 : ((currentRound + (step === 'scoring' || step === 'result' ? 1 : 0)) / actionSets.length) * 100}
          className="h-2"
        />
      </View>

      <View className="p-4">
        {/* 游戏介绍 */}
        {step === 'intro' && (
          <View className="flex flex-col items-center">
            <View className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center mb-4">
              <Text className="text-3xl">🪞</Text>
            </View>
            <Text className="block text-2xl font-bold text-gray-900 mb-2">双人镜像</Text>
            <Text className="block text-sm text-gray-500 mb-4 text-center leading-relaxed">
              你做我模仿，角色交替{'\n'}从表情到动作，在模仿中自然靠近
            </Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm font-medium text-gray-700 mb-3">游戏规则</Text>
                <View className="space-y-2">
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-violet-600">1</Text>
                    </View>
                    <Text className="text-sm text-gray-600">每轮4个动作，一人领动、一人模仿，交替进行</Text>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-violet-600">2</Text>
                    </View>
                    <Text className="text-sm text-gray-600">模仿者根据相似度评分（1-3分），越像越高分</Text>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Text className="text-xs text-violet-600">3</Text>
                    </View>
                    <Text className="text-sm text-gray-600">4轮由浅入深：表情 → 手势 → 上半身 → 互动接触</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card className="mb-6 w-full bg-violet-50 border-violet-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Sparkles size={16} color="#7c3aed" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-violet-700 leading-relaxed">
                    镜像游戏的精髓在于：你们必须盯着对方看。这本身就是在制造暧昧。
                  </Text>
                </View>
              </CardContent>
            </Card>

            <Button
              className="bg-gradient-to-r from-violet-400 to-purple-500 text-white rounded-xl py-3 w-full"
              onClick={handleStart}
            >
              <View className="flex flex-row items-center justify-center">
                <Sparkles size={18} color="white" />
                <Text className="text-white ml-2 font-medium">邀请TA一起玩</Text>
              </View>
            </Button>
          </View>
        )}

        {/* 邀请话术 */}
        {step === 'invite' && (
          <View className="flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-4">
              <Sparkles size={32} color="#7c3aed" />
            </View>
            <Text className="block text-lg font-bold text-gray-900 mb-2">把手机递给TA</Text>
            <Text className="block text-sm text-gray-500 mb-6 text-center leading-relaxed">
              让TA看到这段话，如果愿意就点「好呀」
            </Text>

            <Card className="mb-6 w-full bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
              <CardContent className="py-5">
                <Text className="block text-base text-gray-800 leading-loose text-center font-medium">
                  “我们来玩镜像游戏吧！{'\n'}你做什么我就跟着做，{'\n'}我做什么你也跟着做。{'\n'}{'\n'}必须一直看着对方的眼睛哦，{'\n'}看谁先笑出来。{'\n'}{'\n'}敢不敢？”
                </Text>
              </CardContent>
            </Card>

            <View className="w-full space-y-3">
              <Button
                className="bg-gradient-to-r from-violet-400 to-purple-500 text-white rounded-xl py-3 w-full"
                onClick={handleInviteConfirm}
              >
                <View className="flex flex-row items-center justify-center">
                  <Sparkles size={18} color="white" />
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

        {/* 游戏进行中 */}
        {step === 'playing' && currentAction && (
          <View className="flex flex-col items-center">
            {/* 轮次和角色提示 */}
            <Text className="block text-sm text-violet-500 font-medium mb-1">
              {getRoundEmoji(currentRound)} {getRoundName(currentRound)}
            </Text>
            <View className="flex flex-row items-center mb-4">
              <View className={`px-3 py-1 rounded-full ${isLeaderA ? 'bg-blue-100' : 'bg-pink-100'}`}>
                <Text className={`text-xs font-medium ${isLeaderA ? 'text-blue-600' : 'text-pink-600'}`}>
                  {isLeaderA ? 'A 领动' : 'B 领动'}
                </Text>
              </View>
              <Text className="text-xs text-gray-400 mx-2">|</Text>
              <View className={`px-2 py-1 rounded-full ${getTouchLevelColor(currentAction.touchLevel)}`}>
                <Text className="text-xs">{getTouchLevelLabel(currentAction.touchLevel)}</Text>
              </View>
            </View>

            {/* 动作卡片 */}
            <Card className="mb-4 w-full">
              <CardContent className="py-6">
                <View className="flex flex-col items-center">
                  <Text className="text-xs text-gray-500 mb-3">
                    {isLeaderA ? 'A 做动作，B 来模仿' : 'B 做动作，A 来模仿'}
                  </Text>
                  <Text className="block text-lg text-gray-800 text-center leading-relaxed font-semibold">
                    {currentAction.text}
                  </Text>
                  <View className="flex flex-row items-center mt-3">
                    <Timer size={14} color="#9ca3af" />
                    <Text className="text-xs text-gray-400 ml-1">{actionTimer}s</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 给模仿者的提示 */}
            <Card className="mb-6 w-full bg-violet-50 border-violet-100">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Sparkles size={16} color="#7c3aed" className="mr-2 mt-1 flex-shrink-0" />
                  <View className="flex-1">
                    <Text className="text-xs text-violet-500 mb-1">模仿提示</Text>
                    <Text className="text-sm text-violet-700">{currentAction.hint}</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 操作区 */}
            {actionTimer === 10 ? (
              <Button
                className="bg-gradient-to-r from-violet-400 to-purple-500 text-white rounded-xl py-3 w-full"
                onClick={handleShowAction}
              >
                <View className="flex flex-row items-center justify-center">
                  <Timer size={18} color="white" />
                  <Text className="text-white ml-2 font-medium">准备好了，开始计时</Text>
                </View>
              </Button>
            ) : (
              <View className="w-full">
                <Text className="block text-sm text-gray-500 text-center mb-3">模仿得怎么样？</Text>
                <View className="flex flex-row gap-3">
                  <View className="flex-1">
                    <Button
                      className="bg-amber-50 border border-amber-200 rounded-xl py-3 w-full"
                      onClick={() => handleScore(1)}
                    >
                      <View className="flex flex-col items-center">
                        <Text className="text-lg">🤔</Text>
                        <Text className="text-xs text-amber-600 mt-1">不太像</Text>
                      </View>
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button
                      className="bg-blue-50 border border-blue-200 rounded-xl py-3 w-full"
                      onClick={() => handleScore(2)}
                    >
                      <View className="flex flex-col items-center">
                        <Text className="text-lg">😄</Text>
                        <Text className="text-xs text-blue-600 mt-1">挺像的</Text>
                      </View>
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button
                      className="bg-green-50 border border-green-200 rounded-xl py-3 w-full"
                      onClick={() => handleScore(3)}
                    >
                      <View className="flex flex-col items-center">
                        <Text className="text-lg">🤯</Text>
                        <Text className="text-xs text-green-600 mt-1">一模一样</Text>
                      </View>
                    </Button>
                  </View>
                </View>
              </View>
            )}

            {/* 进度指示 */}
            <View className="flex flex-row mt-4 gap-1">
              {currentActionSet.map((_, idx) => (
                <View
                  key={idx}
                  className={`h-2 rounded-full ${
                    idx < currentActionIndex ? 'bg-violet-400' :
                    idx === currentActionIndex ? 'bg-violet-600' : 'bg-gray-200'
                  }`}
                  style={{ width: `${100 / currentActionSet.length}%` }}
                />
              ))}
            </View>
          </View>
        )}

        {/* 轮次结束评分 */}
        {step === 'scoring' && (
          <View className="flex flex-col items-center">
            <Text className="block text-3xl mb-3">{getRoundEmoji(currentRound)}</Text>
            <Text className="block text-xl font-bold text-gray-900 mb-1">
              {getRoundName(currentRound)} 完成！
            </Text>
            <Text className="block text-sm text-gray-500 mb-4">
              本轮得分：{scores[scores.length - 1]?.total || 0}/{currentActionSet.length * 3}
            </Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm text-gray-700 text-center leading-relaxed">
                  {currentRound < actionSets.length - 1
                    ? '接下来难度会升级，动作涉及更多身体接触。准备好了吗？'
                    : '你已经完成了所有挑战！来看看最终成绩吧。'}
                </Text>
              </CardContent>
            </Card>

            <Button
              className="bg-gradient-to-r from-violet-400 to-purple-500 text-white rounded-xl py-3 w-full"
              onClick={handleNextRound}
            >
              <View className="flex flex-row items-center justify-center">
                <ArrowRight size={18} color="white" />
                <Text className="text-white ml-2 font-medium">
                  {currentRound < actionSets.length - 1
                    ? `下一轮：${getRoundName(currentRound + 1)}`
                    : '查看总结'}
                </Text>
              </View>
            </Button>
          </View>
        )}

        {/* 最终结果 */}
        {step === 'result' && (
          <View className="flex flex-col items-center">
            <Text className="block text-5xl mb-3">🪞</Text>
            <Text className="block text-2xl font-bold text-gray-900 mb-1">{getResultTitle()}</Text>
            <Text className="block text-sm text-gray-500 mb-6">
              总分 {getTotalScore()}/{getMaxScore()}
            </Text>

            <Card className="mb-4 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm text-gray-700 text-center leading-relaxed">
                  {getResultText()}
                </Text>
              </CardContent>
            </Card>

            <Card className="mb-6 w-full">
              <CardContent className="py-4">
                <Text className="block text-sm font-medium text-gray-700 mb-3">各轮表现</Text>
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
                <View className="mt-3 pt-3 border-t border-gray-100">
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
    </View>
  )
}

export default MirrorPage
