import { View, Text } from '@tarojs/components'
import { useLoad, navigateBack, switchTab } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, Heart, Check, X, Plus } from 'lucide-react-taro'
import { Network } from '@/network'

// 见面场景
const meetingScenes = [
  { id: 'blind_date', label: '相亲', icon: '💑', desc: '介绍人安排' },
  { id: 'pickup', label: '搭讪', icon: '👋', desc: '偶遇心动' },
  { id: 'app_meetup', label: 'App线下见面', icon: '📱', desc: '交友软件' },
  { id: 'party', label: '聚会社交', icon: '🎉', desc: '朋友聚会' },
  { id: 'workplace', label: '职场', icon: '💼', desc: '工作认识' },
  { id: 'school', label: '学校', icon: '📚', desc: '同学校友' },
  { id: 'activity', label: '兴趣活动', icon: '🎯', desc: '运动爱好' },
  { id: 'other', label: '其他', icon: '✨', desc: '其他场景' },
]

// 关系阶段
const relationshipStages = [
  { id: 'new', label: '刚认识', icon: '👋', desc: '刚刚认识，不太了解' },
  { id: 'contacting', label: '接触中', icon: '💬', desc: '正在聊天了解' },
  { id: 'dating', label: '约会中', icon: '💝', desc: '已经约过会' },
  { id: 'progressing', label: '发展中', icon: '💕', desc: '关系正在升温' },
]

// 互动状态
const interactionStatuses = [
  { id: 'just_met', label: '只有一面之缘', icon: '👀' },
  { id: 'got_contact', label: '拿到了联系方式', icon: '📱' },
  { id: 'chatted', label: '聊过几次天', icon: '💭' },
  { id: 'good_vibe', label: '聊天氛围不错', icon: '😊' },
  { id: 'met_up', label: '约出来见过面', icon: '☕' },
  { id: 'dating_regularly', label: '正在稳定约会', icon: '💑' },
  { id: 'ambiguous', label: '暧昧期', icon: '💕' },
  { id: 'confirming', label: '准备确认关系', icon: '💍' },
]

// 预设兴趣标签
const presetInterests = [
  '旅行', '摄影', '美食', '健身', '电影', '音乐', '阅读', '游戏',
  '户外', '艺术', '烹饪', '宠物', '时尚', '科技', '运动', '手工',
  '绘画', '写作', '舞蹈', '唱歌', '乐器', '棋牌', '钓鱼', '园艺',
]

// 印象标签
const impressionTags = [
  { id: 'nice', label: '性格好', icon: '😊' },
  { id: 'pretty', label: '颜值高', icon: '✨' },
  { id: 'smart', label: '聪明', icon: '🧠' },
  { id: 'funny', label: '幽默', icon: '😄' },
  { id: 'gentle', label: '温柔', icon: '💕' },
  { id: 'ambitious', label: '有上进心', icon: '📈' },
  { id: 'independent', label: '独立', icon: '💪' },
  { id: 'thoughtful', label: '细心体贴', icon: '💝' },
]

// MBTI 类型
const mbtiOptions = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
]

// 星座
const zodiacOptions = [
  '白羊座', '金牛座', '双子座', '巨蟹座',
  '狮子座', '处女座', '天秤座', '天蝎座',
  '射手座', '摩羯座', '水瓶座', '双鱼座',
]

const CreatePage: FC = () => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [newInterest, setNewInterest] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'female',
    occupation: '',
    mbti: '',
    zodiac: '',
    meetingScene: '',
    meetingDate: '',
    relationshipStage: 'new',
    interactionStatus: 'just_met',
    impression: 0,
    impressionTags: [] as string[],
    interests: [] as string[],
    notes: '',
  })

  useLoad(() => {
    console.log('Create page loaded.')
  })

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      navigateBack()
    }
  }

  const nextStep = async () => {
    if (step < 5) {
      setStep(step + 1)
    } else {
      // 完成创建 - 调用API
      try {
        setLoading(true)
        console.log('Creating match with data:', formData)
        
        const res = await Network.request({
          url: '/api/match/create',
          method: 'POST',
          data: {
            name: formData.name,
            age: parseInt(formData.age),
            gender: formData.gender,
            occupation: formData.occupation,
            mbti: formData.mbti,
            zodiac: formData.zodiac,
            meetingScene: formData.meetingScene,
            meetingDate: formData.meetingDate,
            relationshipStage: formData.relationshipStage,
            interactionStatus: formData.interactionStatus,
            impression: formData.impression,
            impressionTags: formData.impressionTags,
            interests: formData.interests,
            notes: formData.notes,
          }
        })
        
        console.log('Create match response:', res.data)
        
        // 创建成功后跳转到对象列表页
        switchTab({ url: '/pages/index/index' })
      } catch (error) {
        console.error('Create match error:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const togglePresetInterest = (interest: string) => {
    if (formData.interests.includes(interest)) {
      setFormData({ ...formData, interests: formData.interests.filter(i => i !== interest) })
    } else {
      setFormData({ ...formData, interests: [...formData.interests, interest] })
    }
  }

  const addCustomInterest = () => {
    const trimmed = newInterest.trim()
    if (trimmed && !formData.interests.includes(trimmed)) {
      setFormData({ ...formData, interests: [...formData.interests, trimmed] })
      setNewInterest('')
    }
  }

  const removeInterest = (interest: string) => {
    setFormData({ ...formData, interests: formData.interests.filter(i => i !== interest) })
  }

  const toggleImpressionTag = (tagId: string) => {
    if (formData.impressionTags.includes(tagId)) {
      setFormData({ ...formData, impressionTags: formData.impressionTags.filter(t => t !== tagId) })
    } else if (formData.impressionTags.length < 3) {
      setFormData({ ...formData, impressionTags: [...formData.impressionTags, tagId] })
    }
  }

  const canNext = () => {
    switch (step) {
      case 1:
        return formData.name && formData.age && formData.meetingScene
      case 2:
        return formData.relationshipStage && formData.interactionStatus && formData.impression > 0
      case 3:
        return formData.interests.length > 0
      default:
        return true
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 头部进度 */}
      <View className="bg-white p-4 border-b border-gray-100">
        <View className="flex items-center justify-between mb-2">
          <View onClick={goBack}>
            <ArrowLeft size={24} color="#6B7280" />
          </View>
          <Text className="block font-semibold text-gray-800">建立档案</Text>
          <View className="w-6" />
        </View>
        <View className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <View 
              key={s}
              className={`flex-1 h-1 rounded-full ${
                s <= step ? 'bg-indigo-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </View>
        <Text className="block text-xs text-gray-400 mt-2 text-center">
          第 {step} 步，共 5 步
        </Text>
      </View>

      {/* 步骤内容 */}
      <View className="p-4 pb-24">
        {/* 步骤1：基本信息 */}
        {step === 1 && (
          <View>
            <Text className="block text-xl font-bold text-gray-800 mb-2">基本信息</Text>
            <Text className="block text-sm text-gray-500 mb-6">填写Ta的基本信息</Text>

            <Card className="shadow-sm border-0 mb-4">
              <CardContent className="p-4">
                <View className="mb-4">
                  <Text className="block text-sm font-medium text-gray-700 mb-2">姓名 *</Text>
                  <Input
                    placeholder="Ta叫什么名字？"
                    value={formData.name}
                    onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
                  />
                </View>
                <View className="mb-4">
                  <Text className="block text-sm font-medium text-gray-700 mb-2">年龄 *</Text>
                  <Input
                    type="number"
                    placeholder="Ta多大？"
                    value={formData.age}
                    onInput={(e) => setFormData({ ...formData, age: e.detail.value })}
                  />
                </View>
                <View className="mb-4">
                  <Text className="block text-sm font-medium text-gray-700 mb-2">性别</Text>
                  <View className="flex gap-3">
                    <Button
                      variant={formData.gender === 'female' ? 'default' : 'outline'}
                      className={formData.gender === 'female' ? 'bg-pink-500' : ''}
                      size="sm"
                      onClick={() => setFormData({ ...formData, gender: 'female' })}
                    >
                      <Text>女</Text>
                    </Button>
                    <Button
                      variant={formData.gender === 'male' ? 'default' : 'outline'}
                      className={formData.gender === 'male' ? 'bg-blue-500' : ''}
                      size="sm"
                      onClick={() => setFormData({ ...formData, gender: 'male' })}
                    >
                      <Text>男</Text>
                    </Button>
                  </View>
                </View>
                <View className="mb-4">
                  <Text className="block text-sm font-medium text-gray-700 mb-2">职业</Text>
                  <Input
                    placeholder="Ta做什么工作？"
                    value={formData.occupation}
                    onInput={(e) => setFormData({ ...formData, occupation: e.detail.value })}
                  />
                </View>
                <View className="mb-4">
                  <Text className="block text-sm font-medium text-gray-700 mb-2">MBTI人格</Text>
                  <View className="flex flex-wrap gap-2">
                    {mbtiOptions.map((mbti) => (
                      <Badge
                        key={mbti}
                        className={`cursor-pointer ${
                          formData.mbti === mbti
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                        onClick={() => setFormData({ ...formData, mbti: formData.mbti === mbti ? '' : mbti })}
                      >
                        <Text>{mbti}</Text>
                      </Badge>
                    ))}
                  </View>
                </View>
                <View>
                  <Text className="block text-sm font-medium text-gray-700 mb-2">星座</Text>
                  <View className="flex flex-wrap gap-2">
                    {zodiacOptions.map((zodiac) => (
                      <Badge
                        key={zodiac}
                        className={`cursor-pointer ${
                          formData.zodiac === zodiac
                            ? 'bg-pink-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                        onClick={() => setFormData({ ...formData, zodiac: formData.zodiac === zodiac ? '' : zodiac })}
                      >
                        <Text>{zodiac}</Text>
                      </Badge>
                    ))}
                  </View>
                </View>
              </CardContent>
            </Card>

            <Text className="block text-sm font-medium text-gray-700 mb-2">见面场景 *</Text>
            <View className="grid grid-cols-2 gap-3">
              {meetingScenes.map((scene) => (
                <Card
                  key={scene.id}
                  className={`shadow-sm border-0 ${
                    formData.meetingScene === scene.id ? 'ring-2 ring-indigo-500' : ''
                  }`}
                  onClick={() => setFormData({ ...formData, meetingScene: scene.id })}
                >
                  <CardContent className="p-3 text-center">
                    <Text className="block text-2xl mb-1">{scene.icon}</Text>
                    <Text className="block font-medium text-gray-800 text-sm">{scene.label}</Text>
                    <Text className="block text-xs text-gray-400">{scene.desc}</Text>
                  </CardContent>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* 步骤2：阶段与状态 */}
        {step === 2 && (
          <View>
            <Text className="block text-xl font-bold text-gray-800 mb-2">阶段与状态</Text>
            <Text className="block text-sm text-gray-500 mb-6">你们现在的关系如何？</Text>

            {/* 关系阶段 */}
            <Text className="block text-sm font-medium text-gray-700 mb-2">当前阶段 *</Text>
            <View className="grid grid-cols-2 gap-3 mb-6">
              {relationshipStages.map((stage) => (
                <Card
                  key={stage.id}
                  className={`shadow-sm border-0 ${
                    formData.relationshipStage === stage.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                  }`}
                  onClick={() => setFormData({ ...formData, relationshipStage: stage.id })}
                >
                  <CardContent className="p-3 text-center">
                    <Text className="block text-2xl mb-1">{stage.icon}</Text>
                    <Text className="block font-medium text-gray-800 text-sm">{stage.label}</Text>
                    <Text className="block text-xs text-gray-400">{stage.desc}</Text>
                  </CardContent>
                </Card>
              ))}
            </View>

            {/* 互动状态 */}
            <Text className="block text-sm font-medium text-gray-700 mb-2">互动状态 *</Text>
            <View className="flex flex-wrap gap-2 mb-6">
              {interactionStatuses.map((status) => (
                <Badge
                  key={status.id}
                  className={`cursor-pointer ${
                    formData.interactionStatus === status.id
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  onClick={() => setFormData({ ...formData, interactionStatus: status.id })}
                >
                  <Text>{status.icon} {status.label}</Text>
                </Badge>
              ))}
            </View>

            {/* 心动指数 */}
            <Card className="shadow-sm border-0 mb-4">
              <CardContent className="p-6 text-center">
                <Text className="block text-sm text-gray-500 mb-3">心动指数</Text>
                <View className="flex items-center justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <View key={star} onClick={() => setFormData({ ...formData, impression: star })}>
                      <Heart
                        size={36}
                        color={star <= formData.impression ? '#EC4899' : '#E5E7EB'}
                      />
                    </View>
                  ))}
                </View>
                <Text className="block text-sm text-gray-400">
                  {formData.impression === 0 && '点击选择心动程度'}
                  {formData.impression === 1 && '一般'}
                  {formData.impression === 2 && '还行'}
                  {formData.impression === 3 && '不错'}
                  {formData.impression === 4 && '很喜欢'}
                  {formData.impression === 5 && '超心动！'}
                </Text>
              </CardContent>
            </Card>

            {/* 印象标签 */}
            <Text className="block text-sm font-medium text-gray-700 mb-2">印象标签（最多选3个）</Text>
            <View className="flex flex-wrap gap-2">
              {impressionTags.map((tag) => (
                <Badge
                  key={tag.id}
                  className={`cursor-pointer ${
                    formData.impressionTags.includes(tag.id)
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  onClick={() => toggleImpressionTag(tag.id)}
                >
                  <Text>{tag.icon} {tag.label}</Text>
                </Badge>
              ))}
            </View>
          </View>
        )}

        {/* 步骤3：兴趣爱好 */}
        {step === 3 && (
          <View>
            <Text className="block text-xl font-bold text-gray-800 mb-2">兴趣爱好</Text>
            <Text className="block text-sm text-gray-500 mb-6">Ta有什么兴趣爱好？</Text>

            {/* 已选择的兴趣 */}
            {formData.interests.length > 0 && (
              <Card className="shadow-sm border-0 mb-4 bg-indigo-50">
                <CardContent className="p-4">
                  <Text className="block text-sm font-medium text-indigo-600 mb-3">
                    已选择 ({formData.interests.length}个)
                  </Text>
                  <View className="flex flex-wrap gap-2">
                    {formData.interests.map((interest, i) => (
                      <Badge
                        key={i}
                        className="bg-indigo-500 text-white cursor-pointer"
                        onClick={() => removeInterest(interest)}
                      >
                        <Text>{interest}</Text>
                        <X size={12} color="#fff" className="ml-1" />
                      </Badge>
                    ))}
                  </View>
                </CardContent>
              </Card>
            )}

            {/* 自定义添加 */}
            <Card className="shadow-sm border-0 mb-4">
              <CardContent className="p-4">
                <Text className="block text-sm font-medium text-gray-700 mb-2">自定义添加</Text>
                <View className="flex gap-2">
                  <View className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                    <Input
                      placeholder="输入兴趣爱好..."
                      value={newInterest}
                      onInput={(e) => setNewInterest(e.detail.value)}
                    />
                  </View>
                  <Button
                    size="sm"
                    className="bg-indigo-500"
                    disabled={!newInterest.trim()}
                    onClick={addCustomInterest}
                  >
                    <Plus size={16} color="#fff" />
                  </Button>
                </View>
              </CardContent>
            </Card>

            {/* 预设兴趣 */}
            <Text className="block text-sm font-medium text-gray-700 mb-2">或选择预设标签</Text>
            <View className="flex flex-wrap gap-2">
              {presetInterests.map((interest) => (
                <Badge
                  key={interest}
                  className={`cursor-pointer ${
                    formData.interests.includes(interest)
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  onClick={() => togglePresetInterest(interest)}
                >
                  {formData.interests.includes(interest) && (
                    <Check size={12} color="#fff" />
                  )}
                  <Text className={formData.interests.includes(interest) ? 'ml-1' : ''}>
                    {interest}
                  </Text>
                </Badge>
              ))}
            </View>
          </View>
        )}

        {/* 步骤4：见面日期 */}
        {step === 4 && (
          <View>
            <Text className="block text-xl font-bold text-gray-800 mb-2">见面信息</Text>
            <Text className="block text-sm text-gray-500 mb-6">记录你们第一次见面的信息</Text>

            <Card className="shadow-sm border-0">
              <CardContent className="p-4">
                <View className="mb-4">
                  <Text className="block text-sm font-medium text-gray-700 mb-2">第一次见面日期</Text>
                  <Input
                    type="text"
                    placeholder="例如：2024-03-20"
                    value={formData.meetingDate}
                    onInput={(e) => setFormData({ ...formData, meetingDate: e.detail.value })}
                  />
                </View>
                <View>
                  <Text className="block text-sm font-medium text-gray-700 mb-2">备注</Text>
                  <Input
                    placeholder="其他想记录的信息..."
                    value={formData.notes}
                    onInput={(e) => setFormData({ ...formData, notes: e.detail.value })}
                  />
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* 步骤5：档案确认 */}
        {step === 5 && (
          <View>
            <Text className="block text-xl font-bold text-gray-800 mb-2">档案确认</Text>
            <Text className="block text-sm text-gray-500 mb-6">确认Ta的信息是否正确</Text>

            <Card className="shadow-sm border-0 mb-4">
              <CardContent className="p-4">
                <Text className="block font-semibold text-gray-800 mb-3">📋 基本信息</Text>
                <View className="space-y-2">
                  <View className="flex justify-between">
                    <Text className="text-gray-500">姓名</Text>
                    <Text className="text-gray-800">{formData.name}</Text>
                  </View>
                  <View className="flex justify-between">
                    <Text className="text-gray-500">年龄</Text>
                    <Text className="text-gray-800">{formData.age}岁</Text>
                  </View>
                  <View className="flex justify-between">
                    <Text className="text-gray-500">职业</Text>
                    <Text className="text-gray-800">{formData.occupation || '未填写'}</Text>
                  </View>
                  <View className="flex justify-between">
                    <Text className="text-gray-500">MBTI</Text>
                    <Text className="text-gray-800">{formData.mbti || '未填写'}</Text>
                  </View>
                  <View className="flex justify-between">
                    <Text className="text-gray-500">星座</Text>
                    <Text className="text-gray-800">{formData.zodiac || '未填写'}</Text>
                  </View>
                  <View className="flex justify-between">
                    <Text className="text-gray-500">见面场景</Text>
                    <Text className="text-gray-800">
                      {meetingScenes.find(s => s.id === formData.meetingScene)?.label}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0 mb-4">
              <CardContent className="p-4">
                <Text className="block font-semibold text-gray-800 mb-3">💝 关系状态</Text>
                <View className="space-y-2">
                  <View className="flex justify-between">
                    <Text className="text-gray-500">当前阶段</Text>
                    <Text className="text-gray-800">
                      {relationshipStages.find(s => s.id === formData.relationshipStage)?.label}
                    </Text>
                  </View>
                  <View className="flex justify-between">
                    <Text className="text-gray-500">互动状态</Text>
                    <Text className="text-gray-800">
                      {interactionStatuses.find(s => s.id === formData.interactionStatus)?.label}
                    </Text>
                  </View>
                  <View className="flex justify-between">
                    <Text className="text-gray-500">心动指数</Text>
                    <View className="flex items-center gap-1">
                      {Array.from({ length: formData.impression }).map((_, i) => (
                        <Heart key={i} size={12} color="#EC4899" />
                      ))}
                    </View>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0">
              <CardContent className="p-4">
                <Text className="block font-semibold text-gray-800 mb-3">🎯 兴趣爱好</Text>
                <View className="flex flex-wrap gap-2">
                  {formData.interests.map((interest, i) => (
                    <Badge key={i} variant="outline" className="text-indigo-600 border-indigo-200">
                      {interest}
                    </Badge>
                  ))}
                </View>
              </CardContent>
            </Card>
          </View>
        )}
      </View>

      {/* 底部按钮 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <Button
          className="w-full bg-indigo-500"
          disabled={!canNext() || loading}
          onClick={nextStep}
        >
          <Text className="text-white">
            {loading ? '创建中...' : step === 5 ? '完成创建' : '下一步'}
          </Text>
          {step < 5 && !loading && <ArrowRight size={16} color="#fff" className="ml-1" />}
        </Button>
      </View>
    </View>
  )
}

export default CreatePage
