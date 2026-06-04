/**
 * 相处模式分析器
 *
 * 数据来源：全部来自维度系统（profile_dimension_values + dimension_definitions）
 * 不依赖任何其他数据表
 *
 * 核心：将维度原始数据合成为用户可读的行为侧写
 * 与洞察不同 — 洞察关注"隐蔽信号和深层发现"，相处模式关注"日常相处中的行为风格"
 * 支持持久化：分析结果存入数据库，刷新不丢失
 */

import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'

/**
 * 行为标签 — 从维度数据中提取的关键标签
 */
export interface BehaviorTag {
  /** 标签文本 */
  label: string
  /** 来源维度key */
  dimensionKey: string
}

/**
 * 行为模块 — 一个可读的行为侧写区域
 */
export interface BehaviorSection {
  /** 模块标题 */
  title: string
  /** 自然语言描述（1-3句话，可读性强） */
  description: string
  /** 关键行为标签（3-5个，从维度数据提取） */
  tags: BehaviorTag[]
}

/**
 * 相处模式分析结果
 */
export interface InteractionProfileResult {
  /** 沟通节奏 — 回复速度、沟通偏好、线上/线下风格 */
  communicationRhythm: BehaviorSection
  /** 情感表达 — 情绪表达方式、共情能力、亲密需求 */
  emotionalExpression: BehaviorSection
  /** 冲突模式 — 冲突处理风格、压力反应、承诺态度 */
  conflictPattern: BehaviorSection
  /** 社交画像 — 社交活跃度、社交圈特点、独处/群聚偏好 */
  socialPortrait: BehaviorSection
}

/** 维度值记录 */
interface DimensionValueRow {
  dimension_key: string
  value: any
  source: string
  confidence: number | null
}

/** 维度定义记录 */
interface DimensionDefRow {
  dimension_key: string
  display_name: string
  description: string | null
  layer: number
  category: string
  data_type: string
  enum_options: Array<{ value: string; label: string }> | null
  importance: string
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
  confidence: number | null
}

@Injectable()
export class InteractionProfileAnalyzer {
  /**
   * 执行相处模式分析（带持久化）
   */
  async analyze(matchId: number, request: Request, forceRefresh = false): Promise<InteractionProfileResult> {
    // 1. 非强制刷新时，先检查缓存
    if (!forceRefresh) {
      const cached = await this.loadFromCache(matchId)
      if (cached) {
        console.log(`[InteractionProfile] Returning cached profile for match ${matchId}`)
        return cached
      }
    }

    // 2. 从维度系统聚合数据
    const dimensions = await this.aggregateDimensionData(matchId)
    console.log(`[InteractionProfile] Aggregated ${dimensions.length} dimensions for match ${matchId}`)

    // 3. 检查是否有足够数据
    if (dimensions.length < 5) {
      console.log(`[InteractionProfile] Insufficient data for match ${matchId}`)
      const result = this.getInsufficientDataResult()
      await this.saveToCache(matchId, result, 'insufficient')
      return result
    }

    // 4. 调用 LLM 合成行为画像
    try {
      const result = await this.analyzeWithLLM(dimensions, request)
      const fingerprint = this.computeDataFingerprint(dimensions)
      await this.saveToCache(matchId, result, fingerprint)
      return result
    } catch (error) {
      console.error('[InteractionProfile] LLM error:', error)
      const result = this.getFallbackResult(dimensions)
      await this.saveToCache(matchId, result, 'fallback')
      return result
    }
  }

  // ==================== 数据聚合（纯维度） ====================

  private async aggregateDimensionData(matchId: number): Promise<AggregatedDimension[]> {
    const client = getSupabaseClient()

    const [dimensionsResult, definitionsResult] = await Promise.all([
      client.from('profile_dimension_values').select('*').eq('match_id', matchId),
      client.from('dimension_definitions').select('*').eq('is_active', true),
    ])

    const dimensionValues = (dimensionsResult.data || []) as DimensionValueRow[]
    const definitions = (definitionsResult.data || []) as DimensionDefRow[]

    const defMap = new Map<string, DimensionDefRow>()
    for (const def of definitions) {
      defMap.set(def.dimension_key, def)
    }

    const result: AggregatedDimension[] = []
    for (const val of dimensionValues) {
      const def = defMap.get(val.dimension_key)
      result.push({
        key: val.dimension_key,
        displayName: def?.display_name || val.dimension_key,
        value: val.value,
        displayValue: this.formatDimensionValue(val.value, def),
        layer: def?.layer || 0,
        category: def?.category || 'unknown',
        importance: def?.importance || 'optional',
        dataType: def?.data_type || 'string',
        source: val.source,
        confidence: val.confidence,
      })
    }

    return result
  }

  private formatDimensionValue(value: any, def: DimensionDefRow | undefined): string {
    if (value === null || value === undefined) return ''

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

    if (Array.isArray(value)) return value.join('、')
    if (typeof value === 'boolean') return value ? '是' : '否'

    return String(value)
  }

  // ==================== LLM 分析 ====================

  private async analyzeWithLLM(dimensions: AggregatedDimension[], request: Request): Promise<InteractionProfileResult> {
    const dimensionText = this.formatDimensionsForPrompt(dimensions)

    const systemPrompt = `你是一位关系行为分析师。你的任务是将维度数据合成为用户可读的"相处模式"画像。

核心原则：
1. **说人话**：不要说"沟通偏好=文字"，要说"更习惯用文字表达情感，电话里可能反而话少"
2. **有画面感**：不要说"冲突处理=回避"，要说"遇到矛盾倾向沉默消化，不会当面爆发但可能在心里默默扣分"
3. **从维度合成**：不是罗列维度值，而是将多个相关维度交叉合成一个完整的行为描述
4. **标签要精炼**：每个模块的标签控制在3-5个，每个标签4-8个字
5. **标签要可感**：不要"社交活跃度高"，要"朋友多但圈层分明"

你必须严格返回以下JSON格式（不要加任何markdown标记）：
{
  "communicationRhythm": {
    "title": "沟通节奏",
    "description": "1-3句自然语言描述，合成以下维度：响应速度、沟通偏好、线上沟通风格、线下沟通风格、活跃时段等。描述要具体到'他/她习惯怎么沟通'而非'沟通偏好是什么'",
    "tags": [
      {"label": "4-8字标签", "dimensionKey": "对应的维度key"}
    ]
  },
  "emotionalExpression": {
    "title": "情感表达",
    "description": "1-3句自然语言描述，合成以下维度：情绪表达方式、共情能力、亲密需求、情感依赖度、爱语、情绪稳定性等。描述要具体到'他/她表达情感的方式'而非'情感类型是什么'",
    "tags": [
      {"label": "4-8字标签", "dimensionKey": "对应的维度key"}
    ]
  },
  "conflictPattern": {
    "title": "冲突模式",
    "description": "1-3句自然语言描述，合成以下维度：冲突处理风格、压力反应、承诺态度、吃醋程度、嫉妒倾向等。描述要具体到'遇到矛盾时他/她会怎么做'而非'冲突风格是什么'",
    "tags": [
      {"label": "4-8字标签", "dimensionKey": "对应的维度key"}
    ]
  },
  "socialPortrait": {
    "title": "社交画像",
    "description": "1-3句自然语言描述，合成以下维度：社交活跃度、社交圈特点、独处偏好、兴趣类型、生活节奏等。描述要具体到'他/她在社交中是什么样的'而非'社交分数是多少'",
    "tags": [
      {"label": "4-8字标签", "dimensionKey": "对应的维度key"}
    ]
  }
}`

    const userPrompt = `以下是该对象的所有维度数据（共${dimensions.length}个）：

${dimensionText}

请将以上维度数据合成为4个模块的相处模式画像。记住：不要复述数据，要合成行为描述。`

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const response = await client.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.7 })

    const text = response.content || ''
    return this.parseLLMResponse(text)
  }

  private formatDimensionsForPrompt(dimensions: AggregatedDimension[]): string {
    const layerNames: Record<number, string> = { 1: '基础特征', 2: '关系定位', 3: '深层模式', 4: '生活方式' }

    const grouped = new Map<string, AggregatedDimension[]>()
    for (const dim of dimensions) {
      const key = `L${dim.layer}-${dim.category}`
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(dim)
    }

    const lines: string[] = []
    for (const [groupKey, dims] of grouped) {
      const layer = dims[0]?.layer || 1
      const layerName = layerNames[layer] || `Layer ${layer}`
      lines.push(`【${layerName} - ${dims[0]?.category || groupKey}】`)
      for (const dim of dims) {
        const valueStr = dim.displayValue || '(未填写)'
        const sourceTag = dim.source === 'ai_analysis' ? '[AI分析]' : '[手动填写]'
        const confTag = dim.confidence !== null && dim.confidence < 0.5 ? ' [低置信度]' : ''
        lines.push(`  ${dim.displayName}(${dim.key}): ${valueStr} ${sourceTag}${confTag}`)
      }
      lines.push('')
    }

    return lines.join('\n')
  }

  private parseLLMResponse(text: string): InteractionProfileResult {
    let clean = text.trim()
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    try {
      const parsed = JSON.parse(clean)
      const result: InteractionProfileResult = {
        communicationRhythm: this.normalizeSection(parsed.communicationRhythm || parsed.communication_rhythm, '沟通节奏'),
        emotionalExpression: this.normalizeSection(parsed.emotionalExpression || parsed.emotional_expression, '情感表达'),
        conflictPattern: this.normalizeSection(parsed.conflictPattern || parsed.conflict_pattern, '冲突模式'),
        socialPortrait: this.normalizeSection(parsed.socialPortrait || parsed.social_portrait, '社交画像'),
      }
      return result
    } catch (e) {
      console.error('[InteractionProfile] Failed to parse LLM response:', text.slice(0, 300))
      return this.getFallbackResult([])
    }
  }

  private normalizeSection(raw: any, defaultTitle: string): BehaviorSection {
    if (!raw || typeof raw !== 'object') return this.emptySection(defaultTitle)
    return {
      title: raw.title || defaultTitle,
      description: raw.description || raw.summary || '',
      tags: (raw.tags || []).map((t: any) => ({
        label: t.label || t.text || String(t),
        dimensionKey: t.dimensionKey || t.dimension_key || t.key || '',
      })),
    }
  }

  private emptySection(title: string): BehaviorSection {
    return { title, description: '暂无足够数据', tags: [] }
  }

  // ==================== 降级结果 ====================

  private getFallbackResult(dimensions: AggregatedDimension[]): InteractionProfileResult {
    const find = (keys: string[]) => {
      for (const key of keys) {
        const dim = dimensions.find(d => d.key === key)
        if (dim?.displayValue) return dim
      }
      return null
    }

    const tag = (dim: AggregatedDimension | null): BehaviorTag[] => {
      if (!dim?.displayValue) return []
      return [{ label: dim.displayValue, dimensionKey: dim.key }]
    }

    return {
      communicationRhythm: {
        title: '沟通节奏',
        description: find(['communication_preference', 'response_speed', 'communication_style_online'])?.displayValue
          ? `沟通偏好为${find(['communication_preference'])?.displayValue || '未知'}，线上风格${find(['communication_style_online'])?.displayValue || '未知'}。`
          : '需要更多沟通相关维度数据来生成相处模式分析。请补充沟通偏好、响应速度等维度。',
        tags: tag(find(['communication_preference', 'response_speed'])),
      },
      emotionalExpression: {
        title: '情感表达',
        description: find(['emotional_expression', 'empathy_ability', 'intimacy_needs'])?.displayValue
          ? `情感表达方式为${find(['emotional_expression'])?.displayValue || '未知'}，共情能力${find(['empathy_ability'])?.displayValue || '未知'}。`
          : '需要更多情感相关维度数据来生成相处模式分析。请补充情绪表达、共情能力等维度。',
        tags: tag(find(['emotional_expression', 'empathy_ability'])),
      },
      conflictPattern: {
        title: '冲突模式',
        description: find(['conflict_handling', 'stress_response', 'commitment_readiness'])?.displayValue
          ? `冲突处理倾向于${find(['conflict_handling'])?.displayValue || '未知'}，面对压力会${find(['stress_response'])?.displayValue || '未知'}。`
          : '需要更多冲突相关维度数据来生成相处模式分析。请补充冲突处理、压力反应等维度。',
        tags: tag(find(['conflict_handling', 'stress_response'])),
      },
      socialPortrait: {
        title: '社交画像',
        description: find(['social_activity_level', 'social_circle_type', 'alone_preference'])?.displayValue
          ? `社交活跃度${find(['social_activity_level'])?.displayValue || '未知'}，社交圈特点为${find(['social_circle_type'])?.displayValue || '未知'}。`
          : '需要更多社交相关维度数据来生成相处模式分析。请补充社交活跃度、社交圈特点等维度。',
        tags: tag(find(['social_activity_level', 'social_circle_type'])),
      },
    }
  }

  private getInsufficientDataResult(): InteractionProfileResult {
    const insufficient = (title: string) => ({
      title,
      description: '维度数据不足，无法生成相处模式分析。请先填写更多维度信息，当填写超过5个维度后即可生成。',
      tags: [],
    })

    return {
      communicationRhythm: insufficient('沟通节奏'),
      emotionalExpression: insufficient('情感表达'),
      conflictPattern: insufficient('冲突模式'),
      socialPortrait: insufficient('社交画像'),
    }
  }

  // ==================== 持久化 ====================

  private async loadFromCache(matchId: number): Promise<InteractionProfileResult | null> {
    try {
      const client = getSupabaseClient()
      const { data } = await client
        .from('interaction_profile_cache')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data && data.data_fingerprint !== 'insufficient' && data.data_fingerprint !== 'fallback') {
        return {
          communicationRhythm: data.communication_rhythm,
          emotionalExpression: data.emotional_expression,
          conflictPattern: data.conflict_pattern,
          socialPortrait: data.social_portrait,
        }
      }
      return null
    } catch (error) {
      console.error('[InteractionProfile] Load cache error:', error)
      return null
    }
  }

  private async saveToCache(matchId: number, result: InteractionProfileResult, fingerprint: string): Promise<void> {
    try {
      const client = getSupabaseClient()
      // Delete old cache
      await client.from('interaction_profile_cache').delete().eq('match_id', matchId)
      // Insert new
      await client.from('interaction_profile_cache').insert({
        match_id: matchId,
        communication_rhythm: result.communicationRhythm,
        emotional_expression: result.emotionalExpression,
        conflict_pattern: result.conflictPattern,
        social_portrait: result.socialPortrait,
        data_fingerprint: fingerprint,
      })
      console.log(`[InteractionProfile] Saved to cache for match ${matchId}`)
    } catch (error) {
      console.error('[InteractionProfile] Save cache error:', error)
    }
  }

  private computeDataFingerprint(dimensions: AggregatedDimension[]): string {
    const filled = dimensions.filter(d => d.displayValue).map(d => `${d.key}:${d.value}`).join(',')
    let hash = 0
    for (let i = 0; i < filled.length; i++) {
      const char = filled.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash |= 0
    }
    return `dims_${dimensions.length}_${Math.abs(hash).toString(36)}`
  }
}
