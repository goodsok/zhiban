import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Zap, Clock, Heart, Star, Coffee, Target, RotateCcw } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Question {
  id: string
  text: string
  options: string[]
  answer: number // 正确答案的索引，0或1
}

interface Category {
  id: string
  name: string
  icon: any
  color: string
  description: string
  difficulty: string
  questions: Question[]
}

const categories: Category[] = [
  {
    id: 'emotion',
    name: '情感观念',
    icon: Heart,
    color: 'from-pink-400 to-rose-500',
    description: '深入了解TA的爱情观',
    difficulty: '⭐⭐⭐⭐',
    questions: [
      { id: 'e1', text: 'TA和前任是因为什么分手的？', options: ['性格不合', '其他原因'], answer: 1 },
      { id: 'e2', text: 'TA认为爱情中最重要的是信任吗？', options: ['是', '不是'], answer: 0 },
      { id: 'e3', text: 'TA能接受伴侣有异性朋友吗？', options: ['能', '不能'], answer: 0 },
      { id: 'e4', text: 'TA认为婚前同居是可以的吗？', options: ['可以', '不可以'], answer: 0 },
      { id: 'e5', text: 'TA对婚前性行为的态度是开放的吗？', options: ['是', '不是'], answer: 0 },
      { id: 'e6', text: 'TA认为结婚是必须的吗？', options: ['是', '不是'], answer: 1 },
      { id: 'e7', text: 'TA最不能接受伴侣出轨吗？', options: ['是', '不是'], answer: 0 },
      { id: 'e8', text: 'TA认为吵架后应该先道歉吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'e9', text: 'TA认为冷战是解决问题的方式吗？', options: ['是', '不是'], answer: 1 },
      { id: 'e10', text: 'TA认为爱情应该保持新鲜感吗？', options: ['是', '不是'], answer: 0 },
      { id: 'e11', text: 'TA最难忘的感情维持了超过半年吗？', options: ['是', '不是'], answer: 0 },
      { id: 'e12', text: 'TA认为恋人之间应该保留个人空间吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'e13', text: 'TA会主动告诉伴侣自己的性经历吗？', options: ['会', '不会'], answer: 1 },
      { id: 'e14', text: 'TA认为一见钟情是存在的吗？', options: ['是', '不是'], answer: 0 },
      { id: 'e15', text: 'TA认为网恋能发展成现实吗？', options: ['能', '不能'], answer: 0 },
      { id: 'e16', text: 'TA认为年龄差很重要吗？', options: ['重要', '不重要'], answer: 1 },
      { id: 'e17', text: 'TA能接受异地恋吗？', options: ['能', '不能'], answer: 0 },
      { id: 'e18', text: 'TA认为前任应该完全断联吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'e19', text: 'TA认为爱情需要经营吗？', options: ['需要', '不需要'], answer: 0 },
      { id: 'e20', text: 'TA认为伴侣应该比自己大吗？', options: ['应该', '无所谓'], answer: 1 },
      { id: 'e21', text: 'TA认为同居会破坏感情吗？', options: ['会', '不会'], answer: 1 },
      { id: 'e22', text: 'TA认为吵架是正常的吗？', options: ['正常', '不正常'], answer: 0 },
      { id: 'e23', text: 'TA认为应该AA制吗？', options: ['应该', '看情况'], answer: 1 },
      { id: 'e24', text: 'TA认为约会应该男方付钱吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'e25', text: 'TA认为应该主动追求喜欢的人吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'e26', text: 'TA认为表白应该由男生做吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'e27', text: 'TA认为恋爱应该公开吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'e28', text: 'TA认为应该经常查岗吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'e29', text: 'TA认为应该看对方手机吗？', options: ['可以', '不可以'], answer: 1 },
      { id: 'e30', text: 'TA认为应该和前任保持联系吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'e31', text: 'TA认为爱情需要激情吗？', options: ['需要', '不需要'], answer: 0 },
      { id: 'e32', text: 'TA认为婚姻需要爱情的吗？', options: ['需要', '不需要'], answer: 0 },
      { id: 'e33', text: 'TA认为应该为了爱情放弃一切吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'e34', text: 'TA认为爱情可以跨越阶层吗？', options: ['可以', '不可以'], answer: 0 },
      { id: 'e35', text: 'TA认为应该结婚后才同居吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'e36', text: 'TA认为应该为了伴侣改变自己吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'e37', text: 'TA认为爱情应该是平等的吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'e38', text: 'TA认为应该经常说"我爱你"吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'e39', text: 'TA认为应该纪念日都送礼物吗？', options: ['应该', '没必要'], answer: 1 },
      { id: 'e40', text: 'TA认为应该每天联系吗？', options: ['应该', '没必要'], answer: 0 },
    ],
  },
  {
    id: 'values',
    name: '价值观',
    icon: Target,
    color: 'from-green-400 to-emerald-500',
    description: '了解TA的人生观',
    difficulty: '⭐⭐⭐⭐⭐',
    questions: [
      { id: 'v1', text: 'TA认为人生最重要的是什么？', options: ['事业', '家庭'], answer: 1 },
      { id: 'v2', text: 'TA认为金钱很重要吗？', options: ['重要', '不重要'], answer: 0 },
      { id: 'v3', text: 'TA认为成功就是有钱吗？', options: ['是', '不是'], answer: 1 },
      { id: 'v4', text: 'TA愿意为感情放弃事业吗？', options: ['愿意', '不愿意'], answer: 1 },
      { id: 'v5', text: 'TA认为应该听父母的话吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'v6', text: 'TA认为孩子应该由谁带？', options: ['父母', '祖父母'], answer: 0 },
      { id: 'v7', text: 'TA认为应该给孩子报很多班吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'v8', text: 'TA认为婚前应该查对方征信吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'v9', text: 'TA认为应该存很多钱吗？', options: ['应该', '没必要'], answer: 0 },
      { id: 'v10', text: 'TA认为应该及时行乐吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'v11', text: 'TA认为人生苦短，应该享受吗？', options: ['是', '不是'], answer: 0 },
      { id: 'v12', text: 'TA认为应该努力工作吗？', options: ['应该', '没必要'], answer: 0 },
      { id: 'v13', text: 'TA认为应该为了买房拼命吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'v14', text: 'TA认为应该结婚吗？', options: ['应该', '不一定'], answer: 1 },
      { id: 'v15', text: 'TA认为友谊比爱情重要吗？', options: ['是', '不是'], answer: 1 },
      { id: 'v16', text: 'TA认为应该和父母同住吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'v17', text: 'TA认为应该给父母养老吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'v18', text: 'TA认为应该买保险吗？', options: ['应该', '没必要'], answer: 0 },
      { id: 'v19', text: 'TA认为应该投资理财吗？', options: ['应该', '没必要'], answer: 0 },
      { id: 'v20', text: 'TA认为应该提前规划养老吗？', options: ['应该', '没必要'], answer: 0 },
      { id: 'v21', text: 'TA认为应该买房吗？', options: ['应该', '租房也行'], answer: 1 },
      { id: 'v22', text: 'TA认为应该买车吗？', options: ['应该', '没必要'], answer: 1 },
      { id: 'v23', text: 'TA认为应该生孩子吗？', options: ['应该', '不一定'], answer: 1 },
      { id: 'v24', text: 'TA认为应该要二胎吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'v25', text: 'TA认为应该重视教育吗？', options: ['应该', '没必要'], answer: 0 },
      { id: 'v26', text: 'TA认为应该让孩子自由发展吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'v27', text: 'TA认为应该给孩子最好的教育吗？', options: ['应该', '没必要'], answer: 0 },
      { id: 'v28', text: 'TA认为应该尊重孩子吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'v29', text: 'TA认为应该严厉管教孩子吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'v30', text: 'TA认为应该和朋友保持距离吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'v31', text: 'TA认为应该帮助朋友吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'v32', text: 'TA认为应该借钱给朋友吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'v33', text: 'TA认为应该为了朋友得罪人吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'v34', text: 'TA认为应该和同事保持距离吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'v35', text: 'TA认为应该工作第一吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'v36', text: 'TA认为应该享受生活吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'v37', text: 'TA认为应该追求完美吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'v38', text: 'TA认为应该接受不完美吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'v39', text: 'TA认为应该追求成功吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'v40', text: 'TA认为应该接受平庸吗？', options: ['应该', '不应该'], answer: 1 },
    ],
  },
  {
    id: 'personality',
    name: '性格特点',
    icon: Star,
    color: 'from-purple-400 to-violet-500',
    description: '深入了解TA的性格',
    difficulty: '⭐⭐⭐⭐',
    questions: [
      { id: 'p1', text: 'TA是内向还是外向？', options: ['内向', '外向'], answer: 0 },
      { id: 'p2', text: 'TA喜欢独处吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p3', text: 'TA喜欢热闹吗？', options: ['喜欢', '不喜欢'], answer: 1 },
      { id: 'p4', text: 'TA喜欢交朋友吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p5', text: 'TA喜欢社交吗？', options: ['喜欢', '不喜欢'], answer: 1 },
      { id: 'p6', text: 'TA喜欢安静的环境吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p7', text: 'TA容易嫉妒吗？', options: ['容易', '不容易'], answer: 1 },
      { id: 'p8', text: 'TA容易生气吗？', options: ['容易', '不容易'], answer: 1 },
      { id: 'p9', text: 'TA容易焦虑吗？', options: ['容易', '不容易'], answer: 1 },
      { id: 'p10', text: 'TA容易冲动吗？', options: ['容易', '不容易'], answer: 1 },
      { id: 'p11', text: 'TA容易抑郁吗？', options: ['容易', '不容易'], answer: 1 },
      { id: 'p12', text: 'TA喜欢冒险吗？', options: ['喜欢', '不喜欢'], answer: 1 },
      { id: 'p13', text: 'TA喜欢挑战吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p14', text: 'TA喜欢新鲜感吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p15', text: 'TA喜欢稳定吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p16', text: 'TA喜欢变化吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p17', text: 'TA喜欢计划吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p18', text: 'TA喜欢自由吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p19', text: 'TA喜欢控制吗？', options: ['喜欢', '不喜欢'], answer: 1 },
      { id: 'p20', text: 'TA喜欢依赖吗？', options: ['喜欢', '不喜欢'], answer: 1 },
      { id: 'p21', text: 'TA喜欢独立吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p22', text: 'TA喜欢被人照顾吗？', options: ['喜欢', '不喜欢'], answer: 1 },
      { id: 'p23', text: 'TA喜欢照顾别人吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p24', text: 'TA喜欢被人夸奖吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p25', text: 'TA喜欢批评别人吗？', options: ['喜欢', '不喜欢'], answer: 1 },
      { id: 'p26', text: 'TA喜欢被批评吗？', options: ['喜欢', '不喜欢'], answer: 1 },
      { id: 'p27', text: 'TA喜欢竞争吗？', options: ['喜欢', '不喜欢'], answer: 1 },
      { id: 'p28', text: 'TA喜欢合作吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p29', text: 'TA喜欢领导吗？', options: ['喜欢', '不喜欢'], answer: 1 },
      { id: 'p30', text: 'TA喜欢被领导吗？', options: ['喜欢', '不喜欢'], answer: 1 },
      { id: 'p31', text: 'TA喜欢说话吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p32', text: 'TA喜欢倾听吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p33', text: 'TA喜欢表达吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p34', text: 'TA喜欢隐藏吗？', options: ['喜欢', '不喜欢'], answer: 1 },
      { id: 'p35', text: 'TA喜欢分享吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p36', text: 'TA喜欢独占吗？', options: ['喜欢', '不喜欢'], answer: 1 },
      { id: 'p37', text: 'TA喜欢分享秘密吗？', options: ['喜欢', '不喜欢'], answer: 1 },
      { id: 'p38', text: 'TA喜欢保守秘密吗？', options: ['喜欢', '不喜欢'], answer: 0 },
      { id: 'p39', text: 'TA喜欢八卦吗？', options: ['喜欢', '不喜欢'], answer: 1 },
      { id: 'p40', text: 'TA喜欢被八卦吗？', options: ['喜欢', '不喜欢'], answer: 1 },
    ],
  },
  {
    id: 'private',
    name: '私密话题',
    icon: Coffee,
    color: 'from-amber-400 to-orange-500',
    description: '那些不敢问但想知道的',
    difficulty: '⭐⭐⭐⭐⭐',
    questions: [
      { id: 'pr1', text: 'TA有过一夜情吗？', options: ['有', '没有'], answer: 1 },
      { id: 'pr2', text: 'TA能接受伴侣有多次性经历吗？', options: ['能', '不能'], answer: 0 },
      { id: 'pr3', text: 'TA认为性生活重要吗？', options: ['重要', '不重要'], answer: 0 },
      { id: 'pr4', text: 'TA会主动说性经历吗？', options: ['会', '不会'], answer: 1 },
      { id: 'pr5', text: 'TA能接受伴侣和前任做朋友吗？', options: ['能', '不能'], answer: 0 },
      { id: 'pr6', text: 'TA认为应该看伴侣手机吗？', options: ['应该', '不应该'], answer: 1 },
      { id: 'pr7', text: 'TA能接受伴侣有异性闺蜜吗？', options: ['能', '不能'], answer: 0 },
      { id: 'pr8', text: 'TA想改变身体的哪里？', options: ['体重', '其他'], answer: 0 },
      { id: 'pr9', text: 'TA最怕伴侣发现什么？', options: ['过往', '其他'], answer: 0 },
      { id: 'pr10', text: 'TA认为什么是成熟？', options: ['年龄', '其他'], answer: 1 },
      { id: 'pr11', text: 'TA有过同居经历吗？', options: ['有', '没有'], answer: 1 },
      { id: 'pr12', text: 'TA能接受伴侣有同居经历吗？', options: ['能', '不能'], answer: 0 },
      { id: 'pr13', text: 'TA认为性经历越多越好吗？', options: ['是', '不是'], answer: 1 },
      { id: 'pr14', text: 'TA会在意伴侣的性经历吗？', options: ['在意', '不在意'], answer: 1 },
      { id: 'pr15', text: 'TA会和伴侣分享性幻想吗？', options: ['会', '不会'], answer: 0 },
      { id: 'pr16', text: 'TA能接受伴侣看色情片吗？', options: ['能', '不能'], answer: 0 },
      { id: 'pr17', text: 'TA会看色情片吗？', options: ['会', '不会'], answer: 0 },
      { id: 'pr18', text: 'TA认为性应该有新鲜感吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'pr19', text: 'TA认为应该尝试新姿势吗？', options: ['应该', '没必要'], answer: 0 },
      { id: 'pr20', text: 'TA认为性应该很频繁吗？', options: ['应该', '没必要'], answer: 1 },
      { id: 'pr21', text: 'TA能在性方面主动吗？', options: ['能', '不能'], answer: 0 },
      { id: 'pr22', text: 'TA会拒绝性行为吗？', options: ['会', '不会'], answer: 0 },
      { id: 'pr23', text: 'TA认为性是爱的表达吗？', options: ['是', '不是'], answer: 0 },
      { id: 'pr24', text: 'TA认为性应该有趣吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'pr25', text: 'TA认为性应该满足吗？', options: ['应该', '没必要'], answer: 0 },
      { id: 'pr26', text: 'TA会在性上比较吗？', options: ['会', '不会'], answer: 1 },
      { id: 'pr27', text: 'TA会在性上自卑吗？', options: ['会', '不会'], answer: 1 },
      { id: 'pr28', text: 'TA认为性能力很重要吗？', options: ['重要', '不重要'], answer: 0 },
      { id: 'pr29', text: 'TA会在意对方的性能力吗？', options: ['在意', '不在意'], answer: 1 },
      { id: 'pr30', text: 'TA认为应该讨论性吗？', options: ['应该', '不应该'], answer: 0 },
      { id: 'pr31', text: 'TA认为性应该有前戏吗？', options: ['应该', '没必要'], answer: 0 },
      { id: 'pr32', text: 'TA认为性应该有后戏吗？', options: ['应该', '没必要'], answer: 0 },
      { id: 'pr34', text: 'TA认为性应该安全吗？', options: ['应该', '无所谓'], answer: 0 },
      { id: 'pr35', text: 'TA会用安全措施吗？', options: ['会', '不会'], answer: 0 },
      { id: 'pr36', text: 'TA认为应该用安全措施吗？', options: ['应该', '没必要'], answer: 0 },
      { id: 'pr37', text: 'TA会在性上尊重对方吗？', options: ['会', '不会'], answer: 0 },
      { id: 'pr38', text: 'TA认为性应该是自愿的吗？', options: ['应该', '无所谓'], answer: 0 },
      { id: 'pr39', text: 'TA会在性上强迫对方吗？', options: ['会', '不会'], answer: 1 },
      { id: 'pr40', text: 'TA认为性应该是快乐的吗？', options: ['应该', '无所谓'], answer: 0 },
    ],
  },
]

const QuickPage: FC = () => {
  const [step, setStep] = useState<'select' | 'play' | 'result'>('select')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(8)
  const [score, setScore] = useState(0)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [totalTimeUsed, setTotalTimeUsed] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)

  useLoad(() => {
    console.log('Quick game loaded.')
  })

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 'play' && isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && step === 'play') {
      handleTimeUp()
    }
    return () => clearInterval(interval)
  }, [step, isTimerActive, timeLeft])

  const QUESTION_TIME = 8

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category)
    setStep('play')
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setTimeLeft(QUESTION_TIME)
    setScore(0)
    setTotalCorrect(0)
    setIsTimerActive(true)
    setTotalTimeUsed(0)
    setAnsweredCount(0)
  }

  const handleSelectOption = (index: number) => {
    if (!selectedCategory || selectedOption !== null) return

    const currentQuestion = selectedCategory.questions[currentQuestionIndex]

    setSelectedOption(index)
    setIsTimerActive(false)
    setTotalTimeUsed(prev => prev + (QUESTION_TIME - timeLeft))
    setAnsweredCount(prev => prev + 1)

    if (index === currentQuestion.answer) {
      setScore((prev) => prev + (timeLeft > 0 ? 100 + timeLeft * 10 : 100))
      setTotalCorrect((prev) => prev + 1)
    }

    setTimeout(() => {
      if (currentQuestionIndex < selectedCategory.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setSelectedOption(null)
        setTimeLeft(QUESTION_TIME)
        setIsTimerActive(true)
      } else {
        setStep('result')
      }
    }, 500)
  }

  const handleTimeUp = () => {
    if (selectedCategory && currentQuestionIndex < selectedCategory.questions.length - 1) {
      setTotalTimeUsed(prev => prev + QUESTION_TIME)
      setAnsweredCount(prev => prev + 1)
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOption(null)
      setTimeLeft(QUESTION_TIME)
      setIsTimerActive(true)
    } else {
      setTotalTimeUsed(prev => prev + QUESTION_TIME)
      setAnsweredCount(prev => prev + 1)
      setStep('result')
      setIsTimerActive(false)
    }
  }

  const handleReset = () => {
    setStep('select')
    setSelectedCategory(null)
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setTimeLeft(QUESTION_TIME)
    setScore(0)
    setTotalCorrect(0)
    setIsTimerActive(false)
    setTotalTimeUsed(0)
    setAnsweredCount(0)
  }

  const getMatchRate = () => {
    if (!selectedCategory) return 0
    return Math.round((totalCorrect / selectedCategory.questions.length) * 100)
  }

  const getMatchText = (rate: number) => {
    if (rate >= 80) return { text: '默契十足', color: 'text-green-600', icon: '❤️' }
    if (rate >= 60) return { text: '心有灵犀', color: 'text-blue-600', icon: '💙' }
    if (rate >= 40) return { text: '还需磨合', color: 'text-amber-600', icon: '💛' }
    return { text: '继续探索', color: 'text-rose-600', icon: '💜' }
  }

  return (
    <View className="min-h-screen pb-20" style={{ backgroundColor: '#F7F8FA' }}>
      {/* 顶部 */}
      <View className="bg-gradient-to-r from-purple-500 to-violet-500 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-2">快速问答</Text>
        <Text className="block text-sm text-gray-200">
          猜猜TA的想法，测试你们的默契
        </Text>
      </View>

      {/* 游戏区域 */}
      <View className="p-4">
        {step === 'select' && (
          <>
            <Text className="block text-sm font-medium text-gray-500 mb-4">选择问题类别</Text>
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Card
                  key={category.id}
                  className="mb-4 overflow-hidden"
                  onClick={() => handleSelectCategory(category)}
                >
                  <View className={`bg-gradient-to-r ${category.color} px-4 py-4`}>
                    <View className="flex flex-row items-center justify-between">
                      <View className="flex flex-row items-center flex-1">
                        <View className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
                          <Icon size={20} color={category.color.split(' ')[0].split('-to-')[0].replace('from-', '')} />
                        </View>
                        <View className="flex-1">
                          <Text className="block text-base font-semibold text-white">
                            {category.name}
                          </Text>
                          <Text className="block text-xs text-gray-200">
                            {category.description}
                          </Text>
                        </View>
                      </View>
                      <View className="flex flex-col items-end">
                        <Text className="text-xs text-gray-200">
                          {category.questions.length} 题
                        </Text>
                        <Text className="text-xs text-gray-300 mt-1">
                          {category.difficulty}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              )
            })}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="py-3">
                <View className="flex flex-row items-start">
                  <Zap size={16} color="#f59e0b" className="mr-2 mt-1 flex-shrink-0" />
                  <Text className="text-xs text-amber-700 leading-relaxed">
                    💡 本游戏需要双方一起玩！一人根据对TA的了解选择答案，另一人揭晓真实想法，看看你们有多默契。每题限时8秒，快速作答获额外加分。
                  </Text>
                </View>
              </CardContent>
            </Card>
          </>
        )}

        {step === 'play' && selectedCategory && (
          <>
            {/* 顶部信息栏 */}
            <View className="bg-white rounded-xl px-4 py-3 mb-4 flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                {(() => {
                  const Icon = selectedCategory.icon
                  return <Icon size={16} color="#a855f7" />
                })()}
                <Text className="text-sm font-medium text-gray-700 ml-2">
                  {selectedCategory.name}
                </Text>
              </View>
              <View className="flex flex-row items-center">
                <Clock size={16} color={timeLeft > 4 ? '#6b7280' : timeLeft > 2 ? '#f59e0b' : '#ef4444'} />
                <Text className={`text-sm font-bold ml-2 ${timeLeft > 4 ? 'text-gray-700' : timeLeft > 2 ? 'text-amber-500' : 'text-red-500'}`}>
                  {timeLeft}s
                </Text>
              </View>
            </View>

            {/* 进度 */}
            <View className="bg-gray-200 rounded-full h-2 mb-4">
              <View
                className={`bg-gradient-to-r ${selectedCategory.color} h-2 rounded-full transition-all`}
                style={{ width: `${((currentQuestionIndex + 1) / selectedCategory.questions.length) * 100}%` }}
              />
            </View>

            {/* 问题卡片 */}
            <Card className="mb-6 border-2 border-purple-200">
              <CardContent className="py-6">
                <View className="flex flex-row items-start">
                  <View className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mr-3 flex-shrink-0">
                    <Text className="text-sm font-bold text-white">
                      {currentQuestionIndex + 1}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900 leading-relaxed">
                      {selectedCategory.questions[currentQuestionIndex].text}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 选项 - 二选一 */}
            <View className="grid grid-cols-2 gap-4 mb-4">
              {selectedCategory.questions[currentQuestionIndex].options.map((option, index) => (
                <Card
                  key={index}
                  className={`border-2 cursor-pointer ${
                    selectedOption === index
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 active:bg-gray-50'
                  }`}
                  onClick={() => handleSelectOption(index)}
                >
                  <CardContent className="py-5">
                    <Text
                      className={`text-base font-medium text-center ${
                        selectedOption === index ? 'text-purple-700' : 'text-gray-700'
                      }`}
                    >
                      {option}
                    </Text>
                  </CardContent>
                </Card>
              ))}
            </View>

            {/* 倒计时提示 */}
            {timeLeft <= 3 && selectedOption === null && (
              <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                <View className="flex flex-row items-center justify-center">
                  <Clock size={16} color="#ef4444" />
                  <Text className="text-sm font-medium text-red-600 ml-2">
                    快！还有 {timeLeft} 秒！
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {step === 'result' && selectedCategory && (
          <>
            {/* 结果卡片 */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100 mb-4">
              <CardContent className="py-6">
                <View className="flex flex-col items-center">
                  <View className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                    <Zap size={40} color="#a855f7" />
                  </View>
                  <Text className="block text-lg font-semibold text-gray-900 mb-2">
                    挑战完成！
                  </Text>
                  <View className="flex flex-row items-center mb-4">
                    <Text className="text-2xl mr-2">{getMatchText(getMatchRate()).icon}</Text>
                    <Text
                      className={`text-lg font-semibold ${getMatchText(getMatchRate()).color}`}
                    >
                      {getMatchText(getMatchRate()).text}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 统计数据 */}
            <View className="grid grid-cols-2 gap-4 mb-4">
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">答对题数</Text>
                  <Text className="block text-2xl font-bold text-purple-600">
                    {totalCorrect} / {selectedCategory.questions.length}
                  </Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">默契度</Text>
                  <Text className="block text-2xl font-bold text-purple-600">{getMatchRate()}%</Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">总得分</Text>
                  <Text className="block text-2xl font-bold text-purple-600">{score}</Text>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <Text className="block text-xs text-gray-500 mb-1">平均反应时间</Text>
                  <Text className="block text-2xl font-bold text-purple-600">
                    {answeredCount > 0 ? (totalTimeUsed / answeredCount).toFixed(1) : '0'}s
                  </Text>
                </CardContent>
              </Card>
            </View>

            {/* 建议 */}
            <Card className="mb-4">
              <CardContent className="py-4">
                <View className="flex flex-row items-start">
                  <Star size={16} color="#f59e0b" className="mr-2 mt-1 flex-shrink-0" />
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">小贴士</Text>
                    <Text className="text-sm text-gray-700 leading-relaxed">
                      {getMatchRate() >= 80
                        ? '你们的默契度超棒！很多想法都不谋而合，继续珍惜这份心有灵犀。'
                        : getMatchRate() >= 60
                          ? '你们已经很有默契了！再多聊聊彼此的想法，默契度还会提升。'
                          : getMatchRate() >= 40
                            ? '你们还有很多想法不一致的地方，这正是了解彼此的好机会！'
                            : '差异也是一种魅力！多聊聊彼此的想法，发现更多共同点。'}
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
                <Text className="ml-2">选择其他类别</Text>
              </View>
            </Button>
          </>
        )}
      </View>

      {/* 底部提示 */}
      <View className="bg-white border-t px-4 py-3 mt-4">
        <View className="flex flex-row items-center">
          <Zap size={16} color="#a855f7" />
          <Text className="block text-xs text-gray-500 ml-2">
            提示：每题限时8秒，快速选择获额外加分，看看你们有多默契
          </Text>
        </View>
      </View>
    </View>
  )
}

export default QuickPage
