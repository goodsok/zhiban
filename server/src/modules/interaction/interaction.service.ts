import { Injectable, Inject, forwardRef } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { RelationshipEnergyService } from './relationship-energy.service'

// 互动事件类型
export type InteractionType = 'date' | 'chat' | 'call' | 'video' | 'message' | 'gift' | 'physical' | 'social' | 'other'

// 互动分类
export type InteractionCategory = 'online' | 'offline' | 'hybrid'

// 发起方
export type Initiator = 'self' | 'partner' | 'mutual'

// 心情
export type Mood = 'excellent' | 'good' | 'neutral' | 'awkward' | 'bad'

// 互动事件接口
export interface InteractionEvent {
  id: number
  matchId: number
  interactionType: InteractionType
  interactionCategory: InteractionCategory | null
  startedAt: string | null
  endedAt: string | null
  durationMinutes: number | null
  initiator: Initiator | null
  location: string | null
  locationType: string | null
  title: string | null
  description: string | null
  activities: string[]
  qualityScore: number | null
  mood: Mood | null
  energyChange: number
  breakthroughMoment: string | null
  issuesEncountered: string | null
  newInsights: NewInsight[]
  relatedTaskId: number | null
  chatRecordIds: number[]
  createdAt: string
  updatedAt: string | null
}

// 新发现
export interface NewInsight {
  dimensionKey: string
  value: string | string[]
  source: string
  confidence: number
}

// 创建互动事件 DTO
export interface CreateInteractionDto {
  interactionType: InteractionType
  interactionCategory?: InteractionCategory
  startedAt?: string
  endedAt?: string
  durationMinutes?: number
  initiator?: Initiator
  location?: string
  locationType?: string
  title?: string
  description?: string
  activities?: string[]
  qualityScore?: number
  mood?: Mood
  breakthroughMoment?: string
  issuesEncountered?: string
  relatedTaskId?: number
  chatRecordIds?: number[]
}

// 更新互动事件 DTO
export type UpdateInteractionDto = Partial<CreateInteractionDto>

// 互动类型配置
const INTERACTION_TYPE_CONFIG: Record<InteractionType, {
  label: string
  defaultCategory: InteractionCategory
  energyWeight: number  // 能量贡献权重
  icon: string
}> = {
  date: { label: '约会', defaultCategory: 'offline', energyWeight: 1.0, icon: '💝' },
  chat: { label: '聊天', defaultCategory: 'online', energyWeight: 0.4, icon: '💬' },
  call: { label: '通话', defaultCategory: 'online', energyWeight: 0.5, icon: '📞' },
  video: { label: '视频', defaultCategory: 'online', energyWeight: 0.6, icon: '📹' },
  message: { label: '发消息', defaultCategory: 'online', energyWeight: 0.2, icon: '✉️' },
  gift: { label: '送礼物', defaultCategory: 'offline', energyWeight: 0.7, icon: '🎁' },
  physical: { label: '肢体接触', defaultCategory: 'offline', energyWeight: 0.8, icon: '🤝' },
  social: { label: '聚会', defaultCategory: 'offline', energyWeight: 0.5, icon: '👥' },
  other: { label: '其他', defaultCategory: 'offline', energyWeight: 0.3, icon: '📝' },
}

// 心情对应的质量分数
const MOOD_QUALITY_MAP: Record<Mood, number> = {
  excellent: 90,
  good: 70,
  neutral: 50,
  awkward: 30,
  bad: 10,
}

@Injectable()
export class InteractionService {
  constructor(
    @Inject(forwardRef(() => RelationshipEnergyService))
    private readonly energyService: RelationshipEnergyService,
  ) {}

  /**
   * 获取互动类型配置
   */
  getInteractionTypes() {
    return Object.entries(INTERACTION_TYPE_CONFIG).map(([key, config]) => ({
      type: key as InteractionType,
      label: config.label,
      defaultCategory: config.defaultCategory,
      energyWeight: config.energyWeight,
      icon: config.icon,
    }))
  }

  /**
   * 获取互动事件列表
   */
  async getEventsByMatchId(matchId: number, options?: {
    interactionType?: InteractionType
    limit?: number
    offset?: number
  }) {
    let query = getSupabaseClient()
      .from('interaction_events')
      .select('*', { count: 'exact' })
      .eq('match_id', matchId)
      .order('started_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (options?.interactionType) {
      query = query.eq('interaction_type', options.interactionType)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Get interaction events error:', error)
      return { code: 500, data: null, message: error.message }
    }

    return {
      code: 200,
      data: {
        list: data?.map(this.transformEvent) || [],
        total: count || 0,
      },
      message: 'success',
    }
  }

  /**
   * 获取互动事件详情
   */
  async getEventById(id: number) {
    const { data, error } = await getSupabaseClient()
      .from('interaction_events')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return { code: 404, data: null, message: 'Not found' }
    }

    return {
      code: 200,
      data: this.transformEvent(data),
      message: 'success',
    }
  }

  /**
   * 创建互动事件
   */
  async createEvent(matchId: number, dto: CreateInteractionDto, req: Request) {
    const typeConfig = INTERACTION_TYPE_CONFIG[dto.interactionType]
    
    // 自动计算分类
    const interactionCategory = dto.interactionCategory || typeConfig.defaultCategory
    
    // 计算质量分数
    const qualityScore = dto.qualityScore ?? (dto.mood ? MOOD_QUALITY_MAP[dto.mood] : null)
    
    // 使用新的能量计算方法（时机加成 + 互动组合）
    const energyCalc = await this.energyService.calculateInteractionEnergy(
      matchId,
      dto.interactionType,
      dto.mood || 'neutral',
      !!dto.breakthroughMoment,
      dto.durationMinutes
    )
    
    const energyChange = energyCalc.totalEnergy

    const insertData = {
      match_id: matchId,
      interaction_type: dto.interactionType,
      interaction_category: interactionCategory,
      started_at: dto.startedAt || new Date().toISOString(),
      ended_at: dto.endedAt || null,
      duration_minutes: dto.durationMinutes || null,
      initiator: dto.initiator || null,
      location: dto.location || null,
      location_type: dto.locationType || null,
      title: dto.title || typeConfig.label,
      description: dto.description || null,
      activities: dto.activities || [],
      quality_score: qualityScore,
      mood: dto.mood || null,
      energy_change: energyChange,
      breakthrough_moment: dto.breakthroughMoment || null,
      issues_encountered: dto.issuesEncountered || null,
      new_insights: [],
      related_task_id: dto.relatedTaskId || null,
      chat_record_ids: dto.chatRecordIds || [],
    }

    const { data, error } = await getSupabaseClient()
      .from('interaction_events')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Create interaction event error:', error)
      return { code: 500, data: null, message: error.message }
    }

    // AI 提取新发现
    if (dto.description) {
      try {
        const insights = await this.extractInsights(dto, req)
        if (insights.length > 0) {
          await getSupabaseClient()
            .from('interaction_events')
            .update({ new_insights: insights })
            .eq('id', data.id)
          data.new_insights = insights
        }
      } catch (error) {
        console.error('AI extract insights error:', error)
      }
    }

    // 更新关系能量
    const changeDetail = energyCalc.comboDetected
      ? `互动 + 组合【${energyCalc.comboDetected}】`
      : '互动记录'
    
    await this.energyService.calculateAndUpdateEnergy(
      matchId,
      energyCalc.comboDetected ? 'combo' : 'interaction',
      changeDetail,
      data.id
    )

    // 返回结果包含能量计算详情
    const result = this.transformEvent(data)
    return {
      code: 200,
      data: {
        ...result,
        energyDetail: {
          baseEnergy: energyCalc.baseEnergy,
          qualityMultiplier: energyCalc.qualityMultiplier,
          timingMultiplier: energyCalc.timingMultiplier,
          bonusEnergy: energyCalc.bonusEnergy,
          activeBoosters: energyCalc.activeBoosters,
          activePenalties: energyCalc.activePenalties,
          comboDetected: energyCalc.comboDetected,
        },
      },
      message: 'success',
    }
  }

  /**
   * 更新互动事件
   */
  async updateEvent(id: number, dto: UpdateInteractionDto, req: Request) {
    const { data: existingEvent, error: fetchError } = await getSupabaseClient()
      .from('interaction_events')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingEvent) {
      return { code: 404, data: null, message: 'Not found' }
    }

    // 计算质量分数
    const qualityScore = dto.qualityScore ?? (dto.mood ? MOOD_QUALITY_MAP[dto.mood] : existingEvent.quality_score)
    
    // 重新计算能量变化
    const energyChange = this.calculateEnergyChange(
      dto.interactionType || existingEvent.interaction_type,
      qualityScore,
      dto.durationMinutes ?? existingEvent.duration_minutes
    )

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (dto.interactionType) updateData.interaction_type = dto.interactionType
    if (dto.interactionCategory) updateData.interaction_category = dto.interactionCategory
    if (dto.startedAt !== undefined) updateData.started_at = dto.startedAt
    if (dto.endedAt !== undefined) updateData.ended_at = dto.endedAt
    if (dto.durationMinutes !== undefined) updateData.duration_minutes = dto.durationMinutes
    if (dto.initiator !== undefined) updateData.initiator = dto.initiator
    if (dto.location !== undefined) updateData.location = dto.location
    if (dto.locationType !== undefined) updateData.location_type = dto.locationType
    if (dto.title !== undefined) updateData.title = dto.title
    if (dto.description !== undefined) updateData.description = dto.description
    if (dto.activities !== undefined) updateData.activities = dto.activities
    if (qualityScore !== undefined) updateData.quality_score = qualityScore
    if (dto.mood !== undefined) updateData.mood = dto.mood
    updateData.energy_change = energyChange
    if (dto.breakthroughMoment !== undefined) updateData.breakthrough_moment = dto.breakthroughMoment
    if (dto.issuesEncountered !== undefined) updateData.issues_encountered = dto.issuesEncountered

    const { data, error } = await getSupabaseClient()
      .from('interaction_events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update interaction event error:', error)
      return { code: 500, data: null, message: error.message }
    }

    // 如果更新了描述，重新提取洞察
    if (dto.description && dto.description !== existingEvent.description) {
      try {
        const insights = await this.extractInsights(
          { ...existingEvent, description: dto.description } as CreateInteractionDto,
          req
        )
        if (insights.length > 0) {
          await getSupabaseClient()
            .from('interaction_events')
            .update({ new_insights: insights })
            .eq('id', data.id)
          data.new_insights = insights
        }
      } catch (error) {
        console.error('AI extract insights error:', error)
      }
    }

    return {
      code: 200,
      data: this.transformEvent(data),
      message: 'success',
    }
  }

  /**
   * 删除互动事件
   */
  async deleteEvent(id: number) {
    const { error } = await getSupabaseClient()
      .from('interaction_events')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete interaction event error:', error)
      return { code: 500, data: null, message: error.message }
    }

    return { code: 200, data: null, message: 'success' }
  }

  /**
   * 获取互动统计
   */
  async getInteractionStats(matchId: number) {
    const { data: events, error } = await getSupabaseClient()
      .from('interaction_events')
      .select('*')
      .eq('match_id', matchId)

    if (error) {
      console.error('Get interaction stats error:', error)
      return { code: 500, data: null, message: error.message }
    }

    const stats = {
      totalInteractions: events?.length || 0,
      byType: {} as Record<InteractionType, number>,
      totalDuration: 0,
      avgQualityScore: 0,
      excellentCount: 0,
      goodCount: 0,
      lastInteraction: null as { date: string; type: InteractionType; title: string } | null,
    }

    if (events && events.length > 0) {
      // 按类型统计
      for (const event of events) {
        const type = event.interaction_type as InteractionType
        stats.byType[type] = (stats.byType[type] || 0) + 1
        
        // 统计时长
        if (event.duration_minutes) {
          stats.totalDuration += event.duration_minutes
        }
        
        // 统计质量
        if (event.quality_score) {
          stats.avgQualityScore += event.quality_score
        }
        
        // 统计心情
        if (event.mood === 'excellent') stats.excellentCount++
        if (event.mood === 'good') stats.goodCount++
      }

      // 计算平均质量
      const qualityCount = events.filter(e => e.quality_score).length
      if (qualityCount > 0) {
        stats.avgQualityScore = Math.round(stats.avgQualityScore / qualityCount)
      }

      // 最近互动
      const sortedEvents = [...events].sort((a, b) => {
        const dateA = new Date(a.started_at || a.created_at).getTime()
        const dateB = new Date(b.started_at || b.created_at).getTime()
        return dateB - dateA
      })
      
      if (sortedEvents.length > 0) {
        const last = sortedEvents[0]
        stats.lastInteraction = {
          date: last.started_at || last.created_at,
          type: last.interaction_type,
          title: last.title || INTERACTION_TYPE_CONFIG[last.interaction_type as InteractionType].label,
        }
      }
    }

    return {
      code: 200,
      data: stats,
      message: 'success',
    }
  }

  /**
   * 计算能量变化
   */
  private calculateEnergyChange(
    interactionType: InteractionType,
    qualityScore: number | null | undefined,
    durationMinutes: number | null | undefined
  ): number {
    const typeConfig = INTERACTION_TYPE_CONFIG[interactionType]
    let energy = 0

    // 基础能量 = 类型权重 × 10
    energy += typeConfig.energyWeight * 10

    // 质量加成
    if (qualityScore) {
      const qualityBonus = (qualityScore - 50) / 10 // -5 到 +5
      energy += qualityBonus * typeConfig.energyWeight
    }

    // 时长加成（仅对需要时长的互动类型）
    if (durationMinutes && ['date', 'call', 'video', 'chat'].includes(interactionType)) {
      const durationBonus = Math.min(durationMinutes / 60, 2) // 最多 +2
      energy += durationBonus * typeConfig.energyWeight
    }

    return Math.round(energy * 10) / 10
  }

  /**
   * AI 提取洞察
   */
  private async extractInsights(
    data: CreateInteractionDto,
    req: Request
  ): Promise<NewInsight[]> {
    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const prompt = this.buildExtractPrompt(data)

      const messages = [
        {
          role: 'system' as const,
          content: `你是一位专业的约会顾问，擅长从互动记录中提取有价值的信息，帮助用户更好地了解对方。

你需要提取关于对方的维度信息，包括但不限于：
- 兴趣爱好（hobbies）
- 饮食偏好（foodPreferences）
- 宠物情况（petPreferences）
- 音乐偏好（favoriteMusic）
- 电影偏好（favoriteMovies）
- 运动偏好（sportsPreferences）
- 旅行偏好（travelPreferences）
- 家庭情况（familyStructure）
- 工作相关（occupation, company）
- 性格特点（性格特质相关的维度）
- 价值观（coreValues）
- 其他可以记录的个人属性

请以JSON数组格式返回：
[
  {
    "dimensionKey": "维度key",
    "value": "提取的值",
    "source": "来源描述",
    "confidence": 0.9
  }
]

注意：
- confidence表示置信度，范围0-1
- 只提取明确提到的信息，不要推测
- value可以是字符串或字符串数组`,
        },
        {
          role: 'user' as const,
          content: prompt,
        },
      ]

      const response = await client.invoke(messages, { model: 'doubao-seed-2-0-pro-260215', temperature: 0.3 })
      return this.parseInsightsResponse(response.content)
    } catch (error) {
      console.error('AI extract insights error:', error)
      return []
    }
  }

  private buildExtractPrompt(data: CreateInteractionDto): string {
    const typeConfig = INTERACTION_TYPE_CONFIG[data.interactionType]
    const moodLabels: Record<Mood, string> = {
      excellent: '非常愉快',
      good: '比较愉快',
      neutral: '一般',
      awkward: '有点尴尬',
      bad: '不太愉快',
    }

    let prompt = `请从以下互动记录中提取关于对方的维度信息：

【互动类型】${typeConfig.label}
【时间】${data.startedAt || '未知'}
${data.location ? `【地点】${data.location}` : ''}
${data.title ? `【标题】${data.title}` : ''}
${data.activities?.length ? `【活动】${data.activities.join('、')}` : ''}
${data.mood ? `【感受】${moodLabels[data.mood]}` : ''}

【详细描述】
${data.description || '无'}

请提取互动中透露的关于对方的关键信息。`

    return prompt
  }

  private parseInsightsResponse(content: string): NewInsight[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed.map((item: Record<string, unknown>) => ({
          dimensionKey: String(item.dimensionKey || ''),
          value: item.value as string | string[],
          source: String(item.source || ''),
          confidence: Number(item.confidence) || 0.8,
        })).filter((item: NewInsight) => item.dimensionKey)
      }
    } catch {
      // 解析失败
    }
    
    return []
  }

  /**
   * 转换数据库记录为接口格式
   */
  private transformEvent(data: Record<string, unknown>): InteractionEvent {
    return {
      id: data.id as number,
      matchId: data.match_id as number,
      interactionType: data.interaction_type as InteractionType,
      interactionCategory: data.interaction_category as InteractionCategory | null,
      startedAt: data.started_at as string | null,
      endedAt: data.ended_at as string | null,
      durationMinutes: data.duration_minutes as number | null,
      initiator: data.initiator as Initiator | null,
      location: data.location as string | null,
      locationType: data.location_type as string | null,
      title: data.title as string | null,
      description: data.description as string | null,
      activities: (data.activities as string[]) || [],
      qualityScore: data.quality_score as number | null,
      mood: data.mood as Mood | null,
      energyChange: data.energy_change as number,
      breakthroughMoment: data.breakthrough_moment as string | null,
      issuesEncountered: data.issues_encountered as string | null,
      newInsights: (data.new_insights as NewInsight[]) || [],
      relatedTaskId: data.related_task_id as number | null,
      chatRecordIds: (data.chat_record_ids as number[]) || [],
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string | null,
    }
  }
}
