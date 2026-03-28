import { View, Text } from '@tarojs/components'
import { useLoad, navigateBack, switchTab } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, Heart, Check } from 'lucide-react-taro'
import { Network } from '@/network'

// 见面场景
const meetingScenes = [
  { id: 'blind_date', label: '相亲', icon: '💑', desc: '介绍人安排的正式见面' },
  { id: 'pickup', label: '搭讪', icon: '👋', desc: '偶遇心动主动搭话' },
  { id: 'app_meetup', label: 'App线下见面', icon: '📱', desc: '交友软件匹配后见面' },
  { id: 'party', label: '聚会社交', icon: '🎉', desc: '朋友聚会或活动认识' },
  { id: 'workplace', label: '职场', icon: '💼', desc: '工作中认识' },
  { id: 'school', label: '学校', icon: '📚', desc: '同学校友' },
  { id: 'activity', label: '兴趣活动', icon: '🎯', desc: '运动、爱好活动认识' },
  { id: 'other', label: '其他', icon: '✨', desc: '其他场景' },
]

// 兴趣标签
const interestOptions = [
  '旅行', '摄影', '美食', '健身', '电影', '音乐', '阅读', '游戏',
  '户外', '艺术', '烹饪', '宠物', '时尚', '科技', '运动', '手工',
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
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'female',
    occupation: '',
    mbti: '',
    zodiac: '',
    meetingScene: '',
    meetingDate: '',
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

  const toggleInterest = (interest: string) => {
    if (formData.interests.includes(interest)) {
      setFormData({ ...formData, interests: formData.interests.filter(i => i !== interest) })
    } else if (formData.interests.length < 5) {
      setFormData({ ...formData, interests: [...formData.interests, interest] })
    }
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
        return formData.impression > 0
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
      <View className="p-4">
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

        {/* 步骤2：初印象 */}
        {step === 2 && (
          <View>
            <Text className="block text-xl font-bold text-gray-800 mb-2">初印象</Text>
            <Text className="block text-sm text-gray-500 mb-6">Ta给你留下了什么印象？</Text>

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
            <Text className="block text-sm text-gray-500 mb-6">Ta有什么兴趣爱好？（选1-5个）</Text>

            <View className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => (
                <Badge
                  key={interest}
                  className={`cursor-pointer ${
                    formData.interests.includes(interest)
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  onClick={() => toggleInterest(interest)}
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

            {formData.interests.length > 0 && (
              <View className="mt-4">
                <Text className="block text-sm text-gray-500">已选择 {formData.interests.length}/5 个</Text>
              </View>
            )}
          </View>
        )}

        {/* 步骤4：见面日期 */}
        {step === 4 && (
          <View>
            <Text className="block text-xl font-bold text-gray-800 mb-2">见面时间</Text>
            <Text className="block text-sm text-gray-500 mb-6">记录你们第一次见面的时间</Text>

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

        {/* 步骤5：推荐建议 */}
        {step === 5 && (
          <View>
            <Text className="block text-xl font-bold text-gray-800 mb-2">智能推荐</Text>
            <Text className="block text-sm text-gray-500 mb-6">根据Ta的信息，为你推荐互动策略</Text>

            <Card className="shadow-sm border-0 bg-gradient-to-r from-indigo-50 to-purple-50 mb-4">
              <CardContent className="p-4">
                <Text className="block font-semibold text-gray-800 mb-2">
                  💡 推荐策略
                </Text>
                <Text className="block text-sm text-gray-600 mb-3">
                  {formData.meetingScene === 'blind_date' && 
                    '相亲场景建议：重点展示真诚和稳定，适合聊聊生活规划和家庭观念。'}
                  {formData.meetingScene === 'pickup' && 
                    '搭讪场景建议：信息较少，先从轻松话题开始，慢慢了解对方。'}
                  {formData.meetingScene === 'app_meetup' && 
                    'App见面建议：延续线上的话题热度，可以安排有趣的约会活动。'}
                  {formData.meetingScene === 'party' && 
                    '聚会场景建议：有共同朋友，可以组织小团体活动自然接触。'}
                  {!['blind_date', 'pickup', 'app_meetup', 'party'].includes(formData.meetingScene) && 
                    '建议：根据对方的兴趣爱好安排合适的互动内容。'}
                </Text>
                <View className="flex flex-wrap gap-2">
                  {formData.interests.map((interest, i) => (
                    <Badge key={i} variant="outline" className="text-indigo-600">
                      {interest}
                    </Badge>
                  ))}
                </View>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0">
              <CardContent className="p-4">
                <Text className="block font-semibold text-gray-800 mb-3">📝 档案确认</Text>
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
