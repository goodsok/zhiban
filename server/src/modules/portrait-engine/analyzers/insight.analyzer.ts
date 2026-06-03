/**
 * AI 洞察分析器
 *
 * 聚合该对象的全部数据，调用 LLM 进行深度洞察分析
 */

import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'

/**
 * 洞察分析结果
 */
export interface InsightAnalysisResult {
  /** 性格综合洞察 */
  personalitySummary: string
  /** 关系动态分析 */
  relationshipDynamics: string
  /** 情感模式洞察 */
  emotionalPatterns: string
  /** 沟通风格分析 */
  communicationStyle: string
  /** 关键发现（3-5条） */
  keyFindings: string[]
  /** 盲点提醒（1-3条） */
  blindSpots: string[]
  /** 成长建议（2-4条） */
  growthSuggestions: string[]
  /** 行动优先级建议 */
  actionPriority: string
}

@Injectable()
export class InsightAnalyzer {
  /**
   * 执行深度洞察分析
   */
  async analyze(matchId: number, request: Request): Promise<InsightAnalysisResult> {
    // 1. 聚合所有数据
    const aggregatedData = await this.aggregateAllData(matchId)

    // 2. 检查是否有足够数据
    if (!aggregatedData.hasEnoughData) {
      return this.getInsufficientDataResult()
    }

    // 3. 调用 LLM 深度分析
    try {
      return await this.analyzeWithLLM(aggregatedData, request)
    } catch (error) {
      console.error('Insight analysis LLM error:', error)
      return this.getFallbackResult(aggregatedData)
    }
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
      // 互动事件（最近20条）
      client.from('interaction_events').select('*').eq('match_id', matchId).order('created_at', { ascending: false }).limit(20),
      // 关系能量
      client.from('relationship_energy').select('*').eq('match_id', matchId).maybeSingle(),
      // 维度值
      client.from('dimension_values').select('*').eq('match_id', matchId),
      // 任务
      client.from('tasks').select('*').eq('match_id', matchId).order('created_at', { ascending: false }).limit(20),
      // 画像变化历史（最近10条）
      client.from('profile_histories').select('*').eq('match_id', matchId).order('created_at', { ascending: false }).limit(10),
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
    ], { temperature: 0.6 })

    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as InsightAnalysisResult
      } catch (e) {
        console.error('Failed to parse insight JSON:', e)
      }
    }

    return this.getFallbackResult(data)
  }

  /**
   * 构建洞察分析提示词
   */
  private buildInsightPrompt(data: Awaited<ReturnType<typeof this.aggregateAllData>>): string {
    const sections: string[] = []

    sections.push(`你是一位资深的关系心理分析师。请基于以下关于"${data.match?.name || '对方'}"的全部数据，进行深度人物洞察分析。
分析要具体、有洞察力，避免空泛。每个维度要有数据支撑。用中文回答。`)

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

    // === 8. 维度值详情 ===
    if (data.hasDimensions) {
      const dims = data.dimensions
      // 按分类整理（dimension_values 只有 dimensionKey 和 value，需要用 key 描述）
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
        // 每5个一行，避免过长
        const grouped: string[] = []
        for (let i = 0; i < parts.length; i += 5) {
          grouped.push(parts.slice(i, i + 5).join('；'))
        }
        sections.push(`\n【个人详情（维度数据）】\n${grouped.join('\n')}`)
      }
    }

    // === 9. 任务完成情况 ===
    if (data.tasks && data.tasks.length > 0) {
      const t = data.tasks
      const completed = t.filter(x => x.completed === 1).length
      const parts: string[] = []
      parts.push(`任务总数: ${t.length}, 已完成: ${completed}`)
      // 最近完成的任务
      const recentCompleted = t.filter(x => x.completed === 1).slice(0, 5)
      if (recentCompleted.length > 0) {
        parts.push(`已完成: ${recentCompleted.map(x => x.title).join('、')}`)
      }
      // 未完成任务
      const pending = t.filter(x => x.completed === 0).slice(0, 5)
      if (pending.length > 0) {
        parts.push(`待完成: ${pending.map(x => x.title).join('、')}`)
      }

      sections.push(`\n【任务进展】\n${parts.join('\n')}`)
    }

    // === 10. 画像变化历史 ===
    if (data.history && data.history.length > 0) {
      const h = data.history.slice(0, 5)
      const parts = h.map(x => {
        const reasonLabels: Record<string, string> = { chat_analysis: '聊天分析', behavior_update: '行为更新', manual: '手动更新' }
        return `${x.dimension}: ${x.old_value}→${x.new_value}（${reasonLabels[x.change_reason] || x.change_reason}）`
      })
      sections.push(`\n【画像变化趋势（最近${h.length}条）】\n${parts.join('\n')}`)
    }

    // === 输出要求 ===
    sections.push(`\n请基于以上全部数据，生成深度洞察分析，返回严格JSON格式：
{
  "personalitySummary": "2-3句话的综合性格洞察，要结合具体数据，避免空泛",
  "relationshipDynamics": "2-3句话的关系动态分析，包括互动模式、主动被动关系",
  "emotionalPatterns": "2-3句话的情感模式洞察，包括情绪特点、表达方式、对关系的情感需求",
  "communicationStyle": "2-3句话的沟通风格深度分析，包括回复习惯、话题偏好、表达方式",
  "keyFindings": ["3-5条关键发现，每条基于具体数据，格式如'对方回复速度较快(平均X分钟)，说明...'"],
  "blindSpots": ["1-3条盲点提醒，指出你可能忽略但重要的信号"],
  "growthSuggestions": ["2-4条成长建议，具体可执行，格式如'建议在X时段主动发起话题，因为...'"],
  "actionPriority": "1句话的最优先行动建议"
}`)

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

    // 基于画像维度给出简单洞察
    if (data.portrait) {
      const p = data.portrait
      if (p.personality_extraversion > 65) {
        findings.push(`${name}外向性较高，喜欢社交互动`)
      } else if (p.personality_extraversion < 35) {
        findings.push(`${name}性格偏内向，更享受安静的相处`)
      }
      if (p.emotional_stability < 40) {
        findings.push(`${name}情绪较敏感，需要多给予关心和支持`)
        suggestions.push('对方情绪较敏感，沟通时注意语气和表达方式')
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

    return {
      personalitySummary: `${name}的画像数据正在积累中，暂无足够信息生成深度洞察。`,
      relationshipDynamics: '关系数据还在积累中，请持续记录互动。',
      emotionalPatterns: '需要更多互动和聊天数据来分析情感模式。',
      communicationStyle: '上传聊天记录后可以更深入了解沟通风格。',
      keyFindings: findings,
      blindSpots: ['当前数据有限，可能存在未发现的重要特征'],
      growthSuggestions: suggestions.length > 0 ? suggestions : ['持续记录互动和上传聊天数据，AI会越来越了解Ta'],
      actionPriority: '继续积累数据，获得更准确的洞察',
    }
  }
}
