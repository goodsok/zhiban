import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { MessageCircle, ArrowRight, Check, X, Lightbulb, RefreshCw, Play, TriangleAlert } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ScenarioOption {
  id: string
  text: string
  isBest: boolean
  score: number
  feedback: string
}

interface Scenario {
  id: string
  title: string
  description: string
  icon: string
  color: string
  difficulty: 'easy' | 'medium' | 'hard'
  situations: {
    id: number
    context: string
    question: string
    options: ScenarioOption[]
  }[]
}

const scenarios: Scenario[] = [
  {
    id: 'first-date',
    title: '初次见面',
    description: '第一次约会的各种场景',
    icon: '👋',
    color: 'from-blue-400 to-cyan-500',
    difficulty: 'easy',
    situations: [
      {
        id: 1,
        context: '你们约在咖啡厅见面，这是你们的第一次约会。你先到了，对方还没到。',
        question: '这时候你应该怎么做？',
        options: [
          {
            id: 'a',
            text: '立刻给对方发消息，表示自己已经到了，不要催促对方',
            isBest: true,
            score: 100,
            feedback: '很好！这样既能让对方知道你已经到了，又不会给对方压力，表现出你的体贴和耐心。',
          },
          {
            id: 'b',
            text: '一直看手机，担心对方不来',
            isBest: false,
            score: 50,
            feedback: '这样做会显得不够自信，而且会让对方赶到时看到你焦虑的样子。',
          },
          {
            id: 'c',
            text: '找个安静的位置坐下，玩手机等待',
            isBest: false,
            score: 60,
            feedback: '可以找位置，但玩手机可能会给对方留下不好的第一印象。建议看看菜单或者观察环境。',
          },
          {
            id: 'd',
            text: '打电话催对方',
            isBest: false,
            score: 30,
            feedback: '第一次见面不要这样做，会显得太急躁和不礼貌，给对方压力。',
          },
        ],
      },
      {
        id: 2,
        context: '见面后，你们开始聊天。对方问你平时喜欢做什么。',
        question: '你怎么回答最好？',
        options: [
          {
            id: 'a',
            text: '简单说几个爱好，然后问对方的兴趣',
            isBest: true,
            score: 100,
            feedback: '完美！这样既展示了自己，又表现出对对方的兴趣，能让对话继续下去。',
          },
          {
            id: 'b',
            text: '滔滔不绝地讲自己的爱好，讲得很详细',
            isBest: false,
            score: 60,
            feedback: '分享是好的，但要适度。讲太多会让对方没机会说话，失去平衡。',
          },
          {
            id: 'c',
            text: '说没什么特别的爱好',
            isBest: false,
            score: 40,
            feedback: '这样说会让对方觉得你缺乏兴趣和热情，不利于建立良好印象。',
          },
          {
            id: 'd',
            text: '反问对方，先不说自己',
            isBest: false,
            score: 70,
            feedback: '这样可以让对方表达，但也要适度分享自己，否则会显得回避。',
          },
        ],
      },
      {
        id: 3,
        context: '约会进行到一半，对方突然沉默不说话，气氛有些尴尬。',
        question: '这时你应该怎么办？',
        options: [
          {
            id: 'a',
            text: '轻松地分享一个有趣的小故事或观察',
            isBest: true,
            score: 100,
            feedback: '非常好！用轻松的方式打破沉默，既缓解尴尬又展示了你的幽默感。',
          },
          {
            id: 'b',
            text: '紧张地问对方是不是有什么不开心',
            isBest: false,
            score: 50,
            feedback: '可能会让对方觉得你过于敏感，把普通沉默过度解读。',
          },
          {
            id: 'c',
            text: '也保持沉默，等待对方先说话',
            isBest: false,
            score: 40,
            feedback: '这样会让尴尬持续下去，不利于约会进展。适度主动是必要的。',
          },
          {
            id: 'd',
            text: '问对方"怎么了？"',
            isBest: false,
            score: 60,
            feedback: '可以尝试，但语气要轻松自然，不要显得担心或责备。',
          },
        ],
      },
    ],
  },
  {
    id: 'dinner',
    title: '餐厅约会',
    description: '在餐厅用餐时的各种情况',
    icon: '🍽️',
    color: 'from-orange-400 to-amber-500',
    difficulty: 'medium',
    situations: [
      {
        id: 1,
        context: '你们在餐厅用餐，服务员上错了菜，对方有点不满。',
        question: '你应该怎么处理？',
        options: [
          {
            id: 'a',
            text: '先安抚对方的情绪，然后礼貌地和服务员沟通更换',
            isBest: true,
            score: 100,
            feedback: '很棒！既照顾了对方的感受，又展现了你的沟通能力和应变能力。',
          },
          {
            id: 'b',
            text: '立刻和服务员理论，维护对方的权益',
            isBest: false,
            score: 70,
            feedback: '出发点很好，但要注意方式，避免过于强硬影响约会氛围。',
          },
          {
            id: 'c',
            text: '不作为，让服务员自己发现',
            isBest: false,
            score: 40,
            feedback: '这样会让对方觉得你不够体贴，没有主动解决问题的意识。',
          },
          {
            id: 'd',
            text: '提议换一家餐厅',
            isBest: false,
            score: 50,
            feedback: '过于极端，可以通过沟通解决问题，没必要换地方。',
          },
        ],
      },
      {
        id: 2,
        context: '用餐时，对方突然接了一个电话，看起来有点着急。',
        question: '这时你该做什么？',
        options: [
          {
            id: 'a',
            text: '示意对方可以接电话，自己先安静等待',
            isBest: true,
            score: 100,
            feedback: '完美！展现出你的理解和体贴，不会给对方造成压力。',
          },
          {
            id: 'b',
            text: '一直盯着对方看，表现得很关心',
            isBest: false,
            score: 50,
            feedback: '虽然是关心，但会让对方感到不适，给对方空间更重要。',
          },
          {
            id: 'c',
            text: '玩手机消磨时间',
            isBest: false,
            score: 40,
            feedback: '不推荐，这样显得不礼貌，也不够体贴。',
          },
          {
            id: 'd',
            text: '问对方是不是很急，需要帮忙吗',
            isBest: false,
            score: 70,
            feedback: '关心对方是好的，但最好等对方挂了电话再问，避免干扰。',
          },
        ],
      },
    ],
  },
  {
    id: 'movie',
    title: '看电影后',
    description: '看完电影后的交流和互动',
    icon: '🎬',
    color: 'from-purple-400 to-violet-500',
    difficulty: 'easy',
    situations: [
      {
        id: 1,
        context: '你们刚看完一部电影，你很喜欢，但对方看起来不太感兴趣。',
        question: '你应该怎么开始讨论？',
        options: [
          {
            id: 'a',
            text: '先问对方的感受，再分享自己的想法',
            isBest: true,
            score: 100,
            feedback: '非常好！先倾听对方的观点，再表达自己的想法，尊重对方的感受。',
          },
          {
            id: 'b',
            text: '热情地分享自己多么喜欢这部电影',
            isBest: false,
            score: 50,
            feedback: '会忽略对方的感受，可能让对方觉得你不关注ta的想法。',
          },
          {
            id: 'c',
            text: '不提电影，换个话题',
            isBest: false,
            score: 60,
            feedback: '可以避免冲突，但缺少了交流的机会，也许可以找到共同点。',
          },
          {
            id: 'd',
            text: '问对方为什么不喜欢',
            isBest: false,
            score: 70,
            feedback: '可以尝试，但语气要温和，避免让对方感觉被质疑。',
          },
        ],
      },
    ],
  },
  {
    id: 'weekend',
    title: '周末出游',
    description: '周末约会时的各种场景',
    icon: '🌳',
    color: 'from-green-400 to-emerald-500',
    difficulty: 'medium',
    situations: [
      {
        id: 1,
        context: '周末你们去公园散步，突然下起了雨。',
        question: '你应该怎么办？',
        options: [
          {
            id: 'a',
            text: '拿出雨伞或提议去附近的咖啡厅避雨',
            isBest: true,
            score: 100,
            feedback: '很棒！展现你的准备能力和应变能力，把意外变成新的约会机会。',
          },
          {
            id: 'b',
            text: '抱怨天气不好',
            isBest: false,
            score: 30,
            feedback: '抱怨只会让气氛变得更差，积极面对才更有魅力。',
          },
          {
            id: 'c',
            text: '立刻提议回家',
            isBest: false,
            score: 50,
            feedback: '有点太消极，可以想办法把约会继续下去。',
          },
          {
            id: 'd',
            text: '冒雨继续走',
            isBest: false,
            score: 40,
            feedback: '虽然浪漫，但不实用，对方可能会淋湿感冒。',
          },
        ],
      },
    ],
  },
]

const ScenarioPage: FC = () => {
  const [step, setStep] = useState<'select' | 'play' | 'result'>('select')
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [currentSituationIndex, setCurrentSituationIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<ScenarioOption | null>(null)
  const [totalScore, setTotalScore] = useState(0)
  const [completedSituations, setCompletedSituations] = useState(0)

  useLoad(() => {
    console.log('Scenario game loaded.')
  })

  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario)
    setStep('play')
    setCurrentSituationIndex(0)
    setSelectedOption(null)
    setTotalScore(0)
    setCompletedSituations(0)
  }

  const handleSelectOption = (option: ScenarioOption) => {
    setSelectedOption(option)
    setTotalScore(prev => prev + option.score)
    setCompletedSituations(prev => prev + 1)
    setStep('result')
  }

  const handleNextSituation = () => {
    if (!selectedScenario) return

    if (currentSituationIndex < selectedScenario.situations.length - 1) {
      setCurrentSituationIndex(currentSituationIndex + 1)
      setStep('play')
      setSelectedOption(null)
    }
  }

  const handleReset = () => {
    setStep('select')
    setSelectedScenario(null)
    setCurrentSituationIndex(0)
    setSelectedOption(null)
    setTotalScore(0)
    setCompletedSituations(0)
  }

  const getAverageScore = () => {
    if (completedSituations === 0) return 0
    return Math.round(totalScore / completedSituations)
  }

  const getPerformanceText = (score: number) => {
    if (score >= 90) return { text: '完美应对', color: 'text-green-600', icon: '🌟' }
    if (score >= 70) return { text: '表现良好', color: 'text-blue-600', icon: '👍' }
    if (score >= 50) return { text: '需要改进', color: 'text-amber-600', icon: '📝' }
    return { text: '继续努力', color: 'text-rose-600', icon: '💪' }
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部 */}
      <View className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-2">情景模拟</Text>
        <Text className="block text-sm text-gray-200">
          模拟真实约会场景，提升应变能力
        </Text>
      </View>

      {/* 游戏区域 */}
      <View className="p-4">
        {step === 'select' && (
          <>
            <Text className="block text-sm font-medium text-gray-500 mb-3">选择场景类型</Text>
            {scenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className="mb-3 overflow-hidden"
                onClick={() => handleSelectScenario(scenario)}
              >
                <View className={`bg-gradient-to-r ${scenario.color} px-4 py-4`}>
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center flex-1">
                      <Text className="text-2xl mr-3">{scenario.icon}</Text>
                      <View className="flex-1">
                        <Text className="block text-base font-semibold text-white">
                          {scenario.title}
                        </Text>
                        <Text className="block text-xs text-gray-200">
                          {scenario.description}
                        </Text>
                      </View>
                    </View>
                    <View className="flex flex-row items-center">
                      <Text className="text-xs text-gray-200 mr-2">
                        {scenario.situations.length} 个场景
                      </Text>
                      <ArrowRight size={20} color="white" />
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}

        {step === 'play' && selectedScenario && (
          <>
            {/* 进度 */}
            <View className="bg-white rounded-xl px-4 py-3 mb-4 flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                <MessageCircle size={16} color="#22c55e" />
                <Text className="text-sm font-medium text-gray-700 ml-2">
                  {selectedScenario.title}
                </Text>
              </View>
              <Text className="text-sm text-green-600 font-medium">
                {currentSituationIndex + 1} / {selectedScenario.situations.length}
              </Text>
            </View>

            {/* 情境卡片 */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 mb-4">
              <CardContent className="py-5">
                <View className="flex flex-row items-start mb-3">
                  <Play size={16} color="#22c55e" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-gray-600 flex-1 leading-relaxed">
                    {selectedScenario.situations[currentSituationIndex].context}
                  </Text>
                </View>
                <View className="bg-white rounded-lg px-3 py-2 mt-3">
                  <Text className="text-sm font-medium text-gray-900">
                    {selectedScenario.situations[currentSituationIndex].question}
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* 选项 */}
            <View className="space-y-3">
              {selectedScenario.situations[currentSituationIndex].options.map((option) => (
                <Card
                  key={option.id}
                  className="border-gray-200 active:bg-gray-50"
                  onClick={() => handleSelectOption(option)}
                >
                  <CardContent className="py-4">
                    <View className="flex flex-row items-center">
                      <View className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <Text className="text-sm font-semibold text-green-600">
                          {option.id.toUpperCase()}
                        </Text>
                      </View>
                      <Text className="text-sm text-gray-700 flex-1">{option.text}</Text>
                      <ArrowRight size={16} color="#9ca3af" />
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          </>
        )}

        {step === 'result' && selectedScenario && selectedOption && (
          <>
            {/* 结果卡片 */}
            <Card
              className={`mb-4 ${
                selectedOption.isBest
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'
                  : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100'
              }`}
            >
              <CardContent className="py-5">
                <View className="flex flex-col items-center">
                  <View
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                      selectedOption.isBest ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                  >
                    {selectedOption.isBest ? (
                      <Check size={32} color="white" />
                    ) : (
                      <X size={32} color="white" />
                    )}
                  </View>
                  <Text
                    className={`block text-lg font-semibold ${
                      selectedOption.isBest ? 'text-green-600' : 'text-amber-600'
                    }`}
                  >
                    {selectedOption.isBest ? '最佳选择！' : '还可以更好'}
                  </Text>
                  <View className="flex flex-row items-center mt-2">
                    <Text className="text-sm text-gray-500">本次得分：</Text>
                    <Text
                      className={`text-sm font-bold ml-1 ${
                        selectedOption.score >= 80
                          ? 'text-green-600'
                          : selectedOption.score >= 60
                            ? 'text-blue-600'
                            : 'text-amber-600'
                      }`}
                    >
                      {selectedOption.score}分
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 反馈 */}
            <Card className="mb-4">
              <CardContent className="py-4">
                <View className="flex flex-row items-start">
                  <Lightbulb size={16} color="#f59e0b" className="mr-2 mt-1 flex-shrink-0" />
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">反馈</Text>
                    <Text className="text-sm text-gray-700 leading-relaxed">
                      {selectedOption.feedback}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 最佳答案 */}
            {!selectedOption.isBest && (
              <Card className="mb-4 bg-blue-50 border-blue-100">
                <CardContent className="py-4">
                  <View className="flex flex-row items-start">
                    <TriangleAlert size={16} color="#3b82f6" className="mr-2 mt-1 flex-shrink-0" />
                    <View className="flex-1">
                      <Text className="text-xs text-blue-600 mb-1">最佳答案</Text>
                      {selectedScenario.situations[currentSituationIndex].options
                        .filter(opt => opt.isBest)
                        .map(opt => (
                          <Text key={opt.id} className="text-sm text-gray-700 leading-relaxed">
                            {opt.text}
                          </Text>
                        ))}
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}

            {/* 总分 */}
            {currentSituationIndex === selectedScenario.situations.length - 1 && (
              <Card className="mb-4">
                <CardContent className="py-4">
                  <View className="flex flex-col items-center">
                    <Text className="text-sm text-gray-500 mb-2">综合评分</Text>
                    <Text className="block text-4xl font-bold text-gray-900 mb-1">
                      {getAverageScore()}分
                    </Text>
                    <View className="flex flex-row items-center">
                      <Text className="text-xl mr-2">{getPerformanceText(getAverageScore()).icon}</Text>
                      <Text className={`text-base font-semibold ${getPerformanceText(getAverageScore()).color}`}>
                        {getPerformanceText(getAverageScore()).text}
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}

            {/* 操作按钮 */}
            <View className="space-y-3">
              {currentSituationIndex < selectedScenario.situations.length - 1 ? (
                <Button
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl py-3"
                  onClick={handleNextSituation}
                >
                  <View className="flex flex-row items-center justify-center">
                    <Play size={18} color="#fff" />
                    <Text className="text-white ml-2 font-medium">下一场景</Text>
                  </View>
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="rounded-xl py-3"
                  onClick={handleReset}
                >
                  <View className="flex flex-row items-center justify-center">
                    <RefreshCw size={18} color="#6b7280" />
                    <Text className="ml-2">选择其他场景</Text>
                  </View>
                </Button>
              )}
            </View>
          </>
        )}
      </View>

      {/* 底部提示 */}
      <View className="bg-white border-t border-gray-100 px-4 py-3 mt-4">
        <View className="flex flex-row items-center">
          <Lightbulb size={16} color="#22c55e" />
          <Text className="block text-xs text-gray-500 ml-2">
            提示：选择你认为最合适的应对方式，学习最佳实践
          </Text>
        </View>
      </View>
    </View>
  )
}

export default ScenarioPage
