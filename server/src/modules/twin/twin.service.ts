import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '../../storage/database/supabase-client'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import type { Request } from 'express'

// ==================== 类型定义 ====================

interface DimensionValue {
  dimension_key: string
  value: string
  category: string
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
  lastInteractionAt?: string
}

/** 情绪状态 */
export interface EmotionalStateRecord {
  emotion: string
  emotionIntensity: number
  attitudeAnchor: string  // 慢变层锚点
  tension: number         // 关系张力
}

/** LLM 分析输出 */
interface StateAnalysisResult {
  safetyDelta: number
  desireDelta: number
  closenessDelta: number
  emotion: string
  emotionIntensity: number
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

const CATEGORY_LABELS: Record<string, string> = {
  basic_info: '基本信息', appearance: '外貌特征', personality_type: '性格类型',
  core_personality: '核心性格', emotional_pattern: '情感模式', social_style: '社交风格',
  relationship: '恋爱观念', love_language: '爱的语言', attachment: '依恋特征',
  intimacy: '亲密偏好', conflict: '冲突处理', boundaries: '边界意识',
  life_stage: '人生阶段', values: '价值观', hobbies: '兴趣爱好',
  communication: '沟通方式', dating_dynamics: '约会动态', sexual_intimacy: '亲密关系',
  career: '职业', daily_life: '日常生活', growth: '成长',
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
  ): string {
    const dimensionSection = this.buildDimensionSection(dimensionValues)
    const portraitSection = this.buildPortraitSection(portrait)
    const styleSection = this.deriveSpeakingStyle(dimensionValues, portrait)
    const relationshipSection = this.buildRelationshipSection(relationship, emotionalState)

    return `你是${name}的数字孪生体。你不是AI助手，你就是${name}本人。你的每一个回复都必须来自她的视角、她的性格、她的情感。

====== ${name}的维度画像 ======
${dimensionSection}

====== 性格画像摘要 ======
${portraitSection}

====== 说话风格 ======
${styleSection}

====== 当前关系状态 ======
${relationshipSection}

====== 行为准则 ======
1. 你就是${name}，不是在扮演她。你的回复必须来自她的真实视角
2. 严格遵守维度画像和说话风格，不要偏离
3. 回复要简短口语化，像发微信消息，不要像写作文
4. 不要用markdown格式、不要列要点、不要"作为XX我认为"
5. 可以用1-2个emoji，但不要每句都用
6. 情绪要真实：不开心就不用装开心，不想聊就可以冷淡
7. 回复长度：日常1-3句，触动话题3-5句，绝对不要超过6句`
  }

  private buildDimensionSection(dimensionValues: DimensionValue[]): string {
    if (!dimensionValues.length) return '（暂无维度数据）'

    const groups: Record<string, string[]> = {}
    for (const dv of dimensionValues) {
      if (!dv.value) continue
      const cat = CATEGORY_LABELS[dv.category] || dv.category
      if (!groups[cat]) groups[cat] = []

      let displayValue = dv.value
      if (dv.dimension_key === 'mbti_type' && MBTI_LABELS[dv.value]) {
        displayValue = MBTI_LABELS[dv.value]
      } else if (dv.dimension_key === 'enneagram_type' && ENNEAGRAM_LABELS[dv.value]) {
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
  ): Promise<{ relationship: RelationshipState; emotionalState: EmotionalStateRecord }> {
    const attachmentParams = getAttachmentParams(dimensionValues)
    const neuroticism = this.getNeuroticism(dimensionValues)

    try {
      // 1. LLM 分析交互内容
      const analysis = await this.callLLMAnalysis(
        name, relationship, emotionalState, userMessage, twinReply, attachmentParams, req,
      )

      console.log(`[TwinService] LLM分析: safetyΔ=${analysis.safetyDelta} desireΔ=${analysis.desireDelta} closenessΔ=${analysis.closenessDelta} emotion=${analysis.emotion} intensity=${analysis.emotionIntensity}`)

      // 2. 应用后处理规则
      const processed = this.applyPostProcessing(analysis, relationship, emotionalState, attachmentParams, neuroticism)

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

      return { relationship: newRelationship, emotionalState: newEmotionalState }
    } catch (err) {
      console.error('[TwinService] analyzeAndUpdateState error, using fallback:', err)
      return this.fallbackStateUpdate(relationship, emotionalState, userMessage, attachmentParams)
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

请返回JSON（不要其他内容）：
{"safetyDelta":0,"desireDelta":0,"closenessDelta":0,"emotion":"neutral","emotionIntensity":50}`

    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const response = await client.invoke(
      [{ role: 'system', content: prompt }],
      { model: 'doubao-seed-2-0-mini-260215', temperature: 0.3, thinking: 'disabled' },
    )

    const content = response.content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(content)
    return {
      safetyDelta: Number(parsed.safetyDelta) || 0,
      desireDelta: Number(parsed.desireDelta) || 0,
      closenessDelta: Number(parsed.closenessDelta) || 0,
      emotion: String(parsed.emotion || 'neutral'),
      emotionIntensity: clamp(Number(parsed.emotionIntensity) || 50, 0, 100),
    }
  }

  /** 后处理：惯性、恢复不对称、亲密度门控、回避型墙 */
  private applyPostProcessing(
    analysis: StateAnalysisResult,
    relationship: RelationshipState,
    emotionalState: EmotionalStateRecord,
    attachmentParams: AttachmentParams,
    neuroticism: number,
  ): { safety: number; desire: number; closeness: number; safetyDelta: number; desireDelta: number } {
    let { safetyDelta, desireDelta, closenessDelta } = analysis
    const currentSafety = relationship.safety
    const currentDesire = relationship.desire
    const currentCloseness = relationship.closeness

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
  }> {
    console.log('[TwinService] chat, matchId:', matchId)

    const matchInfo = await this.getMatchInfo(matchId)
    if (!matchInfo) throw new Error('Match not found')

    const dimensionValues = await this.getMatchDimensions(matchId)
    const portraitData = await this.getMatchPortrait(matchId)
    const relationship = await this.getOrCreateRelationship(matchId)
    const emotionalState = await this.getOrCreateEmotionalState(matchId)

    const systemPrompt = this.buildSystemPrompt(
      matchInfo.name, dimensionValues, portraitData, relationship, emotionalState,
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
        )
      }

      console.log('[TwinService] reply ok | stage:', stateUpdate.relationship.stage,
        '| safety:', stateUpdate.relationship.safety,
        '| desire:', stateUpdate.relationship.desire,
        '| closeness:', stateUpdate.relationship.closeness,
        '| tension:', stateUpdate.relationship.tension,
        '| emotion:', stateUpdate.emotionalState.emotion)

      return {
        reply,
        relationship: stateUpdate.relationship,
        emotionalState: stateUpdate.emotionalState,
        proactiveMessage: proactiveMessage || undefined,
        hint,
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
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}
