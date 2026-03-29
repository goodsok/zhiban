import { Injectable, Inject, forwardRef } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { TaskService } from '../task/task.service'

// 印象标签映射
const impressionTagLabels: Record<string, string> = {
  nice: '性格好',
  pretty: '颜值高',
  smart: '聪明',
  funny: '幽默',
  gentle: '温柔',
  ambitious: '有上进心',
  independent: '独立',
  thoughtful: '细心体贴',
}

// 见面场景映射
const meetingSceneLabels: Record<string, string> = {
  blind_date: '相亲',
  pickup: '搭讪',
  app_meetup: 'App线下见面',
  party: '聚会社交',
  workplace: '职场',
  school: '学校',
  activity: '兴趣活动',
  other: '其他',
}

// 关系阶段映射
const relationshipStageLabels: Record<string, string> = {
  new: '刚认识',
  contacting: '接触中',
  dating: '约会中',
  progressing: '发展中',
}

// 互动状态映射
const interactionStatusLabels: Record<string, string> = {
  just_met: '只有一面之缘',
  got_contact: '拿到了联系方式',
  chatted: '聊过几次天',
  good_vibe: '聊天氛围不错',
  met_up: '约出来见过面',
  dating_regularly: '正在稳定约会',
  ambiguous: '暧昧期',
  confirming: '准备确认关系',
}

// 关键信息接口（兼容旧数据）
export interface KeyInfo {
  id: string
  type: string
  label: string
  icon: string
  value: string
}

// 硬件信息（外在/固定属性）
export interface HardwareInfo {
  // 基本信息
  age?: number              // 年龄
  height?: string           // 身高
  birthday?: string         // 生日
  zodiac?: string           // 星座
  bloodType?: string        // 血型
  // 外貌特征
  bodyType?: string         // 体型
  style?: string            // 穿搭风格
  // 联系方式
  wechat?: string           // 微信
  phone?: string            // 电话
  location?: string         // 所在地
  // 职业信息
  occupation?: string       // 职业
  company?: string          // 公司
  position?: string         // 职位
}

// 软件信息（内在/需探索）
export interface SoftwareInfo {
  // 性格特质
  mbti?: string             // MBTI
  personality?: string      // 性格描述
  emotionalStyle?: string   // 情绪特点
  // 兴趣爱好
  interests?: string[]      // 兴趣标签
  hobbies?: string          // 具体爱好描述
  // 行为习惯
  schedule?: string         // 作息
  spendingStyle?: string    // 消费风格
  communicationStyle?: string // 沟通方式
  // 情感需求
  likes?: string            // 喜欢什么
  dislikes?: string         // 讨厌什么
  loveExpectation?: string  // 恋爱期待
  dealBreakers?: string     // 雷区/底线
}

export interface Match {
  id: number
  name: string
  gender: string
  // 硬件信息
  hardware: HardwareInfo
  // 软件信息
  software: SoftwareInfo
  // 认识场景
  meetingScene: string
  meetingDate: string
  // 关系状态
  relationshipStage: string
  interactionStatus: string
  // 印象
  impression: number
  impressionTags: string[]
  // 兼容旧数据
  keyInfo: KeyInfo[]
  // 备注
  notes: string
  // 状态
  status: string
  nextAction: string
  lastContact: string
  createdAt: Date
}

@Injectable()
export class MatchService {
  constructor(
    @Inject(forwardRef(() => TaskService))
    private readonly taskService: TaskService,
  ) {}

  // 模拟数据存储
  private matches: Match[] = [
    {
      id: 1,
      name: '小红',
      gender: 'female',
      hardware: {
        age: 25,
        height: '165cm',
        zodiac: '双子座',
        bloodType: 'O型',
        style: '简约文艺',
        location: '北京朝阳',
        occupation: '产品经理',
        company: '某互联网公司',
      },
      software: {
        mbti: 'ENFP',
        personality: '热情开朗，善于表达',
        emotionalStyle: '情绪稳定，偶尔小脾气',
        interests: ['旅行', '摄影', '美食'],
        hobbies: '周末喜欢逛展览、拍照',
        schedule: '早睡早起',
        spendingStyle: '注重品质',
        communicationStyle: '直接坦诚',
        likes: '被认真对待、小惊喜',
        dislikes: '不守时、大男子主义',
        loveExpectation: '希望找到一个能一起成长的人',
        dealBreakers: '不诚实、不尊重女性',
      },
      meetingScene: 'blind_date',
      meetingDate: '2024-03-20',
      relationshipStage: 'contacting',
      interactionStatus: 'good_vibe',
      impression: 4,
      impressionTags: ['nice', 'pretty'],
      keyInfo: [
        { id: 'key_1', type: 'birthday', label: '生日', icon: '🎂', value: '6月15日' },
        { id: 'key_2', type: 'food_preference', label: '饮食偏好', icon: '🍽️', value: '不吃辣，爱吃日料' },
      ],
      notes: '相亲认识，印象不错',
      status: 'contacting',
      nextAction: '约她周末去拍照',
      lastContact: new Date().toISOString(),
      createdAt: new Date('2024-03-20'),
    },
    {
      id: 2,
      name: '小芳',
      gender: 'female',
      hardware: {
        age: 27,
        height: '168cm',
        zodiac: '巨蟹座',
        location: '北京海淀',
        occupation: '设计师',
        company: '某设计工作室',
      },
      software: {
        mbti: 'INFP',
        personality: '温柔细腻，内心丰富',
        emotionalStyle: '敏感但善解人意',
        interests: ['健身', '电影', '阅读'],
        hobbies: '养猫、看展、做手工',
        likes: '安静陪伴、深度交流',
        dislikes: '嘈杂环境、肤浅对话',
      },
      meetingScene: 'activity',
      meetingDate: '2024-03-15',
      relationshipStage: 'dating',
      interactionStatus: 'dating_regularly',
      impression: 5,
      impressionTags: ['smart', 'funny'],
      keyInfo: [
        { id: 'key_3', type: 'pet', label: '宠物', icon: '🐱', value: '养了一只猫叫小橘' },
        { id: 'key_4', type: 'hometown', label: '家乡', icon: '🏠', value: '浙江杭州' },
      ],
      notes: '健身房认识',
      status: 'dating',
      nextAction: '第三次约会，看她的展',
      lastContact: new Date().toISOString(),
      createdAt: new Date('2024-03-15'),
    },
    {
      id: 3,
      name: '小丽',
      gender: 'female',
      hardware: {
        age: 24,
        zodiac: '处女座',
        occupation: '教师',
        location: '北京西城',
      },
      software: {
        mbti: 'ISFJ',
        personality: '安静温和，认真负责',
        interests: ['音乐', '旅行'],
      },
      meetingScene: 'app_meetup',
      meetingDate: '2024-03-10',
      relationshipStage: 'new',
      interactionStatus: 'got_contact',
      impression: 3,
      impressionTags: ['nice'],
      keyInfo: [],
      notes: '交友App认识',
      status: 'new',
      nextAction: '发第一条消息',
      lastContact: new Date().toISOString(),
      createdAt: new Date('2024-03-10'),
    },
  ]

  private nextId = 4

  getMatchList() {
    return {
      code: 200,
      data: this.matches.map(m => ({
        id: m.id,
        name: m.name,
        age: m.hardware?.age || 0,
        occupation: m.hardware?.occupation || '',
        mbti: m.software?.mbti || '',
        zodiac: m.hardware?.zodiac || '',
        meetingScene: m.meetingScene,
        relationshipStage: m.relationshipStage,
        interactionStatus: m.interactionStatus,
        impression: m.impression,
        interests: m.software?.interests || [],
        status: m.status,
        nextAction: m.nextAction,
        lastContact: this.formatLastContact(m.lastContact),
      })),
      message: 'success',
    }
  }

  getMatchDetail(id: number) {
    const match = this.matches.find(m => m.id === id)
    if (!match) {
      return { code: 404, data: null, message: 'Not found' }
    }
    return {
      code: 200,
      data: {
        ...match,
        progress: this.calculateProgress(match),
        stats: {
          tasks: 5,
          completedTasks: 2,
          quizScore: 80,
          dates: 2,
        },
      },
      message: 'success',
    }
  }

  createMatch(body: Partial<Match> & { 
    name?: string
    gender?: string
    hardware?: Partial<HardwareInfo>
    software?: Partial<SoftwareInfo>
    meetingScene?: string
    meetingDate?: string
    relationshipStage?: string
    interactionStatus?: string
    impression?: number
    impressionTags?: string[]
    notes?: string
  }) {
    const newMatch: Match = {
      id: this.nextId++,
      name: body.name || '',
      gender: body.gender || 'female',
      hardware: body.hardware || {},
      software: body.software || { interests: [] },
      meetingScene: body.meetingScene || 'other',
      meetingDate: body.meetingDate || new Date().toISOString().split('T')[0],
      relationshipStage: body.relationshipStage || 'new',
      interactionStatus: body.interactionStatus || 'just_met',
      impression: body.impression || 0,
      impressionTags: body.impressionTags || [],
      keyInfo: [],
      notes: body.notes || '',
      status: this.mapStageToStatus(body.relationshipStage || 'new'),
      nextAction: this.generateNextAction(body.meetingScene || 'other', body.interactionStatus || 'just_met'),
      lastContact: new Date().toISOString(),
      createdAt: new Date(),
    }
    this.matches.push(newMatch)
    return {
      code: 200,
      data: newMatch,
      message: 'success',
    }
  }

  updateMatch(id: number, body: Partial<Match>) {
    const index = this.matches.findIndex(m => m.id === id)
    if (index === -1) {
      return { code: 404, data: null, message: 'Not found' }
    }
    
    const oldStage = this.matches[index].relationshipStage
    
    // 深度合并 hardware 和 software
    const updatedHardware = body.hardware 
      ? { ...this.matches[index].hardware, ...body.hardware }
      : this.matches[index].hardware
    const updatedSoftware = body.software
      ? { ...this.matches[index].software, ...body.software }
      : this.matches[index].software
    
    // 如果更新了关系阶段，同步更新status
    const updatedStatus = body.relationshipStage 
      ? this.mapStageToStatus(body.relationshipStage)
      : this.matches[index].status
    
    this.matches[index] = {
      ...this.matches[index],
      ...body,
      hardware: updatedHardware,
      software: updatedSoftware,
      status: updatedStatus,
    }
    
    // 如果关系阶段发生变化，自动生成新任务
    if (body.relationshipStage && body.relationshipStage !== oldStage) {
      const match = this.matches[index]
      this.taskService.updateTasksForStage(
        id,
        body.relationshipStage,
        { keyInfo: match.keyInfo || [], interests: match.software?.interests || [] }
      )
    }
    
    return {
      code: 200,
      data: this.matches[index],
      message: 'success',
    }
  }

  deleteMatch(id: number) {
    const index = this.matches.findIndex(m => m.id === id)
    if (index === -1) {
      return { code: 404, data: null, message: 'Not found' }
    }
    this.matches.splice(index, 1)
    return { code: 200, data: null, message: 'success' }
  }

  getRecommendations(id: number) {
    const match = this.matches.find(m => m.id === id)
    if (!match) {
      return { code: 404, data: null, message: 'Not found' }
    }

    const recommendations = {
      topics: this.recommendTopics(match),
      tasks: this.recommendTasks(match),
      tips: this.recommendTips(match),
    }

    return {
      code: 200,
      data: recommendations,
      message: 'success',
    }
  }

  /**
   * 使用大模型生成话题推荐
   */
  async getAITopics(id: number, req: Request) {
    const match = this.matches.find(m => m.id === id)
    if (!match) {
      return { code: 404, data: null, message: 'Not found' }
    }

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const prompt = this.buildTopicsPrompt(match)
      
      const messages = [
        {
          role: 'system' as const,
          content: '你是一位专业的情感顾问和恋爱教练，擅长根据对方的性格特点、兴趣爱好和关系阶段，推荐合适的聊天话题和互动方式。你的建议应该具体、实用、易于执行。',
        },
        {
          role: 'user' as const,
          content: prompt,
        },
      ]

      const response = await client.invoke(messages, { temperature: 0.8 })
      
      return {
        code: 200,
        data: {
          topics: this.parseTopicsResponse(response.content),
          rawContent: response.content,
        },
        message: 'success',
      }
    } catch (error) {
      console.error('AI topics error:', error)
      return {
        code: 200,
        data: {
          topics: this.recommendTopics(match),
          rawContent: null,
        },
        message: 'success (fallback)',
      }
    }
  }

  /**
   * 使用大模型生成互动建议
   */
  async getAIInteraction(id: number, situation: string | undefined, req: Request) {
    const match = this.matches.find(m => m.id === id)
    if (!match) {
      return { code: 404, data: null, message: 'Not found' }
    }

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const prompt = this.buildInteractionPrompt(match, situation)
      
      const messages = [
        {
          role: 'system' as const,
          content: '你是一位专业的情感顾问和恋爱教练，擅长根据对方的性格特点、兴趣爱好和当前情况，提供具体的互动建议和行动方案。你的建议应该具体、实用、考虑对方感受。',
        },
        {
          role: 'user' as const,
          content: prompt,
        },
      ]

      const response = await client.invoke(messages, { temperature: 0.8 })
      
      const suggestions = this.parseInteractionResponse(response.content)
      
      // 将 AI 建议自动转换为任务
      const createdTasks = this.taskService.createTasksFromAI(id, suggestions)
      
      return {
        code: 200,
        data: {
          suggestions,
          tasks: createdTasks,
          rawContent: response.content,
        },
        message: 'success',
      }
    } catch (error) {
      console.error('AI interaction error:', error)
      
      const suggestions = this.recommendTips(match)
      
      // 即使是降级建议，也创建任务
      const createdTasks = this.taskService.createTasksFromAI(id, suggestions.map(s => ({
        action: s,
        reason: '根据当前情况推荐',
        tips: '请根据实际情况灵活调整',
      })))
      
      return {
        code: 200,
        data: {
          suggestions,
          tasks: createdTasks,
          rawContent: null,
        },
        message: 'success (fallback)',
      }
    }
  }

  private buildTopicsPrompt(match: Match): string {
    const tagLabels = match.impressionTags.map(t => impressionTagLabels[t] || t).join('、')
    const sceneLabel = meetingSceneLabels[match.meetingScene] || match.meetingScene
    const stageLabel = relationshipStageLabels[match.relationshipStage] || match.relationshipStage
    const statusLabel = interactionStatusLabels[match.interactionStatus] || match.interactionStatus
    const hw = match.hardware
    const sw = match.software
    
    // 硬件信息
    const hardwareInfo: string[] = []
    if (hw?.age) hardwareInfo.push(`年龄：${hw.age}岁`)
    if (hw?.height) hardwareInfo.push(`身高：${hw.height}`)
    if (hw?.zodiac) hardwareInfo.push(`星座：${hw.zodiac}`)
    if (hw?.occupation) hardwareInfo.push(`职业：${hw.occupation}`)
    if (hw?.location) hardwareInfo.push(`所在地：${hw.location}`)
    
    // 软件信息
    const softwareInfo: string[] = []
    if (sw?.mbti) softwareInfo.push(`MBTI：${sw.mbti}`)
    if (sw?.personality) softwareInfo.push(`性格：${sw.personality}`)
    if (sw?.interests?.length) softwareInfo.push(`兴趣：${sw.interests.join('、')}`)
    if (sw?.hobbies) softwareInfo.push(`爱好：${sw.hobbies}`)
    if (sw?.likes) softwareInfo.push(`喜欢：${sw.likes}`)
    if (sw?.dislikes) softwareInfo.push(`讨厌：${sw.dislikes}`)
    
    const keyInfoStr = match.keyInfo?.map(k => `${k.icon} ${k.label}：${k.value}`).join('\n') || '无'
    
    return `请为以下情况推荐3-5个聊天话题：

【对方硬件信息】（外在属性）
${hardwareInfo.join('\n') || '暂无信息'}

【对方软件信息】（内在特质）
${softwareInfo.join('\n') || '暂无信息'}

【关键信息】
${keyInfoStr}

【初印象】
- 标签：${tagLabels}
- 心动指数：${match.impression}/5

【认识场景】
- 通过「${sceneLabel}」认识

【当前状态】
- 关系阶段：${stageLabel}
- 互动状态：${statusLabel}
- 备注：${match.notes || '无'}

请根据以上信息，推荐适合的聊天话题。每个话题请说明：
1. 话题内容
2. 为什么适合这个话题（结合对方的MBTI、兴趣、关键信息等）
3. 如何自然地开启这个话题

请用JSON格式返回，格式如下：
{
  "topics": [
    {
      "title": "话题标题",
      "reason": "适合原因",
      "opener": "如何开场"
    }
  ]
}`
  }

  private buildInteractionPrompt(match: Match, situation: string | undefined): string {
    const tagLabels = match.impressionTags.map(t => impressionTagLabels[t] || t).join('、')
    const sceneLabel = meetingSceneLabels[match.meetingScene] || match.meetingScene
    const stageLabel = relationshipStageLabels[match.relationshipStage] || match.relationshipStage
    const statusLabel = interactionStatusLabels[match.interactionStatus] || match.interactionStatus
    const hw = match.hardware
    const sw = match.software
    
    // 硬件信息
    const hardwareInfo: string[] = []
    if (hw?.age) hardwareInfo.push(`年龄：${hw.age}岁`)
    if (hw?.height) hardwareInfo.push(`身高：${hw.height}`)
    if (hw?.zodiac) hardwareInfo.push(`星座：${hw.zodiac}`)
    if (hw?.occupation) hardwareInfo.push(`职业：${hw.occupation}`)
    if (hw?.location) hardwareInfo.push(`所在地：${hw.location}`)
    
    // 软件信息
    const softwareInfo: string[] = []
    if (sw?.mbti) softwareInfo.push(`MBTI：${sw.mbti}`)
    if (sw?.personality) softwareInfo.push(`性格：${sw.personality}`)
    if (sw?.interests?.length) softwareInfo.push(`兴趣：${sw.interests.join('、')}`)
    if (sw?.hobbies) softwareInfo.push(`爱好：${sw.hobbies}`)
    if (sw?.likes) softwareInfo.push(`喜欢：${sw.likes}`)
    if (sw?.dislikes) softwareInfo.push(`讨厌：${sw.dislikes}`)
    if (sw?.dealBreakers) softwareInfo.push(`雷区：${sw.dealBreakers}`)
    
    const keyInfoStr = match.keyInfo?.map(k => `${k.icon} ${k.label}：${k.value}`).join('\n') || '无'
    
    return `请为以下情况提供互动建议：

【对方硬件信息】（外在属性）
${hardwareInfo.join('\n') || '暂无信息'}

【对方软件信息】（内在特质）
${softwareInfo.join('\n') || '暂无信息'}

【关键信息】
${keyInfoStr}

【初印象】
- 标签：${tagLabels}
- 心动指数：${match.impression}/5

【认识场景】
- 通过「${sceneLabel}」认识

【当前状态】
- 关系阶段：${stageLabel}
- 互动状态：${statusLabel}
- 备注：${match.notes || '无'}
${situation ? `\n【当前情况】\n${situation}` : ''}

请根据以上信息，提供3-5条具体的互动建议。每条建议请说明：
1. 具体行动
2. 为什么适合（结合对方的MBTI、星座、兴趣、关键信息等）
3. 注意事项

请用JSON格式返回，格式如下：
{
  "suggestions": [
    {
      "action": "具体行动",
      "reason": "适合原因",
      "tips": "注意事项"
    }
  ]
}`
  }

  private parseTopicsResponse(content: string): Array<{ title: string; reason: string; opener: string }> {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.topics && Array.isArray(parsed.topics)) {
          return parsed.topics
        }
      }
    } catch {
      // 解析失败
    }
    
    return [
      { title: '聊聊最近的趣事', reason: '轻松自然的话题', opener: '最近有什么有趣的事吗？' },
      { title: '分享生活日常', reason: '增进了解', opener: '今天过得怎么样？' },
      { title: '聊聊兴趣爱好', reason: '找到共同话题', opener: '你平时喜欢做什么？' },
    ]
  }

  private parseInteractionResponse(content: string): Array<{ action: string; reason: string; tips: string }> {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
          return parsed.suggestions
        }
      }
    } catch {
      // 解析失败
    }
    
    return [
      { action: '发送一条关心的消息', reason: '表达关心', tips: '保持自然，不要过于频繁' },
      { action: '分享一件有趣的事', reason: '增加互动', tips: '选择轻松有趣的内容' },
      { action: '记住对方的小习惯', reason: '展示细心', tips: '在合适的时机体现出来' },
    ]
  }

  private mapStageToStatus(stage: string): string {
    const mapping: Record<string, string> = {
      new: 'new',
      contacting: 'contacting',
      dating: 'dating',
      progressing: 'progressing',
    }
    return mapping[stage] || 'new'
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      new: '刚认识',
      contacting: '接触中',
      dating: '约会中',
      progressing: '发展中',
      paused: '暂停中',
    }
    return labels[status] || '未知'
  }

  private formatLastContact(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    return `${Math.floor(diffDays / 7)}周前`
  }

  private calculateProgress(match: Match): number {
    const progressMap: Record<string, number> = {
      new: 10,
      contacting: 30,
      dating: 60,
      progressing: 80,
      paused: 0,
    }
    return progressMap[match.status] || 0
  }

  private generateNextAction(scene: string, interactionStatus: string): string {
    // 根据互动状态生成下一步行动
    const statusActions: Record<string, string> = {
      just_met: '尝试获取联系方式',
      got_contact: '发第一条消息打招呼',
      chatted: '找话题继续聊下去',
      good_vibe: '尝试约出来见面',
      met_up: '安排下一次约会',
      dating_regularly: '计划一个特别的约会',
      ambiguous: '适时表达心意',
      confirming: '准备正式表白',
    }
    
    if (statusActions[interactionStatus]) {
      return statusActions[interactionStatus]
    }
    
    // 默认根据场景
    const actions: Record<string, string> = {
      blind_date: '发消息约下次见面',
      pickup: '发第一条消息',
      app_meetup: '延续线上话题',
      party: '约出来单独见面',
      workplace: '找个理由搭话',
      school: '约一起去图书馆',
      activity: '约下次一起运动',
      other: '主动联系',
    }
    return actions[scene] || '主动联系'
  }

  private recommendTopics(match: Match): string[] {
    const baseTopics = [
      '聊聊最近的一次旅行',
      '分享童年趣事',
      '讨论喜欢的电影',
    ]
    const interests = match.software?.interests || []
    if (interests.includes('旅行')) {
      baseTopics.push('最想去哪里旅行？')
    }
    if (interests.includes('美食')) {
      baseTopics.push('分享美食经历')
    }
    return baseTopics.slice(0, 3)
  }

  private recommendTasks(match: Match): string[] {
    return [
      '发送一条关心的消息',
      '分享一件有趣的事',
      '记住对方的一个小习惯',
    ]
  }

  private recommendTips(match: Match): string[] {
    const tips: Record<string, string[]> = {
      blind_date: ['展示真诚和稳定', '聊聊生活规划', '了解对方家庭观念'],
      pickup: ['保持轻松自然', '寻找共同话题', '适度展示自己'],
      app_meetup: ['延续线上热度', '安排有趣活动', '创造浪漫氛围'],
      party: ['利用共同朋友', '组织小团体活动', '自然接触'],
    }
    return tips[match.meetingScene] || ['真诚对待', '保持联系', '创造机会']
  }
}
