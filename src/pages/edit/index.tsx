import { View, Text } from '@tarojs/components'
import { useLoad, useRouter, navigateBack } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, Heart, Check, X, Plus, Loader } from 'lucide-react-taro'
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

const EditPage: FC = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    console.log('Edit page loaded.', router.params.id)
    fetchDetail()
  })

  const fetchDetail = async () => {
    const id = router.params.id
    if (!id) return

    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/match/${id}`,
        method: 'GET'
      })
      console.log('Fetch detail response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const data = res.data.data
        setFormData({
          name: data.name || '',
          age: data.age ? String(data.age) : '',
          gender: data.gender || 'female',
          occupation: data.occupation || '',
          mbti: data.mbti || '',
          zodiac: data.zodiac || '',
          meetingScene: data.meetingScene || '',
          meetingDate: data.meetingDate || '',
          relationshipStage: data.relationshipStage || 'new',
          interactionStatus: data.interactionStatus || 'just_met',
          impression: data.impression || 0,
          impressionTags: data.impressionTags || [],
          interests: data.interests || [],
          notes: data.notes || '',
        })
      }
    } catch (error) {
      console.error('Fetch detail error:', error)
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    navigateBack()
  }

  const save = async () => {
    const id = router.params.id
    if (!id) return

    try {
      setSaving(true)
      console.log('Updating match with data:', formData)
      
      const res = await Network.request({
        url: `/api/match/${id}/update`,
        method: 'POST',
        data: {
          name: formData.name,
          age: parseInt(formData.age) || 0,
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
      
      console.log('Update match response:', res.data)
      
      if (res.data?.code === 200) {
        navigateBack()
      }
    } catch (error) {
      console.error('Update match error:', error)
    } finally {
      setSaving(false)
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

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size={32} color="#6366F1" className="animate-spin" />
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      {/* 头部 */}
      <View className="bg-white p-4 border-b border-gray-100">
        <View className="flex items-center justify-between">
          <View onClick={goBack}>
            <ArrowLeft size={24} color="#6B7280" />
          </View>
          <Text className="block font-semibold text-gray-800">编辑档案</Text>
          <View className="w-6" />
        </View>
      </View>

      <View className="p-4">
        {/* 基础资料 */}
        <Text className="block text-lg font-bold text-gray-800 mb-3">📋 基础资料</Text>
        <Card className="shadow-sm border-0 mb-6">
          <CardContent className="p-4">
            <View className="mb-4">
              <Text className="block text-sm font-medium text-gray-700 mb-2">姓名 *</Text>
              <View className="bg-gray-50 rounded-lg px-3 py-2">
                <Input
                  placeholder="Ta叫什么名字？"
                  value={formData.name}
                  onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
                />
              </View>
            </View>
            <View className="mb-4">
              <Text className="block text-sm font-medium text-gray-700 mb-2">年龄 *</Text>
              <View className="bg-gray-50 rounded-lg px-3 py-2">
                <Input
                  type="number"
                  placeholder="Ta多大？"
                  value={formData.age}
                  onInput={(e) => setFormData({ ...formData, age: e.detail.value })}
                />
              </View>
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
              <View className="bg-gray-50 rounded-lg px-3 py-2">
                <Input
                  placeholder="Ta做什么工作？"
                  value={formData.occupation}
                  onInput={(e) => setFormData({ ...formData, occupation: e.detail.value })}
                />
              </View>
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
            <View className="mb-4">
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
            <View className="mb-4">
              <Text className="block text-sm font-medium text-gray-700 mb-2">见面场景</Text>
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
            <View>
              <Text className="block text-sm font-medium text-gray-700 mb-2">第一次见面日期</Text>
              <View className="bg-gray-50 rounded-lg px-3 py-2">
                <Input
                  type="text"
                  placeholder="例如：2024-03-20"
                  value={formData.meetingDate}
                  onInput={(e) => setFormData({ ...formData, meetingDate: e.detail.value })}
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 关系状态 */}
        <Text className="block text-lg font-bold text-gray-800 mb-3">💝 关系状态</Text>
        
        {/* 关系阶段 */}
        <Text className="block text-sm font-medium text-gray-700 mb-2">当前阶段</Text>
        <View className="grid grid-cols-2 gap-3 mb-4">
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
        <Text className="block text-sm font-medium text-gray-700 mb-2">互动状态</Text>
        <View className="flex flex-wrap gap-2 mb-4">
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
        <Card className="shadow-sm border-0 mb-6">
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
        <View className="flex flex-wrap gap-2 mb-6">
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

        {/* 兴趣爱好 */}
        <Text className="block text-lg font-bold text-gray-800 mb-3">🎯 兴趣爱好</Text>
        
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
        <View className="flex flex-wrap gap-2 mb-6">
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

        {/* 备注 */}
        <Text className="block text-lg font-bold text-gray-800 mb-3">📝 备注</Text>
        <Card className="shadow-sm border-0 mb-6">
          <CardContent className="p-4">
            <View className="bg-gray-50 rounded-lg px-3 py-2">
              <Input
                placeholder="其他想记录的信息..."
                value={formData.notes}
                onInput={(e) => setFormData({ ...formData, notes: e.detail.value })}
              />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部按钮 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <Button
          className="w-full bg-indigo-500"
          disabled={!formData.name || !formData.age || saving}
          onClick={save}
        >
          {saving ? (
            <Loader size={16} color="#fff" className="animate-spin" />
          ) : (
            <ArrowRight size={16} color="#fff" />
          )}
          <Text className="text-white ml-1">{saving ? '保存中...' : '保存修改'}</Text>
        </Button>
      </View>
    </View>
  )
}

export default EditPage
