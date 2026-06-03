/**
 * 画像引擎核心服务
 * 
 * 所有画像数据从用户档案维度（profile_dimension_values）读取
 * 不再依赖手动填写和聊天截图上传
 */

import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import {
  FullPortrait,
  PortraitDimensions,
  BehaviorPattern,
  ChatRecordAnalysisResult,
  TrendPredictionResult,
  StrategyRecommendationResult,
  UserPortraitSummary,
  InteractionStyle,
} from './types/portrait.types'
import { PortraitCalculator } from './analyzers/portrait-calculator'
import { ChatRecordAnalyzer } from './analyzers/chat-record.analyzer'
import { BehaviorPatternAnalyzer } from './analyzers/behavior-pattern.analyzer'
import { TrendPredictor, TrendPredictionInput } from './predictors/trend-predictor'
import { StrategyRecommender, StrategyRecommendationInput } from './predictors/strategy-recommender'
import { InsightAnalyzer, InsightAnalysisResult } from './analyzers/insight.analyzer'

/** 维度值到画像数值的映射规则 */
const DIMENSION_TO_PORTRAIT_MAP: Record<string, {
  category: 'personality' | 'emotional' | 'social' | 'communication'
  field: string
  valueMap?: Record<string, number>
  numericScale?: { min: number; max: number; targetMin: number; targetMax: number }
  inverted?: boolean
}> = {
  // 人格维度
  opennessLevel: { category: 'personality', field: 'openness', numericScale: { min: 0, max: 100, targetMin: 0, targetMax: 100 } },
  conscientiousnessLevel: { category: 'personality', field: 'conscientiousness', numericScale: { min: 0, max: 100, targetMin: 0, targetMax: 100 } },
  extroversionLevel: { category: 'personality', field: 'extraversion', numericScale: { min: 0, max: 100, targetMin: 0, targetMax: 100 } },
  agreeablenessLevel: { category: 'personality', field: 'agreeableness', numericScale: { min: 0, max: 100, targetMin: 0, targetMax: 100 } },
  emotionalStabilityLevel: { category: 'personality', field: 'neuroticism', numericScale: { min: 0, max: 100, targetMin: 0, targetMax: 100 }, inverted: true },

  // 情感维度
  emotionalAvailabilityLevel: { category: 'emotional', field: 'stability', valueMap: {
    mostly_available: 80, sometimes_available: 50, rarely_available: 25, unavailable: 10,
  }},
  emotionalExpressionStyle: { category: 'emotional', field: 'expression', valueMap: {
    expressive: 85, moderate: 60, reserved: 35, avoidant: 20,
  }},
  empathyLevel: { category: 'emotional', field: 'empathy', numericScale: { min: 0, max: 100, targetMin: 0, targetMax: 100 } },
  intimacyNeeds: { category: 'emotional', field: 'independence', numericScale: { min: 0, max: 100, targetMin: 100, targetMax: 0 }, inverted: true },

  // 社交维度
  socialEnergy: { category: 'social', field: 'activity', valueMap: {
    high: 90, moderate: 60, low: 30, very_low: 15,
  }},
  socialInitiative: { category: 'social', field: 'initiative', valueMap: {
    initiator: 90, balanced: 55, responder: 30, passive: 15,
  }},
  trustLevel: { category: 'social', field: 'trust', numericScale: { min: 0, max: 100, targetMin: 0, targetMax: 100 } },

  // 沟通维度
  communicationStyleOnline: { category: 'communication', field: 'directness', valueMap: {
    direct: 90, playful: 60, rational: 55, gentle: 40, indirect: 25, varied: 50,
  }},
  communicationStyleOffline: { category: 'communication', field: 'directness_offline', valueMap: {
    direct: 90, playful: 60, rational: 55, gentle: 40, indirect: 25, varied: 50,
  }},
  textingStyle: { category: 'communication', field: 'humor', valueMap: {
    expressive: 80, moderate: 55, minimal: 30, emoji_heavy: 75,
  }},
  responseTimeExpectation: { category: 'communication', field: 'responsiveness', valueMap: {
    instant: 95, within_hour: 80, within_day: 55, within_week: 30, no_expectation: 20,
  }},
  listeningStyle: { category: 'communication', field: 'depth', valueMap: {
    active_listener: 85, advice_giver: 60, empathetic: 75, distracted: 30, problem_solver: 55,
  }},
}

// 带 inverted 标记的类型扩展
type DimensionMapping = typeof DIMENSION_TO_PORTRAIT_MAP[string] & { inverted?: boolean }

@Injectable()
export class PortraitEngineService {
  constructor(
    private readonly calculator: PortraitCalculator,
    private readonly chatRecordAnalyzer: ChatRecordAnalyzer,
    private readonly behaviorAnalyzer: BehaviorPatternAnalyzer,
    private readonly trendPredictor: TrendPredictor,
    private readonly strategyRecommender: StrategyRecommender,
    private readonly insightAnalyzer: InsightAnalyzer,
  ) {}

  // ==================== 画像数据管理 ====================

  /**
   * 从维度数据计算画像并写回 profile_portraits
   * 核心管道：profile_dimension_values → 映射计算 → profile_portraits
   */
  private async updateDimensionsFromProfile(matchId: number): Promise<void> {
    const client = getSupabaseClient()

    // 获取该 match 的所有维度值
    const { data: dimensionValues } = await client
      .from('profile_dimension_values')
      .select('dimension_key, value')
      .eq('match_id', matchId)

    if (!dimensionValues || dimensionValues.length === 0) return

    // 将维度值转为 Map 便于查找
    const valueMap = new Map<string, unknown>()
    for (const dv of dimensionValues) {
      const val = dv.value
      // value 是 jsonb，可能是数字、字符串或数组
      if (typeof val === 'number' || typeof val === 'string') {
        valueMap.set(dv.dimension_key, val)
      } else if (Array.isArray(val) && val.length > 0) {
        valueMap.set(dv.dimension_key, val)
      }
    }

    // 映射计算画像维度
    const dimensions: Partial<PortraitDimensions> = {
      personality: { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 },
      emotional: { stability: 0, expression: 0, empathy: 0, independence: 0 },
      social: { activity: 0, initiative: 0, intimacy: 0, trust: 0 },
      communication: { directness: 0, responsiveness: 0, humor: 0, depth: 0 },
    }

    const filledDimensionKeys: string[] = []

    for (const [dimKey, mapping] of Object.entries(DIMENSION_TO_PORTRAIT_MAP)) {
      const rawValue = valueMap.get(dimKey)
      if (rawValue === undefined || rawValue === null) continue

      const mappedValue = this.mapDimensionValue(rawValue, mapping as DimensionMapping)
      if (mappedValue === undefined) continue

      const category = mapping.category as keyof PortraitDimensions
      const field = mapping.field as string

      // 特殊处理：directness_offline 不覆盖 directness，仅做参考
      if (field === 'directness_offline') {
        // 如果 online 和 offline 都有值，取平均
        if (dimensions.communication!.directness !== undefined) {
          dimensions.communication!.directness = Math.round((dimensions.communication!.directness + mappedValue) / 2)
        }
        continue
      }

      if (dimensions[category] && field in dimensions[category]!) {
        (dimensions[category] as unknown as Record<string, number | undefined>)[field] = mappedValue
        filledDimensionKeys.push(dimKey)
      }
    }

    // 计算置信度：基于填写的维度比例
    const totalMappedDims = Object.keys(DIMENSION_TO_PORTRAIT_MAP).length
    const filledCount = filledDimensionKeys.length
    const confidence = Math.min(95, Math.round((filledCount / totalMappedDims) * 100))

    // 计算互动风格
    const socialInitiative = dimensions.social?.initiative
    let interactionStyle: string = 'balanced'
    if (socialInitiative !== undefined) {
      if (socialInitiative >= 65) interactionStyle = 'active'
      else if (socialInitiative <= 35) interactionStyle = 'passive'
    }

    // 提取活跃时段和话题偏好
    const activeTimeSlots = this.extractTimeSlotsFromDimensions(valueMap)
    const preferredTopicTypes = this.extractTopicsFromDimensions(valueMap)

    // 写回 profile_portraits
    const updateData: Record<string, unknown> = {
      confidence,
      interaction_style: interactionStyle,
      updated_at: new Date().toISOString(),
    }

    if (dimensions.personality) {
      const p = dimensions.personality
      if (p.openness !== undefined) updateData.personality_openness = p.openness
      if (p.conscientiousness !== undefined) updateData.personality_conscientiousness = p.conscientiousness
      if (p.extraversion !== undefined) updateData.personality_extraversion = p.extraversion
      if (p.agreeableness !== undefined) updateData.personality_agreeableness = p.agreeableness
      if (p.neuroticism !== undefined) updateData.personality_neuroticism = p.neuroticism
    }
    if (dimensions.emotional) {
      const e = dimensions.emotional
      if (e.stability !== undefined) updateData.emotional_stability = e.stability
      if (e.expression !== undefined) updateData.emotional_expression = e.expression
      if (e.empathy !== undefined) updateData.emotional_empathy = e.empathy
      if (e.independence !== undefined) updateData.emotional_independence = e.independence
    }
    if (dimensions.social) {
      const s = dimensions.social
      if (s.activity !== undefined) updateData.social_activity = s.activity
      if (s.initiative !== undefined) updateData.social_initiative = s.initiative
      if (s.intimacy !== undefined) updateData.social_intimacy = s.intimacy
      if (s.trust !== undefined) updateData.social_trust = s.trust
    }
    if (dimensions.communication) {
      const c = dimensions.communication
      if (c.directness !== undefined) updateData.communication_directness = c.directness
      if (c.responsiveness !== undefined) updateData.communication_responsiveness = c.responsiveness
      if (c.humor !== undefined) updateData.communication_humor = c.humor
      if (c.depth !== undefined) updateData.communication_depth = c.depth
    }

    if (activeTimeSlots.length > 0) updateData.active_time_slots = activeTimeSlots
    if (preferredTopicTypes.length > 0) updateData.preferred_topic_types = preferredTopicTypes

    // 获取旧画像用于记录变化
    const { data: oldPortrait } = await client
      .from('profile_portraits')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle()

    await client
      .from('profile_portraits')
      .upsert({
        match_id: matchId,
        ...updateData,
      }, { onConflict: 'match_id' })

    // 记录维度变化到历史
    if (oldPortrait) {
      const oldDimensions = this.extractDimensions(oldPortrait)
      this.recordDimensionChanges(matchId, oldDimensions, dimensions, 'manual')
    }
  }

  /**
   * 映射维度值到画像数值（0-100）
   */
  private mapDimensionValue(rawValue: unknown, mapping: DimensionMapping): number | undefined {
    if (mapping.valueMap && typeof rawValue === 'string') {
      return mapping.valueMap[rawValue]
    }

    if (mapping.numericScale && typeof rawValue === 'number') {
      const { min, max, targetMin, targetMax } = mapping.numericScale
      if (max === min) return targetMin
      let result = targetMin + ((rawValue - min) / (max - min)) * (targetMax - targetMin)
      if (mapping.inverted) {
        result = targetMax - (result - targetMin) + targetMin
        // inverted 意味着反转：高值变低值
        result = targetMax - (result - targetMin)
      }
      return Math.round(Math.max(targetMin, Math.min(targetMax, result)))
    }

    return undefined
  }

  /**
   * 从维度数据提取活跃时段
   */
  private extractTimeSlotsFromDimensions(valueMap: Map<string, unknown>): string[] {
    const slots: string[] = []
    const wakeUp = valueMap.get('wakeUpTime')
    const sleep = valueMap.get('sleepTime')
    const weekend = valueMap.get('weekendPreferences')

    if (typeof wakeUp === 'number' && wakeUp >= 12) slots.push('night')
    if (typeof wakeUp === 'number' && wakeUp <= 7) slots.push('morning')
    if (typeof sleep === 'number' && sleep >= 23) slots.push('night')
    if (weekend === 'homebody') { slots.push('evening'); slots.push('night') }
    if (weekend === 'social_butterfly') { slots.push('afternoon'); slots.push('evening') }
    if (weekend === 'adventurer') { slots.push('morning'); slots.push('afternoon') }

    return [...new Set(slots)]
  }

  /**
   * 从维度数据提取话题偏好
   */
  private extractTopicsFromDimensions(valueMap: Map<string, unknown>): string[] {
    const topics: string[] = []
    const hobbies = valueMap.get('hobbies')
    if (Array.isArray(hobbies)) topics.push(...hobbies.map(String))
    const sports = valueMap.get('sportsPreferences')
    if (Array.isArray(sports)) topics.push(...sports.map(String))
    const music = valueMap.get('favoriteMusic')
    if (Array.isArray(music)) topics.push(...music.map(String))
    return [...new Set(topics)]
  }

  /**
   * 记录维度变化历史
   */
  private async recordDimensionChanges(
    matchId: number,
    oldDimensions: PortraitDimensions,
    newDimensions: Partial<PortraitDimensions>,
    reason: 'chat_analysis' | 'behavior_update' | 'manual'
  ): Promise<void> {
    const client = getSupabaseClient()
    const changes: Array<{ dimension: string; oldValue: number; newValue: number }> = []

    const dimGroups = [
      { prefix: '性格', group: newDimensions.personality, old: oldDimensions.personality },
      { prefix: '情感', group: newDimensions.emotional, old: oldDimensions.emotional },
      { prefix: '社交', group: newDimensions.social, old: oldDimensions.social },
      { prefix: '沟通', group: newDimensions.communication, old: oldDimensions.communication },
    ]

    for (const { prefix, group, old } of dimGroups) {
      if (!group) continue
      for (const [key, newVal] of Object.entries(group)) {
        if (newVal === undefined) continue
        const oldVal = (old as unknown as Record<string, number>)[key]
        if (oldVal !== newVal) {
          changes.push({ dimension: `${prefix}.${key}`, oldValue: oldVal, newValue: newVal })
        }
      }
    }

    if (changes.length > 0) {
      const records = changes.map(c => ({
        match_id: matchId,
        dimension: c.dimension,
        old_value: c.oldValue,
        new_value: c.newValue,
        change_reason: reason,
        evidence: '数据来源: 档案维度更新',
      }))
      await client.from('profile_histories').insert(records)
    }
  }

  /**
   * 重新分析画像
   * 基于档案维度数据重新计算画像
   */
  async reanalyzePortrait(matchId: number, request: Request): Promise<FullPortrait> {
    await this.updateDimensionsFromProfile(matchId)
    return this.getOrCreatePortrait(matchId)
  }

  /**
   * 获取或创建画像
   */
  async getOrCreatePortrait(matchId: number): Promise<FullPortrait> {
    const client = getSupabaseClient()

    // 先尝试更新画像（从维度数据同步）
    await this.updateDimensionsFromProfile(matchId)

    // 获取画像数据
    const { data: portrait } = await client
      .from('profile_portraits')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle()

    // 获取维度填写统计
    const { count: filledCount } = await client
      .from('profile_dimension_values')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)

    const { count: totalCount } = await client
      .from('dimension_definitions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // 获取维度值中的线上/线下沟通风格
    const { data: commStyles } = await client
      .from('profile_dimension_values')
      .select('dimension_key, value')
      .eq('match_id', matchId)
      .in('dimension_key', ['communicationStyleOnline', 'communicationStyleOffline'])

    const onlineStyle = commStyles?.find(d => d.dimension_key === 'communicationStyleOnline')?.value as string | undefined
    const offlineStyle = commStyles?.find(d => d.dimension_key === 'communicationStyleOffline')?.value as string | undefined

    // 获取历史记录
    const { data: history } = await client
      .from('profile_histories')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (portrait) {
      return this.dbToFullPortrait(
        portrait,
        history || [],
        filledCount || 0,
        totalCount || 0,
        onlineStyle || undefined,
        offlineStyle || undefined,
      )
    }

    // 创建默认画像
    return this.createDefaultPortrait(matchId, filledCount || 0, totalCount || 0)
  }

  /**
   * 创建默认画像
   */
  private async createDefaultPortrait(matchId: number, filledCount: number, totalCount: number): Promise<FullPortrait> {
    const client = getSupabaseClient()

    const { data: newPortrait } = await client
      .from('profile_portraits')
      .insert({
        match_id: matchId,
        confidence: 0,
      })
      .select()
      .single()

    return this.dbToFullPortrait(
      newPortrait,
      [],
      filledCount,
      totalCount,
      undefined,
      undefined,
    )
  }

  // ==================== 预测与推荐 ====================

  /**
   * 预测关系趋势
   */
  async predictRelationshipTrend(
    matchId: number,
    userPortrait: UserPortraitSummary | null,
    request: Request
  ): Promise<TrendPredictionResult> {
    const portrait = await this.getOrCreatePortrait(matchId)
    const client = getSupabaseClient()

    // 获取关系上下文
    const { data: relationshipData } = await client
      .from('profile_dimension_values')
      .select('dimension_key, value')
      .in('dimension_key', ['interactionStatus', 'relationshipStage'])
      .eq('match_id', matchId)

    const interactionStatus = relationshipData?.find(d => d.dimension_key === 'interactionStatus')?.value as string || 'unknown'
    const relationshipStage = relationshipData?.find(d => d.dimension_key === 'relationshipStage')?.value as string || 'unknown'

    const input: TrendPredictionInput = {
      targetDimensions: portrait.dimensions,
      targetBehavior: portrait.behaviorPattern,
      userPortrait: userPortrait || null,
      relationshipContext: { interactionStatus, relationshipStage },
      dataSourceInfo: { hasChatRecords: false, dataSource: 'dimension' },
      request,
    }
    return this.trendPredictor.predict(input)
  }

  /**
   * 推荐互动策略
   */
  async recommendInteractionStrategy(
    matchId: number,
    userPortrait: UserPortraitSummary | null,
    request: Request
  ): Promise<StrategyRecommendationResult> {
    const portrait = await this.getOrCreatePortrait(matchId)
    const client = getSupabaseClient()

    // 获取关系上下文
    const { data: relationshipData } = await client
      .from('profile_dimension_values')
      .select('dimension_key, value')
      .in('dimension_key', ['interactionStatus', 'relationshipStage'])
      .eq('match_id', matchId)

    const interactionStatus = relationshipData?.find(d => d.dimension_key === 'interactionStatus')?.value as string || 'unknown'
    const relationshipStage = relationshipData?.find(d => d.dimension_key === 'relationshipStage')?.value as string || 'unknown'

    const { data: match } = await client
      .from('matches')
      .select('name')
      .eq('id', matchId)
      .single()

    const input: StrategyRecommendationInput = {
      targetDimensions: portrait.dimensions,
      targetBehavior: portrait.behaviorPattern,
      userPortrait: userPortrait || null,
      relationshipContext: { interactionStatus, relationshipStage },
      matchInfo: { name: match?.name || '未知' },
      dataSourceInfo: { hasChatRecords: false, dataSource: 'dimension' },
      request,
    }
    return this.strategyRecommender.predict(input)
  }

  /**
   * 获取画像趋势
   */
  async getPortraitTrends(matchId: number): Promise<Record<string, Array<{ date: string; value: number }>>> {
    const client = getSupabaseClient()

    const { data: history } = await client
      .from('profile_histories')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    const trends: Record<string, Array<{ date: string; value: number }>> = {}

    ;(history || []).forEach((record) => {
      if (!trends[record.dimension]) {
        trends[record.dimension] = []
      }
      trends[record.dimension].push({
        date: record.created_at,
        value: record.new_value,
      })
    })

    return trends
  }

  /**
   * 计算匹配度
   */
  calculateCompatibility(
    userDimensions: Partial<PortraitDimensions>,
    targetDimensions: Partial<PortraitDimensions>
  ): number {
    return this.calculator.calculateCompatibility(userDimensions, targetDimensions)
  }

  // ==================== 数据转换 ====================

  /**
   * 数据库格式转换为完整画像
   */
  private dbToFullPortrait(
    portrait: Record<string, unknown> | null,
    history: Array<Record<string, unknown>>,
    dimensionFilledCount: number,
    dimensionTotalCount: number,
    communicationStyleOnline?: string,
    communicationStyleOffline?: string,
  ): FullPortrait {
    return {
      dimensions: this.extractDimensions(portrait),
      behaviorPattern: this.buildBehaviorPattern(portrait, communicationStyleOnline, communicationStyleOffline),
      interactionStyle: (portrait?.interaction_style as InteractionStyle) || 'balanced',
      preferredTopicTypes: (portrait?.preferred_topic_types as string[]) || [],
      activeTimeSlots: (portrait?.active_time_slots as string[]) || [],
      confidence: (portrait?.confidence as number) || 0,
      history: history.map(h => ({
        id: h.id as number,
        matchId: h.match_id as number,
        dimension: h.dimension as string,
        oldValue: h.old_value as number,
        newValue: h.new_value as number,
        changeReason: h.change_reason as 'chat_analysis' | 'behavior_update' | 'manual',
        evidence: h.evidence as string | null,
        createdAt: h.created_at as string,
      })),
      lastUpdated: (portrait?.updated_at as string) || new Date().toISOString(),
      dimensionFilledCount,
      dimensionTotalCount,
    }
  }

  /**
   * 提取画像维度
   */
  private extractDimensions(portrait: Record<string, unknown> | null): PortraitDimensions {
    return {
      personality: {
        openness: (portrait?.personality_openness as number) || 50,
        conscientiousness: (portrait?.personality_conscientiousness as number) || 50,
        extraversion: (portrait?.personality_extraversion as number) || 50,
        agreeableness: (portrait?.personality_agreeableness as number) || 50,
        neuroticism: (portrait?.personality_neuroticism as number) || 50,
      },
      emotional: {
        stability: (portrait?.emotional_stability as number) || 50,
        expression: (portrait?.emotional_expression as number) || 50,
        empathy: (portrait?.emotional_empathy as number) || 50,
        independence: (portrait?.emotional_independence as number) || 50,
      },
      social: {
        activity: (portrait?.social_activity as number) || 50,
        initiative: (portrait?.social_initiative as number) || 50,
        intimacy: (portrait?.social_intimacy as number) || 50,
        trust: (portrait?.social_trust as number) || 50,
      },
      communication: {
        directness: (portrait?.communication_directness as number) || 50,
        responsiveness: (portrait?.communication_responsiveness as number) || 50,
        humor: (portrait?.communication_humor as number) || 50,
        depth: (portrait?.communication_depth as number) || 50,
      },
    }
  }

  /**
   * 从画像数据构建行为模式
   * 行为模式现在从画像维度数据推断，而非从聊天记录
   */
  private buildBehaviorPattern(
    portrait: Record<string, unknown> | null,
    communicationStyleOnline?: string,
    communicationStyleOffline?: string,
  ): BehaviorPattern {
    const dims = this.extractDimensions(portrait)

    // 从活跃时段推断
    const activeTimeSlots = (portrait?.active_time_slots as string[]) || []
    const activeHours: Record<string, number> = {}
    for (const slot of activeTimeSlots) {
      const hourMap: Record<string, number[]> = {
        morning: [7, 8, 9, 10],
        afternoon: [12, 13, 14, 15],
        evening: [18, 19, 20, 21],
        night: [22, 23, 0, 1],
      }
      for (const h of hourMap[slot] || []) {
        activeHours[String(h)] = 1
      }
    }

    // 从话题推断
    const topicTypes = (portrait?.preferred_topic_types as string[]) || []
    const topicCategories: Record<string, number> = {}
    for (const t of topicTypes) {
      topicCategories[t] = 1
    }

    // 从维度值推断行为指标
    const initiativeRate = dims.social.initiative
    const emojiRate = Math.round((dims.communication.humor + dims.emotional.expression) / 2)

    return {
      dataSource: 'dimension',
      avgResponseTime: this.estimateResponseTime(dims.communication.responsiveness),
      responseTimeVariance: null,
      activeHours,
      activeDays: {},
      messageLengthAvg: null,
      emojiUsageRate: emojiRate,
      questionRate: Math.round(dims.communication.depth * 0.5),
      initiativeRate,
      topicCategories,
      emotionalKeywords: [],
      totalInteractions: 0,
      communicationStyleOnline: (communicationStyleOnline as BehaviorPattern['communicationStyleOnline']) || undefined,
      communicationStyleOffline: (communicationStyleOffline as BehaviorPattern['communicationStyleOffline']) || undefined,
    }
  }

  /**
   * 从响应速度维度值估算回复时间（分钟）
   */
  private estimateResponseTime(responsiveness: number): number | null {
    if (responsiveness >= 90) return 1   // 秒回
    if (responsiveness >= 75) return 10  // 很快
    if (responsiveness >= 55) return 30  // 正常
    if (responsiveness >= 35) return 120 // 较慢
    return 480 // 很慢
  }

  // ==================== 互动策略推荐 ====================

  /**
   * 获取互动策略推荐
   */
  async getInteractionStrategy(
    matchId: number,
    userPortrait: UserPortraitSummary | null,
    request: Request,
  ): Promise<StrategyRecommendationResult> {
    // 复用 getOrCreatePortrait 获取完整画像
    const fullPortrait = await this.getOrCreatePortrait(matchId)
    const client = getSupabaseClient()

    // 获取匹配信息
    const { data: match } = await client
      .from('matches')
      .select('name')
      .eq('id', matchId)
      .single()

    // 获取关系上下文
    const { data: relationshipData } = await client
      .from('profile_dimension_values')
      .select('dimension_key, value')
      .in('dimension_key', ['interactionStatus', 'relationshipStage'])
      .eq('match_id', matchId)

    const interactionStatus = relationshipData?.find(d => d.dimension_key === 'interactionStatus')?.value as string || 'unknown'
    const relationshipStage = relationshipData?.find(d => d.dimension_key === 'relationshipStage')?.value as string || 'unknown'

    return this.strategyRecommender.predict({
      targetDimensions: fullPortrait.dimensions,
      targetBehavior: fullPortrait.behaviorPattern,
      userPortrait,
      relationshipContext: { interactionStatus, relationshipStage },
      matchInfo: { name: match?.name || '未知' },
      dataSourceInfo: { hasChatRecords: false, dataSource: 'dimension' },
      request,
    })
  }

  // ==================== AI 深度洞察 ====================

  /**
   * 生成深度洞察分析
   */
  async generateInsight(
    matchId: number,
    request: Request,
    forceRefresh = false
  ): Promise<InsightAnalysisResult> {
    return this.insightAnalyzer.analyze(matchId, request, forceRefresh)
  }
}
