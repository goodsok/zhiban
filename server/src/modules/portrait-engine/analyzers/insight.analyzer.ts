/**
 * AI 洞察分析器
 *
 * 聚合该对象的全部数据，调用 LLM 进行深度洞察分析
 * 重点：发现用户不易觉察的隐蔽模式、矛盾信号、潜在风险
 * 支持持久化：分析结果存入数据库，刷新不丢失
 */

import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'

/**
 * 隐蔽信号 — AI 发现但用户不易察觉的深层模式
 */
export interface HiddenSignal {
  /** 信号类型: contradiction(矛盾信号) / pattern(隐蔽模式) / risk(潜在风险) / opportunity(被忽略的机会) */
  type: 'contradiction' | 'pattern' | 'risk' | 'opportunity'
  /** 信号标题 */
  title: string
  /** 具体描述（含数据支撑） */
  description: string
  /** AI的判断依据（哪几个数据交叉得出） */
  evidence: string
}

/**
 * 洞察分析结果
 */
export interface InsightAnalysisResult {
  /** 性格深层洞察 — 不只是描述性格，而是揭示性格背后可能的成因和驱动力 */
  personalitySummary: string
  /** 关系动态 — 不只是互动频率，而是揭示权力结构、依附模式等深层动态 */
  relationshipDynamics: string
  /** 情感模式 — 不只是情绪稳定性分数，而是揭示情感表达与真实感受的落差 */
  emotionalPatterns: string
  /** 沟通风格 — 不只是回复速度，而是揭示言外之意、回避话题等深层沟通特征 */
  communicationStyle: string
  /** 关键发现（3-5条）— 每条要让人"原来如此"而非"我也知道" */
  keyFindings: string[]
  /** 盲点提醒（2-4条）— 你以为自己理解但其实可能误判的方面 */
  blindSpots: string[]
  /** 隐蔽信号（2-4条）— AI从数据交叉分析中发现的、用户极难自行发现的深层模式 */
  hiddenSignals: HiddenSignal[]
  /** 成长建议（2-4条）— 基于洞察的具体可执行建议 */
  growthSuggestions: string[]
  /** 行动优先级建议 */
  actionPriority: string
}

@Injectable()
export class InsightAnalyzer {
  /**
   * 执行深度洞察分析（带持久化）
   * 优先返回已缓存的结果，否则生成新结果并存储
   */
  async analyze(matchId: number, request: Request, forceRefresh = false): Promise<InsightAnalysisResult> {
    // 1. 非强制刷新时，先检查缓存
    if (!forceRefresh) {
      const cached = await this.loadFromCache(matchId)
      if (cached) {
        console.log(`[InsightAnalyzer] Returning cached insight for match ${matchId}`)
        return cached
      }
    }

    // 2. 聚合所有数据
    const aggregatedData = await this.aggregateAllData(matchId)

    // 3. 检查是否有足够数据
    if (!aggregatedData.hasEnoughData) {
      const result = this.getInsufficientDataResult()
      // 数据不足也缓存，避免重复生成
      await this.saveToCache(matchId, result, 'insufficient')
      return result
    }

    // 4. 调用 LLM 深度分析
    try {
      const result = await this.analyzeWithLLM(aggregatedData, request)
      const fingerprint = this.computeDataFingerprint(aggregatedData)
      await this.saveToCache(matchId, result, fingerprint)
      return result
    } catch (error) {
      console.error('Insight analysis LLM error:', error)
      const result = this.getFallbackResult(aggregatedData)
      await this.saveToCache(matchId, result, 'fallback')
      return result
    }
  }

  /**
   * 从数据库加载已缓存的洞察
   */
  private async loadFromCache(matchId: number): Promise<InsightAnalysisResult | null> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('insight_cache')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return null

    return {
      personalitySummary: data.personality_summary,
      relationshipDynamics: data.relationship_dynamics,
      emotionalPatterns: data.emotional_patterns,
      communicationStyle: data.communication_style,
      keyFindings: data.key_findings as string[],
      blindSpots: data.blind_spots as string[],
      hiddenSignals: (data.hidden_signals as HiddenSignal[]) || [],
      growthSuggestions: data.growth_suggestions as string[],
      actionPriority: data.action_priority,
    }
  }

  /**
   * 保存洞察结果到数据库
   */
  private async saveToCache(matchId: number, result: InsightAnalysisResult, fingerprint: string): Promise<void> {
    const client = getSupabaseClient()

    // 先删除旧缓存（每个 match 只保留最新一条）
    await client.from('insight_cache').delete().eq('match_id', matchId)

    const { error } = await client.from('insight_cache').insert({
      match_id: matchId,
      personality_summary: result.personalitySummary,
      relationship_dynamics: result.relationshipDynamics,
      emotional_patterns: result.emotionalPatterns,
      communication_style: result.communicationStyle,
      key_findings: result.keyFindings,
      blind_spots: result.blindSpots,
      hidden_signals: result.hiddenSignals,
      growth_suggestions: result.growthSuggestions,
      action_priority: result.actionPriority,
      data_fingerprint: fingerprint,
    })

    if (error) {
      console.error('[InsightAnalyzer] Failed to save cache:', error)
    }
  }

  /**
   * 计算数据指纹（用于判断数据是否有变化，决定是否需要重新分析）
   */
  private computeDataFingerprint(data: Awaited<ReturnType<typeof this.aggregateAllData>>): string {
    const parts: string[] = []
    // 画像置信度
    if (data.portrait) parts.push(`p:${data.portrait.confidence}`)
    // 互动数量
    parts.push(`i:${data.interactions?.length || 0}`)
    // 聊天记录数量
    parts.push(`c:${data.chatRecords?.length || 0}`)
    // 关系能量
    if (data.energy) parts.push(`e:${data.energy.total_energy}`)
    // 维度数量
    parts.push(`d:${data.dimensions?.length || 0}`)
    // 任务数量
    parts.push(`t:${data.tasks?.length || 0}`)
    // 历史数量
    parts.push(`h:${data.history?.length || 0}`)
    return parts.join('|')
  }

  /**
   * 聚合该对象的所有数据
   */
  private async aggregateAllData(matchId: number) {
    const client = getSupabaseClient()

    // 并行查询所有数据源
    const [
      matchResult,
      portraitResult,
      behaviorResult,
      manualResult,
      chatRecordsResult,
      interactionsResult,
      energyResult,
      dimensionsResult,
      tasksResult,
      historyResult,
      energyHistoryResult,
    ] = await Promise.all([
      // 基本信息
      client.from('matches').select('*').eq('id', matchId).maybeSingle(),
      // 画像维度
      client.from('profile_portraits').select('*').eq('match_id', matchId).maybeSingle(),
      // 行为模式
      client.from('behavior_patterns').select('*').eq('match_id', matchId).maybeSingle(),
      // 手动行为数据
      client.from('manual_behavior_data').select('*').eq('match_id', matchId).maybeSingle(),
      // 聊天记录
      client.from('chat_records').select('*').eq('match_id', matchId).eq('analysis_status', 'completed').order('created_at', { ascending: false }),
      // 互动事件（最近30条，加大样本量以便发现深层模式）
      client.from('interaction_events').select('*').eq('match_id', matchId).order('created_at', { ascending: false }).limit(30),
      // 关系能量
      client.from('relationship_energy').select('*').eq('match_id', matchId).maybeSingle(),
      // 维度值
      client.from('dimension_values').select('*').eq('match_id', matchId),
      // 任务
      client.from('tasks').select('*').eq('match_id', matchId).order('created_at', { ascending: false }).limit(20),
      // 画像变化历史
      client.from('profile_histories').select('*').eq('match_id', matchId).order('created_at', { ascending: false }).limit(10),
      // 关系能量历史（用于发现趋势和异常）
      client.from('relationship_energy_history').select('*').eq('match_id', matchId).order('created_at', { ascending: false }).limit(10),
    ])

    const match = matchResult.data
    const portrait = portraitResult.data
    const behavior = behaviorResult.data
    const manual = manualResult.data
    const chatRecords = chatRecordsResult.data || []
    const interactions = interactionsResult.data || []
    const energy = energyResult.data
    const dimensions = dimensionsResult.data || []
    const tasks = tasksResult.data || []
    const history = historyResult.data || []
    const energyHistory = energyHistoryResult.data || []

    // 判断是否有足够数据
    const hasPortrait = portrait && portrait.confidence > 0
    const hasBehavior = behavior && (behavior.total_interactions > 0 || behavior.avg_response_time !== null)
    const hasManual = !!manual
    const hasInteractions = interactions.length > 0
    const hasDimensions = dimensions.length > 0
    const hasChatRecords = chatRecords.length > 0

    const hasEnoughData = hasPortrait || hasBehavior || hasManual || hasInteractions || hasDimensions

    return {
      match,
      portrait,
      behavior,
      manual,
      chatRecords,
      interactions,
      energy,
      dimensions,
      tasks,
      history,
      energyHistory,
      hasEnoughData,
      hasPortrait,
      hasBehavior,
      hasManual,
      hasInteractions,
      hasDimensions,
      hasChatRecords,
    }
  }

  /**
   * 使用 LLM 进行深度分析
   */
  private async analyzeWithLLM(data: Awaited<ReturnType<typeof this.aggregateAllData>>, request: Request): Promise<InsightAnalysisResult> {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const prompt = this.buildInsightPrompt(data)

    const response = await client.invoke([
      { role: 'user', content: prompt }
    ], { temperature: 0.7 })

    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as InsightAnalysisResult
        // 确保 hiddenSignals 存在
        if (!parsed.hiddenSignals || !Array.isArray(parsed.hiddenSignals)) {
          parsed.hiddenSignals = []
        }
        return parsed
      } catch (e) {
        console.error('Failed to parse insight JSON:', e)
      }
    }

    return this.getFallbackResult(data)
  }

  /**
   * 构建深度洞察分析提示词
   * 核心：不是解读档案，而是发现用户看不到的隐蔽模式
   */
  private buildInsightPrompt(data: Awaited<ReturnType<typeof this.aggregateAllData>>): string {
    const sections: string[] = []
    const name = data.match?.name || '对方'

    sections.push(`你是一位极其敏锐的关系心理分析师，擅长从看似普通的数据中发现人眼难以察觉的隐蔽模式。你的洞察不是对数据的复述，而是对数据背后的深层含义的揭示。

【你的核心能力】
- 发现数据之间的矛盾和张力（比如：说想亲近，行为却退缩）
- 捕捉微妙的信号组合（比如：某个时段的活跃度突变暗示了什么）
- 识别用户自身的认知偏差（比如：用户以为对方不在意，但数据表明相反）
- 从多维度交叉中提炼非常规发现（比如：情感表达和实际行为的落差）

【分析原则】
1. 不要复述数据——"对方外向性70分"不是洞察，"对方虽然社交活跃但深层亲密需求被忽视"才是洞察
2. 要有意外感——用户读完应该觉得"我没想到这一点"而非"我也知道"
3. 要有证据链——每个结论都要指向具体数据交叉，不是凭空推测
4. 要有实用性——指出隐藏风险或被忽略的机会，给出可操作建议
5. 尤其关注矛盾——言行不一、情绪波动周期、回避特定话题等隐蔽信号

请基于以下关于"${name}"的全部数据，进行深度人物洞察分析。用中文回答。`)

    // === 1. 基本信息 ===
    if (data.match) {
      const m = data.match
      const parts: string[] = []
      if (m.name) parts.push(`姓名: ${m.name}`)
      if (m.gender) parts.push(`性别: ${m.gender === 'female' ? '女' : m.gender === 'male' ? '男' : m.gender}`)
      if (m.relationship_type && m.relationship_type !== 'undefined') parts.push(`关系类型: ${m.relationship_type === 'long_term' ? '长期关系' : m.relationship_type === 'short_term' ? '短期关系' : '灵活'}`)
      if (m.meeting_scene && m.meeting_scene !== 'other') parts.push(`认识场景: ${m.meeting_scene}`)
      if (m.impression_tags && m.impression_tags.length > 0) parts.push(`印象标签: ${m.impression_tags.join('、')}`)
      if (m.notes) parts.push(`备注: ${m.notes}`)
      if (m.status) parts.push(`关系状态: ${m.status}`)
      if (parts.length > 0) {
        sections.push(`\n【基本信息】\n${parts.join('\n')}`)
      }
    }

    // === 2. 画像维度 ===
    if (data.portrait) {
      const p = data.portrait
      const parts: string[] = []
      if (p.confidence !== undefined) parts.push(`画像置信度: ${p.confidence}%`)
      // 人格维度
      parts.push(`开放性: ${p.personality_openness ?? 50}, 尽责性: ${p.personality_conscientiousness ?? 50}, 外向性: ${p.personality_extraversion ?? 50}, 宜人性: ${p.personality_agreeableness ?? 50}, 神经质: ${p.personality_neuroticism ?? 50}`)
      // 情感维度
      parts.push(`情绪稳定性: ${p.emotional_stability ?? 50}, 情感表达: ${p.emotional_expression ?? 50}, 共情力: ${p.emotional_empathy ?? 50}, 独立性: ${p.emotional_independence ?? 50}`)
      // 社交维度
      parts.push(`社交活跃度: ${p.social_activity ?? 50}, 社交主动性: ${p.social_initiative ?? 50}, 亲密需求: ${p.social_intimacy ?? 50}, 信任倾向: ${p.social_trust ?? 50}`)
      // 沟通维度
      parts.push(`直接度: ${p.communication_directness ?? 50}, 幽默感: ${p.communication_humor ?? 50}, 响应速度: ${p.communication_responsiveness ?? 50}, 深度偏好: ${p.communication_depth ?? 50}`)
      // 互动风格
      if (p.interaction_style) parts.push(`互动风格: ${p.interaction_style}`)
      if (p.preferred_topic_types && p.preferred_topic_types.length > 0) parts.push(`偏好话题类型: ${p.preferred_topic_types.join('、')}`)
      if (p.active_time_slots && p.active_time_slots.length > 0) parts.push(`活跃时段: ${p.active_time_slots.join('、')}`)

      sections.push(`\n【画像维度（0-100）】\n${parts.join('\n')}`)
    }

    // === 3. 行为模式 ===
    if (data.behavior && data.hasBehavior) {
      const b = data.behavior
      const parts: string[] = []
      if (b.avg_response_time !== null) parts.push(`平均回复时间: ${b.avg_response_time}分钟`)
      if (b.emoji_usage_rate) parts.push(`表情使用率: ${b.emoji_usage_rate}%`)
      if (b.question_rate) parts.push(`提问率: ${b.question_rate}%`)
      if (b.initiative_rate) parts.push(`主动发起率: ${b.initiative_rate}%`)
      if (b.message_length_avg) parts.push(`平均消息长度: ${b.message_length_avg}字`)
      if (b.total_interactions) parts.push(`总互动次数: ${b.total_interactions}`)
      if (b.topic_categories && Object.keys(b.topic_categories).length > 0) {
        parts.push(`话题分布: ${Object.entries(b.topic_categories as Record<string, number>).map(([k, v]) => `${k}(${v})`).join('、')}`)
      }
      if (b.emotional_keywords && b.emotional_keywords.length > 0) {
        parts.push(`情绪关键词: ${(b.emotional_keywords as string[]).join('、')}`)
      }
      if (b.active_hours && Object.keys(b.active_hours).length > 0) {
        const topHours = Object.entries(b.active_hours as Record<string, number>)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([h, c]) => `${h}点(${c}次)`)
        parts.push(`最活跃时段: ${topHours.join('、')}`)
      }
      parts.push(`数据来源: ${b.data_source === 'chat_record' ? '聊天记录分析' : b.data_source === 'manual' ? '手动填写' : '混合'}`)

      sections.push(`\n【行为模式】\n${parts.join('\n')}`)
    }

    // === 4. 手动填写数据 ===
    if (data.manual) {
      const m = data.manual
      const parts: string[] = []
      if (m.response_speed) {
        const speedMap: Record<string, string> = { instant: '秒回', fast: '很快', normal: '正常', slow: '较慢', very_slow: '很慢' }
        parts.push(`回复速度: ${speedMap[m.response_speed] || m.response_speed}`)
      }
      if (m.active_time_slots && m.active_time_slots.length > 0) parts.push(`活跃时段: ${(m.active_time_slots as string[]).join('、')}`)
      if (m.topic_preferences && m.topic_preferences.length > 0) parts.push(`话题偏好: ${(m.topic_preferences as string[]).join('、')}`)
      if (m.communication_style) {
        const styleMap: Record<string, string> = { direct: '直接', indirect: '委婉', balanced: '均衡' }
        parts.push(`沟通风格: ${styleMap[m.communication_style] || m.communication_style}`)
      }
      if (m.notes) parts.push(`观察备注: ${m.notes}`)

      if (parts.length > 0) {
        sections.push(`\n【手动观察数据】\n${parts.join('\n')}`)
      }
    }

    // === 5. 聊天记录分析 ===
    if (data.hasChatRecords) {
      const records = data.chatRecords
      const parts: string[] = []
      parts.push(`聊天截图数量: ${records.length}`)

      // 汇总所有聊天记录的关键词和摘要
      const allKeywords: string[] = []
      for (const r of records) {
        if (r.topic_keywords && (r.topic_keywords as string[]).length > 0) {
          allKeywords.push(...(r.topic_keywords as string[]))
        }
      }
      const uniqueKeywords = [...new Set(allKeywords)].slice(0, 20)
      if (uniqueKeywords.length > 0) {
        parts.push(`话题关键词: ${uniqueKeywords.join('、')}`)
      }

      // 最近一条的分析概要
      const latest = records[0]
      if (latest) {
        if (latest.message_count) parts.push(`最近一次消息数: ${latest.message_count}`)
        if (latest.emoji_usage_rate) parts.push(`最近一次表情率: ${latest.emoji_usage_rate}%`)
      }

      sections.push(`\n【聊天记录分析】\n${parts.join('\n')}`)
    }

    // === 6. 互动记录 ===
    if (data.hasInteractions) {
      const events = data.interactions
      const parts: string[] = []
      parts.push(`互动事件总数: ${events.length}`)

      // 统计互动类型分布
      const typeCount: Record<string, number> = {}
      let totalQuality = 0
      let qualityCount = 0
      const allActivities: string[] = []
      const allBreakthroughs: string[] = []
      const allIssues: string[] = []

      for (const e of events) {
        typeCount[e.interaction_type] = (typeCount[e.interaction_type] || 0) + 1
        if (e.quality_score) {
          totalQuality += e.quality_score
          qualityCount++
        }
        if (e.activities) allActivities.push(...(e.activities as string[]))
        if (e.breakthrough_moment) allBreakthroughs.push(e.breakthrough_moment)
        if (e.issues_encountered) allIssues.push(e.issues_encountered)
      }

      const typeLabels: Record<string, string> = { date: '约会', chat: '聊天', call: '通话', video: '视频', message: '消息', gift: '礼物', physical: '亲密接触', social: '社交', other: '其他' }
      const typeDesc = Object.entries(typeCount).map(([k, v]) => `${typeLabels[k] || k}(${v}次)`).join('、')
      parts.push(`互动类型分布: ${typeDesc}`)

      if (qualityCount > 0) parts.push(`平均互动质量: ${Math.round(totalQuality / qualityCount)}/100`)

      const uniqueActivities = [...new Set(allActivities)].slice(0, 10)
      if (uniqueActivities.length > 0) parts.push(`共同活动: ${uniqueActivities.join('、')}`)
      if (allBreakthroughs.length > 0) parts.push(`突破性时刻: ${allBreakthroughs.slice(0, 3).join('；')}`)
      if (allIssues.length > 0) parts.push(`遇到的问题: ${allIssues.slice(0, 3).join('；')}`)

      // 发起方分析
      const initiatorCount: Record<string, number> = {}
      for (const e of events) {
        if (e.initiator) initiatorCount[e.initiator] = (initiatorCount[e.initiator] || 0) + 1
      }
      if (Object.keys(initiatorCount).length > 0) {
        const initLabels: Record<string, string> = { self: '我方', partner: '对方', mutual: '双方' }
        const initDesc = Object.entries(initiatorCount).map(([k, v]) => `${initLabels[k] || k}(${v}次)`).join('、')
        parts.push(`互动发起方: ${initDesc}`)
      }

      // 时间间隔分析（用于发现隐蔽模式）
      if (events.length >= 3) {
        const timestamps = events.map(e => new Date(e.created_at).getTime()).filter(t => !isNaN(t))
        if (timestamps.length >= 3) {
          const intervals: number[] = []
          for (let i = 1; i < timestamps.length; i++) {
            intervals.push(Math.round((timestamps[i - 1] - timestamps[i]) / (1000 * 60 * 60))) // 小时
          }
          const avgInterval = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
          const maxInterval = Math.max(...intervals)
          const minInterval = Math.min(...intervals)
          parts.push(`互动间隔: 平均${avgInterval}小时, 最长${maxInterval}小时, 最短${minInterval}小时`)
        }
      }

      sections.push(`\n【互动记录（最近${events.length}条）】\n${parts.join('\n')}`)
    }

    // === 7. 关系能量 ===
    if (data.energy) {
      const e = data.energy
      const parts: string[] = []
      parts.push(`关系能量: ${e.total_energy}/100`)
      parts.push(`信息维度: ${e.information_score}/100, 互动维度: ${e.interaction_score}/100, 情感维度: ${e.emotional_score}/100`)
      const trendLabels: Record<string, string> = { rising: '上升', stable: '稳定', declining: '下降', stagnant: '停滞' }
      parts.push(`趋势: ${trendLabels[e.trend] || e.trend}`)
      if (e.current_stage) parts.push(`关系阶段: ${e.current_stage}`)
      if (e.last_interaction_days >= 0) parts.push(`距上次互动: ${e.last_interaction_days}天`)
      if (e.breakthrough_count > 0) parts.push(`突破性时刻: ${e.breakthrough_count}次`)
      if (e.dimension_completeness > 0) parts.push(`信息完整度: ${e.dimension_completeness}%`)

      sections.push(`\n【关系能量】\n${parts.join('\n')}`)
    }

    // === 8. 关系能量历史（用于发现趋势和突变） ===
    if (data.energyHistory && data.energyHistory.length >= 2) {
      const parts: string[] = []
      for (const h of data.energyHistory.slice(0, 5)) {
        const date = new Date(h.created_at).toLocaleDateString('zh-CN')
        parts.push(`${date}: 能量${h.total_energy}, 信息${h.information_score}, 互动${h.interaction_score}, 情感${h.emotional_score}`)
      }
      sections.push(`\n【关系能量变化趋势】\n${parts.join('\n')}`)
    }

    // === 9. 维度值详情 ===
    if (data.hasDimensions) {
      const dims = data.dimensions
      const parts: string[] = []
      for (const d of dims) {
        const key = d.dimension_key
        const val = d.value
        let valueStr = ''
        if (typeof val === 'string') {
          valueStr = val
        } else if (Array.isArray(val)) {
          valueStr = val.join('、')
        } else if (typeof val === 'object' && val !== null) {
          valueStr = JSON.stringify(val)
        } else {
          valueStr = String(val)
        }
        if (valueStr) {
          parts.push(`${key}: ${valueStr}`)
        }
      }

      if (parts.length > 0) {
        const grouped: string[] = []
        for (let i = 0; i < parts.length; i += 5) {
          grouped.push(parts.slice(i, i + 5).join('；'))
        }
        sections.push(`\n【个人详情（维度数据）】\n${grouped.join('\n')}`)
      }
    }

    // === 10. 任务完成情况 ===
    if (data.tasks && data.tasks.length > 0) {
      const t = data.tasks
      const completed = t.filter(x => x.completed === 1).length
      const parts: string[] = []
      parts.push(`任务总数: ${t.length}, 已完成: ${completed}`)
      const recentCompleted = t.filter(x => x.completed === 1).slice(0, 5)
      if (recentCompleted.length > 0) {
        parts.push(`已完成: ${recentCompleted.map(x => x.title).join('、')}`)
      }
      const pending = t.filter(x => x.completed === 0).slice(0, 5)
      if (pending.length > 0) {
        parts.push(`待完成: ${pending.map(x => x.title).join('、')}`)
      }

      sections.push(`\n【任务进展】\n${parts.join('\n')}`)
    }

    // === 11. 画像变化历史 ===
    if (data.history && data.history.length > 0) {
      const h = data.history.slice(0, 5)
      const parts = h.map(x => {
        const reasonLabels: Record<string, string> = { chat_analysis: '聊天分析', behavior_update: '行为更新', manual: '手动更新' }
        return `${x.dimension}: ${x.old_value}→${x.new_value}（${reasonLabels[x.change_reason] || x.change_reason}）`
      })
      sections.push(`\n【画像变化趋势（最近${h.length}条）】\n${parts.join('\n')}`)
    }

    // === 输出要求（核心：追求深度和意外感） ===
    sections.push(`\n请基于以上全部数据，生成真正的深度洞察。记住：你不是在复述数据，你是在揭示数据背后人眼看不见的深层模式。

返回严格JSON格式：
{
  "personalitySummary": "2-3句深层性格洞察。不是描述表面特征，而是揭示性格背后的驱动力和内在矛盾。例如不要说'对方性格外向'，而要说'对方用社交活跃掩饰深层的不安全感，在人群中表现活泼但独处时容易陷入自我怀疑'",
  "relationshipDynamics": "2-3句关系动态洞察。揭示权力结构、依附模式、隐性博弈。例如'看似你在主动追求，但对方通过延迟回复和偶尔的热情投喂维持着微妙的主导权——每当你快要放弃时，对方总会释放一点信号重新拉你回来'",
  "emotionalPatterns": "2-3句情感模式洞察。揭示情感表达与真实感受的落差、情绪周期的隐藏规律。例如'对方的情感表达存在明显的周期性波动，活跃期和回避期交替出现，这种模式往往与对亲密关系的恐惧有关'",
  "communicationStyle": "2-3句沟通风格洞察。揭示言外之意、回避话题、隐性信号。例如'对方虽然表面上沟通直接，但在涉及承诺和未来规划的话题上会巧妙地转移方向，这是一种隐性的回避策略'",
  "keyFindings": ["3-5条关键发现，每条必须让人意外或恍然大悟，格式如'对方的表情使用率虽然高(XX%)，但主要集中在轻松话题，在严肃对话中几乎不用表情——这不是不善表达，而是在重要时刻有意识地控制情感暴露'"],
  "blindSpots": ["2-4条盲点，指出你可能误判或忽略的方面，格式如'你可能以为对方不主动是因为不感兴趣，但数据显示对方在你发起话题时的参与度远高于平均水平——问题可能不是兴趣，而是对方不习惯主动'"],
  "hiddenSignals": [
    {
      "type": "contradiction或pattern或risk或opportunity",
      "title": "5字以内的信号名称",
      "description": "对这个隐蔽信号的详细解读，包括它意味着什么、为什么用户不容易发现",
      "evidence": "这个结论来自哪几个数据的交叉分析"
    }
  ],
  "growthSuggestions": ["2-4条具体可执行的建议，每条基于某个洞察发现，格式如'对方在周末的互动质量明显高于工作日（数据显示周末平均回复时间快XX%），建议把重要话题安排在周末'"],
  "actionPriority": "1句话的最优先行动建议，要基于最关键的发现"
}

【hiddenSignals的type说明】
- contradiction: 数据中存在矛盾（如声称x但行为显示y）
- pattern: 数据交叉揭示的隐蔽模式（如特定条件下的行为规律）
- risk: 潜在的风险信号（如关系中的不健康模式）
- opportunity: 被忽略的机会（如某个未被利用的窗口期）

至少生成2条hiddenSignals，最多4条。这些是本次分析最有价值的部分——是AI能发现但人很难注意到的。`)

    return sections.join('\n')
  }

  /**
   * 数据不足时的默认结果
   */
  private getInsufficientDataResult(): InsightAnalysisResult {
    return {
      personalitySummary: '数据不足，暂时无法生成性格洞察。请上传聊天记录或填写行为数据。',
      relationshipDynamics: '需要更多互动数据才能分析关系动态。',
      emotionalPatterns: '添加对方的行为数据后，可以分析情感模式。',
      communicationStyle: '上传聊天记录后可以深入了解沟通风格。',
      keyFindings: ['尚未上传聊天记录或填写行为数据，无法进行深度分析'],
      blindSpots: ['当前数据空白本身就是盲点——建议尽快添加数据'],
      hiddenSignals: [{
        type: 'opportunity',
        title: '数据空白',
        description: '当前几乎没有关于对方的行为数据，这意味着你可能在凭直觉而非事实来理解这段关系',
        evidence: '无画像维度数据、无互动记录、无行为模式数据',
      }],
      growthSuggestions: [
        '上传你和Ta的聊天截图，AI会自动分析行为特征',
        '手动填写对方的行为特点，如回复速度、活跃时段等',
        '记录约会等互动事件，积累更完整的关系数据',
      ],
      actionPriority: '先上传聊天截图或手动填写行为数据，建立基础画像',
    }
  }

  /**
   * LLM 失败时的降级结果
   */
  private getFallbackResult(data: Awaited<ReturnType<typeof this.aggregateAllData>>): InsightAnalysisResult {
    const name = data.match?.name || '对方'
    const findings: string[] = []
    const suggestions: string[] = []
    const hiddenSignals: HiddenSignal[] = []

    // 基于画像维度给出简单洞察
    if (data.portrait) {
      const p = data.portrait
      if (p.personality_extraversion > 65 && p.social_intimacy < 40) {
        findings.push(`${name}社交活跃但亲密需求较低，可能在人群中保持表面热络却很少真正深入`)
        hiddenSignals.push({ type: 'contradiction', title: '外向但疏离', description: '对方虽然社交活跃度高但亲密需求低，这种组合暗示可能在用社交活动回避深层连接', evidence: `外向性${p.personality_extraversion} vs 亲密需求${p.social_intimacy}` })
      } else if (p.personality_extraversion > 65) {
        findings.push(`${name}外向性较高，喜欢社交互动`)
      } else if (p.personality_extraversion < 35) {
        findings.push(`${name}性格偏内向，更享受安静的相处`)
      }
      if (p.emotional_stability < 40 && p.emotional_expression > 60) {
        findings.push(`${name}情绪较敏感但表达较多，可能有较强的倾诉需求`)
        hiddenSignals.push({ type: 'pattern', title: '倾诉型情绪', description: '情绪稳定性低但表达高，对方可能在用倾诉来消化情绪，而非寻求解决方案', evidence: `情绪稳定性${p.emotional_stability} vs 情感表达${p.emotional_expression}` })
      } else if (p.emotional_stability < 40) {
        findings.push(`${name}情绪较敏感，需要多给予关心和支持`)
        suggestions.push('对方情绪较敏感，沟通时注意语气和表达方式')
      }
      if (p.communication_directness > 65 && p.emotional_empathy > 65) {
        hiddenSignals.push({ type: 'opportunity', title: '直率+共情', description: '对方既直接又共情，这是罕见的组合——你可以放心说真话，对方既能接受又会理解你的立场', evidence: `直接度${p.communication_directness} vs 共情力${p.emotional_empathy}` })
      }
      if (p.communication_responsiveness > 65) {
        findings.push(`${name}回复速度较快，对互动较积极`)
      }
      if (p.social_initiative > 65) {
        findings.push(`${name}社交主动性较强，经常主动发起交流`)
      }
    }

    if (data.energy) {
      findings.push(`关系能量${data.energy.total_energy}/100，${data.energy.trend === 'rising' ? '处于上升趋势' : data.energy.trend === 'declining' ? '有所下降' : '保持稳定'}`)
    }

    if (data.interactions && data.interactions.length > 0) {
      findings.push(`已有${data.interactions.length}次互动记录`)
    }

    if (findings.length === 0) {
      findings.push('数据有限，建议多记录互动和上传聊天截图')
    }

    if (hiddenSignals.length === 0) {
      hiddenSignals.push({
        type: 'risk',
        title: '数据不足',
        description: '当前数据有限，可能存在重要的隐蔽模式尚未被发现',
        evidence: '画像数据不够完整',
      })
    }

    return {
      personalitySummary: `${name}的画像数据正在积累中，暂无足够信息生成深度洞察。`,
      relationshipDynamics: '关系数据还在积累中，请持续记录互动。',
      emotionalPatterns: '需要更多互动和聊天数据来分析情感模式。',
      communicationStyle: '上传聊天记录后可以更深入了解沟通风格。',
      keyFindings: findings,
      blindSpots: ['当前数据有限，可能存在未发现的重要特征'],
      hiddenSignals,
      growthSuggestions: suggestions.length > 0 ? suggestions : ['持续记录互动和上传聊天数据，AI会越来越了解Ta'],
      actionPriority: '继续积累数据，获得更准确的洞察',
    }
  }
}
