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

@Injectable()
export class PortraitEngineService {
  constructor(
    private readonly calculator: PortraitCalculator,
    private readonly chatRecordAnalyzer: ChatRecordAnalyzer,
    private readonly behaviorAnalyzer: BehaviorPatternAnalyzer,
    private readonly trendPredictor: TrendPredictor,
    private readonly strategyRecommender: StrategyRecommender,
  ) {}

  // ==================== 画像数据管理 ====================

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
        data_source: 'none',
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
        data_source: 'chat_record',
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
    await client
      .from('manual_behavior_data')
      .upsert({
        match_id: matchId,
        response_speed: data.responseSpeed,
        active_time_slots: data.activeTimeSlots || [],
        topic_preferences: data.topicPreferences || [],
        communication_style: data.communicationStyle,
        notes: data.notes,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'match_id' })

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

      await client
        .from('behavior_patterns')
        .upsert({
          match_id: matchId,
          data_source: 'manual',
          avg_response_time: behaviorPattern.avgResponseTime,
          active_hours: behaviorPattern.activeHours,
          emoji_usage_rate: behaviorPattern.emojiUsageRate,
          topic_categories: behaviorPattern.topicCategories,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'match_id' })

      // 更新置信度（手动数据给30%置信度）
      await client
        .from('profile_portraits')
        .update({ confidence: 30, updated_at: new Date().toISOString() })
        .eq('match_id', matchId)
    }

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
    const dataSource = (behavior?.data_source as string) || 'none'

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
    return {
      dataSource: (behavior.data_source as 'chat_record' | 'manual' | 'none') || 'none',
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
}
