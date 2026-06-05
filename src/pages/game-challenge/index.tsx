import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Eye, FileText, Search, Target, Clock, Trophy, RotateCcw, Check, X } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Option {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  description: string
  question: string
  options: Option[]
}

interface Challenge {
  id: string
  name: string
  icon: any
  color: string
  description: string
  readTime: number
  questions: Question[]
}

const challenges: Challenge[] = [
  {
    id: 'person',
    name: '人物观察',
    icon: Eye,
    color: 'from-rose-400 to-pink-500',
    description: '观察人物的细节特征',
    readTime: 10,
    questions: [
      {
        id: 'p1',
        description: '小明今天穿了一件深蓝色的卫衣，卫衣上有一个白色的星形图案。他戴着一副黑色的圆框眼镜，头发是棕色的，稍微有点乱。他的左耳朵上戴着一个银色的耳环。他背着一个灰色的双肩包，包的侧面挂着一个紫色的小熊玩偶。',
        question: '小明的卫衣是什么颜色？',
        options: [
          { id: 'a', text: '深蓝色', isCorrect: true },
          { id: 'b', text: '黑色', isCorrect: false },
          { id: 'c', text: '灰色', isCorrect: false },
          { id: 'd', text: '棕色', isCorrect: false },
        ],
      },
      {
        id: 'p2',
        description: '李华今天穿了一件白色的T恤，T恤正面印着"LOVE"四个字母。她扎着马尾辫，头发是黑色的。她戴着一副粉色的墨镜，脖子上戴着一条银色的项链。她手里拿着一杯奶茶，奶茶杯上画着一只可爱的小猫。',
        question: '李华的T恤上印着什么？',
        options: [
          { id: 'a', text: 'HEART', isCorrect: false },
          { id: 'b', text: 'LOVE', isCorrect: true },
          { id: 'c', text: 'SMILE', isCorrect: false },
          { id: 'd', text: 'HAPPY', isCorrect: false },
        ],
      },
      {
        id: 'p3',
        description: '王刚穿着一套深灰色的西装，西装的扣子是金色的。他戴着一副银色的手表，手表的表带是黑色的。他的头发很短，是黑色的。他手里提着一个黑色的公文包，公文包上有一个银色的金属锁扣。',
        question: '王刚西装的扣子是什么颜色？',
        options: [
          { id: 'a', text: '银色', isCorrect: false },
          { id: 'b', text: '金色', isCorrect: true },
          { id: 'c', text: '黑色', isCorrect: false },
          { id: 'd', text: '灰色', isCorrect: false },
        ],
      },
      {
        id: 'p4',
        description: '小红穿着一条浅蓝色的连衣裙，连衣裙上印着白色的小花朵图案。她的长发是棕色的，自然披在肩上。她戴着一条珍珠项链，项链上有一个红色的吊坠。她穿着一双白色的高跟鞋，高跟鞋的鞋跟是7厘米。',
        question: '小红的项链吊坠是什么颜色？',
        options: [
          { id: 'a', text: '白色', isCorrect: false },
          { id: 'b', text: '蓝色', isCorrect: false },
          { id: 'c', text: '红色', isCorrect: true },
          { id: 'd', text: '粉色', isCorrect: false },
        ],
      },
      {
        id: 'p5',
        description: '张伟穿着一件黑色的运动服，运动服上有一个白色的耐克标志。他戴着一顶红色的棒球帽，帽子是反戴的。他穿了一双白色的运动鞋，鞋子的侧面有银色的装饰线条。他手里拿着一个篮球，篮球是橙色的。',
        question: '张伟的帽子是什么颜色的？',
        options: [
          { id: 'a', text: '黑色', isCorrect: false },
          { id: 'b', text: '白色', isCorrect: false },
          { id: 'c', text: '红色', isCorrect: true },
          { id: 'd', text: '蓝色', isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 'scene',
    name: '场景观察',
    icon: Search,
    color: 'from-amber-400 to-orange-500',
    description: '观察场景中的细节',
    readTime: 10,
    questions: [
      {
        id: 's1',
        description: '房间里有一张长方形的白色书桌，桌子上放着一台黑色的电脑，电脑旁边有一盏黄色的台灯。书桌的左边有一把蓝色的椅子，椅子上有两个白色的靠垫。房间的墙上挂着一幅绿色的风景画，画的旁边有一个圆形的镜子。',
        question: '书桌上放着一盏什么颜色的台灯？',
        options: [
          { id: 'a', text: '红色', isCorrect: false },
          { id: 'b', text: '黄色', isCorrect: true },
          { id: 'c', text: '蓝色', isCorrect: false },
          { id: 'd', text: '绿色', isCorrect: false },
        ],
      },
      {
        id: 's2',
        description: '厨房里有一个白色的冰箱，冰箱上贴着三张照片和两个磁铁。冰箱旁边是一个不锈钢的洗碗机，洗碗机的上方有一排白色的橱柜。厨房的窗户是长方形的，挂着白色的窗帘。厨房的地板上铺着灰色的瓷砖。',
        question: '冰箱上贴着几张照片？',
        options: [
          { id: 'a', text: '2张', isCorrect: false },
          { id: 'b', text: '3张', isCorrect: true },
          { id: 'c', text: '4张', isCorrect: false },
          { id: 'd', text: '5张', isCorrect: false },
        ],
      },
      {
        id: 's3',
        description: '公园里有一个圆形的喷泉，喷泉的水柱高约3米。喷泉的周围有四张长椅，长椅是褐色的。喷泉的左边有一棵大槐树，树下放着一个绿色的垃圾桶。喷泉的右边是一条小路，小路两旁种着粉色的玫瑰花。',
        question: '长椅是什么颜色的？',
        options: [
          { id: 'a', text: '灰色', isCorrect: false },
          { id: 'b', text: '褐色', isCorrect: true },
          { id: 'c', text: '绿色', isCorrect: false },
          { id: 'd', text: '黑色', isCorrect: false },
        ],
      },
      {
        id: 's4',
        description: '办公室里有一张深色的办公桌，桌子上放着一台电脑、一个咖啡杯和一个文件夹。办公桌的后面是一把黑色的办公椅，椅子的扶手是木质的。办公室的墙上挂着一块白板，白板上写着"周一会议"四个字。房间的角落里放着一个绿色的盆栽。',
        question: '白板上写着什么？',
        options: [
          { id: 'a', text: '周五会议', isCorrect: false },
          { id: 'b', text: '周一会议', isCorrect: true },
          { id: 'c', text: '周三会议', isCorrect: false },
          { id: 'd', text: '周二会议', isCorrect: false },
        ],
      },
      {
        id: 's5',
        description: '客厅里有一张灰色的布艺沙发，沙发上有三个抱枕，抱枕是白色的。沙发的前面是一个长方形的茶几，茶几上放着一个花瓶和三本杂志。客厅的墙上挂着一台电视机，电视机下面是一个黑色的电视柜。电视柜上放着一个音响和一个相框。',
        question: '沙发上有几个抱枕？',
        options: [
          { id: 'a', text: '2个', isCorrect: false },
          { id: 'b', text: '3个', isCorrect: true },
          { id: 'c', text: '4个', isCorrect: false },
          { id: 'd', text: '5个', isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 'detail',
    name: '细节捕捉',
    icon: FileText,
    color: 'from-emerald-400 to-green-500',
    description: '快速捕捉关键信息',
    readTime: 8,
    questions: [
      {
        id: 'd1',
        description: '这是一篇关于天气预报的报道：今天北京的天气晴朗，最高气温28度，最低气温15度。明天会下小雨，气温会下降到25度。后天天气转晴，气温回升到30度。注意防晒，出门记得带雨伞。',
        question: '明天北京会下什么雨？',
        options: [
          { id: 'a', text: '大雨', isCorrect: false },
          { id: 'b', text: '小雨', isCorrect: true },
          { id: 'c', text: '暴雨', isCorrect: false },
          { id: 'd', text: '不下雨', isCorrect: false },
        ],
      },
      {
        id: 'd2',
        description: '这是一则招聘启事：某科技公司正在招聘前端工程师，要求有3年以上工作经验，熟悉React和Vue框架。薪资待遇为15K-25K，工作地点在北京市朝阳区。简历投递邮箱为hr@company.com，截止日期为本月30日。',
        question: '薪资待遇是多少？',
        options: [
          { id: 'a', text: '10K-20K', isCorrect: false },
          { id: 'b', text: '15K-25K', isCorrect: true },
          { id: 'c', text: '20K-30K', isCorrect: false },
          { id: 'd', text: '25K-35K', isCorrect: false },
        ],
      },
      {
        id: 'd3',
        description: '这是一则餐厅广告：本餐厅位于市中心繁华地段，营业时间从上午10点到晚上10点。我们提供多种美食，包括川菜、粤菜和西餐。现在推出优惠活动，消费满100元减20元，会员还可享受8折优惠。',
        question: '餐厅的营业时间是什么时候？',
        options: [
          { id: 'a', text: '8点到20点', isCorrect: false },
          { id: 'b', text: '10点到22点', isCorrect: true },
          { id: 'c', text: '9点到21点', isCorrect: false },
          { id: 'd', text: '11点到23点', isCorrect: false },
        ],
      },
      {
        id: 'd4',
        description: '这是一则电影预告：一部新电影即将上映，讲述了一个关于友情和冒险的故事。电影将于下周五在全国各大影院上映，片长120分钟。导演是著名导演张艺谋，主演是演员邓超和孙俪。票价从30元到80元不等。',
        question: '电影的片长是多少分钟？',
        options: [
          { id: 'a', text: '100分钟', isCorrect: false },
          { id: 'b', text: '110分钟', isCorrect: false },
          { id: 'c', text: '120分钟', isCorrect: true },
          { id: 'd', text: '130分钟', isCorrect: false },
        ],
      },
      {
        id: 'd5',
        description: '这是一则课程介绍：本课程为期12周，每周2次课，每次课2小时。课程内容包括前端基础、进阶技术和项目实战。学费为3800元，提供分期付款选项。学员完成课程后可以获得结业证书，优秀学员还可获得实习机会。',
        question: '课程为期多少周？',
        options: [
          { id: 'a', text: '8周', isCorrect: false },
          { id: 'b', text: '10周', isCorrect: false },
          { id: 'c', text: '12周', isCorrect: true },
          { id: 'd', text: '14周', isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 'memory',
    name: '记忆测试',
    icon: Target,
    color: 'from-emerald-400 to-green-500',
    description: '快速记忆并回答',
    readTime: 12,
    questions: [
      {
        id: 'm1',
        description: '请记住这个购物清单：苹果3个、香蕉2根、牛奶1盒、面包1袋、鸡蛋1盒、蔬菜2斤、水果1斤。清单上总共有7种商品。',
        question: '清单上有多少种商品？',
        options: [
          { id: 'a', text: '5种', isCorrect: false },
          { id: 'b', text: '6种', isCorrect: false },
          { id: 'c', text: '7种', isCorrect: true },
          { id: 'd', text: '8种', isCorrect: false },
        ],
      },
      {
        id: 'm2',
        description: '请记住这些日期：小明的生日是5月15日，小红的生日是8月20日，小华的生日是11月5日，小李的生日是3月18日，小王的生日是12月25日。',
        question: '小红的生日是哪一天？',
        options: [
          { id: 'a', text: '5月15日', isCorrect: false },
          { id: 'b', text: '8月20日', isCorrect: true },
          { id: 'c', text: '11月5日', isCorrect: false },
          { id: 'd', text: '3月18日', isCorrect: false },
        ],
      },
      {
        id: 'm3',
        description: '请记住这个密码规则：密码长度为8-12位，必须包含大小写字母、数字和特殊字符。不能使用连续的数字，不能重复使用字符。密码每3个月更换一次。',
        question: '密码长度是多少位？',
        options: [
          { id: 'a', text: '6-10位', isCorrect: false },
          { id: 'b', text: '8-12位', isCorrect: true },
          { id: 'c', text: '10-14位', isCorrect: false },
          { id: 'd', text: '12-16位', isCorrect: false },
        ],
      },
      {
        id: 'm4',
        description: '请记住这个停车收费标准：停车费每小时5元，每天最高收费50元。晚上10点到早上6点免费。会员可以享受8折优惠。停车超过24小时按照天收费。',
        question: '停车费每小时多少钱？',
        options: [
          { id: 'a', text: '3元', isCorrect: false },
          { id: 'b', text: '5元', isCorrect: true },
          { id: 'c', text: '8元', isCorrect: false },
          { id: 'd', text: '10元', isCorrect: false },
        ],
      },
      {
        id: 'm5',
        description: '请记住这个航班信息：航班号为CA1234，起飞时间是上午10点，预计飞行时间2小时30分钟。登机口为A18，行李额为20公斤。请提前1小时到达机场办理值机。',
        question: '登机口是多少？',
        options: [
          { id: 'a', text: 'A12', isCorrect: false },
          { id: 'b', text: 'A15', isCorrect: false },
          { id: 'c', text: 'A18', isCorrect: true },
          { id: 'd', text: 'A20', isCorrect: false },
        ],
      },
    ],
  },
]

const ChallengePage: FC = () => {
  const [step, setStep] = useState<'select' | 'read' | 'play' | 'result'>('select')
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [readTimeLeft, setReadTimeLeft] = useState(10)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [totalTimeUsed, setTotalTimeUsed] = useState(0)

  useLoad(() => {
    console.log('Challenge game loaded.')
  })

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 'read' && isTimerActive && readTimeLeft > 0) {
      interval = setInterval(() => {
        setReadTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (step === 'read' && readTimeLeft === 0) {
      handleReadTimeUp()
    }
    return () => clearInterval(interval)
  }, [step, isTimerActive, readTimeLeft])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 'play' && isTimerActive && timeLeft > 0 && !showResult) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && step === 'play' && !showResult) {
      handleAnswerTimeUp()
    }
    return () => clearInterval(interval)
  }, [step, isTimerActive, timeLeft, showResult])

  const handleSelectChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setStep('read')
    setCurrentQuestionIndex(0)
    setReadTimeLeft(challenge.readTime)
    setSelectedOption(null)
    setShowResult(false)
    setTimeLeft(30)
    setScore(0)
    setCorrectCount(0)
    setIsTimerActive(true)
    setTotalTimeUsed(0)
  }

  const handleReadTimeUp = () => {
    setStep('play')
    setIsTimerActive(false)
  }

  const handleSelectOption = (optionId: string) => {
    if (!selectedChallenge) return

    const question = selectedChallenge.questions[currentQuestionIndex]
    const option = question.options.find(opt => opt.id === optionId)

    if (option) {
      setSelectedOption(optionId)
      setShowResult(true)
      setIsTimerActive(false)
      setTotalTimeUsed(prev => prev + (30 - timeLeft))

      if (option.isCorrect) {
        setScore((prev) => prev + (timeLeft > 0 ? 100 + timeLeft : 100))
        setCorrectCount((prev) => prev + 1)
      }
    }
  }

  const handleAnswerTimeUp = () => {
    setShowResult(true)
    setIsTimerActive(false)
    setTotalTimeUsed(prev => prev + 30)
  }

  const handleNextQuestion = () => {
    if (!selectedChallenge) return

    if (currentQuestionIndex < selectedChallenge.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOption(null)
      setShowResult(false)
      setReadTimeLeft(selectedChallenge.readTime)
      setTimeLeft(30)
      setStep('read')
      setIsTimerActive(true)
    } else {
      setStep('result')
    }
  }

  const handleReset = () => {
    setStep('select')
    setSelectedChallenge(null)
    setCurrentQuestionIndex(0)
    setReadTimeLeft(10)
    setSelectedOption(null)
    setShowResult(false)
    setTimeLeft(30)
    setScore(0)
    setCorrectCount(0)
    setIsTimerActive(false)
    setTotalTimeUsed(0)
  }

  const getObservationScore = () => {
    if (!selectedChallenge) return 0
    return Math.round((correctCount / selectedChallenge.questions.length) * 100)
  }

  const getObservationLevel = (observationScore: number) => {
    if (observationScore >= 80) return { text: '观察力敏锐', color: 'text-green-600', icon: '👁️' }
    if (observationScore >= 60) return { text: '观察力良好', color: 'text-blue-600', icon: '👀' }
    if (observationScore >= 40) return { text: '观察力一般', color: 'text-amber-600', icon: '🔍' }
    return { text: '需要多加观察', color: 'text-rose-600', icon: '🔎' }
  }

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#FFF9F0' }}>
      {/* 顶部 */}
      <View className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-2">观察力挑战</Text>
        <Text className="block text-sm text-stone-200">
          快速阅读，捕捉细节
        </Text>
      </View>

      {/* 游戏区域 */}
      <View className="p-4">
        {step === 'select' && (
          <>
            <Text className="block text-sm font-medium text-stone-500 mb-3">选择挑战类型</Text>
            {challenges.map((challenge) => {
              const Icon = challenge.icon
              return (
                <Card
                  key={challenge.id}
                  className="mb-3 overflow-hidden"
                  onClick={() => handleSelectChallenge(challenge)}
                >
                  <View className={`bg-gradient-to-r ${challenge.color} px-4 py-4`}>
                    <View className="flex flex-row items-center justify-between">
                      <View className="flex flex-row items-center flex-1">
                        <View className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
                          <Icon size={20} color={challenge.color.split(' ')[0].split('-to-')[0].replace('from-', '')} />
                        </View>
                        <View className="flex-1">
                          <Text className="block text-base font-semibold text-white">
                            {challenge.name}
                          </Text>
                          <Text className="block text-xs text-stone-200">
                            {challenge.description}
                          </Text>
                        </View>
                      </View>
                      <View className="flex flex-row items-center">
                        <Text className="text-xs text-stone-200 mr-2">
                          {challenge.questions.length} 题
                        </Text>
                        <Eye size={16} color="white" />
                      </View>
                    </View>
                  </View>
                </Card>
              )
            })}
          </>
        )}

        {step === 'read' && selectedChallenge && (
          <>
            {/* 顶部信息栏 */}
            <View className="bg-white rounded-xl px-4 py-3 mb-4 flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                {(() => {
                  const Icon = selectedChallenge.icon
                  return <Icon size={16} color="#6366f1" />
                })()}
                <Text className="text-sm font-medium text-stone-700 ml-2">
                  {selectedChallenge.name}
                </Text>
              </View>
              <View className="flex flex-row items-center">
                <Clock size={16} color={readTimeLeft <= 3 ? '#ef4444' : '#6b7280'} />
                <Text className={`text-sm font-medium ml-2 ${readTimeLeft <= 3 ? 'text-red-500' : 'text-stone-700'}`}>
                  {readTimeLeft}s
                </Text>
              </View>
            </View>

            {/* 进度 */}
            <View className="bg-stone-200 rounded-full h-2 mb-4">
              <View
                className={`bg-gradient-to-r ${selectedChallenge.color} h-2 rounded-full transition-all`}
                style={{ width: `${((currentQuestionIndex + 1) / selectedChallenge.questions.length) * 100}%` }}
              />
            </View>

            {/* 提示 */}
            <Card className="mb-4 bg-blue-50 border-blue-200">
              <CardContent className="py-3">
                <View className="flex flex-row items-center justify-center">
                  <Eye size={16} color="#3b82f6" />
                  <Text className="text-sm font-medium text-blue-700 ml-2">
                    请仔细阅读以下内容，{selectedChallenge.readTime}秒后隐藏
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* 描述文本 */}
            <Card className="mb-4">
              <CardContent className="py-5">
                <View className="flex flex-row items-start">
                  <FileText size={16} color="#6366f1" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-sm text-stone-800 leading-relaxed">
                    {selectedChallenge.questions[currentQuestionIndex].description}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </>
        )}

        {step === 'play' && selectedChallenge && (
          <>
            {/* 顶部信息栏 */}
            <View className="bg-white rounded-xl px-4 py-3 mb-4 flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                {(() => {
                  const Icon = selectedChallenge.icon
                  return <Icon size={16} color="#6366f1" />
                })()}
                <Text className="text-sm font-medium text-stone-700 ml-2">
                  {selectedChallenge.name}
                </Text>
              </View>
              <View className="flex flex-row items-center">
                <Clock size={16} color={timeLeft <= 10 ? '#ef4444' : '#6b7280'} />
                <Text className={`text-sm font-medium ml-2 ${timeLeft <= 10 ? 'text-red-500' : 'text-stone-700'}`}>
                  {timeLeft}s
                </Text>
              </View>
            </View>

            {/* 进度 */}
            <View className="bg-stone-200 rounded-full h-2 mb-4">
              <View
                className={`bg-gradient-to-r ${selectedChallenge.color} h-2 rounded-full transition-all`}
                style={{ width: `${((currentQuestionIndex + 1) / selectedChallenge.questions.length) * 100}%` }}
              />
            </View>

            {/* 问题 */}
            <Card className="mb-4">
              <CardContent className="py-4">
                <View className="flex flex-row items-center">
                  <Eye size={16} color="#6366f1" className="mr-2 flex-shrink-0" />
                  <Text className="text-base font-medium text-stone-900">
                    {selectedChallenge.questions[currentQuestionIndex].question}
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* 选项 */}
            <View className="space-y-3 mb-4">
              {selectedChallenge.questions[currentQuestionIndex].options.map((option) => (
                <Card
                  key={option.id}
                  className={`border-2 cursor-pointer ${
                    showResult
                      ? option.id === selectedOption
                        ? option.isCorrect
                          ? 'border-green-500 bg-green-50'
                          : 'border-rose-500 bg-rose-50'
                        : option.isCorrect
                          ? 'border-green-300 bg-green-50'
                          : 'border-stone-200'
                      : selectedOption === option.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-stone-200 active:bg-stone-50'
                  }`}
                  onClick={() => !showResult && handleSelectOption(option.id)}
                >
                  <CardContent className="py-4">
                    <View className="flex flex-row items-center">
                      <View
                        className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                          showResult
                            ? option.id === selectedOption
                              ? option.isCorrect
                                ? 'bg-green-500'
                                : 'bg-rose-500'
                              : option.isCorrect
                                ? 'bg-green-500'
                                : 'bg-stone-300'
                            : selectedOption === option.id
                              ? 'bg-green-500'
                              : 'bg-stone-300'
                        }`}
                      >
                        {showResult && option.isCorrect && <Check size={14} color="white" />}
                        {showResult && option.id === selectedOption && !option.isCorrect && <X size={14} color="white" />}
                      </View>
                      <Text
                        className={`text-sm flex-1 ${
                          showResult && option.isCorrect
                            ? 'text-green-700 font-medium'
                            : showResult && option.id === selectedOption
                              ? 'text-rose-700 font-medium'
                              : 'text-stone-700'
                        }`}
                      >
                        {option.text}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>

            {/* 下一题按钮 */}
            {showResult && (
              <Button
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500"
                onClick={handleNextQuestion}
              >
                <Text className="text-white font-medium">
                  {currentQuestionIndex === selectedChallenge.questions.length - 1
                    ? '查看结果'
                    : '下一题'}
                </Text>
              </Button>
            )}
          </>
        )}

        {step === 'result' && selectedChallenge && (
          <>
            {/* 结果卡片 */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 mb-4">
              <CardContent className="py-6">
                <View className="flex flex-col items-center">
                  <View className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                    <Trophy size={40} color="#6366f1" />
                  </View>
                  <Text className="block text-lg font-semibold text-stone-900 mb-2">
                    挑战完成！
                  </Text>
                  <View className="flex flex-row items-center mb-3">
                    <Text className="text-2xl mr-2">{getObservationLevel(getObservationScore()).icon}</Text>
                    <Text
                      className={`text-lg font-semibold ${getObservationLevel(getObservationScore()).color}`}
                    >
                      {getObservationLevel(getObservationScore()).text}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 统计数据 */}
            <View className="grid grid-cols-2 gap-3 mb-4">
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-stone-500 mb-1">正确题数</Text>
                  <Text className="block text-2xl font-bold text-green-600">
                    {correctCount} / {selectedChallenge.questions.length}
                  </Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-stone-500 mb-1">观察力评分</Text>
                  <Text className="block text-2xl font-bold text-green-600">
                    {getObservationScore()}%
                  </Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-stone-500 mb-1">总得分</Text>
                  <Text className="block text-2xl font-bold text-green-600">{score}</Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-stone-500 mb-1">平均用时</Text>
                  <Text className="block text-2xl font-bold text-green-600">
                    {selectedChallenge.questions.length > 0
                      ? Math.round(totalTimeUsed / selectedChallenge.questions.length)
                      : 0}s
                  </Text>
                </CardContent>
              </Card>
            </View>

            {/* 建议 */}
            <Card className="mb-4">
              <CardContent className="py-4">
                <View className="flex flex-row items-start">
                  <Eye size={16} color="#6366f1" className="mr-2 mt-1 flex-shrink-0" />
                  <View className="flex-1">
                    <Text className="text-xs text-stone-500 mb-1">建议</Text>
                    <Text className="text-sm text-stone-700 leading-relaxed">
                      {getObservationScore() >= 80
                        ? '你的观察力非常敏锐！继续保持这种关注度。'
                        : getObservationScore() >= 60
                          ? '你的观察力不错，可以多关注细节。'
                          : getObservationScore() >= 40
                            ? '观察力有待提升，多花时间观察。'
                            : '需要更多地关注细节，细心观察很重要。'}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 重新开始 */}
            <Button
              variant="secondary"
              className="w-full rounded-xl py-3"
              onClick={handleReset}
            >
              <View className="flex flex-row items-center justify-center">
                <RotateCcw size={18} color="#6b7280" />
                <Text className="ml-2">选择其他挑战</Text>
              </View>
            </Button>
          </>
        )}
      </View>

      {/* 底部提示 */}
      <View className="bg-white border-t border-orange-100 px-4 py-3 mt-4">
        <View className="flex flex-row items-center">
          <Eye size={16} color="#6366f1" />
          <Text className="block text-xs text-stone-500 ml-2">
            提示：仔细阅读内容，快速回答问题
          </Text>
        </View>
      </View>
    </View>
  )
}

export default ChallengePage
