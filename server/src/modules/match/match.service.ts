import { Injectable, Inject, forwardRef } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'
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

// 推进阶段定义
export interface ProgressStage {
  key: string
  name: string
  minScore: number
  maxScore: number
  description: string
  focus: string
  suggestedActions: string[]
}

const progressStages: ProgressStage[] = [
  {
    key: 'initial',
    name: '初识期',
    minScore: 0,
    maxScore: 20,
    description: '刚刚认识，信息很少',
    focus: '建立初步印象，获取联系方式',
    suggestedActions: ['获取联系方式', '记住基本信息', '发第一条消息'],
  },
  {
    key: 'understanding',
    name: '了解期',
    minScore: 21,
    maxScore: 40,
    description: '开始了解基本信息',
    focus: '深入了解对方，寻找共同话题',
    suggestedActions: ['了解兴趣爱好', '记住重要日期', '找到聊天节奏'],
  },
  {
    key: 'connecting',
    name: '接触期',
    minScore: 41,
    maxScore: 60,
    description: '有一定互动，关系升温',
    focus: '增加互动频率，尝试邀约',
    suggestedActions: ['约出来见面', '创造共同回忆', '展示真实自我'],
  },
  {
    key: 'warming',
    name: '热络期',
    minScore: 61,
    maxScore: 80,
    description: '频繁互动，关系稳定',
    focus: '深化情感连接，制造惊喜',
    suggestedActions: ['记住喜好禁忌', '制造小惊喜', '深入交流价值观'],
  },
  {
    key: 'ambiguous',
    name: '暧昧期',
    minScore: 81,
    maxScore: 90,
    description: '关系即将突破',
    focus: '释放明确信号，试探对方态度',
    suggestedActions: ['增加肢体接触', '暧昧试探', '创造独处机会'],
  },
  {
    key: 'breakthrough',
    name: '突破期',
    minScore: 91,
    maxScore: 100,
    description: '准备确认关系',
    focus: '把握时机，正式表白',
    suggestedActions: ['准备表白', '选择合适时机', '真诚表达心意'],
  },
]

// 推进值计算结果
export interface ProgressScore {
  total: number           // 总分 0-100
  stage: ProgressStage    // 当前阶段
  breakdown: {
    infoCompleteness: number    // 信息完整度 0-20
    interactionDepth: number    // 互动深度 0-30
    taskCompletion: number      // 任务完成率 0-25
    keyInfoMastery: number      // 关键信息掌握度 0-15
    timeActivity: number        // 时间活跃度 0-10
  }
  insights: string[]      // 洞察建议
  nextActions: string[]   // 建议下一步行动
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
  age?: number
  height?: string
  birthday?: string
  zodiac?: string
  bloodType?: string
  bodyType?: string
  style?: string
  wechat?: string
  phone?: string
  location?: string
  occupation?: string
  company?: string
  position?: string
}

// 软件信息（内在/需探索）
export interface SoftwareInfo {
  mbti?: string
  personality?: string
  emotionalStyle?: string
  interests?: string[]
  hobbies?: string
  schedule?: string
  spendingStyle?: string
  communicationStyle?: string
  likes?: string
  dislikes?: string
  loveExpectation?: string
  dealBreakers?: string
  communicationPreferences?: {
    effectiveWays?: string[]
    ineffectiveWays?: string[]
    landmines?: string[]
  }
  loveLanguages?: string[]
  emotionalTriggers?: {
    positive?: string[]
    negative?: string[]
  }
}

export interface Match {
  id: number
  name: string
  gender: string
  hardware: HardwareInfo
  software: SoftwareInfo
  meetingScene: string
  meetingDate: string
  relationshipStage: string
  interactionStatus: string
  impression: number
  impressionTags: string[]
  keyInfo: KeyInfo[]
  notes: string
  status: string
  nextAction: string
  lastContact: string
  createdAt: Date
  cycleStartDate?: string
  cycleLength?: number
}

// 数据库返回格式
interface DbMatch {
  id: number
  name: string
  gender: string
  hardware: HardwareInfo
  software: SoftwareInfo
  meeting_scene: string
  meeting_date: string
  relationship_stage: string
  interaction_status: string
  impression: number
  impression_tags: string[]
  key_info: KeyInfo[]
  notes: string
  status: string
  next_action: string
  last_contact: string
  cycle_start_date: string
  cycle_length: number
  created_at: string
  updated_at: string
}

@Injectable()
export class MatchService {
  constructor(
    @Inject(forwardRef(() => TaskService))
    private readonly taskService: TaskService,
  ) {}

  // 转换数据库字段为前端格式
  private dbToMatch(db: DbMatch): Match {
    return {
      id: db.id,
      name: db.name,
      gender: db.gender,
      hardware: db.hardware || {},
      software: db.software || { interests: [] },
      meetingScene: db.meeting_scene,
      meetingDate: db.meeting_date,
      relationshipStage: db.relationship_stage,
      interactionStatus: db.interaction_status,
      impression: db.impression,
      impressionTags: db.impression_tags || [],
      keyInfo: db.key_info || [],
      notes: db.notes,
      status: db.status,
      nextAction: db.next_action,
      lastContact: db.last_contact,
      createdAt: new Date(db.created_at),
      cycleStartDate: db.cycle_start_date,
      cycleLength: db.cycle_length,
    }
  }

  /**
   * 计算推进值
   * 推进值 = 信息完整度(20分) + 互动深度(30分) + 任务完成率(25分) + 关键信息掌握度(15分) + 时间活跃度(10分)
   */
  async calculateProgressScore(matchId: number): Promise<ProgressScore> {
    // 获取对象详情
    const client = getSupabaseClient()
    const { data: matchData } = await client
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (!matchData) {
      return this.getDefaultProgressScore()
    }

    const match = this.dbToMatch(matchData as DbMatch)
    const taskStats = await this.taskService.getTaskStats(matchId)

    // 1. 信息完整度 (0-20分)
    const infoScore = this.calculateInfoCompleteness(match.hardware, match.software)

    // 2. 互动深度 (0-30分)
    const interactionScore = this.calculateInteractionDepth(match.relationshipStage, match.interactionStatus)

    // 3. 任务完成率 (0-25分)
    const taskScore = this.calculateTaskCompletion(taskStats.total, taskStats.completed)

    // 4. 关键信息掌握度 (0-15分)
    const keyInfoScore = this.calculateKeyInfoMastery(match.hardware, match.software, match.keyInfo)

    // 5. 时间活跃度 (0-10分)
    const timeScore = this.calculateTimeActivity(match.lastContact, match.meetingDate)

    // 计算总分
    const total = Math.min(100, Math.max(0, 
      infoScore + interactionScore + taskScore + keyInfoScore + timeScore
    ))

    // 确定当前阶段
    const stage = this.getProgressStage(total)

    // 生成洞察建议
    const insights = this.generateInsights({
      infoScore,
      interactionScore,
      taskScore,
      keyInfoScore,
      timeScore,
    }, match)

    // 获取下一步建议
    const nextActions = this.getNextActions(stage, match)

    return {
      total,
      stage,
      breakdown: {
        infoCompleteness: infoScore,
        interactionDepth: interactionScore,
        taskCompletion: taskScore,
        keyInfoMastery: keyInfoScore,
        timeActivity: timeScore,
      },
      insights,
      nextActions,
    }
  }

  /**
   * 计算信息完整度 (0-20分)
   * 硬件信息 8分 + 软件信息 12分
   */
  private calculateInfoCompleteness(hardware: HardwareInfo, software: SoftwareInfo): number {
    let score = 0

    // 硬件信息 (8分) - 12个字段，每个约0.67分
    const hardwareFields = ['age', 'height', 'birthday', 'zodiac', 'location', 'occupation', 'company', 'position', 'wechat', 'phone', 'bloodType', 'style']
    let hardwareCount = 0
    hardwareFields.forEach(field => {
      const value = hardware[field as keyof HardwareInfo]
      if (value !== undefined && value !== null && value !== '') {
        hardwareCount++
      }
    })
    score += Math.min(8, (hardwareCount / 12) * 8)

    // 软件信息 (12分)
    // 基础字段 6分
    const softwareBasicFields = ['mbti', 'personality', 'emotionalStyle', 'hobbies', 'schedule', 'spendingStyle', 'communicationStyle']
    let basicCount = 0
    softwareBasicFields.forEach(field => {
      const value = software[field as keyof SoftwareInfo]
      if (value !== undefined && value !== null && value !== '') {
        basicCount++
      }
    })
    score += Math.min(4, (basicCount / 7) * 4)

    // 兴趣爱好 2分
    if (software.interests && software.interests.length > 0) {
      score += Math.min(2, software.interests.length * 0.5)
    }

    // 深度信息 4分
    let deepScore = 0
    if (software.communicationPreferences?.effectiveWays?.length) deepScore += 1
    if (software.communicationPreferences?.landmines?.length) deepScore += 1
    if (software.loveLanguages && software.loveLanguages.length > 0) deepScore += 1
    if (software.likes || software.dislikes) deepScore += 1
    score += Math.min(4, deepScore)

    return Math.round(score * 10) / 10
  }

  /**
   * 计算互动深度 (0-30分)
   * 关系阶段 15分 + 互动状态 15分
   */
  private calculateInteractionDepth(relationshipStage: string, interactionStatus: string): number {
    let score = 0

    // 关系阶段 (15分)
    const stageScores: Record<string, number> = {
      new: 3,
      contacting: 7,
      dating: 12,
      progressing: 15,
    }
    score += stageScores[relationshipStage] || 0

    // 互动状态 (15分)
    const statusScores: Record<string, number> = {
      just_met: 2,
      got_contact: 4,
      chatted: 6,
      good_vibe: 8,
      met_up: 10,
      dating_regularly: 12,
      ambiguous: 14,
      confirming: 15,
    }
    score += statusScores[interactionStatus] || 0

    return score
  }

  /**
   * 计算任务完成率 (0-25分)
   * 完成比例 20分 + 学习记录加分 5分
   */
  private calculateTaskCompletion(total: number, completed: number): number {
    if (total === 0) return 0

    // 完成比例 (20分)
    const ratio = completed / total
    const baseScore = ratio * 20

    // 全部完成额外加分 (5分)
    const bonusScore = ratio >= 1 ? 5 : ratio >= 0.8 ? 3 : ratio >= 0.5 ? 1 : 0

    return Math.round((baseScore + bonusScore) * 10) / 10
  }

  /**
   * 计算关键信息掌握度 (0-15分)
   * 重要日期 5分 + 喜好禁忌 5分 + 爱的语言 5分
   */
  private calculateKeyInfoMastery(hardware: HardwareInfo, software: SoftwareInfo, keyInfo: KeyInfo[]): number {
    let score = 0

    // 重要日期 (5分)
    if (hardware.birthday) score += 3
    if (keyInfo.some(k => k.type === 'anniversary')) score += 2

    // 喜好禁忌 (5分)
    if (software.likes) score += 1
    if (software.dislikes) score += 1
    if (software.communicationPreferences?.landmines?.length) score += 2
    if (software.dealBreakers) score += 1

    // 爱的语言 (5分)
    if (software.loveLanguages && software.loveLanguages.length >= 3) score += 5
    else if (software.loveLanguages && software.loveLanguages.length >= 1) score += 3

    return Math.min(15, score)
  }

  /**
   * 计算时间活跃度 (0-10分)
   * 最近互动时间 5分 + 认识时长 5分
   */
  private calculateTimeActivity(lastContact: string, meetingDate: string): number {
    let score = 0

    // 最近互动时间 (5分)
    const lastContactDate = new Date(lastContact)
    const now = new Date()
    const daysSinceContact = Math.floor((now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceContact <= 1) score += 5
    else if (daysSinceContact <= 3) score += 4
    else if (daysSinceContact <= 7) score += 3
    else if (daysSinceContact <= 14) score += 2
    else if (daysSinceContact <= 30) score += 1

    // 认识时长 - 持续互动加分 (5分)
    const meetingDateObj = new Date(meetingDate)
    const daysSinceMeeting = Math.floor((now.getTime() - meetingDateObj.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceMeeting >= 7 && daysSinceContact <= 7) score += 2  // 认识一周以上且近期有互动
    if (daysSinceMeeting >= 30 && daysSinceContact <= 14) score += 2  // 认识一个月以上且两周内有互动
    if (daysSinceMeeting >= 90 && daysSinceContact <= 30) score += 1  // 认识三个月以上且一月内有互动

    return Math.min(10, score)
  }

  /**
   * 根据分数确定推进阶段
   */
  private getProgressStage(score: number): ProgressStage {
    for (const stage of progressStages) {
      if (score >= stage.minScore && score <= stage.maxScore) {
        return stage
      }
    }
    return progressStages[0]
  }

  /**
   * 生成洞察建议
   */
  private generateInsights(
    scores: { infoScore: number; interactionScore: number; taskScore: number; keyInfoScore: number; timeScore: number },
    match: Match
  ): string[] {
    const insights: string[] = []

    // 信息完整度洞察
    if (scores.infoScore < 10) {
      insights.push('信息收集不够完整，建议多了解对方的基本情况')
    } else if (scores.infoScore < 15) {
      insights.push('基础信息掌握不错，可以深入了解对方的内心世界')
    }

    // 互动深度洞察
    if (scores.interactionScore < 15) {
      insights.push('互动还处于初期，建议增加沟通频率')
    } else if (scores.interactionScore >= 25) {
      insights.push('互动频繁，关系稳定发展')
    }

    // 任务完成洞察
    if (scores.taskScore < 10) {
      insights.push('完成任务较少，每完成一个任务都能推进关系')
    } else if (scores.taskScore >= 20) {
      insights.push('任务完成度很高，关系推进顺利')
    }

    // 关键信息洞察
    if (scores.keyInfoScore < 8) {
      insights.push('建议记录更多关键信息，如重要日期、喜好禁忌')
    }

    // 时间活跃度洞察
    if (scores.timeScore < 5) {
      insights.push('最近互动较少，建议主动发起对话')
    }

    return insights
  }

  /**
   * 获取下一步建议行动
   */
  private getNextActions(stage: ProgressStage, match: Match): string[] {
    const actions = [...stage.suggestedActions]

    // 根据具体情况补充建议
    if (!match.hardware.birthday) {
      actions.push('了解Ta的生日')
    }
    if (!match.software.loveLanguages?.length) {
      actions.push('观察Ta接受爱的方式')
    }
    if (match.interactionStatus === 'chatted' && match.relationshipStage === 'new') {
      actions.push('尝试约Ta出来见面')
    }

    return actions.slice(0, 5)
  }

  /**
   * 默认推进值
   */
  private getDefaultProgressScore(): ProgressScore {
    return {
      total: 0,
      stage: progressStages[0],
      breakdown: {
        infoCompleteness: 0,
        interactionDepth: 0,
        taskCompletion: 0,
        keyInfoMastery: 0,
        timeActivity: 0,
      },
      insights: ['开始收集对方信息吧'],
      nextActions: ['记住对方的名字', '获取联系方式', '了解基本情况'],
    }
  }

  async getMatchList() {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Get match list error:', error)
        return { code: 500, data: [], message: `获取列表失败: ${error.message}` }
      }

      const matches = (data as DbMatch[]).map(this.dbToMatch)

      return {
        code: 200,
        data: matches.map(m => ({
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
    } catch (error) {
      console.error('Get match list error:', error)
      return { code: 500, data: [], message: '获取列表失败' }
    }
  }

  async getMatchDetail(id: number) {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('matches')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        return { code: 404, data: null, message: 'Not found' }
      }

      const match = this.dbToMatch(data as DbMatch)

      // 获取真实的任务统计
      const taskStats = await this.taskService.getTaskStats(match.id)

      // 计算推进值
      const progressScore = await this.calculateProgressScore(match.id)

      return {
        code: 200,
        data: {
          ...match,
          progress: this.calculateProgress(match),
          progressScore,
          stats: {
            tasks: taskStats.total,
            completedTasks: taskStats.completed,
            quizScore: 80,
            dates: 2,
          },
        },
        message: 'success',
      }
    } catch (error) {
      console.error('Get match detail error:', error)
      return { code: 500, data: null, message: '获取详情失败' }
    }
  }

  /**
   * 获取推进值详情
   */
  async getProgressScore(matchId: number) {
    const progressScore = await this.calculateProgressScore(matchId)
    return {
      code: 200,
      data: progressScore,
      message: 'success',
    }
  }

  async createMatch(body: Partial<Match> & { 
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
    try {
      const client = getSupabaseClient()
      const newMatch = {
        name: body.name || '',
        gender: body.gender || 'female',
        hardware: body.hardware || {},
        software: body.software || { interests: [] },
        meeting_scene: body.meetingScene || 'other',
        meeting_date: body.meetingDate || new Date().toISOString().split('T')[0],
        relationship_stage: body.relationshipStage || 'new',
        interaction_status: body.interactionStatus || 'just_met',
        impression: body.impression || 0,
        impression_tags: body.impressionTags || [],
        key_info: [],
        notes: body.notes || '',
        status: this.mapStageToStatus(body.relationshipStage || 'new'),
        next_action: this.generateNextAction(body.meetingScene || 'other', body.interactionStatus || 'just_met'),
        last_contact: new Date().toISOString(),
        cycle_start_date: null,
        cycle_length: 28,
      }

      const { data, error } = await client
        .from('matches')
        .insert(newMatch)
        .select()
        .single()

      if (error) {
        console.error('Create match error:', error)
        return { code: 500, data: null, message: `创建失败: ${error.message}` }
      }

      return {
        code: 200,
        data: this.dbToMatch(data as DbMatch),
        message: 'success',
      }
    } catch (error) {
      console.error('Create match error:', error)
      return { code: 500, data: null, message: '创建失败' }
    }
  }

  async updateMatch(id: number, body: Partial<Match>) {
    try {
      const client = getSupabaseClient()

      // 先获取现有数据
      const { data: existing, error: fetchError } = await client
        .from('matches')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !existing) {
        return { code: 404, data: null, message: 'Not found' }
      }

      const existingMatch = existing as DbMatch

      // 深度合并 hardware 和 software
      const updatedHardware = body.hardware 
        ? { ...existingMatch.hardware, ...body.hardware }
        : existingMatch.hardware
      const updatedSoftware = body.software
        ? { ...existingMatch.software, ...body.software }
        : existingMatch.software

      // 如果更新了关系阶段，同步更新status
      const updatedStatus = body.relationshipStage 
        ? this.mapStageToStatus(body.relationshipStage)
        : existingMatch.status

      const updateData: Record<string, unknown> = {
        hardware: updatedHardware,
        software: updatedSoftware,
        status: updatedStatus,
        updated_at: new Date().toISOString(),
      }

      // 只更新提供的字段
      if (body.name) updateData.name = body.name
      if (body.gender) updateData.gender = body.gender
      if (body.meetingScene) updateData.meeting_scene = body.meetingScene
      if (body.meetingDate) updateData.meeting_date = body.meetingDate
      if (body.relationshipStage) updateData.relationship_stage = body.relationshipStage
      if (body.interactionStatus) updateData.interaction_status = body.interactionStatus
      if (body.impression !== undefined) updateData.impression = body.impression
      if (body.impressionTags) updateData.impression_tags = body.impressionTags
      if (body.keyInfo) updateData.key_info = body.keyInfo
      if (body.notes !== undefined) updateData.notes = body.notes
      if (body.nextAction !== undefined) updateData.next_action = body.nextAction

      const { data, error } = await client
        .from('matches')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Update match error:', error)
        return { code: 500, data: null, message: `更新失败: ${error.message}` }
      }

      return {
        code: 200,
        data: this.dbToMatch(data as DbMatch),
        message: 'success',
      }
    } catch (error) {
      console.error('Update match error:', error)
      return { code: 500, data: null, message: '更新失败' }
    }
  }

  async deleteMatch(id: number) {
    try {
      const client = getSupabaseClient()
      const { error } = await client
        .from('matches')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete match error:', error)
        return { code: 500, data: null, message: `删除失败: ${error.message}` }
      }

      return { code: 200, data: null, message: 'success' }
    } catch (error) {
      console.error('Delete match error:', error)
      return { code: 500, data: null, message: '删除失败' }
    }
  }

  async getRecommendations(id: number) {
    const matchResult = await this.getMatchDetail(id)
    if (matchResult.code !== 200 || !matchResult.data) {
      return { code: 404, data: null, message: 'Not found' }
    }

    const match = matchResult.data as Match
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
    const matchResult = await this.getMatchDetail(id)
    if (matchResult.code !== 200 || !matchResult.data) {
      return { code: 404, data: null, message: 'Not found' }
    }

    const match = matchResult.data as Match

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
    const matchResult = await this.getMatchDetail(id)
    if (matchResult.code !== 200 || !matchResult.data) {
      return { code: 404, data: null, message: 'Not found' }
    }

    const match = matchResult.data as Match

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
    
    const hardwareInfo: string[] = []
    if (hw?.age) hardwareInfo.push(`年龄：${hw.age}岁`)
    if (hw?.height) hardwareInfo.push(`身高：${hw.height}`)
    if (hw?.zodiac) hardwareInfo.push(`星座：${hw.zodiac}`)
    if (hw?.occupation) hardwareInfo.push(`职业：${hw.occupation}`)
    if (hw?.location) hardwareInfo.push(`所在地：${hw.location}`)
    
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
    
    const hardwareInfo: string[] = []
    if (hw?.age) hardwareInfo.push(`年龄：${hw.age}岁`)
    if (hw?.height) hardwareInfo.push(`身高：${hw.height}`)
    if (hw?.zodiac) hardwareInfo.push(`星座：${hw.zodiac}`)
    if (hw?.occupation) hardwareInfo.push(`职业：${hw.occupation}`)
    if (hw?.location) hardwareInfo.push(`所在地：${hw.location}`)
    
    const softwareInfo: string[] = []
    if (sw?.mbti) softwareInfo.push(`MBTI：${sw.mbti}`)
    if (sw?.personality) softwareInfo.push(`性格：${sw.personality}`)
    if (sw?.interests?.length) softwareInfo.push(`兴趣：${sw.interests.join('、')}`)
    if (sw?.hobbies) softwareInfo.push(`爱好：${sw.hobbies}`)
    if (sw?.likes) softwareInfo.push(`喜欢：${sw.likes}`)
    if (sw?.dislikes) softwareInfo.push(`讨厌：${sw.dislikes}`)
    if (sw?.dealBreakers) softwareInfo.push(`雷区：${sw.dealBreakers}`)
    
    const commPrefs: string[] = []
    if (sw?.communicationPreferences?.effectiveWays?.length) {
      commPrefs.push(`有效方式：${sw.communicationPreferences.effectiveWays.join('、')}`)
    }
    if (sw?.communicationPreferences?.ineffectiveWays?.length) {
      commPrefs.push(`无效方式：${sw.communicationPreferences.ineffectiveWays.join('、')}`)
    }
    if (sw?.communicationPreferences?.landmines?.length) {
      commPrefs.push(`绝对雷区：${sw.communicationPreferences.landmines.join('、')}`)
    }
    
    const loveLangs = sw?.loveLanguages?.length ? sw.loveLanguages.join(' > ') : null
    
    const cycleInfo = this.calculateCyclePhase(match.cycleStartDate, match.cycleLength)
    const cycleStr = cycleInfo 
      ? `当前阶段：${cycleInfo.phaseName}（Day ${cycleInfo.day}）\n状态描述：${cycleInfo.description}\n建议方向：${cycleInfo.recommendations.join('、')}`
      : '未设置周期信息'
    
    const keyInfoStr = match.keyInfo?.map(k => `${k.icon} ${k.label}：${k.value}`).join('\n') || '无'
    
    return `请为以下情况提供互动建议：

【对方硬件信息】（外在属性）
${hardwareInfo.join('\n') || '暂无信息'}

【对方软件信息】（内在特质）
${softwareInfo.join('\n') || '暂无信息'}

【关键信息】
${keyInfoStr}

【交流偏好】（重要！）
${commPrefs.join('\n') || '暂无信息'}

【爱的语言】
${loveLangs || '暂无信息'}

【激素周期状态】（女性特有，非常重要！）
${cycleStr}

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

请根据以上信息，提供3-5条具体的互动建议。

**重要原则**：
1. 如果对方处于PMS期（黄体期后期），建议要更温和、给更多空间
2. 如果对方处于排卵期，适合主动约会或深度交流
3. 如果对方处于月经期，建议以关心和陪伴为主，不要安排太多活动
4. 结合对方的交流偏好，推荐有效的方式，避免雷区

请用JSON格式返回，格式如下：
{
  "suggestions": [
    {
      "action": "具体行动",
      "reason": "适合原因（结合周期阶段、MBTI、兴趣等）",
      "tips": "注意事项（结合周期状态提醒）"
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

  // ============== 周期追踪功能 ==============

  calculateCyclePhase(cycleStartDate: string | undefined, cycleLength: number = 28): {
    day: number
    phase: string
    phaseName: string
    description: string
    recommendations: string[]
  } | null {
    if (!cycleStartDate) return null
    
    const startDate = new Date(cycleStartDate)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const currentDay = (diffDays % cycleLength) + 1
    
    if (currentDay <= 5) {
      return {
        day: currentDay,
        phase: 'menstrual',
        phaseName: '月经期',
        description: '身体需要休息，可能疲惫、敏感',
        recommendations: ['少安排活动', '多关心体贴', '避免争论']
      }
    } else if (currentDay <= 13) {
      return {
        day: currentDay,
        phase: 'follicular',
        phaseName: '卵泡期',
        description: '能量上升，心态积极，适合深度交流',
        recommendations: ['可以约出来', '聊聊深度话题', '一起规划未来']
      }
    } else if (currentDay <= 16) {
      return {
        day: currentDay,
        phase: 'ovulation',
        phaseName: '排卵期',
        description: '精力充沛，表达欲强，魅力值max',
        recommendations: ['让她多说', '表达欣赏', '适合表白或约会']
      }
    } else if (currentDay <= 21) {
      return {
        day: currentDay,
        phase: 'luteal_early',
        phaseName: '黄体期早期',
        description: '状态稳定，适合日常互动',
        recommendations: ['正常交流', '保持节奏', '关注情绪变化']
      }
    } else {
      return {
        day: currentDay,
        phase: 'luteal_late',
        phaseName: '黄体期晚期(PMS)',
        description: '可能情绪波动、敏感、疲惫',
        recommendations: ['多点耐心', '少安排活动', '避免敏感话题']
      }
    }
  }

  async getCycleInfo(id: number) {
    const matchResult = await this.getMatchDetail(id)
    if (matchResult.code !== 200 || !matchResult.data) {
      return { code: 404, data: null, message: 'Not found' }
    }

    const match = matchResult.data as Match
    const cycleInfo = this.calculateCyclePhase(match.cycleStartDate, match.cycleLength)

    return {
      code: 200,
      data: {
        cycleStartDate: match.cycleStartDate,
        cycleLength: match.cycleLength,
        currentPhase: cycleInfo,
      },
      message: 'success',
    }
  }

  async updateCycleInfo(id: number, cycleStartDate: string, cycleLength: number = 28) {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('matches')
        .update({
          cycle_start_date: cycleStartDate,
          cycle_length: cycleLength,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Update cycle info error:', error)
        return { code: 500, data: null, message: `更新失败: ${error.message}` }
      }

      return {
        code: 200,
        data: this.dbToMatch(data as DbMatch),
        message: 'success',
      }
    } catch (error) {
      console.error('Update cycle info error:', error)
      return { code: 500, data: null, message: '更新失败' }
    }
  }
}
