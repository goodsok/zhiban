import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 能量趋势
export type EnergyTrend = 'rising' | 'stable' | 'declining' | 'stagnant'

// 变化原因
export type ChangeReason = 'interaction' | 'dimension_update' | 'time_decay' | 'breakthrough' | 'manual' | 'combo'

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
  currentStage: string
  activeBoosters: string[]
  activePenalties: string[]
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

// 时机加成配置
interface TimingBooster {
  id: string
  name: string
  description: string
  multiplier: number  // 能量倍数（1.5 = 50%加成）
  category: 'relationship_stage' | 'physiological' | 'life_event' | 'emotional' | 'seasonal'
  detectCondition: (context: TimingContext) => boolean
}

// 时机衰减配置
interface TimingPenalty {
  id: string
  name: string
  description: string
  multiplier: number  // 衰减系数（0.7 = 30%衰减）
  category: 'relationship_stage' | 'physiological' | 'life_event' | 'emotional' | 'behavioral'
  detectCondition: (context: TimingContext) => boolean
}

// 时机检测上下文
interface TimingContext {
  matchId: number
  relationshipStartDate?: Date
  relationshipDays: number
  lastInteractionDays: number
  cyclePhase?: string
  cycleDay?: number
  breakthroughEvents: string[]
  recentMoods: string[]
  totalInteractions: number
  specialDates: SpecialDate[]
}

// 特殊日期
interface SpecialDate {
  date: Date
  type: 'birthday' | 'anniversary' | 'holiday' | 'important_event'
  name: string
}

// 互动组合配置
interface InteractionCombo {
  id: string
  name: string
  description: string
  requiredTypes: string[]  // 需要的互动类型
  timeWindow: number  // 时间窗口（天）
  bonusEnergy: number  // 额外能量
  condition?: string  // 额外条件
}

// 能量计算权重
const ENERGY_WEIGHTS = {
  information: 0.30,  // 信息维度权重
  interaction: 0.40,  // 互动维度权重
  emotional: 0.30,    // 情感维度权重
}

// 互动类型基础能量贡献
const INTERACTION_TYPE_ENERGY: Record<string, number> = {
  date: 15,        // 约会
  physical: 20,    // 亲密接触
  social: 12,      // 社交活动
  video: 8,        // 视频通话
  call: 6,         // 电话
  chat: 4,         // 聊天
  message: 2,      // 消息
  gift: 10,        // 礼物
  other: 3,        // 其他
}

// 心情质量系数
const MOOD_QUALITY_MULTIPLIER: Record<string, number> = {
  excellent: 1.5,   // 非常愉快
  good: 1.2,        // 比较愉快
  neutral: 1.0,     // 一般
  awkward: 0.7,     // 尴尬
  bad: 0.4,         // 不愉快
}

// ==================== 时机加成配置 ====================
const TIMING_BOOSTERS: TimingBooster[] = [
  // ===== 关系阶段类 =====
  {
    id: 'early_relationship',
    name: '热恋初期',
    description: '交往前30天，新鲜感强，互动价值高',
    multiplier: 1.5,
    category: 'relationship_stage',
    detectCondition: (ctx) => ctx.relationshipDays > 0 && ctx.relationshipDays <= 30,
  },
  {
    id: 'breakthrough_period',
    name: '突破期',
    description: '关键突破后7天内（表白、牵手、接吻等）',
    multiplier: 1.4,
    category: 'relationship_stage',
    detectCondition: (ctx) => {
      const recentBreakthroughs = ctx.breakthroughEvents.filter(e => {
        const eventDate = new Date(e)
        const daysSince = Math.floor((Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysSince <= 7
      })
      return recentBreakthroughs.length > 0
    },
  },
  {
    id: 'passionate_phase',
    name: '热恋期',
    description: '关系确立1-3个月',
    multiplier: 1.3,
    category: 'relationship_stage',
    detectCondition: (ctx) => ctx.relationshipDays > 30 && ctx.relationshipDays <= 90,
  },

  // ===== 生理周期类 =====
  {
    id: 'ovulation_intimacy',
    name: '排卵期亲密',
    description: '排卵期进行亲密互动，情感需求强',
    multiplier: 1.6,
    category: 'physiological',
    detectCondition: (ctx) => ctx.cyclePhase === 'ovulation',
  },
  {
    id: 'emotional_vulnerable_care',
    name: '情感脆弱期关怀',
    description: '经期前2-3天，需要关怀和理解',
    multiplier: 1.4,
    category: 'physiological',
    detectCondition: (ctx) => {
      if (!ctx.cycleDay) return false
      // 假设28天周期，经前2-3天约为第26-28天
      return ctx.cycleDay >= 24 && ctx.cycleDay <= 28
    },
  },
  {
    id: 'physiological_need_peak',
    name: '生理需求高峰期',
    description: '女性生理性强需求期（排卵期前后）',
    multiplier: 1.5,
    category: 'physiological',
    detectCondition: (ctx) => {
      if (!ctx.cycleDay) return false
      // 排卵期前后（第12-16天）
      return ctx.cycleDay >= 12 && ctx.cycleDay <= 16
    },
  },

  // ===== 生活事件类 =====
  {
    id: 'birthday_period',
    name: '生日周',
    description: '对方生日前后3天',
    multiplier: 1.8,
    category: 'life_event',
    detectCondition: (ctx) => ctx.specialDates.some(d => 
      d.type === 'birthday' && 
      Math.abs(d.date.getTime() - Date.now()) <= 3 * 24 * 60 * 60 * 1000
    ),
  },
  {
    id: 'anniversary_period',
    name: '纪念日',
    description: '重要纪念日前后3天',
    multiplier: 1.6,
    category: 'life_event',
    detectCondition: (ctx) => ctx.specialDates.some(d => 
      d.type === 'anniversary' && 
      Math.abs(d.date.getTime() - Date.now()) <= 3 * 24 * 60 * 60 * 1000
    ),
  },
  {
    id: 'holiday_season',
    name: '浪漫节日',
    description: '情人节、圣诞节、七夕等',
    multiplier: 1.5,
    category: 'seasonal',
    detectCondition: (ctx) => ctx.specialDates.some(d => d.type === 'holiday'),
  },
  {
    id: 'reunion_joy',
    name: '重逢时刻',
    description: '分别1周以上后的第一次互动',
    multiplier: 1.5,
    category: 'life_event',
    detectCondition: (ctx) => ctx.lastInteractionDays >= 7 && ctx.lastInteractionDays <= 8,
  },
  {
    id: 'difficulty_support',
    name: '困难期陪伴',
    description: '对方遇到困难/压力时的支持',
    multiplier: 1.7,
    category: 'life_event',
    detectCondition: (ctx) => {
      // 检查是否有"困难期"标记的特殊日期
      return ctx.specialDates.some(d => 
        d.type === 'important_event' && 
        d.name.includes('困难')
      )
    },
  },
  {
    id: 'sickness_care',
    name: '生病照顾',
    description: '对方生病时的关怀',
    multiplier: 1.6,
    category: 'life_event',
    detectCondition: (ctx) => ctx.specialDates.some(d => d.name.includes('生病')),
  },

  // ===== 情感状态类 =====
  {
    id: 'reconciliation_boost',
    name: '和好如初',
    description: '争吵和好后7天内，关系修复期',
    multiplier: 1.4,
    category: 'emotional',
    detectCondition: (ctx) => {
      // 检查最近是否有尴尬/不好的心情后转为好的心情
      const hasRecentBadMood = ctx.recentMoods.slice(0, 5).some(m => m === 'awkward' || m === 'bad')
      const hasRecentGoodMood = ctx.recentMoods.slice(0, 2).some(m => m === 'excellent' || m === 'good')
      return hasRecentBadMood && hasRecentGoodMood
    },
  },
  {
    id: 'trust_opening',
    name: '信任敞开',
    description: '对方敞开心扉、分享秘密时',
    multiplier: 1.5,
    category: 'emotional',
    detectCondition: (ctx) => {
      // 检查是否有"突破性时刻"
      return ctx.breakthroughEvents.length > 0
    },
  },

  // ===== 季节时令类 =====
  {
    id: 'spring_romance',
    name: '春日浪漫',
    description: '春季（3-5月），情感活跃期',
    multiplier: 1.1,
    category: 'seasonal',
    detectCondition: () => {
      const month = new Date().getMonth() + 1
      return month >= 3 && month <= 5
    },
  },
  {
    id: 'weekend_quality',
    name: '周末时光',
    description: '周末进行的高质量互动',
    multiplier: 1.2,
    category: 'seasonal',
    detectCondition: () => {
      const day = new Date().getDay()
      return day === 0 || day === 6
    },
  },
]

// ==================== 时机衰减配置 ====================
const TIMING_PENALTIES: TimingPenalty[] = [
  // ===== 行为类 =====
  {
    id: 'long_silence',
    name: '长期冷落',
    description: '超过7天无互动',
    multiplier: 0.6,
    category: 'behavioral',
    detectCondition: (ctx) => ctx.lastInteractionDays > 7,
  },
  {
    id: 'severe_neglect',
    name: '严重冷落',
    description: '超过14天无互动',
    multiplier: 0.4,
    category: 'behavioral',
    detectCondition: (ctx) => ctx.lastInteractionDays > 14,
  },
  {
    id: 'extreme_neglect',
    name: '极度冷落',
    description: '超过30天无互动',
    multiplier: 0.2,
    category: 'behavioral',
    detectCondition: (ctx) => ctx.lastInteractionDays > 30,
  },

  // ===== 情感类 =====
  {
    id: 'conflict_period',
    name: '矛盾期',
    description: '最近互动有尴尬/不愉快',
    multiplier: 0.7,
    category: 'emotional',
    detectCondition: (ctx) => {
      const recentMoods = ctx.recentMoods.slice(0, 3)
      return recentMoods.some(m => m === 'awkward' || m === 'bad')
    },
  },
  {
    id: 'trust_breakdown',
    name: '信任危机',
    description: '连续多次不愉快互动',
    multiplier: 0.5,
    category: 'emotional',
    detectCondition: (ctx) => {
      const recentMoods = ctx.recentMoods.slice(0, 5)
      const badCount = recentMoods.filter(m => m === 'awkward' || m === 'bad').length
      return badCount >= 3
    },
  },

  // ===== 生理周期类 =====
  {
    id: 'menstrual_discomfort',
    name: '经期不适',
    description: '经期进行的高强度互动可能适得其反',
    multiplier: 0.8,
    category: 'physiological',
    detectCondition: (ctx) => {
      if (!ctx.cycleDay) return false
      // 经期（第1-5天）
      return ctx.cycleDay >= 1 && ctx.cycleDay <= 5
    },
  },
  {
    id: 'low_energy_period',
    name: '低能量期',
    description: '黄体后期，情感需求低',
    multiplier: 0.85,
    category: 'physiological',
    detectCondition: (ctx) => {
      if (!ctx.cycleDay) return false
      // 黄体后期（第22-28天）
      return ctx.cycleDay >= 22 && ctx.cycleDay <= 28
    },
  },

  // ===== 关系阶段类 =====
  {
    id: 'plateau_period',
    name: '关系平台期',
    description: '交往6个月以上，新鲜感下降',
    multiplier: 0.9,
    category: 'relationship_stage',
    detectCondition: (ctx) => ctx.relationshipDays > 180,
  },
  {
    id: 'routine_boredom',
    name: '习惯性疲劳',
    description: '互动类型单一，缺乏新意',
    multiplier: 0.85,
    category: 'relationship_stage',
    detectCondition: (ctx) => {
      // 如果总互动多但类型少于3种
      return ctx.totalInteractions > 10 && ctx.totalInteractions < 3
    },
  },
]

// ==================== 互动组合配置 ====================
const INTERACTION_COMBOS: InteractionCombo[] = [
  {
    id: 'perfect_date',
    name: '完美约会',
    description: '约会 + 礼物 + 亲密接触',
    requiredTypes: ['date', 'gift', 'physical'],
    timeWindow: 1,
    bonusEnergy: 30,
    condition: '同一天内完成三种互动',
  },
  {
    id: 'communication_cycle',
    name: '沟通闭环',
    description: '连续3天有互动（聊天/消息/通话）',
    requiredTypes: ['chat', 'message', 'call'],
    timeWindow: 3,
    bonusEnergy: 15,
    condition: '连续3天保持联系',
  },
  {
    id: 'intimacy_progression',
    name: '亲密递进',
    description: '约会 → 牵手 → 接吻（7天内）',
    requiredTypes: ['date', 'physical'],
    timeWindow: 7,
    bonusEnergy: 25,
    condition: '有突破性时刻记录',
  },
  {
    id: 'weekend_escape',
    name: '周末出游',
    description: '周六日的约会 + 社交活动',
    requiredTypes: ['date', 'social'],
    timeWindow: 2,
    bonusEnergy: 20,
  },
  {
    id: 'care_package',
    name: '关怀组合',
    description: '通话 + 消息 + 礼物（3天内）',
    requiredTypes: ['call', 'message', 'gift'],
    timeWindow: 3,
    bonusEnergy: 18,
  },
  {
    id: 'quality_time',
    name: '高质量时光',
    description: '视频 + 约会（同一天）',
    requiredTypes: ['video', 'date'],
    timeWindow: 1,
    bonusEnergy: 12,
  },
]

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
   * 计算互动能量贡献
   * 核心方法：根据互动类型、质量、时机计算能量
   */
  async calculateInteractionEnergy(
    matchId: number,
    interactionType: string,
    mood: string,
    hasBreakthrough: boolean,
    duration?: number
  ): Promise<{
    baseEnergy: number
    qualityMultiplier: number
    timingMultiplier: number
    bonusEnergy: number
    totalEnergy: number
    activeBoosters: string[]
    activePenalties: string[]
    comboDetected?: string
  }> {
    // 1. 基础能量
    const baseEnergy = INTERACTION_TYPE_ENERGY[interactionType] || 3

    // 2. 质量系数
    const qualityMultiplier = MOOD_QUALITY_MULTIPLIER[mood] || 1.0

    // 3. 时长加成（超过2小时加成）
    let durationBonus = 0
    if (duration && duration > 120) {
      durationBonus = Math.min(Math.floor((duration - 120) / 30) * 2, 10)
    }

    // 4. 突破性时刻加成
    const breakthroughBonus = hasBreakthrough ? 10 : 0

    // 5. 获取时机上下文
    const timingContext = await this.buildTimingContext(matchId)

    // 6. 检测时机加成
    const activeBoosters = TIMING_BOOSTERS
      .filter(booster => booster.detectCondition(timingContext))
      .map(b => b.id)

    const maxBoosterMultiplier = activeBoosters.length > 0
      ? Math.max(...activeBoosters.map(id => TIMING_BOOSTERS.find(b => b.id === id)?.multiplier || 1))
      : 1

    // 7. 检测时机衰减
    const activePenalties = TIMING_PENALTIES
      .filter(penalty => penalty.detectCondition(timingContext))
      .map(p => p.id)

    const minPenaltyMultiplier = activePenalties.length > 0
      ? Math.min(...activePenalties.map(id => TIMING_PENALTIES.find(p => p.id === id)?.multiplier || 1))
      : 1

    // 8. 计算时机系数（加成和衰减不会叠加，取最优）
    const timingMultiplier = Math.max(maxBoosterMultiplier * minPenaltyMultiplier, 0.2)

    // 9. 检测互动组合
    const combo = await this.detectInteractionCombo(matchId, interactionType)
    const comboBonus = combo ? INTERACTION_COMBOS.find(c => c.id === combo)?.bonusEnergy || 0 : 0

    // 10. 计算总能量
    const totalEnergy = Math.round(
      (baseEnergy * qualityMultiplier * timingMultiplier) + durationBonus + breakthroughBonus + comboBonus
    )

    return {
      baseEnergy,
      qualityMultiplier,
      timingMultiplier,
      bonusEnergy: durationBonus + breakthroughBonus + comboBonus,
      totalEnergy: Math.max(totalEnergy, 1), // 最少1点能量
      activeBoosters,
      activePenalties,
      comboDetected: combo || undefined,
    }
  }

  /**
   * 获取当前有效的时机加成和衰减
   */
  async getActiveTimingEffects(matchId: number): Promise<{
    boosters: Array<{ id: string; name: string; description: string; multiplier: number }>
    penalties: Array<{ id: string; name: string; description: string; multiplier: number }>
    recommendations: string[]
  }> {
    const context = await this.buildTimingContext(matchId)

    const boosters = TIMING_BOOSTERS
      .filter(b => b.detectCondition(context))
      .map(b => ({
        id: b.id,
        name: b.name,
        description: b.description,
        multiplier: b.multiplier,
      }))

    const penalties = TIMING_PENALTIES
      .filter(p => p.detectCondition(context))
      .map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        multiplier: p.multiplier,
      }))

    // 生成建议
    const recommendations = this.generateRecommendations(boosters, penalties, context)

    return { boosters, penalties, recommendations }
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

    // 获取关系阶段
    const context = await this.buildTimingContext(matchId)
    const currentStage = this.determineRelationshipStage(context)

    // 获取当前有效的加成和衰减
    const { boosters, penalties } = await this.getActiveTimingEffects(matchId)
    const activeBoosters = boosters.map(b => b.id)
    const activePenalties = penalties.map(p => p.id)

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
        current_stage: currentStage,
        active_boosters: activeBoosters,
        active_penalties: activePenalties,
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
   * 构建时机检测上下文
   */
  private async buildTimingContext(matchId: number): Promise<TimingContext> {
    // 获取匹配对象信息
    const { data: match } = await getSupabaseClient()
      .from('matches')
      .select('created_at')
      .eq('id', matchId)
      .single()

    const relationshipStartDate = match?.created_at ? new Date(match.created_at as string) : undefined
    const relationshipDays = relationshipStartDate
      ? Math.floor((Date.now() - relationshipStartDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    // 获取互动记录
    const { data: interactions } = await getSupabaseClient()
      .from('interaction_events')
      .select('started_at, mood, breakthrough_moment, interaction_type')
      .eq('match_id', matchId)
      .order('started_at', { ascending: false })
      .limit(20)

    const lastInteraction = interactions?.[0]
    const lastInteractionDays = lastInteraction?.started_at
      ? Math.floor((Date.now() - new Date(lastInteraction.started_at as string).getTime()) / (1000 * 60 * 60 * 24))
      : -1

    // 获取周期信息（如果有）
    const { data: cycleData } = await getSupabaseClient()
      .from('profile_dimension_values')
      .select('dimension_key, value')
      .eq('match_id', matchId)
      .in('dimension_key', ['cycleStartDate', 'cycleLength'])

    let cyclePhase: string | undefined
    let cycleDay: number | undefined

    if (cycleData && cycleData.length >= 2) {
      const cycleStart = cycleData.find(d => d.dimension_key === 'cycleStartDate')?.value as string
      const cycleLength = Number(cycleData.find(d => d.dimension_key === 'cycleLength')?.value) || 28

      if (cycleStart) {
        const startDate = new Date(cycleStart)
        const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        cycleDay = (daysSinceStart % cycleLength) + 1
        cyclePhase = this.determineCyclePhase(cycleDay)
      }
    }

    // 提取突破性时刻
    const breakthroughEvents = interactions
      ?.filter(i => i.breakthrough_moment)
      .map(i => i.started_at as string) || []

    // 提取最近心情
    const recentMoods = interactions
      ?.filter(i => i.mood)
      .map(i => i.mood as string) || []

    // 获取特殊日期（生日、纪念日等）
    const specialDates = await this.getSpecialDates(matchId)

    return {
      matchId,
      relationshipStartDate,
      relationshipDays,
      lastInteractionDays,
      cyclePhase,
      cycleDay,
      breakthroughEvents,
      recentMoods,
      totalInteractions: interactions?.length || 0,
      specialDates,
    }
  }

  /**
   * 获取特殊日期
   */
  private async getSpecialDates(matchId: number): Promise<SpecialDate[]> {
    const dates: SpecialDate[] = []

    // 获取维度中的生日
    const { data: birthdayData } = await getSupabaseClient()
      .from('profile_dimension_values')
      .select('value')
      .eq('match_id', matchId)
      .eq('dimension_key', 'birthday')
      .single()

    if (birthdayData?.value) {
      const birthday = new Date(birthdayData.value as string)
      // 今年的生日
      const thisYearBirthday = new Date(new Date().getFullYear(), birthday.getMonth(), birthday.getDate())
      dates.push({
        date: thisYearBirthday,
        type: 'birthday',
        name: '生日',
      })
    }

    // 获取纪念日（关系开始日期）
    const { data: match } = await getSupabaseClient()
      .from('matches')
      .select('created_at')
      .eq('id', matchId)
      .single()

    if (match?.created_at) {
      const startDate = new Date(match.created_at as string)
      // 今年的纪念日
      const thisYearAnniversary = new Date(new Date().getFullYear(), startDate.getMonth(), startDate.getDate())
      dates.push({
        date: thisYearAnniversary,
        type: 'anniversary',
        name: '纪念日',
      })
    }

    // 添加节日（简化处理，实际应该更精确）
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()

    // 情人节
    if (month === 2 && day >= 12 && day <= 16) {
      dates.push({
        date: new Date(now.getFullYear(), 1, 14),
        type: 'holiday',
        name: '情人节',
      })
    }

    // 七夕（简化，实际需要农历计算）
    // 圣诞节
    if (month === 12 && day >= 23 && day <= 27) {
      dates.push({
        date: new Date(now.getFullYear(), 11, 25),
        type: 'holiday',
        name: '圣诞节',
      })
    }

    return dates
  }

  /**
   * 确定生理周期阶段
   */
  private determineCyclePhase(day: number): string {
    if (day >= 1 && day <= 5) return 'menstrual'
    if (day >= 6 && day <= 13) return 'follicular'
    if (day >= 14 && day <= 16) return 'ovulation'
    return 'luteal'
  }

  /**
   * 检测互动组合
   */
  private async detectInteractionCombo(
    matchId: number,
    newInteractionType: string
  ): Promise<string | null> {
    // 获取最近的互动记录
    const { data: recentInteractions } = await getSupabaseClient()
      .from('interaction_events')
      .select('interaction_type, started_at')
      .eq('match_id', matchId)
      .order('started_at', { ascending: false })
      .limit(10)

    if (!recentInteractions) return null

    // 添加新的互动类型
    const allTypes = [newInteractionType, ...recentInteractions.map(i => i.interaction_type as string)]

    // 检测每个组合
    for (const combo of INTERACTION_COMBOS) {
      const hasAllTypes = combo.requiredTypes.every(type => allTypes.includes(type))
      
      // 检查时间窗口
      let withinWindow = false
      if (combo.timeWindow === 1) {
        // 同一天
        const today = new Date().toDateString()
        const todayInteractions = recentInteractions.filter(i => 
          new Date(i.started_at as string).toDateString() === today
        )
        withinWindow = todayInteractions.length > 0 || combo.requiredTypes.includes(newInteractionType)
      } else {
        // 时间窗口内
        const windowStart = new Date()
        windowStart.setDate(windowStart.getDate() - combo.timeWindow)
        
        const windowInteractions = recentInteractions.filter(i => 
          new Date(i.started_at as string) >= windowStart
        )
        withinWindow = windowInteractions.length >= combo.requiredTypes.length - 1
      }

      if (hasAllTypes && withinWindow) {
        return combo.id
      }
    }

    return null
  }

  /**
   * 确定关系阶段
   */
  private determineRelationshipStage(context: TimingContext): string {
    if (context.relationshipDays === 0) return '刚刚认识'
    if (context.relationshipDays <= 7) return '初识期'
    if (context.relationshipDays <= 30) return '热恋初期'
    if (context.relationshipDays <= 90) return '热恋期'
    if (context.relationshipDays <= 180) return '稳定期'
    if (context.relationshipDays <= 365) return '深化期'
    return '成熟期'
  }

  /**
   * 生成建议
   */
  private generateRecommendations(
    boosters: Array<{ id: string; name: string; description: string; multiplier: number }>,
    penalties: Array<{ id: string; name: string; description: string; multiplier: number }>,
    context: TimingContext
  ): string[] {
    const recommendations: string[] = []

    // 优先处理衰减（紧急建议）
    if (penalties.some(p => p.id === 'long_silence')) {
      recommendations.push('💡 已经超过一周没有互动了，建议主动发起一次约会或聊天')
    }
    if (penalties.some(p => p.id === 'conflict_period')) {
      recommendations.push('❤️ 最近互动有些尴尬，尝试真诚沟通化解矛盾')
    }
    if (penalties.some(p => p.id === 'routine_boredom')) {
      recommendations.push('🎉 尝试一些新的互动方式，比如一起参加社交活动或送个小礼物')
    }

    // 利用加成（时机建议）
    if (boosters.some(b => b.id === 'early_relationship')) {
      recommendations.push('✨ 热恋初期，多安排约会和深度沟通，建立良好基础')
    }
    if (boosters.some(b => b.id === 'ovulation_intimacy')) {
      recommendations.push('💕 当前是亲密互动的最佳时期，适合安排浪漫约会')
    }
    if (boosters.some(b => b.id === 'emotional_vulnerable_care')) {
      recommendations.push('🤗 对方可能需要更多关怀和理解，多一些耐心和体贴')
    }
    if (boosters.some(b => b.id === 'birthday_period' || b.id === 'anniversary_period')) {
      recommendations.push('🎂 重要日子快到了，准备一份特别的礼物或安排一场难忘的约会')
    }
    if (boosters.some(b => b.id === 'reunion_joy')) {
      recommendations.push('🌟 重逢时刻，准备一个小惊喜会让对方很开心')
    }

    // 默认建议
    if (recommendations.length === 0) {
      if (context.lastInteractionDays > 3) {
        recommendations.push('📞 好几天没联系了，主动打个招呼吧')
      } else {
        recommendations.push('💪 保持当前的互动节奏，关系正在稳步发展')
      }
    }

    return recommendations
  }

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
      currentStage: data.current_stage as string || '',
      activeBoosters: data.active_boosters as string[] || [],
      activePenalties: data.active_penalties as string[] || [],
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
