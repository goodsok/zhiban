import Taro, { useLoad, navigateBack, chooseImage } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import type { FC } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import CustomHeader from '@/components/custom-header'
import { Check, Loader, Camera, Sparkles, X } from 'lucide-react-taro'
import { Network } from '@/network'

// 已选图片
interface SelectedImage {
  path: string
  analyzing: boolean
  result: Record<string, unknown> | null
}

// 见面场景
const meetingScenes = [
  { id: 'blind_date', label: '相亲' },
  { id: 'app_meetup', label: 'App线下见面' },
  { id: 'party', label: '聚会社交' },
  { id: 'workplace', label: '职场' },
  { id: 'school', label: '学校' },
  { id: 'activity', label: '兴趣活动' },
  { id: 'pickup', label: '搭讪' },
  { id: 'other', label: '其他' },
]

const CreatePage: FC = () => {
  const [loading, setLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([])
  const [formData, setFormData] = useState({
    name: '',
    gender: 'female',
    meetingScene: '',
    notes: '',
  })

  useLoad(() => {
    console.log('Create page loaded.')
  })

  // 选择图片
  const handleChooseImage = async () => {
    // 最多3张图片
    const remaining = 3 - selectedImages.length
    if (remaining <= 0) {
      Taro.showToast({ title: '最多选择3张图片', icon: 'none' })
      return
    }

    try {
      const res = await chooseImage({
        count: remaining,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        // 添加新图片
        const newImages: SelectedImage[] = res.tempFilePaths.map(path => ({
          path,
          analyzing: true,
          result: null
        }))
        const updatedImages = [...selectedImages, ...newImages]
        setSelectedImages(updatedImages)

        // 逐个分析图片
        for (let i = selectedImages.length; i < updatedImages.length; i++) {
          analyzeImage(i, updatedImages[i].path)
        }
      }
    } catch (error) {
      console.error('Choose image error:', error)
    }
  }

  // 删除图片
  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  // 分析单张图片
  const analyzeImage = async (index: number, filePath: string) => {
    try {
      const fileSystemManager = Taro.getFileSystemManager()
      const base64Data = fileSystemManager.readFileSync(filePath, 'base64') as string
      
      const res = await Network.request({
        url: '/api/profile-analysis/from-base64',
        method: 'POST',
        data: {
          base64Data: `data:image/jpeg;base64,${base64Data}`
        }
      })

      console.log(`Analysis response for image ${index}:`, res.data)

      if (res.data?.code === 200 && res.data?.data) {
        const profile = res.data.data
        
        // 更新图片分析结果
        setSelectedImages(prev => prev.map((img, i) => 
          i === index ? { ...img, analyzing: false, result: profile } : img
        ))

        // 合并结果到表单
        applyAnalysisResult(profile)
      } else {
        setSelectedImages(prev => prev.map((img, i) => 
          i === index ? { ...img, analyzing: false } : img
        ))
      }
    } catch (error) {
      console.error(`Analyze image ${index} error:`, error)
      setSelectedImages(prev => prev.map((img, i) => 
        i === index ? { ...img, analyzing: false } : img
      ))
    }
  }

  // 应用分析结果到表单（合并多张图片的结果）
  const applyAnalysisResult = (profile: Record<string, unknown>) => {
    setFormData(prev => {
      const updates: Partial<typeof formData> = {}

      // 如果新结果有值且当前为空，则填充
      if (profile.name && !prev.name) {
        updates.name = profile.name as string
      }
      if (profile.gender && !prev.gender) {
        updates.gender = profile.gender as string
      }

      return { ...prev, ...updates }
    })
  }

  const handleSave = async () => {
    if (!formData.name) return

    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/match/create',
        method: 'POST',
        data: {
          name: formData.name,
          gender: formData.gender,
          meetingScene: formData.meetingScene || 'other',
          notes: formData.notes || undefined,
        }
      })
      console.log('Create response:', res.data)
      if (res.data?.code === 200) {
        navigateBack()
      }
    } catch (error) {
      console.error('Create error:', error)
    } finally {
      setLoading(false)
    }
  }

  const isValid = formData.name

  return (
    <View className="min-h-screen pb-24" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部 */}
      <CustomHeader title="新建档案" />

      <View className="p-4">
        {/* AI 图片分析 */}
        <View className="mb-4">
          <View className="flex items-center gap-2 mb-2">
            <Sparkles size={14} color="#6B7280" />
            <Text className="block text-xs text-gray-400">AI 智能分析</Text>
            <Text className="block text-xs text-gray-300">最多3张图片</Text>
          </View>
          <View className="bg-white rounded-xl p-4">
            {/* 已选图片列表 */}
            {selectedImages.length > 0 && (
              <View className="flex flex-wrap gap-2 mb-3">
                {selectedImages.map((img, index) => (
                  <View key={index} className="relative">
                    <Image 
                      src={img.path} 
                      className="w-20 h-20 rounded-lg object-cover"
                      mode="aspectFill"
                    />
                    {/* 分析中遮罩 */}
                    {img.analyzing && (
                      <View className="absolute inset-0 bg-green-500 bg-opacity-50 rounded-lg flex items-center justify-center">
                        <Loader size={16} color="#fff" className="animate-spin" />
                      </View>
                    )}
                    {/* 删除按钮 */}
                    <View 
                      className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X size={12} color="#fff" />
                    </View>
                  </View>
                ))}
              </View>
            )}
            
            {/* 上传按钮 */}
            {selectedImages.length < 3 && (
              <View 
                className="flex items-center justify-center py-4 border-2 border-dashed border-gray-200 rounded-lg"
                onClick={handleChooseImage}
              >
                <View className="text-center">
                  <Camera size={24} color="#9CA3AF" />
                  <Text className="block text-xs text-gray-400 mt-1">
                    {selectedImages.length > 0 ? '继续添加' : '点击上传图片'}
                  </Text>
                </View>
              </View>
            )}
            
            {/* 分析提示 */}
            {selectedImages.some(img => img.analyzing) && (
              <View className="mt-2 flex items-center justify-center">
                <Loader size={14} color="#6B7280" className="animate-spin" />
                <Text className="block text-xs text-gray-400 ml-2">正在分析图片...</Text>
              </View>
            )}
            
            {/* 分析完成提示 */}
            {selectedImages.length > 0 && !selectedImages.some(img => img.analyzing) && (
              <View className="mt-2 flex items-center justify-center">
                <Check size={14} color="#22C55E" />
                <Text className="block text-xs text-gray-500 ml-1">
                  已分析 {selectedImages.filter(img => img.result).length} 张图片，信息已自动填充
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 姓名 */}
        <View className="mb-4">
          <Text className="block text-xs text-gray-400 mb-2">姓名 *</Text>
          <View className="bg-white rounded-xl p-4">
            <Input
              className="w-full"
              placeholder="输入姓名"
              value={formData.name}
              onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
            />
          </View>
        </View>

        {/* 性别 */}
        <View className="mb-4">
          <Text className="block text-xs text-gray-400 mb-2">性别</Text>
          <View className="flex gap-2">
            <View 
              className={`flex-1 text-center py-2 rounded-lg ${
                formData.gender === 'female' ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}
              onClick={() => setFormData({ ...formData, gender: 'female' })}
            >
              <Text className="block text-sm">女</Text>
            </View>
            <View 
              className={`flex-1 text-center py-2 rounded-lg ${
                formData.gender === 'male' ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}
              onClick={() => setFormData({ ...formData, gender: 'male' })}
            >
              <Text className="block text-sm">男</Text>
            </View>
          </View>
        </View>

        {/* 见面场景 */}
        <View className="mb-4">
          <Text className="block text-xs text-gray-400 mb-2">见面场景</Text>
          <View className="flex flex-wrap gap-2">
            {meetingScenes.map((scene) => (
              <Badge
                key={scene.id}
                className={`${
                  formData.meetingScene === scene.id 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}
                onClick={() => setFormData({ ...formData, meetingScene: scene.id })}
              >
                {scene.label}
              </Badge>
            ))}
          </View>
        </View>

        {/* 备注 */}
        <View className="mb-4">
          <Text className="block text-xs text-gray-400 mb-2">备注</Text>
          <View className="bg-white rounded-xl p-4">
            <Input
              className="w-full"
              placeholder="添加备注（选填）"
              value={formData.notes}
              onInput={(e) => setFormData({ ...formData, notes: e.detail.value })}
            />
          </View>
        </View>
      </View>

      {/* 底部 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <Button 
          className="w-full bg-green-500" 
          onClick={handleSave}
          disabled={!isValid || loading}
        >
          {loading ? (
            <Loader size={16} color="#fff" className="animate-spin" />
          ) : (
            <Check size={16} color="#fff" />
          )}
          <Text className="ml-2 text-white">{loading ? '保存中...' : '保存'}</Text>
        </Button>
      </View>
    </View>
  )
}

export default CreatePage
