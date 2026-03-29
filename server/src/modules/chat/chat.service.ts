import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'

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

@Injectable()
export class ChatService {
  /**
   * AI对话接口
   * @param messages 对话历史
   * @param context 对象档案上下文
   * @param req 请求对象
   */
  async chat(
    messages: ChatMessage[],
    context: ChatContext | null,
    req: Request
  ) {
    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      // 构建系统提示词
      const systemPrompt = this.buildSystemPrompt(context)

      // 构建完整消息列表
      const fullMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))
      ]

      const response = await client.invoke(fullMessages, { temperature: 0.8 })

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
