import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils, S3Storage } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 聊天记录来源
export type ChatRecordSource = 'wechat' | 'whatsapp' | 'tinder' | 'manual' | 'other'

// 聊天记录内容类型
export type ChatRecordContentType = 'text' | 'image'

// 解析后的单条消息
export interface ParsedMessage {
  sender: string
  content: string
  timestamp?: string
}

// 聊天记录接口
export interface ChatRecord {
  id: number
  matchId: number
  source: ChatRecordSource
  contentType: ChatRecordContentType
  rawContent: string | null
  parsedMessages: ParsedMessage[]
  imageKey: string | null
  summary: string | null
  keyTopics: string[]
  sentiment: string | null
  messageCount: number
  dateRangeStart: string | null
  dateRangeEnd: string | null
  createdAt: string
  updatedAt: string | null
}

// 创建聊天记录 DTO
export interface CreateChatRecordDto {
  source?: ChatRecordSource
  contentType: ChatRecordContentType
  rawContent?: string
  imageKey?: string
}

@Injectable()
export class ChatRecordService {
  private storage: S3Storage

  constructor() {
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    })
  }

  /**
   * 创建聊天记录（文本粘贴）
   */
  async createFromText(matchId: number, dto: CreateChatRecordDto, req: Request) {
    if (!dto.rawContent?.trim()) {
      return { code: 400, data: null, message: '聊天内容不能为空' }
    }

    // 1. 先插入原始记录
    const insertData = {
      match_id: matchId,
      source: dto.source || 'manual',
      content_type: 'text',
      raw_content: dto.rawContent,
      parsed_messages: [],
      image_key: dto.imageKey || null,
      summary: null,
      key_topics: [],
      sentiment: null,
      message_count: 0,
    }

    const { data, error } = await getSupabaseClient()
      .from('chat_records')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Create chat record error:', error)
      return { code: 500, data: null, message: error.message }
    }

    const recordId = data.id

    // 2. 异步 AI 分析（不阻塞响应）
    this.analyzeAndEnrich(recordId, dto.rawContent, req).catch(err => {
      console.error('AI analyze chat record error:', err)
    })

    return {
      code: 200,
      data: this.transformRecord(data),
      message: 'success',
    }
  }

  /**
   * 创建聊天记录（图片上传）
   */
  async createFromImage(matchId: number, file: Express.Multer.File, dto: CreateChatRecordDto, req: Request) {
    // 1. 上传图片到对象存储
    const ext = file.mimetype?.split('/')[1] || 'jpg'
    const fileKey = await this.storage.uploadFile({
      fileContent: file.buffer,
      fileName: `chat-records/${Date.now()}.${ext}`,
      contentType: file.mimetype || 'image/jpeg',
    })

    console.log('Chat record image uploaded, key:', fileKey)

    // 2. 用 LLM 解析图片中的聊天内容
    let rawContent = ''
    try {
      const imageUrl = await this.storage.generatePresignedUrl({ key: fileKey, expireTime: 600 })
      rawContent = await this.extractTextFromImage(imageUrl, req)
    } catch (err) {
      console.error('Extract text from image error:', err)
      rawContent = '[图片解析失败，请手动输入聊天内容]'
    }

    // 3. 插入记录
    const insertData = {
      match_id: matchId,
      source: dto.source || 'manual',
      content_type: 'image',
      raw_content: rawContent,
      parsed_messages: [],
      image_key: fileKey,
      summary: null,
      key_topics: [],
      sentiment: null,
      message_count: 0,
    }

    const { data, error } = await getSupabaseClient()
      .from('chat_records')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Create chat record from image error:', error)
      return { code: 500, data: null, message: error.message }
    }

    // 4. 异步 AI 分析
    if (rawContent) {
      this.analyzeAndEnrich(data.id, rawContent, req).catch(err => {
        console.error('AI analyze chat record error:', err)
      })
    }

    return {
      code: 200,
      data: this.transformRecord(data),
      message: 'success',
    }
  }

  /**
   * 获取聊天记录列表
   */
  async getRecordsByMatchId(matchId: number, options?: { limit?: number; offset?: number }) {
    let query = getSupabaseClient()
      .from('chat_records')
      .select('*', { count: 'exact' })
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Get chat records error:', error)
      return { code: 500, data: null, message: error.message }
    }

    return {
      code: 200,
      data: {
        list: data?.map(this.transformRecord) || [],
        total: count || 0,
      },
      message: 'success',
    }
  }

  /**
   * 获取聊天记录详情
   */
  async getRecordById(id: number) {
    const { data, error } = await getSupabaseClient()
      .from('chat_records')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return { code: 404, data: null, message: 'Not found' }
    }

    return {
      code: 200,
      data: this.transformRecord(data),
      message: 'success',
    }
  }

  /**
   * 删除聊天记录
   */
  async deleteRecord(id: number) {
    // 先获取记录以删除对象存储中的图片
    const { data: record } = await getSupabaseClient()
      .from('chat_records')
      .select('image_key')
      .eq('id', id)
      .single()

    if (record?.image_key) {
      try {
        await this.storage.deleteFile({ fileKey: record.image_key })
      } catch (err) {
        console.error('Delete chat record image error:', err)
      }
    }

    const { error } = await getSupabaseClient()
      .from('chat_records')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete chat record error:', error)
      return { code: 500, data: null, message: error.message }
    }

    return { code: 200, data: null, message: 'success' }
  }

  // 心情映射：sentiment → mood
  private static SENTIMENT_MOOD_MAP: Record<string, string> = {
    positive: 'good',
    neutral: 'neutral',
    mixed: 'neutral',
    negative: 'bad',
  }

  // 话题 → 活动标签映射
  private static TOPIC_ACTIVITY_MAP: Record<string, string[]> = {
    '日常闲聊': ['日常闲聊'],
    '暧昧': ['暧昧调情'],
    '调情': ['暧昧调情'],
    '倾诉': ['倾诉心事'],
    '心事': ['倾诉心事'],
    '趣事': ['分享趣事'],
    '计划': ['讨论计划'],
    '往事': ['回忆往事'],
    '梦想': ['聊梦想'],
    '烦恼': ['聊烦恼'],
    '童年': ['聊童年'],
    '未来': ['聊未来'],
    '约饭': ['日常闲聊'],
    '约': ['讨论计划'],
    '工作': ['日常闲聊'],
    '感情': ['谈心'],
    '吃': ['日常闲聊'],
    '玩': ['日常闲聊'],
  }

  /**
   * 同步分析聊天内容（不入库，仅供预览）
   */
  async analyzeContent(rawContent: string, req: Request) {
    if (!rawContent?.trim()) {
      return { code: 400, data: null, message: '聊天内容不能为空' }
    }

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const prompt = `你是一个聊天记录分析专家。请分析以下聊天记录，并按 JSON 格式返回分析结果。

聊天记录：
${rawContent.slice(0, 3000)}

请严格按以下 JSON 格式返回（不要其他文字）：
{
  "parsedMessages": [
    { "sender": "发送者名称", "content": "消息内容", "timestamp": "时间（如有）" }
  ],
  "summary": "50字以内的聊天摘要",
  "keyTopics": ["话题1", "话题2"],
  "sentiment": "positive | neutral | mixed | negative",
  "messageCount": 消息总条数,
  "inferredMood": "excellent | good | neutral | awkward | bad",
  "inferredActivities": ["活动标签1", "活动标签2"],
  "inferredDurationMinutes": 推断的聊天时长分钟数（如无法判断则为null）,
  "interestSignals": ["对方表现出的兴趣信号，如主动分享、快速回复等"]
}`

      const response = await client.invoke([
        { role: 'user', content: prompt }
      ], { temperature: 0.1 })

      console.log('Analyze chat content LLM response:', response.content?.slice(0, 200))

      // 解析 JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return { code: 500, data: null, message: 'AI 分析结果解析失败' }
      }

      const analysis = JSON.parse(jsonMatch[0])

      // 映射活动标签：AI 推断 + 话题关键词匹配
      const mappedActivities = new Set<string>()
      if (analysis.inferredActivities?.length) {
        analysis.inferredActivities.forEach((a: string) => mappedActivities.add(a))
      }
      if (analysis.keyTopics?.length) {
        for (const topic of analysis.keyTopics) {
          for (const [keyword, tags] of Object.entries(ChatRecordService.TOPIC_ACTIVITY_MAP)) {
            if (topic.includes(keyword)) {
              tags.forEach(t => mappedActivities.add(t))
            }
          }
        }
      }

      // 映射心情：AI 推断优先，否则从 sentiment 映射
      const inferredMood = analysis.inferredMood
        || ChatRecordService.SENTIMENT_MOOD_MAP[analysis.sentiment]
        || 'neutral'

      return {
        code: 200,
        data: {
          parsedMessages: analysis.parsedMessages || [],
          summary: analysis.summary || '',
          keyTopics: analysis.keyTopics || [],
          sentiment: analysis.sentiment || 'neutral',
          messageCount: analysis.messageCount || 0,
          inferredMood,
          inferredActivities: Array.from(mappedActivities).slice(0, 5),
          inferredDurationMinutes: analysis.inferredDurationMinutes || null,
          interestSignals: analysis.interestSignals || [],
        },
        message: 'success',
      }
    } catch (error) {
      console.error('Analyze chat content error:', error)
      return { code: 500, data: null, message: 'AI 分析失败，请稍后重试' }
    }
  }

  /**
   * AI 分析聊天内容：解析消息、生成摘要、提取话题、判断情感
   */
  private async analyzeAndEnrich(recordId: number, rawContent: string, req: Request) {
    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const prompt = `你是一个聊天记录分析专家。请分析以下聊天记录，并按 JSON 格式返回分析结果。

聊天记录：
${rawContent.slice(0, 3000)}

请严格按以下 JSON 格式返回（不要其他文字）：
{
  "parsedMessages": [
    { "sender": "发送者名称", "content": "消息内容", "timestamp": "时间（如有）" }
  ],
  "summary": "50字以内的聊天摘要",
  "keyTopics": ["话题1", "话题2"],
  "sentiment": "positive | neutral | mixed | negative",
  "messageCount": 消息总条数
}`

      const response = await client.invoke([
        { role: 'user', content: prompt }
      ], { temperature: 0.1 })

      // 解析 JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return

      const analysis = JSON.parse(jsonMatch[0])

      // 更新记录
      await getSupabaseClient()
        .from('chat_records')
        .update({
          parsed_messages: analysis.parsedMessages || [],
          summary: analysis.summary || null,
          key_topics: analysis.keyTopics || [],
          sentiment: analysis.sentiment || null,
          message_count: analysis.messageCount || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recordId)

      console.log('Chat record analyzed and enriched, id:', recordId)
    } catch (error) {
      console.error('Analyze and enrich chat record error:', error)
    }
  }

  /**
   * 用 LLM 从图片中提取聊天文字
   */
  private async extractTextFromImage(imageUrl: string, req: Request): Promise<string> {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const messages = [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: `请将这张聊天截图中的所有对话文字提取出来，保持原始格式，每条消息一行，格式为"发送者: 消息内容"。只输出提取的文字，不要添加任何分析或说明。`,
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
      temperature: 0.1,
    })

    return response.content || ''
  }

  /**
   * 数据库记录 → 接口输出格式
   */
  private transformRecord(data: Record<string, unknown>): ChatRecord {
    return {
      id: data.id as number,
      matchId: data.match_id as number,
      source: (data.source as ChatRecordSource) || 'manual',
      contentType: (data.content_type as ChatRecordContentType) || 'text',
      rawContent: (data.raw_content as string) || null,
      parsedMessages: (data.parsed_messages as ParsedMessage[]) || [],
      imageKey: (data.image_key as string) || null,
      summary: (data.summary as string) || null,
      keyTopics: (data.key_topics as string[]) || [],
      sentiment: (data.sentiment as string) || null,
      messageCount: (data.message_count as number) || 0,
      dateRangeStart: (data.date_range_start as string) || null,
      dateRangeEnd: (data.date_range_end as string) || null,
      createdAt: data.created_at as string,
      updatedAt: (data.updated_at as string) || null,
    }
  }
}
