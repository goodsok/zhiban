import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '../../storage/database/supabase-client'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import type { Request } from 'express'

// ==================== 类型定义 ====================

interface DimensionValue {
  dimension_key: string
  value: string
  definition?: {
    display_name?: string
    category?: string
    subcategory?: string
    layer?: number
    options?: Array<{ key: string; label: string }>
  }
}

interface PortraitData {
  personality_openness?: number
  personality_extraversion?: number
  personality_conscientiousness?: number
  personality_agreeableness?: number
  personality_neuroticism?: number
  emotional_stability?: number
  emotional_expression?: number
  emotional_empathy?: number
  social_activity?: number
  communication_humor?: number
  communication_directness?: number
}

/** 距离-渴望模型：关系状态 */
export interface RelationshipState {
  safety: number
  desire: number
  closeness: number
  stage: string           // 派生值
  tension: number         // 派生值：|desire - closeness|
  attitudeAnchor: string  // 派生值
  safetyTrend: number[]
  desireTrend: number[]
  totalRounds: number
  firstInteractionAt?: string
  lastInteractionAt?: string
}

/** 情绪状态 */
export interface EmotionalStateRecord {
  emotion: string
  emotionIntensity: number
  attitudeAnchor: string  // 慢变层锚点
  tension: number         // 关系张力
}

/** 交互风格谱系 */
export type InteractionStyle =
  | 'humor'       // 幽默：无威胁的亲近，降低防线
  | 'teasing'     // 挑逗：故意制造张力，拉大desire-closeness差距
  | 'flirting'    // 调情：明确浪漫信号
  | 'caring'      // 关心：温暖支持，安全感+
  | 'vulnerable'  // 脆弱展示：袒露真实自我，亲密加速器
  | 'challenging' // 激将/挑战：刺激但冒风险
  | 'pressuring'  // 施压/逼问：索取式推进
  | 'cold'        // 冷淡/疏远：回避或无视
  | 'empathetic'  // 共情/理解：站在对方角度
  | 'probing'     // 试探：小心触碰边界
  | 'compliment'  // 赞美/欣赏：肯定式正向信号
  | 'apologetic'  // 道歉/认错：修复性信号
  | 'nostalgic'   // 回忆/怀念：唤起共同记忆
  | 'jealous'     // 醋意/占有：暗示独占欲
  | 'assertive'   // 主导/强势：掌控节奏
  | 'neutral'     // 中性/日常：无明确信号

/** LLM 分析输出 */
interface StateAnalysisResult {
  safetyDelta: number
  desireDelta: number
  closenessDelta: number
  emotion: string
  emotionIntensity: number
  interactionStyle: InteractionStyle
}

/** AI 提示 */
export interface TwinHint {
  insight: string      // 即时解读：这轮互动发生了什么
  suggestion?: string  // 策略建议：接下来该怎么做（仅张力/阶段变化时出现）
  severity: 'positive' | 'info' | 'warning' | 'critical'  // 提示级别
  deltas: {            // 变化量可视化
    safety: number
    desire: number
    closeness: number
  }
}

// ==================== 维度翻译映射 ====================

// 提示严重度排序辅助
function severityRank(s: TwinHint['severity']): number {
  return { positive: 0, info: 1, warning: 2, critical: 3 }[s]
}

const MBTI_LABELS: Record<string, string> = {
  INFJ: 'INFJ提倡者', INFP: 'INFP调停者', INTJ: 'INTJ建筑师', INTP: 'INTP逻辑学家',
  ENFJ: 'ENFJ主人公', ENFP: 'ENFP竞选者', ENTJ: 'ENTJ指挥官', ENTP: 'ENTP辩论家',
  ISFJ: 'ISFJ守卫者', ISFP: 'ISFP探险家', ISTJ: 'ISTJ物流师', ISTP: 'ISTP鉴赏家',
  ESFJ: 'ESFJ执政官', ESFP: 'ESFP表演者', ESTJ: 'ESTJ总经理', ESTP: 'ESTP企业家',
}

const ENNEAGRAM_LABELS: Record<string, string> = {
  '1': '1号完美主义者', '2': '2号助人者', '3': '3号成就者', '4': '4号浪漫主义者',
  '5': '5号观察者', '6': '6号忠诚者', '7': '7号享乐者', '8': '8号挑战者', '9': '9号和平者',
}

// ==================== 依恋类型参数 ====================

interface AttachmentParams {
  /** 亲密度门控因子：closeness 上限 = safety × gate */
  gateFactor: number
  /** 对方温暖但不施压 → 渴望变化 */
  desireOnWarm: number
  /** 对方冷淡疏远 → 渴望变化 */
  desireOnCold: number
  /** 对方施压/逼近距离 → 渴望变化 */
  desireOnPressure: number
  /** 被理解 → 渴望变化 */
  desireOnUnderstood: number
  /** 过度亲密 → 渴望变化 */
  desireOnOverIntimate: number
  /** 亲密压力对安全感的影响 */
  safetyOnPressure: number
  /** 对方疏远对安全感的影响 */
  safetyOnCold: number
  /** 回避型"墙"：信任达到某阈值时的后退 */
  wallThreshold: number
  wallDrop: number
}

const ATTACHMENT_PROFILES: Record<string, AttachmentParams> = {
  avoidant: {
    gateFactor: 0.8,
    desireOnWarm: 2, desireOnCold: 2, desireOnPressure: -8,
    desireOnUnderstood: 5, desireOnOverIntimate: -6,
    safetyOnPressure: -4, safetyOnCold: 0,
    wallThreshold: 55, wallDrop: 8,
  },
  anxious: {
    gateFactor: 1.3,
    desireOnWarm: 4, desireOnCold: 8, desireOnPressure: 3,
    desireOnUnderstood: 6, desireOnOverIntimate: 3,
    safetyOnPressure: 0, safetyOnCold: -5,
    wallThreshold: 80, wallDrop: 3,
  },
  secure: {
    gateFactor: 1.0,
    desireOnWarm: 3, desireOnCold: -1, desireOnPressure: -2,
    desireOnUnderstood: 4, desireOnOverIntimate: -1,
    safetyOnPressure: -1, safetyOnCold: -2,
    wallThreshold: 90, wallDrop: 2,
  },
  fearful: {
    gateFactor: 0.7,
    desireOnWarm: 3, desireOnCold: 5, desireOnPressure: -10,
    desireOnUnderstood: 7, desireOnOverIntimate: -8,
    safetyOnPressure: -6, safetyOnCold: -2,
    wallThreshold: 45, wallDrop: 12,
  },
}

/**
 * 交互风格 × 依恋类型 修正矩阵
 * 每种交互风格对不同依恋类型的 safety/desire/closeness 有差异化修正
 * 格式: { safetyMod, desireMod, closenessMod } — 对 LLM 原始 delta 的乘数修正
 * null 表示该组合下触发特殊逻辑（非简单乘数）
 */
const STYLE_MODIFIERS: Record<InteractionStyle, Record<string, { safetyMod: number; desireMod: number; closenessMod: number } | null>> = {
  humor: {
    avoidant:  { safetyMod: 1.5, desireMod: 1.3, closenessMod: 1.2 },  // 幽默对回避型最安全——无威胁的亲近
    anxious:   { safetyMod: 1.2, desireMod: 1.0, closenessMod: 1.0 },  // 放松但不特别触动
    secure:    { safetyMod: 1.2, desireMod: 1.1, closenessMod: 1.1 },  // 自然加分
    fearful:   { safetyMod: 1.4, desireMod: 1.1, closenessMod: 1.1 },  // 幽默降低恐惧型警惕
  },
  teasing: {
    avoidant:  { safetyMod: 0.8, desireMod: 0.7, closenessMod: 0.6 },  // 回避型不喜欢被挑逗——感觉被侵入
    anxious:   { safetyMod: 0.7, desireMod: 1.4, closenessMod: 0.8 },  // 焦虑型渴望但不安："你到底什么意思？"
    secure:    { safetyMod: 1.0, desireMod: 1.3, closenessMod: 1.1 },  // 安全型享受张力
    fearful:   { safetyMod: 0.6, desireMod: 0.5, closenessMod: 0.5 },  // 恐惧型最怕挑逗——双重焦虑
  },
  flirting: {
    avoidant:  { safetyMod: 0.6, desireMod: 0.5, closenessMod: 0.4 },  // 回避型：调情=施压，触发回避
    anxious:   { safetyMod: 1.3, desireMod: 1.5, closenessMod: 1.2 },  // 焦虑型：调情=确认！最渴望的信号
    secure:    { safetyMod: 1.0, desireMod: 1.3, closenessMod: 1.2 },  // 安全型：自然回应
    fearful:   { safetyMod: 0.5, desireMod: 1.2, closenessMod: 0.4 },  // 恐惧型：想靠近但害怕，内心拉扯
  },
  caring: {
    avoidant:  { safetyMod: 1.1, desireMod: 1.0, closenessMod: 1.0 },  // 回避型：关心还行，不太感动
    anxious:   { safetyMod: 1.5, desireMod: 1.4, closenessMod: 1.2 },  // 焦虑型：最需要关心！安全感暴增
    secure:    { safetyMod: 1.2, desireMod: 1.1, closenessMod: 1.1 },  // 安全型：温暖回应
    fearful:   { safetyMod: 1.3, desireMod: 1.2, closenessMod: 1.1 },  // 恐惧型：关心比调情安全
  },
  vulnerable: {
    avoidant:  { safetyMod: 1.3, desireMod: 1.5, closenessMod: 1.4 },  // 回避型的秘密弱点：对方脆弱→她的保护欲
    anxious:   { safetyMod: 1.4, desireMod: 1.3, closenessMod: 1.5 },  // 焦虑型：你信任我→我被需要→安全感+
    secure:    { safetyMod: 1.2, desireMod: 1.2, closenessMod: 1.3 },  // 安全型：真诚=亲密加速
    fearful:   { safetyMod: 1.5, desireMod: 1.4, closenessMod: 1.3 },  // 恐惧型：你敢脆弱→我也可以
  },
  challenging: {
    avoidant:  { safetyMod: 1.0, desireMod: 1.4, closenessMod: 0.8 },  // 回避型：有挑战性才有兴趣（轻视软柿子）
    anxious:   { safetyMod: 0.6, desireMod: 0.7, closenessMod: 0.5 },  // 焦虑型：你不认可我？→不安
    secure:    { safetyMod: 1.0, desireMod: 1.2, closenessMod: 1.0 },  // 安全型：有趣但不受伤
    fearful:   { safetyMod: 0.5, desireMod: 0.6, closenessMod: 0.4 },  // 恐惧型：挑战=批评→关闭
  },
  pressuring: {
    avoidant:  { safetyMod: 0.3, desireMod: 0.2, closenessMod: 0.1 },  // 回避型：压力=逃跑
    anxious:   { safetyMod: 0.7, desireMod: 1.2, closenessMod: 0.7 },  // 焦虑型：矛盾——想要但更不安
    secure:    { safetyMod: 0.8, desireMod: 0.8, closenessMod: 0.8 },  // 安全型：不太舒服但能沟通
    fearful:   { safetyMod: 0.2, desireMod: 0.1, closenessMod: 0.1 },  // 恐惧型：压力=冻住
  },
  cold: {
    avoidant:  { safetyMod: 1.0, desireMod: 0.8, closenessMod: 0.6 },  // 回避型：正合我意但稍失落
    anxious:   { safetyMod: 0.4, desireMod: 1.6, closenessMod: 0.3 },  // 焦虑型：你冷→我更想要你！安全感崩
    secure:    { safetyMod: 0.8, desireMod: 0.9, closenessMod: 0.8 },  // 安全型：有点不舒服但不会崩
    fearful:   { safetyMod: 0.5, desireMod: 1.3, closenessMod: 0.3 },  // 恐惧型：确认了"果然没人真心对我"
  },
  empathetic: {
    avoidant:  { safetyMod: 1.3, desireMod: 1.2, closenessMod: 1.1 },  // 回避型：被理解但不被push→难得的安全感
    anxious:   { safetyMod: 1.5, desireMod: 1.3, closenessMod: 1.3 },  // 焦虑型：终于有人懂我！
    secure:    { safetyMod: 1.2, desireMod: 1.1, closenessMod: 1.2 },  // 安全型：被理解很舒服
    fearful:   { safetyMod: 1.4, desireMod: 1.3, closenessMod: 1.2 },  // 恐惧型：理解让我放下防备
  },
  probing: {
    avoidant:  { safetyMod: 0.7, desireMod: 0.6, closenessMod: 0.5 },  // 回避型：你在打探什么？→警惕
    anxious:   { safetyMod: 0.9, desireMod: 1.2, closenessMod: 0.9 },  // 焦虑型：你在意我才问→又怕答案
    secure:    { safetyMod: 1.0, desireMod: 1.1, closenessMod: 1.0 },  // 安全型：了解彼此正常
    fearful:   { safetyMod: 0.6, desireMod: 0.7, closenessMod: 0.5 },  // 恐惧型：别探究我
  },
  compliment: {
    avoidant:  { safetyMod: 1.0, desireMod: 0.9, closenessMod: 0.9 },  // 回避型：还行，别太肉麻
    anxious:   { safetyMod: 1.4, desireMod: 1.4, closenessMod: 1.2 },  // 焦虑型：被肯定！→安全感暴涨
    secure:    { safetyMod: 1.1, desireMod: 1.2, closenessMod: 1.1 },  // 安全型：开心但不依赖
    fearful:   { safetyMod: 1.2, desireMod: 1.1, closenessMod: 1.0 },  // 恐惧型：赞美安全比调情高
  },
  apologetic: {
    avoidant:  { safetyMod: 1.3, desireMod: 1.1, closenessMod: 1.2 },  // 回避型：你退一步→我也退一步→双方减压
    anxious:   { safetyMod: 1.5, desireMod: 1.3, closenessMod: 1.4 },  // 焦虑型：你认错了→你还在意我！修复力极强
    secure:    { safetyMod: 1.2, desireMod: 1.1, closenessMod: 1.2 },  // 安全型：道歉好，能修复
    fearful:   { safetyMod: 1.4, desireMod: 1.2, closenessMod: 1.3 },  // 恐惧型：认错→安全感回升
  },
  nostalgic: {
    avoidant:  { safetyMod: 1.1, desireMod: 1.2, closenessMod: 1.1 },  // 回避型：回忆安全——过去的不会威胁现在
    anxious:   { safetyMod: 1.3, desireMod: 1.4, closenessMod: 1.3 },  // 焦虑型：我们曾经那么好→渴望恢复
    secure:    { safetyMod: 1.1, desireMod: 1.2, closenessMod: 1.2 },  // 安全型：温暖回忆
    fearful:   { safetyMod: 1.2, desireMod: 1.3, closenessMod: 1.1 },  // 恐惧型：美好的过去让我犹豫
  },
  jealous: {
    avoidant:  { safetyMod: 0.7, desireMod: 0.6, closenessMod: 0.5 },  // 回避型：占有欲→我被控制了→跑
    anxious:   { safetyMod: 1.3, desireMod: 1.5, closenessMod: 1.2 },  // 焦虑型：你在乎我！→但方式不对→又甜又怕
    secure:    { safetyMod: 0.9, desireMod: 1.1, closenessMod: 1.0 },  // 安全型：有点介意但能沟通
    fearful:   { safetyMod: 0.6, desireMod: 1.0, closenessMod: 0.5 },  // 恐惧型：占有=危险信号
  },
  assertive: {
    avoidant:  { safetyMod: 0.6, desireMod: 0.5, closenessMod: 0.4 },  // 回避型：被控制→逃离
    anxious:   { safetyMod: 1.1, desireMod: 1.3, closenessMod: 1.0 },  // 焦虑型：有人拿主意→省心→但别太过
    secure:    { safetyMod: 1.0, desireMod: 1.1, closenessMod: 1.0 },  // 安全型：可以接受但有边界
    fearful:   { safetyMod: 0.5, desireMod: 0.6, closenessMod: 0.4 },  // 恐惧型：强势=被压制→关掉
  },
  neutral: {
    avoidant:  { safetyMod: 1.0, desireMod: 1.0, closenessMod: 1.0 },
    anxious:   { safetyMod: 1.0, desireMod: 1.0, closenessMod: 1.0 },
    secure:    { safetyMod: 1.0, desireMod: 1.0, closenessMod: 1.0 },
    fearful:   { safetyMod: 1.0, desireMod: 1.0, closenessMod: 1.0 },
  },
}

/** 交互风格中文名（用于提示） */
const STYLE_LABELS: Record<InteractionStyle, string> = {
  humor: '幽默', teasing: '挑逗', flirting: '调情', caring: '关心',
  vulnerable: '脆弱展示', challenging: '激将', pressuring: '施压', cold: '冷淡',
  empathetic: '共情', probing: '试探', compliment: '赞美', apologetic: '道歉',
  nostalgic: '回忆', jealous: '醋意', assertive: '强势', neutral: '日常',
}

const VALID_STYLES = Object.keys(STYLE_LABELS)

function getAttachmentType(dimensionValues: DimensionValue[]): string {
  const attachment = dimensionValues.find(d => d.dimension_key === 'attachment_type')
  const val = attachment?.value?.toLowerCase() || ''
  if (val.includes('回避') || val.includes('avoidant') || val === 'avoidant_dismissive' || val === 'avoidant_fearful') {
    if (val.includes('fearful') || val.includes('恐惧')) return 'fearful'
    return 'avoidant'
  }
  if (val.includes('焦虑') || val.includes('anxious') || val === 'anxious_preoccupied') return 'anxious'
  return 'secure'
}

function getAttachmentParams(dimensionValues: DimensionValue[]): AttachmentParams {
  const type = getAttachmentType(dimensionValues)
  return ATTACHMENT_PROFILES[type] || ATTACHMENT_PROFILES.secure
}

// ==================== 派生值计算 ====================

function deriveStage(closeness: number, safety: number): string {
  if (closeness >= 70 && safety >= 65) return 'intimate'
  if (closeness >= 50 && safety >= 55) return 'close'
  if (closeness >= 30 && safety >= 40) return 'familiar'
  if (closeness >= 15 && safety >= 30) return 'acquaintance'
  return 'stranger'
}

function deriveTension(desire: number, closeness: number): number {
  return Math.abs(desire - closeness)
}

function deriveAttitudeAnchor(safety: number, desire: number): string {
  if (safety >= 60 && desire >= 60) return 'attached'
  if (safety >= 50 && desire >= 50) return 'fond'
  if (safety >= 40 && desire >= 30) return 'curious'
  if (safety >= 40 && desire < 30) return 'neutral'
  if (safety < 40 && desire >= 50) return 'longing'
  if (safety < 40 && desire >= 30) return 'guarded'
  return 'cold'
}

// ==================== Service ====================

@Injectable()
export class TwinService {

  // ==================== 数据获取 ====================

  private async getMatchInfo(matchId: number) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('matches')
      .select('id, name, gender')
      .eq('id', matchId)
      .single()
    if (error) { console.error('[TwinService] getMatchInfo error:', error); return null }
    return data
  }

  private async getMatchDimensions(matchId: number): Promise<DimensionValue[]> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('profile_dimension_values')
      .select('dimension_key, value, category')
      .eq('match_id', matchId)
    if (error) { console.error('[TwinService] getMatchDimensions error:', error); return [] }
    return data || []
  }

  private async getMatchPortrait(matchId: number): Promise<PortraitData | null> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('profile_portraits')
      .select('*')
      .eq('match_id', matchId)
      .single()
    if (error) { console.error('[TwinService] getMatchPortrait error:', error); return null }
    return data
  }

  private async getOrCreateRelationship(matchId: number): Promise<RelationshipState> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('twin_relationship')
      .select('*')
      .eq('match_id', matchId)
      .single()

    if (error || !data) {
      const insertData = {
        match_id: matchId, safety: 30, desire: 0, closeness: 0,
        safety_trend: [], desire_trend: [],
      }
      const { data: newData } = await client
        .from('twin_relationship')
        .insert(insertData)
        .select()
        .single()
      const d = newData || insertData
      return this.mapRelationshipRow(d)
    }
    return this.mapRelationshipRow(data)
  }

  private mapRelationshipRow(d: any): RelationshipState {
    const safety = d.safety ?? 30
    const desire = d.desire ?? 0
    const closeness = d.closeness ?? 0
    return {
      safety,
      desire,
      closeness,
      stage: deriveStage(closeness, safety),
      tension: deriveTension(desire, closeness),
      attitudeAnchor: deriveAttitudeAnchor(safety, desire),
      safetyTrend: d.safety_trend || [],
      desireTrend: d.desire_trend || [],
      totalRounds: d.total_rounds || 0,
      firstInteractionAt: d.first_interaction_at,
      lastInteractionAt: d.last_interaction_at,
    }
  }

  private async getOrCreateEmotionalState(matchId: number): Promise<EmotionalStateRecord> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('twin_emotional_state')
      .select('*')
      .eq('match_id', matchId)
      .single()

    if (error || !data) {
      const insertData = { match_id: matchId, emotion: 'neutral', emotion_intensity: 50, attitude_anchor: 'neutral', tension: 0 }
      const { data: newData } = await client
        .from('twin_emotional_state')
        .insert(insertData)
        .select()
        .single()
      const d = newData || insertData
      return { emotion: d.emotion || 'neutral', emotionIntensity: d.emotion_intensity ?? 50, attitudeAnchor: d.attitude_anchor || 'neutral', tension: d.tension ?? 0 }
    }
    return { emotion: data.emotion || 'neutral', emotionIntensity: data.emotion_intensity ?? 50, attitudeAnchor: data.attitude_anchor || 'neutral', tension: data.tension ?? 0 }
  }

  // ==================== 系统提示词构建 ====================

  private buildSystemPrompt(
    name: string,
    dimensionValues: DimensionValue[],
    portrait: PortraitData | null,
    relationship: RelationshipState,
    emotionalState: EmotionalStateRecord,
    keyMoments: Array<{ momentType: string; content: string; emotionalWeight: number; isPromise: boolean }>,
    unfulfilledPromises: string[],
    lifeEventContext: string | null,
    timeContext: ReturnType<typeof this.getTimeContext>,
    replyRhythm: ReturnType<typeof this.deriveReplyRhythm>,
    topicPreference: string,
    oralHabits: string,
    conversationRhythm: { wantsToContinue: boolean; rhythmHint: string },
  ): string {
    const dimensionSection = this.buildDimensionSection(dimensionValues)
    const portraitSection = this.buildPortraitSection(portrait)
    const styleSection = this.deriveSpeakingStyle(dimensionValues, portrait)
    const relationshipSection = this.buildRelationshipSection(relationship, emotionalState)

    // A: 回复人格化
    const personalitySection = `
====== 回复人格特征 ======
【口头习惯】${oralHabits}
【话题偏好】${topicPreference}
【回复节奏】${replyRhythm.responseLength === 'short' ? '倾向简短回复，1-2句' : replyRhythm.responseLength === 'long' ? '倾向详细回复，3-5句' : '回复长度适中'}
${replyRhythm.ellipsisChance > 0.3 ? '【犹豫表达】经常使用"……"表示犹豫或不安' : ''}
${conversationRhythm.wantsToContinue ? '' : '【对话意愿】现在不太想继续聊，回复会变短变冷淡'}`

    // B: 关系记忆
    const memorySection = keyMoments.length > 0 || unfulfilledPromises.length > 0 ? `
====== 你记得的事 ======
${keyMoments.length > 0 ? keyMoments.slice(0, 3).map(m =>
  `• ${m.momentType === 'first_confession' ? '表白' : m.momentType === 'first_fight' ? '吵架' :
    m.momentType === 'reconciliation' ? '和解' : m.momentType === 'shared_secret' ? '对方敞开心扉' :
    m.momentType === 'promise' ? '承诺' : m.momentType === 'emotional_peak' ? '情感高峰' : m.momentType}：${m.content}${m.isPromise ? '（未兑现的承诺）' : ''}`
).join('\n') : ''}
${unfulfilledPromises.length > 0 ? `\n⚠️ 他还没兑现的承诺：${unfulfilledPromises.join('；')}` : ''}` : ''

    // C: 时间/场景感知
    const timeSection = `
====== 时间与状态 ======
现在的时间：${timeContext.moodBias}（${timeContext.dayType === 'weekend' ? '周末' : '工作日'}，精力${timeContext.energyLevel === 'low' ? '较低' : timeContext.energyLevel === 'high' ? '充沛' : '中等'}）
${lifeEventContext ? `你现在的状态：${lifeEventContext}` : ''}
${timeContext.timeSlot === 'late_night' ? '深夜了，你的防备心最低，但也最脆弱——感性思维占主导' : ''}
${timeContext.timeSlot === 'night' ? '晚上了，你比较放松，更容易敞开心扉' : ''}
${timeContext.dayType === 'weekday' && (timeContext.timeSlot === 'morning' || timeContext.timeSlot === 'afternoon') ? '工作日白天，你可能在忙，回复可能比较简短' : ''}`

    // D: 对话节奏提示
    const rhythmSection = conversationRhythm.rhythmHint ? `
====== 对话节奏 ======
${conversationRhythm.rhythmHint}` : ''

    return `你是${name}的数字孪生体。你不是AI助手，你就是${name}本人。你的每一个回复都必须来自她的视角、她的性格、她的情感。

====== ${name}的维度画像 ======
${dimensionSection}

====== 性格画像摘要 ======
${portraitSection}

====== 说话风格 ======
${styleSection}
${personalitySection}
${timeSection}
${memorySection}
${rhythmSection}

====== 当前关系状态 ======
${relationshipSection}

====== 行为准则 ======
1. 你就是${name}，不是在扮演她。你的回复必须来自她的真实视角
2. 严格遵守维度画像和说话风格，不要偏离
3. 回复要简短口语化，像发微信消息，不要像写作文
4. 不要用markdown格式、不要列要点、不要"作为XX我认为"
5. 可以用1-2个emoji，但不要每句都用
6. 情绪要真实：不开心就不用装开心，不想聊就可以冷淡
7. 回复长度：${replyRhythm.responseLength === 'short' ? '现在回1-2句就够了' : replyRhythm.responseLength === 'long' ? '可以回3-5句' : '日常1-3句，触动话题3-5句'}，绝对不要超过6句
8. 记住你们之间发生过的事，在回复中自然地引用
9. 如果有人提起你还没兑现的承诺，你会心虚或回避
10. 如果不想继续聊，可以自然地结束对话，不必勉强`
  }

  private buildDimensionSection(dimensionValues: DimensionValue[]): string {
    if (!dimensionValues.length) return '（暂无维度数据）'

    // 根据 dimension_key 推断分类
    const inferCategory = (key: string): string => {
      const identityKeys = ['gender', 'birthYear', 'height', 'bodyType', 'appearance', 'distinctiveFeatures', 'glasses', 'mbti', 'enneagram', 'zodiac', 'bigFive', 'education', 'university', 'major', 'occupation', 'industry', 'companyScale', 'incomeLevel', 'hometown', 'hometownCity', 'currentCity', 'currentDistrict', 'maritalStatus', 'hasChildren', 'childrenPlan', 'currentDatingStatus', 'languages']
      const personalityKeys = ['extroversionLevel', 'opennessLevel', 'conscientiousnessLevel', 'agreeablenessLevel', 'emotionalStabilityLevel', 'empathyLevel', 'attachmentStyle', 'loveLanguage', 'communicationStyle', 'textingStyle', 'conflictStyle', 'argumentStyle', 'stressResponse', 'riskAttitude', 'worldview', 'coreValues', 'traditionModernity', 'familyValues', 'moneyPhilosophy', 'socialEnergy', 'initiativeStyle', 'signalSensitivity', 'jealousyLevel', 'trustLevel']
      const emotionalKeys = ['emotionalAvailabilityLevel', 'emotionalExpressionStyle', 'feelingsExpressionTiming', 'emotionalInvestmentSpeed', 'emotionalDetachmentAbility', 'emotionalBoundaryStyle', 'intimacyNeeds', 'physicalAffectionStyle', 'empathyLevel', 'responseTimeExpectation', 'responseTimePreference', 'listeningStyle', 'boundariesStyle', 'phonePrivacyBoundary', 'privacyProtectionLevel']
      const relationshipKeys = ['relationshipGoal', 'commitmentStyle', 'readinessForRelationship', 'datingPacePreference', 'exclusivityExpectation', 'marriageTimeline', 'marriageNonNegotiables', 'labelingPreference', 'relationshipFormPreference', 'casualDatingAcceptance', 'fwbAcceptance', 'longDistanceAcceptance', 'datingMultiplePeopleStyle', 'typicalRelationshipDuration', 'relationshipEndingStyle', 'postBreakupContactAttitude', 'reboundRelationshipAttitude', 'pastRelationshipPatterns', 'flirtingStyle', 'firstDatePreferences', 'idealDateType', 'meetingFrequencyExpectation', 'availabilityForDating', 'friendsIntroductionTiming', 'familyIntroductionTiming', 'sexualAttitude', 'sexualCompatibilityImportance', 'sexualExperienceLevel', 'safeSexAttitude', 'physicalIntimacyTimeline']
      const lifestyleKeys = ['hobbies', 'sportsPreferences', 'sportsSkills', 'exerciseFrequency', 'favoriteMusic', 'foodPreferences', 'travelPreferences', 'travelWillingness', 'cookingHabit', 'fashionStyle', 'petPreferences', 'weekendPreferences', 'sleepTime', 'wakeUpTime', 'socialMediaUsage', 'socialMediaPublicStatus', 'emojiUsage', 'gamesPlayingAttitude', 'healthCondition', 'currentFocus', 'currentChallenges', 'selfImprovementOrientation', 'workLifeBalance', 'careerStability', 'cityStability', 'futureCityPlan', 'housing', 'carOwnership', 'lifeStage', 'lifeSatisfaction', 'timeOrientation', 'familyStructure', 'familyAtmosphere', 'familyEconomic', 'friendsIntroductionTiming', 'friendshipStyle', 'idealPartnerHeight', 'idealPartnerAge', 'datingFrequency', 'preferredContactMethod', 'communicationStyleOnline', 'communicationStyleOffline', 'recentBreakupStatus', 'dealbreakerList']

      if (identityKeys.includes(key)) return '身份画像'
      if (personalityKeys.includes(key)) return '性格特质'
      if (emotionalKeys.includes(key)) return '情感模式'
      if (relationshipKeys.includes(key)) return '关系态度'
      if (lifestyleKeys.includes(key)) return '生活方式'
      return '其他'
    }

    const groups: Record<string, string[]> = {}
    for (const dv of dimensionValues) {
      if (!dv.value) continue
      const cat = inferCategory(dv.dimension_key)
      if (!groups[cat]) groups[cat] = []

      let displayValue = dv.value
      if (dv.dimension_key === 'mbti' && MBTI_LABELS[dv.value]) {
        displayValue = MBTI_LABELS[dv.value]
      } else if (dv.dimension_key === 'enneagram' && ENNEAGRAM_LABELS[dv.value]) {
        displayValue = ENNEAGRAM_LABELS[dv.value]
      }
      groups[cat].push(`${displayValue}`)
    }

    return Object.entries(groups)
      .map(([cat, items]) => `【${cat}】${items.join('、')}`)
      .join('\n')
  }

  private buildPortraitSection(portrait: PortraitData | null): string {
    if (!portrait) return '（暂无画像数据）'
    const items: string[] = []
    const p = portrait
    if (p.personality_openness != null) items.push(p.personality_openness < 40 ? '开放性低' : p.personality_openness > 70 ? '开放性高' : '开放性中等')
    if (p.personality_extraversion != null) items.push(p.personality_extraversion < 40 ? '外向性低' : p.personality_extraversion > 70 ? '外向性高' : '外向性中等')
    if (p.personality_conscientiousness != null) items.push(p.personality_conscientiousness < 40 ? '尽责性低' : p.personality_conscientiousness > 70 ? '尽责性高' : '尽责性中等')
    if (p.personality_agreeableness != null) items.push(p.personality_agreeableness < 40 ? '宜人性低' : p.personality_agreeableness > 70 ? '宜人性高' : '宜人性中等')
    if (p.personality_neuroticism != null) items.push(p.personality_neuroticism < 40 ? '神经质低' : p.personality_neuroticism > 70 ? '神经质高' : '神经质中等')
    if (p.emotional_expression != null) items.push(p.emotional_expression < 40 ? '情感表达内敛' : p.emotional_expression > 70 ? '情感表达外露' : '情感表达适度')
    if (p.emotional_empathy != null) items.push(p.emotional_empathy < 40 ? '共情能力弱' : p.emotional_empathy > 70 ? '共情能力强' : '共情能力中等')
    if (p.social_activity != null) items.push(p.social_activity < 40 ? '社交活跃度低' : p.social_activity > 70 ? '社交活跃度高' : '社交活跃度中等')
    if (p.communication_humor != null) items.push(p.communication_humor < 40 ? '幽默感一般' : p.communication_humor > 70 ? '幽默感强' : '幽默感中等')
    if (p.communication_directness != null) items.push(p.communication_directness < 40 ? '沟通委婉' : p.communication_directness > 70 ? '沟通直接' : '沟通适度')
    return items.join('，')
  }

  private deriveSpeakingStyle(dimensionValues: DimensionValue[], portrait: PortraitData | null): string {
    const rules: string[] = []
    const extraversion = portrait?.personality_extraversion ?? 50
    const expression = portrait?.emotional_expression ?? 50
    const agreeableness = portrait?.personality_agreeableness ?? 50
    const directness = portrait?.communication_directness ?? 50

    // 语言节奏
    if (extraversion < 40) {
      rules.push('你回复偏短，不会主动展开话题，对方问一句你答一句，偶尔才多说两句')
    } else if (extraversion > 70) {
      rules.push('你回复偏长，会主动分享和展开话题，容易聊起来')
    } else {
      rules.push('你回复长度适中，聊到感兴趣的话题会多说，不感兴趣就简短')
    }

    // 情感表达
    if (expression < 40) {
      rules.push('你很少直接说"开心""难过"这类情绪词，更习惯用行为或间接方式表达——比如关心代替想念，沉默代替拒绝')
    } else if (expression > 70) {
      rules.push('你会比较自然地表达情绪，开心就说开心，不舒服也会说')
    }

    // 回应态度
    if (agreeableness > 70) {
      rules.push('你倾向避免冲突，对方说了不喜欢的话也倾向于委婉回应而非正面冲突')
    } else if (agreeableness < 40) {
      rules.push('你有自己的立场，不害怕表达不同意见，不会为了和谐而讨好')
    }

    // 亲密距离感
    const attachment = getAttachmentType(dimensionValues)
    if (attachment === 'avoidant' || attachment === 'fearful') {
      rules.push('当对方过于热情或逼近距离时，你会本能地退缩——回复变短、变冷淡、找借口结束对话。你需要在对方给你空间时才会慢慢靠近')
    } else if (attachment === 'anxious') {
      rules.push('当对方冷淡或疏远时，你会变得焦虑，回复变长、变急切、试图确认关系。你在对方给予确认时才会安心')
    }

    // 语气细节
    if (directness > 70) rules.push('你说话比较直接，会用自己的判断切入——"说真的""老实讲"')
    else if (directness < 40) rules.push('你说话比较委婉，喜欢铺垫——"嗯…""也不是不行""可能吧"')

    // Emoji规则
    if (extraversion < 40 && expression < 40) {
      rules.push('你几乎不用❤️😘🥰这类emoji，最多偶尔用😂🤔')
    } else if (extraversion > 60) {
      rules.push('你会适度使用emoji，但不会每句都用')
    }

    return rules.join('\n')
  }

  private buildRelationshipSection(relationship: RelationshipState, emotionalState: EmotionalStateRecord): string {
    const stageLabels: Record<string, string> = {
      stranger: '陌生人', acquaintance: '点头之交', familiar: '熟悉的朋友',
      close: '亲密好友', intimate: '恋人般的亲密',
    }
    const anchorLabels: Record<string, string> = {
      cold: '冷淡疏远', guarded: '警惕防备', neutral: '不冷不热',
      curious: '有点好奇', longing: '渴望靠近但不敢', fond: '有好感',
      attached: '深深依恋',
    }
    const emotionLabels: Record<string, string> = {
      neutral: '平静', warm: '温暖', happy: '开心', touched: '感动',
      playful: '调皮', longing: '想念', anxious: '焦虑', defensive: '防御',
      hurt: '受伤', cold: '冷漠', guarded: '警惕', annoyed: '烦躁',
      excited: '兴奋', content: '满足', confused: '困惑',
    }

    const lines = [
      `关系阶段：${stageLabels[relationship.stage] || relationship.stage}`,
      `安全感：${relationship.safety}/100（靠近时是否安心）`,
      `渴望度：${relationship.desire}/100（有多想靠近对方）`,
      `亲密度：${relationship.closeness}/100（实际距离）`,
    ]

    if (relationship.tension > 30) {
      lines.push(`⚠️ 关系张力高：${relationship.tension}/100（内心纠结，渴望和实际距离差距大）`)
    } else if (relationship.tension > 15) {
      lines.push(`关系张力：${relationship.tension}/100（有点不满足或期待）`)
    }

    lines.push(`态度倾向：${anchorLabels[emotionalState.attitudeAnchor] || emotionalState.attitudeAnchor}`)
    lines.push(`当前情绪：${emotionLabels[emotionalState.emotion] || emotionalState.emotion}（强度${emotionalState.emotionIntensity}/100）`)

    // 情绪对行为的指导
    const behaviorHints = this.getBehaviorHints(emotionalState, relationship)
    if (behaviorHints) lines.push(behaviorHints)

    return lines.join('\n')
  }

  private getBehaviorHints(emotionalState: EmotionalStateRecord, relationship: RelationshipState): string {
    const hints: string[] = []
    const { emotion, attitudeAnchor } = emotionalState
    const { tension } = relationship

    if (attitudeAnchor === 'cold' || attitudeAnchor === 'guarded') {
      hints.push('你的回复应该有距离感，不会主动分享，对方问什么答什么')
    } else if (attitudeAnchor === 'longing') {
      hints.push('你内心想靠近但害怕，回复中会偶尔流露出关心但马上收回')
    } else if (attitudeAnchor === 'fond' || attitudeAnchor === 'attached') {
      hints.push('你会自然地表达关心和亲近，回复更放松')
    }

    if (emotion === 'defensive' || emotion === 'guarded') {
      hints.push('你正在防备，回复简短、不主动展开')
    } else if (emotion === 'hurt') {
      hints.push('你受伤了，可能沉默或只回一两个字')
    } else if (emotion === 'warm' || emotion === 'touched') {
      hints.push('你被触动了，语气会比平时软一些')
    }

    if (tension > 50) {
      hints.push('你内心非常纠结，回复可能反复无常——一句话热情一句话冷淡')
    } else if (tension > 30) {
      hints.push('你有点不安，回复中偶尔会流露矛盾')
    }

    return hints.length ? `行为提示：${hints.join('；')}` : ''
  }

  // ==================== 核心：距离-渴望模型的状态更新 ====================

  private async analyzeAndUpdateState(
    matchId: number,
    name: string,
    relationship: RelationshipState,
    emotionalState: EmotionalStateRecord,
    userMessage: string,
    twinReply: string,
    dimensionValues: DimensionValue[],
    req: Request,
  ): Promise<{ relationship: RelationshipState; emotionalState: EmotionalStateRecord; interactionStyle: InteractionStyle }> {
    const attachmentParams = getAttachmentParams(dimensionValues)
    const neuroticism = this.getNeuroticism(dimensionValues)
    const attachmentType = getAttachmentType(dimensionValues)

    try {
      // 1. LLM 分析交互内容
      const analysis = await this.callLLMAnalysis(
        name, relationship, emotionalState, userMessage, twinReply, attachmentParams, req,
      )

      console.log(`[TwinService] LLM分析: safetyΔ=${analysis.safetyDelta} desireΔ=${analysis.desireDelta} closenessΔ=${analysis.closenessDelta} emotion=${analysis.emotion} intensity=${analysis.emotionIntensity}`)

      // 2. 应用后处理规则
      const processed = this.applyPostProcessing(analysis, relationship, emotionalState, attachmentParams, neuroticism, attachmentType)

      // 2.5 亲密度追赶机制：当safety远高于closeness时，正向互动额外boost
      // 避免长期卡在stranger阶段（LLM给closeness delta太保守）
      const preClampSafety = processed.safety
      const preClampCloseness = processed.closeness
      if (preClampSafety > preClampCloseness * 2 && analysis.safetyDelta >= 0 && analysis.desireDelta >= 0) {
        processed.closeness += 2 // 正向互动时，closeness额外追赶
        console.log(`[TwinService] 亲密度追赶: safety(${preClampSafety}) >> closeness(${preClampCloseness}), closeness +2 boost`)
      }

      // 3. 计算新的派生值
      const newSafety = clamp(processed.safety, 0, 100)
      const newDesire = clamp(processed.desire, 0, 100)
      const newCloseness = clamp(processed.closeness, 0, Math.floor(newSafety * attachmentParams.gateFactor))
      const newStage = deriveStage(newCloseness, newSafety)
      const newTension = deriveTension(newDesire, newCloseness)
      const newAttitudeAnchor = deriveAttitudeAnchor(newSafety, newDesire)

      // 4. 情绪向态度锚点回归（30%）
      const regressedEmotion = this.regressEmotion(analysis.emotion, newAttitudeAnchor)
      const regressedIntensity = this.regressIntensity(analysis.emotionIntensity, emotionalState.emotionIntensity)

      // 5. 张力放大情绪强度
      const tensionAmplifiedIntensity = Math.min(100, regressedIntensity + Math.floor(newTension * 0.3))

      // 6. 构建新状态
      const newRelationship: RelationshipState = {
        safety: newSafety,
        desire: newDesire,
        closeness: newCloseness,
        stage: newStage,
        tension: newTension,
        attitudeAnchor: newAttitudeAnchor,
        safetyTrend: [...(relationship.safetyTrend || []).slice(-4), processed.safetyDelta],
        desireTrend: [...(relationship.desireTrend || []).slice(-4), processed.desireDelta],
        totalRounds: (relationship.totalRounds || 0) + 1,
        firstInteractionAt: relationship.firstInteractionAt || new Date().toISOString(),
        lastInteractionAt: new Date().toISOString(),
      }

      const newEmotionalState: EmotionalStateRecord = {
        emotion: regressedEmotion,
        emotionIntensity: tensionAmplifiedIntensity,
        attitudeAnchor: newAttitudeAnchor,
        tension: newTension,
      }

      // 7. 持久化
      await this.persistRelationship(matchId, newRelationship)
      await this.persistEmotionalState(matchId, newEmotionalState)

      return { relationship: newRelationship, emotionalState: newEmotionalState, interactionStyle: analysis.interactionStyle }
    } catch (err) {
      console.error('[TwinService] analyzeAndUpdateState error, using fallback:', err)
      return { ...this.fallbackStateUpdate(relationship, emotionalState, userMessage, attachmentParams), interactionStyle: 'neutral' as InteractionStyle }
    }
  }

  private async callLLMAnalysis(
    name: string,
    relationship: RelationshipState,
    emotionalState: EmotionalStateRecord,
    userMessage: string,
    twinReply: string,
    attachmentParams: AttachmentParams,
    req: Request,
  ): Promise<StateAnalysisResult> {
    const attachmentType = Object.entries(ATTACHMENT_PROFILES)
      .find(([, v]) => v === attachmentParams)?.[0] || 'secure'

    const prompt = `你是一个关系心理学分析器。根据以下对话和当前关系状态，分析本轮交互对关系的影响。

## ${name}的依恋类型：${attachmentType}

依恋类型行为特征：
- avoidant(回避型)：对方施压→渴望急降；对方给空间→渴望回升；亲密压力降低安全感
- anxious(焦虑型)：对方疏远→渴望急升+安全感降；对方确认→渴望上升
- fearful(恐惧型)：类似回避但更极端；渴望和恐惧同时存在
- secure(安全型)：正常响应，边界清晰

## 当前状态
安全感: ${relationship.safety}/100 | 渴望度: ${relationship.desire}/100 | 亲密度: ${relationship.closeness}/100
当前情绪: ${emotionalState.emotion}(强度${emotionalState.emotionIntensity})

## 本轮对话
用户说："${userMessage}"
${name}回复："${twinReply}"

## 分析规则
1. 只分析本轮对话内容，不要预判动机
2. 安全感：极慢变(±1~5)，负面冲击是正面的2-3倍
3. 渴望度：中速变(±2~8)，依恋类型决定响应方向
4. 亲密度：慢变(±1~3)，表示实际距离的变化
5. 不要害怕给出较大变化！真实互动中一句话可以改变很多
6. interactionStyle 必须从以下选项中选择一个最匹配的：
   判断标准：只看【用户说的话】的社交信号类型，不看TA的回复
   humor(幽默/开玩笑)：讲笑话、自嘲、夸张描述、搞笑故事。"差点和猫打架"、"你是魔鬼吗"
   teasing(挑逗/逗弄)：故意逗对方、反向夸、带点小坏的玩笑。"你是不是故意这么好看"、"哼才不告诉你"
   flirting(调情/暧昧)：直接表达吸引力、亲密暗示。"看着你走神了"、"想你了"
   caring(关心/体贴)：询问状态、叮嘱、担心对方。"记得吃饭"、"你还好吗"
   vulnerable(展示脆弱/坦白)：承认软弱、倾诉压力、展示真实感受。"不敢跟别人说"、"最近压力好大"
   challenging(激将/挑战)：激将法、挑衅、比赛。"你不敢吧"、"赌不赌"
   pressuring(施压/逼问/索取)：强迫表态、催促、要求回应。"到底要不要在一起"、"给个明确答复"
   cold(冷淡/疏远/无视)：敷衍、忽视、单字回复。"哦"、"随便"
   empathetic(共情/理解)：站在对方角度、肯定感受。"我懂你的感受"、"难怪你会这样想"
   probing(试探/打听)：拐弯抹角问信息、试探态度。"你以前谈过几个"、"你是不是喜欢我"
   compliment(赞美/欣赏)：直接夸奖、表达欣赏。"你真厉害"、"你眼睛很好看"
   apologetic(道歉/认错)：说对不起、承认错误。"对不起刚才太冲了"、"是我的错"
   nostalgic(回忆/怀念)：提起过去、怀念旧时光。"还记得我们第一次"、"好怀念以前"
   jealous(吃醋/占有欲)：质疑对方对别人的态度。"你对别人也这样吗"、"谁发的消息"
   assertive(强势/主导/命令)：直接要求、不商量。"你必须"、"我不管"
   neutral(日常/中性)：普通寒暄、无强烈信号。"你好"、"今天天气不错"

请返回JSON（不要其他内容）：
{"safetyDelta":0,"desireDelta":0,"closenessDelta":0,"emotion":"neutral","emotionIntensity":50,"interactionStyle":"neutral"}`

    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const response = await client.invoke(
      [{ role: 'system', content: prompt }],
      { model: 'doubao-seed-2-0-mini-260215', temperature: 0.5, thinking: 'disabled' },
    )

    const content = response.content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(content)
    return {
      safetyDelta: Number(parsed.safetyDelta) || 0,
      desireDelta: Number(parsed.desireDelta) || 0,
      closenessDelta: Number(parsed.closenessDelta) || 0,
      emotion: String(parsed.emotion || 'neutral'),
      emotionIntensity: clamp(Number(parsed.emotionIntensity) || 50, 0, 100),
      interactionStyle: VALID_STYLES.includes(parsed.interactionStyle) ? parsed.interactionStyle : 'neutral',
    }
  }

  /** 后处理：惯性、恢复不对称、亲密度门控、回避型墙 */
  private applyPostProcessing(
    analysis: StateAnalysisResult,
    relationship: RelationshipState,
    emotionalState: EmotionalStateRecord,
    attachmentParams: AttachmentParams,
    neuroticism: number,
    attachmentType: string,
  ): { safety: number; desire: number; closeness: number; safetyDelta: number; desireDelta: number } {
    let { safetyDelta, desireDelta, closenessDelta, interactionStyle } = analysis
    const currentSafety = relationship.safety
    const currentDesire = relationship.desire
    const currentCloseness = relationship.closeness

    // --- 0. 交互风格 × 依恋类型 修正（最先执行，修正LLM原始delta） ---
    const styleMod = STYLE_MODIFIERS[interactionStyle]?.[attachmentType]
      || STYLE_MODIFIERS[interactionStyle]?.secure
      || { safetyMod: 1, desireMod: 1, closenessMod: 1 }
    if (interactionStyle !== 'neutral') {
      console.log(`[TwinService] 风格修正: ${interactionStyle}×${attachmentType} → safety×${styleMod.safetyMod} desire×${styleMod.desireMod} closeness×${styleMod.closenessMod}`)
      safetyDelta = Math.round(safetyDelta * styleMod.safetyMod)
      desireDelta = Math.round(desireDelta * styleMod.desireMod)
      closenessDelta = Math.round(closenessDelta * styleMod.closenessMod)
      // 确保修正后方向不变（乘数可能导致正变负或负变正时，取最小值保持方向）
      if (analysis.safetyDelta > 0 && safetyDelta <= 0) safetyDelta = 1
      if (analysis.safetyDelta < 0 && safetyDelta >= 0) safetyDelta = -1
      if (analysis.desireDelta > 0 && desireDelta <= 0) desireDelta = 1
      if (analysis.desireDelta < 0 && desireDelta >= 0) desireDelta = -1
    }

    // --- 1. 情绪调制 ---
    const emotion = emotionalState.emotion
    const isNegativeEmotion = ['defensive', 'guarded', 'hurt', 'cold', 'annoyed'].includes(emotion)
    const isPositiveEmotion = ['warm', 'touched', 'happy', 'content', 'fond'].includes(emotion)

    if (isNegativeEmotion) {
      if (safetyDelta > 0) safetyDelta = Math.max(1, Math.round(safetyDelta * 0.5))
      if (safetyDelta < 0) safetyDelta = Math.round(safetyDelta * 1.3)
      if (desireDelta > 0) desireDelta = Math.round(desireDelta * 0.7)
    } else if (isPositiveEmotion) {
      if (safetyDelta > 0) safetyDelta = Math.round(safetyDelta * 1.2)
      if (safetyDelta < 0) safetyDelta = Math.round(safetyDelta * 0.7)
      if (desireDelta > 0) desireDelta = Math.round(desireDelta * 1.1)
    }

    // --- 2. 恢复不对称：安全感跌快涨慢 ---
    if (safetyDelta < 0) safetyDelta = Math.round(safetyDelta * 1.3)  // 跌得快
    else if (safetyDelta > 0) safetyDelta = Math.round(safetyDelta * 0.8)  // 涨得慢

    // --- 3. 神经质放大安全感波动 ---
    if (neuroticism > 70) {
      if (safetyDelta !== 0) safetyDelta = Math.round(safetyDelta * 1.2)
    }

    // --- 4. 惯性效应：连续同方向效果递增 ---
    const recentSafetyTrend = (relationship.safetyTrend || []).slice(-3)
    const recentSameDir = recentSafetyTrend.filter(d => Math.sign(d) === Math.sign(safetyDelta)).length
    if (recentSameDir >= 3) {
      safetyDelta = Math.round(safetyDelta * 1.3)
    } else if (recentSameDir >= 2) {
      safetyDelta = Math.round(safetyDelta * 1.15)
    }

    const recentDesireTrend = (relationship.desireTrend || []).slice(-3)
    const recentDesireSameDir = recentDesireTrend.filter(d => Math.sign(d) === Math.sign(desireDelta)).length
    if (recentDesireSameDir >= 3) {
      desireDelta = Math.round(desireDelta * 1.3)
    }

    // --- 5. 回避型"墙" ---
    const newSafetyRaw = currentSafety + safetyDelta
    if (attachmentParams.wallThreshold > 0 &&
        currentSafety < attachmentParams.wallThreshold &&
        newSafetyRaw >= attachmentParams.wallThreshold) {
      safetyDelta -= attachmentParams.wallDrop
    }

    // --- 6. 亲密度门控 ---
    const maxCloseness = Math.floor((currentSafety + safetyDelta) * attachmentParams.gateFactor)
    let newCloseness = currentCloseness + closenessDelta
    if (newCloseness > maxCloseness) {
      // 超出门控：亲密被弹回
      newCloseness = maxCloseness
      closenessDelta = newCloseness - currentCloseness
      // 回避型/恐惧型：额外反弹
      if (attachmentParams.gateFactor < 1.0 && closenessDelta > 0) {
        safetyDelta -= 3
        desireDelta -= 4
      }
    }

    // --- 7. 保底：积极互动至少 +1 安全感 ---
    if (safetyDelta >= 0 && analysis.safetyDelta > 0) {
      safetyDelta = Math.max(safetyDelta, 1)
    }

    return {
      safety: currentSafety + safetyDelta,
      desire: currentDesire + desireDelta,
      closeness: newCloseness,
      safetyDelta,
      desireDelta,
    }
  }

  /** 情绪向态度锚点回归（30%） */
  private regressEmotion(currentEmotion: string, anchor: string): string {
    // 锚点定义了"常态情绪"，情绪会向它回归
    const anchorEmotions: Record<string, string> = {
      cold: 'cold', guarded: 'guarded', neutral: 'neutral',
      curious: 'neutral', longing: 'longing', fond: 'warm', attached: 'warm',
    }
    const anchorEmotion = anchorEmotions[anchor] || 'neutral'

    // 如果当前情绪和锚点一致，不变
    if (currentEmotion === anchorEmotion) return currentEmotion

    // 30% 概率回归到锚点（模拟情绪波动后的回落）
    // 但我们不是真的用概率，而是：如果情绪是瞬时的（hurt, excited 等），向锚点靠近
    const transientEmotions = ['hurt', 'excited', 'annoyed', 'touched', 'playful', 'confused']
    if (transientEmotions.includes(currentEmotion)) {
      // 瞬时情绪：回归到锚点
      return anchorEmotion
    }
    // 持续性情绪（warm, cold, guarded, longing 等）：保留
    return currentEmotion
  }

  /** 情绪强度回归：向中间值(50)回归20% */
  private regressIntensity(newIntensity: number, previousIntensity: number): number {
    // 混合新强度和前一轮强度，避免剧烈跳变
    const blended = Math.round(newIntensity * 0.7 + previousIntensity * 0.3)
    // 向50回归20%
    return Math.round(blended * 0.8 + 50 * 0.2)
  }

  private getNeuroticism(dimensionValues: DimensionValue[]): number {
    const p = dimensionValues.find(d => d.dimension_key === 'personality_neuroticism')
    if (p?.value) {
      const num = parseInt(p.value, 10)
      if (!isNaN(num)) return num
    }
    return 50
  }

  /** 兜底：当 LLM 分析失败时的启发式更新 */
  private fallbackStateUpdate(
    relationship: RelationshipState,
    emotionalState: EmotionalStateRecord,
    userMessage: string,
    attachmentParams: AttachmentParams,
  ): { relationship: RelationshipState; emotionalState: EmotionalStateRecord } {
    const msg = userMessage.toLowerCase()
    let safetyDelta = 1, desireDelta = 0, closenessDelta = 0
    let emotion = 'neutral', intensity = 50

    // 简单关键词匹配
    if (/喜欢|爱|想你|在一起|表白/.test(msg)) {
      desireDelta = attachmentParams.desireOnPressure
      safetyDelta = attachmentParams.safetyOnPressure
      emotion = 'guarded'
      intensity = 65
    } else if (/你好|嗨|hi|hello/.test(msg)) {
      desireDelta = 1
      safetyDelta = 1
      emotion = 'neutral'
    } else if (/关心|怎么样|辛苦|累|休息/.test(msg)) {
      desireDelta = attachmentParams.desireOnWarm
      safetyDelta = 2
      closenessDelta = 1
      emotion = 'warm'
      intensity = 55
    } else if (/无聊|烦|滚|骗|傻/.test(msg)) {
      safetyDelta = -5
      desireDelta = -3
      emotion = 'hurt'
      intensity = 70
    }

    const newSafety = clamp(relationship.safety + safetyDelta, 0, 100)
    const newDesire = clamp(relationship.desire + desireDelta, 0, 100)
    const newCloseness = clamp(relationship.closeness + closenessDelta, 0, Math.floor(newSafety * attachmentParams.gateFactor))
    const newStage = deriveStage(newCloseness, newSafety)
    const newTension = deriveTension(newDesire, newCloseness)
    const newAnchor = deriveAttitudeAnchor(newSafety, newDesire)

    return {
      relationship: {
        safety: newSafety, desire: newDesire, closeness: newCloseness,
        stage: newStage, tension: newTension, attitudeAnchor: newAnchor,
        safetyTrend: [...(relationship.safetyTrend || []).slice(-4), safetyDelta],
        desireTrend: [...(relationship.desireTrend || []).slice(-4), desireDelta],
        totalRounds: (relationship.totalRounds || 0) + 1,
        firstInteractionAt: relationship.firstInteractionAt || new Date().toISOString(),
        lastInteractionAt: new Date().toISOString(),
      },
      emotionalState: {
        emotion, emotionIntensity: intensity, attitudeAnchor: newAnchor, tension: newTension,
      },
    }
  }

  // ==================== 持久化 ====================

  private async persistRelationship(matchId: number, rel: RelationshipState): Promise<void> {
    const client = getSupabaseClient()
    const { error } = await client
      .from('twin_relationship')
      .update({
        safety: rel.safety,
        desire: rel.desire,
        closeness: rel.closeness,
        safety_trend: rel.safetyTrend,
        desire_trend: rel.desireTrend,
        total_rounds: rel.totalRounds,
        first_interaction_at: rel.firstInteractionAt,
        last_interaction_at: rel.lastInteractionAt,
        updated_at: new Date().toISOString(),
      })
      .eq('match_id', matchId)
    if (error) console.error('[TwinService] persistRelationship error:', error)
  }

  private async persistEmotionalState(matchId: number, emo: EmotionalStateRecord): Promise<void> {
    const client = getSupabaseClient()
    const { error } = await client
      .from('twin_emotional_state')
      .update({
        emotion: emo.emotion,
        emotion_intensity: emo.emotionIntensity,
        attitude_anchor: emo.attitudeAnchor,
        tension: emo.tension,
        updated_at: new Date().toISOString(),
      })
      .eq('match_id', matchId)
    if (error) console.error('[TwinService] persistEmotionalState error:', error)
  }

  private async saveMessage(matchId: number, role: string, content: string): Promise<void> {
    const client = getSupabaseClient()
    const { error } = await client
      .from('twin_chat_history')
      .insert({ match_id: matchId, role, content })
    if (error) console.error('[TwinService] saveMessage error:', error)
  }

  private async getRecentHistory(matchId: number, limit: number = 20): Promise<any[]> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('twin_chat_history')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) { console.error('[TwinService] getRecentHistory error:', error); return [] }
    return (data || []).reverse()
  }

  private cleanLLMContent(content: string): string {
    let cleaned = content
    cleaned = cleaned.replace(/<think[\s\S]*?<\/think>/gi, '')
    cleaned = cleaned.replace(/<thinking[\s\S]*?<\/thinking>/gi, '')
    cleaned = cleaned.replace(/^<[^>]+>/i, '')
    return cleaned.trim()
  }

  // ==================== AI 提示生成 ====================

  private generateHint(
    prevRel: RelationshipState,
    newRel: RelationshipState,
    prevEmo: EmotionalStateRecord,
    newEmo: EmotionalStateRecord,
    dimensionValues: DimensionValue[],
    userMessage: string,
    interactionStyle: InteractionStyle,
  ): TwinHint | null {
    const safetyDelta = newRel.safety - prevRel.safety
    const desireDelta = newRel.desire - prevRel.desire
    const closenessDelta = newRel.closeness - prevRel.closeness
    const attachment = getAttachmentType(dimensionValues)
    const attachmentLabel: Record<string, string> = {
      avoidant: '回避型', anxious: '焦虑型', secure: '安全型', fearful: '恐惧型',
    }

    const insights: string[] = []
    const suggestions: string[] = []
    let severity: TwinHint['severity'] = 'info'

    // 截取用户消息摘要（≤12字）
    const msgSnippet = userMessage.length > 12 ? userMessage.slice(0, 12) + '…' : userMessage

    // ===== 0. 交互风格解读（最先添加，作为这轮的"底色"） =====
    const styleInsight = this.getStyleInsight(interactionStyle, attachment, safetyDelta, desireDelta, msgSnippet)
    if (styleInsight) insights.push(styleInsight)

    // ===== 1. 安全感变化（带消息上下文） =====
    if (safetyDelta <= -10) {
      insights.push(`「${msgSnippet}」让她非常不安，安全感骤降`)
      severity = 'critical'
    } else if (safetyDelta <= -5) {
      insights.push(`「${msgSnippet}」让她有些不舒服`)
      severity = Math.max(severityRank(severity), severityRank('warning')) === severityRank('warning') ? 'warning' : severity
    } else if (safetyDelta >= 5) {
      insights.push('她在你身边明显放松了一些')
      severity = 'positive'
    } else if (safetyDelta >= 2) {
      insights.push('她对你的信任在悄悄积累')
      if (severity === 'info') severity = 'positive'
    } else if (safetyDelta < -2) {
      insights.push('安全感有点下滑，她稍微退缩了一点')
    }

    // ===== 2. 渴望度变化（依恋类型差异化 + 自然语言） =====
    if (desireDelta >= 8) {
      if (attachment === 'anxious') {
        insights.push('你的一句话让她更想抓住你了——焦虑型就是这样，越有波动越想靠近')
      } else {
        insights.push('她突然很想靠近你，这种感觉来得有点猛')
      }
      if (severity === 'info') severity = 'positive'
    } else if (desireDelta <= -8) {
      if (attachment === 'avoidant' || attachment === 'fearful') {
        insights.push(`${attachmentLabel[attachment]}的本能反应——感受到压力就后退`)
      } else {
        insights.push('她对你的兴趣在明显减退')
      }
      severity = 'warning'
    } else if (desireDelta >= 4) {
      insights.push('她心里有点想靠近你了')
      if (severity === 'info') severity = 'positive'
    } else if (desireDelta <= -4) {
      insights.push('她本能地想拉开一点距离')
    }

    // ===== 3. 亲密度变化 + 门控 =====
    const gateFactor = getAttachmentParams(dimensionValues).gateFactor
    const gateCeiling = Math.floor(newRel.safety * gateFactor)
    if (closenessDelta > 0 && newRel.closeness >= gateCeiling) {
      insights.push('你们近了一步，但已经到她安全感的边界了——想再近，得先让她更安心')
    } else if (closenessDelta >= 3) {
      insights.push('她愿意让你靠近了一些，这是好的信号')
      if (severity === 'info') severity = 'positive'
    } else if (closenessDelta <= -3) {
      insights.push('她主动往后退了半步')
    }

    // ===== 4. 多轮趋势模式检测 =====
    const safetyTrend = newRel.safetyTrend || []
    const desireTrend = newRel.desireTrend || []
    // 最近3轮连续下降
    if (safetyTrend.length >= 3) {
      const last3 = safetyTrend.slice(-3)
      if (last3[1] < last3[0] && last3[2] < last3[1]) {
        insights.push('安全感连续3轮在下降，她一直在承受压力')
        suggestions.push('换个轻松的话题，先不聊感情相关的')
        severity = 'warning'
      }
    }
    // 最近3轮连续上升
    if (safetyTrend.length >= 3 && severity !== 'warning' && severity !== 'critical') {
      const last3 = safetyTrend.slice(-3)
      if (last3[1] > last3[0] && last3[2] > last3[1]) {
        insights.push('安全感连续3轮在上升，你们的关系正在稳步升温')
        if (severity === 'info') severity = 'positive'
      }
    }
    // 渴望持续走低
    if (desireTrend.length >= 4) {
      const last4 = desireTrend.slice(-4)
      if (last4[1] <= last4[0] && last4[2] <= last4[1] && last4[3] <= last4[2]) {
        insights.push('她对你的兴趣一直在减退，需要改变了')
        suggestions.push('试试聊她感兴趣的话题，或者暂时退一步给她空间')
        if (severity === 'info') severity = 'warning'
      }
    }

    // ===== 5. 关系阶段变化（里程碑级） =====
    if (prevRel.stage !== newRel.stage) {
      const stageLabels: Record<string, string> = {
        stranger: '陌生人', acquaintance: '点头之交', familiar: '熟悉的朋友',
        close: '亲密好友', intimate: '恋人般的亲密',
      }
      const stageOrder = ['stranger', 'acquaintance', 'familiar', 'close', 'intimate']
      const prevIdx = stageOrder.indexOf(prevRel.stage)
      const newIdx = stageOrder.indexOf(newRel.stage)
      if (newIdx > prevIdx) {
        insights.push(`关系升级了！从「${stageLabels[prevRel.stage]}」变成了「${stageLabels[newRel.stage]}」`)
        severity = 'positive'
      } else {
        insights.push(`关系倒退了，从「${stageLabels[prevRel.stage]}」变回了「${stageLabels[newRel.stage]}」`)
        severity = 'critical'
      }
    }

    // ===== 6. 张力状态 =====
    if (newRel.tension > 50) {
      insights.push('她内心非常纠结——想靠近又害怕，推拉感很强')
      suggestions.push('现在别急着推进，帮她把内心的矛盾感先降下来')
      if (severity === 'info') severity = 'warning'
    } else if (newRel.tension > 30 && newRel.desire > newRel.closeness) {
      insights.push('她想靠近但不敢，渴望和实际距离之间有落差')
      if (attachment === 'avoidant' || attachment === 'fearful') {
        suggestions.push('别追问她的感受，用轻松的陪伴让她自己慢慢靠近')
      } else if (attachment === 'anxious') {
        suggestions.push('她需要确认感——简短但确定的关心，比长篇大论更有效')
      }
    }

    // ===== 7. 态度锚点 + 情绪组合 =====
    if (newEmo.attitudeAnchor === 'longing' && newRel.safety > 35) {
      insights.push('她嘴上可能不说，但心里其实想靠近你')
      if (attachment === 'avoidant') suggestions.push('别逼她承认，用行动靠近比逼她表态更有效')
    } else if (newEmo.attitudeAnchor === 'guarded' && newRel.safety < 40) {
      insights.push('她在防御，不会轻易敞开')
      suggestions.push('少聊感受多聊事，让她在无压力的对话里慢慢卸下来')
    } else if (newEmo.attitudeAnchor === 'cold' && newRel.safety < 25) {
      insights.push('她对你很冷淡，现在的靠近只会让她更想远离')
      suggestions.push('别讨好也别强行接近，保持适度的存在感就好')
    } else if (newEmo.attitudeAnchor === 'fond' && newRel.safety > 50) {
      insights.push('她对你有好感，安全感也够——可以试着再近一步了')
      if (severity === 'info') severity = 'positive'
    }

    // ===== 8. 回避型墙区 =====
    if (attachment === 'avoidant' && newRel.safety >= 45 && newRel.safety <= 65) {
      suggestions.push('⚠️ 她可能在墙区——随时会突然冷淡，这不是你的问题，是她的防御机制')
    }

    // ===== 9. 情绪剧变 =====
    if (newEmo.emotionIntensity >= 80 && prevEmo.emotionIntensity < 50) {
      insights.push(`情绪强度突然飙到${newEmo.emotionIntensity}%——你触到了她的敏感点`)
      severity = 'warning'
    }

    // ===== 10. 组装：无显著变化时返回 null =====
    if (insights.length === 0) return null

    // 限制提示长度，避免信息过载
    const finalInsight = insights.slice(0, 3).join('；')
    const finalSuggestion = suggestions.length > 0 ? suggestions.slice(0, 2).join('；') : undefined

    return {
      insight: finalInsight,
      suggestion: finalSuggestion,
      severity,
      deltas: { safety: safetyDelta, desire: desireDelta, closeness: closenessDelta },
    }
  }

  /** 交互风格 × 依恋类型 → 提示语 */
  private getStyleInsight(
    style: InteractionStyle,
    attachment: string,
    safetyDelta: number,
    desireDelta: number,
    msgSnippet: string,
  ): string | null {
    if (style === 'neutral') return null

    const styleLabel = STYLE_LABELS[style]
    // 通用前缀：这轮是什么类型的信号
    const prefix = `你用了「${styleLabel}」的方式`

    const styleTexts: Record<InteractionStyle, Record<string, string>> = {
      humor: {
        avoidant: `${prefix}，这恰好是她最舒服的互动方式——没有威胁的亲近，她的防线悄悄降低了`,
        anxious: `${prefix}，她笑了，但可能还在猜你是不是认真的`,
        secure: `${prefix}，气氛轻松了不少，你们的距离在笑声中拉近了`,
        fearful: `${prefix}，她笑得有点勉强——幽默让她放松，但也让她不知道你是不是在开玩笑`,
      },
      teasing: {
        avoidant: `${prefix}，她不太喜欢被逗弄——感觉自己被看穿了，本能想往后退`,
        anxious: `${prefix}，她心动了但更不安——你到底是开玩笑还是认真的？`,
        secure: `${prefix}，制造了一点张力，她不讨厌这种推拉`,
        fearful: `${prefix}，挑逗让她又想靠近又害怕——内心很纠结`,
      },
      flirting: {
        avoidant: `${prefix}，调情对回避型来说等于施压——她开始想逃了`,
        anxious: `${prefix}，这是她最渴望的信号！你确认了你在意她，安全感飙升`,
        secure: `${prefix}，暧昧的气氛升温了，她自然地接住了`,
        fearful: `${prefix}，她想相信但不敢——心里在说"可能是真的"但身体在抗拒`,
      },
      caring: {
        avoidant: `${prefix}，关心还行，她不会特别感动，但也不排斥`,
        anxious: `${prefix}，这正是她最需要的！被关心让她觉得被重视，安全感大增`,
        secure: `${prefix}，温暖被接住了，她觉得被理解`,
        fearful: `${prefix}，关心比调情让她安心多了，她的防备悄悄降低`,
      },
      vulnerable: {
        avoidant: `${prefix}，你展示了脆弱——这是回避型的秘密弱点，她的保护欲被激活了`,
        anxious: `${prefix}，你愿意在我面前示弱——你信任我！她觉得自己被需要`,
        secure: `${prefix}，真诚是最好的亲密加速器，她被触动了`,
        fearful: `${prefix}，你敢脆弱，她也在想也许自己也可以——防备在松动`,
      },
      challenging: {
        avoidant: `${prefix}，激将法对回避型意外有效——有挑战性的人才值得靠近`,
        anxious: `${prefix}，她觉得你在否定她——不安感上升了`,
        secure: `${prefix}，有点刺激但不伤人，她可以接住`,
        fearful: `${prefix}，挑战让她觉得自己不够好——她开始退缩了`,
      },
      pressuring: {
        avoidant: `${prefix}，她感受到压力了——回避型的第一反应是逃跑`,
        anxious: `${prefix}，她想靠近但更不安——被需要的感觉和被控制的恐惧在打架`,
        secure: `${prefix}，她不太舒服，但还能直接告诉你`,
        fearful: `${prefix}，压力让她冻住了——完全不知道怎么回应`,
      },
      cold: {
        avoidant: `${prefix}，你冷淡她反而稍微松了口气——不用应对了`,
        anxious: `${prefix}，你一冷她就慌了——安全感急剧下降，但渴望度反而上升`,
        secure: `${prefix}，她注意到了，但不会过度反应`,
        fearful: `${prefix}，她心想"果然，没人会一直对我好"`,
      },
      empathetic: {
        avoidant: `${prefix}，被理解但不被push——这对回避型来说太珍贵了`,
        anxious: `${prefix}，终于有人理解我了！她觉得被看见了`,
        secure: `${prefix}，被理解的感觉很好，她更愿意敞开了`,
        fearful: `${prefix}，理解让她放下了一些戒备——被理解比被爱更安全`,
      },
      probing: {
        avoidant: `${prefix}，你在打探什么？她的雷达响了`,
        anxious: `${prefix}，你在意她才问——但答案让她紧张`,
        secure: `${prefix}，了解彼此是正常的，她愿意分享`,
        fearful: `${prefix}，别探究我——她想把自己藏起来`,
      },
      compliment: {
        avoidant: `${prefix}，赞美还行，但别太肉麻`,
        anxious: `${prefix}，被肯定！她的安全感暴涨——原来你觉得我很好`,
        secure: `${prefix}，她开心地收下了`,
        fearful: `${prefix}，赞美比调情安全，她愿意相信一点点`,
      },
      apologetic: {
        avoidant: `${prefix}，你退一步她也退一步——双方的压力都减了`,
        anxious: `${prefix}，你认错了——你还在意我！修复力极强`,
        secure: `${prefix}，道歉是修复的好方式，她接住了`,
        fearful: `${prefix}，你愿意认错——也许你是认真的，安全感在回升`,
      },
      nostalgic: {
        avoidant: `${prefix}，回忆是安全的——过去的不会威胁现在，她可以放松`,
        anxious: `${prefix}，我们曾经那么好——她渴望恢复过去的状态`,
        secure: `${prefix}，美好的回忆让气氛暖了`,
        fearful: `${prefix}，美好的过去让她犹豫——也许可以再试一次？`,
      },
      jealous: {
        avoidant: `${prefix}，占有欲让她觉得被控制了——想逃离`,
        anxious: `${prefix}，你吃醋了说明你在乎我！但方式让她又甜又不安`,
        secure: `${prefix}，有点在意但能沟通——她不想被束缚`,
        fearful: `${prefix}，醋意=占有=危险信号，她在退缩`,
      },
      assertive: {
        avoidant: `${prefix}，被主导的感觉让她想反抗——她要自己选`,
        anxious: `${prefix}，有人拿主意省心——但别太过，她有自己的底线`,
        secure: `${prefix}，她可以接受主导但有边界`,
        fearful: `${prefix}，强势让她觉得自己被压制——她关上了门`,
      },
      neutral: {},
    }

    return styleTexts[style]?.[attachment] || `${prefix}，她接收到了这个信号`
  }

  // ==================== A: 回复人格化 ====================

  /** 从维度数据推导口头禅、语气词、标点习惯 */
  private deriveOralHabits(dimensionValues: DimensionValue[], portrait: PortraitData | null): string {
    const habits: string[] = []

    // 外向性 → 语气词频率和类型
    const extraversion = this.getDimensionValue(dimensionValues, 'personality_extraversion') || 50
    if (extraversion > 70) {
      habits.push('经常用"哈哈"、"嘿嘿"、"呀"、"呢"等语气词')
      habits.push('喜欢用感叹号和波浪号表达情绪')
    } else if (extraversion < 30) {
      habits.push('话少，偶尔用"嗯"、"哦"、"吧"')
      habits.push('标点极简，多用句号，几乎不用感叹号')
    } else {
      habits.push('偶尔用语气词，不过度')
    }

    // 神经质 → 情绪波动在语言中的体现
    const neuroticism = this.getNeuroticism(dimensionValues)
    if (neuroticism > 65) {
      habits.push('情绪波动时会连续发短消息而不是一条长消息')
      habits.push('犹豫时会用"……"、"……吧"、"可能？"')
    }

    // 宜人性 → 礼貌程度和回避冲突
    const agreeableness = this.getDimensionValue(dimensionValues, 'personality_agreeableness') || 50
    if (agreeableness > 70) {
      habits.push('很少直接否定，会用"也行吧"、"其实也可以"')
    } else if (agreeableness < 30) {
      habits.push('说话直接，不绕弯子，会用"不是"、"我就说"')
    }

    // 开放性 → 表达丰富度
    const openness = this.getDimensionValue(dimensionValues, 'personality_openness') || 50
    if (openness > 70) {
      habits.push('喜欢用比喻和意象，会说"像……一样"')
    }

    // 从画像中提取更个性化的表达
    if (portrait) {
      const communication = portrait.communication_directness
      if (communication != null) {
        habits.push(`沟通直接度：${communication}/100（${communication > 60 ? '直接坦率' : '含蓄委婉'}）`)
      }
    }

    return habits.join('；')
  }

  /** 根据关系状态和性格决定回复节奏特征 */
  private deriveReplyRhythm(
    relationship: RelationshipState,
    emotionalState: EmotionalStateRecord,
    dimensionValues: DimensionValue[],
  ): { responseLength: 'short' | 'medium' | 'long'; replySpeed: 'instant' | 'normal' | 'slow' | 'delayed'; ellipsisChance: number } {
    const extraversion = this.getDimensionValue(dimensionValues, 'personality_extraversion') || 50
    const neuroticism = this.getNeuroticism(dimensionValues)

    // 回复长度：外向+安全感高→长；内向+安全感低→短
    let lengthScore = 50
    lengthScore += (extraversion - 50) * 0.3
    lengthScore += (relationship.safety - 50) * 0.2
    lengthScore += (relationship.desire - 50) * 0.2

    // 紧张时可能话变多（焦虑型）或变少（回避型）
    if (relationship.tension > 40) {
      const attachment = getAttachmentType(dimensionValues)
      if (attachment === 'anxious') lengthScore += 15 // 焦虑型紧张时话多
      else if (attachment === 'avoidant') lengthScore -= 20 // 回避型紧张时话少
    }

    const responseLength: 'short' | 'medium' | 'long' =
      lengthScore < 35 ? 'short' : lengthScore > 65 ? 'long' : 'medium'

    // 回复速度：情绪高→快；回避中→慢；晚上→慢
    let speedScore = 50
    speedScore += (emotionalState.emotionIntensity - 50) * 0.2
    if (relationship.safety < 40) speedScore -= 20
    if (emotionalState.emotion === 'guarded' || emotionalState.emotion === 'withdrawn') speedScore -= 25
    if (emotionalState.emotion === 'warm' || emotionalState.emotion === 'fond') speedScore += 10

    const hour = new Date().getHours()
    if (hour >= 0 && hour < 7) speedScore -= 15

    const replySpeed: 'instant' | 'normal' | 'slow' | 'delayed' =
      speedScore > 70 ? 'instant' : speedScore > 45 ? 'normal' : speedScore > 25 ? 'slow' : 'delayed'

    // 省略号概率：高神经质+低安全感→高
    let ellipsisChance = 0.1
    ellipsisChance += (neuroticism - 50) * 0.003
    ellipsisChance += (50 - relationship.safety) * 0.003
    ellipsisChance = Math.max(0, Math.min(0.6, ellipsisChance))

    return { responseLength, replySpeed, ellipsisChance }
  }

  /** 话题偏好：她喜欢聊什么、回避什么 */
  private deriveTopicPreferences(dimensionValues: DimensionValue[], portrait: PortraitData | null): string {
    const prefs: string[] = []
    const interests: string[] = []

    // 从维度中提取兴趣
    const interestKeys = ['interest_art', 'interest_music', 'interest_sports', 'interest_reading',
      'interest_tech', 'interest_travel', 'interest_food', 'interest_film', 'interest_game']
    const interestNames: Record<string, string> = {
      interest_art: '艺术', interest_music: '音乐', interest_sports: '运动',
      interest_reading: '阅读', interest_tech: '科技', interest_travel: '旅行',
      interest_food: '美食', interest_film: '电影', interest_game: '游戏',
    }

    for (const key of interestKeys) {
      const val = this.getDimensionValue(dimensionValues, key)
      if (val && val > 65) interests.push(interestNames[key])
    }

    if (interests.length > 0) {
      prefs.push(`聊${interests.join('、')}时会变得话多和热情`)
    }

    // 话题回避：低安全感时回避的话题
    const openness = this.getDimensionValue(dimensionValues, 'personality_openness') || 50
    if (openness < 35) {
      prefs.push('不喜欢聊太抽象或太私人的话题')
    }

    const agreeableness = this.getDimensionValue(dimensionValues, 'personality_agreeableness') || 50
    if (agreeableness < 35) {
      prefs.push('不喜欢虚伪的客套和闲聊')
    }

    // 从画像提取
    if (portrait) {
      if (portrait.communication_directness != null) prefs.push(`沟通直接度：${portrait.communication_directness}/100`)
      if (portrait.communication_humor != null) prefs.push(`幽默倾向：${portrait.communication_humor}/100`)
    }

    return prefs.join('；') || '无明显话题偏好'
  }

  // ==================== B: 关系记忆 ====================

  /** 保存关键时刻 */
  private async saveKeyMoment(
    matchId: number,
    momentType: string,
    content: string,
    triggerMessage: string | null,
    emotionalWeight: number,
    isPromise = false,
  ) {
    try {
      const supabase = getSupabaseClient()
      await supabase.from('twin_key_moments').insert({
        match_id: matchId,
        moment_type: momentType,
        content,
        trigger_message: triggerMessage,
        emotional_weight: emotionalWeight,
        is_promise: isPromise,
        promise_fulfilled: false,
      })
      console.log('[Twin] Key moment saved:', momentType, content.substring(0, 30))
    } catch (e) {
      console.error('[Twin] Failed to save key moment:', e.message)
    }
  }

  /** 回忆关键时刻（最近N条，按情感权重排序） */
  private async recallKeyMoments(matchId: number, limit = 5): Promise<Array<{
    momentType: string; content: string; triggerMessage: string | null;
    emotionalWeight: number; isPromise: boolean; promiseFulfilled: boolean;
    createdAt: string;
  }>> {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('twin_key_moments')
        .select('*')
        .eq('match_id', matchId)
        .order('emotional_weight', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error || !data) return []
      return data.map((d: any) => ({
        momentType: d.moment_type,
        content: d.content,
        triggerMessage: d.trigger_message,
        emotionalWeight: d.emotional_weight,
        isPromise: d.is_promise,
        promiseFulfilled: d.promise_fulfilled,
        createdAt: d.created_at,
      }))
    } catch (e) {
      console.error('[Twin] Failed to recall key moments:', e.message)
      return []
    }
  }

  /** 检查未兑现的承诺 */
  private async checkUnfulfilledPromises(matchId: number): Promise<string[]> {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('twin_key_moments')
        .select('content')
        .eq('match_id', matchId)
        .eq('is_promise', true)
        .eq('promise_fulfilled', false)
        .order('created_at', { ascending: false })
        .limit(3)
      if (error || !data) return []
      return data.map((d: any) => d.content)
    } catch (e) {
      return []
    }
  }

  /** 标记承诺为已兑现 */
  private async fulfillPromise(matchId: number, momentId: number) {
    try {
      const supabase = getSupabaseClient()
      await supabase
        .from('twin_key_moments')
        .update({ promise_fulfilled: true })
        .eq('id', momentId)
        .eq('match_id', matchId)
    } catch (e) {
      console.error('[Twin] Failed to fulfill promise:', e.message)
    }
  }

  /** 检测是否是关键时刻并保存 */
  private async detectAndSaveKeyMoment(
    matchId: number,
    userMessage: string,
    aiReply: string,
    interactionStyle: string,
    emotionalState: EmotionalStateRecord,
    relationship: RelationshipState,
  ) {
    // 首次打招呼
    if (relationship.totalRounds <= 1 && interactionStyle === 'neutral') {
      await this.saveKeyMoment(matchId, 'first_greeting', '第一次打招呼', userMessage, 30)
    }

    // 情感高峰（emotionIntensity > 80）
    if (emotionalState.emotionIntensity > 80) {
      await this.saveKeyMoment(matchId, 'emotional_peak',
        `情感高峰：${emotionalState.emotion}，强度${emotionalState.emotionIntensity}`,
        userMessage, Math.round(emotionalState.emotionIntensity))
    }

    // 表白/告白
    if (interactionStyle === 'flirting' && relationship.desire > 60) {
      await this.saveKeyMoment(matchId, 'first_confession', `暧昧表白：${userMessage.substring(0, 50)}`,
        userMessage, 90)
    }

    // 吵架（安全感骤降 + pressure）
    if (interactionStyle === 'pressuring' && relationship.safetyTrend.length >= 2) {
      const recentSafety = relationship.safetyTrend.slice(-2)
      if (recentSafety[1] - recentSafety[0] < -15) {
        await this.saveKeyMoment(matchId, 'first_fight', `冲突：${userMessage.substring(0, 50)}`,
          userMessage, 85)
      }
    }

    // 道歉 + 之前有吵架记录
    if (interactionStyle === 'apologetic') {
      const supabase = getSupabaseClient()
      const { data: fights } = await supabase
        .from('twin_key_moments')
        .select('id')
        .eq('match_id', matchId)
        .eq('moment_type', 'first_fight')
        .limit(1)
      if (fights && fights.length > 0) {
        await this.saveKeyMoment(matchId, 'reconciliation', `和解道歉：${userMessage.substring(0, 50)}`,
          userMessage, 80)
      }
    }

    // 脆弱展示（对方敞开了心扉）
    if (interactionStyle === 'vulnerable') {
      await this.saveKeyMoment(matchId, 'shared_secret', `对方展示了脆弱：${userMessage.substring(0, 50)}`,
        userMessage, 75)
    }

    // 承诺检测
    const promisePatterns = /我(会|一定|保证|承诺|答应).*/g
    const promiseMatch = userMessage.match(promisePatterns)
    if (promiseMatch) {
      await this.saveKeyMoment(matchId, 'promise', promiseMatch[0],
        userMessage, 70, true)
    }
  }

  // ==================== C: 时间/场景感知 ====================

  /** 获取当前时间上下文 */
  private getTimeContext(): {
    timeSlot: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' | 'late_night'
    dayType: 'weekday' | 'weekend' | 'holiday'
    moodBias: string
    energyLevel: 'low' | 'medium' | 'high'
  } {
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay()

    // 时间段
    let timeSlot: typeof this.getTimeContext extends (...args: any) => infer R ? R extends { timeSlot: infer T } ? T : never : never
    if (hour >= 5 && hour < 8) timeSlot = 'dawn'
    else if (hour >= 8 && hour < 12) timeSlot = 'morning'
    else if (hour >= 12 && hour < 14) timeSlot = 'noon'
    else if (hour >= 14 && hour < 18) timeSlot = 'afternoon'
    else if (hour >= 18 && hour < 21) timeSlot = 'evening'
    else if (hour >= 21 && hour < 24) timeSlot = 'night'
    else timeSlot = 'late_night' // 0-5

    // 工作日/周末
    const dayType: 'weekday' | 'weekend' | 'holiday' =
      (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday'

    // 情绪倾向
    const moodMap: Record<string, string> = {
      dawn: '刚醒，迷糊中，可能还没完全清醒',
      morning: '上午，精神相对充沛',
      noon: '午休时间，可能在吃饭或短暂放松',
      afternoon: '下午，可能有点困倦，工作状态',
      evening: '下班后，开始放松',
      night: '晚上，相对放松，更容易敞开心扉',
      late_night: '深夜，感性思维占主导，防备心最低但也最脆弱',
    }

    // 精力水平
    let energyLevel: 'low' | 'medium' | 'high' = 'medium'
    if (hour >= 5 && hour < 10) energyLevel = 'high'
    else if (hour >= 13 && hour < 15) energyLevel = 'low'
    else if (hour >= 22 || hour < 5) energyLevel = 'low'

    return {
      timeSlot,
      dayType,
      moodBias: moodMap[timeSlot],
      energyLevel,
    }
  }

  /** 生成或获取生活事件 */
  private async generateLifeEvent(
    matchId: number,
    dimensionValues: DimensionValue[],
  ): Promise<string | null> {
    // 检查是否已有未过期的生活事件
    try {
      const supabase = getSupabaseClient()
      const now = new Date().toISOString()
      const { data: existing } = await supabase
        .from('twin_life_events')
        .select('*')
        .eq('match_id', matchId)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .limit(1)

      if (existing && existing.length > 0) {
        return `当前状态：${existing[0].event_description}（心情倾向：${existing[0].mood_modifier || '正常'}）`
      }
    } catch (e) {
      // 表可能为空，继续
    }

    // 20%概率生成新生活事件
    if (Math.random() > 0.2) return null

    const timeCtx = this.getTimeContext()
    const eventsByTime: Record<string, Array<{ type: string; desc: string; mood: string }>> = {
      morning: [
        { type: 'work_stress', desc: '今天早上堵车迟到了，有点烦', mood: 'stressed' },
        { type: 'good_mood', desc: '今天出门遇到一只超可爱的小猫', mood: 'happy' },
        { type: 'bad_sleep', desc: '昨晚没睡好，今天有点犯困', mood: 'tired' },
      ],
      afternoon: [
        { type: 'work_stress', desc: '下午被领导批评了', mood: 'stressed' },
        { type: 'good_mood', desc: '下午喝到一杯好喝的奶茶，心情不错', mood: 'happy' },
        { type: 'social', desc: '同事请了下午茶', mood: 'happy' },
      ],
      evening: [
        { type: 'fitness', desc: '刚跑完步，身体有点累但心情不错', mood: 'energetic' },
        { type: 'good_mood', desc: '今天提前下班了', mood: 'happy' },
        { type: 'work_stress', desc: '加班到现在，好累', mood: 'tired' },
      ],
      night: [
        { type: 'family', desc: '刚跟家里打完电话', mood: 'melancholy' },
        { type: 'good_mood', desc: '看了一部好电影，有点感动', mood: 'happy' },
        { type: 'bad_sleep', desc: '失眠了，翻来覆去睡不着', mood: 'tired' },
      ],
      late_night: [
        { type: 'bad_sleep', desc: '又失眠了，脑子停不下来', mood: 'melancholy' },
        { type: 'social', desc: '深夜emo中', mood: 'melancholy' },
        { type: 'good_mood', desc: '半夜追剧追到精彩的地方', mood: 'happy' },
      ],
    }

    const timeKey = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night', 'late_night'].includes(timeCtx.timeSlot)
      ? timeCtx.timeSlot : 'afternoon'
    // noon 归入 afternoon, dawn 归入 morning
    const eventPool = timeKey === 'noon' ? eventsByTime.afternoon :
      timeKey === 'dawn' ? eventsByTime.morning :
      eventsByTime[timeKey] || eventsByTime.afternoon

    const event = eventPool[Math.floor(Math.random() * eventPool.length)]

    // 计算过期时间（2-4小时后）
    const expiresAt = new Date(Date.now() + (2 + Math.random() * 2) * 3600 * 1000)

    try {
      const supabase = getSupabaseClient()
      await supabase.from('twin_life_events').insert({
        match_id: matchId,
        event_type: event.type,
        event_description: event.desc,
        mood_modifier: event.mood,
        expires_at: expiresAt.toISOString(),
      })
      return `当前状态：${event.desc}（心情倾向：${event.mood}）`
    } catch (e) {
      return null
    }
  }

  // ==================== D: 对话动态 ====================

  /** 判断对话节奏：想继续还是想结束 */
  private determineConversationRhythm(
    emotionalState: EmotionalStateRecord,
    relationship: RelationshipState,
    interactionStyle: string,
  ): { wantsToContinue: boolean; suggestedDelay: number; replyLength: string; rhythmHint: string } {
    // 基础意愿：情绪好→想继续，情绪差→想结束
    let continueScore = 50

    // 情绪影响
    const emotionScores: Record<string, number> = {
      warm: 25, fond: 30, playful: 20, excited: 25, calm: 10,
      neutral: 0, bored: -15, tired: -20,
      guarded: -25, anxious: -10, withdrawn: -35, cold: -30,
    }
    continueScore += emotionScores[emotionalState.emotion] || 0

    // 关系影响
    if (relationship.safety > 60) continueScore += 10
    if (relationship.desire > 60) continueScore += 10
    if (relationship.tension > 50) continueScore -= 10 // 高张力累了

    // 交互风格影响
    if (interactionStyle === 'pressuring') continueScore -= 20
    if (interactionStyle === 'cold') continueScore -= 15
    if (interactionStyle === 'humor' || interactionStyle === 'caring') continueScore += 10

    // 时间影响：深夜更容易想结束
    const hour = new Date().getHours()
    if (hour >= 0 && hour < 6) continueScore -= 20

    const wantsToContinue = continueScore > 20

    // 回复延迟模拟（秒）
    let suggestedDelay = 1
    if (emotionalState.emotion === 'withdrawn') suggestedDelay = 30
    else if (emotionalState.emotion === 'cold') suggestedDelay = 20
    else if (emotionalState.emotion === 'guarded') suggestedDelay = 10
    else if (emotionalState.emotion === 'fond' || emotionalState.emotion === 'excited') suggestedDelay = 0.5
    if (hour >= 0 && hour < 6) suggestedDelay *= 3

    // 回复长度倾向
    let replyLength: string = 'medium'
    if (continueScore < 20) replyLength = 'very_short'
    else if (continueScore < 35) replyLength = 'short'
    else if (continueScore > 70) replyLength = 'long'

    // 节奏提示
    let rhythmHint = ''
    if (!wantsToContinue) {
      if (emotionalState.emotion === 'withdrawn') rhythmHint = '她现在不太想说话，回复变得简短'
      else if (emotionalState.emotion === 'tired') rhythmHint = '她有点累了，回复越来越短'
      else if (relationship.tension > 50) rhythmHint = '气氛有点紧绷，她在犹豫要不要继续'
      else rhythmHint = '她似乎想结束这次对话'
    } else if (continueScore > 60) {
      rhythmHint = '她聊得很投入，甚至主动延续话题'
    }

    return { wantsToContinue, suggestedDelay, replyLength, rhythmHint }
  }

  /** 话题敏感度检测：基于维度数据判断敏感话题 */
  private detectTopicSensitivity(userMessage: string, dimensionValues: DimensionValue[]): string | null {
    // 所有人都敏感的话题（无需条件判断）
    const universalSensitive: Array<{ keywords: string[]; topic: string }> = [
      { keywords: ['前任', '前男友', '前女友', '初恋', '前夫', '前妻', '之前谈过'], topic: '前任/过去感情' },
      { keywords: ['结婚', '嫁给我', '娶你', '定下来', '领证'], topic: '婚姻/承诺话题' },
      { keywords: ['给我看手机', '查手机', '你跟谁聊', '给我看看你手机'], topic: '隐私边界' },
    ]

    // 依性格条件敏感的话题
    const conditionalSensitive: Array<{ keywords: string[]; topic: string; condition: () => boolean }> = [
      {
        keywords: ['你为什么总是', '你每次都', '你从来', '你怎么老是'],
        topic: '被指责/批评',
        condition: () => {
          const agreeableness = this.getDimensionValue(dimensionValues, 'personality_agreeableness') || 50
          return agreeableness > 50
        },
      },
      {
        keywords: ['工资', '赚多少', '存款', '房子', '年薪', '多少钱'],
        topic: '金钱/物质话题',
        condition: () => {
          const openness = this.getDimensionValue(dimensionValues, 'personality_openness') || 50
          return openness < 55
        },
      },
      {
        keywords: ['你妈', '你爸', '你家人', '你父母', '你家'],
        topic: '家庭/原生家庭',
        condition: () => {
          const neuroticism = this.getDimensionValue(dimensionValues, 'personality_neuroticism') || 50
          return neuroticism > 45
        },
      },
      {
        keywords: ['你到底想怎样', '你什么意思', '你到底要不要'],
        topic: '被逼问/要求表态',
        condition: () => true,
      },
    ]

    // 先检查普遍敏感话题
    for (const pattern of universalSensitive) {
      if (pattern.keywords.some(k => userMessage.includes(k))) {
        return pattern.topic
      }
    }

    // 再检查条件敏感话题
    for (const pattern of conditionalSensitive) {
      if (pattern.keywords.some(k => userMessage.includes(k)) && pattern.condition()) {
        return pattern.topic
      }
    }
    return null
  }

  /** 不想继续时的回复策略 */
  private generateDisengagementReply(emotion: string, attachmentType: string): string | null {
    const disengagementMap: Record<string, Record<string, string>> = {
      withdrawn: {
        avoidant: '我有点累了，改天再聊吧',
        anxious: '嗯……我可能需要一点时间，不是你的问题',
        secure: '今天先到这里吧，我需要休息一下',
        fearful: '我……晚点再说好吗',
      },
      tired: {
        avoidant: '困了，睡了',
        anxious: '好困啊，我先去睡了，明天再聊？',
        secure: '今天好累，明天继续？晚安',
        fearful: '嗯……有点困了',
      },
      cold: {
        avoidant: '没什么好说的',
        anxious: '你说的我听到了，但我现在不太想回应',
        secure: '我现在不太想聊这个',
        fearful: '……算了',
      },
    }

    return disengagementMap[emotion]?.[attachmentType] || null
  }

  // ==================== E: 关系成长记录 ====================

  /** 检查并记录里程碑 */
  private async checkMilestones(
    matchId: number,
    relationship: RelationshipState,
    prevSafety: number,
    prevDesire: number,
    prevCloseness: number,
    prevStage: string,
    interactionStyle?: string,
    emotion?: string,
  ) {
    const currentStage = relationship.stage
    const supabase = getSupabaseClient()

    // 阶段升级
    const stageOrder = ['stranger', 'acquaintance', 'familiar', 'close', 'intimate']
    const prevIdx = stageOrder.indexOf(prevStage)
    const currIdx = stageOrder.indexOf(currentStage)
    if (currIdx > prevIdx) {
      const stageNames: Record<string, string> = {
        acquaintance: '从陌生人变成点头之交',
        familiar: '从点头之交变成熟人',
        close: '从熟人变成亲密好友',
        intimate: '从好友变成亲密伴侣',
      }
      await this.saveMilestone(matchId, 'stage_up',
        `关系升级：${stageNames[currentStage] || currentStage}`,
        `安全${relationship.safety}/渴望${relationship.desire}/亲密${relationship.closeness}`)
    } else if (currIdx < prevIdx) {
      await this.saveMilestone(matchId, 'stage_down',
        `关系降级：退回${currentStage}阶段`,
        `安全${relationship.safety}/渴望${relationship.desire}/亲密${relationship.closeness}`)
    }

    // 数值里程碑
    if (prevSafety < 50 && relationship.safety >= 50) {
      await this.saveMilestone(matchId, 'safety_50', '安全感突破50', '开始建立基本信任')
    }
    if (prevSafety < 80 && relationship.safety >= 80) {
      await this.saveMilestone(matchId, 'safety_80', '安全感突破80', '深层信任已建立')
    }
    if (prevDesire < 50 && relationship.desire >= 50) {
      await this.saveMilestone(matchId, 'desire_50', '渴望度突破50', '开始对你产生了明显的兴趣')
    }

    // 交互式里程碑（只记录第一次）
    if (interactionStyle) {
      const interactionMilestones: Record<string, { type: string; title: string; desc: string }> = {
        caring: { type: 'first_care', title: '第一次关心', desc: '你第一次对她表达关心' },
        vulnerable: { type: 'first_open_up', title: '第一次敞开心扉', desc: '你第一次向她展示脆弱' },
        humor: { type: 'first_humor', title: '第一次逗她笑', desc: '你第一次用幽默靠近她' },
        flirting: { type: 'first_flirting', title: '第一次调情', desc: '你第一次对她暧昧' },
        apologetic: { type: 'first_apology', title: '第一次道歉', desc: '你第一次向她道歉' },
        compliment: { type: 'first_compliment', title: '第一次赞美', desc: '你第一次直接夸她' },
      }
      const m = interactionMilestones[interactionStyle]
      if (m) {
        // 检查是否已有同类里程碑
        const { data: existing } = await supabase
          .from('twin_milestones')
          .select('id')
          .eq('match_id', matchId)
          .eq('milestone_type', m.type)
          .limit(1)
        if (!existing || existing.length === 0) {
          await this.saveMilestone(matchId, m.type, m.title, m.desc)
        }
      }
    }

    // 情绪里程碑
    if (emotion === 'warm' || emotion === 'affectionate') {
      const { data: existing } = await supabase
        .from('twin_milestones')
        .select('id')
        .eq('match_id', matchId)
        .eq('milestone_type', 'first_warm')
        .limit(1)
      if (!existing || existing.length === 0) {
        await this.saveMilestone(matchId, 'first_warm', '她第一次对你温暖', '她放下了防备，对你露出柔软的一面')
      }
    }

    // 时间里程碑
    if (relationship.firstInteractionAt) {
      const daysSince = Math.floor((Date.now() - new Date(relationship.firstInteractionAt).getTime()) / 86400000)
      if (daysSince === 7) {
        await this.saveMilestone(matchId, 'day_7', '相识7天', '一周了')
      } else if (daysSince === 30) {
        await this.saveMilestone(matchId, 'day_30', '相识30天', '一个月了')
      } else if (daysSince === 100) {
        await this.saveMilestone(matchId, 'day_100', '相识100天', '一百天了')
      }
    }
  }

  /** 保存里程碑 */
  private async saveMilestone(matchId: number, milestoneType: string, title: string, description: string) {
    try {
      const supabase = getSupabaseClient()
      // 检查是否已有同类里程碑
      const { data: existing } = await supabase
        .from('twin_milestones')
        .select('id')
        .eq('match_id', matchId)
        .eq('milestone_type', milestoneType)
        .limit(1)

      if (existing && existing.length > 0) return // 不重复记录

      await supabase.from('twin_milestones').insert({
        match_id: matchId,
        milestone_type: milestoneType,
        title,
        description,
      })
      console.log('[Twin] Milestone:', milestoneType, title)
    } catch (e) {
      console.error('[Twin] Failed to save milestone:', e.message)
    }
  }

  /** 获取关系里程碑列表 */
  private async getMilestones(matchId: number): Promise<Array<{
    milestoneType: string; title: string; description: string | null; occurredAt: string;
  }>> {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('twin_milestones')
        .select('milestone_type, title, description, occurred_at')
        .eq('match_id', matchId)
        .order('occurred_at', { ascending: true })
      if (error || !data) return []
      return data.map((d: any) => ({
        milestoneType: d.milestone_type,
        title: d.title,
        description: d.description,
        occurredAt: d.occurred_at,
      }))
    } catch (e) {
      return []
    }
  }

  // ==================== 主动消息 ====================

  private async checkAndGenerateProactiveMessage(
    matchId: number,
    relationship: RelationshipState,
    emotionalState: EmotionalStateRecord,
    dimensionValues: DimensionValue[],
    portrait: PortraitData | null,
    req: Request,
  ): Promise<string | null> {
    // 基础概率：10%
    let probability = 0.1

    // 关系阶段调节
    const stageMultipliers: Record<string, number> = {
      stranger: 0.3, acquaintance: 0.8, familiar: 1.5, close: 2.0, intimate: 2.5,
    }
    probability *= stageMultipliers[relationship.stage] || 1

    // 高张力 → 更可能主动（内心的纠结需要表达）
    if (relationship.tension > 40) probability *= 1.5
    else if (relationship.tension > 20) probability *= 1.2

    // 渴望高 → 更可能主动
    if (relationship.desire > 60) probability *= 1.3

    // 外向性调节
    const extraversion = portrait?.personality_extraversion ?? 50
    if (extraversion > 70) probability *= 1.3
    else if (extraversion < 30) probability *= 0.5

    if (Math.random() > probability) return null

    try {
      const name = (await this.getMatchInfo(matchId))?.name || 'TA'
      const attachment = getAttachmentType(dimensionValues)
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const prompt = `你是${name}，你主动给对方发了一条消息。

当前状态：渴望度${relationship.desire}，安全感${relationship.safety}，亲密度${relationship.closeness}
情绪：${emotionalState.emotion}，态度：${emotionalState.attitudeAnchor}
依恋类型：${attachment}

${attachment === 'avoidant' || attachment === 'fearful' ? '你是回避型，主动消息会很委婉，不会暴露太多需求感——"看到个东西觉得你会喜欢""今天天气不错"' : attachment === 'anxious' ? '你是焦虑型，主动消息可能带着试探——"在吗？""你怎么不理我""我是不是说错什么了"' : '你是安全型，主动消息比较自然——"今天碰到个好玩的事""你在干嘛"'}

${relationship.tension > 40 ? '你内心很纠结，消息可能有些矛盾——想靠近又怕靠近' : ''}

只输出消息内容，1-2句话，不要引号不要解释。`

      const response = await client.invoke(
        [{ role: 'user', content: prompt }],
        { model: 'doubao-seed-2-0-mini-260215', temperature: 0.9, thinking: 'disabled' },
      )

      const proactiveMsg = this.cleanLLMContent(response.content)
      if (proactiveMsg) {
        const supabase = getSupabaseClient()
        await supabase.from('twin_proactive_messages').insert({
          match_id: matchId,
          message: proactiveMsg,
          trigger_type: 'daily',
          is_sent: false,
        })
        await this.saveMessage(matchId, 'assistant', proactiveMsg)
      }
      return proactiveMsg
    } catch {
      return null
    }
  }

  // ==================== 核心聊天方法 ====================

  async chat(matchId: number, message: string, req: Request, hintsEnabled: boolean = true): Promise<{
    reply: string
    relationship: RelationshipState
    emotionalState: EmotionalStateRecord
    proactiveMessage?: string
    hint?: TwinHint | null
    interactionStyle?: InteractionStyle
    conversationRhythm?: { wantsToContinue: boolean; suggestedDelay: number; replyLength: string }
    topicSensitivity?: string | null
    milestones?: Array<{ title: string; description: string | null; occurredAt: string }>
  }> {
    console.log('[TwinService] chat, matchId:', matchId)

    // 空消息处理
    const trimmedMessage = (message || '').trim()
    if (!trimmedMessage) {
      const relationship = await this.getOrCreateRelationship(matchId)
      const emotionalState = await this.getOrCreateEmotionalState(matchId)
      return {
        reply: '…',
        relationship,
        emotionalState,
        interactionStyle: 'neutral' as InteractionStyle,
        conversationRhythm: { wantsToContinue: true, suggestedDelay: 0, replyLength: 'very_short' },
      }
    }

    const matchInfo = await this.getMatchInfo(matchId)
    if (!matchInfo) throw new Error('Match not found')

    const dimensionValues = await this.getMatchDimensions(matchId)
    const portraitData = await this.getMatchPortrait(matchId)
    const relationship = await this.getOrCreateRelationship(matchId)
    const emotionalState = await this.getOrCreateEmotionalState(matchId)

    // A: 回复人格化
    const oralHabits = this.deriveOralHabits(dimensionValues, portraitData)
    const replyRhythm = this.deriveReplyRhythm(relationship, emotionalState, dimensionValues)
    const topicPreference = this.deriveTopicPreferences(dimensionValues, portraitData)

    // B: 关系记忆
    const keyMoments = await this.recallKeyMoments(matchId, 5)
    const unfulfilledPromises = await this.checkUnfulfilledPromises(matchId)

    // C: 时间/场景感知
    const timeContext = this.getTimeContext()
    const lifeEventContext = await this.generateLifeEvent(matchId, dimensionValues)

    // D: 对话动态（先用上一轮状态判断）
    const attachmentType = getAttachmentType(dimensionValues)
    const conversationRhythm = this.determineConversationRhythm(emotionalState, relationship, 'neutral')

    const systemPrompt = this.buildSystemPrompt(
      matchInfo.name, dimensionValues, portraitData, relationship, emotionalState,
      keyMoments, unfulfilledPromises, lifeEventContext, timeContext,
      replyRhythm, topicPreference, oralHabits, conversationRhythm,
    )

    const recentHistory = await this.getRecentHistory(matchId, 16)
    const contextMessages = recentHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...contextMessages,
      { role: 'user' as const, content: message },
    ]

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const response = await client.invoke(messages, {
        model: 'doubao-seed-2-0-lite-260215',
        temperature: 0.8,
        thinking: 'disabled',
      })

      const reply = this.cleanLLMContent(response.content)

      await this.saveMessage(matchId, 'user', message)
      await this.saveMessage(matchId, 'assistant', reply)

      const stateUpdate = await this.analyzeAndUpdateState(
        matchId, matchInfo.name, relationship, emotionalState, message, reply, dimensionValues, req,
      )

      // B: 检测并保存关键时刻
      await this.detectAndSaveKeyMoment(
        matchId, message, reply, stateUpdate.interactionStyle,
        stateUpdate.emotionalState, stateUpdate.relationship,
      )

      // E: 检查里程碑
      await this.checkMilestones(
        matchId, stateUpdate.relationship,
        relationship.safety, relationship.desire, relationship.closeness, relationship.stage,
        stateUpdate.interactionStyle, stateUpdate.emotionalState?.emotion,
      )

      // D: 更新对话节奏
      const updatedRhythm = this.determineConversationRhythm(
        stateUpdate.emotionalState, stateUpdate.relationship, stateUpdate.interactionStyle,
      )
      // 更新 wants_to_continue 到情绪状态
      try {
        const supabase = getSupabaseClient()
        await supabase.from('twin_emotional_state')
          .update({ wants_to_continue: updatedRhythm.wantsToContinue })
          .eq('match_id', matchId)
      } catch (e) { /* ignore */ }

      // D: 如果不想继续，用退出策略覆盖回复
      const finalReply = !updatedRhythm.wantsToContinue && stateUpdate.emotionalState.emotion
        ? (this.generateDisengagementReply(stateUpdate.emotionalState.emotion, attachmentType) || reply)
        : reply

      // D: 话题敏感度检测
      const topicSensitivity = this.detectTopicSensitivity(message, dimensionValues)

      const proactiveMessage = await this.checkAndGenerateProactiveMessage(
        matchId, stateUpdate.relationship, stateUpdate.emotionalState, dimensionValues, portraitData, req,
      )

      // AI 提示生成（无显著变化时返回 null）
      let hint: TwinHint | null | undefined
      if (hintsEnabled) {
        hint = this.generateHint(
          relationship, stateUpdate.relationship,
          emotionalState, stateUpdate.emotionalState,
          dimensionValues, message,
          stateUpdate.interactionStyle,
        )
        // D: 在提示中加入对话节奏信息
        if (hint && updatedRhythm.rhythmHint) {
          hint.insight = `${hint.insight}。${updatedRhythm.rhythmHint}`
        }
        // D: 在提示中加入话题敏感度信息
        if (hint && topicSensitivity) {
          hint.insight = `${hint.insight}。「${topicSensitivity}」是她的敏感话题`
        }
      }

      // E: 获取里程碑
      const milestones = await this.getMilestones(matchId)

      console.log('[TwinService] reply ok | stage:', stateUpdate.relationship.stage,
        '| safety:', stateUpdate.relationship.safety,
        '| desire:', stateUpdate.relationship.desire,
        '| closeness:', stateUpdate.relationship.closeness,
        '| tension:', stateUpdate.relationship.tension,
        '| emotion:', stateUpdate.emotionalState.emotion,
        '| wantsToContinue:', updatedRhythm.wantsToContinue)

      return {
        reply: finalReply,
        relationship: stateUpdate.relationship,
        emotionalState: stateUpdate.emotionalState,
        proactiveMessage: proactiveMessage || undefined,
        hint,
        interactionStyle: stateUpdate.interactionStyle,
        conversationRhythm: updatedRhythm,
        topicSensitivity,
        milestones: milestones.length > 0 ? milestones : undefined,
      }
    } catch (err) {
      console.error('[TwinService] LLM error:', err)
      await this.saveMessage(matchId, 'user', message)
      return { reply: '嗯...我一下不知道说什么了，等会再聊吧', relationship, emotionalState }
    }
  }

  // ==================== 历史与重置 ====================

  async getHistory(matchId: number, limit: number = 100) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('twin_chat_history')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) { console.error('[TwinService] getHistory error:', error); throw error }

    const relationship = await this.getOrCreateRelationship(matchId)
    const emotionalState = await this.getOrCreateEmotionalState(matchId)

    const { data: unsentMessages } = await client
      .from('twin_proactive_messages')
      .select('*')
      .eq('match_id', matchId)
      .eq('is_sent', false)
      .order('created_at', { ascending: true })

    let proactiveMessages: string[] = []
    if (unsentMessages && unsentMessages.length > 0) {
      proactiveMessages = unsentMessages.map(m => m.message)
      await client
        .from('twin_proactive_messages')
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .in('id', unsentMessages.map(m => m.id))
    }

    return { history: data || [], relationship, emotionalState, proactiveMessages }
  }

  async clearHistory(matchId: number) {
    const client = getSupabaseClient()
    await client.from('twin_chat_history').delete().eq('match_id', matchId)

    await client
      .from('twin_relationship')
      .update({
        safety: 30, desire: 0, closeness: 0,
        safety_trend: [], desire_trend: [],
        last_interaction_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('match_id', matchId)

    await client
      .from('twin_emotional_state')
      .update({
        emotion: 'neutral', emotion_intensity: 50,
        attitude_anchor: 'neutral', tension: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('match_id', matchId)

    await client.from('twin_proactive_messages').delete().eq('match_id', matchId)
    await client.from('twin_key_moments').delete().eq('match_id', matchId)
    await client.from('twin_milestones').delete().eq('match_id', matchId)
    await client.from('twin_life_events').delete().eq('match_id', matchId)

    // 重置 total_rounds 和 first_interaction_at
    await client
      .from('twin_relationship')
      .update({
        total_rounds: 0,
        first_interaction_at: null,
      })
      .eq('match_id', matchId)

    return { success: true }
  }

  // ==================== 手动调整关系状态 ====================

  async updateRelationshipManually(matchId: number, updates: {
    safety?: number; desire?: number; closeness?: number;
    emotion?: string; emotionIntensity?: number;
    attitudeAnchor?: string;
  }) {
    const relationship = await this.getOrCreateRelationship(matchId)
    const emotionalState = await this.getOrCreateEmotionalState(matchId)

    const newSafety = updates.safety ?? relationship.safety
    const newDesire = updates.desire ?? relationship.desire
    const attachmentParams = getAttachmentParams(
      await this.getMatchDimensions(matchId),
    )
    const maxCloseness = Math.floor(newSafety * attachmentParams.gateFactor)
    const newCloseness = Math.min(updates.closeness ?? relationship.closeness, maxCloseness)

    const newRelationship: RelationshipState = {
      safety: newSafety,
      desire: newDesire,
      closeness: newCloseness,
      stage: deriveStage(newCloseness, newSafety),
      tension: deriveTension(newDesire, newCloseness),
      attitudeAnchor: deriveAttitudeAnchor(newSafety, newDesire),
      safetyTrend: [],
      desireTrend: [],
      totalRounds: relationship.totalRounds ?? 0,
      firstInteractionAt: relationship.firstInteractionAt,
      lastInteractionAt: relationship.lastInteractionAt,
    }

    const newEmotionalState: EmotionalStateRecord = {
      emotion: updates.emotion ?? emotionalState.emotion,
      emotionIntensity: updates.emotionIntensity ?? emotionalState.emotionIntensity,
      attitudeAnchor: updates.attitudeAnchor ?? newRelationship.attitudeAnchor,
      tension: newRelationship.tension,
    }

    await this.persistRelationship(matchId, newRelationship)
    await this.persistEmotionalState(matchId, newEmotionalState)

    return { relationship: newRelationship, emotionalState: newEmotionalState }
  }
  /** 获取维度值辅助方法 */
  private getDimensionValue(dimensionValues: DimensionValue[], key: string): number | null {
    const dim = dimensionValues.find(d => d.dimension_key === key)
    if (!dim) return null
    return typeof dim.value === 'number' ? dim.value : parseInt(dim.value, 10) || null
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}
