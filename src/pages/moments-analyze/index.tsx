import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useLoad, chooseImage, showToast } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { Textarea } from '@/components/ui/textarea'
import { User, Search, LoaderCircle, Sparkles, MessageCircle, Heart, ImagePlus, X, Camera } from 'lucide-react-taro'

interface Match {
  id: number
  name: string
}

interface AnalysisResult {
  emotionalState: string
  interests: string[]
  lifeFocus: string
  topics: string[]
}

interface InteractionAdvice {
  likeTiming: string
  commentExamples: string[]
  interactionTips: string
}

interface AnalysisData {
  result: AnalysisResult
  advice: InteractionAdvice
}

const MomentsAnalyzePage: FC = () => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [inputContent, setInputContent] = useState('')
  const [matches, setMatches] = useState<Match[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  // 图片上传相关状态
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  useLoad(() => {
    fetchMatches()
  })

  const fetchMatches = async () => {
    try {
      const res = await Network.request({ url: '/api/match/list' })
      if (res.data?.code === 200 && res.data?.data?.list) {
        setMatches(res.data.data.list)
      }
    } catch (error) {
      console.error('Fetch matches error:', error)
    }
  }

  // 选择图片
  const handleChooseImage = async () => {
    try {
      const result = await chooseImage({
        count: 3 - uploadedImages.length, // 最多3张
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })

      if (result.tempFilePaths && result.tempFilePaths.length > 0) {
        setUploading(true)
        
        for (const tempFilePath of result.tempFilePaths) {
          try {
            const uploadRes = await Network.uploadFile({
              url: '/api/moments/upload-image',
              filePath: tempFilePath,
              name: 'file',
            })

            // Network.uploadFile 返回的是解析后的响应体
            const resData = uploadRes as unknown as { code: number; data: { url: string } }
            if (resData.code === 200 && resData.data?.url) {
              setUploadedImages(prev => [...prev, resData.data.url])
            }
          } catch (uploadError) {
            console.error('Upload image error:', uploadError)
            showToast({ title: '图片上传失败', icon: 'error' })
          }
        }
        
        setUploading(false)
      }
    } catch (error) {
      console.error('Choose image error:', error)
    }
  }

  // 删除图片
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const analyze = async () => {
    if (!inputContent.trim() && uploadedImages.length === 0) return
    
    try {
      setAnalyzing(true)
      const res = await Network.request({
        url: '/api/moments/analyze',
        method: 'POST',
        data: {
          matchId: selectedMatch?.id,
          inputContent: inputContent.trim(),
          imageUrls: uploadedImages,
        }
      })
      
      console.log('Analyze response:', res.data)
      
      if (res.data?.code === 200 && res.data?.data) {
        setAnalysis(res.data.data)
      }
    } catch (error) {
      console.error('Analyze error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  // 结果展示
  if (analysis) {
    return (
      <View className="min-h-screen bg-gray-50">
        <CustomHeader title="分析结果" />

        <ScrollView className="p-4" scrollY>
          {/* 情绪状态 */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <View className="flex items-center gap-2 mb-2">
              <Heart size={18} color="#EC4899" />
              <Text className="block text-base font-semibold text-gray-900">情绪状态</Text>
            </View>
            <Text className="block text-sm text-gray-600">{analysis.result.emotionalState}</Text>
          </View>

          {/* 兴趣爱好 */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="block text-base font-semibold text-gray-900 mb-2">推断的兴趣</Text>
            <View className="flex flex-wrap gap-2">
              {analysis.result.interests.map((interest, index) => (
                <View key={index} className="px-3 py-1 bg-purple-50 rounded-lg">
                  <Text className="block text-sm text-purple-600">{interest}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 生活重心 */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="block text-base font-semibold text-gray-900 mb-2">当前生活重心</Text>
            <Text className="block text-sm text-gray-600">{analysis.result.lifeFocus}</Text>
          </View>

          {/* 可切入话题 */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="block text-base font-semibold text-gray-900 mb-2">可切入话题</Text>
            {analysis.result.topics.map((topic, index) => (
              <View key={index} className="flex items-start gap-2 mb-2">
                <View className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Text className="block text-xs text-green-600">{index + 1}</Text>
                </View>
                <Text className="block text-sm text-gray-600">{topic}</Text>
              </View>
            ))}
          </View>

          {/* 互动建议 */}
          <View className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 mb-4">
            <View className="flex items-center gap-2 mb-3">
              <MessageCircle size={18} color="#fff" />
              <Text className="block text-base font-semibold text-white">互动建议</Text>
            </View>
            
            <View className="bg-white bg-opacity-20 rounded-xl p-3 mb-3">
              <Text className="block text-sm text-white text-opacity-90 mb-1">点赞时机</Text>
              <Text className="block text-sm text-white">{analysis.advice.likeTiming}</Text>
            </View>

            <View className="bg-white bg-opacity-20 rounded-xl p-3 mb-3">
              <Text className="block text-sm text-white text-opacity-90 mb-1">评论话术</Text>
              {analysis.advice.commentExamples.map((comment, index) => (
                <Text key={index} className="block text-sm text-white mt-1">• {comment}</Text>
              ))}
            </View>

            <View className="bg-white bg-opacity-20 rounded-xl p-3">
              <Text className="block text-sm text-white text-opacity-90 mb-1">互动技巧</Text>
              <Text className="block text-sm text-white">{analysis.advice.interactionTips}</Text>
            </View>
          </View>

          {/* 重新分析 */}
          <View
            className="bg-black rounded-xl py-3 flex items-center justify-center"
            onClick={() => {
              setAnalysis(null)
              setInputContent('')
              setUploadedImages([])
            }}
          >
            <Text className="block text-white font-medium">分析新内容</Text>
          </View>
        </ScrollView>
      </View>
    )
  }

  // 输入页面
  return (
    <View className="min-h-screen bg-gray-50">
      <CustomHeader title="朋友圈分析" />

      <ScrollView className="p-4" scrollY>
        {/* 选择对象 */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex items-center gap-2 mb-3">
            <User size={18} color="#374151" />
            <Text className="block text-base font-semibold text-gray-900">选择对象（可选）</Text>
          </View>
          
          <View
            className={`p-3 rounded-xl flex items-center justify-between mb-2 ${
              selectedMatch === null ? 'bg-black' : 'bg-gray-50'
            }`}
            onClick={() => setSelectedMatch(null)}
          >
            <Text className={`block font-medium ${selectedMatch === null ? 'text-white' : 'text-gray-900'}`}>
              不关联对象
            </Text>
          </View>
          
          {matches.length > 0 && (
            <View className="flex flex-wrap gap-2">
              {matches.map((match) => {
                const isSelected = selectedMatch?.id === match.id
                return (
                  <View
                    key={match.id}
                    className={`px-3 py-2 rounded-lg ${
                      isSelected ? 'bg-black' : 'bg-gray-100'
                    }`}
                    onClick={() => setSelectedMatch(match)}
                  >
                    <Text className={`block text-sm ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                      {match.name}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}
        </View>

        {/* 上传截图 */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex items-center gap-2 mb-3">
            <Camera size={18} color="#374151" />
            <Text className="block text-base font-semibold text-gray-900">上传朋友圈截图</Text>
          </View>
          
          <View className="flex flex-wrap gap-3">
            {uploadedImages.map((url, index) => (
              <View key={index} className="relative">
                <Image
                  src={url}
                  className="w-20 h-20 rounded-xl"
                  mode="aspectFill"
                />
                <View
                  className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center"
                  onClick={() => removeImage(index)}
                >
                  <X size={12} color="#fff" />
                </View>
              </View>
            ))}
            
            {uploadedImages.length < 3 && (
              <View
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center"
                onClick={handleChooseImage}
              >
                {uploading ? (
                  <LoaderCircle size={20} color="#9CA3AF" className="animate-spin" />
                ) : (
                  <>
                    <ImagePlus size={20} color="#9CA3AF" />
                    <Text className="block text-xs text-gray-400 mt-1">添加图片</Text>
                  </>
                )}
              </View>
            )}
          </View>
          
          <Text className="block text-xs text-gray-400 mt-2">
            最多上传3张截图，支持从相册选择或拍照
          </Text>
        </View>

        {/* 输入内容 */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex items-center gap-2 mb-3">
            <Search size={18} color="#374151" />
            <Text className="block text-base font-semibold text-gray-900">补充文字内容（可选）</Text>
          </View>
          
          <View className="bg-gray-50 rounded-xl p-3 mb-3">
            <Textarea
              className="w-full"
              style={{ minHeight: '100px' }}
              placeholder="粘贴对方的朋友圈文案，或补充截图中的关键信息..."
              value={inputContent}
              onInput={(e) => setInputContent(e.detail.value)}
            />
          </View>

          <Text className="block text-xs text-gray-400">
            示例：今天终于把那个项目搞定了，加班到半夜但很值得
          </Text>
        </View>

        {/* 分析按钮 */}
        <View
          className={`rounded-xl py-3 flex items-center justify-center gap-2 mb-8 ${
            (inputContent.trim() || uploadedImages.length > 0) ? 'bg-black' : 'bg-gray-200'
          }`}
          onClick={analyze}
        >
          {analyzing ? (
            <LoaderCircle size={18} color="#fff" className="animate-spin" />
          ) : (
            <>
              <Sparkles size={18} color={(inputContent.trim() || uploadedImages.length > 0) ? '#fff' : '#9CA3AF'} />
              <Text className={`block font-medium ${(inputContent.trim() || uploadedImages.length > 0) ? 'text-white' : 'text-gray-400'}`}>
                开始分析
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default MomentsAnalyzePage
