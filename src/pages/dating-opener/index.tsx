import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad, setClipboardData } from '@tarojs/taro'
import type { FC } from 'react'
import { MessageSquare, Copy, RefreshCw } from 'lucide-react-taro'
import { Network } from '@/network'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface OpenerSuggestion {
  style: string
  content: string
  reason: string
}

interface OpenerResponse {
  targetAnalysis: string
  suggestions: OpenerSuggestion[]
  tips: string[]
}

const DatingOpenerPage: FC = () => {
  const [targetProfile, setTargetProfile] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OpenerResponse | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useLoad(() => {
    console.log('Dating opener generator page loaded.')
  })

  const handleGenerate = async () => {
    if (!targetProfile.trim()) {
      return
    }

    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/dating/opener/generate',
        method: 'POST',
        data: { targetProfile: targetProfile.trim() },
      })
      console.log('Opener generation response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setResult(res.data.data)
      }
    } catch (error) {
      console.error('Opener generation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, index: number) => {
    setClipboardData({
      data: text,
      success: () => {
        setCopiedIndex(index)
        setTimeout(() => {
          setCopiedIndex(null)
        }, 2000)
      },
    })
  }

  const handleReset = () => {
    setTargetProfile('')
    setResult(null)
  }

  const openerStyles = [
    { name: '幽默风趣', color: 'bg-orange-100 text-orange-700' },
    { name: '真诚直接', color: 'bg-blue-100 text-blue-700' },
    { name: '好奇心', color: 'bg-purple-100 text-purple-700' },
    { name: '赞美式', color: 'bg-pink-100 text-pink-700' },
  ]

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部说明 */}
      <View className="bg-green-50 px-4 py-3">
        <View className="flex flex-row items-center">
          <MessageSquare size={18} color="#22c55e" />
          <Text className="block text-sm text-green-700 ml-2">
            粘贴对方的资料信息，AI 将生成个性化开场白
          </Text>
        </View>
      </View>

      <View className="p-4">
        {/* 目标资料输入 */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">对方资料</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="bg-gray-50 rounded-xl p-4">
              <Textarea
                style={{ width: '100%', minHeight: '150px', backgroundColor: 'transparent' }}
                placeholder="粘贴对方的交友软件资料，包括昵称、简介、兴趣标签等..."
                maxlength={1000}
                value={targetProfile}
                onInput={(e) => setTargetProfile(e.detail.value)}
              />
            </View>
            <Text className="block text-xs text-gray-400 mt-2">
              {targetProfile.length}/1000 字符
            </Text>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <View className="flex flex-row gap-3 mb-4">
          <View className="flex-1">
            <Button
              variant="default"
              className="bg-green-500 text-white rounded-xl"
              disabled={loading || !targetProfile.trim()}
              onClick={handleGenerate}
            >
              <Text className="text-white">{loading ? '生成中...' : '生成开场白'}</Text>
            </Button>
          </View>
          <View className="flex-1">
            <Button
              variant="secondary"
              className="rounded-xl"
              onClick={handleReset}
            >
              <Text>重置</Text>
            </Button>
          </View>
        </View>

        {/* 生成结果 */}
        {result && (
          <View className="space-y-4">
            {/* 目标分析 */}
            <Card className="bg-green-50">
              <CardContent className="py-4">
                <Text className="block text-sm font-medium text-green-700 mb-2">对方画像分析</Text>
                <Text className="block text-sm text-green-600 leading-relaxed">{result.targetAnalysis}</Text>
              </CardContent>
            </Card>

            {/* 开场白建议 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">开场白建议</CardTitle>
              </CardHeader>
              <CardContent>
                {result.suggestions.map((suggestion, index) => {
                  const styleInfo = openerStyles.find(s => s.name === suggestion.style) || openerStyles[0]
                  return (
                    <View key={index} className="mb-4 last:mb-0">
                      <View className="flex flex-row items-center justify-between mb-2">
                        <View className={`px-2 py-1 rounded-lg ${styleInfo.color}`}>
                          <Text className="block text-xs font-medium">{suggestion.style}</Text>
                        </View>
                        <View
                          className="flex flex-row items-center"
                          onClick={() => handleCopy(suggestion.content, index)}
                        >
                          {copiedIndex === index ? (
                            <Text className="block text-xs text-green-500">已复制</Text>
                          ) : (
                            <>
                              <Copy size={14} color="#9ca3af" />
                              <Text className="block text-xs text-gray-400 ml-1">复制</Text>
                            </>
                          )}
                        </View>
                      </View>
                      <View className="bg-gray-50 rounded-xl p-4">
                        <Text className="block text-sm text-gray-700 leading-relaxed">{suggestion.content}</Text>
                      </View>
                      <Text className="block text-xs text-gray-500 mt-2 italic">{suggestion.reason}</Text>
                    </View>
                  )
                })}
              </CardContent>
            </Card>

            {/* 使用技巧 */}
            <Card>
              <CardHeader className="pb-3">
                <View className="flex flex-row items-center">
                  <RefreshCw size={16} color="#22c55e" />
                  <Text className="block text-sm font-semibold text-gray-900 ml-2">发送技巧</Text>
                </View>
              </CardHeader>
              <CardContent>
                {result.tips.map((tip, index) => (
                  <View key={index} className="flex flex-row items-start mb-2">
                    <Text className="block text-green-500 mr-2">{index + 1}.</Text>
                    <Text className="block text-sm text-gray-700 flex-1">{tip}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>
          </View>
        )}
      </View>
    </View>
  )
}

export default DatingOpenerPage
