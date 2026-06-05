import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Sun, Moon, Heart, HandHelping, SmilePlus, MessageCircleHeart, PartyPopper, LoaderCircle, Copy, Check } from 'lucide-react-taro'

// 场景配置
const SCENES = [
  { key: 'morning', label: '早安问候', icon: Sun, iconBg: 'bg-amber-50' },
  { key: 'night', label: '晚安祝福', icon: Moon, iconBg: 'bg-green-50' },
  { key: 'flirt', label: '暧昧调情', icon: Heart, iconBg: 'bg-rose-50' },
  { key: 'comfort', label: '安慰鼓励', icon: HandHelping, iconBg: 'bg-blue-50' },
  { key: 'miss', label: '表达想念', icon: SmilePlus, iconBg: 'bg-purple-50' },
  { key: 'apology', label: '道歉和好', icon: MessageCircleHeart, iconBg: 'bg-green-50' },
  { key: 'celebrate', label: '庆祝纪念', icon: PartyPopper, iconBg: 'bg-amber-50' },
]

// 语气风格
const TONES = [
  { key: 'sweet', label: '甜蜜温柔' },
  { key: 'humorous', label: '幽默风趣' },
  { key: 'poetic', label: '文艺浪漫' },
  { key: 'direct', label: '直球告白' },
  { key: 'playful', label: '俏皮可爱' },
]

// 情话结果
interface SweetTalkLine {
  content: string
  style: string
  suitablePhase: string
}

interface SweetTalkResult {
  lines: SweetTalkLine[]
  tips: string[]
}

// 关系阶段颜色
const phaseColor: Record<string, string> = {
  '暧昧初期': 'bg-gray-100 text-gray-600',
  '暧昧升温': 'bg-amber-100 text-amber-700',
  '热恋': 'bg-rose-100 text-rose-700',
  '稳定期': 'bg-emerald-100 text-emerald-700',
}

const SweetTalkPage: FC = () => {
  const [selectedScene, setSelectedScene] = useState('')
  const [selectedTone, setSelectedTone] = useState('sweet')
  const [customContext, setCustomContext] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<SweetTalkResult | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  useLoad(() => {
    console.log('Sweet talk page loaded.')
  })

  const generateSweetTalk = async () => {
    if (!selectedScene) return
    setGenerating(true)
    setResult(null)
    try {
      const res = await Network.request({
        url: '/api/sweet-talk/generate',
        method: 'POST',
        data: {
          scene: selectedScene,
          tone: selectedTone,
          customContext: customContext || undefined,
        },
      })
      console.log('Sweet talk response:', res.data)
      const responseData = res?.data
      if (responseData?.code === 200 && responseData?.data) {
        setResult(responseData.data)
      }
    } catch (error) {
      console.error('Generate sweet talk error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = (text: string, idx: number) => {
    Taro.setClipboardData({ data: text })
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  // 生成结果视图
  if (generating || result) {
    const sceneLabel = SCENES.find(s => s.key === selectedScene)?.label || ''

    return (
      <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
        <CustomHeader title="情话生成器" onBack={() => setResult(null)} />

        <ScrollView scrollY className="px-4 pt-4 pb-20">
          {generating && !result && (
            <Card className="mb-4">
              <CardContent className="p-8 flex flex-col items-center justify-center">
                <LoaderCircle size={32} color="#374151" className="animate-spin" />
                <Text className="block text-sm text-gray-500 mt-3">正在生成情话...</Text>
                <Text className="block text-xs text-gray-400 mt-1">AI 正在为你定制专属情话</Text>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <View className="flex flex-row items-center justify-between mb-4">
                <Text className="block text-sm text-gray-500">{sceneLabel} · {TONES.find(t => t.key === selectedTone)?.label}</Text>
                <Button size="sm" variant="outline" onClick={() => setResult(null)}>
                  <Text className="text-xs">重新生成</Text>
                </Button>
              </View>

              {/* 情话列表 */}
              {result.lines.map((line, idx) => (
                <Card key={idx} className="mb-3">
                  <CardContent className="p-4">
                    <Text className="block text-base text-gray-900 leading-relaxed mb-3">{line.content}</Text>
                    <View className="flex flex-row items-center justify-between">
                      <View className="flex flex-row items-center gap-2">
                        <Badge variant="secondary">
                          <Text className="text-xs">{line.style}</Text>
                        </Badge>
                        <Badge className={phaseColor[line.suitablePhase] || 'bg-gray-100 text-gray-600'}>
                          <Text className="text-xs">{line.suitablePhase}</Text>
                        </Badge>
                      </View>
                      <View onClick={() => copyToClipboard(line.content, idx)}>
                        {copiedIdx === idx ? (
                          <Check size={16} color="#4ECB71" />
                        ) : (
                          <Copy size={16} color="#9CA3AF" />
                        )}
                      </View>
                    </View>
                  </CardContent>
                </Card>
              ))}

              {/* 小技巧 */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <View className="flex flex-row items-center mb-3">
                    <Sparkles size={18} color="#374151" />
                    <Text className="block text-base font-semibold text-gray-900 ml-2">发送小技巧</Text>
                  </View>
                  {result.tips.map((tip, idx) => (
                    <View key={idx} className="flex flex-row mb-2 last:mb-0">
                      <Text className="block text-sm text-gray-500 mr-2">{idx + 1}.</Text>
                      <Text className="block text-sm text-gray-600 flex-1">{tip}</Text>
                    </View>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </ScrollView>
      </View>
    )
  }

  // 主视图：选择场景和语气
  return (
    <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="情话生成器" />

      <ScrollView scrollY className="px-4 pt-4 pb-20">
        {/* 选择场景 */}
        <Text className="block text-sm font-semibold text-gray-900 mb-3">选择场景</Text>
        <View className="flex flex-row flex-wrap gap-3 mb-6">
          {SCENES.map((scene) => {
            const SceneIcon = scene.icon
            return (
              <View
                key={scene.key}
                className={`rounded-2xl p-4 border-2 ${selectedScene === scene.key ? 'border-black bg-white' : 'border-gray-200 bg-white'}`}
                style={{ width: '46%' }}
                onClick={() => setSelectedScene(scene.key)}
              >
                <View className={`w-10 h-10 ${scene.iconBg} rounded-xl flex items-center justify-center mb-2`}>
                  <SceneIcon size={20} color="#374151" />
                </View>
                <Text className="block text-sm font-semibold text-gray-900">{scene.label}</Text>
              </View>
            )
          })}
        </View>

        {/* 选择语气 */}
        <Text className="block text-sm font-semibold text-gray-900 mb-3">语气风格</Text>
        <View className="flex flex-row flex-wrap gap-2 mb-6">
          {TONES.map((tone) => (
            <Badge
              key={tone.key}
              className={selectedTone === tone.key ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}
              onClick={() => setSelectedTone(tone.key)}
            >
              <Text className="text-xs">{tone.label}</Text>
            </Badge>
          ))}
        </View>

        {/* 自定义上下文 */}
        <Text className="block text-sm font-semibold text-gray-900 mb-3">补充要求（选填）</Text>
        <View className="bg-gray-50 rounded-2xl p-4 mb-6">
          <Textarea
            style={{ width: '100%', minHeight: '60px', backgroundColor: 'transparent' }}
            placeholder="如：我们刚认识一周、她喜欢猫、昨晚吵架了..."
            maxlength={200}
            value={customContext}
            onInput={(e) => setCustomContext(e.detail.value)}
          />
        </View>

        {/* 生成按钮 */}
        <Button
          className="w-full mb-6"
          disabled={!selectedScene || generating}
          onClick={generateSweetTalk}
        >
          <Sparkles size={16} color="#fff" className="mr-2" />
          <Text className="text-sm text-white font-semibold">生成情话</Text>
        </Button>
      </ScrollView>
    </View>
  )
}

export default SweetTalkPage
