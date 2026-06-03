/**
 * 画像引擎核心服务
 * 
 * 整合各分析器和预测器，提供统一的画像能力
 */

import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import {
  FullPortrait,
  PortraitDimensions,
  BehaviorPattern,
  DataSourceStatus,
  ChatRecordAnalysisResult,
  TrendPredictionResult,
  StrategyRecommendationResult,
  UserPortraitSummary,
  ManualBehaviorData,
  InteractionStyle,
} from './types/portrait.types'
import { PortraitCalculator } from './analyzers/portrait-calculator'
import { ChatRecordAnalyzer } from './analyzers/chat-record.analyzer'
import { BehaviorPatternAnalyzer } from './analyzers/behavior-pattern.analyzer'
import { TrendPredictor, TrendPredictionInput } from './predictors/trend-predictor'
import { StrategyRecommender, StrategyRecommendationInput } from './predictors/strategy-recommender'
import { InsightAnalyzer, InsightAnalysisResult } from './analyzers/insight.analyzer'

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
   * 从行为模式计算画像维度并写回 profile_portraits
   * 这是整个分析管道的关键步骤：behavior_patterns → PortraitCalculator → profile_portraits
   */
  private async updateDimensionsFromBehavior(matchId: number): Promise<void> {
    const client = getSupabaseClient()

    // 获取行为模式数据
    const { data: behavior } = await client
      .from('behavior_patterns')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle()

    if (!behavior) return

    const behaviorPattern = this.dbToBehaviorPattern(behavior)

    // 如果没有任何有效行为数据（没有回复时间、没有活跃时段），跳过
    const hasValidData = behaviorPattern.avgResponseTime !== null ||
      (behaviorPattern.activeHours && Object.keys(behaviorPattern.activeHours).length > 0) ||
      (behaviorPattern.topicCategories && Object.keys(behaviorPattern.topicCategories).length > 0)
    if (!hasValidData) return

    // 获取手动数据（用于合并计算）
    const { data: manualData } = await client
      .from('manual_behavior_data')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle()

    // 计算画像维度
    let dimensions: Partial<PortraitDimensions>
    if (manualData) {
      // 有手动数据，合并计算（无论是否有聊天记录）
      dimensions = this.calculator.mergeFromSources(
        behaviorPattern,
        {
          responseSpeed: manualData.response_speed,
          activeTimeSlots: manualData.active_time_slots || [],
          topicPreferences: manualData.topic_preferences || [],
          communicationStyle: manualData.communication_style,
          emotionalExpression: manualData.emotional_expression,
          socialInitiative: manualData.social_initiative,
          notes: manualData.notes,
        }
      )
    } else {
      // 仅聊天记录数据
      dimensions = this.calculator.calculateFromBehavior(behaviorPattern)
    }

    // 计算置信度
    const { count: chatRecordCount } = await client
      .from('chat_records')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('analysis_status', 'completed')

    const confidence = this.calculator.calculateConfidence(
      {
        hasChatRecords: (chatRecordCount || 0) > 0,
        hasManualData: !!manualData,
        chatRecordCount: chatRecordCount || 0,
      },
      behaviorPattern
    )

    // 计算互动风格
    const interactionStyle = this.calculateInteractionStyle(behavior)

    // 写回 profile_portraits
    const updateData: Record<string, unknown> = {
      confidence,
      interaction_style: interactionStyle,
      updated_at: new Date().toISOString(),
    }

    if (dimensions.personality) {
      if (dimensions.personality.openness !== undefined) updateData.personality_openness = dimensions.personality.openness
      if (dimensions.personality.conscientiousness !== undefined) updateData.personality_conscientiousness = dimensions.personality.conscientiousness
      if (dimensions.personality.extraversion !== undefined) updateData.personality_extraversion = dimensions.personality.extraversion
      if (dimensions.personality.agreeableness !== undefined) updateData.personality_agreeableness = dimensions.personality.agreeableness
      if (dimensions.personality.neuroticism !== undefined) updateData.personality_neuroticism = dimensions.personality.neuroticism
    }
    if (dimensions.emotional) {
      if (dimensions.emotional.stability !== undefined) updateData.emotional_stability = dimensions.emotional.stability
      if (dimensions.emotional.expression !== undefined) updateData.emotional_expression = dimensions.emotional.expression
      if (dimensions.emotional.empathy !== undefined) updateData.emotional_empathy = dimensions.emotional.empathy
      if (dimensions.emotional.independence !== undefined) updateData.emotional_independence = dimensions.emotional.independence
    }
    if (dimensions.social) {
      if (dimensions.social.activity !== undefined) updateData.social_activity = dimensions.social.activity
      if (dimensions.social.initiative !== undefined) updateData.social_initiative = dimensions.social.initiative
      if (dimensions.social.intimacy !== undefined) updateData.social_intimacy = dimensions.social.intimacy
      if (dimensions.social.trust !== undefined) updateData.social_trust = dimensions.social.trust
    }
    if (dimensions.communication) {
      if (dimensions.communication.directness !== undefined) updateData.communication_directness = dimensions.communication.directness
      if (dimensions.communication.responsiveness !== undefined) updateData.communication_responsiveness = dimensions.communication.responsiveness
      if (dimensions.communication.humor !== undefined) updateData.communication_humor = dimensions.communication.humor
      if (dimensions.communication.depth !== undefined) updateData.communication_depth = dimensions.communication.depth
    }

    // 提取活跃时段（优先用行为数据，补充手动数据）
    const behaviorSlots = (behaviorPattern.activeHours && Object.keys(behaviorPattern.activeHours).length > 0)
      ? this.extractActiveSlots(behaviorPattern.activeHours)
      : []
    const manualSlots = manualData?.active_time_slots || []
    const mergedSlots = [...new Set([...behaviorSlots, ...manualSlots])]
    if (mergedSlots.length > 0) {
      updateData.active_time_slots = mergedSlots
    }

    // 提取话题偏好（合并行为数据和手动数据）
    const behaviorTopics = (behaviorPattern.topicCategories && Object.keys(behaviorPattern.topicCategories).length > 0)
      ? Object.keys(behaviorPattern.topicCategories)
      : []
    const manualTopics = manualData?.topic_preferences || []
    const mergedTopics = [...new Set([...behaviorTopics, ...manualTopics])]
    if (mergedTopics.length > 0) {
      updateData.preferred_topic_types = mergedTopics
    }

    // 获取旧画像用于记录变化
    const { data: oldPortrait } = await client
      .from('profile_portraits')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle()

    await client
      .from('profile_portraits')
      .update(updateData)
      .eq('match_id', matchId)

    // 记录维度变化到历史
    if (oldPortrait) {
      const oldDimensions = this.extractDimensions(oldPortrait)
      this.recordDimensionChanges(matchId, oldDimensions, dimensions, manualData ? 'manual' : 'chat_analysis')
    }
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

    // 比较人格维度变化
    if (newDimensions.personality) {
      const dims = [
        { key: 'openness', old: oldDimensions.personality.openness, new: newDimensions.personality.openness },
        { key: 'extraversion', old: oldDimensions.personality.extraversion, new: newDimensions.personality.extraversion },
        { key: 'agreeableness', old: oldDimensions.personality.agreeableness, new: newDimensions.personality.agreeableness },
        { key: 'conscientiousness', old: oldDimensions.personality.conscientiousness, new: newDimensions.personality.conscientiousness },
        { key: 'neuroticism', old: oldDimensions.personality.neuroticism, new: newDimensions.personality.neuroticism },
      ]
      for (const d of dims) {
        if (d.new !== undefined && d.old !== d.new) {
          changes.push({ dimension: `性格.${d.key}`, oldValue: d.old, newValue: d.new })
        }
      }
    }

    // 比较情感维度变化
    if (newDimensions.emotional) {
      const dims = [
        { key: 'stability', old: oldDimensions.emotional.stability, new: newDimensions.emotional.stability },
        { key: 'expression', old: oldDimensions.emotional.expression, new: newDimensions.emotional.expression },
        { key: 'empathy', old: oldDimensions.emotional.empathy, new: newDimensions.emotional.empathy },
        { key: 'independence', old: oldDimensions.emotional.independence, new: newDimensions.emotional.independence },
      ]
      for (const d of dims) {
        if (d.new !== undefined && d.old !== d.new) {
          changes.push({ dimension: `情感.${d.key}`, oldValue: d.old, newValue: d.new })
        }
      }
    }

    // 比较社交维度变化
    if (newDimensions.social) {
      const dims = [
        { key: 'activity', old: oldDimensions.social.activity, new: newDimensions.social.activity },
        { key: 'initiative', old: oldDimensions.social.initiative, new: newDimensions.social.initiative },
        { key: 'intimacy', old: oldDimensions.social.intimacy, new: newDimensions.social.intimacy },
        { key: 'trust', old: oldDimensions.social.trust, new: newDimensions.social.trust },
      ]
      for (const d of dims) {
        if (d.new !== undefined && d.old !== d.new) {
          changes.push({ dimension: `社交.${d.key}`, oldValue: d.old, newValue: d.new })
        }
      }
    }

    // 比较沟通维度变化
    if (newDimensions.communication) {
      const dims = [
        { key: 'directness', old: oldDimensions.communication.directness, new: newDimensions.communication.directness },
        { key: 'responsiveness', old: oldDimensions.communication.responsiveness, new: newDimensions.communication.responsiveness },
        { key: 'humor', old: oldDimensions.communication.humor, new: newDimensions.communication.humor },
        { key: 'depth', old: oldDimensions.communication.depth, new: newDimensions.communication.depth },
      ]
      for (const d of dims) {
        if (d.new !== undefined && d.old !== d.new) {
          changes.push({ dimension: `沟通.${d.key}`, oldValue: d.old, newValue: d.new })
        }
      }
    }

    // 批量写入历史
    if (changes.length > 0) {
      const records = changes.map(c => ({
        match_id: matchId,
        dimension: c.dimension,
        old_value: c.oldValue,
        new_value: c.newValue,
        change_reason: reason,
        evidence: `数据来源: ${reason === 'chat_analysis' ? '聊天记录分析' : reason === 'manual' ? '手动填写' : '行为更新'}`,
      }))
      await client.from('profile_histories').insert(records)
    }
  }

  /**
   * 重新分析画像
   * 基于已有数据重新计算画像维度和行为模式
   */
  async reanalyzePortrait(matchId: number, request: Request): Promise<FullPortrait> {
    const client = getSupabaseClient()

    // 重新合并所有聊天记录数据
    await this.mergeChatRecordData(matchId)

    // 重新处理手动数据 → 更新 behavior_patterns
    const { data: manualData } = await client
      .from('manual_behavior_data')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle()

    if (manualData) {
      const behaviorPattern = this.behaviorAnalyzer.mergeBehaviorData({
        chatRecords: [],
        manualData: {
          responseSpeed: manualData.response_speed,
          activeTimeSlots: manualData.active_time_slots || [],
          topicPreferences: manualData.topic_preferences || [],
          communicationStyle: manualData.communication_style,
          notes: manualData.notes,
        },
      })

      // 如果没有聊天记录数据，用手动数据覆盖 behavior_patterns
      const { data: existingBehavior } = await client
        .from('behavior_patterns')
        .select('*')
        .eq('match_id', matchId)
        .maybeSingle()

      // 检查 behavior_patterns 中是否有聊天记录分析数据
      // 通过 total_interactions 判断是否有聊天记录数据
      const hasChatRecordData = existingBehavior && (existingBehavior.total_interactions > 0 || existingBehavior.avg_response_time !== null)

      if (!hasChatRecordData) {
        await client
          .from('behavior_patterns')
          .upsert({
            match_id: matchId,
            avg_response_time: behaviorPattern.avgResponseTime,
            active_hours: behaviorPattern.activeHours,
            emoji_usage_rate: behaviorPattern.emojiUsageRate,
            topic_categories: behaviorPattern.topicCategories,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'match_id' })
      }
    }

    // ★ 核心：从 behavior_patterns 计算维度 → 写回 profile_portraits
    await this.updateDimensionsFromBehavior(matchId)

    // 返回最新画像
    return this.getOrCreatePortrait(matchId)
  }

  /**
   * 获取或创建画像
   */
  async getOrCreatePortrait(matchId: number): Promise<FullPortrait> {
    const client = getSupabaseClient()

    // 获取画像数据
    const { data: portrait } = await client
      .from('profile_portraits')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle()

    // 获取行为模式
    const { data: behavior } = await client
      .from('behavior_patterns')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle()

    // 获取聊天记录数量
    const { count: chatRecordCount } = await client
      .from('chat_records')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('analysis_status', 'completed')

    // 获取手动填写的数据
    const { data: manualData } = await client
      .from('manual_behavior_data')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle()

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
        behavior,
        history || [],
        manualData,
        chatRecordCount || 0
      )
    }

    // 创建默认画像
    return this.createDefaultPortrait(matchId)
  }

  /**
   * 创建默认画像
   */
  private async createDefaultPortrait(matchId: number): Promise<FullPortrait> {
    const client = getSupabaseClient()

    const { data: newPortrait } = await client
      .from('profile_portraits')
      .insert({
        match_id: matchId,
        confidence: 0,
      })
      .select()
      .single()

    const { data: newBehavior } = await client
      .from('behavior_patterns')
      .insert({
        match_id: matchId,
        active_hours: {},
        active_days: {},
        topic_categories: {},
        emotional_keywords: [],
        total_interactions: 0,
      })
      .select()
      .single()

    return this.dbToFullPortrait(newPortrait, newBehavior, [], null, 0)
  }

  // ==================== 聊天记录分析 ====================

  /**
   * 上传并分析聊天记录
   */
  async uploadAndAnalyzeChatRecord(
    matchId: number,
    base64Data: string,
    request: Request
  ): Promise<{ success: boolean; analysis?: ChatRecordAnalysisResult; message: string }> {
    const result = await this.chatRecordAnalyzer.analyze({
      matchId,
      base64Data,
      request,
    })

    if (result.success && result.analysis) {
      const client = getSupabaseClient()

      // 保存聊天记录分析结果
      await client
        .from('chat_records')
        .insert({
          match_id: matchId,
          image_url: result.imageUrl,
          analyzed_content: result.analysis,
          avg_response_time: result.analysis.avgResponseTime,
          active_hours: result.analysis.activeHours || {},
          active_days: result.analysis.activeDays || {},
          message_count: result.analysis.messageCount || 0,
          emoji_usage_rate: result.analysis.emojiUsageRate || 0,
          topic_keywords: result.analysis.topicKeywords || [],
          analysis_status: 'completed',
        })

      // 合并行为数据
      await this.mergeChatRecordData(matchId)

      // ★ 从行为数据计算画像维度并写回
      await this.updateDimensionsFromBehavior(matchId)
    }

    return {
      success: result.success,
      analysis: result.analysis,
      message: result.message,
    }
  }

  /**
   * 合并聊天记录数据
   */
  private async mergeChatRecordData(matchId: number): Promise<void> {
    const client = getSupabaseClient()

    // 获取所有已完成的聊天记录
    const { data: chatRecords } = await client
      .from('chat_records')
      .select('*')
      .eq('match_id', matchId)
      .eq('analysis_status', 'completed')

    if (!chatRecords || chatRecords.length === 0) return

    // 使用行为分析器合并数据
    const behaviorPattern = this.behaviorAnalyzer.mergeBehaviorData({
      chatRecords: chatRecords.map(r => ({
        avgResponseTime: r.avg_response_time,
        activeHours: r.active_hours,
        activeDays: r.active_days,
        messageCount: r.message_count,
        emojiUsageRate: r.emoji_usage_rate,
        topicKeywords: r.topic_keywords,
      })),
    })

    // 更新行为模式
    await client
      .from('behavior_patterns')
      .upsert({
        match_id: matchId,
        avg_response_time: behaviorPattern.avgResponseTime,
        active_hours: behaviorPattern.activeHours,
        active_days: behaviorPattern.activeDays,
        emoji_usage_rate: behaviorPattern.emojiUsageRate,
        topic_categories: behaviorPattern.topicCategories,
        emotional_keywords: behaviorPattern.emotionalKeywords,
        total_interactions: behaviorPattern.totalInteractions,
        last_analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'match_id' })

    // 更新置信度
    const confidence = Math.min(100, Math.floor(behaviorPattern.totalInteractions / 10))
    await client
      .from('profile_portraits')
      .update({ confidence, updated_at: new Date().toISOString() })
      .eq('match_id', matchId)
  }

  // ==================== 手动数据管理 ====================

  /**
   * 保存手动填写的行为数据
   */
  async saveManualBehaviorData(
    matchId: number,
    data: ManualBehaviorData
  ): Promise<{ success: boolean; message: string }> {
    const client = getSupabaseClient()

    // 保存手动数据
    const { error: upsertError } = await client
      .from('manual_behavior_data')
      .upsert({
        match_id: matchId,
        response_speed: data.responseSpeed,
        active_time_slots: data.activeTimeSlots || [],
        topic_preferences: data.topicPreferences || [],
        communication_style: data.communicationStyle,
        emotional_expression: data.emotionalExpression,
        social_initiative: data.socialInitiative,
        notes: data.notes,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'match_id' })

    if (upsertError) {
      console.error('Save manual data upsert error:', upsertError)
      return { success: false, message: '保存失败：' + upsertError.message }
    }

    // 检查是否有聊天记录
    const { data: chatRecords } = await client
      .from('chat_records')
      .select('id')
      .eq('match_id', matchId)
      .eq('analysis_status', 'completed')
      .limit(1)

    if (!chatRecords || chatRecords.length === 0) {
      // 使用手动数据更新行为模式
      const behaviorPattern = this.behaviorAnalyzer.mergeBehaviorData({
        chatRecords: [],
        manualData: data,
      })

      const { error: bpError } = await client
        .from('behavior_patterns')
        .upsert({
          match_id: matchId,
          avg_response_time: behaviorPattern.avgResponseTime,
          active_hours: behaviorPattern.activeHours,
          emoji_usage_rate: behaviorPattern.emojiUsageRate,
          topic_categories: behaviorPattern.topicCategories,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'match_id' })

      if (bpError) {
        console.error('Save manual data: behavior_patterns upsert error:', bpError)
      }
    }

    // ★ 从行为数据计算画像维度并写回
    await this.updateDimensionsFromBehavior(matchId)

    return { success: true, message: '保存成功' }
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
    const client = getSupabaseClient()

    // 获取画像和行为数据
    const { data: portrait } = await client
      .from('profile_portraits')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle()

    const { data: behavior } = await client
      .from('behavior_patterns')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle()

    const { data: match } = await client
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .maybeSingle()

    const { count: chatRecordCount } = await client
      .from('chat_records')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('analysis_status', 'completed')

    if (!portrait || !match) {
      return {
        trend: 'stable',
        confidence: 0,
        insights: ['数据不足，无法做出预测'],
        recommendations: ['上传聊天记录或填写行为数据以获得更准确的分析'],
      }
    }

    const targetDimensions = this.extractDimensions(portrait)
    const targetBehavior = behavior ? this.dbToBehaviorPattern(behavior) : null
    const dataSource = behavior?.data_source || 'none'

    return this.trendPredictor.predict({
      targetDimensions,
      targetBehavior,
      userPortrait,
      relationshipContext: {
        relationshipStage: match.relationship_stage || 'new',
        interactionStatus: match.interaction_status || 'just_met',
      },
      dataSourceInfo: {
        hasChatRecords: (chatRecordCount || 0) > 0,
        dataSource,
      },
      request,
    })
  }

  /**
   * 获取互动策略推荐
   */
  async getInteractionStrategy(
    matchId: number,
    userPortrait: UserPortraitSummary | null,
    request: Request
  ): Promise<StrategyRecommendationResult> {
    const client = getSupabaseClient()

    // 获取画像和行为数据
    const { data: portrait } = await client
      .from('profile_portraits')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle()

    const { data: behavior } = await client
      .from('behavior_patterns')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle()

    const { data: match } = await client
      .from('matches')
      .select('*, hardware, software')
      .eq('id', matchId)
      .maybeSingle()

    const { count: chatRecordCount } = await client
      .from('chat_records')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('analysis_status', 'completed')

    if (!portrait || !match) {
      return { strategies: [] }
    }

    const targetDimensions = this.extractDimensions(portrait)
    const targetBehavior = behavior ? this.dbToBehaviorPattern(behavior) : null
    const dataSource = behavior?.data_source || 'none'

    return this.strategyRecommender.predict({
      targetDimensions,
      targetBehavior,
      userPortrait,
      relationshipContext: {
        relationshipStage: match.relationship_stage || 'new',
        interactionStatus: match.interaction_status || 'just_met',
      },
      matchInfo: {
        name: match.name || '对方',
        hardware: match.hardware,
        software: match.software,
      },
      dataSourceInfo: {
        hasChatRecords: (chatRecordCount || 0) > 0,
        dataSource,
      },
      request,
    })
  }

  // ==================== 工具方法 ====================

  /**
   * 获取画像变化趋势
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
    behavior: Record<string, unknown> | null,
    history: Array<Record<string, unknown>>,
    manualData: Record<string, unknown> | null,
    chatRecordCount: number
  ): FullPortrait {
    // 推断数据来源：通过聊天记录数量和手动数据判断
    const dataSource = chatRecordCount > 0 ? 'chat_record' : (manualData ? 'manual' : 'none')

    return {
      dimensions: this.extractDimensions(portrait),
      behaviorPattern: behavior ? this.dbToBehaviorPattern(behavior) : this.getDefaultBehavior(),
      interactionStyle: this.calculateInteractionStyle(behavior) as InteractionStyle,
      preferredTopicTypes: (portrait?.preferred_topic_types as string[]) || [],
      activeTimeSlots: this.extractActiveSlots(behavior?.active_hours as Record<string, number> || {}),
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
      dataSourceStatus: {
        hasChatRecords: chatRecordCount > 0,
        hasManualData: !!manualData,
        chatRecordCount,
      },
      lastUpdated: (portrait?.updated_at as string) || new Date().toISOString(),
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
   * 数据库格式转换为行为模式
   */
  private dbToBehaviorPattern(behavior: Record<string, unknown>): BehaviorPattern {
    // behavior_patterns 表没有 data_source 列，根据数据特征推断来源
    const hasResponseTime = behavior.avg_response_time !== null && behavior.avg_response_time !== undefined
    const hasActiveHours = behavior.active_hours && Object.keys(behavior.active_hours as Record<string, number>).length > 0
    let dataSource: 'chat_record' | 'manual' | 'none' = 'none'
    if (hasResponseTime || hasActiveHours) {
      // 如果有聊天记录关联，则推断为 chat_record；否则推断为 manual
      dataSource = (behavior.total_interactions as number) > 0 ? 'chat_record' : 'manual'
    }

    return {
      dataSource,
      avgResponseTime: (behavior.avg_response_time as number) || null,
      responseTimeVariance: (behavior.response_time_variance as number) || null,
      activeHours: (behavior.active_hours as Record<string, number>) || {},
      activeDays: (behavior.active_days as Record<string, number>) || {},
      messageLengthAvg: (behavior.message_length_avg as number) || null,
      emojiUsageRate: (behavior.emoji_usage_rate as number) || 0,
      questionRate: (behavior.question_rate as number) || 0,
      initiativeRate: (behavior.initiative_rate as number) || 0,
      topicCategories: (behavior.topic_categories as Record<string, number>) || {},
      emotionalKeywords: (behavior.emotional_keywords as string[]) || [],
      totalInteractions: (behavior.total_interactions as number) || 0,
    }
  }

  /**
   * 获取默认行为模式
   */
  private getDefaultBehavior(): BehaviorPattern {
    return {
      dataSource: 'none',
      avgResponseTime: null,
      responseTimeVariance: null,
      activeHours: {},
      activeDays: {},
      messageLengthAvg: null,
      emojiUsageRate: 0,
      questionRate: 0,
      initiativeRate: 0,
      topicCategories: {},
      emotionalKeywords: [],
      totalInteractions: 0,
    }
  }

  /**
   * 提取活跃时段
   */
  private extractActiveSlots(activeHours: Record<string, number>): string[] {
    return this.behaviorAnalyzer.extractActiveTimeSlots(activeHours)
  }

  /**
   * 计算互动风格
   */
  private calculateInteractionStyle(behavior: Record<string, unknown> | null): string {
    const initiativeRate = (behavior?.initiative_rate as number) || 0
    if (initiativeRate >= 60) return 'active'
    if (initiativeRate <= 30) return 'passive'
    return 'balanced'
  }

  // ==================== AI 深度洞察 ====================

  /**
   * 生成深度洞察分析
   * 聚合该对象的全部数据，使用 LLM 进行深度洞察
   */
  async generateInsight(matchId: number, request: Request, forceRefresh = false): Promise<InsightAnalysisResult> {
    return this.insightAnalyzer.analyze(matchId, request, forceRefresh)
  }
}
