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

// 提取的关键信息
interface ExtractedInfo {
  hardware?: {
    age?: number
    birthday?: string
    zodiac?: string
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
- 身高 (height)
- 所在地 (location)
- 职业 (occupation)
- MBTI
- 性格特点 (personality)
- 兴趣爱好 (interests，数组)
- 喜欢的事物 (likes)
- 讨厌的事物 (dislikes)
- 有效的交流方式 (effectiveWays)
- 无效的交流方式 (ineffectiveWays)
- 雷区/忌讳 (landmines)
- 爱的语言 (loveLanguages)
- 其他重要信息 (keyInfo，如纪念日、特殊习惯等)

请以JSON格式返回，格式如下：
{
  "hardware": {
    "age": 数字或null,
    "birthday": "字符串或null",
    ...
  },
  "software": {
    "mbti": "字符串或null",
    "interests": ["数组"] 或 null,
    ...
  },
  "keyInfo": [
    {"type": "类型", "label": "标签", "value": "值"}
  ] 或 null
}

只返回JSON，不要其他文字。如果没有提取到任何信息，返回空对象 {}`

      const response = await client.invoke([
        { role: 'user', content: extractPrompt }
      ], { temperature: 0.1 })

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
   */
  async generateQuickQuestions(context: ChatContext | null, req: Request): Promise<string[]> {
    if (!context) {
      return ['如何开始使用？', '怎么创建对象档案？', '这个应用能帮我什么？']
    }

    try {
      const client = getSupabaseClient()

      // 1. 获取最近的聊天历史
      const { data: chatHistory } = await client
        .from('chat_histories')
        .select('role, content, created_at')
        .eq('match_id', context.matchId)
        .order('created_at', { ascending: false })
        .limit(10)

      const recentChats = (chatHistory || []) as Array<{ role: string; content: string; created_at: string }>
      
      // 2. 使用传入的 context 作为主要信息来源（前端状态是最新的）
      const interactionStatus = context.interactionStatus
      const cycleInfo = context.cycleInfo

      // 3. 如果有聊天历史，用 LLM 分析用户关注点并生成个性化问题
      if (recentChats.length >= 2) {
        try {
          const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
          const config = new Config()
          const llmClient = new LLMClient(config, customHeaders)

          const chatSummary = recentChats
            .slice(0, 6)
            .reverse()
            .map(c => `${c.role === 'user' ? '用户' : 'AI'}：${c.content.slice(0, 80)}`)
            .join('\n')

          const prompt = `分析用户聊天记录，推测用户困惑，生成3个后续问题。

阶段：${interactionStatus}
困惑：${this.getConfusionByStatus(interactionStatus)}

聊天记录：
${chatSummary}

要求：针对聊天中提到的具体问题，生成用户可能想继续问的问题。
每问一行，15字内，不要编号：`

          const response = await llmClient.invoke([
            { role: 'user', content: prompt }
          ], { temperature: 0.7 })

          const questions = response.content
            .split('\n')
            .map(q => q.replace(/^[-•\d.、)]+\s*/, '').trim())
            .filter(q => q.length > 0 && q.length <= 20)
            .slice(0, 3)

          if (questions.length === 3) {
            return questions
          }
        } catch (llmError) {
          console.error('LLM generate questions error:', llmError)
        }
      }

      // 4. 使用预设的阶段问题
      return this.getContextualQuickQuestions(
        context.relationshipStage, 
        interactionStatus, 
        cycleInfo
      )
    } catch (error) {
      console.error('Generate quick questions error:', error)
      return this.getContextualQuickQuestions(
        context.relationshipStage, 
        context.interactionStatus, 
        context.cycleInfo
      )
    }
  }

  /**
   * 根据互动状态获取用户可能的困惑描述
   */
  private getConfusionByStatus(status: string): string {
    const confusions: Record<string, string> = {
      just_met: '刚认识，不知道怎么留下好印象、怎么要联系方式',
      got_contact: '有联系方式但不知道怎么开场、怕第一条消息发不好',
      chatted: '聊过但不够深入，不知道怎么约出来、不确定对方是否感兴趣',
      good_vibe: '感觉不错但不知道怎么升级关系、什么时候约合适',
      met_up: '见过面了但不知道约会效果如何、怎么继续推进',
      dating_regularly: '经常约会但不知道怎么更进一步、什么时候表白',
      ambiguous: '暧昧期卡住了，想突破又怕失去、不确定对方心意',
      confirming: '准备确认关系但不知道怎么表白、怕被拒绝',
    }
    return confusions[status] || '不知道怎么推进关系'
  }

  /**
   * 根据互动状态获取上下文相关的快捷问题
   * 注意：这些问题是用户会问AI助手的问题，不是问对象的问题
   */
  private getContextualQuickQuestions(
    relationshipStage: string, 
    interactionStatus: string, 
    cycleInfo?: { day: number; phase: string; phaseName: string; description: string }
  ): string[] {
    const questions: string[] = []

    // 根据互动状态给出用户最可能问AI的问题
    const statusQuestions: Record<string, string[]> = {
      just_met: [
        '怎么自然地认识她？',
        '怎么给她留下好印象？',
        '怎么要联系方式不尴尬？'
      ],
      got_contact: [
        '第一条消息发什么好？',
        '怎么开场不会被冷落？',
        '怎么找共同话题？'
      ],
      chatted: [
        '怎么让聊天更深入？',
        '怎么约她出来见面？',
        '她回复慢是不感兴趣吗？'
      ],
      good_vibe: [
        '怎么升级关系？',
        '什么时候约她合适？',
        '怎么试探她的心意？'
      ],
      met_up: [
        '约会后怎么跟进？',
        '怎么判断约会效果？',
        '下次约什么活动好？'
      ],
      dating_regularly: [
        '怎么让关系更进一步？',
        '什么时候表白合适？',
        '怎么让她更依赖我？'
      ],
      ambiguous: [
        '怎么突破暧昧期？',
        '怎么确认她的心意？',
        '怎么制造心动瞬间？'
      ],
      confirming: [
        '怎么表白成功率高？',
        '表白说什么比较好？',
        '被拒绝了怎么处理？'
      ],
    }

    if (statusQuestions[interactionStatus]) {
      questions.push(...statusQuestions[interactionStatus])
    }

    // 如果有周期信息，替换一个周期相关问题
    if (cycleInfo && questions.length >= 2) {
      if (cycleInfo.phase === 'menstrual') {
        questions[2] = '她经期怎么关心她？'
      } else if (cycleInfo.phase === 'ovulation') {
        questions[2] = '现在约她合适吗？'
      } else if (cycleInfo.phase === 'luteal_late') {
        questions[2] = '她情绪不好怎么安慰？'
      }
    }

    return questions.slice(0, 3)
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

        // 异步提取关键信息并更新档案（不阻塞响应）
        this.extractAndUpdateProfile(lastMessage.content, response.content, context, req).catch(err => {
          console.error('Extract and update profile error:', err)
        })
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
