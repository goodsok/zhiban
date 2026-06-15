import { View, Text, Image } from '@tarojs/components'
import { Textarea } from '@/components/ui/textarea'
import { useLoad, useRouter, chooseImage, showToast } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
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
  highEnergyComments: Array<{ style: string; text: string; purpose: string }>
  interactionTips: string
}

interface AnalysisData {
  result: AnalysisResult
  advice: InteractionAdvice
}

const MomentsAnalyzePage: FC = () => {
  const router = useRouter()
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
        const matchList = res.data.data.list
        setMatches(matchList)
        // 如果 URL 带了 matchId，自动选中该对象
        const urlMatchId = router.params.matchId
        if (urlMatchId) {
          const autoSelect = matchList.find((m: Match) => String(m.id) === urlMatchId)
          if (autoSelect) {
            setSelectedMatch(autoSelect)
          }
        }
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

            console.log('Upload response:', uploadRes)
            
            // Taro.uploadFile 返回的 data 是字符串，需要解析
            let resData: { code: number; data: { url: string } }
            if (typeof uploadRes.data === 'string') {
              resData = JSON.parse(uploadRes.data)
            } else {
              resData = uploadRes.data as unknown as { code: number; data: { url: string } }
            }
            
            console.log('Parsed response:', resData)
            
            if (resData.code === 200 && resData.data?.url) {
              setUploadedImages(prev => [...prev, resData.data.url])
              showToast({ title: '上传成功', icon: 'success' })
            } else {
              showToast({ title: '上传失败', icon: 'error' })
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
    if (analyzing) return
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
      <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
        <CustomHeader title="分析结果" />

        <View className="p-4">
          {/* 情绪状态 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4" style={{ boxSizing: 'border-box', overflow: 'hidden' }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <Heart size={18} color="#EC4899" />
              <Text className="block text-base font-semibold text-gray-900">情绪状态</Text>
            </View>
            <Text className="block text-sm text-gray-600">{analysis.result.emotionalState}</Text>
          </View>

          {/* 兴趣爱好 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4" style={{ boxSizing: 'border-box', overflow: 'hidden' }}>
            <Text className="block text-base font-semibold text-gray-900 mb-2">推断的兴趣</Text>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {analysis.result.interests.map((interest, index) => (
                <View key={index} className="px-3 py-1 bg-green-50 rounded-xl">
                  <Text className="block text-sm text-green-600">{interest}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 生活重心 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4" style={{ boxSizing: 'border-box', overflow: 'hidden' }}>
            <Text className="block text-base font-semibold text-gray-900 mb-2">当前生活重心</Text>
            <Text className="block text-sm text-gray-600">{analysis.result.lifeFocus}</Text>
          </View>

          {/* 可切入话题 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4" style={{ boxSizing: 'border-box', overflow: 'hidden' }}>
            <Text className="block text-base font-semibold text-gray-900 mb-2">可切入话题</Text>
            {analysis.result.topics.map((topic, index) => (
              <View key={index} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                <View className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Text className="block text-xs text-green-600">{index + 1}</Text>
                </View>
                <Text className="block text-sm text-gray-600">{topic}</Text>
              </View>
            ))}
          </View>

          {/* 互动建议 */}
          <View className="rounded-2xl p-4 mb-4" style={{ background: 'linear-gradient(135deg, #4ECB71, #14B8A6)', boxSizing: 'border-box', overflow: 'hidden' }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <MessageCircle size={18} color="#fff" />
              <Text className="block text-base font-semibold text-white">互动建议</Text>
            </View>
            
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 12, marginBottom: 16, boxSizing: 'border-box', overflow: 'hidden' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)' }} className="block text-sm mb-1">点赞时机</Text>
              <Text className="block text-sm text-white">{analysis.advice.likeTiming}</Text>
            </View>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 12, marginBottom: 16, boxSizing: 'border-box', overflow: 'hidden' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)' }} className="block text-sm mb-2">⚡ 吸引型话术</Text>
              {analysis.advice.highEnergyComments?.map((comment, index) => (
                <View key={index} className="mb-4 last:mb-0">
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <View className="px-2 py-1 bg-yellow-400 rounded">
                      <Text className="block text-xs text-yellow-900 font-medium">{comment.style}</Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.6)' }} className="block text-xs">{comment.purpose}</Text>
                  </View>
                  <Text className="block text-sm text-white leading-relaxed">{comment.text}</Text>
                </View>
              ))}
            </View>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 12, boxSizing: 'border-box', overflow: 'hidden' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)' }} className="block text-sm mb-1">互动技巧</Text>
              <Text className="block text-sm text-white">{analysis.advice.interactionTips}</Text>
            </View>
          </View>

          {/* 重新分析 */}
          <View
            className="bg-green-500 rounded-xl py-3 flex items-center justify-center"
            onClick={() => {
              setAnalysis(null)
              setInputContent('')
              setUploadedImages([])
            }}
          >
            <Text className="block text-white font-medium">分析新内容</Text>
          </View>
        </View>
      </View>
    )
  }

  // 输入页面
  return (
    <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="朋友圈分析" />

      <View className="p-4">
        {/* 选择对象 */}
        <View className="bg-white rounded-2xl shadow-soft p-4 mb-4" style={{ boxSizing: 'border-box', overflow: 'hidden' }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <User size={18} color="#374151" />
            <Text className="block text-base font-semibold text-gray-900">选择对象（可选）</Text>
          </View>
          
          <View
            className={`p-3 rounded-xl flex items-center justify-between mb-2 ${
              selectedMatch === null ? 'bg-green-500' : 'bg-gray-50'
            }`}
            onClick={() => setSelectedMatch(null)}
          >
            <Text className={`block font-medium ${selectedMatch === null ? 'text-white' : 'text-gray-900'}`}>
              不关联对象
            </Text>
          </View>
          
          {matches.length > 0 && (
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {matches.map((match) => {
                const isSelected = selectedMatch?.id === match.id
                return (
                  <View
                    key={match.id}
                    className={`px-3 py-2 rounded-xl ${
                      isSelected ? 'bg-green-500' : 'bg-gray-100'
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
        <View className="bg-white rounded-2xl shadow-soft p-4 mb-4" style={{ boxSizing: 'border-box', overflow: 'hidden' }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Camera size={18} color="#374151" />
            <Text className="block text-base font-semibold text-gray-900">上传朋友圈截图</Text>
          </View>
          
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {uploadedImages.map((url, index) => (
              <View key={index} className="relative" style={{ width: 80, height: 80, position: 'relative' }}>
                <Image
                  src={url}
                  style={{ width: 80, height: 80, borderRadius: 12 }}
                  mode="aspectFill"
                />
                <View
                  style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, backgroundColor: '#4ECB71', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => removeImage(index)}
                >
                  <X size={12} color="#fff" />
                </View>
              </View>
            ))}
            
            {uploadedImages.length < 3 && (
              <View
                style={{ width: 80, height: 80, borderRadius: 12, border: '2px dashed #D1D5DB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
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
        <View className="bg-white rounded-2xl shadow-soft p-4 mb-4" style={{ boxSizing: 'border-box', overflow: 'hidden' }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Search size={18} color="#374151" />
            <Text className="block text-base font-semibold text-gray-900">补充文字内容（可选）</Text>
          </View>
          
          <Textarea
            wrapperClassName="w-full bg-gray-50 rounded-xl p-3 mb-4"
            className="w-full"
            style={{ minHeight: '100px' }}
            placeholder="粘贴对方的朋友圈文案，或补充截图中的关键信息..."
            value={inputContent}
            onInput={(e) => setInputContent(e.detail.value)}
          />

          <Text className="block text-xs text-gray-400">
            示例：今天终于把那个项目搞定了，加班到半夜但很值得
          </Text>
        </View>

        {/* 分析按钮 */}
        <View
          className={`rounded-xl py-3 flex items-center justify-center gap-3 mb-8 ${
            (inputContent.trim() || uploadedImages.length > 0) ? 'bg-green-500' : 'bg-gray-200'
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
      </View>
    </View>
  )
}

export default MomentsAnalyzePage
