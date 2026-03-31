import { Injectable, Inject, forwardRef } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { TaskService } from '../task/task.service'
import { RelationshipEnergyService } from '../interaction/relationship-energy.service'

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

// 推进阶段配置
const progressStages: ProgressStage[] = [
  {
    key: 'initial',
    name: '初识期',
    minScore: 0,
    maxScore: 20,
    description: '刚刚认识，信息很少',
    focus: '建立初步印象，获取基础信息',
    suggestedActions: ['获取联系方式', '记住基本信息', '了解基本情况'],
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
    description: '有一定了解，可以深入互动',
    focus: '增加互动频率，尝试邀约',
    suggestedActions: ['约出来见面', '创造共同回忆', '展示真实自我'],
  },
  {
    key: 'warming',
    name: '热络期',
    minScore: 61,
    maxScore: 80,
    description: '了解较深，关系稳定发展',
    focus: '深化情感连接，制造惊喜',
    suggestedActions: ['记住喜好禁忌', '制造小惊喜', '深入交流价值观'],
  },
  {
    key: 'ambiguous',
    name: '暧昧期',
    minScore: 81,
    maxScore: 90,
    description: '了解深入，关系即将突破',
    focus: '释放明确信号，试探对方态度',
    suggestedActions: ['增加肢体接触', '暧昧试探', '创造独处机会'],
  },
  {
    key: 'breakthrough',
    name: '突破期',
    minScore: 91,
    maxScore: 100,
    description: '信息完整，准备确认关系',
    focus: '把握时机，正式表白',
    suggestedActions: ['准备表白', '选择合适时机', '真诚表达心意'],
  },
]

// 推进值计算结果
export interface ProgressScore {
  total: number           // 总分 0-100
  stage: ProgressStage    // 当前阶段
  breakdown: {
    infoCompleteness: number    // 信息完整度 0-60
    criticalInfoMastery: number // 关键信息掌握度 0-20
    taskCompletion: number      // 任务完成率 0-20
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

// 维度数据接口
export interface DimensionValue {
  dimension_key: string
  value: any
  layer: number
  category: string
  importance: string
  weight: number
}

export interface Match {
  id: number
  name: string
  gender: string
  dimensions: DimensionValue[]  // 维度数据
  meetingScene: string
  meetingDate: string
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
  meeting_scene: string
  meeting_date: string
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
    private readonly energyService: RelationshipEnergyService,
  ) {}

  // 转换数据库字段为前端格式
  private dbToMatch(db: DbMatch): Match {
    return {
      id: db.id,
      name: db.name,
      gender: db.gender,
      dimensions: [],  // 从维度表填充
      meetingScene: db.meeting_scene,
      meetingDate: db.meeting_date,
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
   * 从维度表获取维度数据
   */
  private async enrichWithDimensionData(match: Match): Promise<Match> {
    try {
      const client = getSupabaseClient()
      const { data: dimensionValues, error } = await client
        .from('profile_dimension_values')
        .select(`
          dimension_key,
          value,
          layer:dimension_definitions!inner(layer, category, importance, weight)
        `)
        .eq('match_id', match.id)

      if (error) {
        console.error('获取维度数据失败:', error)
        return match
      }

      if (dimensionValues && dimensionValues.length > 0) {
        match.dimensions = dimensionValues.map((dv: any) => ({
          dimension_key: dv.dimension_key,
          value: dv.value,
          layer: dv.layer?.layer || 1,
          category: dv.layer?.category || 'unknown',
          importance: dv.layer?.importance || 'optional',
          weight: dv.layer?.weight || 1,
        }))
      }

      return match
    } catch (error) {
      console.error('enrichWithDimensionData error:', error)
      return match
    }
  }

  /**
   * 创建新对象
   */
  async createMatch(req: Request, body: {
    name: string
    gender?: string
    meetingScene?: string
    meetingDate?: string
    notes?: string
  }) {
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('matches')
      .insert({
        name: body.name,
        gender: body.gender || 'female',
        meeting_scene: body.meetingScene || 'other',
        meeting_date: body.meetingDate,
        notes: body.notes,
      })
      .select()
      .single()

    if (error) {
      return { code: 500, msg: '创建失败', data: null }
    }

    const match = this.dbToMatch(data as DbMatch)
    return { code: 200, msg: '创建成功', data: match }
  }

  /**
   * 获取对象列表
   */
  async getMatches(req: Request, query: {
    status?: string
    page?: number
    pageSize?: number
  }) {
    const client = getSupabaseClient()
    const page = query.page || 1
    const pageSize = query.pageSize || 20
    const offset = (page - 1) * pageSize

    let queryBuilder = client
      .from('matches')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status)
    }

    const { data, count, error } = await queryBuilder

    if (error) {
      return { code: 500, msg: '获取失败', data: null }
    }

    const matches = (data as DbMatch[]).map(this.dbToMatch)

    // 批量获取所有 match 的维度数据
    const matchIds = matches.map(m => m.id)
    const { data: allDimensions } = await client
      .from('profile_dimension_values')
      .select('match_id, dimension_key, value')
      .in('match_id', matchIds)

    // 按维度计算推进值
    const progressScores: Record<number, number> = {}
    for (const match of matches) {
      const matchDimensions = (allDimensions || []).filter(d => d.match_id === match.id)
      progressScores[match.id] = await this.calculateProgressScoreSimple(match.id, matchDimensions.length)
    }

    return {
      code: 200,
      msg: '获取成功',
      data: {
        list: matches.map(m => ({
          ...m,
          progressScore: progressScores[m.id] || 0,
        })),
        total: count || 0,
        page,
        pageSize,
      },
    }
  }

  /**
   * 简化版推进值计算（列表用）
   * 完全基于维度数量估算，不依赖任务
   */
  private async calculateProgressScoreSimple(matchId: number, dimensionCount: number): Promise<number> {
    // 基于维度数量快速估算（假设完整填写大约需要 50+ 个维度）
    // 信息完整度 80 分 + 关键信息掌握度估算 20 分
    const estimatedInfoScore = Math.min(80, Math.round((dimensionCount / 50) * 80))
    
    // 关键信息掌握度估算：假设每 10 个维度中有 2 个关键信息
    const estimatedCriticalCount = Math.floor(dimensionCount / 5)
    const estimatedCriticalScore = Math.min(20, estimatedCriticalCount * 2)
    
    return Math.min(100, estimatedInfoScore + estimatedCriticalScore)
  }

  /**
   * 获取对象详情
   */
  async getMatchById(req?: Request, id?: number) {
    if (!id) return { code: 400, msg: '缺少对象ID', data: null }
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('matches')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return { code: 404, msg: '未找到对象', data: null }
    }

    let match = this.dbToMatch(data as DbMatch)
    
    // 获取维度数据
    match = await this.enrichWithDimensionData(match)
    
    // 获取任务统计
    const taskStats = await this.taskService.getTaskStats(id)
    
    // 计算推进值
    const progressScore = await this.calculateProgressScore(id)
    
    // 获取关系能量
    const energyResult = await this.energyService.getEnergy(id)
    const energy = energyResult.code === 200 ? energyResult.data : null

    return {
      code: 200,
      msg: '获取成功',
      data: {
        ...match,
        stats: taskStats,
        progressScore,
        energy,
      },
    }
  }

  /**
   * 更新对象信息
   */
  async updateMatch(req?: Request, id?: number, body?: Partial<{
    name: string
    gender: string
    meetingScene: string
    meetingDate: string
    notes: string
    status: string
    impression: number
    impressionTags: string[]
  }>) {
    if (!id || !body) return { code: 400, msg: '参数错误', data: null }
    
    const client = getSupabaseClient()

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.gender !== undefined) updateData.gender = body.gender
    if (body.meetingScene !== undefined) updateData.meeting_scene = body.meetingScene
    if (body.meetingDate !== undefined) updateData.meeting_date = body.meetingDate
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.status !== undefined) updateData.status = body.status
    if (body.impression !== undefined) updateData.impression = body.impression
    if (body.impressionTags !== undefined) updateData.impression_tags = body.impressionTags

    const { data, error } = await client
      .from('matches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { code: 500, msg: '更新失败', data: null }
    }

    const match = this.dbToMatch(data as DbMatch)
    return { code: 200, msg: '更新成功', data: match }
  }

  /**
   * 删除对象
   */
  async deleteMatch(req?: Request, id?: number) {
    if (!id) return { code: 400, msg: '缺少对象ID', data: null }
    
    const client = getSupabaseClient()

    const { error } = await client
      .from('matches')
      .delete()
      .eq('id', id)

    if (error) {
      return { code: 500, msg: '删除失败', data: null }
    }

    return { code: 200, msg: '删除成功', data: null }
  }

  /**
   * 计算推进值（基于维度数据）
   * 新算法：
   * - 信息完整度 (60分) - 各层级维度填写率加权
   * - 关键信息掌握度 (20分) - critical 维度填写率
   * - 任务完成率 (20分) - 任务完成情况
   */
  async calculateProgressScore(matchId: number): Promise<ProgressScore> {
    const client = getSupabaseClient()

    // 1. 获取维度定义总数（按层级和重要性分组）
    const { data: allDefinitions } = await client
      .from('dimension_definitions')
      .select('dimension_key, layer, importance, weight, is_active')
      .eq('is_active', true)

    if (!allDefinitions || allDefinitions.length === 0) {
      return this.getDefaultProgressScore()
    }

    // 2. 获取已填写的维度值
    const { data: filledValues } = await client
      .from('profile_dimension_values')
      .select('dimension_key, value')
      .eq('match_id', matchId)

    const filledKeys = new Set(
      (filledValues || [])
        .filter(v => v.value !== null && v.value !== undefined && v.value !== '')
        .map(v => v.dimension_key)
    )

    // 3. 计算各维度分数（完全基于信息完整度）
    const infoScore = this.calculateInfoCompletenessByLayer(allDefinitions, filledKeys)
    const criticalScore = this.calculateCriticalInfoMastery(allDefinitions, filledKeys)

    // 4. 计算总分（信息完整度80分 + 关键信息掌握度20分）
    const total = Math.min(100, Math.max(0, infoScore + criticalScore))

    // 5. 确定当前阶段
    const stage = this.getProgressStage(total)

    // 6. 生成洞察建议
    const insights = this.generateInsights({
      infoScore,
      criticalScore,
    }, filledKeys, allDefinitions)

    // 7. 获取下一步建议
    const nextActions = stage.suggestedActions

    return {
      total,
      stage,
      breakdown: {
        infoCompleteness: infoScore,
        criticalInfoMastery: criticalScore,
        taskCompletion: 0, // 任务完成度不再计入推进值
      },
      insights,
      nextActions,
    }
  }

  /**
   * 计算信息完整度（基于层级）
   * Layer 1: 40分, Layer 2: 20分, Layer 3: 15分, Layer 4: 5分
   * 总计 80 分
   */
  private calculateInfoCompletenessByLayer(
    definitions: any[],
    filledKeys: Set<string>
  ): number {
    // 各层级权重配置（总计80分）
    const layerWeights: Record<number, { maxScore: number; weight: number }> = {
      1: { maxScore: 40, weight: 1.5 },  // 基础档案
      2: { maxScore: 20, weight: 1.2 },  // 性格特质
      3: { maxScore: 15, weight: 1.0 },  // 生活偏好
      4: { maxScore: 5, weight: 0.8 },   // 互动策略
      5: { maxScore: 0, weight: 0.5 },   // 近期状态（不计入）
    }

    let totalScore = 0

    for (const [layer, config] of Object.entries(layerWeights)) {
      const layerNum = parseInt(layer)
      if (config.maxScore === 0) continue

      const layerDefs = definitions.filter(d => d.layer === layerNum)
      if (layerDefs.length === 0) continue

      const filledCount = layerDefs.filter(d => filledKeys.has(d.dimension_key)).length
      const fillRate = filledCount / layerDefs.length

      totalScore += fillRate * config.maxScore
    }

    return Math.round(totalScore * 10) / 10
  }

  /**
   * 计算关键信息掌握度（20分）
   * importance=critical 的维度填写率
   */
  private calculateCriticalInfoMastery(
    definitions: any[],
    filledKeys: Set<string>
  ): number {
    const criticalDefs = definitions.filter(d => d.importance === 'critical')
    if (criticalDefs.length === 0) return 0

    const filledCount = criticalDefs.filter(d => filledKeys.has(d.dimension_key)).length
    const fillRate = filledCount / criticalDefs.length

    return Math.round(fillRate * 20 * 10) / 10
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
    scores: { infoScore: number; criticalScore: number },
    filledKeys: Set<string>,
    definitions: any[]
  ): string[] {
    const insights: string[] = []

    // 信息完整度洞察
    if (scores.infoScore < 20) {
      insights.push('基础信息较少，建议先完善基本档案')
    } else if (scores.infoScore < 40) {
      insights.push('已了解基本信息，可以深入探索性格特质')
    } else if (scores.infoScore < 60) {
      insights.push('信息记录良好，继续深入了解对方')
    }

    // 关键信息洞察
    const criticalDefs = definitions.filter(d => d.importance === 'critical')
    const unfilledCritical = criticalDefs.filter(d => !filledKeys.has(d.dimension_key))
    if (unfilledCritical.length > 0) {
      const examples = unfilledCritical.slice(0, 2).map(d => d.dimension_key)
      insights.push(`关键信息缺失：${examples.join('、')}等`)
    }

    return insights.slice(0, 3)
  }

  /**
   * 获取默认推进值
   */
  private getDefaultProgressScore(): ProgressScore {
    return {
      total: 0,
      stage: progressStages[0],
      breakdown: {
        infoCompleteness: 0,
        criticalInfoMastery: 0,
        taskCompletion: 0,
      },
      insights: ['开始记录信息来推进关系'],
      nextActions: ['了解基本信息', '获取联系方式'],
    }
  }

  /**
   * 更新周期信息
   */
  async updateCycle(req?: Request, id?: number, body?: {
    cycleStartDate?: string
    cycleLength?: number
  }) {
    if (!id || !body) return { code: 400, msg: '参数错误', data: null }
    
    const client = getSupabaseClient()

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (body.cycleStartDate !== undefined) {
      updateData.cycle_start_date = body.cycleStartDate
    }
    if (body.cycleLength !== undefined) {
      updateData.cycle_length = body.cycleLength
    }

    const { data, error } = await client
      .from('matches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { code: 500, msg: '更新失败', data: null }
    }

    return { code: 200, msg: '更新成功', data }
  }

  /**
   * 获取周期信息
   */
  async getCycleInfo(req?: Request, id?: number) {
    if (!id) return { code: 400, msg: '缺少对象ID', data: null }
    
    const client = getSupabaseClient()

    const { data, error } = await client
      .from('matches')
      .select('cycle_start_date, cycle_length')
      .eq('id', id)
      .single()

    if (error || !data) {
      return { code: 404, msg: '未找到对象', data: null }
    }

    const cycleStartDate = (data as any).cycle_start_date
    const cycleLength = (data as any).cycle_length || 28

    if (!cycleStartDate) {
      return {
        code: 200,
        msg: '获取成功',
        data: null,
      }
    }

    // 计算当前周期状态
    const startDate = new Date(cycleStartDate)
    const today = new Date()
    const dayDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const currentDay = (dayDiff % cycleLength) + 1

    // 判断周期阶段
    let phase = 'follicular'
    let phaseName = '卵泡期'
    let description = '精力充沛，适合主动出击'
    const recommendations: string[] = []

    if (currentDay <= 5) {
      phase = 'menstrual'
      phaseName = '月经期'
      description = '身体需要休息，多关心体贴'
      recommendations.push('避免安排体力活动')
      recommendations.push('可以准备热水袋等贴心物品')
      recommendations.push('多问候关心身体状况')
    } else if (currentDay <= 14) {
      phase = 'follicular'
      phaseName = '卵泡期'
      description = '精力充沛，适合主动出击'
      recommendations.push('适合安排约会活动')
      recommendations.push('可以尝试新的话题和互动')
      recommendations.push('对方情绪较为稳定')
    } else if (currentDay <= 17) {
      phase = 'ovulation'
      phaseName = '排卵期'
      description = '魅力高峰期，互动效果最佳'
      recommendations.push('最佳约会时期')
      recommendations.push('适合进行重要对话')
      recommendations.push('注意对方可能更加敏感')
    } else if (currentDay <= 21) {
      phase = 'luteal_early'
      phaseName = '黄体早期'
      description = '情绪稳定，适合日常互动'
      recommendations.push('保持正常互动频率')
      recommendations.push('适合轻松的话题')
    } else if (currentDay <= 25) {
      phase = 'luteal_mid'
      phaseName = '黄体中期'
      description = '可能出现经前症状，需要耐心'
      recommendations.push('多些耐心和理解')
      recommendations.push('避免敏感话题')
      recommendations.push('可以准备一些小惊喜')
    } else {
      phase = 'luteal_late'
      phaseName = '黄体晚期'
      description = '经前症状明显，格外关心'
      recommendations.push('格外关心和体贴')
      recommendations.push('避免安排重要活动')
      recommendations.push('准备应对情绪波动')
    }

    return {
      code: 200,
      msg: '获取成功',
      data: {
        day: currentDay,
        phase,
        phaseName,
        description,
        recommendations,
        cycleLength,
        startDate: cycleStartDate,
      },
    }
  }

  /**
   * 获取推进值详情
   */
  async getProgressDetail(req?: Request, id?: number) {
    if (!id) return { code: 400, msg: '缺少对象ID', data: null }
    const progressScore = await this.calculateProgressScore(id)
    return {
      code: 200,
      msg: '获取成功',
      data: progressScore,
    }
  }

  /**
   * 获取推进值分数（简化版）
   */
  async getProgressValue(req?: Request, id?: number) {
    if (!id) return { code: 400, msg: '缺少对象ID', data: null }
    const progressScore = await this.calculateProgressScore(id)
    return {
      code: 200,
      msg: '获取成功',
      data: progressScore?.total || 0,
    }
  }

  /**
   * 获取推荐建议（基于推进值详情）
   */
  async getRecommendations(req?: Request, id?: number) {
    if (!id) return { code: 400, msg: '缺少对象ID', data: null }
    const progressScore = await this.calculateProgressScore(id)
    return {
      code: 200,
      msg: '获取成功',
      data: progressScore?.nextActions || [],
    }
  }
}
