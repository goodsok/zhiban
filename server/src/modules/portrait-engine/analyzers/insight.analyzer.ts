/**
 * AI 洞察分析器
 *
 * 聚合该对象的全部维度数据，调用 LLM 进行深度洞察分析
 * 重点：发现用户不容易觉察的隐蔽模式、矛盾信号、潜在风险
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

/** 维度值记录（从 profile_dimension_values 读取） */
interface DimensionValueRow {
  dimension_key: string
  value: any
  source: string
  source_detail: any
  confidence: number | null
  previous_value: any
  changed_reason: string | null
  created_at: string
  updated_at: string | null
}

/** 维度定义记录（从 dimension_definitions 读取） */
interface DimensionDefRow {
  dimension_key: string
  display_name: string
  description: string | null
  layer: number
  category: string
  subcategory: string | null
  data_type: string
  enum_options: Array<{ value: string; label: string }> | null
  importance: string
  weight: string
  relationship_applicability: string | null
}

/** 聚合后的维度数据 */
interface AggregatedDimension {
  key: string
  displayName: string
  value: any
  displayValue: string
  layer: number
  category: string
  importance: string
  dataType: string
  source: string
  previousValue: any
  changedReason: string | null
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

    // 2. 聚合所有数据（维度优先）
    const aggregatedData = await this.aggregateAllData(matchId)
    console.log(`[InsightAnalyzer] Aggregated data for match ${matchId}: dimensions=${aggregatedData.dimensions.length}, hasEnoughData=${aggregatedData.hasEnoughData}, energy=${!!aggregatedData.energy}`)

    // 3. 检查是否有足够数据
    if (!aggregatedData.hasEnoughData) {
      console.log(`[InsightAnalyzer] Insufficient data for match ${matchId}`)
      const result = this.getInsufficientDataResult()
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
    // 维度数量和最后更新时间
    parts.push(`d:${data.dimensions.length}`)
    // 关系能量
    if (data.energy) parts.push(`e:${data.energy.total_energy}`)
    // 基本信息
    if (data.match) parts.push(`m:${data.match.id}`)
    // 任务数量
    parts.push(`t:${data.tasks?.length || 0}`)
    return parts.join('|')
  }

  /**
   * 聚合该对象的所有数据（以维度数据为核心）
   */
  private async aggregateAllData(matchId: number) {
    const client = getSupabaseClient()

    // 并行查询所有数据源
    const [
      matchResult,
      dimensionsResult,
      definitionsResult,
      energyResult,
      tasksResult,
      energyHistoryResult,
    ] = await Promise.all([
      // 基本信息
      client.from('matches').select('*').eq('id', matchId).maybeSingle(),
      // 维度值
      client.from('profile_dimension_values').select('*').eq('match_id', matchId),
      // 维度定义（所有活跃定义）
      client.from('dimension_definitions').select('*').eq('is_active', true),
      // 关系能量
      client.from('relationship_energy').select('*').eq('match_id', matchId).maybeSingle(),
      // 任务
      client.from('tasks').select('*').eq('match_id', matchId).order('created_at', { ascending: false }).limit(20),
      // 关系能量历史
      client.from('relationship_energy_history').select('*').eq('match_id', matchId).order('created_at', { ascending: false }).limit(10),
    ])

    const match = matchResult.data
    const dimensionValues = dimensionsResult.data || []
    const definitions = definitionsResult.data || []
    const energy = energyResult.data
    const tasks = tasksResult.data || []
    const energyHistory = energyHistoryResult.data || []

    // 合并维度值和定义
    const defMap = new Map<string, DimensionDefRow>()
    for (const def of definitions) {
      defMap.set(def.dimension_key, def as DimensionDefRow)
    }

    const valueMap = new Map<string, DimensionValueRow>()
    for (const val of dimensionValues) {
      valueMap.set(val.dimension_key, val as DimensionValueRow)
    }

    // 构建聚合维度列表
    const dimensions: AggregatedDimension[] = []
    for (const val of dimensionValues) {
      const def = defMap.get(val.dimension_key)
      dimensions.push({
        key: val.dimension_key,
        displayName: def?.display_name || val.dimension_key,
        value: val.value,
        displayValue: this.formatDimensionValue(val.value, def),
        layer: def?.layer || 0,
        category: def?.category || 'unknown',
        importance: def?.importance || 'optional',
        dataType: def?.data_type || 'string',
        source: val.source,
        previousValue: val.previous_value,
        changedReason: val.changed_reason,
      })
    }

    // 按层级分组统计
    const layerStats = this.computeLayerStats(dimensions, definitions)

    const hasEnoughData = dimensions.length >= 3

    return {
      match,
      dimensions,
      layerStats,
      energy,
      tasks,
      energyHistory,
      hasEnoughData,
    }
  }

  /**
   * 格式化维度值为人类可读的展示文本
   */
  private formatDimensionValue(value: any, def: DimensionDefRow | undefined): string {
    if (value === null || value === undefined) return ''

    // 如果有枚举选项，尝试映射
    if (def?.enum_options && Array.isArray(def.enum_options)) {
      if (Array.isArray(value)) {
        return value.map(v => {
          const opt = def.enum_options!.find(o => o.value === v)
          return opt?.label || v
        }).join('、')
      }
      const opt = def.enum_options.find(o => o.value === value)
      if (opt) return opt.label
    }

    if (Array.isArray(value)) {
      return value.join('、')
    }

    if (typeof value === 'boolean') {
      return value ? '是' : '否'
    }

    // 特殊维度格式化
    if (def?.dimension_key === 'birthYear' && typeof value === 'number') {
      const age = new Date().getFullYear() - value
      return `${value}年（约${age}岁）`
    }
    if (def?.dimension_key === 'height' && typeof value === 'number') {
      return `${value}cm`
    }

    return String(value)
  }

  /**
   * 计算各层级维度填写统计
   */
  private computeLayerStats(dimensions: AggregatedDimension[], definitions: DimensionDefRow[]): {
    layer: number
    layerName: string
    filled: number
    total: number
    categories: Record<string, { filled: number; total: number }>
  }[] {
    const layerNames: Record<number, string> = {
      1: '静态属性',
      2: '性格情感',
      3: '生活方式',
      4: '深层模式',
    }

    const filledKeys = new Set(dimensions.map(d => d.key))

    const layerData: Record<number, {
      filled: number
      total: number
      categories: Record<string, { filled: number; total: number }>
    }> = {}

    for (const def of definitions) {
      const layer = def.layer
      if (!layerData[layer]) {
        layerData[layer] = { filled: 0, total: 0, categories: {} }
      }
      layerData[layer].total++
      const cat = def.category
      if (!layerData[layer].categories[cat]) {
        layerData[layer].categories[cat] = { filled: 0, total: 0 }
      }
      layerData[layer].categories[cat].total++

      if (filledKeys.has(def.dimension_key)) {
        layerData[layer].filled++
        layerData[layer].categories[cat].filled++
      }
    }

    return Object.entries(layerData).map(([layer, data]) => ({
      layer: parseInt(layer),
      layerName: layerNames[parseInt(layer)] || `第${layer}层`,
      filled: data.filled,
      total: data.total,
      categories: data.categories,
    })).sort((a, b) => a.layer - b.layer)
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
   * 核心：完全基于维度数据，发现用户看不到的隐蔽模式
   */
  private buildInsightPrompt(data: Awaited<ReturnType<typeof this.aggregateAllData>>): string {
    const sections: string[] = []
    const name = data.match?.name || '对方'

    sections.push(`你是一位极其敏锐的关系心理分析师，擅长从看似普通的个人信息中发现人眼难以察觉的隐蔽模式。你的洞察不是对数据的复述，而是对数据背后的深层含义的揭示。

【你的核心能力】
- 发现数据之间的矛盾和张力（比如：声称想要稳定，但行为模式显示追求刺激）
- 捕捉维度之间的微妙关联（比如：依恋类型和冲突处理风格的隐性关系）
- 识别用户自身的认知偏差（比如：用户以为对方不在意，但维度组合表明相反）
- 从多维度交叉中提炼非常规发现（比如：价值观和情感表达方式的落差）

【分析原则】
1. 不要复述数据——"对方MBTI是ESFJ"不是洞察，"对方的ESFJ性格叠加高共情力和回避型冲突处理，意味着她会在关系中极力维持和谐表面，但内心积压的不满会在某一刻爆发"才是洞察
2. 要有意外感——用户读完应该觉得"我没想到这一点"而非"我也知道"
3. 要有证据链——每个结论都要指向具体维度数据的交叉，不是凭空推测
4. 要有实用性——指出隐藏风险或被忽略的机会，给出可操作建议
5. 尤其关注矛盾——不同层维度之间的不一致、价值观与行为的错位、公开偏好与隐私态度的冲突
6. 利用层级结构——Layer 1（静态属性）和 Layer 4（深层模式）之间的张力最值得深挖

请基于以下关于"${name}"的全部维度数据，进行深度人物洞察分析。用中文回答。`)

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

    // === 2. 维度数据（按层级和分类组织，核心数据） ===
    // 按层级和分类分组
    const layerNames: Record<number, string> = {
      1: '基础画像',
      2: '性格与情感',
      3: '生活方式',
      4: '深层模式',
    }

    const categoryNames: Record<string, string> = {
      identity: '身份',
      education: '教育职业',
      family: '家庭背景',
      appearance: '外在形象',
      life_stage: '人生阶段',
      location: '地理位置',
      core_personality: '核心人格',
      values: '价值观',
      personality: '性格特质',
      emotion: '情感特质',
      social: '社交特质',
      communication: '沟通方式',
      life_attitude: '生活态度',
      love_style: '恋爱风格',
      interests: '兴趣爱好',
      lifestyle: '生活习惯',
      dating: '约会偏好',
      communication_pref: '沟通偏好',
      current: '当前状态',
      sexual_intimacy: '亲密关系',
      relationship_form: '关系形态',
      emotional_investment: '情感投入',
      time_availability: '时间精力',
      privacy_public: '隐私公开',
      short_term_patterns: '短期关系模式',
      dating_dynamics: '约会动态',
      current_status: '当前状态',
    }

    for (const ls of data.layerStats) {
      const layerDims = data.dimensions.filter(d => d.layer === ls.layer)
      if (layerDims.length === 0) continue

      const layerTitle = layerNames[ls.layer] || `第${ls.layer}层`
      sections.push(`\n【${layerTitle}】（已填${ls.filled}/${ls.total}项）`)

      // 按分类分组
      const grouped = new Map<string, AggregatedDimension[]>()
      for (const dim of layerDims) {
        const cat = dim.category
        if (!grouped.has(cat)) grouped.set(cat, [])
        grouped.get(cat)!.push(dim)
      }

      for (const [cat, dims] of grouped) {
        const catName = categoryNames[cat] || cat
        const lines = dims.map(d => {
          let line = `${d.displayName}: ${d.displayValue}`
          // 如果数据来源是AI分析，标注
          if (d.source === 'ai_analysis') line += ' [AI分析]'
          // 如果有变化历史，标注
          if (d.previousValue !== null && d.previousValue !== undefined) {
            line += `（曾有变化，原因：${d.changedReason || '未知'}）`
          }
          return line
        })
        sections.push(`  ${catName}：${lines.join('；')}`)
      }
    }

    // === 3. 维度间的关键对比（帮助AI发现矛盾） ===
    const contradictionHints = this.findContradictionHints(data.dimensions)
    if (contradictionHints.length > 0) {
      sections.push(`\n【维度交叉提示（值得深挖的矛盾点）】\n${contradictionHints.join('\n')}`)
    }

    // === 4. 关系能量 ===
    if (data.energy) {
      const e = data.energy
      const parts: string[] = []
      parts.push(`关系能量: ${e.total_energy}/100`)
      parts.push(`信息维度: ${e.information_score}/100, 互动维度: ${e.interaction_score}/100, 情感维度: ${e.emotional_score}/100`)
      const trendLabels: Record<string, string> = { rising: '上升', stable: '稳定', declining: '下降', stagnant: '停滞' }
      parts.push(`趋势: ${trendLabels[e.trend] || e.trend}`)
      if (e.current_stage) parts.push(`关系阶段: ${e.current_stage}`)
      if (e.last_interaction_days >= 0) parts.push(`距上次互动: ${e.last_interaction_days}天`)

      sections.push(`\n【关系能量】\n${parts.join('\n')}`)
    }

    // === 5. 关系能量历史 ===
    if (data.energyHistory && data.energyHistory.length >= 2) {
      const parts: string[] = []
      for (const h of data.energyHistory.slice(0, 5)) {
        const date = new Date(h.created_at).toLocaleDateString('zh-CN')
        parts.push(`${date}: 能量${h.total_energy}, 信息${h.information_score}, 互动${h.interaction_score}, 情感${h.emotional_score}`)
      }
      sections.push(`\n【关系能量变化趋势】\n${parts.join('\n')}`)
    }

    // === 6. 任务完成情况 ===
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

    // === 输出要求 ===
    sections.push(`\n请基于以上全部维度数据，生成真正的深度洞察。记住：你不是在复述维度值，你是在揭示维度组合背后人眼看不见的深层模式。

返回严格JSON格式：
{
  "personalitySummary": "2-3句深层性格洞察。从MBTI、依恋类型、核心价值观、情感表达等维度交叉分析，揭示性格背后的驱动力和内在矛盾。例如不要说'对方MBTI是ESFJ'，而要说'对方的ESFJ特质叠加安全型依恋和高共情力，使她天然成为关系中的情感锚点，但回避型冲突处理意味着她会在矛盾中选择退让和隐忍，长期积压的真实不满会在某一刻突然爆发'",
  "relationshipDynamics": "2-3句关系动态洞察。结合关系形态偏好、情感投入速度、独占性期望等深层维度，揭示权力结构、依附模式、隐性博弈",
  "emotionalPatterns": "2-3句情感模式洞察。结合情感表达方式、情绪稳定性、共情能力、压力反应等维度，揭示情感表达与真实感受的落差",
  "communicationStyle": "2-3句沟通风格洞察。结合线上/线下沟通风格、幽默风格、倾听风格、争论风格等维度，揭示言外之意和隐性信号",
  "keyFindings": ["3-5条关键发现，每条必须让人意外或恍然大悟，格式如'对方的隐私保护倾向极高且手机隐私边界严格，叠加不愿介绍朋友给对方认识的时机偏晚——这不是慢热，而是对方在关系中有强烈的信息控制需求，习惯在确认完全安全前保留退路'"],
  "blindSpots": ["2-4条盲点，指出你可能误判或忽略的方面，格式如'你可能以为对方线上活泼线下也开朗，但线上沟通风格为活泼调皮而线下为温柔体贴，说明对方在线上和线下切换了不同的社交人格，线下更谨慎和收敛'"],
  "hiddenSignals": [
    {
      "type": "contradiction或pattern或risk或opportunity",
      "title": "5字以内的信号名称",
      "description": "对这个隐蔽信号的详细解读，包括它意味着什么、为什么用户不容易发现",
      "evidence": "这个结论来自哪几个维度的交叉分析"
    }
  ],
  "growthSuggestions": ["2-4条具体可执行的建议，每条基于某个洞察发现，格式如'对方偏好温柔体贴的线上沟通但争论风格偏回避，建议在讨论重要话题时用文字而非语音，给对方缓冲空间'"],
  "actionPriority": "1句话的最优先行动建议，要基于最关键的发现"
}

【hiddenSignals的type说明】
- contradiction: 不同维度之间存在矛盾（如想要稳定但行为模式显示追求刺激）
- pattern: 维度组合揭示的隐蔽模式（如特定特质组合暗示的行为规律）
- risk: 潜在的风险信号（如维度组合暗示的不健康关系模式）
- opportunity: 被忽略的机会（如某个维度组合暗示的未利用窗口）

至少生成2条hiddenSignals，最多4条。这些是本次分析最有价值的部分——是AI能发现但人很难注意到的。
重点从Layer 1（基础画像）和Layer 4（深层模式）之间的张力中寻找隐蔽信号。`)

    return sections.join('\n')
  }

  /**
   * 从维度数据中寻找潜在的矛盾点提示（帮助 LLM 更快找到隐蔽模式）
   */
  private findContradictionHints(dimensions: AggregatedDimension[]): string[] {
    const hints: string[] = []
    const dimMap = new Map(dimensions.map(d => [d.key, d]))

    // 线上 vs 线下沟通风格差异
    const online = dimMap.get('communicationStyleOnline')
    const offline = dimMap.get('communicationStyleOffline')
    if (online && offline && online.value !== offline.value) {
      hints.push(`- 线上沟通风格(${online.displayValue}) vs 线下沟通风格(${offline.displayValue})：风格不一致，可能存在社交人格切换`)
    }

    // 依恋类型 vs 情感投入速度
    const attachment = dimMap.get('attachmentStyle')
    const investSpeed = dimMap.get('emotionalInvestmentSpeed')
    if (attachment && investSpeed) {
      if (attachment.value === 'anxious' && investSpeed.value === 'slow') {
        hints.push(`- 焦虑型依恋但情感投入慢：渴望亲密但不敢轻易投入，存在内在冲突`)
      } else if (attachment.value === 'avoidant' && investSpeed.value === 'fast') {
        hints.push(`- 回避型依恋但情感投入快：看似投入快但随时可能抽离，需要警惕`)
      }
    }

    // 亲密需求 vs 隐私保护
    const intimacy = dimMap.get('intimacyNeeds')
    const privacy = dimMap.get('privacyProtectionLevel')
    if (intimacy && privacy) {
      if (intimacy.value === 'high' && (privacy.value === 'high' || privacy.value === 'very_high')) {
        hints.push(`- 高亲密需求但高隐私保护：渴望亲密又害怕暴露，这是典型的矛盾依恋信号`)
      }
    }

    // 独占性期望 vs 关系形式偏好
    const exclusivity = dimMap.get('exclusivityExpectation')
    const relForm = dimMap.get('relationshipFormPreference')
    if (exclusivity && relForm) {
      if (exclusivity.value === 'high' && relForm.value === 'open') {
        hints.push(`- 高独占性期望但偏好开放式关系：理想与现实需求存在张力`)
      }
    }

    // 冲突处理风格 vs 争论风格
    const conflictStyle = dimMap.get('conflictStyle')
    const argStyle = dimMap.get('argumentStyle')
    if (conflictStyle && argStyle) {
      if (conflictStyle.value === 'avoidant' && argStyle.value === 'aggressive') {
        hints.push(`- 回避冲突但争论时强势：日常回避但在被逼到角落时会突然爆发`)
      }
    }

    // 情感表达方式 vs 情感可用性
    const exprStyle = dimMap.get('emotionalExpressionStyle')
    const avail = dimMap.get('emotionalAvailabilityLevel')
    if (exprStyle && avail) {
      if (exprStyle.value === 'expressive' && (avail.value === 'low' || avail.value === 'selective')) {
        hints.push(`- 善于情感表达但情感可用性低：看似开放实则挑剔，只在特定条件下真正敞开`)
      }
    }

    // 约会节奏偏好 vs 恋爱准备度
    const pace = dimMap.get('datingPacePreference')
    const readiness = dimMap.get('readinessForRelationship')
    if (pace && readiness) {
      if (pace.value === 'fast' && (readiness.value === 'not_ready' || readiness.value === 'unsure')) {
        hints.push(`- 约会节奏偏快但恋爱准备度不足：享受暧昧刺激但不想进入稳定关系`)
      }
    }

    return hints
  }

  /**
   * 数据不足时的默认结果
   */
  private getInsufficientDataResult(): InsightAnalysisResult {
    return {
      personalitySummary: '维度数据不足，暂时无法生成性格洞察。请填写更多维度信息。',
      relationshipDynamics: '需要更多维度数据才能分析关系动态。',
      emotionalPatterns: '补充对方的性格、情感维度后，可以分析情感模式。',
      communicationStyle: '填写沟通风格相关维度后可以深入了解沟通特征。',
      keyFindings: ['尚未填写足够的维度信息，无法进行深度分析'],
      blindSpots: ['当前数据空白本身就是盲点——建议尽快补充维度信息'],
      hiddenSignals: [{
        type: 'opportunity',
        title: '数据空白',
        description: '当前关于对方的维度信息很少，这意味着你可能在凭直觉而非事实来理解这段关系，补充维度数据后AI可以发现很多你注意不到的模式',
        evidence: '维度数据严重不足',
      }],
      growthSuggestions: [
        '填写对方的基础画像（Layer 1），如MBTI、依恋类型、核心价值观',
        '补充对方的性格情感特质（Layer 2），如情感表达方式、冲突处理风格',
        '记录深层模式维度（Layer 4），如情感投入速度、隐私边界',
      ],
      actionPriority: '先填写对方的基础画像和性格维度，建立分析基础',
    }
  }

  /**
   * LLM 失败时的降级结果（基于维度数据的规则分析）
   */
  private getFallbackResult(data: Awaited<ReturnType<typeof this.aggregateAllData>>): InsightAnalysisResult {
    const name = data.match?.name || '对方'
    const findings: string[] = []
    const suggestions: string[] = []
    const hiddenSignals: HiddenSignal[] = []
    const dimMap = new Map(data.dimensions.map(d => [d.key, d]))

    // 基于维度的规则化洞察
    const mbti = dimMap.get('mbti')
    const attachment = dimMap.get('attachmentStyle')
    const exprStyle = dimMap.get('emotionalExpressionStyle')
    const conflictStyle = dimMap.get('conflictStyle')
    const onlineComm = dimMap.get('communicationStyleOnline')
    const offlineComm = dimMap.get('communicationStyleOffline')
    const loveLang = dimMap.get('loveLanguage')
    const intimacyNeeds = dimMap.get('intimacyNeeds')
    const privacyLevel = dimMap.get('privacyProtectionLevel')
    const investSpeed = dimMap.get('emotionalInvestmentSpeed')

    if (mbti) {
      findings.push(`${name}的MBTI类型为${mbti.displayValue}，这暗示了特定的认知和决策风格`)
    }

    if (attachment) {
      findings.push(`${name}的依恋类型为${attachment.displayValue}`)
      if (attachment.value === 'anxious') {
        suggestions.push('对方是焦虑型依恋，需要更多确认和安全感，及时回应很重要')
      } else if (attachment.value === 'avoidant') {
        suggestions.push('对方是回避型依恋，需要适当给空间，不要过度追问')
        hiddenSignals.push({
          type: 'risk',
          title: '回避型预警',
          description: '回避型依恋的人在关系深化时容易突然退缩，表面上说是需要空间，实际上可能是对亲密感的本能恐惧',
          evidence: `依恋类型: ${attachment.displayValue}`,
        })
      }
    }

    if (onlineComm && offlineComm && onlineComm.value !== offlineComm.value) {
      findings.push(`${name}线上沟通${onlineComm.displayValue}，线下${offlineComm.displayValue}，存在社交人格差异`)
      hiddenSignals.push({
        type: 'contradiction',
        title: '双面沟通',
        description: '线上和线下的沟通风格差异暗示对方在不同场合切换社交面具，线下更真实但线上更自在',
        evidence: `线上: ${onlineComm.displayValue}, 线下: ${offlineComm.displayValue}`,
      })
    }

    if (intimacyNeeds && privacyLevel) {
      if (intimacyNeeds.value === 'high' && (privacyLevel.value === 'high' || privacyLevel.value === 'very_high')) {
        hiddenSignals.push({
          type: 'contradiction',
          title: '亲密与防御',
          description: '渴望亲密但高度保护隐私，这种矛盾组合说明对方在关系中始终保持着撤退的准备',
          evidence: `亲密需求: ${intimacyNeeds.displayValue}, 隐私保护: ${privacyLevel.displayValue}`,
        })
      }
    }

    if (exprStyle && conflictStyle) {
      if (exprStyle.value === 'expressive' && conflictStyle.value === 'avoidant') {
        findings.push(`${name}善于日常情感表达，但回避冲突——开心时热情，矛盾时沉默`)
        hiddenSignals.push({
          type: 'pattern',
          title: '表面和谐',
          description: '日常表达活跃但冲突回避，意味着对方更愿意维持表面和谐而非解决深层问题，积压的矛盾会在某一刻集中爆发',
          evidence: `情感表达: ${exprStyle.displayValue}, 冲突处理: ${conflictStyle.displayValue}`,
        })
      }
    }

    if (investSpeed && investSpeed.value === 'fast') {
      suggestions.push('对方情感投入速度较快，前期热情可能很高，但需观察是否能在深入了解后维持')
    }

    if (loveLang) {
      suggestions.push(`对方的爱的语言是${loveLang.displayValue}，用这种方式表达关心最能被感受到`)
    }

    if (findings.length === 0) {
      findings.push('维度数据还在积累中，建议补充更多维度信息以获得深度洞察')
    }

    if (hiddenSignals.length === 0) {
      hiddenSignals.push({
        type: 'risk',
        title: '数据不足',
        description: '当前维度数据有限，可能存在重要的隐蔽模式尚未被发现',
        evidence: '维度填写不够完整',
      })
    }

    return {
      personalitySummary: `${name}的画像维度正在积累中，补充更多维度后可获得深度洞察。`,
      relationshipDynamics: '维度数据还在积累中，请持续补充对方的信息。',
      emotionalPatterns: '补充情感和性格相关维度后可以分析情感模式。',
      communicationStyle: '填写沟通风格维度后可以深入了解沟通特征。',
      keyFindings: findings,
      blindSpots: ['当前维度数据有限，可能存在未发现的重要特征'],
      hiddenSignals,
      growthSuggestions: suggestions.length > 0 ? suggestions : ['持续补充对方的维度信息，AI会越来越了解Ta'],
      actionPriority: '继续补充维度信息，获得更准确的洞察',
    }
  }
}
