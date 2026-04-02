import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import CustomHeader from '@/components/custom-header'
import { ChevronDown, ChevronUp, X, Check, Users, Coffee, Heart, MessageCircle } from 'lucide-react-taro'

interface DialogueCase {
  id: string
  scene: string
  context: string
  taSays: string
  wrongReply: string
  rightReply: string
  analysis: string
}

interface Scenario {
  id: string
  title: string
  description: string
  icon: typeof Users
  color: string
  bgColor: string
  cases: DialogueCase[]
}

const scenarios: Scenario[] = [
  {
    id: 'blind-date',
    title: '相亲场景',
    description: '初次见面，如何留下好印象',
    icon: Users,
    color: '#EC4899',
    bgColor: 'bg-pink-50',
    cases: [
      {
        id: 'bd-1',
        scene: '餐厅见面 - 点菜环节',
        context: '你们刚坐下，服务员递来菜单',
        taSays: '你想吃什么？我都可以。',
        wrongReply: '那吃火锅吧。',
        rightReply: '我看这家日料评价不错，环境也安静适合聊天。你喜欢日料吗？如果不喜欢，附近还有家西餐也不错。',
        analysis: '给选择但不过度主导，同时给对方拒绝的空间，体现尊重。',
      },
      {
        id: 'bd-2',
        scene: '聊天冷场',
        context: '话题聊完了，空气突然安静',
        taSays: '......（低头喝水）',
        wrongReply: '呃......（跟着沉默）',
        rightReply: '对了，我听说你平时喜欢旅游？最近有没有想去的地方？',
        analysis: '提前准备话题清单，从对方朋友圈或介绍人处了解兴趣爱好，关键时刻救场。',
      },
      {
        id: 'bd-3',
        scene: '结账环节',
        context: '饭吃完了，服务员拿来账单',
        taSays: '要不AA吧？',
        wrongReply: '行，那我们各付各的。',
        rightReply: '没关系，我来就好。下次你请我喝奶茶？',
        analysis: '大方买单但不强行，给对方"下次请你"的机会，创造后续互动的借口。',
      },
    ],
  },
  {
    id: 'first-date',
    title: '首次约会',
    description: '从陌生到熟悉的破冰之旅',
    icon: Coffee,
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
    cases: [
      {
        id: 'fd-1',
        scene: '约会地点选择',
        context: '你在微信上约对方出来',
        taSays: '周六有空，你想去哪？',
        wrongReply: '都行，你定吧。',
        rightReply: '我看最近有个展/电影挺有意思的（发链接），你觉得怎么样？或者你有其他想去的也可以说。',
        analysis: '提前做功课，给出具体选项，同时保留对方选择的自由。',
      },
      {
        id: 'fd-2',
        scene: '见面时的紧张',
        context: '你提前到了，对方刚走过来',
        taSays: '来很久了吗？',
        wrongReply: '没有没有，我也刚到。（其实等了20分钟）',
        rightReply: '刚到一小会儿。你今天穿得真好看。',
        analysis: '善意的谎言可以，但别太夸张。第一时间给对方正面反馈，缓解紧张。',
      },
      {
        id: 'fd-3',
        scene: '约会结束',
        context: '一天约会结束，准备各自回家',
        taSays: '今天很开心，谢谢你。',
        wrongReply: '我也是，那拜拜。',
        rightReply: '我也很开心。到家了跟我说一声？',
        analysis: '约会结束不是终点，留一个"到家联系"的钩子，延续互动。',
      },
    ],
  },
  {
    id: 'daily-chat',
    title: '日常聊天',
    description: '维持热度的沟通技巧',
    icon: MessageCircle,
    color: '#3B82F6',
    bgColor: 'bg-blue-50',
    cases: [
      {
        id: 'dc-1',
        scene: '对方分享日常',
        context: '对方发了一张午餐照片',
        taSays: '今天吃的这个，还不错~',
        wrongReply: '看着挺好吃的。',
        rightReply: '哇这个看起来很诱人！是哪家店呀？我也想去试试。你今天工作忙吗？',
        analysis: '不要只评价，要延伸话题。追问细节 + 关心对方状态，让对话继续。',
      },
      {
        id: 'dc-2',
        scene: '对方吐槽工作',
        context: '对方发来抱怨',
        taSays: '今天领导又骂我，烦死了。',
        wrongReply: '别太在意，好好工作就行。',
        rightReply: '怎么回事？是领导的问题还是...？说出来我帮你分析分析。',
        analysis: '先站队，再了解情况。不要急着给建议，先让对方发泄。',
      },
      {
        id: 'dc-3',
        scene: '聊天气氛变冷',
        context: '对话变得简短敷衍',
        taSays: '嗯。/ 哦。/ 好的。',
        wrongReply: '（继续发消息）你在干嘛？',
        rightReply: '感觉你今天有点累？要不先休息，明天再聊？',
        analysis: '识别对方的"想结束"信号，主动收尾比硬聊更好。留下"明天再聊"的约定。',
      },
    ],
  },
  {
    id: 'relationship-progress',
    title: '关系推进',
    description: '如何让关系更进一步',
    icon: Heart,
    color: '#EF4444',
    bgColor: 'bg-red-50',
    cases: [
      {
        id: 'rp-1',
        scene: '试探对方态度',
        context: '你们已经聊了一段时间',
        taSays: '周末有什么安排？',
        wrongReply: '没什么安排，在家躺着。',
        rightReply: '暂时没安排，怎么，想约我？（偷笑表情）',
        analysis: '把普通问题变成暧昧互动，用玩笑试探对方反应。',
      },
      {
        id: 'rp-2',
        scene: '对方提起前任',
        context: '聊天中提到感情话题',
        taSays: '我之前谈过一个，后来分了...',
        wrongReply: '为什么分了？',
        rightReply: '（认真听）...过去的事就让它过去吧。我觉得你现在挺好的。',
        analysis: '不要追问细节，不要评价。表达"我在乎的是现在的你"。',
      },
      {
        id: 'rp-3',
        scene: '表白时机',
        context: '你们已经频繁互动一段时间',
        taSays: '（发来暧昧表情或话题）',
        wrongReply: '我喜欢你，做我对象吧。',
        rightReply: '我最近发现一件事......我好像习惯了每天和你聊天。你呢？',
        analysis: '不要突兀表白，先表达依赖感，观察对方反应。对方回应积极再进一步。',
      },
    ],
  },
]

const KnowledgeScenarioPage: FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null)

  useLoad(() => {
    console.log('Knowledge scenario page loaded.')
  })

  const toggleScenario = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
    setExpandedCaseId(null)
  }

  const toggleCase = (id: string) => {
    setExpandedCaseId(expandedCaseId === id ? null : id)
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <CustomHeader title="场景演练" />

      {/* 说明 */}
      <View className="px-4 py-4 bg-white border-b border-gray-100">
        <Text className="block text-sm text-gray-600">
          真实对话案例，告诉你什么该说、什么不该说
        </Text>
      </View>

      {/* 场景列表 */}
      <View className="p-4">
        {scenarios.map((scenario) => {
          const ScenarioIcon = scenario.icon
          const isExpanded = expandedId === scenario.id
          
          return (
            <View
              key={scenario.id}
              className="bg-white rounded-2xl mb-3 overflow-hidden"
            >
              {/* 场景标题 */}
              <View
                className="p-4 flex items-center justify-between"
                onClick={() => toggleScenario(scenario.id)}
              >
                <View className="flex items-center gap-3">
                  <View className={`w-10 h-10 ${scenario.bgColor} rounded-xl flex items-center justify-center`}>
                    <ScenarioIcon size={20} color={scenario.color} />
                  </View>
                  <View>
                    <Text className="block text-base font-semibold text-gray-900">
                      {scenario.title}
                    </Text>
                    <Text className="block text-xs text-gray-500 mt-1">
                      {scenario.description} · {scenario.cases.length}个案例
                    </Text>
                  </View>
                </View>
                {isExpanded ? (
                  <ChevronUp size={18} color="#9CA3AF" />
                ) : (
                  <ChevronDown size={18} color="#9CA3AF" />
                )}
              </View>

              {/* 展开的案例列表 */}
              {isExpanded && (
                <View className="px-4 pb-4">
                  {scenario.cases.map((dialogueCase, index) => {
                    const isCaseExpanded = expandedCaseId === dialogueCase.id
                    
                    return (
                      <View key={dialogueCase.id} className="mb-3 last:mb-0">
                        {/* 案例标题 */}
                        <View
                          className="bg-gray-50 rounded-xl p-3"
                          onClick={() => toggleCase(dialogueCase.id)}
                        >
                          <View className="flex items-center justify-between">
                            <View className="flex items-center gap-2">
                              <View className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                <Text className="block text-xs text-gray-500">{index + 1}</Text>
                              </View>
                              <Text className="block text-sm font-medium text-gray-800">
                                {dialogueCase.scene}
                              </Text>
                            </View>
                            {isCaseExpanded ? (
                              <ChevronUp size={14} color="#9CA3AF" />
                            ) : (
                              <ChevronDown size={14} color="#9CA3AF" />
                            )}
                          </View>
                          
                          {!isCaseExpanded && (
                            <Text className="block text-xs text-gray-500 mt-2 ml-8">
                              {dialogueCase.context}
                            </Text>
                          )}
                        </View>

                        {/* 展开的案例详情 */}
                        {isCaseExpanded && (
                          <View className="bg-gray-50 rounded-xl p-4 mt-2">
                            {/* 场景背景 */}
                            <Text className="block text-xs text-gray-500 mb-3">
                              📍 {dialogueCase.context}
                            </Text>

                            {/* 对话 */}
                            <View className="mb-4">
                              <View className="flex items-start gap-2 mb-3">
                                <View className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                                  <Text className="block text-xs text-pink-600">TA</Text>
                                </View>
                                <View className="flex-1 bg-white rounded-xl rounded-tl-sm p-3">
                                  <Text className="block text-sm text-gray-800">{dialogueCase.taSays}</Text>
                                </View>
                              </View>
                            </View>

                            {/* 错误回复 */}
                            <View className="mb-3">
                              <View className="flex items-center gap-1 mb-2">
                                <X size={14} color="#EF4444" />
                                <Text className="block text-xs font-medium text-red-500">错误回复</Text>
                              </View>
                              <View className="bg-red-50 rounded-xl p-3 border border-red-100">
                                <Text className="block text-sm text-gray-700">{dialogueCase.wrongReply}</Text>
                              </View>
                            </View>

                            {/* 正确回复 */}
                            <View className="mb-3">
                              <View className="flex items-center gap-1 mb-2">
                                <Check size={14} color="#10B981" />
                                <Text className="block text-xs font-medium text-green-600">正确回复</Text>
                              </View>
                              <View className="bg-green-50 rounded-xl p-3 border border-green-100">
                                <Text className="block text-sm text-gray-700">{dialogueCase.rightReply}</Text>
                              </View>
                            </View>

                            {/* 解析 */}
                            <View className="bg-white rounded-xl p-3">
                              <Text className="block text-xs font-medium text-gray-500 mb-1">💡 解析</Text>
                              <Text className="block text-sm text-gray-700">{dialogueCase.analysis}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          )
        })}
      </View>

      {/* 提示 */}
      <View className="px-4 pb-6">
        <Text className="block text-xs text-gray-400 text-center">
          更多场景演练内容持续更新中...
        </Text>
      </View>
    </View>
  )
}

export default KnowledgeScenarioPage
