import Taro, { useLoad, navigateBack, chooseImage } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Check, Loader, HardDrive, Cpu, Camera, Sparkles } from 'lucide-react-taro'
import { Network } from '@/network'

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

// 关系阶段
const relationshipStages = [
  { id: 'new', label: '刚认识' },
  { id: 'contacting', label: '接触中' },
  { id: 'dating', label: '约会中' },
  { id: 'progressing', label: '发展中' },
]

// 互动状态
const interactionStatuses = [
  { id: 'just_met', label: '一面之缘' },
  { id: 'got_contact', label: '有联系方式' },
  { id: 'chatted', label: '聊过天' },
  { id: 'good_vibe', label: '聊得不错' },
  { id: 'met_up', label: '见过面' },
  { id: 'dating_regularly', label: '稳定约会' },
  { id: 'ambiguous', label: '暧昧期' },
  { id: 'confirming', label: '准备确认' },
]

// 预设兴趣
const presetInterests = [
  '旅行', '摄影', '美食', '健身', '电影', '音乐', '阅读', '游戏',
  '绘画', '烹饪', '瑜伽', '游泳',
]

const CreatePage: FC = () => {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    gender: 'female',
    // 硬件信息
    hardware: {
      age: '',
      occupation: '',
      location: '',
    },
    // 软件信息
    software: {
      mbti: '',
      interests: [] as string[],
      personality: '',
    },
    meetingScene: '',
    relationshipStage: 'new',
    interactionStatus: 'just_met',
    notes: '',
  })

  useLoad(() => {
    console.log('Create page loaded.')
  })

  const goBack = () => navigateBack()

  // 选择图片并分析
  const handleChooseImage = async () => {
    try {
      const res = await chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (res.tempFilePaths && res.tempFilePaths[0]) {
        await analyzeImage(res.tempFilePaths[0])
      }
    } catch (error) {
      console.error('Choose image error:', error)
    }
  }

  // 分析图片
  const analyzeImage = async (filePath: string) => {
    setAnalyzing(true)
    setAnalysisResult(null)

    try {
      // 使用 Taro.readFile 读取文件并转为 base64
      const fileSystemManager = Taro.getFileSystemManager()
      const base64Data = fileSystemManager.readFileSync(filePath, 'base64') as string
      
      // 调用图片分析接口
      const res = await Network.request({
        url: '/api/profile-analysis/from-base64',
        method: 'POST',
        data: {
          base64Data: `data:image/jpeg;base64,${base64Data}`
        }
      })

      console.log('Analysis response:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        const profile = res.data.data
        applyAnalysisResult(profile)
        setAnalysisResult(profile.summary || '分析完成')
      } else {
        setAnalysisResult('分析失败，请手动填写信息')
      }
    } catch (error) {
      console.error('Analyze image error:', error)
      setAnalysisResult('分析失败，请手动填写信息')
    } finally {
      setAnalyzing(false)
    }
  }

  // 应用分析结果到表单
  const applyAnalysisResult = (profile: Record<string, unknown>) => {
    const updates: Partial<typeof formData> = {}

    if (profile.gender) {
      updates.gender = profile.gender as string
    }
    if (profile.age) {
      updates.hardware = {
        ...formData.hardware,
        age: String(profile.age)
      }
    }
    if (profile.occupation) {
      updates.hardware = {
        ...formData.hardware,
        ...(updates.hardware || formData.hardware),
        occupation: profile.occupation as string
      }
    }
    if (profile.mbti) {
      updates.software = {
        ...formData.software,
        mbti: profile.mbti as string
      }
    }
    if (profile.personality) {
      updates.software = {
        ...formData.software,
        ...(updates.software || formData.software),
        personality: profile.personality as string
      }
    }
    if (profile.interests && Array.isArray(profile.interests)) {
      // 匹配预设兴趣
      const matchedInterests = profile.interests.filter((i: string) => 
        presetInterests.some(p => i.includes(p) || p.includes(i))
      )
      updates.software = {
        ...formData.software,
        ...(updates.software || formData.software),
        interests: matchedInterests.length > 0 ? matchedInterests : profile.interests.slice(0, 3)
      }
    }

    setFormData(prev => ({
      ...prev,
      ...updates,
      hardware: { ...prev.hardware, ...(updates.hardware || {}) },
      software: { ...prev.software, ...(updates.software || {}) }
    }))
  }

  const toggleInterest = (interest: string) => {
    const newInterests = formData.software.interests.includes(interest)
      ? formData.software.interests.filter(i => i !== interest)
      : [...formData.software.interests, interest]
    setFormData({
      ...formData,
      software: { ...formData.software, interests: newInterests }
    })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.hardware.age) return

    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/match/create',
        method: 'POST',
        data: {
          name: formData.name,
          gender: formData.gender,
          hardware: {
            age: parseInt(formData.hardware.age),
            occupation: formData.hardware.occupation || undefined,
            location: formData.hardware.location || undefined,
          },
          software: {
            mbti: formData.software.mbti || undefined,
            interests: formData.software.interests,
            personality: formData.software.personality || undefined,
          },
          meetingScene: formData.meetingScene || 'other',
          relationshipStage: formData.relationshipStage,
          interactionStatus: formData.interactionStatus,
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

  const isValid = formData.name && formData.hardware.age

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部 */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex items-center justify-between">
          <View onClick={goBack}>
            <ArrowLeft size={24} color="#374151" />
          </View>
          <Text className="block text-base font-semibold text-gray-900">新建档案</Text>
          <View className="w-6" />
        </View>
      </View>

      <View className="p-4">
        {/* AI 图片分析 */}
        <View className="mb-4">
          <View className="flex items-center gap-2 mb-2">
            <Sparkles size={14} color="#6B7280" />
            <Text className="block text-xs text-gray-400">AI 智能分析</Text>
          </View>
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            {analyzing ? (
              <View className="flex items-center justify-center py-4">
                <Loader size={20} color="#6B7280" className="animate-spin" />
                <Text className="block text-sm text-gray-500 ml-2">正在分析图片...</Text>
              </View>
            ) : (
              <>
                <View 
                  className="flex items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-lg mb-2"
                  onClick={handleChooseImage}
                >
                  <View className="text-center">
                    <Camera size={32} color="#9CA3AF" />
                    <Text className="block text-sm text-gray-400 mt-2">点击上传图片</Text>
                    <Text className="block text-xs text-gray-300 mt-1">自动识别人物信息</Text>
                  </View>
                </View>
                {analysisResult && (
                  <View className="bg-gray-50 rounded-lg p-3">
                    <Text className="block text-xs text-gray-500 mb-1">分析结果</Text>
                    <Text className="block text-sm text-gray-700">{analysisResult}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* 姓名 */}
        <View className="mb-4">
          <Text className="block text-xs text-gray-400 mb-2">姓名 *</Text>
          <View className="bg-white rounded-xl border border-gray-100 p-4">
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
                formData.gender === 'female' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}
              onClick={() => setFormData({ ...formData, gender: 'female' })}
            >
              <Text className="block text-sm">女</Text>
            </View>
            <View 
              className={`flex-1 text-center py-2 rounded-lg ${
                formData.gender === 'male' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}
              onClick={() => setFormData({ ...formData, gender: 'male' })}
            >
              <Text className="block text-sm">男</Text>
            </View>
          </View>
        </View>

        {/* 硬件信息 */}
        <View className="mb-4">
          <View className="flex items-center gap-2 mb-2">
            <HardDrive size={14} color="#6B7280" />
            <Text className="block text-xs text-gray-400">硬件信息</Text>
            <Text className="block text-xs text-gray-300">外在属性</Text>
          </View>
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">年龄 *</Text>
              <Input
                className="w-full"
                type="number"
                placeholder="输入年龄"
                value={formData.hardware.age}
                onInput={(e) => setFormData({
                  ...formData,
                  hardware: { ...formData.hardware, age: e.detail.value }
                })}
              />
            </View>
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">职业</Text>
              <Input
                className="w-full"
                placeholder="输入职业（选填）"
                value={formData.hardware.occupation}
                onInput={(e) => setFormData({
                  ...formData,
                  hardware: { ...formData.hardware, occupation: e.detail.value }
                })}
              />
            </View>
            <View>
              <Text className="block text-xs text-gray-400 mb-1">所在地</Text>
              <Input
                className="w-full"
                placeholder="如：北京朝阳（选填）"
                value={formData.hardware.location}
                onInput={(e) => setFormData({
                  ...formData,
                  hardware: { ...formData.hardware, location: e.detail.value }
                })}
              />
            </View>
          </View>
        </View>

        {/* 软件信息 */}
        <View className="mb-4">
          <View className="flex items-center gap-2 mb-2">
            <Cpu size={14} color="#6B7280" />
            <Text className="block text-xs text-gray-400">软件信息</Text>
            <Text className="block text-xs text-gray-300">内在特质</Text>
          </View>
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">MBTI</Text>
              <Input
                className="w-full"
                placeholder="如：ENFP（选填）"
                value={formData.software.mbti}
                onInput={(e) => setFormData({
                  ...formData,
                  software: { ...formData.software, mbti: e.detail.value }
                })}
              />
            </View>
            <View className="mb-3">
              <Text className="block text-xs text-gray-400 mb-1">性格描述</Text>
              <Input
                className="w-full"
                placeholder="如：热情开朗（选填）"
                value={formData.software.personality}
                onInput={(e) => setFormData({
                  ...formData,
                  software: { ...formData.software, personality: e.detail.value }
                })}
              />
            </View>
            <View>
              <Text className="block text-xs text-gray-400 mb-1">兴趣爱好</Text>
              <View className="flex flex-wrap gap-2 mt-2">
                {presetInterests.map((interest) => (
                  <Badge
                    key={interest}
                    className={`${
                      formData.software.interests.includes(interest)
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </View>
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
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}
                onClick={() => setFormData({ ...formData, meetingScene: scene.id })}
              >
                {scene.label}
              </Badge>
            ))}
          </View>
        </View>

        {/* 关系状态 */}
        <View className="mb-4">
          <Text className="block text-xs text-gray-400 mb-2">关系阶段</Text>
          <View className="grid grid-cols-4 gap-2 mb-2">
            {relationshipStages.map((stage) => (
              <View
                key={stage.id}
                className={`text-center py-2 rounded-lg ${
                  formData.relationshipStage === stage.id 
                    ? 'bg-black text-white' 
                    : 'bg-white border border-gray-200 text-gray-600'
                }`}
                onClick={() => setFormData({ ...formData, relationshipStage: stage.id })}
              >
                <Text className="block text-sm">{stage.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 互动状态 */}
        <View className="mb-4">
          <Text className="block text-xs text-gray-400 mb-2">互动状态</Text>
          <View className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {interactionStatuses.map((status) => (
              <View
                key={status.id}
                className="flex items-center justify-between px-4 py-2"
                onClick={() => setFormData({ ...formData, interactionStatus: status.id })}
              >
                <Text className={`block text-sm ${
                  formData.interactionStatus === status.id ? 'text-gray-900 font-medium' : 'text-gray-600'
                }`}
                >
                  {status.label}
                </Text>
                {formData.interactionStatus === status.id && (
                  <Check size={14} color="#111827" />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* 备注 */}
        <View className="mb-4">
          <Text className="block text-xs text-gray-400 mb-2">备注</Text>
          <View className="bg-white rounded-xl border border-gray-100 p-4">
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
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <Button 
          className="w-full bg-black" 
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
