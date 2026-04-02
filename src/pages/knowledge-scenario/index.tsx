import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { useState } from 'react'
import CustomHeader from '@/components/custom-header'
import { ChevronDown, ChevronUp, X, Check, Users, Coffee, Heart, MessageCircle, Shield, Lock, Command, ArrowRightLeft, Cat, Anchor, Scale } from 'lucide-react-taro'

interface DialogueCase {
  id: string
  scene: string
  context: string
  taSays: string
  wrongReply: string
  rightReply: string
  analysis: string
}

interface Scenario {
  id: string
  title: string
  description: string
  icon: typeof Users
  color: string
  bgColor: string
  cases: DialogueCase[]
}

const scenarios: Scenario[] = [
  {
    id: 'blind-date',
    title: '相亲场景',
    description: '初次见面，如何留下好印象',
    icon: Users,
    color: '#EC4899',
    bgColor: 'bg-pink-50',
    cases: [
      {
        id: 'bd-1',
        scene: '餐厅见面 - 点菜环节',
        context: '你们刚坐下，服务员递来菜单',
        taSays: '你想吃什么？我都可以。',
        wrongReply: '那吃火锅吧。',
        rightReply: '我看这家日料评价不错，环境也安静适合聊天。你喜欢日料吗？如果不喜欢，附近还有家西餐也不错。',
        analysis: '给选择但不过度主导，同时给对方拒绝的空间，体现尊重。',
      },
      {
        id: 'bd-2',
        scene: '聊天冷场',
        context: '话题聊完了，空气突然安静',
        taSays: '......（低头喝水）',
        wrongReply: '呃......（跟着沉默）',
        rightReply: '对了，我听说你平时喜欢旅游？最近有没有想去的地方？',
        analysis: '提前准备话题清单，从对方朋友圈或介绍人处了解兴趣爱好，关键时刻救场。',
      },
      {
        id: 'bd-3',
        scene: '结账环节',
        context: '饭吃完了，服务员拿来账单',
        taSays: '要不AA吧？',
        wrongReply: '行，那我们各付各的。',
        rightReply: '没关系，我来就好。下次你请我喝奶茶？',
        analysis: '大方买单但不强行，给对方"下次请你"的机会，创造后续互动的借口。',
      },
    ],
  },
  {
    id: 'first-date',
    title: '首次约会',
    description: '从陌生到熟悉的破冰之旅',
    icon: Coffee,
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
    cases: [
      {
        id: 'fd-1',
        scene: '约会地点选择',
        context: '你在微信上约对方出来',
        taSays: '周六有空，你想去哪？',
        wrongReply: '都行，你定吧。',
        rightReply: '我看最近有个展/电影挺有意思的（发链接），你觉得怎么样？或者你有其他想去的也可以说。',
        analysis: '提前做功课，给出具体选项，同时保留对方选择的自由。',
      },
      {
        id: 'fd-2',
        scene: '见面时的紧张',
        context: '你提前到了，对方刚走过来',
        taSays: '来很久了吗？',
        wrongReply: '没有没有，我也刚到。（其实等了20分钟）',
        rightReply: '刚到一小会儿。你今天穿得真好看。',
        analysis: '善意的谎言可以，但别太夸张。第一时间给对方正面反馈，缓解紧张。',
      },
      {
        id: 'fd-3',
        scene: '约会结束',
        context: '一天约会结束，准备各自回家',
        taSays: '今天很开心，谢谢你。',
        wrongReply: '我也是，那拜拜。',
        rightReply: '我也很开心。到家了跟我说一声？',
        analysis: '约会结束不是终点，留一个"到家联系"的钩子，延续互动。',
      },
    ],
  },
  {
    id: 'daily-chat',
    title: '日常聊天',
    description: '维持热度的沟通技巧',
    icon: MessageCircle,
    color: '#3B82F6',
    bgColor: 'bg-blue-50',
    cases: [
      {
        id: 'dc-1',
        scene: '对方分享日常',
        context: '对方发了一张午餐照片',
        taSays: '今天吃的这个，还不错~',
        wrongReply: '看着挺好吃的。',
        rightReply: '哇这个看起来很诱人！是哪家店呀？我也想去试试。你今天工作忙吗？',
        analysis: '不要只评价，要延伸话题。追问细节 + 关心对方状态，让对话继续。',
      },
      {
        id: 'dc-2',
        scene: '对方吐槽工作',
        context: '对方发来抱怨',
        taSays: '今天领导又骂我，烦死了。',
        wrongReply: '别太在意，好好工作就行。',
        rightReply: '怎么回事？是领导的问题还是...？说出来我帮你分析分析。',
        analysis: '先站队，再了解情况。不要急着给建议，先让对方发泄。',
      },
      {
        id: 'dc-3',
        scene: '聊天气氛变冷',
        context: '对话变得简短敷衍',
        taSays: '嗯。/ 哦。/ 好的。',
        wrongReply: '（继续发消息）你在干嘛？',
        rightReply: '感觉你今天有点累？要不先休息，明天再聊？',
        analysis: '识别对方的"想结束"信号，主动收尾比硬聊更好。留下"明天再聊"的约定。',
      },
    ],
  },
  {
    id: 'relationship-progress',
    title: '关系推进',
    description: '如何让关系更进一步',
    icon: Heart,
    color: '#EF4444',
    bgColor: 'bg-red-50',
    cases: [
      {
        id: 'rp-1',
        scene: '试探对方态度',
        context: '你们已经聊了一段时间',
        taSays: '周末有什么安排？',
        wrongReply: '没什么安排，在家躺着。',
        rightReply: '暂时没安排，怎么，想约我？（偷笑表情）',
        analysis: '把普通问题变成暧昧互动，用玩笑试探对方反应。',
      },
      {
        id: 'rp-2',
        scene: '对方提起前任',
        context: '聊天中提到感情话题',
        taSays: '我之前谈过一个，后来分了...',
        wrongReply: '为什么分了？',
        rightReply: '（认真听）...过去的事就让它过去吧。我觉得你现在挺好的。',
        analysis: '不要追问细节，不要评价。表达"我在乎的是现在的你"。',
      },
      {
        id: 'rp-3',
        scene: '表白时机',
        context: '你们已经频繁互动一段时间',
        taSays: '（发来暧昧表情或话题）',
        wrongReply: '我喜欢你，做我对象吧。',
        rightReply: '我最近发现一件事......我好像习惯了每天和你聊天。你呢？',
        analysis: '不要突兀表白，先表达依赖感，观察对方反应。对方回应积极再进一步。',
      },
    ],
  },
  {
    id: 'shit-test',
    title: '废物测试',
    description: '识别并正确应对对方的心理测试',
    icon: Shield,
    color: '#8B5CF6',
    bgColor: 'bg-violet-50',
    cases: [
      {
        id: 'st-1',
        scene: '贬低型测试',
        context: '刚认识不久，对方突然说了一句带刺的话',
        taSays: '你条件一般啊，怎么敢来相亲的？',
        wrongReply: '我确实不太优秀，但我会努力的...',
        rightReply: '条件一般？那看来我得靠人格魅力取胜了。（笑）你条件这么好，看上我什么了？',
        analysis: '不要自卑解释，也不要愤怒反击。用幽默化解，同时反问把球踢回去。',
      },
      {
        id: 'st-2',
        scene: '服从型测试',
        context: '刚认识不久，对方让你做这做那',
        taSays: '你去帮我买杯奶茶吧，要半糖少冰。',
        wrongReply: '好的，我这就去。（屁颠屁颠去买）',
        rightReply: '可以啊，但咱们还不熟吧？要不这样，你请我吃饭，我请奶茶，扯平。',
        analysis: '不要无条件服从，也不要生硬拒绝。用"交换"的方式建立平等关系。',
      },
      {
        id: 'st-3',
        scene: '否定型测试',
        context: '对方对你的某个特征提出质疑',
        taSays: '你太矮了，我前男友180。',
        wrongReply: '矮怎么了？矮也有矮的好处...（开始辩解）',
        rightReply: '确实不高，不过我站得稳啊。话说你多高？咱俩站一起会不会很萌？',
        analysis: '坦然接受自己的"缺点"，不要辩解。把话题转向两人之间的互动，而不是单独讨论自己。',
      },
      {
        id: 'st-4',
        scene: '嫉妒型测试',
        context: '对方故意提其他异性',
        taSays: '刚才那个人一直盯着我看，烦死了。',
        wrongReply: '谁啊？我去找他！（激动）',
        rightReply: '正常，你这么好看被看很正常。不过你告诉我这个是想让我吃醋吗？（偷笑）',
        analysis: '不要表现出过度吃醋或愤怒，那显得你很没安全感。轻松调侃，反而显得自信。',
      },
      {
        id: 'st-5',
        scene: '考验型测试',
        context: '对方问一些敏感问题',
        taSays: '你是不是只想要我身体？',
        wrongReply: '没有！我是真心喜欢你的！',
        rightReply: '身体是加分项，但不是全部。如果只是想要身体，我不会花这么多时间陪你聊天。',
        analysis: '不要急着否认，也不要被带入"自证陷阱"。坦诚但有底线，反而更可信。',
      },
    ],
  },
  {
    id: 'compliance-test',
    title: '服从性测试',
    description: '识别并应对对方的各种试探',
    icon: Command,
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
    cases: [
      {
        id: 'ct-1',
        scene: '小事试探',
        context: '刚认识不久，对方让你做一件小事',
        taSays: '你帮我把外套拿着吧。',
        wrongReply: '好的。（乖乖拿着）',
        rightReply: '行啊，不过你得请我喝杯奶茶作为回报。（笑）',
        analysis: '不要无条件服从。用"交换"的方式建立平等关系，让她知道你的付出是有价值的。',
      },
      {
        id: 'ct-2',
        scene: '时间试探',
        context: '对方让你等待或改变时间',
        taSays: '我临时有事，你等我一个小时吧。',
        wrongReply: '没关系，我等你。（傻等一小时）',
        rightReply: '一个小时有点久啊。要不你先忙，改天再约？我也不是闲着没事干的人。',
        analysis: '不要让你的时间显得廉价。展示你有自己的生活，不是随时待命的。',
      },
      {
        id: 'ct-3',
        scene: '金钱试探',
        context: '刚认识就让你花钱',
        taSays: '我想买个包，你送我吧~',
        wrongReply: '好啊，多少钱？（准备掏钱）',
        rightReply: '这个包挺好看的。不过咱们刚认识，我送礼物的标准是确定关系后。等你成为我女朋友再说？（笑）',
        analysis: '不要当提款机。用幽默的方式设置边界，同时把话题引向"确定关系"。',
      },
      {
        id: 'ct-4',
        scene: '情绪试探',
        context: '对方无故发脾气，看你反应',
        taSays: '（突然冷淡）没事，我没事，你别管我。',
        wrongReply: '怎么了？是不是我做错什么了？你告诉我啊！（急切讨好）',
        rightReply: '感觉你今天心情不太好。我先不打扰你了，你想聊的时候再说。',
        analysis: '不要被她的情绪牵着走。展示你的情绪稳定性，不当情绪垃圾桶。',
      },
      {
        id: 'ct-5',
        scene: '社交试探',
        context: '让你在朋友面前做某事',
        taSays: '当着我朋友的面，说你喜欢我。',
        wrongReply: '（尴尬）我...我喜欢你...',
        rightReply: '喜欢是要看表现的，不是嘴上说说的。你朋友在场，我得表现得矜持一点。（笑）',
        analysis: '不要被当众"逼供"。用幽默化解尴尬，同时保持自己的框架。',
      },
      {
        id: 'ct-6',
        scene: '底线试探',
        context: '对方提出不合理要求',
        taSays: '你把你手机密码告诉我吧。',
        wrongReply: '好啊，是xxxxxx。',
        rightReply: '这可不行，我手机里都是商业机密。（笑）不过你要是想知道我在跟谁聊天，我可以当面给你看。',
        analysis: '保护隐私边界。用幽默拒绝不合理要求，同时提供替代方案展示坦诚。',
      },
    ],
  },
  {
    id: 'anti-slut-defense',
    title: '反荡妇机制',
    description: '识别并化解对方的防御心理',
    icon: Lock,
    color: '#EC4899',
    bgColor: 'bg-pink-50',
    cases: [
      {
        id: 'asd-1',
        scene: '事后合理化',
        context: '亲密接触后，对方开始表现出不安',
        taSays: '我平时不是这样的，真的，我不太随便...',
        wrongReply: '嗯，我知道。（沉默）',
        rightReply: '我知道，你是被我的人格魅力迷住了，不怪你。（笑）而且咱们这样挺好的，不是吗？',
        analysis: '帮她"合理化"行为，让她觉得这不是她的"本性"，而是被你吸引的"意外"。不要让她陷入自我否定。',
      },
      {
        id: 'asd-2',
        scene: '进度过快',
        context: '你们进展很快，对方突然刹车',
        taSays: '我们是不是太快了？我还没准备好...',
        wrongReply: '没事，不急。（然后继续推进）',
        rightReply: '快不快是别人的标准。我觉得跟你在一切都很自然，像认识很久一样。你呢？你觉得舒服吗？',
        analysis: '不要被动后退，也不要硬推。帮她重新定义"快"——重要的是两人的感觉，而不是时间长短。把判断权交给她。',
      },
      {
        id: 'asd-3',
        scene: '担心被评判',
        context: '对方担心自己的行为会被看轻',
        taSays: '你会不会觉得我很轻浮？',
        wrongReply: '不会啊，这有什么。',
        rightReply: '轻浮？你明明是喜欢我才这样的。我能感受到你的认真，怎么会这么想？',
        analysis: '不要敷衍否认，要把她的行为重新定义为"因为喜欢你"，让她感到被尊重和重视。',
      },
      {
        id: 'asd-4',
        scene: '酒精借口',
        context: '借助酒精做了亲密的事，第二天',
        taSays: '昨晚喝多了，什么都不记得了...',
        wrongReply: '你喝多了？不是吧，你明明很清醒。',
        rightReply: '是吗？那你可能忘了，昨晚你拉着我不让走，说舍不得我。（笑）下次我少让你喝点。',
        analysis: '不要拆穿她的"借口"，给她留台阶。把重点放在"她很主动"的正面描述上，让她感到被珍视。',
      },
      {
        id: 'asd-5',
        scene: '朋友面前装矜持',
        context: '在朋友面前刻意保持距离',
        taSays: '（当着朋友的面）我们就是普通朋友啦~',
        wrongReply: '（一脸尴尬）啊...对...',
        rightReply: '（自然配合）对，朋友。不过我是那种很专一的朋友。（微笑看她）',
        analysis: '不要在朋友面前让她难堪。配合她的"表演"，但留一个暧昧的小尾巴，私下再确认关系。',
      },
      {
        id: 'asd-6',
        scene: '提前预防',
        context: '约会开始前，对方先声明',
        taSays: '说好哦，今天只能聊天，不能做别的。',
        wrongReply: '放心，我对那种事没兴趣。',
        rightReply: '好，今天只聊天。不过我得先说好，我可能会忍不住夸你好看，这个不算犯规吧？',
        analysis: '接受她的边界，但不要刻意装作"无欲无求"。坦诚表达欣赏，反而让她更放松。',
      },
    ],
  },
  {
    id: 'push-pull',
    title: '推拉',
    description: '制造情绪起伏，增加吸引力',
    icon: ArrowRightLeft,
    color: '#06B6D4',
    bgColor: 'bg-cyan-50',
    cases: [
      {
        id: 'pp-1',
        scene: '夸奖后拉远',
        context: '对方做了让你欣赏的事',
        taSays: '（发来一张好看的照片）',
        wrongReply: '太好看了！你真漂亮！',
        rightReply: '这张照片拍得不错......不过我觉得上次那张更自然。',
        analysis: '先给肯定，再给小否定。让她在想"到底哪里不够好"，产生想要证明自己的冲动。',
      },
      {
        id: 'pp-2',
        scene: '冷淡后回暖',
        context: '之前聊得很好，突然变得冷淡',
        taSays: '你怎么不理我了？',
        wrongReply: '抱歉抱歉，我最近太忙了！（急忙解释）',
        rightReply: '没啊，就是在想，咱们聊得这么开心，会不会太快了。我想慢一点了解你。',
        analysis: '用"思考关系"作为冷淡的理由，让她感到被重视，而不是被忽略。',
      },
      {
        id: 'pp-3',
        scene: '欲擒故纵',
        context: '对方表现得很主动',
        taSays: '周末有空吗？想约你出来。',
        wrongReply: '有空有空！去哪里？',
        rightReply: '周末啊......让我想想。（停顿）行，不过我得先确认下工作安排。周五告诉你？',
        analysis: '不要秒答应。让她等待，展示你的时间不是随叫随到的，增加你的价值感。',
      },
      {
        id: 'pp-4',
        scene: '调侃式拒绝',
        context: '对方提出邀约或请求',
        taSays: '你什么时候请我吃饭呀？',
        wrongReply: '随时都可以！你想吃什么？',
        rightReply: '你这么主动约我，会让我觉得你很缺朋友。（笑）不过看在你这么诚恳的份上，下周吧。',
        analysis: '先调侃她"太主动"，降低她的姿态，再答应。让她感到你是在"赏脸"，而不是迫不及待。',
      },
      {
        id: 'pp-5',
        scene: '肯定后质疑',
        context: '对方分享自己的成就',
        taSays: '我这次考试考了第一名！',
        wrongReply: '太厉害了！你真棒！',
        rightReply: '第一名啊......厉害是厉害，不过你是不是没怎么睡觉？看着有点憔悴。',
        analysis: '肯定她的成就，但把关注点转移到她的状态上。让她感到你关心的是她这个人，而不是她的成绩。',
      },
      {
        id: 'pp-6',
        scene: '近推远拉',
        context: '关系暧昧时',
        taSays: '你觉得我怎么样？',
        wrongReply: '你很好啊，我很喜欢你。',
        rightReply: '怎么说呢......（认真看她）你有时候很可爱，有时候又挺烦人的。这种反差还挺好玩的。',
        analysis: '不要只给正面评价。用"可爱+烦人"的反差，让她想"我哪里烦人了"，增加互动张力。',
      },
    ],
  },
  {
    id: 'cat-string',
    title: '猫绳理论',
    description: '让她主动追逐你，而不是你追她',
    icon: Cat,
    color: '#F97316',
    bgColor: 'bg-orange-50',
    cases: [
      {
        id: 'cs-1',
        scene: '展示价值不主动',
        context: '你想让她注意到你',
        taSays: '（看到你的朋友圈/动态）',
        wrongReply: '（主动私信）看到你点赞了，在干嘛呢？',
        rightReply: '（发一条精彩的朋友圈，但不主动联系她）',
        analysis: '像逗猫一样，在她面前晃动"精彩生活"这根绳子，但不主动递过去。让她好奇、让她主动靠近你。',
      },
      {
        id: 'cs-2',
        scene: '给甜头就收回',
        context: '聊天聊得很开心时',
        taSays: '哈哈你太逗了！',
        wrongReply: '是吧？我还好多故事呢，我跟你说......（继续聊）',
        rightReply: '哈哈，说起来还有更有意思的......哎呀，我得先去处理个事，回头再聊。',
        analysis: '在最高潮时主动结束。让她意犹未尽，期待下次聊天。不要一次性把所有有趣的东西都展示完。',
      },
      {
        id: 'cs-3',
        scene: '让她追着你',
        context: '你想约她出来',
        taSays: '（没有主动联系你）',
        wrongReply: '周末有空吗？我想约你。',
        rightReply: '（发一条：在某个好玩的地方的照片）今天这地方不错，下次带你来。',
        analysis: '不要直接约，而是展示"带你去"的可能性。这根绳子在她面前晃，她如果想抓，会主动问你"什么时候带我去"。',
      },
      {
        id: 'cs-4',
        scene: '间歇性奖励',
        context: '回复消息的节奏',
        taSays: '你又在干嘛呢？',
        wrongReply: '没干嘛，你呢？（秒回）',
        rightReply: '（有时秒回，有时隔半小时，有时隔两小时）',
        analysis: '像老虎机一样，不规则的奖励最能让人上瘾。如果每次都秒回，你的关注就变得廉价了。',
      },
      {
        id: 'cs-5',
        scene: '悬念钩子',
        context: '你想分享一个有趣的事',
        taSays: '你今天过得怎么样？',
        wrongReply: '挺好的，今天去了一个新餐厅，味道不错。',
        rightReply: '今天发生了一件超离谱的事......算了，有点长，改天见面再说。',
        analysis: '说一半留一半。让她追问"什么事啊快说"，制造悬念和期待。见面的理由也自然有了。',
      },
      {
        id: 'cs-6',
        scene: '制造稀缺感',
        context: '她想约你但你有空',
        taSays: '周末出来玩吧？',
        wrongReply: '好啊，周六周日都可以！',
        rightReply: '周六不行，有安排了。周日......让我看看，（停顿）行，周日下午吧，不过我只能出来3小时，晚上还有事。',
        analysis: '即使有空，也不要表现得太闲。让她觉得你的时间是稀缺的、珍贵的，她才会更珍惜和你在一起的机会。',
      },
    ],
  },
  {
    id: 'anchoring',
    title: '心锚',
    description: '建立情绪触发器，让她时时想起你',
    icon: Anchor,
    color: '#6366F1',
    bgColor: 'bg-indigo-50',
    cases: [
      {
        id: 'an-1',
        scene: '词语心锚',
        context: '你们有一个特别的称呼或词语',
        taSays: '你在干嘛呢？',
        wrongReply: '在加班，你呢？',
        rightReply: '小笨蛋，我在想你啊。（"小笨蛋"成为专属称呼）',
        analysis: '创造一个只属于你们俩的称呼或词语。以后她每次听到这个词，都会条件反射地想到你。',
      },
      {
        id: 'an-2',
        scene: '场景心锚',
        context: '一起去过某个特别的地方',
        taSays: '这地方真不错。',
        wrongReply: '是吧，下次再来。',
        rightReply: '以后你每次来这儿，都会想起今天和我在一块儿。（笑）这可是我们的地盘了。',
        analysis: '把特定的地点和你们的回忆绑定。以后她经过这里，或者看到类似的地方，就会想起你。',
      },
      {
        id: 'an-3',
        scene: '歌曲心锚',
        context: '一起听到某首歌',
        taSays: '这首歌好好听。',
        wrongReply: '嗯，挺不错的。',
        rightReply: '以后这就是我们的歌了。你每次听到，都得想我一下。',
        analysis: '把一首歌变成"我们的歌"。以后她在任何地方听到这首歌，都会不自觉地想起你。',
      },
      {
        id: 'an-4',
        scene: '动作心锚',
        context: '聊天时做一个特定的小动作',
        taSays: '哈哈你太逗了。',
        wrongReply: '是吧是吧。',
        rightReply: '（每次她笑的时候，你轻轻点一下她的额头）以后我一做这个动作，你就会想起今天开心的时候。',
        analysis: '用特定的动作和她的积极情绪绑定。重复几次后，这个动作本身就成了一种情绪触发器。',
      },
      {
        id: 'an-5',
        scene: '气味心锚',
        context: '你用了某个特别的香水',
        taSays: '你身上什么味道？挺好闻的。',
        wrongReply: '哦，随便喷的香水。',
        rightReply: '这是我的专属味道。以后你闻到这个味道，就知道我在附近了。',
        analysis: '气味是最强的记忆触发器。固定用一款香水，让她把你的气味和你本人绑定。',
      },
      {
        id: 'an-6',
        scene: '情绪心锚',
        context: '她情绪低落时你在身边',
        taSays: '今天好难过......',
        wrongReply: '别难过了，会好起来的。',
        rightReply: '（认真倾听、陪伴）以后你难过的时候，就想起还有我在。我会一直在的。',
        analysis: '在她最脆弱的时候给予陪伴和支持。以后她遇到困难，第一时间想到的就是你。',
      },
      {
        id: 'an-7',
        scene: '触觉心锚',
        context: '特定的触摸方式',
        taSays: '（走在一起）',
        wrongReply: '（没有肢体接触）',
        rightReply: '（每次牵手时，你用拇指轻轻摩挲她的手背）记住这个感觉，这是我对你的专属密码。',
        analysis: '用特定的触摸方式和安全感、亲密感绑定。重复之后，这个小动作本身就成了一种暗号。',
      },
    ],
  },
  {
    id: 'consistency',
    title: '一致性',
    description: '利用她对自己形象的认同，引导行为',
    icon: Scale,
    color: '#14B8A6',
    bgColor: 'bg-teal-50',
    cases: [
      {
        id: 'con-1',
        scene: '贴标签法',
        context: '你想让她做某件事',
        taSays: '（没有主动联系你）',
        wrongReply: '你怎么都不主动找我？（抱怨）',
        rightReply: '我一直觉得你是个很有主动性的女生，不会像其他女生那样等着男生来追。',
        analysis: '先给她贴一个积极的标签（"有主动性"），她会倾向于用行动证明这个标签是对的。',
      },
      {
        id: 'con-2',
        scene: '小承诺引导',
        context: '你想约她出来',
        taSays: '最近忙死了。',
        wrongReply: '那等你空了再说吧。',
        rightReply: '忙归忙，但你应该不会是那种因为工作就放弃生活的人吧？周末出来放松一下？',
        analysis: '暗示她"不是那种放弃生活的人"，她会为了证明自己确实不是，而答应你的邀约。',
      },
      {
        id: 'con-3',
        scene: '强化过去行为',
        context: '她之前做过类似的事',
        taSays: '不知道穿什么去约会。',
        wrongReply: '随便穿就行。',
        rightReply: '上次你穿那条白裙子就很好看，你的眼光一直很在线的。',
        analysis: '用她过去的好选择来强化"你眼光很好"这个标签，她会继续做出好的选择。',
      },
      {
        id: 'con-4',
        scene: '公开承诺',
        context: '在朋友面前让她表态',
        taSays: '（朋友问你们的关系）',
        wrongReply: '（替她回答）我们就是朋友。',
        rightReply: '（让她自己说）你觉得呢？上次不是说好下周一起去看电影吗？',
        analysis: '在公开场合让她确认承诺，她会为了保持"言行一致"的形象而更认真地对待。',
      },
      {
        id: 'con-5',
        scene: '身份认同',
        context: '你想让她表现得更亲密',
        taSays: '（行为有点冷淡）',
        wrongReply: '你能不能热情一点？（要求）',
        rightReply: '我印象中的你是个很懂得关心人的女生，对在乎的人都很好。',
        analysis: '唤起她对自己的正面认同，她会用行动来证明"我就是那样的人"。',
      },
      {
        id: 'con-6',
        scene: '逆向一致性',
        context: '她想放弃时',
        taSays: '我觉得我们不合适。',
        wrongReply: '为什么不？我们明明挺好的！',
        rightReply: '你当初选择和我见面，是因为你觉得值得了解我。那个判断力，应该不会错吧？',
        analysis: '提醒她过去的选择是有道理的，让她为了"自己的判断没错"而继续下去。',
      },
    ],
  },
]

const KnowledgeScenarioPage: FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null)

  useLoad(() => {
    console.log('Knowledge scenario page loaded.')
  })

  const toggleScenario = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
    setExpandedCaseId(null)
  }

  const toggleCase = (id: string) => {
    setExpandedCaseId(expandedCaseId === id ? null : id)
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <CustomHeader title="场景演练" />

      {/* 说明 */}
      <View className="px-4 py-4 bg-white border-b border-gray-100">
        <Text className="block text-sm text-gray-600">
          真实对话案例，告诉你什么该说、什么不该说
        </Text>
      </View>

      {/* 场景列表 */}
      <View className="p-4">
        {scenarios.map((scenario) => {
          const ScenarioIcon = scenario.icon
          const isExpanded = expandedId === scenario.id
          
          return (
            <View
              key={scenario.id}
              className="bg-white rounded-2xl mb-3 overflow-hidden"
            >
              {/* 场景标题 */}
              <View
                className="p-4 flex items-center justify-between"
                onClick={() => toggleScenario(scenario.id)}
              >
                <View className="flex items-center gap-3">
                  <View className={`w-10 h-10 ${scenario.bgColor} rounded-xl flex items-center justify-center`}>
                    <ScenarioIcon size={20} color={scenario.color} />
                  </View>
                  <View>
                    <Text className="block text-base font-semibold text-gray-900">
                      {scenario.title}
                    </Text>
                    <Text className="block text-xs text-gray-500 mt-1">
                      {scenario.description} · {scenario.cases.length}个案例
                    </Text>
                  </View>
                </View>
                {isExpanded ? (
                  <ChevronUp size={18} color="#9CA3AF" />
                ) : (
                  <ChevronDown size={18} color="#9CA3AF" />
                )}
              </View>

              {/* 展开的案例列表 */}
              {isExpanded && (
                <View className="px-4 pb-4">
                  {scenario.cases.map((dialogueCase, index) => {
                    const isCaseExpanded = expandedCaseId === dialogueCase.id
                    
                    return (
                      <View key={dialogueCase.id} className="mb-3 last:mb-0">
                        {/* 案例标题 */}
                        <View
                          className="bg-gray-50 rounded-xl p-3"
                          onClick={() => toggleCase(dialogueCase.id)}
                        >
                          <View className="flex items-center justify-between">
                            <View className="flex items-center gap-2">
                              <View className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                <Text className="block text-xs text-gray-500">{index + 1}</Text>
                              </View>
                              <Text className="block text-sm font-medium text-gray-800">
                                {dialogueCase.scene}
                              </Text>
                            </View>
                            {isCaseExpanded ? (
                              <ChevronUp size={14} color="#9CA3AF" />
                            ) : (
                              <ChevronDown size={14} color="#9CA3AF" />
                            )}
                          </View>
                          
                          {!isCaseExpanded && (
                            <Text className="block text-xs text-gray-500 mt-2 ml-8">
                              {dialogueCase.context}
                            </Text>
                          )}
                        </View>

                        {/* 展开的案例详情 */}
                        {isCaseExpanded && (
                          <View className="bg-gray-50 rounded-xl p-4 mt-2">
                            {/* 场景背景 */}
                            <Text className="block text-xs text-gray-500 mb-3">
                              📍 {dialogueCase.context}
                            </Text>

                            {/* 对话 */}
                            <View className="mb-4">
                              <View className="flex items-start gap-2 mb-3">
                                <View className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                                  <Text className="block text-xs text-pink-600">TA</Text>
                                </View>
                                <View className="flex-1 bg-white rounded-xl rounded-tl-sm p-3">
                                  <Text className="block text-sm text-gray-800">{dialogueCase.taSays}</Text>
                                </View>
                              </View>
                            </View>

                            {/* 错误回复 */}
                            <View className="mb-3">
                              <View className="flex items-center gap-1 mb-2">
                                <X size={14} color="#EF4444" />
                                <Text className="block text-xs font-medium text-red-500">错误回复</Text>
                              </View>
                              <View className="bg-red-50 rounded-xl p-3 border border-red-100">
                                <Text className="block text-sm text-gray-700">{dialogueCase.wrongReply}</Text>
                              </View>
                            </View>

                            {/* 正确回复 */}
                            <View className="mb-3">
                              <View className="flex items-center gap-1 mb-2">
                                <Check size={14} color="#10B981" />
                                <Text className="block text-xs font-medium text-green-600">正确回复</Text>
                              </View>
                              <View className="bg-green-50 rounded-xl p-3 border border-green-100">
                                <Text className="block text-sm text-gray-700">{dialogueCase.rightReply}</Text>
                              </View>
                            </View>

                            {/* 解析 */}
                            <View className="bg-white rounded-xl p-3">
                              <Text className="block text-xs font-medium text-gray-500 mb-1">💡 解析</Text>
                              <Text className="block text-sm text-gray-700">{dialogueCase.analysis}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          )
        })}
      </View>

      {/* 提示 */}
      <View className="px-4 pb-6">
        <Text className="block text-xs text-gray-400 text-center">
          更多场景演练内容持续更新中...
        </Text>
      </View>
    </View>
  )
}

export default KnowledgeScenarioPage
