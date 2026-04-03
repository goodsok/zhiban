import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Sparkles, CircleCheck, CircleAlert } from 'lucide-react-taro'
import { Network } from '@/network'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ProfileAnalysis {
  overallScore: number
  strengths: string[]
  improvements: string[]
  suggestions: {
    field: string
    original: string
    suggested: string
    reason: string
  }[]
  summary: string
}

const DatingProfilePage: FC = () => {
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null)

  useLoad(() => {
    console.log('Dating profile optimization page loaded.')
  })

  const handleAnalyze = async () => {
    if (!nickname.trim() && !bio.trim() && !interests.trim()) {
      return
    }

    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/dating/profile/optimize',
        method: 'POST',
        data: {
          nickname: nickname.trim(),
          bio: bio.trim(),
          interests: interests.trim(),
        },
      })
      console.log('Profile optimization response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setAnalysis(res.data.data)
      }
    } catch (error) {
      console.error('Profile optimization error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setNickname('')
    setBio('')
    setInterests('')
    setAnalysis(null)
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部说明 */}
      <View className="bg-blue-50 px-4 py-3">
        <View className="flex flex-row items-center">
          <Sparkles size={18} color="#3b82f6" />
          <Text className="block text-sm text-blue-700 ml-2">
            输入你当前的交友软件资料，AI 将给出专业优化建议
          </Text>
        </View>
      </View>

      {/* 输入表单 */}
      <View className="p-4">
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 昵称 */}
            <View>
              <Text className="block text-sm font-medium text-gray-700 mb-2">昵称</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Textarea
                  style={{ width: '100%', minHeight: '40px', backgroundColor: 'transparent' }}
                  placeholder="输入你的昵称..."
                  maxlength={20}
                  value={nickname}
                  onInput={(e) => setNickname(e.detail.value)}
                />
              </View>
            </View>

            {/* 个人简介 */}
            <View>
              <Text className="block text-sm font-medium text-gray-700 mb-2">个人简介</Text>
              <View className="bg-gray-50 rounded-xl p-4">
                <Textarea
                  style={{ width: '100%', minHeight: '100px', backgroundColor: 'transparent' }}
                  placeholder="粘贴你的个人简介..."
                  maxlength={500}
                  value={bio}
                  onInput={(e) => setBio(e.detail.value)}
                />
              </View>
              <Text className="block text-xs text-gray-400 mt-1">{bio.length}/500</Text>
            </View>

            {/* 兴趣标签 */}
            <View>
              <Text className="block text-sm font-medium text-gray-700 mb-2">兴趣标签</Text>
              <View className="bg-gray-50 rounded-xl p-4">
                <Textarea
                  style={{ width: '100%', minHeight: '60px', backgroundColor: 'transparent' }}
                  placeholder="输入你的兴趣标签，用逗号分隔..."
                  maxlength={200}
                  value={interests}
                  onInput={(e) => setInterests(e.detail.value)}
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <View className="flex flex-row gap-3 mb-4">
          <View className="flex-1">
            <Button
              variant="default"
              className="bg-blue-500 text-white rounded-xl"
              disabled={loading || (!nickname.trim() && !bio.trim() && !interests.trim())}
              onClick={handleAnalyze}
            >
              <Text className="text-white">{loading ? '分析中...' : '开始分析'}</Text>
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

        {/* 分析结果 */}
        {analysis && (
          <View className="space-y-4">
            {/* 总体评分 */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600">
              <CardContent className="py-6">
                <View className="flex flex-col items-center">
                  <Text className="block text-sm text-blue-100 mb-2">资料吸引力评分</Text>
                  <Text className="block text-5xl font-bold text-white">{analysis.overallScore}</Text>
                  <Text className="block text-xs text-blue-200 mt-1">/ 100分</Text>
                </View>
              </CardContent>
            </Card>

            {/* 优势 */}
            <Card>
              <CardHeader className="pb-3">
                <View className="flex flex-row items-center">
                  <CircleCheck size={18} color="#22c55e" />
                  <Text className="block text-base font-semibold text-gray-900 ml-2">当前优势</Text>
                </View>
              </CardHeader>
              <CardContent>
                {analysis.strengths.map((strength, index) => (
                  <View key={index} className="flex flex-row items-start mb-2">
                    <Text className="block text-green-500 mr-2">✓</Text>
                    <Text className="block text-sm text-gray-700 flex-1">{strength}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>

            {/* 需要改进 */}
            <Card>
              <CardHeader className="pb-3">
                <View className="flex flex-row items-center">
                  <CircleAlert size={18} color="#f59e0b" />
                  <Text className="block text-base font-semibold text-gray-900 ml-2">改进建议</Text>
                </View>
              </CardHeader>
              <CardContent>
                {analysis.improvements.map((improvement, index) => (
                  <View key={index} className="flex flex-row items-start mb-2">
                    <Text className="block text-amber-500 mr-2">!</Text>
                    <Text className="block text-sm text-gray-700 flex-1">{improvement}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>

            {/* 具体优化建议 */}
            {analysis.suggestions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <Text className="block text-base font-semibold text-gray-900">优化方案</Text>
                </CardHeader>
                <CardContent>
                  {analysis.suggestions.map((suggestion, index) => (
                    <View key={index} className="mb-4 pb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                      <Text className="block text-sm font-medium text-gray-900 mb-2">
                        {suggestion.field}
                      </Text>
                      <View className="bg-gray-50 rounded-lg p-3 mb-2">
                        <Text className="block text-xs text-gray-500 mb-1">原文：</Text>
                        <Text className="block text-sm text-gray-600">{suggestion.original || '（未填写）'}</Text>
                      </View>
                      <View className="bg-green-50 rounded-lg p-3 mb-2">
                        <Text className="block text-xs text-green-600 mb-1">建议修改为：</Text>
                        <Text className="block text-sm text-green-700">{suggestion.suggested}</Text>
                      </View>
                      <Text className="block text-xs text-gray-500 italic">{suggestion.reason}</Text>
                    </View>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 总结 */}
            <Card className="bg-blue-50">
              <CardContent className="py-4">
                <Text className="block text-sm text-blue-700 leading-relaxed">{analysis.summary}</Text>
              </CardContent>
            </Card>
          </View>
        )}
      </View>
    </View>
  )
}

export default DatingProfilePage
