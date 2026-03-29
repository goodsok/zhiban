import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils, S3Storage } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 消息接口
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// 对话上下文
export interface ChatContext {
  matchId: number
  matchName: string
  hardware: Record<string, unknown>
  software: Record<string, unknown>
  cycleInfo?: {
    day: number
    phase: string
    phaseName: string
    description: string
  }
  relationshipStage: string
  interactionStatus: string
}

// 数据库消息格式
interface DbChatHistory {
  id: number
  match_id: number
  role: string
  content: string
  created_at: string
}

@Injectable()
export class ChatService {
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
   * 获取对话历史
   * @param matchId 对象ID
   * @param limit 限制条数
   */
  async getHistory(matchId: number, limit: number = 50) {
    try {
      const client = getSupabaseClient()
      const { data, error } = await client
        .from('chat_histories')
        .select('id, match_id, role, content, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Get history error:', error)
        return {
          code: 500,
          data: null,
          message: `获取历史记录失败: ${error.message}`,
        }
      }

      const messages = (data as DbChatHistory[]).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      return {
        code: 200,
        data: { messages },
        message: 'success',
      }
    } catch (error) {
      console.error('Get history error:', error)
      return {
        code: 500,
        data: null,
        message: '获取历史记录失败',
      }
    }
  }

  /**
   * 保存消息到数据库
   */
  private async saveMessage(matchId: number, role: string, content: string) {
    try {
      const client = getSupabaseClient()
      const { error } = await client
        .from('chat_histories')
        .insert({
          match_id: matchId,
          role,
          content,
        })

      if (error) {
        console.error('Save message error:', error)
      }
    } catch (error) {
      console.error('Save message error:', error)
    }
  }

  /**
   * 清空对话历史
   */
  async clearHistory(matchId: number) {
    try {
      const client = getSupabaseClient()
      const { error } = await client
        .from('chat_histories')
        .delete()
        .eq('match_id', matchId)

      if (error) {
        console.error('Clear history error:', error)
        return {
          code: 500,
          data: null,
          message: `清空历史记录失败: ${error.message}`,
        }
      }

      return {
        code: 200,
        data: null,
        message: 'success',
      }
    } catch (error) {
      console.error('Clear history error:', error)
      return {
        code: 500,
        data: null,
        message: '清空历史记录失败',
      }
    }
  }

  /**
   * 分析图片内容（聊天场景）
   * @param base64Data 图片base64数据
   * @param context 用户提供的上下文
   * @param req 请求对象
   */
  async analyzeImage(base64Data: string, context: string, req: Request) {
    try {
      // 解析 base64
      const matches = base64Data.match(/^data:(.+);base64,(.+)$/)
      if (!matches) {
        return {
          code: 400,
          data: null,
          message: '无效的图片格式',
        }
      }

      const contentType = matches[1]
      const buffer = Buffer.from(matches[2], 'base64')

      // 上传到对象存储
      const ext = contentType.split('/')[1] || 'jpg'
      const key = await this.storage.uploadFile({
        fileContent: buffer,
        fileName: `chat-analysis/${Date.now()}.${ext}`,
        contentType,
      })

      const imageUrl = await this.storage.generatePresignedUrl({ key, expireTime: 600 })

      // 调用多模态LLM分析
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const messages = [
        {
          role: 'user' as const,
          content: [
            {
              type: 'text' as const,
              text: `请分析这张图片的内容。${context ? `用户的问题或上下文：${context}` : ''}

如果是聊天记录截图，请提取：
1. 聊天的主要内容
2. 双方的语气和态度
3. 可能的关系状态
4. 任何值得注意的细节

如果是朋友圈截图，请提取：
1. 发布的内容和图片描述
2. 可能反映的性格特点
3. 兴趣爱好线索
4. 发布时间和互动情况

如果是个人照片，请提取：
1. 人物特征
2. 穿搭风格
3. 可能的场景和活动
4. 其他可见信息

请用简洁的中文回复，控制在100字以内。`,
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

      return {
        code: 200,
        data: { analysis: response.content },
        message: 'success',
      }
    } catch (error) {
      console.error('Analyze image error:', error)
      return {
        code: 500,
        data: null,
        message: '图片分析失败',
      }
    }
  }

  /**
   * AI对话接口
   * @param messages 对话历史
   * @param context 对象档案上下文
   * @param req 请求对象
   * @param imageContext 图片分析上下文
   */
  async chat(
    messages: ChatMessage[],
    context: ChatContext | null,
    req: Request,
    imageContext?: string
  ) {
    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      // 构建系统提示词
      const systemPrompt = this.buildSystemPrompt(context)

      // 如果有图片上下文，添加到系统提示词
      const finalSystemPrompt = imageContext 
        ? `${systemPrompt}\n\n**用户上传的图片分析**：${imageContext}`
        : systemPrompt

      // 构建完整消息列表
      const fullMessages = [
        { role: 'system' as const, content: finalSystemPrompt },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))
      ]

      const response = await client.invoke(fullMessages, { temperature: 0.8 })

      // 保存用户消息和AI回复到数据库
      if (context?.matchId && messages.length > 0) {
        const lastMessage = messages[messages.length - 1]
        if (lastMessage.role === 'user') {
          await this.saveMessage(context.matchId, 'user', lastMessage.content)
        }
        await this.saveMessage(context.matchId, 'assistant', response.content)
      }

      return {
        code: 200,
        data: {
          content: response.content,
        },
        message: 'success',
      }
    } catch (error) {
      console.error('Chat error:', error)
      return {
        code: 500,
        data: null,
        message: 'AI服务暂时不可用，请稍后再试',
      }
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(context: ChatContext | null): string {
    const basePrompt = `你是一位专业的关系顾问和恋爱教练，你的名字叫"小助手"。
你的职责是帮助用户更好地理解对方、推进关系发展。

**你的风格**：
- 简洁明了，不说废话
- 给出具体可执行的建议
- 考虑对方的特点和感受
- 适时提醒注意事项

**回复原则**：
1. 先理解用户的问题和情绪
2. 结合对方档案信息给出针对性建议
3. 如果涉及周期状态，要特别提醒
4. 建议要具体、可操作
5. 控制回复在150字以内`

    if (!context) {
      return basePrompt + `

**当前状态**：用户尚未选择具体的对象，请引导用户先选择或创建对象档案。`
    }

    // 构建档案信息
    const hw = context.hardware as Record<string, unknown>
    const sw = context.software as Record<string, unknown>

    const hardwareInfo: string[] = []
    if (hw?.age) hardwareInfo.push(`年龄：${hw.age}岁`)
    if (hw?.zodiac) hardwareInfo.push(`星座：${hw.zodiac}`)
    if (hw?.occupation) hardwareInfo.push(`职业：${hw.occupation}`)
    if (hw?.location) hardwareInfo.push(`所在地：${hw.location}`)

    const softwareInfo: string[] = []
    if (sw?.mbti) softwareInfo.push(`MBTI：${sw.mbti}`)
    if (sw?.personality) softwareInfo.push(`性格：${sw.personality}`)
    if (sw?.interests && Array.isArray(sw.interests)) softwareInfo.push(`兴趣：${sw.interests.join('、')}`)

    // 交流偏好
    const commPrefs: string[] = []
    const comm = sw?.communicationPreferences as Record<string, string[]> | undefined
    if (comm?.effectiveWays?.length) commPrefs.push(`有效方式：${comm.effectiveWays.join('、')}`)
    if (comm?.ineffectiveWays?.length) commPrefs.push(`无效方式：${comm.ineffectiveWays.join('、')}`)
    if (comm?.landmines?.length) commPrefs.push(`雷区：${comm.landmines.join('、')}`)

    // 爱的语言
    const loveLangs = sw?.loveLanguages as string[] | undefined
    const loveLangsStr = loveLangs?.length ? loveLangs.join(' > ') : null

    // 周期信息
    const cycleStr = context.cycleInfo
      ? `当前阶段：${context.cycleInfo.phaseName}（Day ${context.cycleInfo.day}）\n状态：${context.cycleInfo.description}`
      : '未设置周期信息'

    // 关系阶段标签
    const stageLabels: Record<string, string> = {
      new: '刚认识',
      contacting: '接触中',
      dating: '约会中',
      progressing: '发展中',
    }
    const statusLabels: Record<string, string> = {
      just_met: '一面之缘',
      got_contact: '有联系方式',
      chatted: '聊过天',
      good_vibe: '聊得不错',
      met_up: '见过面',
      dating_regularly: '稳定约会',
      ambiguous: '暧昧期',
      confirming: '准备确认',
    }

    return `${basePrompt}

**当前对象档案**：
【基本信息】
姓名：${context.matchName}
${hardwareInfo.join('\n')}
${softwareInfo.join('\n')}

【关系状态】
阶段：${stageLabels[context.relationshipStage] || context.relationshipStage}
状态：${statusLabels[context.interactionStatus] || context.interactionStatus}

【交流偏好】
${commPrefs.join('\n') || '暂无信息'}

【爱的语言排序】
${loveLangsStr || '暂无信息'}

【激素周期状态】
${cycleStr}

**特别提醒**：
- 如果处于月经期或PMS期，建议要更温和、给更多空间
- 结合对方的MBTI和交流偏好，选择合适的沟通方式
- 避开已知的雷区`
  }
}
