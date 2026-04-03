import { useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import { useLoad, chooseImage, uploadFile, previewImage } from '@tarojs/taro'
import type { FC } from 'react'
import { Camera, X, Star, Sparkles, Wand } from 'lucide-react-taro'
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
}

interface OptimizedPhoto {
  originalUrl: string
  optimizedUrl: string
  improvements: string[]
}

const DatingPhotoPage: FC = () => {
  const [photos, setPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<PhotoScore | null>(null)
  const [generating, setGenerating] = useState(false)
  const [optimizedPhoto, setOptimizedPhoto] = useState<OptimizedPhoto | null>(null)

  useLoad(() => {
    console.log('Dating photo evaluation page loaded.')
  })

  // 预览图片
  const handlePreviewImage = (url: string, urls: string[]) => {
    previewImage({
      current: url,
      urls: urls,
    })
  }

  const handleChoosePhoto = () => {
    if (photos.length >= 3) {
      return
    }

    chooseImage({
      count: 3 - photos.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
    }).then((res) => {
      const newPhotos = [...photos, ...res.tempFilePaths].slice(0, 3)
      setPhotos(newPhotos)
      setAnalysis(null)
      setOptimizedPhoto(null)
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
      return
    }

    setLoading(true)
    try {
      // 上传照片
      const uploadedUrls: string[] = []
      for (const photo of photos) {
        const uploadRes = await uploadFile({
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
          uploadedUrls.push(resData.data.url)
        }
      }

      if (uploadedUrls.length === 0) {
        console.error('No photos uploaded successfully')
        return
      }

      // 分析照片
      const res = await Network.request({
        url: '/api/dating/photo/evaluate',
        method: 'POST',
        data: { photoUrls: uploadedUrls },
      })
      console.log('Photo evaluation response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setAnalysis(res.data.data)
        // 存储第一张照片的URL用于后续生成优化
        setOriginalPhotoUrl(uploadedUrls[0])
      }
    } catch (error) {
      console.error('Photo evaluation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string>('')

  const handleGenerateOptimized = async () => {
    if (!originalPhotoUrl || !analysis?.suggestions) {
      return
    }

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
      }
    } catch (error) {
      console.error('Generate optimized photo error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleReset = () => {
    setPhotos([])
    setAnalysis(null)
    setOptimizedPhoto(null)
    setOriginalPhotoUrl('')
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
        <View className="flex flex-row items-center">
          <Camera size={18} color="#f59e0b" />
          <Text className="block text-sm text-amber-700 ml-2">
            上传照片，AI 将评估吸引力并给出改进建议
          </Text>
        </View>
      </View>

      <View className="p-4">
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
                  style={{ width: '100px', height: '100px', position: 'relative' }}
                  className="bg-gray-100 rounded-xl overflow-hidden"
                >
                  <Image
                    src={photo}
                    mode="aspectFill"
                    style={{ width: '100%', height: '100%' }}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <X size={14} color="#fff" />
                  </View>
                </View>
              ))}

              {photos.length < 3 && (
                <View
                  style={{ width: '100px', height: '100px' }}
                  className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center"
                  onClick={handleChoosePhoto}
                >
                  <Camera size={24} color="#9ca3af" />
                  <Text className="block text-xs text-gray-400 mt-1">添加照片</Text>
                </View>
              )}
            </View>
            <Text className="block text-xs text-gray-400 mt-2">
              最多上传 3 张照片，建议包含清晰的正面照
            </Text>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <View className="flex flex-row gap-3 mb-4">
          <View className="flex-1">
            <Button
              variant="default"
              className="bg-amber-500 text-white rounded-xl"
              disabled={loading || photos.length === 0}
              onClick={handleAnalyze}
            >
              <Text className="text-white">{loading ? '评分中...' : '开始评分'}</Text>
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
            <Card className="bg-gradient-to-br from-amber-500 to-orange-500">
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">详细评分</CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.dimensions.map((dimension, index) => (
                  <View key={index} className="mb-4 last:mb-0">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="block text-sm font-medium text-gray-700">{dimension.name}</Text>
                      <Text className={`block text-lg font-bold ${getScoreColor(dimension.score)}`}>
                        {dimension.score}
                      </Text>
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
            <Card>
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
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardContent className="py-4">
                <View className="flex flex-col items-center">
                  <Wand size={24} color="#9333ea" />
                  <Text className="block text-sm font-medium text-gray-700 mt-2 mb-3">
                    想看看优化后的效果？
                  </Text>
                  <Button
                    variant="default"
                    className="bg-purple-500 text-white rounded-xl px-6"
                    disabled={generating}
                    onClick={handleGenerateOptimized}
                  >
                    <Text className="text-white">{generating ? '生成中...' : '生成优化示例'}</Text>
                  </Button>
                  <Text className="block text-xs text-gray-400 mt-2">
                    AI 将根据建议生成优化后的示例照片
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* 优化后的照片 */}
            {optimizedPhoto && (
              <Card>
                <CardHeader className="pb-3">
                  <View className="flex flex-row items-center">
                    <Wand size={18} color="#9333ea" />
                    <Text className="block text-base font-semibold text-gray-900 ml-2">优化示例</Text>
                  </View>
                </CardHeader>
                <CardContent>
                  <View className="flex flex-row gap-4">
                    {/* 原始照片 */}
                    <View className="flex-1">
                      <Text className="block text-xs text-gray-500 mb-2 text-center">原始照片</Text>
                      <View
                        className="aspect-square rounded-xl overflow-hidden bg-gray-100"
                        onClick={() => handlePreviewImage(optimizedPhoto.originalUrl, [optimizedPhoto.originalUrl, optimizedPhoto.optimizedUrl])}
                      >
                        <Image
                          src={optimizedPhoto.originalUrl}
                          mode="aspectFill"
                          style={{ width: '100%', height: '100%' }}
                        />
                      </View>
                    </View>
                    {/* 优化后照片 */}
                    <View className="flex-1">
                      <Text className="block text-xs text-purple-600 mb-2 text-center">优化示例</Text>
                      <View
                        className="aspect-square rounded-xl overflow-hidden bg-purple-50 border-2 border-purple-200"
                        onClick={() => handlePreviewImage(optimizedPhoto.optimizedUrl, [optimizedPhoto.originalUrl, optimizedPhoto.optimizedUrl])}
                      >
                        <Image
                          src={optimizedPhoto.optimizedUrl}
                          mode="aspectFill"
                          style={{ width: '100%', height: '100%' }}
                        />
                      </View>
                    </View>
                  </View>
                  <View className="mt-3 p-3 bg-purple-50 rounded-lg">
                    <Text className="block text-xs text-purple-700">
                      💡 点击图片可查看大图。这是 AI 根据建议生成的示例照片，仅供参考。实际优化时，建议根据建议重新拍摄或调整。
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
