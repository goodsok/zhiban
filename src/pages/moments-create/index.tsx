import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad, showToast } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Network } from '@/network'
import CustomHeader from '@/components/custom-header'
import { Textarea } from '@/components/ui/textarea'
import { ChevronRight, User, Sparkles, Check, LoaderCircle, Image as ImageLucide, Clock } from 'lucide-react-taro'

// 内容类型
const POST_TYPES = [
  { code: 'daily', name: '生活日常', icon: '🏠' },
  { code: 'fitness', name: '运动健身', icon: '💪' },
  { code: 'food', name: '美食探店', icon: '🍜' },
  { code: 'travel', name: '旅行风景', icon: '✈️' },
  { code: 'work', name: '工作成就', icon: '💼' },
  { code: 'emotion', name: '情感表达', icon: '💭' },
  { code: 'hobby', name: '兴趣爱好', icon: '🎨' },
]

// 发圈目的
const PURPOSES = [
  { code: 'attract', name: '吸引注意', description: '让对方注意到你' },
  { code: 'show', name: '展示价值', description: '展示自己的优点' },
  { code: 'tease', name: '试探反应', description: '试探对方的态度' },
  { code: 'topic', name: '制造话题', description: '为聊天创造话题' },
]

// 人设标签
const PERSONA_TAGS = [
  { code: 'mature', name: '成熟稳重' },
  { code: 'humor', name: '幽默风趣' },
  { code: 'ambitious', name: '上进有料' },
  { code: 'warm', name: '温暖细腻' },
  { code: 'mysterious', name: '神秘有品' },
]

interface Match {
  id: number
  name: string
  avatar_url?: string
}

interface ContentSuggestion {
  style: string
  text: string
}

interface SuggestionResult {
  contents: ContentSuggestion[]
  imageSuggestions: string[]
  timing: string
  expectedEffect: string
}

const MomentsCreatePage: FC = () => {
  // 步骤状态
  const [currentStep, setCurrentStep] = useState(1)
  
  // 表单数据
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [selectedType, setSelectedType] = useState('')
  const [selectedPurpose, setSelectedPurpose] = useState('')
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [inputContent, setInputContent] = useState('')
  
  // 列表数据
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  // 结果
  const [suggestion, setSuggestion] = useState<SuggestionResult | null>(null)
  const [selectedContentIndex, setSelectedContentIndex] = useState(0)

  useLoad(() => {
    console.log('Moments create page loaded.')
    fetchMatches()
  })

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/match/list' })
      if (res.data?.code === 200 && res.data?.data?.list) {
        setMatches(res.data.data.list)
      }
    } catch (error) {
      console.error('Fetch matches error:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePersona = (code: string) => {
    setSelectedPersonas(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    )
  }

  const generateSuggestion = async () => {
    if (!selectedType || !selectedPurpose || !inputContent.trim()) return
    
    try {
      setGenerating(true)
      const res = await Network.request({
        url: '/api/moments/suggest',
        method: 'POST',
        data: {
          matchId: selectedMatch?.id,
          postType: selectedType,
          purpose: selectedPurpose,
          inputContent: inputContent.trim(),
          personaTags: selectedPersonas,
        }
      })
      
      if (res.data?.code === 200 && res.data?.data) {
        setSuggestion(res.data.data)
        setCurrentStep(4)
      }
    } catch (error) {
      console.error('Generate suggestion error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const savePost = async () => {
    if (!suggestion) return
    
    const content = suggestion.contents[selectedContentIndex]?.text
    if (!content) return
    
    try {
      await Network.request({
        url: '/api/moments/publish',
        method: 'POST',
        data: {
          matchId: selectedMatch?.id,
          content,
          postType: selectedType,
          purpose: selectedPurpose,
          personaTags: selectedPersonas,
        }
      })
      showToast({ title: '已保存发布记录', icon: 'success' })
      // 返回主页
      setCurrentStep(1)
      setSuggestion(null)
    } catch (error) {
      console.error('Save post error:', error)
    }
  }

  // 结果展示页
  if (currentStep === 4 && suggestion) {
    return (
      <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
        <CustomHeader title="发圈建议" />

        <ScrollView className="p-4" scrollY>
          {/* 文案建议 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <View className="flex items-center gap-3 mb-4">
              <Sparkles size={18} color="#F59E0B" />
              <Text className="block text-base font-semibold text-gray-900">文案建议</Text>
            </View>
            
            {suggestion.contents.map((content, index) => (
              <View
                key={index}
                className={`p-3 rounded-xl mb-2 border-2 ${
                  selectedContentIndex === index ? 'border-green-500 bg-green-50' : 'border-transparent bg-gray-50'
                }`}
                onClick={() => setSelectedContentIndex(index)}
              >
                <View className="flex items-center justify-between mb-2">
                  <Text className="block text-xs text-gray-500">{content.style}</Text>
                  {selectedContentIndex === index && <Check size={14} color="#000" />}
                </View>
                <Text className="block text-sm text-gray-700 leading-relaxed">{content.text}</Text>
              </View>
            ))}
          </View>

          {/* 图片建议 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <View className="flex items-center gap-3 mb-4">
              <ImageLucide size={18} color="#3B82F6" />
              <Text className="block text-base font-semibold text-gray-900">图片建议</Text>
            </View>
            {suggestion.imageSuggestions.map((img, index) => (
              <View key={index} className="flex items-start gap-3 mb-2">
                <View className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Text className="block text-xs text-blue-600">{index + 1}</Text>
                </View>
                <Text className="block text-sm text-gray-600 flex-1">{img}</Text>
              </View>
            ))}
          </View>

          {/* 发布时机 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <View className="flex items-center gap-3 mb-2">
              <Clock size={18} color="#4ECB71" />
              <Text className="block text-base font-semibold text-gray-900">发布时机</Text>
            </View>
            <Text className="block text-sm text-gray-600">{suggestion.timing}</Text>
          </View>

          {/* 预期效果 */}
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <Text className="block text-base font-semibold text-gray-900 mb-2">预期效果</Text>
            <Text className="block text-sm text-gray-600">{suggestion.expectedEffect}</Text>
          </View>

          {/* 操作按钮 */}
          <View className="flex gap-4 mb-4">
            <View
              className="flex-1 bg-gray-100 rounded-xl py-3 flex items-center justify-center"
              onClick={() => {
                setSuggestion(null)
                setCurrentStep(3)
              }}
            >
              <Text className="block text-gray-600">重新生成</Text>
            </View>
            <View
              className="flex-1 bg-green-500 rounded-xl py-3 flex items-center justify-center"
              onClick={savePost}
            >
              <Text className="block text-white font-medium">已发布，记录一下</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  // 新建流程
  return (
    <View className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <CustomHeader title="发圈助手" />

      {/* 进度指示器 */}
      <View className="bg-white px-4 py-3 border-b">
        <View className="flex items-center justify-between">
          {['对象', '类型', '内容', '生成'].map((label, index) => {
            const stepNum = index + 1
            const isActive = currentStep === stepNum
            const isCompleted = currentStep > stepNum
            
            return (
              <View key={label} className="flex items-center">
                <View 
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500' : isActive ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={14} color="#fff" />
                  ) : (
                    <Text className={`block text-xs ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {stepNum}
                    </Text>
                  )}
                </View>
                <Text className={`block text-xs ml-1 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {label}
                </Text>
                {index < 3 && <View className="w-6 h-1 bg-gray-200 mx-2" />}
              </View>
            )
          })}
        </View>
      </View>

      {/* Step 1: 选择对象 */}
      {currentStep === 1 && (
        <View className="p-4">
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <View className="flex items-center gap-3 mb-4">
              <User size={18} color="#374151" />
              <Text className="block text-base font-semibold text-gray-900">选择对象（可选）</Text>
            </View>
            
            <Text className="block text-sm text-gray-500 mb-4">
              选择对象可以让建议更贴合目标
            </Text>
            
            {/* 不选择选项 */}
            <View
              className={`p-3 rounded-xl flex items-center justify-between mb-2 ${
                selectedMatch === null ? 'bg-green-500' : 'bg-gray-50'
              }`}
              onClick={() => setSelectedMatch(null)}
            >
              <Text className={`block font-medium ${selectedMatch === null ? 'text-white' : 'text-gray-900'}`}>
                不关联对象
              </Text>
              {selectedMatch === null && <Check size={18} color="#fff" />}
            </View>
            
            {loading ? (
              <View className="py-8 text-center">
                <Text className="block text-gray-400">加载中...</Text>
              </View>
            ) : matches.length === 0 ? (
              <View className="py-4 text-center">
                <Text className="block text-gray-400 text-sm">暂无对象可选</Text>
              </View>
            ) : (
              <View className="flex flex-col gap-3">
                {matches.map((match) => {
                  const isSelected = selectedMatch?.id === match.id
                  return (
                    <View
                      key={match.id}
                      className={`p-3 rounded-xl flex items-center justify-between ${
                        isSelected ? 'bg-green-500' : 'bg-gray-50'
                      }`}
                      onClick={() => setSelectedMatch(match)}
                    >
                      <View className="flex items-center gap-4">
                        <View className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-white' : 'bg-gray-200'}`}>
                          <Text className={`block text-sm font-medium ${isSelected ? 'text-green-500' : 'text-gray-600'}`}>
                            {match.name.charAt(0)}
                          </Text>
                        </View>
                        <Text className={`block font-medium ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          {match.name}
                        </Text>
                      </View>
                      {isSelected && <Check size={18} color="#fff" />}
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          <View
            className="bg-green-500 rounded-xl py-3 flex items-center justify-center"
            onClick={() => setCurrentStep(2)}
          >
            <Text className="block text-white font-medium">下一步</Text>
            <ChevronRight size={18} color="#fff" />
          </View>
        </View>
      )}

      {/* Step 2: 选择类型和目的 */}
      {currentStep === 2 && (
        <View className="p-4">
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <Text className="block text-base font-semibold text-gray-900 mb-4">内容类型</Text>
            <View className="grid grid-cols-4 gap-3">
              {POST_TYPES.map((type) => {
                const isSelected = selectedType === type.code
                return (
                  <View
                    key={type.code}
                    className={`p-2 rounded-xl text-center ${
                      isSelected ? 'bg-green-500' : 'bg-gray-50'
                    }`}
                    onClick={() => setSelectedType(type.code)}
                  >
                    <Text className="block text-lg mb-1">{type.icon}</Text>
                    <Text className={`block text-xs ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                      {type.name}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>

          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <Text className="block text-base font-semibold text-gray-900 mb-4">发圈目的</Text>
            <View className="flex flex-col gap-3">
              {PURPOSES.map((purpose) => {
                const isSelected = selectedPurpose === purpose.code
                return (
                  <View
                    key={purpose.code}
                    className={`p-3 rounded-xl ${isSelected ? 'bg-green-500' : 'bg-gray-50'}`}
                    onClick={() => setSelectedPurpose(purpose.code)}
                  >
                    <View className="flex items-center justify-between">
                      <View>
                        <Text className={`block font-medium ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          {purpose.name}
                        </Text>
                        <Text className={`block text-xs mt-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                          {purpose.description}
                        </Text>
                      </View>
                      {isSelected && <Check size={18} color="#fff" />}
                    </View>
                  </View>
                )
              })}
            </View>
          </View>

          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <Text className="block text-base font-semibold text-gray-900 mb-4">人设标签（可多选）</Text>
            <View className="flex flex-wrap gap-3">
              {PERSONA_TAGS.map((tag) => {
                const isSelected = selectedPersonas.includes(tag.code)
                return (
                  <View
                    key={tag.code}
                    className={`px-3 py-2 rounded-lg ${
                      isSelected ? 'bg-green-500' : 'bg-gray-100'
                    }`}
                    onClick={() => togglePersona(tag.code)}
                  >
                    <Text className={`block text-sm ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                      {tag.name}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>

          <View className="flex gap-4">
            <View
              className="flex-1 bg-gray-100 rounded-xl py-3 flex items-center justify-center"
              onClick={() => setCurrentStep(1)}
            >
              <Text className="block text-gray-600">上一步</Text>
            </View>
            <View
              className={`flex-1 rounded-xl py-3 flex items-center justify-center ${
                selectedType && selectedPurpose ? 'bg-green-500' : 'bg-gray-200'
              }`}
              onClick={() => selectedType && selectedPurpose && setCurrentStep(3)}
            >
              <Text className={`block font-medium ${selectedType && selectedPurpose ? 'text-white' : 'text-gray-400'}`}>
                下一步
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Step 3: 输入内容 */}
      {currentStep === 3 && (
        <View className="p-4">
          <View className="bg-white rounded-2xl shadow-soft p-4 mb-4">
            <View className="flex items-center gap-3 mb-4">
              <Sparkles size={18} color="#374151" />
              <Text className="block text-base font-semibold text-gray-900">描述你想发的内容</Text>
            </View>
            
            <View className="mb-4">
              <View className="bg-gray-50 rounded-xl p-3">
                <Textarea
                  className="w-full"
                  style={{ minHeight: '120px' }}
                  placeholder="描述今天发生了什么、想传达什么信息、有什么感受..."
                  value={inputContent}
                  onInput={(e) => setInputContent(e.detail.value)}
                />
              </View>
            </View>

            <Text className="block text-xs text-gray-400">
              提示：描述越具体，AI 生成的建议越精准
            </Text>
          </View>

          <View className="flex gap-4">
            <View
              className="flex-1 bg-gray-100 rounded-xl py-3 flex items-center justify-center"
              onClick={() => setCurrentStep(2)}
            >
              <Text className="block text-gray-600">上一步</Text>
            </View>
            <View
              className={`flex-1 rounded-xl py-3 flex items-center justify-center ${
                inputContent.trim() ? 'bg-green-500' : 'bg-gray-200'
              }`}
              onClick={generateSuggestion}
            >
              {generating ? (
                <LoaderCircle size={18} color="#fff" className="animate-spin" />
              ) : (
                <Text className={`block font-medium ${inputContent.trim() ? 'text-white' : 'text-gray-400'}`}>
                  生成建议
                </Text>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default MomentsCreatePage
