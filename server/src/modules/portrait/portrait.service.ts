import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils, S3Storage } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { UserProfileService } from '@/modules/user-profile/user-profile.service'

// 画像维度定义
export interface PortraitDimensions {
  personality: {
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
  }
  emotional: {
    stability: number
    expression: number
    empathy: number
    independence: number
  }
  social: {
    activity: number
    initiative: number
    intimacy: number
    trust: number
  }
  communication: {
    directness: number
    responsiveness: number
    humor: number
    depth: number
  }
}

// 行为模式 - 数据来源可以是聊天记录或手动填写
export interface BehaviorPattern {
  dataSource: 'chat_record' | 'manual' | 'none'
  avgResponseTime: number | null
  responseTimeVariance: number | null
  activeHours: Record<string, number>
  activeDays: Record<string, number>
  messageLengthAvg: number | null
  emojiUsageRate: number
  questionRate: number
  initiativeRate: number
  topicCategories: Record<string, number>
  emotionalKeywords: string[]
  totalInteractions: number
  // 手动填写的数据
  manualData?: {
    responseSpeed?: 'instant' | 'fast' | 'normal' | 'slow' | 'very_slow'
    activeTimeSlots?: string[]
    topicPreferences?: string[]
    communicationStyle?: 'direct' | 'indirect' | 'balanced'
  }
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
  // 数据来源状态
  dataSourceStatus: {
    hasChatRecords: boolean
    hasManualData: boolean
    chatRecordCount: number
  }
  lastUpdated: string
}

// 聊天记录分析结果
export interface ChatRecordAnalysis {
  isChatRecord: boolean
  avgResponseTime?: number
  activeHours?: Record<string, number>
  activeDays?: Record<string, number>
  messageCount?: number
  emojiUsageRate?: number
  topicKeywords?: string[]
  summary?: string
}

@Injectable()
export class PortraitService {
  private storage: S3Storage

  constructor(private readonly userProfileService: UserProfileService) {
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    })
  }

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

    // 获取聊天记录数量
    const { count: chatRecordCount } = await client
      .from('chat_records')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)

    // 获取手动填写的数据
    const { data: manualData } = await client
      .from('manual_behavior_data')
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
      return this.dbToFullPortrait(portrait, behavior, history, manualData, chatRecordCount || 0)
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
        data_source: 'none',
        active_hours: {},
        active_days: {},
        topic_categories: {},
        emotional_keywords: [],
        total_interactions: 0,
      })
      .select()
      .single()

    return this.dbToFullPortrait(newPortrait, newBehavior, [], null, 0)
  }

  /**
   * 上传并分析聊天记录截图
   */
  async uploadAndAnalyzeChatRecord(
    matchId: number,
    base64Data: string,
    req: Request
  ): Promise<{ success: boolean; analysis?: ChatRecordAnalysis; message: string }> {
    try {
      // 解析 base64
      const matches = base64Data.match(/^data:(.+);base64,(.+)$/)
      if (!matches) {
        return { success: false, message: '无效的图片格式' }
      }

      const contentType = matches[1]
      const buffer = Buffer.from(matches[2], 'base64')

      // 上传到对象存储
      const ext = contentType.split('/')[1] || 'jpg'
      const key = await this.storage.uploadFile({
        fileContent: buffer,
        fileName: `chat-records/${matchId}/${Date.now()}.${ext}`,
        contentType,
      })

      const imageUrl = await this.storage.generatePresignedUrl({ key, expireTime: 600 })

      // 创建聊天记录记录
      const client = getSupabaseClient()
      const { data: chatRecord } = await client
        .from('chat_records')
        .insert({
          match_id: matchId,
          image_url: imageUrl,
          analysis_status: 'analyzing',
        })
        .select()
        .single()

      // 调用多模态LLM分析
      const analysis = await this.analyzeChatRecordImage(imageUrl, req)

      if (analysis.isChatRecord) {
        // 更新聊天记录分析结果
        await client
          .from('chat_records')
          .update({
            analyzed_content: analysis,
            avg_response_time: analysis.avgResponseTime,
            active_hours: analysis.activeHours || {},
            active_days: analysis.activeDays || {},
            message_count: analysis.messageCount || 0,
            emoji_usage_rate: analysis.emojiUsageRate || 0,
            topic_keywords: analysis.topicKeywords || [],
            analysis_status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', chatRecord.id)

        // 更新行为模式（合并多张聊天记录的数据）
        await this.mergeChatRecordData(matchId)

        return { success: true, analysis, message: '聊天记录分析完成' }
      } else {
        // 不是聊天记录
        await client
          .from('chat_records')
          .update({
            analysis_status: 'failed',
            analysis_error: '图片不是聊天记录',
            updated_at: new Date().toISOString(),
          })
          .eq('id', chatRecord.id)

        return { success: false, message: '上传的图片不是聊天记录，请上传与对方的聊天截图' }
      }
    } catch (error) {
      console.error('Upload and analyze chat record error:', error)
      return { success: false, message: '分析失败，请稍后再试' }
    }
  }

  /**
   * 分析聊天记录图片
   */
  private async analyzeChatRecordImage(imageUrl: string, req: Request): Promise<ChatRecordAnalysis> {
    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const messages = [
        {
          role: 'user' as const,
          content: [
            {
              type: 'text' as const,
              text: `请分析这张图片是否为聊天记录截图。如果是聊天记录，请提取以下信息：

1. 判断：这是否是聊天记录截图？（微信、QQ、短信等聊天界面）
2. 如果是聊天记录，请分析：
   - 对方（聊天对象，非用户自己）的平均回复时间（分钟）
   - 对方的活跃时段（哪些小时发消息较多）
   - 消息总数
   - 表情使用频率（大约百分比）
   - 话题关键词

请用JSON格式返回：
{
  "isChatRecord": true/false,
  "avgResponseTime": 数字（分钟，如30表示30分钟）,
  "activeHours": {"9": 5, "10": 8, ...}（对方发送消息的小时分布）,
  "activeDays": {"monday": 10, "tuesday": 8, ...}（对方发送消息的星期分布）,
  "messageCount": 数字,
  "emojiUsageRate": 数字（0-100）,
  "topicKeywords": ["关键词1", "关键词2", ...],
  "summary": "简短描述聊天内容"
}

注意：
- 只分析对方（聊天对象）的消息，不要统计用户自己的消息
- 如果图片不是聊天记录，isChatRecord 设为 false
- 回复时间是指对方收到消息后到回复的时间间隔`,
            },
            {
              type: 'image_url' as const,
              image_url: {
                url: imageUrl,
                detail: 'high' as const,
              },
            },
          ],
        },
      ]

      const response = await client.invoke(messages, {
        model: 'doubao-seed-1-6-vision-250815',
        temperature: 0.3,
      })

      // 解析JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as ChatRecordAnalysis
      }

      return { isChatRecord: false }
    } catch (error) {
      console.error('Analyze chat record image error:', error)
      return { isChatRecord: false }
    }
  }

  /**
   * 合并多张聊天记录的数据
   */
  private async mergeChatRecordData(matchId: number): Promise<void> {
    const client = getSupabaseClient()
    
    // 获取所有已完成的聊天记录分析
    const { data: chatRecords } = await client
      .from('chat_records')
      .select('*')
      .eq('match_id', matchId)
      .eq('analysis_status', 'completed')

    if (!chatRecords || chatRecords.length === 0) return

    // 合并数据
    let totalMessages = 0
    let totalResponseTime = 0
    let responseTimeCount = 0
    let totalEmojiRate = 0
    const mergedActiveHours: Record<string, number> = {}
    const mergedActiveDays: Record<string, number> = {}
    const mergedKeywords: string[] = []

    for (const record of chatRecords) {
      totalMessages += record.message_count || 0
      if (record.avg_response_time) {
        totalResponseTime += record.avg_response_time
        responseTimeCount++
      }
      totalEmojiRate += record.emoji_usage_rate || 0

      // 合并活跃时段
      const hours = record.active_hours as Record<string, number> || {}
      for (const [hour, count] of Object.entries(hours)) {
        mergedActiveHours[hour] = (mergedActiveHours[hour] || 0) + count
      }

      // 合并活跃日期
      const days = record.active_days as Record<string, number> || {}
      for (const [day, count] of Object.entries(days)) {
        mergedActiveDays[day] = (mergedActiveDays[day] || 0) + count
      }

      // 合并关键词
      const keywords = record.topic_keywords as string[] || []
      mergedKeywords.push(...keywords)
    }

    // 计算平均值
    const avgResponseTime = responseTimeCount > 0 ? Math.floor(totalResponseTime / responseTimeCount) : null
    const avgEmojiRate = chatRecords.length > 0 ? Math.floor(totalEmojiRate / chatRecords.length) : 0

    // 更新行为模式
    await client
      .from('behavior_patterns')
      .upsert({
        match_id: matchId,
        data_source: 'chat_record',
        avg_response_time: avgResponseTime,
        active_hours: mergedActiveHours,
        active_days: mergedActiveDays,
        message_length_avg: null,
        emoji_usage_rate: avgEmojiRate,
        question_rate: 0,
        initiative_rate: 0,
        topic_categories: {},
        emotional_keywords: [...new Set(mergedKeywords)],
        total_interactions: totalMessages,
        last_analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'match_id' })

    // 更新置信度
    const confidence = Math.min(100, Math.floor(totalMessages / 10))
    await client
      .from('profile_portraits')
      .update({ confidence, updated_at: new Date().toISOString() })
      .eq('match_id', matchId)
  }

  /**
   * 保存手动填写的行为数据
   */
  async saveManualBehaviorData(
    matchId: number,
    data: {
      responseSpeed?: 'instant' | 'fast' | 'normal' | 'slow' | 'very_slow'
      activeTimeSlots?: string[]
      topicPreferences?: string[]
      communicationStyle?: 'direct' | 'indirect' | 'balanced'
      notes?: string
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const client = getSupabaseClient()

      // 保存手动数据
      await client
        .from('manual_behavior_data')
        .upsert({
          match_id: matchId,
          response_speed: data.responseSpeed,
          active_time_slots: data.activeTimeSlots || [],
          topic_preferences: data.topicPreferences || [],
          communication_style: data.communicationStyle,
          notes: data.notes,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'match_id' })

      // 如果没有聊天记录数据，使用手动数据更新行为模式
      const { data: chatRecords } = await client
        .from('chat_records')
        .select('id')
        .eq('match_id', matchId)
        .eq('analysis_status', 'completed')
        .limit(1)

      if (!chatRecords || chatRecords.length === 0) {
        // 将手动数据转换为行为模式
        const behaviorPattern = this.manualDataToBehaviorPattern(data)
        
        await client
          .from('behavior_patterns')
          .upsert({
            match_id: matchId,
            data_source: 'manual',
            ...behaviorPattern,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'match_id' })

        // 更新置信度（手动数据给30%置信度）
        await client
          .from('profile_portraits')
          .update({ 
            confidence: 30, 
            updated_at: new Date().toISOString() 
          })
          .eq('match_id', matchId)
      }

      return { success: true, message: '保存成功' }
    } catch (error) {
      console.error('Save manual behavior data error:', error)
      return { success: false, message: '保存失败' }
    }
  }

  /**
   * 将手动数据转换为行为模式
   */
  private manualDataToBehaviorPattern(data: {
    responseSpeed?: string
    activeTimeSlots?: string[]
    topicPreferences?: string[]
    communicationStyle?: string
  }): Record<string, unknown> {
    // 回复速度映射
    const responseSpeedMap: Record<string, number> = {
      instant: 1,    // 秒回
      fast: 10,      // 快（几分钟）
      normal: 30,    // 正常（半小时左右）
      slow: 120,     // 慢（2小时左右）
      very_slow: 480, // 很慢（8小时+）
    }

    // 时段映射到小时
    const timeSlotMap: Record<string, number[]> = {
      morning: [6, 7, 8, 9, 10, 11],
      afternoon: [12, 13, 14, 15, 16, 17],
      evening: [18, 19, 20, 21],
      night: [22, 23, 0, 1, 2, 3, 4, 5],
    }

    // 构建活跃时段
    const activeHours: Record<string, number> = {}
    if (data.activeTimeSlots) {
      for (const slot of data.activeTimeSlots) {
        const hours = timeSlotMap[slot] || []
        for (const hour of hours) {
          activeHours[hour.toString()] = 10
        }
      }
    }

    // 话题偏好映射
    const topicMap: Record<string, string> = {
      daily: '日常',
      work: '工作',
      emotion: '情感',
      hobby: '兴趣',
      future: '未来',
      relationship: '关系',
    }

    const topicCategories: Record<string, number> = {}
    if (data.topicPreferences) {
      for (const topic of data.topicPreferences) {
        topicCategories[topicMap[topic] || topic] = 10
      }
    }

    return {
      avg_response_time: data.responseSpeed ? responseSpeedMap[data.responseSpeed] : null,
      active_hours: activeHours,
      active_days: {},
      message_length_avg: null,
      emoji_usage_rate: 50,
      question_rate: 50,
      initiative_rate: 50,
      topic_categories: topicCategories,
      emotional_keywords: [],
      total_interactions: 0,
    }
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

    const { count: chatRecordCount } = await client
      .from('chat_records')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('analysis_status', 'completed')

    if (!portrait || !match) {
      return {
        trend: 'stable',
        confidence: 0,
        insights: ['数据不足，无法做出预测'],
        recommendations: ['上传聊天记录或填写行为数据以获得更准确的分析'],
      }
    }

    // 根据数据来源判断置信度
    const hasChatRecords = (chatRecordCount || 0) > 0
    const dataSource = behavior?.data_source || 'none'
    
    if (dataSource === 'none') {
      return {
        trend: 'stable',
        confidence: 0,
        insights: ['尚未上传聊天记录或填写行为数据'],
        recommendations: [
          '上传聊天截图可以获得更准确的分析',
          '或手动填写对方的行为特点',
        ],
      }
    }

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const llmClient = new LLMClient(config, customHeaders)

      // 获取用户自己的画像
      let userPortrait: Record<string, unknown> | null = null
      try {
        userPortrait = await this.userProfileService.getUserPortrait(1)
      } catch (e) {
        console.log('User portrait not found, using default')
      }

      // 构建用户画像描述
      const userDesc = userPortrait ? `
用户（你）的画像：
- 性格特点: ${((userPortrait.personality as any)?.traits || []).join('、') || '未知'}
- 外向性: ${(userPortrait.personality as any)?.extraversion || 50}
- 宜人性: ${(userPortrait.personality as any)?.agreeableness || 50}
- 沟通风格: ${(userPortrait.behavior as any)?.communicationStyle || '未知'}
- 恋爱目标: ${(userPortrait.relationship as any)?.goal || '未知'}
- 依恋类型: ${(userPortrait.relationship as any)?.attachmentStyle || '未知'}
` : ''

      const prompt = `基于以下数据，预测关系走向并给出建议。

数据来源：${hasChatRecords ? '聊天记录分析' : '手动填写'}

对方（Ta）的画像数据：
- 外向性: ${portrait.personality_extraversion}
- 宜人性: ${portrait.personality_agreeableness}
- 情绪稳定性: ${portrait.emotional_stability}
- 共情能力: ${portrait.emotional_empathy}
- 社交主动性: ${portrait.social_initiative}

${userDesc}

${hasChatRecords ? `聊天记录分析：
- 平均回复时间: ${behavior?.avg_response_time || '未知'}分钟
- 消息总数: ${behavior?.total_interactions || 0}
- 表情使用率: ${behavior?.emoji_usage_rate || 0}%` : ''}

关系状态：
- 关系阶段: ${match.relationship_stage}
- 互动状态: ${match.interaction_status}

请分析双方画像的匹配度，并预测关系趋势：
1. 关系趋势 (improving/stable/declining)
2. 基于双方画像的匹配分析（2-3条洞察）
3. 针对性的建议（结合双方特点，2-3条）

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
        const result = JSON.parse(jsonMatch[0])
        // 根据数据来源调整置信度
        result.confidence = hasChatRecords ? result.confidence : Math.min(result.confidence, 50)
        return result
      }
    } catch (error) {
      console.error('Predict relationship trend error:', error)
    }

    return {
      trend: 'stable',
      confidence: dataSource === 'chat_record' ? 50 : 30,
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

    const { count: chatRecordCount } = await client
      .from('chat_records')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('analysis_status', 'completed')

    if (!portrait || !match) {
      return { strategies: [] }
    }

    const hasChatRecords = (chatRecordCount || 0) > 0
    const dataSource = behavior?.data_source || 'none'

    if (dataSource === 'none') {
      return { 
        strategies: [
          {
            category: '数据',
            action: '上传聊天记录或填写行为数据',
            reason: '缺少对方的行为数据，无法提供个性化建议',
            timing: '现在',
          }
        ]
      }
    }

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const llmClient = new LLMClient(config, customHeaders)

      // 获取用户自己的画像
      let userPortrait: Record<string, unknown> | null = null
      try {
        userPortrait = await this.userProfileService.getUserPortrait(1)
      } catch (e) {
        console.log('User portrait not found, using default')
      }

      // 计算活跃时段
      const activeSlots = this.getActiveTimeSlots(behavior?.active_hours || {})

      // 构建用户画像描述
      const userDesc = userPortrait ? `
用户（你）的画像：
- 性格特点: ${((userPortrait.personality as any)?.traits || []).join('、') || '未知'}
- 外向性: ${(userPortrait.personality as any)?.extraversion || 50}
- 沟通风格: ${(userPortrait.behavior as any)?.communicationStyle || '未知'}
- 表达风格: ${(userPortrait.behavior as any)?.expressionStyle || '未知'}
- 喜欢的话题: ${((userPortrait.behavior as any)?.preferredTopics || []).join('、') || '未知'}
- 恋爱目标: ${(userPortrait.relationship as any)?.goal || '未知'}
` : ''

      const prompt = `基于双方画像和行为数据，推荐最佳的互动策略。

数据来源：${hasChatRecords ? '聊天记录分析' : '手动填写'}

对方（Ta）的画像特征：
- 外向性: ${portrait.personality_extraversion}
- 宜人性: ${portrait.personality_agreeableness}
- 情绪稳定性: ${portrait.emotional_stability}
- 共情能力: ${portrait.emotional_empathy}
- 沟通直接度: ${portrait.communication_directness}

${userDesc}

${hasChatRecords ? `对方行为特征：
- 活跃时段: ${activeSlots.join('、')}
- 平均回复时间: ${behavior?.avg_response_time || '未知'}分钟` : ''}

关系状态：${match.interaction_status}

请根据双方的画像特点，推荐3-5个具体的互动策略。策略要结合双方的性格匹配度，给出有针对性的建议。

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

    return this.getDefaultStrategies(portrait)
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
  private getDefaultStrategies(portrait: Record<string, number>): { strategies: Array<{ category: string; action: string; reason: string; timing: string }> } {
    const strategies: Array<{ category: string; action: string; reason: string; timing: string }> = []

    if (portrait.personality_extraversion > 60) {
      strategies.push({
        category: '话题',
        action: '可以尝试更开放的话题',
        reason: '对方外向性较高，喜欢分享和交流',
        timing: '对方活跃时段',
      })
    } else {
      strategies.push({
        category: '话题',
        action: '选择深度话题进行交流',
        reason: '对方偏内向，更喜欢深度交流',
        timing: '安静的晚上',
      })
    }

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
    history: Array<Record<string, unknown>> | null,
    manualData: Record<string, unknown> | null,
    chatRecordCount: number
  ): FullPortrait {
    const dataSource = (behavior?.data_source as string) || 'none'
    const hasManualData = !!manualData

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
          responsiveness: (portrait?.communication_responsiveness as number) || 50,
          humor: (portrait?.communication_humor as number) || 50,
          depth: (portrait?.communication_depth as number) || 50,
        },
      },
      behaviorPattern: {
        dataSource: dataSource as 'chat_record' | 'manual' | 'none',
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
        manualData: hasManualData ? {
          responseSpeed: manualData.response_speed as 'instant' | 'fast' | 'normal' | 'slow' | 'very_slow' | undefined,
          activeTimeSlots: manualData.active_time_slots as string[] | undefined,
          topicPreferences: manualData.topic_preferences as string[] | undefined,
          communicationStyle: manualData.communication_style as 'direct' | 'indirect' | 'balanced' | undefined,
        } : undefined,
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
      dataSourceStatus: {
        hasChatRecords: chatRecordCount > 0,
        hasManualData,
        chatRecordCount,
      },
      lastUpdated: (portrait?.updated_at as string) || new Date().toISOString(),
    }
  }

  /**
   * 获取默认画像
   */
  private getDefaultPortrait(): Omit<FullPortrait, 'history' | 'dataSourceStatus'> {
    return {
      dimensions: {
        personality: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 },
        emotional: { stability: 50, expression: 50, empathy: 50, independence: 50 },
        social: { activity: 50, initiative: 50, intimacy: 50, trust: 50 },
        communication: { directness: 50, responsiveness: 50, humor: 50, depth: 50 },
      },
      behaviorPattern: {
        dataSource: 'none',
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
