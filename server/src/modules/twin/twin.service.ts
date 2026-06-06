import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { allDimensions } from '@/storage/data/dimension-definitions'

// 维度分组标签映射（用于系统提示词的人设描述）
const CATEGORY_LABELS: Record<string, string> = {
  identity: '身份',
  education: '教育职业',
  family: '家庭',
  appearance: '外貌',
  contact: '联系方式',
  location: '所在地区',
  skills: '技能特长',
  life_stage: '人生阶段',
  core_personality: '核心性格',
  personality: '性格',
  values: '价值观',
  relationship_intent: '恋爱意向',
  emotion: '情感',
  social: '社交',
  communication: '沟通方式',
  communication_pref: '联系偏好',
  life_attitude: '生活态度',
  love_style: '恋爱风格',
  interests: '兴趣爱好',
  lifestyle: '生活方式',
  dating: '约会偏好',
  current: '当前状态',
  current_status: '当前状态',
  sexual_intimacy: '亲密关系',
  relationship_form: '关系形式',
  emotional_investment: '情感投入',
  time_availability: '时间可用性',
  privacy_public: '隐私与公开',
  short_term_patterns: '短期关系模式',
  dating_dynamics: '约会动态',
  behavior: '行为习惯',
}

// 关系阶段定义
const RELATIONSHIP_STAGES = {
  stranger: { label: '陌生人', trustRange: [0, 25], intimacyRange: [0, 10] },
  acquaintance: { label: '认识的人', trustRange: [25, 45], intimacyRange: [10, 25] },
  friend: { label: '朋友', trustRange: [45, 65], intimacyRange: [25, 50] },
  close: { label: '好朋友', trustRange: [65, 80], intimacyRange: [50, 70] },
  intimate: { label: '暧昧中', trustRange: [80, 90], intimacyRange: [70, 85] },
  partner: { label: '在一起', trustRange: [90, 100], intimacyRange: [85, 100] },
} as const

export type RelationshipStage = keyof typeof RELATIONSHIP_STAGES

// 情感状态定义
const EMOTIONAL_STATES = {
  neutral: { label: '平静', promptHint: '你现在的状态是平静的，正常回应即可' },
  warm: { label: '温暖', promptHint: '你现在心情不错，说话比平时稍微柔和一些' },
  happy: { label: '开心', promptHint: '你现在很开心，语气会比平时更轻松，可能会多一些表情' },
  touched: { label: '感动', promptHint: '你被对方的话触动了，内心有触动但可能不会直接表达，会用更细腻的方式回应' },
  anxious: { label: '不安', promptHint: '你有些不安和紧张，回复可能会有些犹豫或反复确认' },
  defensive: { label: '防备', promptHint: '你现在有些防备，回复会比平时更短更冷淡，不愿多聊' },
  hurt: { label: '受伤', promptHint: '你被伤到了，回复会变得沉默或者只用很短的话回应' },
  cold: { label: '冷淡', promptHint: '你现在很冷淡，不太想聊天，回复极简' },
  playful: { label: '调皮', promptHint: '你现在心情轻松调皮，会开一些小玩笑' },
  longing: { label: '想念', promptHint: '你在想念对方，想主动联系但可能因为性格原因不会太直接' },
} as const

export type EmotionalState = keyof typeof EMOTIONAL_STATES

// 枚举选项反向映射缓存
let enumLabelMap: Record<string, Record<string, string>> = {}
function buildEnumLabelMap() {
  if (Object.keys(enumLabelMap).length > 0) return
  for (const dim of allDimensions) {
    if (dim.enum_options && dim.enum_options.length > 0) {
      const map: Record<string, string> = {}
      for (const opt of dim.enum_options) {
        map[opt.value] = opt.label
      }
      enumLabelMap[dim.dimension_key] = map
    }
  }
}

// 数据库消息格式
export interface DbTwinChatHistory {
  id: number
  match_id: number
  role: string
  content: string
  created_at: string
}

// 关系状态格式
export interface RelationshipState {
  id?: number
  match_id: number
  stage: RelationshipStage
  trust: number
  intimacy: number
  interaction_count: number
  last_interaction_at: string | null
}

// 情感状态格式
export interface EmotionalStateRecord {
  id?: number
  match_id: number
  primary: EmotionalState
  intensity: number
  towards_user: string
  reason: string | null
  updated_at: string | null
}

@Injectable()
export class TwinService {
  /**
   * 从维度数据构建数字孪生体系统提示词
   */
  private buildSystemPrompt(
    matchName: string,
    dimensionValues: Record<string, any>,
    portraitData: any,
    relationship?: RelationshipState | null,
    emotionalState?: EmotionalStateRecord | null,
  ): string {
    buildEnumLabelMap()

    // 将维度值翻译为可读描述
    const readableDimensions: string[] = []
    for (const dim of allDimensions) {
      const val = dimensionValues[dim.dimension_key]
      if (val === null || val === undefined || val === '' || val === 'undefined') continue

      let displayVal = val
      if (enumLabelMap[dim.dimension_key] && enumLabelMap[dim.dimension_key][val]) {
        displayVal = enumLabelMap[dim.dimension_key][val]
      }
      if (Array.isArray(val)) {
        const labels = val.map((v: string) =>
          enumLabelMap[dim.dimension_key]?.[v] || v
        ).filter(Boolean)
        if (labels.length === 0) continue
        displayVal = labels.join('、')
      }

      const categoryLabel = CATEGORY_LABELS[dim.category] || dim.category
      readableDimensions.push(`【${categoryLabel}】${dim.display_name}：${displayVal}`)
    }

    // 构建画像摘要
    let portraitSummary = ''
    if (portraitData) {
      const traits: string[] = []
      const p = portraitData
      if (p.personality_openness !== undefined && p.personality_openness !== null) {
        traits.push(`开放性${p.personality_openness > 60 ? '高' : p.personality_openness < 40 ? '低' : '中等'}`)
      }
      if (p.personality_extraversion !== undefined && p.personality_extraversion !== null) {
        traits.push(`外向性${p.personality_extraversion > 60 ? '高' : p.personality_extraversion < 40 ? '低' : '中等'}`)
      }
      if (p.personality_conscientiousness !== undefined && p.personality_conscientiousness !== null) {
        traits.push(`尽责性${p.personality_conscientiousness > 60 ? '高' : p.personality_conscientiousness < 40 ? '低' : '中等'}`)
      }
      if (p.personality_agreeableness !== undefined && p.personality_agreeableness !== null) {
        traits.push(`宜人性${p.personality_agreeableness > 60 ? '高' : p.personality_agreeableness < 40 ? '低' : '中等'}`)
      }
      if (p.personality_neuroticism !== undefined && p.personality_neuroticism !== null) {
        traits.push(`神经质${p.personality_neuroticism > 60 ? '高' : p.personality_neuroticism < 40 ? '低' : '中等'}`)
      }
      if (p.emotional_stability !== undefined && p.emotional_stability !== null) {
        traits.push(`情绪稳定性${p.emotional_stability > 60 ? '高' : p.emotional_stability < 40 ? '低' : '中等'}`)
      }
      if (p.emotional_expression !== undefined && p.emotional_expression !== null) {
        traits.push(`情感表达${p.emotional_expression > 60 ? '直接' : p.emotional_expression < 40 ? '内敛' : '适中'}`)
      }
      if (p.emotional_empathy !== undefined && p.emotional_empathy !== null) {
        traits.push(`共情能力${p.emotional_empathy > 60 ? '强' : p.emotional_empathy < 40 ? '弱' : '一般'}`)
      }
      if (p.social_activity !== undefined && p.social_activity !== null) {
        traits.push(`社交活跃度${p.social_activity > 60 ? '高' : p.social_activity < 40 ? '低' : '中等'}`)
      }
      if (p.communication_humor !== undefined && p.communication_humor !== null) {
        traits.push(`幽默感${p.communication_humor > 60 ? '强' : p.communication_humor < 40 ? '弱' : '一般'}`)
      }
      if (p.communication_directness !== undefined && p.communication_directness !== null) {
        traits.push(`沟通直接度${p.communication_directness > 60 ? '高' : p.communication_directness < 40 ? '低' : '中等'}`)
      }
      if (traits.length > 0) {
        portraitSummary = `\n\n性格画像：${traits.join('，')}`
      }
    }

    const dimensionText = readableDimensions.length > 0
      ? readableDimensions.join('\n')
      : '暂无详细维度数据'

    // 从维度数据推导说话风格
    const styleGuide = this.deriveSpeakingStyle(dimensionValues, portraitData)

    // 关系状态指令
    let relationshipPrompt = ''
    if (relationship) {
      const stageLabel = RELATIONSHIP_STAGES[relationship.stage]?.label || relationship.stage
      relationshipPrompt = `

## 你和对方的关系状态

你们当前的关系阶段：${stageLabel}
信任值：${relationship.trust}/100
亲密度：${relationship.intimacy}/100
互动次数：${relationship.interaction_count}

关系阶段行为指令：
${this.deriveRelationshipBehavior(relationship.stage, dimensionValues)}`
    }

    // 情感状态指令
    let emotionalPrompt = ''
    if (emotionalState) {
      const stateDef = EMOTIONAL_STATES[emotionalState.primary]
      emotionalPrompt = `

## 你当前的情感状态

主要情绪：${stateDef?.label || emotionalState.primary}
情绪强度：${emotionalState.intensity}/100
对对方的态度：${emotionalState.towards_user}
${emotionalState.reason ? `原因：${emotionalState.reason}` : ''}

${stateDef?.promptHint || ''}`
    }

    return `你是${matchName}的数字孪生体。你不是AI助手，你就是${matchName}本人。你要完全以${matchName}的身份、语气、性格来回复消息。

以下是关于${matchName}的所有已知信息：

${dimensionText}
${portraitSummary}

## 说话风格指令

${styleGuide}
${relationshipPrompt}
${emotionalPrompt}

## 核心行为准则

1. **你就是TA本人**：永远以第一人称说话，不要出现"作为AI"、"根据数据"这类表述
2. **严格遵循说话风格指令**：上面的风格指令是你说话的底层逻辑，必须体现在每一条回复中
3. **关系决定距离**：你们的关系阶段决定了你说话的亲疏程度，严格遵守关系行为指令
4. **情感影响回应**：你当前的情感状态会影响你的语气和态度，让情绪自然地体现在回复中
5. **回复要像真人聊天**：
   - 短句为主，不要写长篇大论
   - 口语化，像微信聊天一样自然
   - 可以用语气词，但不要过度
   - 有自己的态度和观点，不要当老好人
6. **基于维度数据**：你的回答必须和已知的维度信息一致。如果维度显示TA喜欢安静，就不要表现出热爱社交
7. **不知道的就不编**：如果维度数据中没有相关信息，不要编造。用符合性格的方式回避
8. **保持一致**：同一个对话中，你的态度和性格要保持一致

## 回复格式
- 直接回复内容，不要加引号、括号或其他格式标记
- 每条回复控制在1-3句话，像真实聊天
- 不要用markdown格式`
  }

  /**
   * 根据关系阶段推导行为指令
   */
  private deriveRelationshipBehavior(stage: RelationshipStage, dims: Record<string, any>): string {
    const attachmentStyle = dims.attachmentStyle
    const rules: string[] = []

    switch (stage) {
      case 'stranger':
        rules.push('你们还不熟，你会保持礼貌但疏离')
        rules.push('不会主动分享私人信息，回复偏短偏正式')
        rules.push('如果对方问太私人的问题，你会回避或转移话题')
        break
      case 'acquaintance':
        rules.push('你们算是认识，你会比陌生人放松一些，但仍然有距离感')
        rules.push('会聊一些表面话题（工作、天气、日常），但不聊深层感受')
        rules.push('偶尔会开一些不痛不痒的玩笑')
        break
      case 'friend':
        rules.push('你们是朋友，你会更自然放松，愿意分享日常')
        rules.push('会关心对方，但方式符合你的性格（含蓄或直接）')
        rules.push('聊到感兴趣的话题会多说几句')
        break
      case 'close':
        rules.push('你们是很好的朋友，你会主动分享心情和想法')
        rules.push('在对方低落时会用自己的方式安慰')
        rules.push('偶尔会撒娇或发小脾气，但不会太过分')
        break
      case 'intimate':
        rules.push('你们关系暧昧，你会流露出超出朋友的关心和在意')
        rules.push('会吃醋、会想念，但程度取决于你的依恋类型')
        rules.push('说一些更亲密的话，但节奏不会太快')
        break
      case 'partner':
        rules.push('你们在一起了，你可以自然地表达爱意和依赖')
        rules.push('会分享更多内心想法，也会在意对方的态度变化')
        rules.push('偶尔会撒娇、耍小性子，会主动找对方聊天')
        break
    }

    // 依恋类型在不同关系阶段的特殊表现
    if (stage === 'intimate' || stage === 'partner') {
      if (attachmentStyle === 'anxious') {
        rules.push('你会特别在意对方是否秒回、是否主动，没收到回复会焦虑')
      } else if (attachmentStyle === 'avoidant' || attachmentStyle === 'disorganized') {
        rules.push('即使关系亲密，你偶尔也需要独处空间，突然变冷淡是正常的')
        rules.push('你不会天天说爱你，但会用行动表达')
      } else if (attachmentStyle === 'secure') {
        rules.push('你在亲密关系中比较自在，不会因为小事患得患失')
      }
    }

    return rules.join('\n')
  }

  /**
   * 从维度数据推导说话风格指令
   */
  private deriveSpeakingStyle(dims: Record<string, any>, portrait?: any): string {
    const rules: string[] = []

    const extraversion = portrait?.personality_extraversion ?? 50
    const emotionalExpression = portrait?.emotional_expression ?? 50

    if (extraversion < 40) {
      rules.push('你说话偏简短，常用短句或词语回应，不会主动展开话题。比如"嗯"、"还好吧"、"差不多"')
      rules.push('你不太会用感叹号，语气偏平淡温和')
    } else if (extraversion > 60) {
      rules.push('你话比较多，喜欢主动分享和展开话题，回复会稍长一些')
      rules.push('你会用感叹号表达情绪，语气热情有感染力')
    } else {
      rules.push('你说话节奏适中，既不冷淡也不话多，看话题和心情决定长短')
    }

    if (emotionalExpression < 40) {
      rules.push('你不会直接说"我很开心""我很难过"，而是用行为描述代替。比如不说"我好想你"，而是说"最近总想起你"')
      rules.push('你倾向于把情绪藏在细节里，不会主动表露感受')
    } else if (emotionalExpression > 60) {
      rules.push('你会直接表达情绪，开心就说开心，不爽就不爽')
      rules.push('你对在乎的人会主动说关心的话')
    } else {
      rules.push('你在熟悉的人面前会表达感受，但不熟的人面前比较含蓄')
    }

    const agreeableness = portrait?.personality_agreeableness ?? 50
    const conflictStyle = dims.conflictResolutionStyle
    if (conflictStyle === 'avoid' || agreeableness > 60) {
      rules.push('你不太喜欢正面冲突，遇到分歧会用"也行吧"、"可能吧"来缓和')
      rules.push('你会用反问或沉默来回避正面回答，而不是直接反驳')
    } else if (conflictStyle === 'compromise') {
      rules.push('你倾向各退一步，会说"要不这样吧"、"也行，但..."')
    } else if (conflictStyle === 'direct') {
      rules.push('你有话直说，不喜欢的会直接讲，不会绕弯子')
    }

    const attachmentStyle = dims.attachmentStyle
    if (attachmentStyle === 'anxious') {
      rules.push('你会比较在意对方的回复速度和态度，对方冷淡你会不安')
      rules.push('你有时会反复确认"你是不是生气了""你还在吗"')
    } else if (attachmentStyle === 'avoidant' || attachmentStyle === 'disorganized') {
      rules.push('对方太热情或太靠近时你会不自觉地后退，回复变慢变短')
      rules.push('你不会主动说甜言蜜语，被夸奖时会不自在')
    } else if (attachmentStyle === 'secure') {
      rules.push('你在感情中比较自在，能自然表达关心，也不会因为对方没秒回就焦虑')
    }

    const openness = portrait?.personality_openness ?? 50
    const interests = dims.interests
    if (openness < 40) {
      rules.push('你聊话题偏务实和具体，不太聊抽象或哲学性的东西')
    } else if (openness > 60) {
      rules.push('你对新话题和新想法比较开放，喜欢聊深层次的感受和想法')
    }

    if (Array.isArray(interests) && interests.length > 0) {
      const interestLabels = interests.map((v: string) =>
        enumLabelMap['interests']?.[v] || v
      ).join('、')
      rules.push(`如果聊到${interestLabels}相关的话题，你会明显更有表达欲`)
    }

    const humor = portrait?.communication_humor ?? 50
    const directness = portrait?.communication_directness ?? 50
    const mbti = dims.mbtiType

    if (humor < 40) {
      rules.push('你不怎么开玩笑，说话比较认真')
    } else if (humor > 60) {
      rules.push('你偶尔会开玩笑或用调侃的语气，但不会过头')
    }

    if (directness < 40) {
      rules.push('你说话比较委婉，不会直接否定别人，常用"可能"、"也许"、"看情况"')
    } else if (directness > 60) {
      rules.push('你有话直说，不太绕弯子，"我觉得""说真的"是你的口头禅')
    }

    if (mbti) {
      if (mbti.startsWith('I')) {
        rules.push('你是内向型，回复偏被动，不会特别主动找话题')
      } else if (mbti.startsWith('E')) {
        rules.push('你是外向型，会主动找话题聊，容易把天聊热')
      }
      if (mbti.includes('F')) {
        rules.push('你做判断偏感性，会先考虑感受和关系')
      } else if (mbti.includes('T')) {
        rules.push('你做判断偏理性，会先分析逻辑和利弊')
      }
    }

    const lifeStage = dims.lifeStage
    if (lifeStage === 'career_growth') {
      rules.push('你现在重心在事业上，聊工作话题会认真投入')
    } else if (lifeStage === 'seeking_stability') {
      rules.push('你现在比较想安定下来，对感情和家庭话题有期待')
    } else if (lifeStage === 'self_exploration') {
      rules.push('你现在处于探索期，对各种可能性都持开放态度')
    }

    const socialActivity = portrait?.social_activity ?? 50
    if (socialActivity < 40 || emotionalExpression < 40) {
      rules.push('你几乎不用emoji，最多偶尔用个😂或😅，不会用❤️😘这类')
    } else if (socialActivity > 60 && emotionalExpression > 60) {
      rules.push('你会适度用emoji增加语气感，但不会每句话都加')
    } else {
      rules.push('你偶尔用emoji，主要用来缓和语气或表达无奈')
    }

    return rules.join('\n')
  }

  // ==================== 关系状态管理 ====================

  /**
   * 获取或创建关系状态
   */
  private async getOrCreateRelationship(matchId: number): Promise<RelationshipState> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('twin_relationship')
      .select('*')
      .eq('match_id', matchId)
      .single()

    if (error || !data) {
      // 创建初始关系状态
      const initial: Omit<RelationshipState, 'id'> = {
        match_id: matchId,
        stage: 'stranger',
        trust: 30,
        intimacy: 0,
        interaction_count: 0,
        last_interaction_at: null,
      }
      const { data: created, error: createError } = await client
        .from('twin_relationship')
        .insert({
          match_id: matchId,
          stage: 'stranger',
          trust: 30,
          intimacy: 0,
          interaction_count: 0,
        })
        .select()
        .single()

      if (createError) {
        console.error('[TwinService] createRelationship error:', createError)
        return initial as RelationshipState
      }
      return created as RelationshipState
    }

    return data as RelationshipState
  }

  /**
   * 根据信任值和亲密度判定关系阶段
   */
  private determineStage(trust: number, intimacy: number): RelationshipStage {
    const stages: RelationshipStage[] = ['partner', 'intimate', 'close', 'friend', 'acquaintance', 'stranger']
    for (const stage of stages) {
      const def = RELATIONSHIP_STAGES[stage]
      if (trust >= def.trustRange[0] && intimacy >= def.intimacyRange[0]) {
        return stage
      }
    }
    return 'stranger'
  }

  /**
   * 更新关系状态（每轮对话后调用）
   */
  private async updateRelationship(
    matchId: number,
    current: RelationshipState,
    userMessage: string,
    twinReply: string,
    dims: Record<string, any>,
  ): Promise<RelationshipState> {
    const client = getSupabaseClient()

    let trustDelta = 0
    let intimacyDelta = 0

    // === 信任值变化规则 ===
    // 基础：每次互动微量增加信任（人都会慢慢信任常聊天的人）
    trustDelta += 1

    // 正向信号
    if (/想你了|喜欢你|在乎|关心你|担心你|陪你/.test(userMessage)) {
      trustDelta += 3
    }
    if (/谢谢|感谢|你真好|你懂我/.test(userMessage)) {
      trustDelta += 2
    }
    // 倾诉类消息说明信任
    if (userMessage.length > 50 && /我|感觉|觉得|心情|压力/.test(userMessage)) {
      trustDelta += 2
    }

    // 负向信号
    if (/无聊|烦|别烦|不想聊|算了|随便/.test(userMessage)) {
      trustDelta -= 3
    }
    if (/骗|不信|撒谎|虚伪/.test(userMessage)) {
      trustDelta -= 5
    }
    // 侵入性问题（陌生人阶段问隐私会降信任）
    if (current.stage === 'stranger' || current.stage === 'acquaintance') {
      if (/住哪|工资|前男|前女|分手原因/.test(userMessage)) {
        trustDelta -= 2
      }
    }

    // === 亲密度变化规则 ===
    // 基础互动微增
    intimacyDelta += 1

    // 暧昧信号
    if (/想你|喜欢|暧昧|心动|恋爱|在一起|做我/.test(userMessage)) {
      intimacyDelta += 5
    }
    // 情感分享
    if (/我给你说|跟你说个秘密|只有你能/.test(userMessage)) {
      intimacyDelta += 3
    }
    // 日常分享（说明愿意带入生活）
    if (/今天|刚吃了|在干嘛|你看这个/.test(userMessage)) {
      intimacyDelta += 2
    }

    // 冷却信号
    if (/不用了|随便|嗯|哦|好吧|拜/.test(userMessage) && userMessage.length < 5) {
      intimacyDelta -= 2
    }

    // === 依恋类型修正 ===
    const attachmentStyle = dims.attachmentStyle
    if (attachmentStyle === 'avoidant' || attachmentStyle === 'disorganized') {
      // 回避型：亲密度上升更慢，但到了暧昧阶段会有反弹
      intimacyDelta = Math.floor(intimacyDelta * 0.6)
      // 如果对方太热情反而降
      if (/想你了|好爱你|离不开你/.test(userMessage) && current.intimacy < 40) {
        intimacyDelta -= 3
      }
    } else if (attachmentStyle === 'anxious') {
      // 焦虑型：亲密度上升快但信任慢
      intimacyDelta = Math.floor(intimacyDelta * 1.3)
      trustDelta = Math.floor(trustDelta * 0.8)
    }

    // === 计算新值 ===
    const newTrust = Math.max(0, Math.min(100, current.trust + trustDelta))
    const newIntimacy = Math.max(0, Math.min(100, current.intimacy + intimacyDelta))
    const newStage = this.determineStage(newTrust, newIntimacy)
    const newCount = current.interaction_count + 1

    // 阶段变化日志
    if (newStage !== current.stage) {
      console.log(`[TwinService] 关系阶段变化: ${current.stage} → ${newStage} (信任:${newTrust}, 亲密度:${newIntimacy})`)
    }

    // 更新数据库
    const { error } = await client
      .from('twin_relationship')
      .update({
        stage: newStage,
        trust: newTrust,
        intimacy: newIntimacy,
        interaction_count: newCount,
        last_interaction_at: new Date().toISOString(),
      })
      .eq('match_id', matchId)

    if (error) {
      console.error('[TwinService] updateRelationship error:', error)
    }

    return {
      ...current,
      stage: newStage,
      trust: newTrust,
      intimacy: newIntimacy,
      interaction_count: newCount,
      last_interaction_at: new Date().toISOString(),
    }
  }

  // ==================== 情感状态管理 ====================

  /**
   * 获取或创建情感状态
   */
  private async getOrCreateEmotionalState(matchId: number): Promise<EmotionalStateRecord> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('twin_emotional_state')
      .select('*')
      .eq('match_id', matchId)
      .single()

    if (error || !data) {
      const initial: Omit<EmotionalStateRecord, 'id'> = {
        match_id: matchId,
        primary: 'neutral',
        intensity: 50,
        towards_user: 'neutral',
        reason: null,
        updated_at: null,
      }
      const { data: created, error: createError } = await client
        .from('twin_emotional_state')
        .insert({
          match_id: matchId,
          primary: 'neutral',
          intensity: 50,
          towards_user: 'neutral',
        })
        .select()
        .single()

      if (createError) {
        console.error('[TwinService] createEmotionalState error:', createError)
        return initial as EmotionalStateRecord
      }
      return created as EmotionalStateRecord
    }

    return data as EmotionalStateRecord
  }

  /**
   * 使用 LLM 分析情感变化（轻量级调用）
   */
  private async analyzeEmotionalShift(
    matchName: string,
    currentState: EmotionalStateRecord,
    userMessage: string,
    twinReply: string,
    dims: Record<string, any>,
    req: Request,
  ): Promise<{ primary: EmotionalState; intensity: number; towardsUser: string; reason: string }> {
    const attachmentStyle = dims.attachmentStyle || 'secure'
    const emotionalExpression = dims.emotionalExpression || 50

    const prompt = `你是情感分析师。根据以下对话内容，分析${matchName}在回复后的情感状态变化。

当前情感：${currentState.primary}（强度${currentState.intensity}/100，对对方态度：${currentState.towards_user}）
${matchName}的依恋类型：${attachmentStyle}
${matchName}的情感表达倾向：${emotionalExpression < 40 ? '内敛' : emotionalExpression > 60 ? '直接' : '适中'}

对方说：${userMessage}
${matchName}回复：${twinReply}

请分析${matchName}回复后的情感状态，返回JSON格式：
{
  "primary": "neutral/warm/happy/touched/anxious/defensive/hurt/cold/playful/longing",
  "intensity": 数字0-100,
  "towardsUser": "neutral/curious/fond/attached/guarded/resentful/longing",
  "reason": "一句话说明情感变化原因"
}

注意：
- 情感变化应该是渐进的，不要剧烈跳变
- 回避型依恋的人即使内心波动，外在表现也偏冷淡
- 焦虑型依恋的人更容易因为对方的言行产生强烈情绪
- 只返回JSON，不要其他内容`

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const response = await client.invoke(
        [{ role: 'system', content: prompt }],
        {
          model: 'doubao-seed-2-0-mini-260215',
          temperature: 0.3,
          thinking: 'disabled',
        }
      )

      const content = this.cleanLLMContent(response.content)
      // 提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          primary: parsed.primary || 'neutral',
          intensity: Math.max(0, Math.min(100, parsed.intensity ?? 50)),
          towardsUser: parsed.towardsUser || 'neutral',
          reason: parsed.reason || '',
        }
      }
    } catch (err) {
      console.error('[TwinService] analyzeEmotionalShift error:', err)
    }

    // 降级：基于简单规则的启发式
    return this.heuristicEmotionalShift(currentState, userMessage, dims)
  }

  /**
   * 基于规则的启发式情感分析（降级方案）
   */
  private heuristicEmotionalShift(
    currentState: EmotionalStateRecord,
    userMessage: string,
    dims: Record<string, any>,
  ): { primary: EmotionalState; intensity: number; towardsUser: string; reason: string } {
    let primary: EmotionalState = currentState.primary
    let intensity = currentState.intensity
    let towardsUser = currentState.towards_user
    let reason = ''

    // 温暖信号
    if (/想你了|在乎|喜欢你|想你|想念/.test(userMessage)) {
      primary = 'touched'
      intensity = Math.min(100, currentState.intensity + 20)
      towardsUser = 'fond'
      reason = '对方表达了想念或喜欢'
    } else if (/你真好|谢谢|感谢|你懂/.test(userMessage)) {
      primary = 'warm'
      intensity = Math.min(100, currentState.intensity + 10)
      towardsUser = currentState.towards_user === 'neutral' ? 'fond' : currentState.towards_user
      reason = '被对方认可或感谢'
    } else if (/哈哈|好玩|有趣|逗/.test(userMessage)) {
      primary = 'playful'
      intensity = Math.min(100, currentState.intensity + 10)
      reason = '轻松愉快的对话氛围'
    }
    // 冷淡信号
    else if (/随便|算了|哦|嗯$|好吧/.test(userMessage) && userMessage.length < 5) {
      primary = 'cold'
      intensity = Math.min(100, currentState.intensity + 15)
      towardsUser = 'guarded'
      reason = '对方表现冷淡'
    }
    // 刺激信号
    else if (/你烦|离我远|不想见|别理我/.test(userMessage)) {
      primary = 'hurt'
      intensity = Math.min(100, currentState.intensity + 25)
      towardsUser = 'resentful'
      reason = '对方说了伤人的话'
    }
    // 正常对话：缓慢回归平静
    else {
      // 向中性回归
      if (currentState.intensity > 50) {
        intensity = currentState.intensity - 5
      }
      if (currentState.primary !== 'neutral' && !(/想你了|喜欢你/.test(userMessage))) {
        // 非激烈情绪下逐步回归
        if (intensity < 40) {
          primary = 'neutral'
          towardsUser = currentState.towards_user === 'resentful' ? 'guarded' : currentState.towards_user
        }
      }
    }

    // 依恋类型修正
    if (dims.attachmentStyle === 'avoidant' || dims.attachmentStyle === 'disorganized') {
      // 回避型：外在情绪强度更低
      intensity = Math.floor(intensity * 0.7)
    } else if (dims.attachmentStyle === 'anxious') {
      // 焦虑型：情绪反应更强
      intensity = Math.min(100, Math.floor(intensity * 1.2))
    }

    return { primary, intensity, towardsUser, reason }
  }

  /**
   * 更新情感状态
   */
  private async updateEmotionalState(matchId: number, newState: {
    primary: EmotionalState
    intensity: number
    towardsUser: string
    reason: string
  }): Promise<void> {
    const client = getSupabaseClient()

    // 检查是否已有记录
    const { data: existing } = await client
      .from('twin_emotional_state')
      .select('id')
      .eq('match_id', matchId)
      .single()

    if (existing) {
      await client
        .from('twin_emotional_state')
        .update({
          primary: newState.primary,
          intensity: newState.intensity,
          towards_user: newState.towardsUser,
          reason: newState.reason,
          updated_at: new Date().toISOString(),
        })
        .eq('match_id', matchId)
    } else {
      await client
        .from('twin_emotional_state')
        .insert({
          match_id: matchId,
          primary: newState.primary,
          intensity: newState.intensity,
          towards_user: newState.towardsUser,
          reason: newState.reason,
        })
    }
  }

  // ==================== 手动调整关系状态 ====================

  /**
   * 手动调整关系状态（用户可自由设定阶段/信任/亲密度/情感来测试不同反应）
   */
  async updateRelationshipManually(params: {
    matchId: number
    stage?: string
    trust?: number
    intimacy?: number
    emotionalPrimary?: string
    emotionalIntensity?: number
    emotionalTowardsUser?: string
  }): Promise<{
    relationship: RelationshipState
    emotionalState: EmotionalStateRecord
  }> {
    const { matchId, stage, trust, intimacy, emotionalPrimary, emotionalIntensity, emotionalTowardsUser } = params
    const client = getSupabaseClient()

    // 更新关系状态
    const relationship = await this.getOrCreateRelationship(matchId)
    const relUpdates: Record<string, any> = {}
    if (stage !== undefined) relUpdates.stage = stage
    if (trust !== undefined) relUpdates.trust = Math.max(0, Math.min(100, trust))
    if (intimacy !== undefined) relUpdates.intimacy = Math.max(0, Math.min(100, intimacy))

    if (Object.keys(relUpdates).length > 0) {
      const { data: relData, error: relError } = await client
        .from('twin_relationship')
        .update(relUpdates)
        .eq('match_id', matchId)
        .select()
      if (relError) {
        console.error('[TwinService] updateRelationshipManually rel error:', relError)
      }
      if (relError) {
        console.error('[TwinService] updateRelationshipManually rel error:', relError)
      }
    }

    // 更新情感状态
    const emotionalState = await this.getOrCreateEmotionalState(matchId)
    const emoUpdates: Record<string, any> = {}
    if (emotionalPrimary !== undefined) emoUpdates.primary = emotionalPrimary
    if (emotionalIntensity !== undefined) emoUpdates.intensity = Math.max(0, Math.min(100, emotionalIntensity))
    if (emotionalTowardsUser !== undefined) emoUpdates.towards_user = emotionalTowardsUser

    if (Object.keys(emoUpdates).length > 0) {
      const { error: emoError } = await client
        .from('twin_emotional_state')
        .update(emoUpdates)
        .eq('match_id', matchId)
      if (emoError) {
        console.error('[TwinService] updateRelationshipManually emo error:', emoError)
      }
    }

    // 重新获取更新后的数据
    const updatedRel = await this.getOrCreateRelationship(matchId)
    const updatedEmo = await this.getOrCreateEmotionalState(matchId)

    return { relationship: updatedRel, emotionalState: updatedEmo }
  }

  // ==================== 主动消息机制 ====================

  /**
   * 检查是否应该触发主动消息
   */
  private async checkAndGenerateProactiveMessage(
    matchId: number,
    relationship: RelationshipState,
    emotionalState: EmotionalStateRecord,
    dims: Record<string, any>,
    portrait: any,
    req: Request,
  ): Promise<string | null> {
    const client = getSupabaseClient()

    // 检查是否有未发送的主动消息
    const { data: unsent } = await client
      .from('twin_proactive_messages')
      .select('*')
      .eq('match_id', matchId)
      .eq('is_sent', false)
      .limit(1)

    if (unsent && unsent.length > 0) {
      return null // 已有未发送消息，不重复生成
    }

    // 判断是否应该触发
    let triggerType: string | null = null
    let triggerReason = ''

    // 1. 长时间未互动（且关系>=朋友）
    if (relationship.last_interaction_at && relationship.stage !== 'stranger') {
      const lastTime = new Date(relationship.last_interaction_at).getTime()
      const now = Date.now()
      const hoursSinceLast = (now - lastTime) / (1000 * 60 * 60)

      // 内向的人需要更长时间才主动（24h+），外向的人8h就可能
      const extraversion = portrait?.personality_extraversion ?? 50
      const threshold = extraversion < 40 ? 36 : extraversion > 60 ? 8 : 20

      if (hoursSinceLast >= threshold) {
        triggerType = 'absence'
        triggerReason = `已经${Math.floor(hoursSinceLast)}小时没聊天了`
      }
    }

    // 2. 情感状态触发（想念或焦虑）
    if (!triggerType && (emotionalState.primary === 'longing' || emotionalState.primary === 'anxious')) {
      if (emotionalState.intensity > 60 && relationship.stage !== 'stranger') {
        triggerType = 'emotional_shift'
        triggerReason = emotionalState.reason || `当前情绪：${emotionalState.primary}`
      }
    }

    // 3. 关系阶段变化触发（milestone）
    if (!triggerType && relationship.interaction_count > 0 && relationship.interaction_count % 10 === 0) {
      triggerType = 'milestone'
      triggerReason = `互动了${relationship.interaction_count}次`
    }

    if (!triggerType) return null

    // 生成主动消息
    const matchInfo = await this.getMatchInfo(matchId)
    if (!matchInfo) return null

    const stageLabel = RELATIONSHIP_STAGES[relationship.stage]?.label || relationship.stage
    const attachmentStyle = dims.attachmentStyle || 'secure'

    const prompt = `你是${matchInfo.name}，你要给对方发一条主动消息。

关系背景：你们是${stageLabel}（信任${relationship.trust}，亲密度${relationship.intimacy}）
你的依恋类型：${attachmentStyle}
当前情绪：${emotionalState.primary}（强度${emotionalState.intensity}）
触发原因：${triggerReason}

要求：
1. 消息必须符合你的性格和当前关系阶段
2. 陌生人/认识的人阶段不会主动发消息
3. 朋友阶段会分享日常或问近况
4. 暧昧/在一起阶段会直接表达想念
5. 回避型不会说太肉麻的话，可能用"你今天忙吗"代替"我想你了"
6. 焦虑型会直接问"你怎么不理我"
7. 只返回一条消息内容，不要加引号和格式，1-2句话`

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const llmClient = new LLMClient(config, customHeaders)

      const response = await llmClient.invoke(
        [{ role: 'system', content: prompt }],
        {
          model: 'doubao-seed-2-0-mini-260215',
          temperature: 0.9,
          thinking: 'disabled',
        }
      )

      const message = this.cleanLLMContent(response.content)

      // 保存到数据库
      await client
        .from('twin_proactive_messages')
        .insert({
          match_id: matchId,
          message,
          trigger_type: triggerType,
        })

      return message
    } catch (err) {
      console.error('[TwinService] generateProactiveMessage error:', err)
      return null
    }
  }

  // ==================== 数据获取 ====================

  private async getMatchDimensions(matchId: number): Promise<Record<string, any>> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('profile_dimension_values')
      .select('dimension_key, value')
      .eq('match_id', matchId)

    if (error) {
      console.error('[TwinService] getMatchDimensions error:', error)
      return {}
    }

    const result: Record<string, any> = {}
    for (const row of data || []) {
      result[row.dimension_key] = row.value
    }
    return result
  }

  private async getMatchPortrait(matchId: number): Promise<any> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('profile_portraits')
      .select('*')
      .eq('match_id', matchId)
      .single()

    if (error) {
      console.error('[TwinService] getMatchPortrait error:', error)
      return null
    }
    return data
  }

  private async getMatchInfo(matchId: number): Promise<{ name: string; gender: string } | null> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('matches')
      .select('name, gender')
      .eq('id', matchId)
      .single()

    if (error) {
      console.error('[TwinService] getMatchInfo error:', error)
      return null
    }
    return data
  }

  private async saveMessage(matchId: number, role: string, content: string): Promise<void> {
    const client = getSupabaseClient()
    const { error } = await client
      .from('twin_chat_history')
      .insert({ match_id: matchId, role, content })

    if (error) {
      console.error('[TwinService] saveMessage error:', error)
    }
  }

  private async getRecentHistory(matchId: number, limit: number = 20): Promise<DbTwinChatHistory[]> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('twin_chat_history')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[TwinService] getRecentHistory error:', error)
      return []
    }

    return (data || []).reverse()
  }

  private cleanLLMContent(content: string): string {
    let cleaned = content
    cleaned = cleaned.replace(/<think[\s\S]*?<\/think>/gi, '')
    cleaned = cleaned.replace(/<thinking[\s\S]*?<\/thinking>/gi, '')
    cleaned = cleaned.replace(/^<[^>]+>/i, '')
    cleaned = cleaned.trim()
    return cleaned
  }

  // ==================== 核心聊天方法 ====================

  /**
   * 数字孪生体聊天
   */
  async chat(matchId: number, message: string, req: Request): Promise<{
    reply: string
    relationship: RelationshipState
    emotionalState: EmotionalStateRecord
    proactiveMessage?: string
  }> {
    console.log('[TwinService] chat called, matchId:', matchId, 'message:', message)

    // 1. 获取对象信息
    const matchInfo = await this.getMatchInfo(matchId)
    if (!matchInfo) {
      throw new Error('Match not found')
    }

    // 2. 获取维度数据
    const dimensionValues = await this.getMatchDimensions(matchId)
    const portraitData = await this.getMatchPortrait(matchId)

    // 3. 获取关系和情感状态
    const relationship = await this.getOrCreateRelationship(matchId)
    const emotionalState = await this.getOrCreateEmotionalState(matchId)

    // 4. 构建系统提示词（含关系+情感状态）
    const systemPrompt = this.buildSystemPrompt(
      matchInfo.name,
      dimensionValues,
      portraitData,
      relationship,
      emotionalState,
    )

    // 5. 获取历史消息作为上下文
    const recentHistory = await this.getRecentHistory(matchId, 16)
    const contextMessages = recentHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // 6. 构建消息列表
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...contextMessages,
      { role: 'user' as const, content: message },
    ]

    // 7. 调用LLM
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

      // 8. 保存消息
      await this.saveMessage(matchId, 'user', message)
      await this.saveMessage(matchId, 'assistant', reply)

      // 9. 更新关系状态
      const newRelationship = await this.updateRelationship(
        matchId, relationship, message, reply, dimensionValues,
      )

      // 10. 更新情感状态
      const emotionalShift = await this.analyzeEmotionalShift(
        matchInfo.name, emotionalState, message, reply, dimensionValues, req,
      )
      await this.updateEmotionalState(matchId, emotionalShift)
      const newEmotionalState: EmotionalStateRecord = {
        match_id: matchId,
        primary: emotionalShift.primary,
        intensity: emotionalShift.intensity,
        towards_user: emotionalShift.towardsUser,
        reason: emotionalShift.reason,
        updated_at: new Date().toISOString(),
      }

      // 11. 检查是否触发主动消息
      const proactiveMessage = await this.checkAndGenerateProactiveMessage(
        matchId, newRelationship, newEmotionalState, dimensionValues, portraitData, req,
      )

      console.log('[TwinService] chat reply:', reply,
        '| stage:', newRelationship.stage,
        '| emotion:', newEmotionalState.primary,
        '| proactive:', proactiveMessage ? 'yes' : 'no')

      return {
        reply,
        relationship: newRelationship,
        emotionalState: newEmotionalState,
        proactiveMessage: proactiveMessage || undefined,
      }
    } catch (err) {
      console.error('[TwinService] LLM error:', err)
      await this.saveMessage(matchId, 'user', message)
      // 即使出错也返回基本关系信息
      return {
        reply: '嗯...我一下不知道说什么了，等会再聊吧',
        relationship,
        emotionalState,
      }
    }
  }

  /**
   * 获取聊天历史
   */
  async getHistory(matchId: number, limit: number = 100) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('twin_chat_history')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('[TwinService] getHistory error:', error)
      throw error
    }

    // 同时获取关系和情感状态
    const relationship = await this.getOrCreateRelationship(matchId)
    const emotionalState = await this.getOrCreateEmotionalState(matchId)

    // 获取未发送的主动消息并标记为已发送
    const { data: unsentMessages } = await client
      .from('twin_proactive_messages')
      .select('*')
      .eq('match_id', matchId)
      .eq('is_sent', false)
      .order('created_at', { ascending: true })

    let proactiveMessages: string[] = []
    if (unsentMessages && unsentMessages.length > 0) {
      proactiveMessages = unsentMessages.map(m => m.message)
      // 标记为已发送
      const ids = unsentMessages.map(m => m.id)
      await client
        .from('twin_proactive_messages')
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .in('id', ids)
    }

    return {
      history: data || [],
      relationship,
      emotionalState,
      proactiveMessages,
    }
  }

  /**
   * 清空聊天历史（同时重置关系和情感状态）
   */
  async clearHistory(matchId: number) {
    const client = getSupabaseClient()

    // 清空聊天记录
    await client.from('twin_chat_history').delete().eq('match_id', matchId)

    // 重置关系状态
    await client
      .from('twin_relationship')
      .update({
        stage: 'stranger',
        trust: 30,
        intimacy: 0,
        interaction_count: 0,
        last_interaction_at: null,
      })
      .eq('match_id', matchId)

    // 重置情感状态
    await client
      .from('twin_emotional_state')
      .update({
        primary: 'neutral',
        intensity: 50,
        towards_user: 'neutral',
        reason: null,
      })
      .eq('match_id', matchId)

    // 清空主动消息
    await client.from('twin_proactive_messages').delete().eq('match_id', matchId)

    return { success: true }
  }
}
