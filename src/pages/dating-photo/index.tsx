import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useLoad, chooseImage, previewImage } from '@tarojs/taro'
import type { FC } from 'react'
import { Camera, X, Star, Sparkles, Wand, ChevronDown, History, Trash2, Clock, CircleAlert, Loader } from 'lucide-react-taro'
import { Network } from '@/network'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PhotoScore {
  overallScore: number
  dimensions: {
    name: string
    score: number
    comment: string
  }[]
  suggestions: string[]
  summary: string
  isFallback?: boolean
}

interface OptimizedPhoto {
  originalUrl: string
  optimizedUrl: string
  improvements: string[]
}

interface PhotoHistory {
  id: number
  platform: string
  photoUrls: string[]
  analysisResult: PhotoScore
  createdAt: string
}

const platformOptions = [
  { value: 'tantan', label: '探探', icon: '💕', desc: '国内主流，左滑右滑' },
  { value: 'soul', label: 'Soul', icon: '🌙', desc: '灵魂社交，兴趣匹配' },
  { value: 'tinder', label: 'Tinder', icon: '🔥', desc: '国际化，简洁高效' },
  { value: 'momo', label: '陌陌', icon: '📍', desc: '附近的人，直接大方' },
  { value: 'bumble', label: 'Bumble', icon: '🐝', desc: '女性主动，高质量' },
  { value: 'hinge', label: 'Hinge', icon: '💫', desc: '严肃交友，长期关系' },
  { value: 'qingten', label: '青藤', icon: '🌱', desc: '高学历，优质青年' },
  { value: 'marryu', label: 'MarryU', icon: '💍', desc: '严肃婚恋，以结婚为目的' },
]

const PAGE_SIZE = 10

const DatingPhotoPage: FC = () => {
  const [photos, setPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [analysis, setAnalysis] = useState<PhotoScore | null>(null)
  const [generating, setGenerating] = useState(false)
  const [optimizedPhoto, setOptimizedPhoto] = useState<OptimizedPhoto | null>(null)
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState('')

  // 平台选择
  const [platform, setPlatform] = useState('tantan')
  const [showPlatformPicker, setShowPlatformPicker] = useState(false)

  // 历史记录
  const [showHistory, setShowHistory] = useState(false)
  const [historyList, setHistoryList] = useState<PhotoHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyOffset, setHistoryOffset] = useState(0)

  const currentPlatform = platformOptions.find((p) => p.value === platform) || platformOptions[0]

  useLoad(() => {
    console.log('Dating photo evaluation page loaded.')
  })

  useEffect(() => {
    if (showHistory) {
      setHistoryOffset(0)
      loadHistory(0)
    }
  }, [showHistory])

  const loadHistory = async (offset: number = 0) => {
    setHistoryLoading(true)
    try {
      const res = await Network.request({
        url: `/api/dating/photo/history?limit=${PAGE_SIZE}&offset=${offset}`,
        method: 'GET',
      })
      console.log('Photo history response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        const newList = res.data.data.list || []
        setHistoryList(offset === 0 ? newList : [...historyList, ...newList])
        setHistoryTotal(res.data.data.total || 0)
        setHistoryOffset(offset)
      }
    } catch (error) {
      console.error('Load photo history error:', error)
      setErrorMsg('加载历史记录失败')
    } finally {
      setHistoryLoading(false)
    }
  }

  const loadMoreHistory = () => {
    if (historyList.length < historyTotal) {
      loadHistory(historyOffset + PAGE_SIZE)
    }
  }

  const handlePreviewImage = (url: string, urls: string[]) => {
    previewImage({ current: url, urls })
  }

  const handleChoosePhoto = () => {
    if (photos.length >= 3) return

    chooseImage({
      count: 3 - photos.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
    }).then((res) => {
      const newPhotos = [...photos, ...res.tempFilePaths].slice(0, 3)
      setPhotos(newPhotos)
      setAnalysis(null)
      setOptimizedPhoto(null)
      setErrorMsg('')
    })
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    setPhotos(newPhotos)
    setAnalysis(null)
    setOptimizedPhoto(null)
  }

  const handleAnalyze = async () => {
    if (photos.length === 0) {
      setErrorMsg('请先上传至少一张照片')
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      // 并行上传所有照片
      setUploadProgress('正在上传照片...')
      const uploadPromises = photos.map(async (photo, index) => {
        setUploadProgress(`正在上传第 ${index + 1}/${photos.length} 张照片...`)
        const uploadRes = await Network.uploadFile({
          url: '/api/dating/upload-photo',
          filePath: photo,
          name: 'photo',
        })
        console.log('Upload response:', uploadRes.data)

        let resData: { code: number; data: { url: string } }
        if (typeof uploadRes.data === 'string') {
          resData = JSON.parse(uploadRes.data)
        } else {
          resData = uploadRes.data
        }

        if (resData.code === 200 && resData.data?.url) {
          return resData.data.url
        }
        return null
      })

      const uploadedResults = await Promise.all(uploadPromises)
      const uploadedUrls = uploadedResults.filter(Boolean) as string[]

      if (uploadedUrls.length === 0) {
        setErrorMsg('照片上传失败，请重试')
        return
      }

      // 分析照片
      setUploadProgress('正在分析照片...')
      const res = await Network.request({
        url: '/api/dating/photo/evaluate',
        method: 'POST',
        data: { photoUrls: uploadedUrls, platform },
      })
      console.log('Photo evaluation response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        const result = res.data.data
        setAnalysis(result)
        setOriginalPhotoUrl(uploadedUrls[0])

        if (result.isFallback) {
          setErrorMsg('AI 评分遇到问题，以下为参考建议，建议稍后重试')
        }

        // 保存历史记录
        try {
          await Network.request({
            url: '/api/dating/photo/history',
            method: 'POST',
            data: {
              platform,
              photoUrls: uploadedUrls,
              analysisResult: result,
            },
          })
          console.log('Photo history saved')
        } catch (saveError) {
          console.error('Save photo history error:', saveError)
        }
      } else {
        setErrorMsg('照片评分失败，请稍后重试')
      }
    } catch (error) {
      console.error('Photo evaluation error:', error)
      setErrorMsg('网络错误，请检查网络后重试')
    } finally {
      setLoading(false)
      setUploadProgress('')
    }
  }

  const handleGenerateOptimized = async () => {
    if (!originalPhotoUrl || !analysis?.suggestions) return

    setGenerating(true)
    try {
      const res = await Network.request({
        url: '/api/dating/photo/generate-optimized',
        method: 'POST',
        data: {
          originalPhotoUrl,
          suggestions: analysis.suggestions,
        },
      })
      console.log('Generate optimized photo response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setOptimizedPhoto(res.data.data)
      } else {
        setErrorMsg('生成优化示例失败，请稍后重试')
      }
    } catch (error) {
      console.error('Generate optimized photo error:', error)
      setErrorMsg('网络错误，请检查网络后重试')
    } finally {
      setGenerating(false)
    }
  }

  const handleReset = () => {
    setPhotos([])
    setAnalysis(null)
    setOptimizedPhoto(null)
    setOriginalPhotoUrl('')
    setErrorMsg('')
    setUploadProgress('')
  }

  const handleDeleteHistory = async (id: number, e: any) => {
    e.stopPropagation()
    try {
      const res = await Network.request({
        url: `/api/dating/photo/history/${id}`,
        method: 'DELETE',
      })
      if (res.data?.code === 200) {
        setHistoryList((prev) => prev.filter((h) => h.id !== id))
        setHistoryTotal((prev) => prev - 1)
      }
    } catch (error) {
      console.error('Delete photo history error:', error)
    }
  }

  const handleLoadHistory = (history: PhotoHistory) => {
    setPlatform(history.platform)
    setPhotos([])
    setAnalysis(history.analysisResult)
    setOriginalPhotoUrl(history.photoUrls?.[0] || '')
    setOptimizedPhoto(null)
    setShowHistory(false)
    setErrorMsg('')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hour}:${minute}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部说明 */}
      <View className="bg-amber-50 px-4 py-3">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center flex-1">
            <Camera size={18} color="#f59e0b" />
            <Text className="block text-sm text-amber-700 ml-2">上传照片，AI 将评估吸引力并给出改进建议</Text>
          </View>
          <View
            className="flex flex-row items-center px-3 py-1 bg-white rounded-full"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={16} color="#f59e0b" />
            <Text className="text-xs text-amber-600 ml-1">历史</Text>
          </View>
        </View>
      </View>

      {/* 错误提示 */}
      {errorMsg && (
        <View className="mx-4 mt-3 bg-red-50 rounded-xl px-4 py-3 flex flex-row items-center">
          <CircleAlert size={16} color="#ef4444" />
          <Text className="text-sm text-red-600 ml-2 flex-1">{errorMsg}</Text>
          <View onClick={() => setErrorMsg('')}>
            <Text className="text-xs text-red-400">关闭</Text>
          </View>
        </View>
      )}

      {/* 历史记录 */}
      {showHistory && (
        <View className="bg-white border-b border-gray-100">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-sm font-medium text-gray-900">照片评分历史</Text>
          </View>
          {historyLoading && historyList.length === 0 ? (
            <View className="px-4 py-8 flex flex-col items-center">
              <Loader size={20} color="#9ca3af" className="animate-spin" />
              <Text className="text-sm text-gray-400 mt-2">加载中...</Text>
            </View>
          ) : historyList.length === 0 ? (
            <View className="px-4 py-8 flex flex-col items-center">
              <Clock size={24} color="#d1d5db" />
              <Text className="text-sm text-gray-400 mt-2">暂无历史记录</Text>
            </View>
          ) : (
            <ScrollView scrollY className="max-h-80">
              {historyList.map((history) => {
                const platformInfo = platformOptions.find((p) => p.value === history.platform)
                return (
                  <View
                    key={history.id}
                    className="px-4 py-3 border-b border-gray-50 flex flex-row items-center justify-between active:bg-gray-50"
                    onClick={() => handleLoadHistory(history)}
                  >
                    <View className="flex-1 mr-3">
                      <View className="flex flex-row items-center mb-1">
                        <Text className="text-sm mr-1">{platformInfo?.icon}</Text>
                        <View className="bg-amber-100 rounded-full px-2 py-1 mr-2">
                          <Text className="text-xs text-amber-600">{history.analysisResult.overallScore}分</Text>
                        </View>
                        <Text className="text-xs text-gray-400">{formatDate(history.createdAt)}</Text>
                      </View>
                      <Text className="text-xs text-gray-400">{history.photoUrls?.length || 0}张照片</Text>
                    </View>
                    <View className="p-2 rounded-lg active:bg-gray-100" onClick={(e) => handleDeleteHistory(history.id, e)}>
                      <Trash2 size={16} color="#9ca3af" />
                    </View>
                  </View>
                )
              })}
              {historyList.length < historyTotal && (
                <View className="px-4 py-3 flex flex-col items-center" onClick={loadMoreHistory}>
                  <Text className="text-xs text-amber-500">{historyLoading ? '加载中...' : '加载更多'}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}

      <View className="p-4">
        {/* 平台选择 */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">选择平台</CardTitle>
          </CardHeader>
          <CardContent>
            <View
              className="bg-gray-50 rounded-xl px-4 py-3 flex flex-row items-center justify-between"
              onClick={() => setShowPlatformPicker(!showPlatformPicker)}
            >
              <View className="flex flex-row items-center">
                <Text className="text-lg mr-2">{currentPlatform.icon}</Text>
                <Text className="text-sm text-gray-700">{currentPlatform.label}</Text>
                <Text className="text-xs text-gray-400 ml-2">{currentPlatform.desc}</Text>
              </View>
              <ChevronDown size={18} color="#9ca3af" />
            </View>

            {showPlatformPicker && (
              <View className="mt-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
                {platformOptions.map((option) => (
                  <View
                    key={option.value}
                    className={`px-4 py-3 flex flex-row items-center justify-between ${platform === option.value ? 'bg-amber-50' : ''}`}
                    onClick={() => {
                      setPlatform(option.value)
                      setShowPlatformPicker(false)
                    }}
                  >
                    <View className="flex flex-row items-center">
                      <Text className="text-lg mr-2">{option.icon}</Text>
                      <View>
                        <Text className="text-sm text-gray-700">{option.label}</Text>
                        <Text className="text-xs text-gray-400">{option.desc}</Text>
                      </View>
                    </View>
                    {platform === option.value && <Text className="text-amber-500">✓</Text>}
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>

        {/* 照片上传区 */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">上传照片</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex flex-row flex-wrap gap-3">
              {photos.map((photo, index) => (
                <View
                  key={index}
                  className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden"
                  style={{ position: 'relative' }}
                >
                  <Image src={photo} mode="aspectFill" style={{ width: '100%', height: '100%' }} />
                  <View
                    className="absolute top-1 right-1 bg-black/50 rounded-full w-5 h-5 flex items-center justify-center"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <X size={12} color="#fff" />
                  </View>
                </View>
              ))}

              {photos.length < 3 && (
                <View
                  className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center"
                  onClick={handleChoosePhoto}
                >
                  <Camera size={24} color="#9ca3af" />
                  <Text className="block text-xs text-gray-400 mt-1">添加照片</Text>
                </View>
              )}
            </View>
            <Text className="block text-xs text-gray-400 mt-2">最多上传 3 张照片，建议包含清晰的正面照</Text>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <View className="flex flex-row gap-3 mb-4">
          <View className="flex-1">
            <Button variant="default" className="bg-amber-500 text-white rounded-xl" disabled={loading || photos.length === 0} onClick={handleAnalyze}>
              <Text className="text-white">{uploadProgress || (loading ? '评分中...' : '开始评分')}</Text>
            </Button>
          </View>
          <View className="flex-1">
            <Button variant="secondary" className="rounded-xl" onClick={handleReset}>
              <Text>重置</Text>
            </Button>
          </View>
        </View>

        {/* 空状态引导 */}
        {!analysis && !loading && photos.length === 0 && (
          <View className="py-6 flex flex-col items-center">
            <Camera size={32} color="#d1d5db" />
            <Text className="text-sm text-gray-400 mt-3">上传照片后即可开始 AI 评分</Text>
            <Text className="text-xs text-gray-300 mt-1">支持从相册选择或拍照上传</Text>
          </View>
        )}

        {/* 分析结果 */}
        {analysis && (
          <View>
            {/* 兜底提示 */}
            {analysis.isFallback && (
              <View className="bg-amber-50 rounded-xl px-4 py-3 mb-4 flex flex-row items-center">
                <CircleAlert size={16} color="#f59e0b" />
                <Text className="text-xs text-amber-600 ml-2 flex-1">AI 评分遇到问题，以下为参考建议，建议稍后重试</Text>
              </View>
            )}

            {/* 总体评分 */}
            <Card className="bg-gradient-to-br from-amber-500 to-orange-500 mb-4">
              <CardContent className="py-6">
                <View className="flex flex-col items-center">
                  <View className="flex flex-row items-center">
                    <Star size={24} color="#fff" />
                    <Text className="block text-5xl font-bold text-white ml-2">{analysis.overallScore}</Text>
                  </View>
                  <Text className="block text-sm text-amber-100 mt-2">照片吸引力评分</Text>
                </View>
              </CardContent>
            </Card>

            {/* 维度评分 */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">详细评分</CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.dimensions.map((dimension, index) => (
                  <View key={index} className="mb-4 last:mb-0">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="block text-sm font-medium text-gray-700">{dimension.name}</Text>
                      <Text className={`block text-lg font-bold ${getScoreColor(dimension.score)}`}>{dimension.score}</Text>
                    </View>
                    <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <View
                        className={`h-full rounded-full ${dimension.score >= 80 ? 'bg-green-500' : dimension.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${dimension.score}%` }}
                      />
                    </View>
                    <Text className="block text-xs text-gray-500 mt-1">{dimension.comment}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>

            {/* 改进建议 */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <View className="flex flex-row items-center">
                  <Sparkles size={18} color="#f59e0b" />
                  <Text className="block text-base font-semibold text-gray-900 ml-2">改进建议</Text>
                </View>
              </CardHeader>
              <CardContent>
                {analysis.suggestions.map((suggestion, index) => (
                  <View key={index} className="flex flex-row items-start mb-2">
                    <Text className="block text-amber-500 mr-2">•</Text>
                    <Text className="block text-sm text-gray-700 flex-1">{suggestion}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>

            {/* 生成优化示例按钮 */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 mb-4">
              <CardContent className="py-4">
                <View className="flex flex-col items-center">
                  <Wand size={24} color="#9333ea" />
                  <Text className="block text-sm font-medium text-gray-700 mt-2 mb-3">想看看优化后的效果？</Text>
                  <Button variant="default" className="bg-purple-500 text-white rounded-xl px-6" disabled={generating} onClick={handleGenerateOptimized}>
                    <Text className="text-white">{generating ? '生成中...' : '生成优化示例'}</Text>
                  </Button>
                  <Text className="block text-xs text-gray-400 mt-2">AI 将根据建议生成优化后的示例照片</Text>
                </View>
              </CardContent>
            </Card>

            {/* 优化后的照片 */}
            {optimizedPhoto && (
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <View className="flex flex-row items-center">
                    <Wand size={18} color="#9333ea" />
                    <Text className="block text-base font-semibold text-gray-900 ml-2">优化示例</Text>
                  </View>
                </CardHeader>
                <CardContent>
                  <View className="flex flex-row gap-4">
                    <View className="flex-1">
                      <Text className="block text-xs text-gray-500 mb-2 text-center">原始照片</Text>
                      <View
                        className="aspect-square rounded-xl overflow-hidden bg-gray-100"
                        onClick={() => handlePreviewImage(optimizedPhoto.originalUrl, [optimizedPhoto.originalUrl, optimizedPhoto.optimizedUrl])}
                      >
                        <Image src={optimizedPhoto.originalUrl} mode="aspectFill" style={{ width: '100%', height: '100%' }} />
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="block text-xs text-purple-600 mb-2 text-center">优化示例</Text>
                      <View
                        className="aspect-square rounded-xl overflow-hidden bg-purple-50 border-2 border-purple-200"
                        onClick={() => handlePreviewImage(optimizedPhoto.optimizedUrl, [optimizedPhoto.originalUrl, optimizedPhoto.optimizedUrl])}
                      >
                        <Image src={optimizedPhoto.optimizedUrl} mode="aspectFill" style={{ width: '100%', height: '100%' }} />
                      </View>
                    </View>
                  </View>
                  <View className="mt-3 p-3 bg-purple-50 rounded-lg">
                    <Text className="block text-xs text-purple-700">
                      点击图片可查看大图。这是 AI 根据建议生成的示例照片，仅供参考。实际优化时，建议根据建议重新拍摄或调整。
                    </Text>
                  </View>
                </CardContent>
              </Card>
            )}

            {/* 总结 */}
            <Card className="bg-amber-50">
              <CardContent className="py-4">
                <Text className="block text-sm text-amber-700 leading-relaxed">{analysis.summary}</Text>
              </CardContent>
            </Card>
          </View>
        )}
      </View>
    </View>
  )
}

export default DatingPhotoPage
