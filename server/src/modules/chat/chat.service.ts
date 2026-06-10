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
  cycleInfo?: {
    day: number
    phase: string
    phaseName: string
    description: string
  }
}

// 数据库消息格式
interface DbChatHistory {
  id: number
  match_id: number
  role: string
  content: string
  created_at: string
}

// 提取的关键信息
interface ExtractedInfo {
  hardware?: {
    age?: number
    birthday?: string
    zodiac?: string
    risingZodiac?: string
    location?: string
    occupation?: string
    height?: string
  }
  software?: {
    mbti?: string
    personality?: string
    interests?: string[]
    likes?: string
    dislikes?: string
    communicationPreferences?: {
      effectiveWays?: string[]
      ineffectiveWays?: string[]
      landmines?: string[]
    }
    loveLanguages?: string[]
  }
  keyInfo?: Array<{
    type: string
    label: string
    value: string
  }>
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
   * 清理LLM返回的内容，去除think标签和重复内容
   */
  private cleanLLMContent(content: string): string {
    let cleaned = content
    
    // 移除豆包模型的内部标签（think/thinking/[SILENT] 等）
    // doubao-seed 模型在 thinking: disabled 下仍可能输出 <think_xxx>、<[SILENT_xxx]> 等内部标记
    // 这些是模型推理过程的内部标识，不应展示给用户
    cleaned = cleaned.replace(/<\[?\s*(think|thinking|SILENT)[^>\]]*\s*\]?>([\s\S]*?)<\[?\s*\/\s*(think|thinking|SILENT)[^>\]]*\s*\]?>/gi, '')
    cleaned = cleaned.replace(/<\[?\s*(think|thinking|SILENT)[^>\]]*\s*\]?>/gi, '')
    
    // 移除开头可能的孤立标签（没有闭合的情况）
    cleaned = cleaned.replace(/^<[^>]+>/i, '')
    
    // 清理多余空白
    cleaned = cleaned.trim()
    
    // 检查是否有重复内容（内容出现两次）
    if (cleaned.length > 100) {
      const halfLen = Math.floor(cleaned.length / 2)
      const firstHalf = cleaned.substring(0, halfLen).trim()
      const secondHalf = cleaned.substring(halfLen).trim()
      
      // 如果相似度超过80%，认为是重复
      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const similarity = this.calculateSimilarity(firstHalf, secondHalf)
        if (similarity > 0.8) {
          cleaned = firstHalf
        }
      }
    }
    
    return cleaned
  }

  /**
   * 计算两个字符串的相似度
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length
    const len2 = str2.length
    const maxLen = Math.max(len1, len2)
    
    if (maxLen === 0) return 1
    
    // 简单的相似度计算：计算相同字符的比例
    let matches = 0
    const minLen = Math.min(len1, len2)
    for (let i = 0; i < minLen; i++) {
      if (str1[i] === str2[i]) matches++
    }
    
    return matches / maxLen
  }

  /**
   * 从对话内容中提取关键信息
   */
  private async extractKeyInfoFromChat(
    userMessage: string,
    assistantReply: string,
    context: ChatContext | null,
    req: Request
  ): Promise<ExtractedInfo | null> {
    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const extractPrompt = `你是一个信息提取助手。请从以下对话中提取关于对方的关键信息。

用户说：${userMessage}
助手回复：${assistantReply}

请提取以下类型的信息（如果对话中有提到）：
- 年龄 (age)
- 生日 (birthday，格式如 "6月15日")
- 星座 (zodiac)
- 上升星座 (risingZodiac)
- 身高 (height)
- 所在地 (location)
- 职业 (occupation)
- MBTI
- 性格特点 (personality)
- 兴趣爱好 (interests，数组)
- 喜欢的事物 (likes)
- 讨厌的事物 (dislikes)
- 沟通偏好 (communicationPreferences，嵌套对象):
  - effectiveWays: 有效的沟通方式数组
  - ineffectiveWays: 无效的沟通方式数组
  - landmines: 雷区/忌讳数组
- 爱的语言 (loveLanguages，数组，可选值: "精心时刻"、"肯定的言辞"、"接受礼物"、"服务的行动"、"身体接触")
- 其他重要信息 (keyInfo，如纪念日、特殊习惯等)

请严格按以下JSON格式返回（注意 communicationPreferences 是嵌套对象）：
{
  "hardware": {
    "age": 数字或null,
    "birthday": "字符串或null",
    "zodiac": "字符串或null",
    "risingZodiac": "字符串或null",
    "location": "字符串或null",
    "occupation": "字符串或null",
    "height": "字符串或null"
  },
  "software": {
    "mbti": "字符串或null",
    "personality": "字符串或null",
    "interests": ["数组"] 或 null,
    "likes": "字符串或null",
    "dislikes": "字符串或null",
    "communicationPreferences": {
      "effectiveWays": ["数组"] 或 null,
      "ineffectiveWays": ["数组"] 或 null,
      "landmines": ["数组"] 或 null
    },
    "loveLanguages": ["数组"] 或 null
  },
  "keyInfo": [
    {"type": "类型", "label": "标签", "value": "值"}
  ] 或 null
}

只返回JSON，不要其他文字。如果没有提取到任何信息，返回空对象 {}`

      const response = await client.invoke([
        { role: 'user', content: extractPrompt }
      ], { model: 'doubao-seed-2-0-pro-260215', temperature: 0.1, thinking: 'disabled' })

      // 解析JSON响应
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]) as ExtractedInfo
          // 只有提取到有效信息才返回
          if (Object.keys(extracted).length > 0) {
            return extracted
          }
        }
      } catch (parseError) {
        console.error('Parse extracted info error:', parseError)
      }

      return null
    } catch (error) {
      console.error('Extract key info error:', error)
      return null
    }
  }

  /**
   * 更新档案信息
   */
  private async updateMatchProfile(matchId: number, extractedInfo: ExtractedInfo) {
    try {
      const client = getSupabaseClient()
      
      // 获取当前档案
      const { data: currentMatch } = await client
        .from('matches')
        .select('hardware, software, key_info')
        .eq('id', matchId)
        .single()

      if (!currentMatch) return

      const currentHardware = (currentMatch as { hardware: Record<string, unknown>; software: Record<string, unknown>; key_info: unknown }).hardware || {}
      const currentSoftware = (currentMatch as { hardware: Record<string, unknown>; software: Record<string, unknown>; key_info: unknown }).software || {}
      const currentKeyInfo = Array.isArray((currentMatch as { hardware: Record<string, unknown>; software: Record<string, unknown>; key_info: unknown }).key_info) 
        ? (currentMatch as { hardware: Record<string, unknown>; software: Record<string, unknown>; key_info: Array<{ type: string; label: string; value: string }> }).key_info 
        : []

      // 合并新信息（不覆盖已有信息）
      const newHardware = { ...extractedInfo.hardware, ...currentHardware }
      const newSoftware = { ...extractedInfo.software, ...currentSoftware }
      
      // 合并兴趣爱好
      if (extractedInfo.software?.interests?.length) {
        const existingInterests = Array.isArray(currentSoftware.interests) ? currentSoftware.interests as string[] : []
        newSoftware.interests = [...new Set([...existingInterests, ...extractedInfo.software.interests])]
      }

      // 合并交流偏好
      if (extractedInfo.software?.communicationPreferences) {
        const currentComm = currentSoftware.communicationPreferences as Record<string, string[]> | undefined
        newSoftware.communicationPreferences = {
          effectiveWays: [
            ...new Set([
              ...(currentComm?.effectiveWays || []),
              ...(extractedInfo.software.communicationPreferences.effectiveWays || [])
            ])
          ],
          ineffectiveWays: [
            ...new Set([
              ...(currentComm?.ineffectiveWays || []),
              ...(extractedInfo.software.communicationPreferences.ineffectiveWays || [])
            ])
          ],
          landmines: [
            ...new Set([
              ...(currentComm?.landmines || []),
              ...(extractedInfo.software.communicationPreferences.landmines || [])
            ])
          ],
        }
      }

      // 合并爱的语言
      if (extractedInfo.software?.loveLanguages?.length) {
        const existingLoveLangs = Array.isArray(currentSoftware.loveLanguages) ? currentSoftware.loveLanguages as string[] : []
        newSoftware.loveLanguages = [...new Set([...existingLoveLangs, ...extractedInfo.software.loveLanguages])]
      }

      // 合并关键信息
      let newKeyInfo = [...currentKeyInfo]
      if (extractedInfo.keyInfo?.length) {
        for (const info of extractedInfo.keyInfo) {
          const exists = newKeyInfo.some(k => k.type === info.type && k.value === info.value)
          if (!exists) {
            newKeyInfo.push(info)
          }
        }
      }

      // 更新数据库
      await client
        .from('matches')
        .update({
          hardware: newHardware,
          software: newSoftware,
          key_info: newKeyInfo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchId)

      console.log('Profile updated with extracted info for match:', matchId)
    } catch (error) {
      console.error('Update match profile error:', error)
    }
  }

  /**
   * 生成智能快捷问题
   * 根据用户与对象的互动状态、聊天内容推测困惑，给出推进关系的建议
   * @param context 对象上下文
   * @param req 请求对象
   * @param currentMessages 当前会话的消息（用于实时推荐）
   */
  async generateQuickQuestions(context: ChatContext | null, req: Request, currentMessages: ChatMessage[] = []): Promise<string[]> {
    if (!context) {
      return ['如何开始使用？', '怎么创建对象档案？', '这个应用能帮我什么？', '怎么添加对象信息？', '如何获取AI建议？', '怎么记录互动？']
    }

    try {
      const client = getSupabaseClient()

      // 1. 获取数据库中的聊天历史
      const { data: chatHistory } = await client
        .from('chat_histories')
        .select('role, content, created_at')
        .eq('match_id', context.matchId)
        .order('created_at', { ascending: false })
        .limit(10)

      const recentDbChats = (chatHistory || []) as Array<{ role: string; content: string; created_at: string }>

      // 2. 使用传入的 context 作为主要信息来源
      const cycleInfo = context.cycleInfo

      // 3. 构建聊天摘要：优先使用当前会话消息，再补充数据库历史
      const currentSessionSummary = currentMessages
        .slice(-8)
        .map(m => `${m.role === 'user' ? '用户' : 'AI'}：${m.content.slice(0, 80)}`)
        .join('\n')

      const dbHistorySummary = recentDbChats
        .slice(0, 6)
        .reverse()
        .map(c => `${c.role === 'user' ? '用户' : 'AI'}：${c.content.slice(0, 80)}`)
        .join('\n')

      // 优先使用当前会话消息，如果没有再用数据库历史
      const chatSummary = currentSessionSummary || dbHistorySummary
      const hasActiveChat = currentSessionSummary.length > 0 || recentDbChats.length >= 2

      // 4. 如果有聊天内容，用 LLM 分析用户关注点并生成个性化问题
      if (hasActiveChat) {
        try {
          const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
          const config = new Config()
          const llmClient = new LLMClient(config, customHeaders)

          const prompt = `分析用户聊天记录，推测用户困惑，生成6个后续问题。

困惑：不知道怎么推进关系、需要更多了解对方

聊天记录：
${chatSummary}

要求：
1. 针对聊天中提到的具体问题，生成用户可能想继续问的问题
2. 问题要多样化：有的追问细节，有的拓展方向，有的给建议
3. 每问一行，15字内，不要编号
4. 生成6个问题`

          const response = await llmClient.invoke([
            { role: 'user', content: prompt }
          ], { model: 'doubao-seed-2-0-pro-260215', temperature: 0.7 })

          const questions = response.content
            .split('\n')
            .map(q => q.replace(/^[-•\d.、)]+\s*/, '').trim())
            .filter(q => q.length > 0 && q.length <= 20)
            .slice(0, 6)

          if (questions.length >= 3) {
            // 补充预设问题到6个
            const contextQuestions = this.getContextualQuickQuestions(cycleInfo)
            while (questions.length < 6 && contextQuestions.length > 0) {
              const candidate = contextQuestions.find(q => !questions.includes(q))
              if (candidate) {
                questions.push(candidate)
              } else {
                break
              }
            }
            return questions
          }
        } catch (llmError) {
          console.error('LLM generate questions error:', llmError)
        }
      }

      // 5. 使用预设的问题（返回6个，供前端轮换）
      return this.getContextualQuickQuestions(cycleInfo, true)
    } catch (error) {
      console.error('Generate quick questions error:', error)
      return this.getContextualQuickQuestions(context.cycleInfo, true)
    }
  }

  /**
   * 根据周期信息获取上下文相关的快捷问题
   * 注意：这些问题是用户会问AI助手的问题，不是问对象的问题
   */
  private getContextualQuickQuestions(
    cycleInfo?: { day: number; phase: string; phaseName: string; description: string },
    extended: boolean = false
  ): string[] {
    // 默认问题
    const defaultQuestions = [
      '怎么推进我们的关系？',
      '怎么找话题聊天？',
      '怎么约她出来见面？',
    ]

    const extendedDefaultQuestions = [
      ...defaultQuestions,
      '帮我分析一下TA的性格',
      '约会适合去哪里？',
      '怎么让她更开心？',
    ]

    // 如果有周期信息，根据周期阶段调整问题
    if (cycleInfo) {
      if (cycleInfo.phase === 'menstrual') {
        return extended
          ? ['怎么推进我们的关系？', '怎么关心她的身体？', '她经期怎么照顾她？', '经期送什么礼物好？', '怎么让她感到被关心？', '有什么暖心的做法？']
          : ['怎么推进我们的关系？', '怎么关心她的身体？', '她经期怎么照顾她？']
      } else if (cycleInfo.phase === 'ovulation') {
        return extended
          ? ['怎么推进我们的关系？', '怎么约她出来？', '现在约她合适吗？', '适合什么样的约会？', '怎么制造浪漫氛围？', '怎么表达我的心意？']
          : ['怎么推进我们的关系？', '怎么约她出来？', '现在约她合适吗？']
      } else if (cycleInfo.phase === 'luteal_late') {
        return extended
          ? ['怎么推进我们的关系？', '她情绪不好怎么安慰？', '怎么让她开心起来？', 'PMS期要避免什么？', '怎么给她安全感？', '什么时候该给她空间？']
          : ['怎么推进我们的关系？', '她情绪不好怎么安慰？', '怎么让她开心起来？']
      }
    }

    return extended ? extendedDefaultQuestions : defaultQuestions
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
        model: 'doubao-seed-2-0-pro-260215',
        temperature: 0.3,
        thinking: 'disabled',
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
    imageContext?: string,
    style: 'warm' | 'real' = 'warm'
  ) {
    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      // 构建系统提示词
      const systemPrompt = await this.buildSystemPrompt(context, style)

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

      const response = await client.invoke(fullMessages, { model: 'doubao-seed-2-0-pro-260215', temperature: 0.8, thinking: 'disabled' })

      // 清理LLM返回的内容
      const cleanedContent = this.cleanLLMContent(response.content)

      // 保存用户消息和AI回复到数据库
      if (context?.matchId && messages.length > 0) {
        const lastMessage = messages[messages.length - 1]
        if (lastMessage.role === 'user') {
          await this.saveMessage(context.matchId, 'user', lastMessage.content)
        }
        await this.saveMessage(context.matchId, 'assistant', cleanedContent)

        // 异步提取关键信息并更新档案（不阻塞响应）
        this.extractAndUpdateProfile(lastMessage.content, cleanedContent, context, req).catch(err => {
          console.error('Extract and update profile error:', err)
        })
      }

      return {
        code: 200,
        data: {
          content: cleanedContent,
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
   * 提取关键信息并更新档案
   */
  private async extractAndUpdateProfile(
    userMessage: string,
    assistantReply: string,
    context: ChatContext,
    req: Request
  ) {
    try {
      const extractedInfo = await this.extractKeyInfoFromChat(userMessage, assistantReply, context, req)
      if (extractedInfo && Object.keys(extractedInfo).length > 0) {
        await this.updateMatchProfile(context.matchId, extractedInfo)
      }
    } catch (error) {
      console.error('Extract and update profile error:', error)
    }
  }

  /**
   * 构建系统提示词
   */
  private async buildSystemPrompt(context: ChatContext | null, style: 'warm' | 'real' = 'warm'): Promise<string> {
    const warmPrompt = `你是一位专业的关系顾问和恋爱教练，你的名字叫"小助手"。
你的职责是帮助用户更好地理解对方、推进关系发展。

你的风格：
- 简洁明了，不说废话
- 给出具体可执行的建议
- 考虑对方的特点和感受
- 适时提醒注意事项

回复原则：
1. 先理解用户的问题和情绪
2. 结合对方档案信息给出针对性建议
3. 如果涉及周期状态，要特别提醒
4. 建议要具体、可操作
5. 控制回复在150字以内
6. 使用纯文本回复，不要使用 **加粗**、# 标题等 markdown 格式

格式要求：
- 用中文逗号、句号等标点
- 维度名称用中文名，不要用英文 key
- 分点时用数字或顿号，不用 markdown 列表符号`

    const realPrompt = `你是一个基于真实社交心理学原理的对话顾问，你的名字叫"小助手"。
你的核心原则是真实优先——宁可让人不舒服但有用，也不让人舒服但没用。

你的风格：
- 先给判断，再给理由。不要铺垫、不要先夸再批评
- 你的价值在于提供用户想不到的视角，不是附和用户已有的想法
- 话术要有节奏感：有松有紧，不要每句都热情，偶尔简短、偶尔冷淡
- 话术要主动设定对话方向，而不是顺着对方的框架走
- 好的话术要让对方产生情绪起伏（好奇、不服、笑、思考），而不是只有"被关注"的单一情绪
- 话术中要有"我不总是可及"的信号，不要表现出随时待命

回复原则：
1. 如果用户的做法是讨好型，直接指出，用"你现在的做法是XXX，这会让对方觉得XXX"的句式
2. 如果用户问"她/他什么意思"，先分析对方的心理动机，再给应对策略，不要直接给安慰
3. 每条建议必须包含"为什么有效"——即背后的心理学原理，让用户知其然也知其所以然
4. 禁止生成"早安晚安""在干嘛""多喝热水"等零信息量附和型话术
5. 如果涉及周期状态，用事实提醒，不用过度关怀的语气
6. 控制回复在200字以内
7. 使用纯文本回复，不要使用 **加粗**、# 标题等 markdown 格式
8. 不要主动道歉，除非真的犯了错
9. 不要在没有信息增量时附和——"对！""没错！""说得好！"这类回复禁止使用

格式要求：
- 用中文逗号、句号等标点
- 维度名称用中文名，不要用英文 key
- 分点时用数字或顿号，不用 markdown 列表符号`

    const basePrompt = style === 'real' ? realPrompt : warmPrompt

    if (!context) {
      return basePrompt + `

当前状态：用户尚未选择具体的对象，请引导用户先选择或创建对象档案。`
    }

    // 从维度表获取档案信息和维度定义
    const client = getSupabaseClient()
    const { data: dimensions } = await client
      .from('profile_dimension_values')
      .select('dimension_key, value')
      .eq('match_id', context.matchId)

    // 获取所有维度定义（key -> display_name 映射）
    const { data: dimDefs } = await client
      .from('dimension_definitions')
      .select('dimension_key, display_name, category, enum_options, sort_order')

    const defMap = new Map((dimDefs || []).map(d => [d.dimension_key, d]))
    const dimMap = new Map((dimensions || []).map(d => [d.dimension_key, d.value]))

    // 将 enum value 转为中文 label
    const getDisplayValue = (key: string, value: any): string => {
      if (value === null || value === undefined || value === '') return ''
      const def = defMap.get(key)
      if (def?.enum_options && Array.isArray(def.enum_options)) {
        const opt = def.enum_options.find(o => o.value === value)
        if (opt) return opt.label
      }
      // birthYear 特殊处理：转为年龄
      if (key === 'birthYear' && typeof value === 'number') {
        return `约${new Date().getFullYear() - value}岁`
      }
      return String(value)
    }

    // 按分类分组构建档案摘要
    const categoryNames: Record<string, string> = {
      identity: '基本身份',
      education: '教育职业',
      family: '家庭背景',
      appearance: '外貌特征',
      life_stage: '人生阶段',
      core_personality: '核心性格',
      values: '价值观念',
      relationship_intent: '恋爱意图',
      location: '地理位置',
      skills: '技能特长',
      personality: '性格维度',
      emotion: '情感特质',
      social: '社交风格',
      communication: '沟通风格',
      life_attitude: '生活态度',
      love_style: '恋爱风格',
      interests: '兴趣爱好',
      lifestyle: '生活方式',
      dating: '约会偏好',
      communication_pref: '沟通偏好',
      current: '当前状态',
      sexual_intimacy: '亲密关系',
      relationship_form: '关系形式',
      emotional_investment: '情感投入',
      time_availability: '时间可用性',
      privacy_public: '隐私公开',
      short_term_patterns: '短期模式',
      dating_dynamics: '约会动态',
      current_status: '当前状态',
      custom: '自定义',
    }

    const groupedInfo: Record<string, string[]> = {}
    const categoryOrder = ['identity', 'education', 'family', 'appearance', 'life_stage', 'core_personality', 'values', 'relationship_intent', 'location', 'skills', 'personality', 'emotion', 'social', 'communication', 'life_attitude', 'love_style', 'interests', 'lifestyle', 'dating', 'communication_pref', 'current', 'sexual_intimacy', 'relationship_form', 'emotional_investment', 'time_availability', 'privacy_public', 'short_term_patterns', 'dating_dynamics', 'current_status', 'custom']

    for (const dim of (dimensions || [])) {
      const displayVal = getDisplayValue(dim.dimension_key, dim.value)
      if (!displayVal) continue
      const def = defMap.get(dim.dimension_key)
      if (!def) continue
      const cat = def.category
      if (!groupedInfo[cat]) groupedInfo[cat] = []
      groupedInfo[cat].push(`${def.display_name}：${displayVal}`)
    }

    // 按分类顺序拼接
    const infoLines: string[] = []
    for (const cat of categoryOrder) {
      if (groupedInfo[cat]?.length) {
        infoLines.push(`【${categoryNames[cat] || cat}】\n${groupedInfo[cat].join('\n')}`)
      }
    }

    // 从数据库直接获取周期信息（优先级高于前端传递的context）
    const { data: matchData } = await client
      .from('matches')
      .select('cycle_start_date, cycle_length')
      .eq('id', context.matchId)
      .single()

    // 构建周期信息
    let cycleStr = '未设置周期信息'
    if (matchData?.cycle_start_date && matchData?.cycle_length) {
      const startDate = new Date(matchData.cycle_start_date)
      const now = new Date()
      const diffTime = now.getTime() - startDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const dayInCycle = (diffDays % matchData.cycle_length) + 1
      const length = matchData.cycle_length

      // 周期阶段计算
      let phaseName = ''
      let description = ''
      if (dayInCycle <= 5) {
        phaseName = '月经期'
        description = '身体需要休息，多关心体贴'
      } else if (dayInCycle <= Math.round(length * 0.45)) {
        phaseName = '卵泡期'
        description = '精力恢复，状态回升'
      } else if (dayInCycle <= Math.round(length * 0.5)) {
        phaseName = '排卵期'
        description = '精力充沛，社交欲望增强'
      } else if (dayInCycle <= Math.round(length * 0.7)) {
        phaseName = '黄体早期'
        description = '情绪稳定，适合深入交流'
      } else if (dayInCycle <= Math.round(length * 0.85)) {
        phaseName = '黄体中期'
        description = '可能开始出现经前症状'
      } else {
        phaseName = '黄体晚期/PMS'
        description = '情绪敏感，需要更多耐心和关怀'
      }

      cycleStr = `当前阶段：${phaseName}（周期第${dayInCycle}天，周期${length}天）\n状态：${description}`
    } else if (context.cycleInfo) {
      // 降级：如果数据库没有，使用前端传递的cycleInfo
      cycleStr = `当前阶段：${context.cycleInfo.phaseName}（Day ${context.cycleInfo.day}）\n状态：${context.cycleInfo.description}`
    }

    const specialReminder = style === 'real'
      ? `特别提醒：
- 如果处于月经期或PMS期，这是生理事实，提醒用户注意但不要过度关怀，给对方空间
- 鼓励用户完善档案信息，信息越全建议越准`
      : `特别提醒：
- 如果处于月经期或PMS期，建议要更温和、给更多空间
- 鼓励用户完善档案信息，以便提供更精准的建议`

    return `${basePrompt}

当前对象档案：
姓名：${context.matchName}
${infoLines.length > 0 ? infoLines.join('\n\n') : '暂无详细信息'}

【激素周期状态】
${cycleStr}

${specialReminder}

输出格式要求（必须严格遵守）：
1. 使用纯文本，绝对不要使用星号加粗、下划线斜体、删除线、井号标题、反引号代码 等 markdown 格式
2. 提到档案维度时，必须使用中文名称（如"依恋类型"而非"attachmentStyle"），必须使用中文标签（如"安全型"而非"secure"）
3. 绝对不要在回复中出现英文下划线格式的值（如 risk_averse、never_used 等），一律用中文表述`
  }
}
