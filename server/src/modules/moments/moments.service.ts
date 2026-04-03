import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils, S3Storage } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 朋友圈类型定义
const POST_TYPES: Record<string, { name: string; description: string }> = {
  daily: { name: '生活日常', description: '日常生活、心情状态' },
  fitness: { name: '运动健身', description: '健身、运动、户外活动' },
  food: { name: '美食探店', description: '美食、餐厅、探店体验' },
  travel: { name: '旅行风景', description: '旅行、风景、打卡地' },
  work: { name: '工作成就', description: '工作成果、职业发展' },
  emotion: { name: '情感表达', description: '心情、感悟、情感状态' },
  hobby: { name: '兴趣爱好', description: '兴趣、爱好、技能展示' },
}

// 目的定义
const PURPOSES: Record<string, { name: string; description: string }> = {
  attract: { name: '吸引注意', description: '让对方注意到你' },
  show: { name: '展示价值', description: '展示自己的优点和价值' },
  tease: { name: '试探反应', description: '试探对方的态度' },
  topic: { name: '制造话题', description: '为聊天创造话题' },
}

// 人设标签定义
const PERSONA_TAGS = [
  { code: 'mature', name: '成熟稳重', description: '展现成熟、稳重的一面' },
  { code: 'humor', name: '幽默风趣', description: '展现幽默、有趣的一面' },
  { code: 'ambitious', name: '上进有料', description: '展现上进心和能力' },
  { code: 'warm', name: '温暖细腻', description: '展现温柔、细腻的一面' },
  { code: 'mysterious', name: '神秘有品', description: '展现神秘、有品味的一面' },
]

@Injectable()
export class MomentsService {
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
   * 上传图片
   */
  async uploadImage(file: { path?: string; buffer?: Buffer; mimetype?: string }, request: Request) {
    try {
      // 支持两种方式：file.path (小程序) 或 file.buffer (H5)
      let key: string
      const contentType = file.mimetype || 'image/jpeg'
      const ext = contentType.split('/')[1] || 'jpg'

      if (file.buffer) {
        // H5端：文件在内存中
        key = await this.storage.uploadFile({
          fileContent: file.buffer,
          fileName: `moments/${Date.now()}.${ext}`,
          contentType,
        })
      } else if (file.path) {
        // 小程序端：文件已保存到临时路径，需要读取文件内容
        // 注意：在 NestJS 环境中，需要使用 fs 读取临时文件
        const fs = await import('fs')
        const buffer = fs.readFileSync(file.path)
        key = await this.storage.uploadFile({
          fileContent: buffer,
          fileName: `moments/${Date.now()}.${ext}`,
          contentType,
        })
      } else {
        return { code: 400, msg: '文件数据无效', data: null }
      }

      // 生成预签名URL
      const url = await this.storage.generatePresignedUrl({ key, expireTime: 600 })

      return {
        code: 200,
        msg: 'success',
        data: { url, key }
      }
    } catch (error) {
      console.error('Upload image error:', error)
      return { code: 500, msg: '上传失败', data: null }
    }
  }
  /**
   * 生成发圈建议
   */
  async generateSuggestion(
    input: {
      matchId?: number
      postType: string
      purpose: string
      inputContent: string
      personaTags?: string[]
    },
    request: Request
  ) {
    const { matchId, postType, purpose, inputContent, personaTags } = input

    // 1. 获取对象信息（如果有）
    let objectInfo: {
      name: string
      gender: string
      relationshipType: string
      mbti: string
      attachmentType: string
      occupation: string
      hobbies: string
      personality: string
    } | null = null
    if (matchId) {
      objectInfo = await this.getMatchInfo(matchId, request)
    }

    // 2. 生成建议
    const suggestion = await this.generateWithLLM(
      postType,
      purpose,
      inputContent,
      personaTags,
      objectInfo,
      request
    )

    // 3. 保存建议记录
    const client = getSupabaseClient()
    const { data: savedSuggestion, error } = await client
      .from('moments_suggestions')
      .insert({
        match_id: matchId || null,
        post_type: postType,
        purpose,
        input_content: inputContent,
        suggested_content: suggestion.contents,
        image_suggestions: suggestion.imageSuggestions,
        timing_suggestion: suggestion.timing,
        expected_effect: suggestion.expectedEffect,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('Save suggestion error:', error)
    }

    return {
      code: 200,
      msg: 'success',
      data: {
        suggestionId: savedSuggestion?.id,
        contents: suggestion.contents,
        imageSuggestions: suggestion.imageSuggestions,
        timing: suggestion.timing,
        expectedEffect: suggestion.expectedEffect,
      }
    }
  }

  /**
   * 保存发布记录
   */
  async savePost(
    input: {
      matchId?: number
      content: string
      postType: string
      purpose: string
      personaTags?: string[]
      publishTime?: string
    },
    request: Request
  ) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('moments_posts')
      .insert({
        match_id: input.matchId || null,
        content: input.content,
        post_type: input.postType,
        purpose: input.purpose,
        persona_tags: input.personaTags || [],
        publish_time: input.publishTime || new Date().toISOString(),
        status: 'published',
      })
      .select()
      .single()

    if (error) {
      return { code: 500, msg: '保存失败', data: null }
    }

    return { code: 200, msg: 'success', data: { postId: data.id } }
  }

  /**
   * 获取发布历史
   */
  async getPosts(matchId: number | undefined, request: Request) {
    const client = getSupabaseClient()
    
    let query = client
      .from('moments_posts')
      .select(`
        id,
        match_id,
        content,
        post_type,
        purpose,
        persona_tags,
        publish_time,
        status,
        created_at,
        matches(name)
      `)
      .eq('status', 'published')
      .order('publish_time', { ascending: false })
      .limit(20)

    if (matchId) {
      query = query.eq('match_id', matchId)
    }

    const { data, error } = await query

    if (error) {
      return { code: 500, msg: '获取失败', data: null }
    }

    return { code: 200, msg: 'success', data: { posts: data } }
  }

  /**
   * 分析对方朋友圈
   */
  async analyzeMoments(
    input: {
      matchId?: number
      inputContent?: string
      imageUrls?: string[]
    },
    request: Request
  ) {
    const { matchId, inputContent, imageUrls } = input

    // 1. 获取对象信息（如果有）
    let objectInfo: {
      name: string
      gender: string
      relationshipType: string
      mbti: string
      attachmentType: string
      occupation: string
      hobbies: string
      personality: string
    } | null = null
    if (matchId) {
      objectInfo = await this.getMatchInfo(matchId, request)
    }

    // 2. 获取用户档案信息（用于个性化建议）
    const userInfo = await this.getUserProfile(request)

    // 3. 分析（支持图片和文字）
    const analysis = await this.analyzeWithLLM(inputContent || '', imageUrls || [], objectInfo, userInfo, request)

    // 3. 保存分析记录
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('moments_analysis')
      .insert({
        match_id: matchId || null,
        input_content: inputContent || '',
        analysis_result: analysis.result,
        interaction_advice: analysis.advice,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('Save analysis error:', error)
    }

    return {
      code: 200,
      msg: 'success',
      data: {
        analysisId: data?.id,
        result: analysis.result,
        advice: analysis.advice,
      }
    }
  }

  /**
   * 获取分析历史
   */
  async getAnalysisList(matchId: number | undefined, request: Request) {
    const client = getSupabaseClient()
    
    let query = client
      .from('moments_analysis')
      .select(`
        id,
        match_id,
        input_content,
        analysis_result,
        interaction_advice,
        created_at,
        matches(name)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20)

    if (matchId) {
      query = query.eq('match_id', matchId)
    }

    const { data, error } = await query

    if (error) {
      return { code: 500, msg: '获取失败', data: null }
    }

    return { code: 200, msg: 'success', data: { list: data } }
  }

  /**
   * 删除建议记录
   */
  async deleteSuggestion(id: number, request: Request) {
    const client = getSupabaseClient()
    const { error } = await client
      .from('moments_suggestions')
      .update({ status: 'deleted' })
      .eq('id', id)

    if (error) {
      return { code: 500, msg: '删除失败', data: null }
    }
    return { code: 200, msg: '删除成功', data: null }
  }

  /**
   * 删除发布记录
   */
  async deletePost(id: number, request: Request) {
    const client = getSupabaseClient()
    const { error } = await client
      .from('moments_posts')
      .update({ status: 'deleted' })
      .eq('id', id)

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

    const { data: match } = await client
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    const { data: dimensions } = await client
      .from('match_dimensions')
      .select('dimension_key, dimension_value')
      .eq('match_id', matchId)

    const dimensionMap: Record<string, string> = {}
    dimensions?.forEach((d: { dimension_key: string; dimension_value: string }) => {
      dimensionMap[d.dimension_key] = d.dimension_value
    })

    return {
      name: match?.name || '',
      gender: match?.gender || '',
      relationshipType: dimensionMap['relationship_type'] || match?.relationship_type || 'both',
      mbti: dimensionMap['mbti'] || '',
      attachmentType: dimensionMap['attachment_type'] || '',
      occupation: dimensionMap['occupation'] || '',
      hobbies: dimensionMap['hobbies'] || '',
      personality: dimensionMap['personality'] || '',
    }
  }

  /**
   * 获取用户档案信息（用于朋友圈分析建议个性化）
   */
  private async getUserProfile(request: Request) {
    try {
      // 当前系统单用户，固定 userId = 1
      const userId = 1

      const client = getSupabaseClient()

      // 获取用户档案
      const { data: profile } = await client
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // 获取用户行为偏好
      const { data: behavior } = await client
        .from('user_behavior_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!profile) return null

      return {
        // 大五人格
        openness: profile.openness, // 开放性
        conscientiousness: profile.conscientiousness, // 尽责性
        extraversion: profile.extraversion, // 外向性
        agreeableness: profile.agreeableness, // 宜人性
        neuroticism: profile.neuroticism, // 神经质
        // 情感特点
        stability: profile.stability, // 稳定性
        expressiveness: profile.expressiveness, // 表达性
        empathy: profile.empathy, // 同理心
        // 依恋风格
        attachmentStyle: profile.attachment_style,
        // 行为偏好
        communicationStyle: behavior?.communication_style, // 沟通风格
        expressionStyle: behavior?.expression_style, // 表达风格
        replySpeed: behavior?.reply_speed, // 回复速度
      }
    } catch (error) {
      console.error('Get user profile error:', error)
      return null
    }
  }

  /**
   * 生成发圈建议
   */
  private async generateWithLLM(
    postType: string,
    purpose: string,
    inputContent: string,
    personaTags: string[] | undefined,
    objectInfo: any,
    request: Request
  ) {
    const typeInfo = POST_TYPES[postType] || POST_TYPES.daily
    const purposeInfo = PURPOSES[purpose] || PURPOSES.attract
    const tags = personaTags?.map(tag => PERSONA_TAGS.find(t => t.code === tag)?.name).filter(Boolean).join('、') || '自然真实'

    const systemPrompt = `你是一位专业的朋友圈内容顾问，擅长根据目标对象特点生成有吸引力的朋友圈内容。

你的任务是：
1. 根据用户的发圈目的和内容类型，生成2-3个不同风格的文案版本
2. 给出图片拍摄建议（拍什么、怎么拍、什么氛围）
3. 建议最佳发布时机
4. 分析预期效果

朋友圈类型：
${Object.entries(POST_TYPES).map(([k, v]) => `- ${v.name}：${v.description}`).join('\n')}

发圈目的：
${Object.entries(PURPOSES).map(([k, v]) => `- ${v.name}：${v.description}`).join('\n')}

人设标签：
${PERSONA_TAGS.map(t => `- ${t.name}：${t.description}`).join('\n')}

重要原则：
1. 文案要自然真实，不要刻意做作
2. 根据目标对象的特点调整风格
3. 留白和神秘感比全盘托出更有吸引力
4. 避免过度展示，保持适度
5. 根据MBTI类型调整（I型适合深度内容，E型适合热闹内容）

输出格式（JSON）：
{
  "contents": [
    {"style": "风格名称", "text": "文案内容"},
    ...
  ],
  "imageSuggestions": ["图片建议1", "图片建议2"],
  "timing": "发布时机建议",
  "expectedEffect": "预期效果分析"
}`

    let userPrompt = `请帮我生成朋友圈建议：

内容类型：${typeInfo.name}（${typeInfo.description}）
发圈目的：${purposeInfo.name}（${purposeInfo.description}）
人设标签：${tags}
关键内容：${inputContent}`

    if (objectInfo) {
      userPrompt += `\n\n目标对象信息：`
      userPrompt += `\n- 姓名：${objectInfo.name}`
      if (objectInfo.mbti) userPrompt += `\n- MBTI：${objectInfo.mbti}`
      if (objectInfo.hobbies) userPrompt += `\n- 兴趣爱好：${objectInfo.hobbies}`
      if (objectInfo.personality) userPrompt += `\n- 性格特点：${objectInfo.personality}`
    }

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(request.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      const response = await client.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], { temperature: 0.8 })

      // 解析 JSON 响应
      const content = response.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // 默认返回
      return {
        contents: [{ style: '自然', text: inputContent }],
        imageSuggestions: ['拍一张相关的生活照'],
        timing: '晚上8-10点发布效果较好',
        expectedEffect: '展示真实的自己',
      }
    } catch (error) {
      console.error('Generate moments suggestion error:', error)
      return {
        contents: [{ style: '自然', text: inputContent }],
        imageSuggestions: ['拍一张相关的生活照'],
        timing: '晚上8-10点发布效果较好',
        expectedEffect: '展示真实的自己',
      }
    }
  }

  /**
   * 分析对方朋友圈（支持图片和文字）
   */
  private async analyzeWithLLM(
    inputContent: string,
    imageUrls: string[],
    objectInfo: any,
    userInfo: any,
    request: Request
  ) {
    const systemPrompt = `你是一位专业的社交媒体分析师，擅长从朋友圈内容中解读对方的情绪、兴趣、生活状态。

你的任务是：
1. 分析对方当前的情绪状态
2. 推测对方的兴趣爱好
3. 判断对方当前的生活重心
4. 找出可以切入的话题
5. 给出互动建议（点赞时机、评论话术）

重要原则：
- 如果提供了用户性格信息，评论话术和互动建议必须符合用户的说话风格
- 外向型用户适合更直接、热情的表达
- 内向型用户适合含蓄、深度的表达
- 保持建议自然真实，不要刻意做作

输出格式（JSON）：
{
  "result": {
    "emotionalState": "情绪状态分析",
    "interests": ["推断的兴趣爱好"],
    "lifeFocus": "当前生活重心",
    "topics": ["可切入的话题"]
  },
  "advice": {
    "likeTiming": "点赞时机建议",
    "commentExamples": ["评论话术示例1", "评论话术示例2"],
    "interactionTips": "互动建议"
  }
}`

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(request.headers as Record<string, string>)
      const config = new Config()
      const client = new LLMClient(config, customHeaders)

      // 构建多模态消息内容
      const userContent: Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }> = []

      // 添加文字描述
      let textContent = ''
      if (inputContent) {
        textContent = `请分析以下朋友圈内容：\n\n文字内容：${inputContent}`
      } else if (imageUrls.length > 0) {
        textContent = '请分析以下朋友圈截图内容：'
      }

      // 添加对象信息
      if (objectInfo) {
        textContent += `\n\n已知对象信息：`
        textContent += `\n- 姓名：${objectInfo.name}`
        if (objectInfo.mbti) textContent += `\n- MBTI：${objectInfo.mbti}`
        if (objectInfo.hobbies) textContent += `\n- 兴趣爱好：${objectInfo.hobbies}`
      }

      // 添加用户性格信息（用于个性化建议风格）
      if (userInfo) {
        textContent += `\n\n我的性格特点（请根据此调整建议风格）：`
        
        // 大五人格
        if (userInfo.extraversion !== undefined) {
          const isExtrovert = userInfo.extraversion > 0.5
          textContent += `\n- 性格倾向：${isExtrovert ? '外向型（E）- 喜欢直接、热情的表达方式' : '内向型（I）- 偏好含蓄、深度的表达方式'}`
        }
        
        // 依恋风格
        if (userInfo.attachmentStyle) {
          const styleMap: Record<string, string> = {
            secure: '安全型',
            anxious: '焦虑型',
            avoidant: '回避型',
            disorganized: '恐惧型',
          }
          textContent += `\n- 依恋风格：${styleMap[userInfo.attachmentStyle] || userInfo.attachmentStyle}`
        }
        
        // 表达风格
        if (userInfo.expressionStyle) {
          const styleMap: Record<string, string> = {
            direct: '直接坦率',
            subtle: '含蓄委婉',
            humorous: '幽默风趣',
            emotional: '感性细腻',
            rational: '理性克制',
          }
          textContent += `\n- 表达风格：${styleMap[userInfo.expressionStyle] || userInfo.expressionStyle}`
        }
        
        // 沟通风格
        if (userInfo.communicationStyle) {
          const styleMap: Record<string, string> = {
            active: '主动出击型',
            responsive: '回应引导型',
            balanced: '平衡互动型',
          }
          textContent += `\n- 沟通风格：${styleMap[userInfo.communicationStyle] || userInfo.communicationStyle}`
        }
      }

      userContent.push({ type: 'text', text: textContent })

      // 添加图片
      for (const imageUrl of imageUrls) {
        userContent.push({
          type: 'image_url',
          image_url: { url: imageUrl, detail: 'high' }
        })
      }

      const response = await client.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent as any },
      ], { temperature: 0.7 })

      const content = response.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      return {
        result: {
          emotionalState: '状态良好',
          interests: [],
          lifeFocus: '生活充实',
          topics: [],
        },
        advice: {
          likeTiming: '发布后2小时内点赞',
          commentExamples: ['赞！'],
          interactionTips: '自然互动即可',
        }
      }
    } catch (error) {
      console.error('Analyze moments error:', error)
      return {
        result: {
          emotionalState: '分析失败',
          interests: [],
          lifeFocus: '',
          topics: [],
        },
        advice: {
          likeTiming: '',
          commentExamples: [],
          interactionTips: '',
        }
      }
    }
  }
}
