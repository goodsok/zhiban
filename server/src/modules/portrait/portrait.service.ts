import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 画像维度定义
export interface PortraitDimensions {
  // 人格维度 (大五人格)
  personality: {
    openness: number           // 开放性 0-100
    conscientiousness: number  // 尽责性
    extraversion: number       // 外向性
    agreeableness: number      // 宜人性
    neuroticism: number        // 神经质
  }
  // 情感维度
  emotional: {
    stability: number          // 情绪稳定性
    expression: number         // 情感表达
    empathy: number            // 共情能力
    independence: number       // 情感独立性
  }
  // 社交维度
  social: {
    activity: number           // 社交活跃度
    initiative: number         // 社交主动性
    intimacy: number           // 亲密需求
    trust: number              // 信任倾向
  }
  // 沟通维度
  communication: {
    directness: number         // 直接程度
    humor: number              // 幽默感
    responsiveness: number     // 响应速度
    depth: number              // 深度偏好
  }
}

// 行为模式
export interface BehaviorPattern {
  avgResponseTime: number | null      // 平均回复时间(分钟)
  responseTimeVariance: number | null // 回复时间方差
  activeHours: Record<string, number> // 各小时活跃度
  activeDays: Record<string, number>  // 各天活跃度
  messageLengthAvg: number | null     // 平均消息长度
  emojiUsageRate: number              // 表情使用率
  questionRate: number                // 提问率
  initiativeRate: number              // 主动发起率
  topicCategories: Record<string, number> // 话题类型分布
  emotionalKeywords: string[]         // 情绪关键词
  totalInteractions: number           // 总互动次数
}

// 画像变化历史
export interface PortraitHistory {
  id: number
  matchId: number
  dimension: string
  oldValue: number
  newValue: number
  changeReason: string
  evidence: string | null
  createdAt: string
}

// 完整画像
export interface FullPortrait {
  dimensions: PortraitDimensions
  behaviorPattern: BehaviorPattern
  interactionStyle: 'active' | 'passive' | 'balanced'
  preferredTopicTypes: string[]
  activeTimeSlots: string[]
  confidence: number
  history: PortraitHistory[]
  lastUpdated: string
}

// 数据库消息格式
interface DbChatMessage {
  id: number
  match_id: number
  role: string
  content: string
  created_at: string
}

@Injectable()
export class PortraitService {
  /**
   * 获取或创建画像
   */
  async getOrCreatePortrait(matchId: number): Promise<FullPortrait> {
    const client = getSupabaseClient()
    
    // 尝试获取现有画像
    const { data: portrait } = await client
      .from('profile_portraits')
      .select('*')
      .eq('match_id', matchId)
      .single()

    // 获取行为模式
    const { data: behavior } = await client
      .from('behavior_patterns')
      .select('*')
      .eq('match_id', matchId)
      .single()

    // 获取历史记录
    const { data: history } = await client
      .from('profile_histories')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (portrait) {
      return this.dbToFullPortrait(portrait, behavior, history)
    }

    // 创建默认画像
    const defaultPortrait = this.getDefaultPortrait()
    const { data: newPortrait } = await client
      .from('profile_portraits')
      .insert({
        match_id: matchId,
        ...defaultPortrait.dimensions.personality,
        ...defaultPortrait.dimensions.emotional,
        ...defaultPortrait.dimensions.social,
        ...defaultPortrait.dimensions.communication,
        interaction_style: defaultPortrait.interactionStyle,
        preferred_topic_types: defaultPortrait.preferredTopicTypes,
        active_time_slots: defaultPortrait.activeTimeSlots,
        response_pattern: {},
        confidence: 0,
      })
      .select()
      .single()

    // 创建默认行为模式
    const { data: newBehavior } = await client
      .from('behavior_patterns')
      .insert({
        match_id: matchId,
        active_hours: {},
        active_days: {},
        topic_categories: {},
        emotional_keywords: [],
        total_interactions: 0,
      })
      .select()
      .single()

    return this.dbToFullPortrait(newPortrait, newBehavior, [])
  }

  /**
   * 从聊天记录分析并更新画像
   */
  async analyzeAndUpdateFromChat(
    matchId: number,
    chatHistory: DbChatMessage[],
    req: Request
  ): Promise<void> {
    if (chatHistory.length < 3) return

    try {
      // 1. 分析行为模式
      const behaviorPattern = this.analyzeBehaviorPattern(chatHistory)
      await this.updateBehaviorPattern(matchId, behaviorPattern)

      // 2. 使用 LLM 分析心理画像
      const portraitUpdate = await this.analyzePortraitWithLLM(matchId, chatHistory, req)
      
      if (portraitUpdate) {
        await this.updatePortrait(matchId, portraitUpdate, 'chat_analysis')
      }
    } catch (error) {
      console.error('Analyze and update portrait error:', error)
    }
  }

  /**
   * 分析行为模式
   */
  private analyzeBehaviorPattern(messages: DbChatMessage[]): BehaviorPattern {
    const userMessages = messages.filter(m => m.role === 'user')
    const assistantMessages = messages.filter(m => m.role === 'assistant')
    
    // 计算回复时间
    const responseTimes: number[] = []
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].role === 'user' && messages[i - 1].role === 'assistant') {
        const timeDiff = new Date(messages[i].created_at).getTime() - 
                        new Date(messages[i - 1].created_at).getTime()
        responseTimes.push(Math.floor(timeDiff / (1000 * 60))) // 分钟
      }
    }

    // 计算活跃时段
    const activeHours: Record<string, number> = {}
    const activeDays: Record<string, number> = {}
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    
    userMessages.forEach(msg => {
      const date = new Date(msg.created_at)
      const hour = date.getHours().toString()
      const day = dayNames[date.getDay()]
      
      activeHours[hour] = (activeHours[hour] || 0) + 1
      activeDays[day] = (activeDays[day] || 0) + 1
    })

    // 计算消息长度
    const messageLengths = userMessages.map(m => m.content.length)
    const avgLength = messageLengths.length > 0 
      ? Math.floor(messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length)
      : null

    // 计算表情使用率
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]/gu
    const messagesWithEmoji = userMessages.filter(m => emojiRegex.test(m.content)).length
    const emojiUsageRate = userMessages.length > 0 
      ? Math.floor((messagesWithEmoji / userMessages.length) * 100)
      : 0

    // 计算提问率
    const questionRegex = /[？?]/g
    const messagesWithQuestion = userMessages.filter(m => questionRegex.test(m.content)).length
    const questionRate = userMessages.length > 0
      ? Math.floor((messagesWithQuestion / userMessages.length) * 100)
      : 0

    return {
      avgResponseTime: responseTimes.length > 0 
        ? Math.floor(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : null,
      responseTimeVariance: responseTimes.length > 1 
        ? this.calculateVariance(responseTimes)
        : null,
      activeHours,
      activeDays,
      messageLengthAvg: avgLength,
      emojiUsageRate,
      questionRate,
      initiativeRate: this.calculateInitiativeRate(messages),
      topicCategories: this.categorizeTopics(userMessages),
      emotionalKeywords: this.extractEmotionalKeywords(userMessages),
      totalInteractions: userMessages.length,
    }
  }

  /**
   * 计算方差
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
    return Math.floor(Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length))
  }

  /**
   * 计算主动发起率（基于对话开启次数）
   */
  private calculateInitiativeRate(messages: DbChatMessage[]): number {
    // 检测对话间隙，如果用户先发言则视为主动
    let initiatives = 0
    let gaps = 0
    
    for (let i = 1; i < messages.length; i++) {
      const timeDiff = new Date(messages[i].created_at).getTime() - 
                      new Date(messages[i - 1].created_at).getTime()
      
      // 超过1小时的间隔视为新的对话
      if (timeDiff > 60 * 60 * 1000) {
        gaps++
        if (messages[i].role === 'user') {
          initiatives++
        }
      }
    }
    
    return gaps > 0 ? Math.floor((initiatives / gaps) * 100) : 50
  }

  /**
   * 话题分类
   */
  private categorizeTopics(messages: DbChatMessage[]): Record<string, number> {
    const categories: Record<string, number> = {
      daily: 0,      // 日常
      work: 0,       // 工作
      emotion: 0,    // 情感
      hobby: 0,      // 兴趣
      future: 0,     // 未来规划
      relationship: 0, // 关系
    }

    const keywords: Record<string, string[]> = {
      daily: ['今天', '昨天', '吃饭', '睡觉', '天气', '周末'],
      work: ['工作', '上班', '加班', '同事', '老板', '项目'],
      emotion: ['开心', '难过', '生气', '担心', '害怕', '期待'],
      hobby: ['电影', '音乐', '游戏', '运动', '旅行', '美食'],
      future: ['计划', '目标', '梦想', '未来', '想'],
      relationship: ['喜欢', '爱', '约会', '在一起', '感情'],
    }

    messages.forEach(msg => {
      const content = msg.content
      Object.entries(keywords).forEach(([category, words]) => {
        if (words.some(word => content.includes(word))) {
          categories[category] = (categories[category] || 0) + 1
        }
      })
    })

    return categories
  }

  /**
   * 提取情绪关键词
   */
  private extractEmotionalKeywords(messages: DbChatMessage[]): string[] {
    const emotionalWords: Record<string, number> = {}
    
    const positiveWords = ['开心', '高兴', '快乐', '幸福', '期待', '喜欢', '爱', '美好', '棒', '好']
    const negativeWords = ['难过', '伤心', '生气', '烦躁', '担心', '害怕', '累', '烦', '压力大']
    
    messages.forEach(msg => {
      const content = msg.content
      ;[...positiveWords, ...negativeWords].forEach(word => {
        const count = (content.match(new RegExp(word, 'g')) || []).length
        if (count > 0) {
          emotionalWords[word] = (emotionalWords[word] || 0) + count
        }
      })
    })

    return Object.entries(emotionalWords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }

  /**
   * 使用 LLM 分析画像
   */
  private async analyzePortraitWithLLM(
    matchId: number,
    chatHistory: DbChatMessage[],
    req: Request
  ): Promise<Partial<PortraitDimensions> | null> {
    try {
      const client = getSupabaseClient()
      
      // 获取现有画像
      const { data: currentPortrait } = await client
        .from('profile_portraits')
        .select('*')
        .eq('match_id', matchId)
        .single()

      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const llmClient = new LLMClient(config, customHeaders)

      // 构建聊天摘要
      const recentChats = chatHistory
        .slice(-20)
        .map(c => `${c.role === 'user' ? '用户' : 'AI'}: ${c.content.slice(0, 150)}`)
        .join('\n')

      const prompt = `分析以下对话内容，推断对方的心理画像维度。结合现有画像进行微调。

现有画像：
- 开放性: ${currentPortrait?.personality_openness || 50}
- 尽责性: ${currentPortrait?.personality_conscientiousness || 50}
- 外向性: ${currentPortrait?.personality_extraversion || 50}
- 宜人性: ${currentPortrait?.personality_agreeableness || 50}
- 神经质: ${currentPortrait?.personality_neuroticism || 50}
- 情绪稳定性: ${currentPortrait?.emotional_stability || 50}
- 情感表达: ${currentPortrait?.emotional_expression || 50}
- 共情能力: ${currentPortrait?.emotional_empathy || 50}
- 社交主动性: ${currentPortrait?.social_initiative || 50}
- 沟通直接度: ${currentPortrait?.communication_directness || 50}
- 幽默感: ${currentPortrait?.communication_humor || 50}

对话内容：
${recentChats}

请根据对话内容，分析对方的心理特征，给出各维度的评分（0-100）。
评分规则：
1. 如果对话内容显示出明显的特征，适当调整分数
2. 调整幅度不要太大，每次最多调整10分
3. 如果没有明显特征，保持原值

请返回JSON格式：
{
  "personalityOpenness": 数字,
  "personalityConscientiousness": 数字,
  "personalityExtraversion": 数字,
  "personalityAgreeableness": 数字,
  "personalityNeuroticism": 数字,
  "emotionalStability": 数字,
  "emotionalExpression": 数字,
  "emotionalEmpathy": 数字,
  "socialInitiative": 数字,
  "communicationDirectness": 数字,
  "communicationHumor": 数字,
  "reasoning": "调整原因说明"
}

只返回JSON，不要其他文字。`

      const response = await llmClient.invoke([
        { role: 'user', content: prompt }
      ], { temperature: 0.3 })

      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        console.log('Portrait analysis result:', parsed)
        return {
          personality: {
            openness: parsed.personalityOpenness,
            conscientiousness: parsed.personalityConscientiousness,
            extraversion: parsed.personalityExtraversion,
            agreeableness: parsed.personalityAgreeableness,
            neuroticism: parsed.personalityNeuroticism,
          },
          emotional: {
            stability: parsed.emotionalStability,
            expression: parsed.emotionalExpression,
            empathy: parsed.emotionalEmpathy,
            independence: currentPortrait?.emotional_independence || 50,
          },
          social: {
            activity: currentPortrait?.social_activity || 50,
            initiative: parsed.socialInitiative,
            intimacy: currentPortrait?.social_intimacy || 50,
            trust: currentPortrait?.social_trust || 50,
          },
          communication: {
            directness: parsed.communicationDirectness,
            humor: parsed.communicationHumor,
            responsiveness: currentPortrait?.communication_responsiveness || 50,
            depth: currentPortrait?.communication_depth || 50,
          },
        }
      }
    } catch (error) {
      console.error('Analyze portrait with LLM error:', error)
    }
    return null
  }

  /**
   * 更新行为模式
   */
  private async updateBehaviorPattern(matchId: number, pattern: BehaviorPattern): Promise<void> {
    const client = getSupabaseClient()
    
    await client
      .from('behavior_patterns')
      .upsert({
        match_id: matchId,
        avg_response_time: pattern.avgResponseTime,
        response_time_variance: pattern.responseTimeVariance,
        active_hours: pattern.activeHours,
        active_days: pattern.activeDays,
        message_length_avg: pattern.messageLengthAvg,
        emoji_usage_rate: pattern.emojiUsageRate,
        question_rate: pattern.questionRate,
        initiative_rate: pattern.initiativeRate,
        topic_categories: pattern.topicCategories,
        emotional_keywords: pattern.emotionalKeywords,
        total_interactions: pattern.totalInteractions,
        last_analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'match_id' })
  }

  /**
   * 更新画像并记录变化
   */
  private async updatePortrait(
    matchId: number,
    update: Partial<PortraitDimensions>,
    reason: string
  ): Promise<void> {
    const client = getSupabaseClient()
    
    // 获取当前画像
    const { data: current } = await client
      .from('profile_portraits')
      .select('*')
      .eq('match_id', matchId)
      .single()

    if (!current) return

    // 计算变化并记录历史
    const changes: Array<{ dimension: string; old: number; new: number }> = []
    
    if (update.personality) {
      const p = update.personality
      if (p.openness !== undefined && p.openness !== current.personality_openness) {
        changes.push({ dimension: '开放性', old: current.personality_openness, new: p.openness })
      }
      if (p.conscientiousness !== undefined && p.conscientiousness !== current.personality_conscientiousness) {
        changes.push({ dimension: '尽责性', old: current.personality_conscientiousness, new: p.conscientiousness })
      }
      if (p.extraversion !== undefined && p.extraversion !== current.personality_extraversion) {
        changes.push({ dimension: '外向性', old: current.personality_extraversion, new: p.extraversion })
      }
      if (p.agreeableness !== undefined && p.agreeableness !== current.personality_agreeableness) {
        changes.push({ dimension: '宜人性', old: current.personality_agreeableness, new: p.agreeableness })
      }
      if (p.neuroticism !== undefined && p.neuroticism !== current.personality_neuroticism) {
        changes.push({ dimension: '神经质', old: current.personality_neuroticism, new: p.neuroticism })
      }
    }
    
    if (update.emotional) {
      const e = update.emotional
      if (e.stability !== undefined && e.stability !== current.emotional_stability) {
        changes.push({ dimension: '情绪稳定性', old: current.emotional_stability, new: e.stability })
      }
      if (e.expression !== undefined && e.expression !== current.emotional_expression) {
        changes.push({ dimension: '情感表达', old: current.emotional_expression, new: e.expression })
      }
      if (e.empathy !== undefined && e.empathy !== current.emotional_empathy) {
        changes.push({ dimension: '共情能力', old: current.emotional_empathy, new: e.empathy })
      }
    }
    
    if (update.social) {
      const s = update.social
      if (s.initiative !== undefined && s.initiative !== current.social_initiative) {
        changes.push({ dimension: '社交主动性', old: current.social_initiative, new: s.initiative })
      }
    }
    
    if (update.communication) {
      const c = update.communication
      if (c.directness !== undefined && c.directness !== current.communication_directness) {
        changes.push({ dimension: '沟通直接度', old: current.communication_directness, new: c.directness })
      }
      if (c.humor !== undefined && c.humor !== current.communication_humor) {
        changes.push({ dimension: '幽默感', old: current.communication_humor, new: c.humor })
      }
    }

    // 记录变化历史
    if (changes.length > 0) {
      const historyRecords = changes.map(change => ({
        match_id: matchId,
        dimension: change.dimension,
        old_value: change.old,
        new_value: change.new,
        change_reason: reason,
        evidence: `从 ${change.old} 变化到 ${change.new}`,
      }))

      await client
        .from('profile_histories')
        .insert(historyRecords)

      // 更新画像
      const updateData: Record<string, number> = {}
      changes.forEach(change => {
        const dbField = this.dimensionToDbField(change.dimension)
        if (dbField) {
          updateData[dbField] = change.new
        }
      })

      // 更新置信度（基于互动次数）
      const { data: behavior } = await client
        .from('behavior_patterns')
        .select('total_interactions')
        .eq('match_id', matchId)
        .single()
      
      const confidence = Math.min(100, Math.floor((behavior?.total_interactions || 0) / 10 * 10))

      await client
        .from('profile_portraits')
        .update({
          ...updateData,
          confidence,
          updated_at: new Date().toISOString(),
        })
        .eq('match_id', matchId)
    }
  }

  /**
   * 维度名称转数据库字段
   */
  private dimensionToDbField(dimension: string): string | null {
    const mapping: Record<string, string> = {
      '开放性': 'personality_openness',
      '尽责性': 'personality_conscientiousness',
      '外向性': 'personality_extraversion',
      '宜人性': 'personality_agreeableness',
      '神经质': 'personality_neuroticism',
      '情绪稳定性': 'emotional_stability',
      '情感表达': 'emotional_expression',
      '共情能力': 'emotional_empathy',
      '情感独立性': 'emotional_independence',
      '社交活跃度': 'social_activity',
      '社交主动性': 'social_initiative',
      '亲密需求': 'social_intimacy',
      '信任倾向': 'social_trust',
      '沟通直接度': 'communication_directness',
      '幽默感': 'communication_humor',
      '响应速度': 'communication_responsiveness',
      '深度偏好': 'communication_depth',
    }
    return mapping[dimension] || null
  }

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
    
    ;(history || []).forEach((record: { dimension: string; new_value: number; created_at: string }) => {
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
   * 智能推理 - 预测关系走向
   */
  async predictRelationshipTrend(matchId: number, req: Request): Promise<{
    trend: 'improving' | 'stable' | 'declining'
    confidence: number
    insights: string[]
    recommendations: string[]
  }> {
    const client = getSupabaseClient()
    
    // 获取画像和行为数据
    const { data: portrait } = await client
      .from('profile_portraits')
      .select('*')
      .eq('match_id', matchId)
      .single()

    const { data: behavior } = await client
      .from('behavior_patterns')
      .select('*')
      .eq('match_id', matchId)
      .single()

    const { data: match } = await client
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (!portrait || !match) {
      return {
        trend: 'stable',
        confidence: 0,
        insights: ['数据不足，无法做出预测'],
        recommendations: ['多与对方互动以积累数据'],
      }
    }

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const llmClient = new LLMClient(config, customHeaders)

      const prompt = `基于以下画像数据，预测关系走向并给出建议。

对象画像：
- 外向性: ${portrait.personality_extraversion}
- 宜人性: ${portrait.personality_agreeableness}
- 情绪稳定性: ${portrait.emotional_stability}
- 共情能力: ${portrait.emotional_empathy}
- 社交主动性: ${portrait.social_initiative}
- 幽默感: ${portrait.communication_humor}

行为数据：
- 总互动次数: ${behavior?.total_interactions || 0}
- 表情使用率: ${behavior?.emoji_usage_rate || 0}%
- 提问率: ${behavior?.question_rate || 0}%
- 主动发起率: ${behavior?.initiative_rate || 50}%

关系状态：
- 关系阶段: ${match.relationship_stage}
- 互动状态: ${match.interaction_status}
- 印象分: ${match.impression}

请分析：
1. 关系趋势 (improving/stable/declining)
2. 关键洞察（2-3条）
3. 推荐策略（2-3条）

返回JSON格式：
{
  "trend": "improving/stable/declining",
  "confidence": 0-100,
  "insights": ["洞察1", "洞察2"],
  "recommendations": ["建议1", "建议2"]
}`

      const response = await llmClient.invoke([
        { role: 'user', content: prompt }
      ], { temperature: 0.5 })

      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Predict relationship trend error:', error)
    }

    // 默认返回
    return {
      trend: 'stable',
      confidence: 50,
      insights: ['保持当前的互动频率'],
      recommendations: ['多关注对方的情绪变化'],
    }
  }

  /**
   * 获取互动策略推荐
   */
  async getInteractionStrategy(matchId: number, req: Request): Promise<{
    strategies: Array<{
      category: string
      action: string
      reason: string
      timing: string
    }>
  }> {
    const client = getSupabaseClient()
    
    const { data: portrait } = await client
      .from('profile_portraits')
      .select('*')
      .eq('match_id', matchId)
      .single()

    const { data: behavior } = await client
      .from('behavior_patterns')
      .select('*')
      .eq('match_id', matchId)
      .single()

    const { data: match } = await client
      .from('matches')
      .select('*, hardware, software')
      .eq('id', matchId)
      .single()

    if (!portrait || !match) {
      return { strategies: [] }
    }

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const llmClient = new LLMClient(config, customHeaders)

      // 计算活跃时段
      const activeSlots = this.getActiveTimeSlots(behavior?.active_hours || {})

      const prompt = `基于画像和行为数据，推荐最佳的互动策略。

画像特征：
- 外向性: ${portrait.personality_extraversion}（高=外向，低=内向）
- 宜人性: ${portrait.personality_agreeableness}（高=随和，低=直接）
- 情绪稳定性: ${portrait.emotional_stability}（高=稳定，低=敏感）
- 共情能力: ${portrait.emotional_empathy}
- 沟通直接度: ${portrait.communication_directness}
- 幽默感: ${portrait.communication_humor}

行为特征：
- 活跃时段: ${activeSlots.join('、')}
- 表情使用率: ${behavior?.emoji_usage_rate || 0}%
- 平均回复时间: ${behavior?.avg_response_time || '未知'}分钟

关系状态：${match.interaction_status}

请根据对方的画像特点，推荐3-5个具体的互动策略，包括：
1. 策略类别（沟通/约会/话题/关怀）
2. 具体行动
3. 推荐理由（结合画像特点）
4. 最佳时机

返回JSON格式：
{
  "strategies": [
    {
      "category": "沟通/约会/话题/关怀",
      "action": "具体行动",
      "reason": "推荐理由",
      "timing": "最佳时机"
    }
  ]
}`

      const response = await llmClient.invoke([
        { role: 'user', content: prompt }
      ], { temperature: 0.7 })

      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Get interaction strategy error:', error)
    }

    // 基于画像生成默认策略
    return this.getDefaultStrategies(portrait, behavior)
  }

  /**
   * 获取活跃时段
   */
  private getActiveTimeSlots(activeHours: Record<string, number>): string[] {
    const slots: string[] = []
    const hours = Object.entries(activeHours)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([h]) => parseInt(h))

    hours.forEach(h => {
      if (h >= 6 && h < 12) slots.push('上午')
      else if (h >= 12 && h < 18) slots.push('下午')
      else if (h >= 18 && h < 22) slots.push('晚上')
      else slots.push('深夜')
    })

    return [...new Set(slots)]
  }

  /**
   * 获取默认策略
   */
  private getDefaultStrategies(portrait: Record<string, number>, behavior: Record<string, unknown> | null): { strategies: Array<{ category: string; action: string; reason: string; timing: string }> } {
    const strategies: Array<{ category: string; action: string; reason: string; timing: string }> = []

    // 基于外向性
    if (portrait.personality_extraversion > 60) {
      strategies.push({
        category: '话题',
        action: '可以尝试更开放的话题，如旅行见闻、社交活动',
        reason: '对方外向性较高，喜欢分享和交流',
        timing: '对方活跃时段',
      })
    } else {
      strategies.push({
        category: '话题',
        action: '选择深度话题，如价值观、人生规划',
        reason: '对方偏内向，更喜欢深度交流',
        timing: '安静的晚上',
      })
    }

    // 基于宜人性
    if (portrait.personality_agreeableness > 60) {
      strategies.push({
        category: '沟通',
        action: '可以直接表达想法，对方比较随和',
        reason: '对方宜人性高，容易接受不同意见',
        timing: '任何时候',
      })
    }

    // 基于情绪稳定性
    if (portrait.emotional_stability < 50) {
      strategies.push({
        category: '关怀',
        action: '多关注对方情绪，及时给予支持',
        reason: '对方情绪较敏感，需要更多关心',
        timing: '察觉情绪变化时',
      })
    }

    return { strategies }
  }

  /**
   * 数据库格式转换为前端格式
   */
  private dbToFullPortrait(
    portrait: Record<string, unknown> | null,
    behavior: Record<string, unknown> | null,
    history: Array<Record<string, unknown>> | null
  ): FullPortrait {
    return {
      dimensions: {
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
          humor: (portrait?.communication_humor as number) || 50,
          responsiveness: (portrait?.communication_responsiveness as number) || 50,
          depth: (portrait?.communication_depth as number) || 50,
        },
      },
      behaviorPattern: {
        avgResponseTime: (behavior?.avg_response_time as number) || null,
        responseTimeVariance: (behavior?.response_time_variance as number) || null,
        activeHours: (behavior?.active_hours as Record<string, number>) || {},
        activeDays: (behavior?.active_days as Record<string, number>) || {},
        messageLengthAvg: (behavior?.message_length_avg as number) || null,
        emojiUsageRate: (behavior?.emoji_usage_rate as number) || 0,
        questionRate: (behavior?.question_rate as number) || 0,
        initiativeRate: (behavior?.initiative_rate as number) || 0,
        topicCategories: (behavior?.topic_categories as Record<string, number>) || {},
        emotionalKeywords: (behavior?.emotional_keywords as string[]) || [],
        totalInteractions: (behavior?.total_interactions as number) || 0,
      },
      interactionStyle: (portrait?.interaction_style as 'active' | 'passive' | 'balanced') || 'balanced',
      preferredTopicTypes: (portrait?.preferred_topic_types as string[]) || [],
      activeTimeSlots: (portrait?.active_time_slots as string[]) || [],
      confidence: (portrait?.confidence as number) || 0,
      history: (history || []).map(h => ({
        id: h.id as number,
        matchId: h.match_id as number,
        dimension: h.dimension as string,
        oldValue: h.old_value as number,
        newValue: h.new_value as number,
        changeReason: h.change_reason as string,
        evidence: h.evidence as string | null,
        createdAt: h.created_at as string,
      })),
      lastUpdated: (portrait?.updated_at as string) || new Date().toISOString(),
    }
  }

  /**
   * 获取默认画像
   */
  private getDefaultPortrait(): Omit<FullPortrait, 'history'> {
    return {
      dimensions: {
        personality: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 },
        emotional: { stability: 50, expression: 50, empathy: 50, independence: 50 },
        social: { activity: 50, initiative: 50, intimacy: 50, trust: 50 },
        communication: { directness: 50, humor: 50, responsiveness: 50, depth: 50 },
      },
      behaviorPattern: {
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
      },
      interactionStyle: 'balanced',
      preferredTopicTypes: [],
      activeTimeSlots: [],
      confidence: 0,
      lastUpdated: new Date().toISOString(),
    }
  }
}
