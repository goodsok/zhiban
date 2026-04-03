import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 故事类型定义
const STORY_TYPES: Record<string, { name: string; description: string }> = {
  travel: { name: '旅行故事', description: '旅行中的奇遇、风景、感悟' },
  growth: { name: '成长经历', description: '人生转折、挫折克服、价值观形成' },
  emotion: { name: '情感故事', description: '友情、亲情、爱情的经历' },
  work: { name: '工作故事', description: '职场经历、创业故事、团队合作' },
  childhood: { name: '童年回忆', description: '有趣的童年经历、家庭故事' },
  hobby: { name: '兴趣爱好', description: '运动、艺术、收藏等爱好相关' },
  other: { name: '其他故事', description: '其他类型的故事' },
}

// 推进阶段定义
const RELATIONSHIP_STAGES: Record<string, string> = {
  stranger: '陌生人阶段',
  acquaintance: '认识初期',
  friend: '朋友阶段',
 暧昧: '暧昧阶段',
  dating: '约会阶段',
  relationship: '恋爱关系',
}

// 心理技巧定义
const PSYCHOLOGICAL_TECHNIQUES = [
  { code: 'suspense', name: '悬念', description: '开场设置悬念，引发好奇' },
  { code: 'reversal', name: '反转', description: '打破预期，制造惊喜' },
  { code: 'anchor', name: '心锚', description: '植入情绪锚点，建立关联' },
  { code: 'push_pull', name: '推拉', description: '情绪起伏，制造张力' },
  { code: 'gaslight', name: '煤气灯', description: '模糊边界，引导思考' },
  { code: 'foreshadow', name: '铺垫', description: '埋下伏笔，后续呼应' },
  { code: 'emotional_peak', name: '情绪高峰', description: '制造情绪高潮点' },
  { code: 'open_ending', name: '开放式结尾', description: '留下想象空间' },
]

@Injectable()
export class StoryService {
  /**
   * 获取故事类型列表
   */
  getStoryTypes() {
    return STORY_TYPES
  }

  /**
   * 创建故事并生成初始内容
   */
  async createStory(
    input: {
      matchId?: number
      storyType: string
      relationshipStage?: string
      originalContent?: string
      keyElements?: Record<string, string | undefined>
    },
    request: Request
  ) {
    const { matchId, storyType, relationshipStage, originalContent, keyElements } = input

    // 1. 获取对象信息（如果有）
    let objectInfo = null
    if (matchId) {
      objectInfo = await this.getMatchInfo(matchId, request)
    }

    // 2. 生成故事
    const generatedStory = await this.generateStoryWithLLM(
      storyType,
      relationshipStage,
      originalContent,
      keyElements,
      objectInfo,
      request
    )

    // 3. 保存到数据库
    const client = getSupabaseClient()
    const { data: story, error } = await client
      .from('stories')
      .insert({
        match_id: matchId || null,
        story_type: storyType,
        relationship_stage: relationshipStage,
        original_content: originalContent,
        key_elements: keyElements,
        generated_story: generatedStory.story,
        techniques_used: generatedStory.techniques,
        status: 'active',
      })
      .select()
      .single()

    if (error || !story) {
      return {
        code: 500,
        msg: '保存故事失败',
        data: null,
      }
    }

    // 4. 保存初始消息
    await client
      .from('story_messages')
      .insert({
        story_id: story.id,
        role: 'assistant',
        content: generatedStory.story,
      })

    return {
      code: 200,
      msg: 'success',
      data: {
        storyId: story.id,
        generatedStory: generatedStory.story,
        techniques: generatedStory.techniques,
        techniquesDetail: generatedStory.techniquesDetail,
      }
    }
  }

  /**
   * 获取故事列表
   */
  async getStoryList(matchId: number | undefined, request: Request) {
    const client = getSupabaseClient()
    
    let query = client
      .from('stories')
      .select(`
        id,
        match_id,
        story_type,
        relationship_stage,
        generated_story,
        techniques_used,
        status,
        created_at,
        matches(name)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (matchId) {
      query = query.eq('match_id', matchId)
    }

    const { data, error } = await query

    if (error) {
      return { code: 500, msg: '获取失败', data: null }
    }

    return {
      code: 200,
      msg: 'success',
      data: { stories: data },
    }
  }

  /**
   * 获取故事详情
   */
  async getStoryDetail(storyId: number, request: Request) {
    const client = getSupabaseClient()

    // 获取故事信息
    const { data: story, error: storyError } = await client
      .from('stories')
      .select(`
        id,
        match_id,
        story_type,
        relationship_stage,
        original_content,
        key_elements,
        generated_story,
        techniques_used,
        status,
        created_at,
        matches(id, name, relationship_type)
      `)
      .eq('id', storyId)
      .single()

    if (storyError || !story) {
      return { code: 404, msg: '故事不存在', data: null }
    }

    // 获取消息记录
    const { data: messages } = await client
      .from('story_messages')
      .select('id, role, content, created_at')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true })

    return {
      code: 200,
      msg: 'success',
      data: {
        story,
        messages: messages || [],
      },
    }
  }

  /**
   * 继续对话
   */
  async continueChat(storyId: number, userMessage: string, request: Request) {
    const client = getSupabaseClient()

    // 获取故事信息
    const { data: story, error: storyError } = await client
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single()

    if (storyError || !story) {
      return { code: 404, msg: '故事不存在', data: null }
    }

    // 获取历史消息
    const { data: historyMessages } = await client
      .from('story_messages')
      .select('role, content')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true })

    // 调用 LLM 生成回复
    const reply = await this.chatWithLLM(
      story,
      historyMessages || [],
      userMessage,
      request
    )

    // 保存用户消息
    await client
      .from('story_messages')
      .insert({
        story_id: storyId,
        role: 'user',
        content: userMessage,
      })

    // 保存 AI 回复
    await client
      .from('story_messages')
      .insert({
        story_id: storyId,
        role: 'assistant',
        content: reply,
      })

    return {
      code: 200,
      msg: 'success',
      data: { reply },
    }
  }

  /**
   * 删除故事
   */
  async deleteStory(storyId: number, request: Request) {
    const client = getSupabaseClient()

    const { error } = await client
      .from('stories')
      .update({ status: 'deleted' })
      .eq('id', storyId)

    if (error) {
      return { code: 500, msg: '删除失败', data: null }
    }

    return { code: 200, msg: '删除成功', data: null }
  }

  /**
   * 获取对象信息
   */
  private async getMatchInfo(matchId: number, request: Request) {
    const client = getSupabaseClient()
    const { data } = await client
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()
    return data
  }

  /**
   * 使用 LLM 生成故事
   */
  private async generateStoryWithLLM(
    storyType: string,
    relationshipStage: string | undefined,
    originalContent: string | undefined,
    keyElements: Record<string, string | undefined> | undefined,
    objectInfo: any,
    request: Request
  ) {
    const storyTypeInfo = STORY_TYPES[storyType] || STORY_TYPES.other
    const stageInfo = relationshipStage ? RELATIONSHIP_STAGES[relationshipStage] : '通用'

    const systemPrompt = `你是一位专业的情感故事教练，擅长将普通故事改造成具有高情绪价值的内容。

你的任务是：
1. 保持故事的真实性和核心内容
2. 运用心理学技巧增强故事的吸引力
3. 根据推进阶段调整故事的表达方式

可用技巧：
${PSYCHOLOGICAL_TECHNIQUES.map(t => `- ${t.name}：${t.description}`).join('\n')}

输出格式：
1. 改造后的故事（在故事中用 【】标注使用的技巧，如【悬念】、【反转】等）
2. 技巧说明列表

注意：
- 故事要自然流畅，不要刻意堆砌技巧
- 标注要放在对应句子的末尾
- 保持故事的真实感，不要过度美化`

    let userPrompt = `请帮我改造一个${storyTypeInfo.name}，用于${stageInfo}阶段。

故事类型：${storyTypeInfo.name}（${storyTypeInfo.description}）
推进阶段：${stageInfo}`

    if (originalContent) {
      userPrompt += `\n\n原始故事内容：\n${originalContent}`
    }

    if (keyElements) {
      userPrompt += '\n\n关键要素：'
      if (keyElements.time) userPrompt += `\n- 时间：${keyElements.time}`
      if (keyElements.place) userPrompt += `\n- 地点：${keyElements.place}`
      if (keyElements.characters) userPrompt += `\n- 人物：${keyElements.characters}`
      if (keyElements.keyEvent) userPrompt += `\n- 关键事件：${keyElements.keyEvent}`
      if (keyElements.emotionalTurn) userPrompt += `\n- 情绪转折：${keyElements.emotionalTurn}`
      
      // 添加其他自定义要素
      Object.keys(keyElements).forEach(key => {
        if (!['time', 'place', 'characters', 'keyEvent', 'emotionalTurn'].includes(key) && keyElements[key]) {
          userPrompt += `\n- ${key}：${keyElements[key]}`
        }
      })
    }

    if (objectInfo) {
      userPrompt += `\n\n目标对象信息：`
      userPrompt += `\n- 姓名：${objectInfo.name}`
      if (objectInfo.relationship_type) userPrompt += `\n- 关系类型：${objectInfo.relationship_type === 'long_term' ? '长期关系' : objectInfo.relationship_type === 'short_term' ? '短期关系' : '灵活'}`
    }

    userPrompt += `\n\n请生成改造后的故事，并在故事中用【】标注使用的技巧。同时在最后列出每个技巧的说明。`

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(request.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const response = await client.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], { temperature: 0.7 })
      
      const content = response.content
      
      // 解析故事和技巧说明
      const { story, techniques, techniquesDetail } = this.parseGeneratedStory(content)

      return { story, techniques, techniquesDetail }
    } catch (error) {
      console.error('Generate story error:', error)
      // 返回默认内容
      return {
        story: originalContent || '故事生成失败，请重试',
        techniques: [],
        techniquesDetail: [],
      }
    }
  }

  /**
   * 解析生成的故事
   */
  private parseGeneratedStory(content: string) {
    // 提取标注的技巧
    const techniqueMatches = content.match(/【(.+?)】/g) || []
    const techniques = [...new Set(techniqueMatches.map(m => m.replace(/【|】/g, '')))]

    // 分离故事和技巧说明
    const parts = content.split(/技巧说明[：:]/)
    const story = parts[0].trim()
    
    let techniquesDetail: { name: string; description: string }[] = []
    if (parts[1]) {
      // 解析技巧说明
      const lines = parts[1].trim().split('\n')
      techniquesDetail = lines
        .filter(line => line.trim())
        .map(line => {
          const match = line.match(/[-•]?\s*(.+?)[：:]\s*(.+)/)
          if (match) {
            return { name: match[1].trim(), description: match[2].trim() }
          }
          return null
        })
        .filter((item): item is { name: string; description: string } => item !== null)
    }

    return { story, techniques, techniquesDetail }
  }

  /**
   * 继续对话
   */
  private async chatWithLLM(
    story: any,
    historyMessages: { role: string; content: string }[],
    userMessage: string,
    request: Request
  ) {
    const systemPrompt = `你是一位专业的情感故事教练。用户正在和你讨论一个已生成的故事，你需要根据用户的反馈调整故事或提供建议。

故事信息：
- 类型：${STORY_TYPES[story.story_type]?.name || '未知'}
- 当前故事：${story.generated_story}

已使用的技巧：${story.techniques_used?.join('、') || '无'}

请根据用户的需求：
1. 调整故事内容（如更神秘、更幽默、更浪漫等）
2. 替换或增加某些技巧
3. 解释为什么这样修改
4. 提供使用建议

保持对话友好、专业。`

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(request.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ]
      
      // 添加历史消息
      historyMessages.forEach(m => {
        messages.push({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })
      })
      
      // 添加当前用户消息
      messages.push({ role: 'user', content: userMessage })

      const response = await client.invoke(messages, { temperature: 0.7 })
      return response.content
    } catch (error) {
      console.error('Chat with LLM error:', error)
      return '抱歉，出现了一些问题，请稍后再试'
    }
  }
}
