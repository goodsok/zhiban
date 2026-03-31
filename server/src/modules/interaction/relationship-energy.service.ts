import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 能量趋势
export type EnergyTrend = 'rising' | 'stable' | 'declining' | 'stagnant'

// 变化原因
export type ChangeReason = 'interaction' | 'dimension_update' | 'time_decay' | 'breakthrough' | 'manual'

// 关系能量接口
export interface RelationshipEnergyData {
  id: number
  matchId: number
  totalEnergy: number
  informationScore: number
  interactionScore: number
  emotionalScore: number
  trend: EnergyTrend
  totalInteractions: number
  avgQualityScore: number
  lastInteractionDays: number
  breakthroughCount: number
  dimensionCompleteness: number
  calculatedAt: string
  createdAt: string
  updatedAt: string | null
}

// 能量历史记录
export interface EnergyHistory {
  id: number
  matchId: number
  totalEnergy: number
  informationScore: number
  interactionScore: number
  emotionalScore: number
  changeReason: ChangeReason
  changeDetail: string | null
  relatedEventId: number | null
  createdAt: string
}

// 能量计算权重
const ENERGY_WEIGHTS = {
  information: 0.35,  // 信息维度权重
  interaction: 0.35,  // 互动维度权重
  emotional: 0.30,    // 情感维度权重
}

// 时间衰减配置
const TIME_DECAY_CONFIG = {
  // 每天不互动的能量衰减
  dailyDecay: 0.5,
  // 最大衰减天数（超过此天数不再继续衰减）
  maxDecayDays: 30,
}

@Injectable()
export class RelationshipEnergyService {
  /**
   * 获取关系能量
   */
  async getEnergy(matchId: number): Promise<{ code: number; data: RelationshipEnergyData | null; message: string }> {
    // 确保存在能量记录
    await this.ensureEnergyRecord(matchId)

    const { data, error } = await getSupabaseClient()
      .from('relationship_energy')
      .select('*')
      .eq('match_id', matchId)
      .single()

    if (error) {
      console.error('Get relationship energy error:', error)
      return { code: 500, data: null, message: error.message }
    }

    return {
      code: 200,
      data: this.transformEnergy(data),
      message: 'success',
    }
  }

  /**
   * 计算并更新关系能量
   */
  async calculateAndUpdateEnergy(
    matchId: number,
    reason: ChangeReason,
    detail?: string,
    relatedEventId?: number
  ): Promise<{ code: number; data: RelationshipEnergyData | null; message: string }> {
    // 获取当前能量记录
    await this.ensureEnergyRecord(matchId)
    const { data: currentEnergy } = await getSupabaseClient()
      .from('relationship_energy')
      .select('*')
      .eq('match_id', matchId)
      .single()

    // 计算三大维度分数
    const informationScore = await this.calculateInformationScore(matchId)
    const interactionScore = await this.calculateInteractionScore(matchId)
    const emotionalScore = await this.calculateEmotionalScore(matchId)

    // 计算总能量（加权平均）
    const totalEnergy = Math.round(
      informationScore * ENERGY_WEIGHTS.information +
      interactionScore * ENERGY_WEIGHTS.interaction +
      emotionalScore * ENERGY_WEIGHTS.emotional
    )

    // 获取互动统计
    const { data: interactions } = await getSupabaseClient()
      .from('interaction_events')
      .select('*')
      .eq('match_id', matchId)

    const totalInteractions = interactions?.length || 0
    const avgQualityScore = interactions?.length
      ? Math.round(
          interactions
            .filter(e => e.quality_score)
            .reduce((sum, e) => sum + (e.quality_score as number), 0) /
          interactions.filter(e => e.quality_score).length
        ) || 0
      : 0

    // 计算距上次互动天数
    const lastInteraction = interactions
      ?.filter(e => e.started_at)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0]

    const lastInteractionDays = lastInteraction
      ? Math.floor((Date.now() - new Date(lastInteraction.started_at).getTime()) / (1000 * 60 * 60 * 24))
      : -1

    // 统计突破时刻
    const breakthroughCount = interactions?.filter(e => e.breakthrough_moment).length || 0

    // 计算维度完整度
    const dimensionCompleteness = await this.calculateDimensionCompleteness(matchId)

    // 计算趋势
    const trend = this.calculateTrend(currentEnergy as RelationshipEnergyData, {
      totalEnergy,
      lastInteractionDays,
    })

    // 更新能量记录
    const { data: updatedEnergy, error: updateError } = await getSupabaseClient()
      .from('relationship_energy')
      .update({
        total_energy: totalEnergy,
        information_score: informationScore,
        interaction_score: interactionScore,
        emotional_score: emotionalScore,
        trend,
        total_interactions: totalInteractions,
        avg_quality_score: avgQualityScore,
        last_interaction_days: lastInteractionDays,
        breakthrough_count: breakthroughCount,
        dimension_completeness: dimensionCompleteness,
        calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('match_id', matchId)
      .select()
      .single()

    if (updateError) {
      console.error('Update relationship energy error:', updateError)
      return { code: 500, data: null, message: updateError.message }
    }

    // 记录历史
    await this.recordEnergyHistory(
      matchId,
      totalEnergy,
      informationScore,
      interactionScore,
      emotionalScore,
      reason,
      detail,
      relatedEventId
    )

    return {
      code: 200,
      data: this.transformEnergy(updatedEnergy),
      message: 'success',
    }
  }

  /**
   * 获取能量历史
   */
  async getEnergyHistory(matchId: number, limit: number = 30): Promise<{
    code: number
    data: { list: EnergyHistory[]; total: number }
    message: string
  }> {
    const { data, error, count } = await getSupabaseClient()
      .from('relationship_energy_history')
      .select('*', { count: 'exact' })
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Get energy history error:', error)
      return { code: 500, data: { list: [], total: 0 }, message: error.message }
    }

    return {
      code: 200,
      data: {
        list: (data || []).map(this.transformHistory),
        total: count || 0,
      },
      message: 'success',
    }
  }

  /**
   * 批量获取多个对象的关系能量
   */
  async getEnergyForMatches(matchIds: number[]): Promise<Map<number, RelationshipEnergyData>> {
    const result = new Map<number, RelationshipEnergyData>()

    if (matchIds.length === 0) return result

    const { data, error } = await getSupabaseClient()
      .from('relationship_energy')
      .select('*')
      .in('match_id', matchIds)

    if (error) {
      console.error('Get energy for matches error:', error)
      return result
    }

    for (const item of data || []) {
      result.set(item.match_id, this.transformEnergy(item))
    }

    return result
  }

  // ==================== 私有方法 ====================

  /**
   * 确保能量记录存在
   */
  private async ensureEnergyRecord(matchId: number): Promise<void> {
    const { data } = await getSupabaseClient()
      .from('relationship_energy')
      .select('id')
      .eq('match_id', matchId)
      .single()

    if (!data) {
      await getSupabaseClient()
        .from('relationship_energy')
        .insert({ match_id: matchId })
    }
  }

  /**
   * 计算信息维度分数
   * 基于维度填充率和关键维度权重
   */
  private async calculateDimensionCompleteness(matchId: number): Promise<number> {
    // 获取维度定义
    const { data: definitions } = await getSupabaseClient()
      .from('dimension_definitions')
      .select('dimension_key, importance, weight')
      .eq('is_active', true)

    if (!definitions || definitions.length === 0) return 0

    // 获取已填充的维度
    const { data: filledValues } = await getSupabaseClient()
      .from('profile_dimension_values')
      .select('dimension_key')
      .eq('match_id', matchId)

    const filledKeys = new Set(filledValues?.map(v => v.dimension_key) || [])

    // 计算加权完整度
    let totalWeight = 0
    let filledWeight = 0

    for (const def of definitions) {
      const weight = this.getImportanceWeight(def.importance as string) * (def.weight as number)
      totalWeight += weight
      if (filledKeys.has(def.dimension_key as string)) {
        filledWeight += weight
      }
    }

    return totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0
  }

  /**
   * 计算信息维度分数
   */
  private async calculateInformationScore(matchId: number): Promise<number> {
    return this.calculateDimensionCompleteness(matchId)
  }

  /**
   * 计算互动维度分数
   * 基于互动频率、质量、最近活跃度
   */
  private async calculateInteractionScore(matchId: number): Promise<number> {
    const { data: interactions } = await getSupabaseClient()
      .from('interaction_events')
      .select('quality_score, started_at, energy_change, interaction_type')
      .eq('match_id', matchId)

    if (!interactions || interactions.length === 0) return 0

    // 1. 互动频率得分（最多30分）
    const interactionCount = interactions.length
    const frequencyScore = Math.min(interactionCount * 3, 30)

    // 2. 互动质量得分（最多40分）
    const qualityScores = interactions.filter(e => e.quality_score).map(e => e.quality_score as number)
    const avgQuality = qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      : 50
    const qualityScore = (avgQuality / 100) * 40

    // 3. 最近活跃度得分（最多30分）
    const recentInteractions = interactions.filter(e => {
      if (!e.started_at) return false
      const daysSince = (Date.now() - new Date(e.started_at).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 7
    })
    const recencyScore = Math.min(recentInteractions.length * 10, 30)

    // 4. 互动多样性加分（最多10分额外）
    const interactionTypes = new Set(interactions.map(e => e.interaction_type))
    const diversityBonus = Math.min(interactionTypes.size * 2, 10)

    return Math.round(frequencyScore + qualityScore + recencyScore + diversityBonus)
  }

  /**
   * 计算情感维度分数
   * 基于突破性时刻、互动深度、情感相关维度
   */
  private async calculateEmotionalScore(matchId: number): Promise<number> {
    // 1. 突破性时刻得分（最多30分）
    const { data: breakthroughs } = await getSupabaseClient()
      .from('interaction_events')
      .select('breakthrough_moment')
      .eq('match_id', matchId)
      .not('breakthrough_moment', 'is', null)

    const breakthroughScore = Math.min((breakthroughs?.length || 0) * 10, 30)

    // 2. 互动深度得分（约会/肢体接触等高权重互动）
    const { data: deepInteractions } = await getSupabaseClient()
      .from('interaction_events')
      .select('interaction_type, quality_score')
      .eq('match_id', matchId)
      .in('interaction_type', ['date', 'physical', 'social'])

    const deepInteractionScore = Math.min((deepInteractions?.length || 0) * 5, 30)

    // 3. 情感相关维度得分（最多40分）
    const emotionalDimensions = [
      'emotionalAvailabilityLevel',
      'intimacyNeeds',
      'attachmentStyle',
      'loveLanguage',
      'emotionalExpressionStyle',
    ]

    const { data: emotionalValues } = await getSupabaseClient()
      .from('profile_dimension_values')
      .select('dimension_key')
      .eq('match_id', matchId)
      .in('dimension_key', emotionalDimensions)

    const emotionalCompleteness = emotionalValues?.length || 0
    const emotionalDimensionScore = Math.min(emotionalCompleteness * 8, 40)

    return Math.round(breakthroughScore + deepInteractionScore + emotionalDimensionScore)
  }

  /**
   * 计算趋势
   */
  private calculateTrend(
    current: RelationshipEnergyData | null,
    newData: { totalEnergy: number; lastInteractionDays: number }
  ): EnergyTrend {
    if (!current || current.totalEnergy === 0) {
      return newData.totalEnergy > 0 ? 'rising' : 'stagnant'
    }

    const energyChange = newData.totalEnergy - current.totalEnergy

    // 能量显著上升
    if (energyChange >= 10) return 'rising'

    // 能量显著下降
    if (energyChange <= -10) return 'declining'

    // 长时间未互动
    if (newData.lastInteractionDays > 14) return 'stagnant'

    return 'stable'
  }

  /**
   * 记录能量历史
   */
  private async recordEnergyHistory(
    matchId: number,
    totalEnergy: number,
    informationScore: number,
    interactionScore: number,
    emotionalScore: number,
    reason: ChangeReason,
    detail?: string,
    relatedEventId?: number
  ): Promise<void> {
    await getSupabaseClient()
      .from('relationship_energy_history')
      .insert({
        match_id: matchId,
        total_energy: totalEnergy,
        information_score: informationScore,
        interaction_score: interactionScore,
        emotional_score: emotionalScore,
        change_reason: reason,
        change_detail: detail || null,
        related_event_id: relatedEventId || null,
      })
  }

  /**
   * 获取重要性权重
   */
  private getImportanceWeight(importance: string): number {
    const weights: Record<string, number> = {
      critical: 3,
      important: 2,
      optional: 1,
    }
    return weights[importance] || 1
  }

  /**
   * 转换数据库记录
   */
  private transformEnergy(data: Record<string, unknown>): RelationshipEnergyData {
    return {
      id: data.id as number,
      matchId: data.match_id as number,
      totalEnergy: data.total_energy as number,
      informationScore: data.information_score as number,
      interactionScore: data.interaction_score as number,
      emotionalScore: data.emotional_score as number,
      trend: data.trend as EnergyTrend,
      totalInteractions: data.total_interactions as number,
      avgQualityScore: data.avg_quality_score as number,
      lastInteractionDays: data.last_interaction_days as number,
      breakthroughCount: data.breakthrough_count as number,
      dimensionCompleteness: data.dimension_completeness as number,
      calculatedAt: data.calculated_at as string,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string | null,
    }
  }

  /**
   * 转换历史记录
   */
  private transformHistory(data: Record<string, unknown>): EnergyHistory {
    return {
      id: data.id as number,
      matchId: data.match_id as number,
      totalEnergy: data.total_energy as number,
      informationScore: data.information_score as number,
      interactionScore: data.interaction_score as number,
      emotionalScore: data.emotional_score as number,
      changeReason: data.change_reason as ChangeReason,
      changeDetail: data.change_detail as string | null,
      relatedEventId: data.related_event_id as number | null,
      createdAt: data.created_at as string,
    }
  }
}
