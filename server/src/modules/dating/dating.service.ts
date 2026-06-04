import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils, S3Storage, ImageGenerationClient } from 'coze-coding-dev-sdk'
import { Pool } from 'pg'

export interface ProfileAnalysis {
  overallScore: number
  strengths: string[]
  improvements: string[]
  suggestions: {
    field: string
    original: string
    suggested: string
    reason: string
  }[]
  summary: string
}

export interface ProfileHistory {
  id: number
  platform: string
  nickname: string
  bio: string
  interests: string
  analysisResult: ProfileAnalysis
  isFallback?: boolean
  createdAt: string
}

export interface PhotoScore {
  overallScore: number
  dimensions: {
    name: string
    score: number
    comment: string
  }[]
  suggestions: string[]
  summary: string
}

export interface PhotoHistory {
  id: number
  platform: string
  photoUrls: string[]
  analysisResult: PhotoScore
  isFallback?: boolean
  createdAt: string
}

export interface OpenerResponse {
  targetAnalysis: string
  suggestions: {
    style: string
    content: string
    reason: string
  }[]
  tips: string[]
}

export interface OpenerHistory {
  id: number
  platform: string
  targetProfile: string
  selfProfile: string
  result: OpenerResponse
  isFallback?: boolean
  createdAt: string
}

export interface OptimizedPhoto {
  originalUrl: string
  optimizedUrl: string
  improvements: string[]
}

export interface FeatureStatus {
  profileCount: number
  photoCount: number
  openerCount: number
}

@Injectable()
export class DatingService {
  private storage: S3Storage
  private pool: Pool

  constructor() {
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    })
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  }

  // ========== 平台特性配置 ==========
  private platformGuidesDetailed: Record<string, string> = {
    tinder: `Tinder 平台特性：
- 国际化平台，用户群体广泛
- 简介限制较短（约500字符），每字都要有信息量
- 极度重视首张照片，简介是辅助
- 用户决策快，简介要能在3秒内抓住眼球
- 风格：简洁、有趣、不油腻
- 昵称建议：简洁好记，不要太多符号`,

    tantan: `探探平台特性：
- 国内主流交友平台
- 简介限制300字以内
- 用户决策速度快，简介要突出记忆点
- 照片和简介同样重要
- 风格：真实、接地气、有生活气息
- 昵称建议：亲切自然，可以带点小趣味`,

    soul: `Soul 平台特性：
- 主打"灵魂社交"，兴趣匹配为核心
- 简介可以较长，支持展示更多内容
- 用户更注重兴趣共鸣和价值观匹配
- 有"瞬间"功能，简介可以引导查看
- 风格：走心、有深度、展示真实个性
- 昵称建议：有特色、能反映性格或兴趣`,

    momo: `陌陌平台特性：
- "附近的人"为核心功能
- 简介建议直接、清晰
- 用户群体多样，目的性较强
- 重视实时在线状态
- 风格：直接、大方、展示生活状态
- 昵称建议：简单好记，不要太复杂`,

    bumble: `Bumble 平台特性：
- 女性主动发起对话
- 用户质量相对较高
- 简介可以展示更多个人特质
- 重视真诚和尊重
- 风格：自信、真诚、有品质感
- 昵称建议：真实姓名或简洁的英文名`,

    hinge: `Hinge 平台特性：
- 主打严肃交友、长期关系
- 有"Prompts"问题引导，简介要配合回答
- 用户更注重价值观和生活方式匹配
- 不追求"左滑右滑"的快节奏
- 风格：真诚、有深度、展示真实生活
- 昵称建议：真实姓名为主，展现诚意`,

    qingten: `青藤平台特性：
- 主打高学历优质青年社交
- 需要学历认证，用户质量较高
- 简介建议展示职业发展和生活品质
- 用户注重共同话题和价值观契合
- 风格：有内涵、展现专业度和生活品味
- 简介建议：突出学历背景、职业成就、兴趣爱好`,

    marryu: `MarryU 平台特性：
- 主打严肃婚恋，以结婚为目的
- 用户群体相对成熟，有明确的婚恋需求
- 简介需要展现稳定性和责任感
- 重视经济基础、家庭观念、未来规划
- 风格：稳重、真诚、展现担当
- 简介建议：突出个人条件、家庭背景、婚恋观`,
  }

  private platformGuidesBrief: Record<string, string> = {
    tinder: 'Tinder - 国际化、简洁、重视照片、简介短、用户决策快',
    tantan: '探探 - 国内主流、简介短、照片和简介同等重要、接地气',
    soul: 'Soul - 灵魂社交、兴趣匹配、简介可较长、走心有深度',
    momo: '陌陌 - 附近的人、直接清晰、重视实时状态',
    bumble: 'Bumble - 女性主动、用户质量高、真诚有品质感',
    hinge: 'Hinge - 严肃交友、长期关系、真诚有深度',
    qingten: '青藤 - 高学历优质青年、学历认证、有内涵、生活品味',
    marryu: 'MarryU - 严肃婚恋、以结婚为目的、稳重真诚、展现担当',
  }

  private platformNames: Record<string, string> = {
    tinder: 'Tinder',
    tantan: '探探',
    soul: 'Soul',
    momo: '陌陌',
    bumble: 'Bumble',
    hinge: 'Hinge',
    qingten: '青藤',
    marryu: 'MarryU',
  }

  private getPlatformName(platform?: string): string {
    return this.platformNames[platform || 'tantan'] || '探探'
  }

  // ========== LLM 调用 ==========

  private async callLLM(prompt: string, req: Request): Promise<string> {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const response = await client.invoke([{ role: 'user', content: prompt }], { temperature: 0.7 })
    return response.content
  }

  private async callLLMWithImages(prompt: string, imageUrls: string[], req: Request): Promise<string> {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const userContent: Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }> = []
    userContent.push({ type: 'text', text: prompt })

    for (const imageUrl of imageUrls) {
      userContent.push({
        type: 'image_url',
        image_url: { url: imageUrl, detail: 'high' },
      })
    }

    const response = await client.invoke([{ role: 'user', content: userContent as any }], { temperature: 0.7 })
    return response.content
  }

  private parseJSONResponse<T>(response: string, fallback: T): { data: T; isFallback: boolean } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return { data: JSON.parse(jsonMatch[0]), isFallback: false }
      }
    } catch (error) {
      console.error('[DatingService] Failed to parse JSON response:', error)
    }
    return { data: fallback, isFallback: true }
  }

  // ========== 功能状态 ==========

  async getFeatureStatus(): Promise<FeatureStatus> {
    const [profileRes, photoRes, openerRes] = await Promise.all([
      this.pool.query('SELECT COUNT(*) as count FROM dating_profile_history'),
      this.pool.query('SELECT COUNT(*) as count FROM dating_photo_history'),
      this.pool.query('SELECT COUNT(*) as count FROM dating_opener_history'),
    ])
    return {
      profileCount: parseInt(profileRes.rows[0]?.count || '0', 10),
      photoCount: parseInt(photoRes.rows[0]?.count || '0', 10),
      openerCount: parseInt(openerRes.rows[0]?.count || '0', 10),
    }
  }

  // ========== 资料优化 ==========

  async optimizeProfile(
    data: { nickname?: string; bio?: string; interests?: string; platform?: string },
    req: Request,
  ): Promise<ProfileAnalysis & { isFallback?: boolean }> {
    const platformGuide = this.platformGuidesDetailed[data.platform || 'tantan'] || this.platformGuidesDetailed.tantan
    const platformName = this.getPlatformName(data.platform)

    const prompt = `你是一位专业的交友软件资料优化顾问，专门针对 ${platformName} 平台。请分析以下交友资料，给出专业的优化建议。

${platformGuide}

用户资料：
- 昵称：${data.nickname || '未填写'}
- 个人简介：${data.bio || '未填写'}
- 兴趣标签：${data.interests || '未填写'}

请从以下维度进行分析：
1. 整体吸引力评分（0-100分，考虑平台特性）
2. 当前优势（列出2-3条，结合平台特点）
3. 需要改进的地方（列出2-3条，针对平台优化）
4. 具体的优化建议（针对昵称、简介、兴趣标签给出改进版本和理由，要符合 ${platformName} 的平台调性）
5. 总结性建议

请以JSON格式返回，格式如下：
{
  "overallScore": 数字,
  "strengths": ["优势1", "优势2"],
  "improvements": ["改进点1", "改进点2"],
  "suggestions": [
    {
      "field": "昵称/个人简介/兴趣标签",
      "original": "原文",
      "suggested": "建议修改为",
      "reason": "修改理由（结合平台特性说明）"
    }
  ],
  "summary": "总结性建议"
}`

    try {
      const response = await this.callLLM(prompt, req)
      console.log('[DatingService] Profile optimization response:', response)
      const { data: result, isFallback } = this.parseJSONResponse<ProfileAnalysis>(response, {
        overallScore: 60,
        strengths: ['资料基本完整'],
        improvements: ['可以添加更多个人特色'],
        suggestions: [],
        summary: '建议完善个人资料，展现真实的自己。',
      })
      return { ...result, isFallback }
    } catch (error) {
      console.error('[DatingService] Profile optimization error:', error)
      return {
        overallScore: 60,
        strengths: ['资料基本完整'],
        improvements: ['可以添加更多个人特色'],
        suggestions: [],
        summary: '建议完善个人资料，展现真实的自己。',
        isFallback: true,
      }
    }
  }

  // ========== 资料优化聊天 ==========

  async chatProfile(
    data: {
      nickname?: string
      bio?: string
      interests?: string
      platform?: string
      analysis: ProfileAnalysis
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      currentMessage: string
    },
    req: Request,
  ): Promise<string> {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const platformGuide = this.platformGuidesBrief[data.platform || 'tantan'] || this.platformGuidesBrief.tantan
    const platformName = this.getPlatformName(data.platform)

    const systemPrompt = `你是一位专业的交友软件资料优化顾问，正在与用户进行一对一聊天。
你专注于 ${platformName} 平台的资料优化。

平台特性：${platformGuide}

用户原始资料：
- 昵称：${data.nickname || '未填写'}
- 个人简介：${data.bio || '未填写'}
- 兴趣标签：${data.interests || '未填写'}

你之前给出的分析结果：
- 总评分：${data.analysis.overallScore}分
- 优势：${data.analysis.strengths.join('、')}
- 改进点：${data.analysis.improvements.join('、')}
- 总结：${data.analysis.summary}

你的角色：
1. 帮助用户深入理解为什么某些修改更好（结合 ${platformName} 平台特性）
2. 根据用户的具体情况，给出更个性化的建议
3. 回答用户关于资料优化的任何问题
4. 如果用户提供了新的信息，可以重新调整建议
5. 所有建议都要符合 ${platformName} 平台的用户习惯和调性

沟通风格：
- 专业但亲切，像朋友一样交流
- 给出具体可执行的建议
- 用例子说明问题
- 鼓励用户展现真实的自己`

    const conversationMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...data.messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: data.currentMessage },
    ]

    try {
      const response = await client.invoke(conversationMessages, { temperature: 0.7 })
      return response.content
    } catch (error) {
      console.error('[DatingService] Chat error:', error)
      return '抱歉，我暂时无法回答这个问题。请稍后再试。'
    }
  }

  // ========== 照片上传 ==========

  async uploadPhoto(file: Express.Multer.File): Promise<string> {
    const ext = file.mimetype.split('/')[1] || 'jpg'
    const key = await this.storage.uploadFile({
      fileContent: file.buffer,
      fileName: `dating-photos/${Date.now()}.${ext}`,
      contentType: file.mimetype,
    })
    // 7天有效期，避免用户长时间停留在结果页面导致图片裂开
    const url = await this.storage.generatePresignedUrl({ key, expireTime: 604800 })
    console.log('[DatingService] Photo uploaded:', url)
    return url
  }

  // ========== 照片评分 ==========

  async evaluatePhotos(photoUrls: string[], req: Request, platform?: string): Promise<PhotoScore & { isFallback?: boolean }> {
    const platformName = this.getPlatformName(platform)
    const platformContext = platform
      ? `\n\n特别说明：用户使用的是 ${platformName} 平台，请在评分时考虑该平台的照片要求特性：${this.platformGuidesBrief[platform] || ''}`
      : ''

    const prompt = `你是一位专业的交友软件照片评估专家。请仔细分析这些照片，从以下维度给出评分和建议：
${platformContext}

评估维度：
1. 整体形象（0-100分）- 整体给人的第一印象
2. 照片质量（0-100分）- 清晰度、构图、光线
3. 表情和神态（0-100分）- 表情是否自然、有亲和力
4. 服装和形象（0-100分）- 穿着打扮是否得体
5. 背景和环境（0-100分）- 背景是否干净、有品味

请仔细观察每张照片，给出真实的评价和建议。

请以JSON格式返回，格式如下：
{
  "overallScore": 数字（所有维度的平均分）,
  "dimensions": [
    {
      "name": "维度名称",
      "score": 分数,
      "comment": "具体评价（指出优缺点）"
    }
  ],
  "suggestions": ["具体改进建议1", "具体改进建议2", "具体改进建议3"],
  "summary": "总结性评价（包含优势和改进方向）"
}`

    try {
      const response = await this.callLLMWithImages(prompt, photoUrls, req)
      console.log('[DatingService] Photo evaluation response:', response)
      const { data: result, isFallback } = this.parseJSONResponse<PhotoScore>(response, {
        overallScore: 70,
        dimensions: [
          { name: '整体形象', score: 70, comment: '照片整体感觉不错' },
          { name: '照片质量', score: 70, comment: '清晰度适中' },
          { name: '表情神态', score: 70, comment: '表情自然' },
        ],
        suggestions: ['建议选择更清晰的照片', '可以尝试更多样的场景'],
        summary: '照片整体效果不错，继续优化可以提升吸引力。',
      })
      return { ...result, isFallback }
    } catch (error) {
      console.error('[DatingService] Failed to evaluate photos:', error)
      return {
        overallScore: 70,
        dimensions: [
          { name: '整体形象', score: 70, comment: '照片整体感觉不错' },
          { name: '照片质量', score: 70, comment: '清晰度适中' },
          { name: '表情神态', score: 70, comment: '表情自然' },
        ],
        suggestions: ['建议选择更清晰的照片', '可以尝试更多样的场景'],
        summary: '照片整体效果不错，继续优化可以提升吸引力。',
        isFallback: true,
      }
    }
  }

  // ========== 生成优化照片 ==========

  async generateOptimizedPhoto(originalPhotoUrl: string, suggestions: string[], req: Request): Promise<OptimizedPhoto> {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
    const config = new Config()
    const client = new ImageGenerationClient(config, customHeaders)

    const suggestionsText = suggestions.slice(0, 3).join('、')
    const prompt = `Based on the original photo, create an optimized version for a dating app profile photo. Apply these improvements: ${suggestionsText}. Make the person look more attractive, confident, and approachable while maintaining their natural appearance. Improve lighting, background, and overall photo quality. Keep it realistic and natural.`

    console.log('[DatingService] Generating optimized photo with prompt:', prompt)

    try {
      const response = await client.generate({
        prompt,
        image: originalPhotoUrl,
        size: '2K',
        watermark: false,
      })

      const helper = client.getResponseHelper(response)

      if (helper.success && helper.imageUrls.length > 0) {
        console.log('[DatingService] Optimized photo generated:', helper.imageUrls[0])
        return {
          originalUrl: originalPhotoUrl,
          optimizedUrl: helper.imageUrls[0],
          improvements: suggestions,
        }
      } else {
        console.error('[DatingService] Image generation failed:', helper.errorMessages)
        throw new Error(helper.errorMessages.join(', ') || 'Image generation failed')
      }
    } catch (error) {
      console.error('[DatingService] Generate optimized photo error:', error)
      throw error
    }
  }

  // ========== 开场白生成 ==========

  async generateOpener(targetProfile: string, req: Request, platform?: string, selfProfile?: string): Promise<OpenerResponse & { isFallback?: boolean }> {
    const platformName = this.getPlatformName(platform)
    const platformContext = platform
      ? `\n\n平台信息：用户使用的是 ${platformName} 平台。${this.platformGuidesBrief[platform] || ''}\n开场白需要符合该平台的聊天文化和用户习惯。`
      : ''

    const selfContext = selfProfile
      ? `\n\n用户自己的资料/风格偏好：${selfProfile}\n请根据用户自身的风格生成贴合其个性的开场白。`
      : ''

    const prompt = `你是一位交友软件聊天专家，擅长根据对方资料生成吸引人的开场白。
${platformContext}${selfContext}

目标对象资料：
${targetProfile}

请根据对方资料，生成4种不同风格的开场白：
1. 幽默风趣型 - 用轻松幽默的方式开场
2. 真诚直接型 - 用真诚直接的方式表达兴趣
3. 好奇心型 - 用问题引起对方兴趣
4. 赞美式型 - 发现对方亮点并真诚赞美

同时分析对方画像，并给出发送技巧。

请以JSON格式返回，格式如下：
{
  "targetAnalysis": "对方画像分析（性格特点、兴趣偏好、可能的话题切入点）",
  "suggestions": [
    {
      "style": "风格名称",
      "content": "开场白内容",
      "reason": "为什么这样开场有效"
    }
  ],
  "tips": ["发送技巧1", "发送技巧2", "发送技巧3"]
}`

    try {
      const response = await this.callLLM(prompt, req)
      console.log('[DatingService] Opener generation response:', response)
      const { data: result, isFallback } = this.parseJSONResponse<OpenerResponse>(response, {
        targetAnalysis: '对方看起来是一个有趣的人。',
        suggestions: [
          {
            style: '真诚直接',
            content: '你好，看到你的资料觉得很有意思，想认识一下你。',
            reason: '简单直接，表达真诚',
          },
        ],
        tips: ['选择合适的时机发送', '保持真诚的态度'],
      })
      return { ...result, isFallback }
    } catch (error) {
      console.error('[DatingService] Failed to generate opener:', error)
      return {
        targetAnalysis: '对方看起来是一个有趣的人。',
        suggestions: [
          {
            style: '真诚直接',
            content: '你好，看到你的资料觉得很有意思，想认识一下你。',
            reason: '简单直接，表达真诚',
          },
        ],
        tips: ['选择合适的时机发送', '保持真诚的态度'],
        isFallback: true,
      }
    }
  }

  // ========== 资料优化历史 ==========

  async saveProfileHistory(data: {
    platform: string
    nickname?: string
    bio?: string
    interests?: string
    analysisResult: ProfileAnalysis
    isFallback?: boolean
  }): Promise<number> {
    const query = `
      INSERT INTO dating_profile_history (platform, nickname, bio, interests, analysis_result)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `
    const values = [data.platform, data.nickname || '', data.bio || '', data.interests || '', JSON.stringify(data.analysisResult)]

    const result = await this.pool.query(query, values)
    console.log('[DatingService] Saved profile history with id:', result.rows[0].id)
    return result.rows[0].id
  }

  async getProfileHistoryList(limit: number = 20, offset: number = 0): Promise<{ list: ProfileHistory[]; total: number }> {
    const countResult = await this.pool.query('SELECT COUNT(*) as count FROM dating_profile_history')
    const total = parseInt(countResult.rows[0]?.count || '0', 10)

    const query = `
      SELECT id, platform, nickname, bio, interests, analysis_result, created_at
      FROM dating_profile_history
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `
    const result = await this.pool.query(query, [limit, offset])

    const list = result.rows.map((row) => ({
      id: row.id,
      platform: row.platform,
      nickname: row.nickname,
      bio: row.bio,
      interests: row.interests,
      analysisResult: row.analysis_result,
      createdAt: row.created_at,
    }))

    return { list, total }
  }

  async getProfileHistoryById(id: number): Promise<ProfileHistory | null> {
    const query = `
      SELECT id, platform, nickname, bio, interests, analysis_result, created_at
      FROM dating_profile_history
      WHERE id = $1
    `
    const result = await this.pool.query(query, [id])

    if (result.rows.length === 0) return null

    const row = result.rows[0]
    return {
      id: row.id,
      platform: row.platform,
      nickname: row.nickname,
      bio: row.bio,
      interests: row.interests,
      analysisResult: row.analysis_result,
      createdAt: row.created_at,
    }
  }

  async deleteProfileHistory(id: number): Promise<boolean> {
    const query = 'DELETE FROM dating_profile_history WHERE id = $1'
    const result = await this.pool.query(query, [id])
    return result.rowCount > 0
  }

  // ========== 照片评分历史 ==========

  async savePhotoHistory(data: { platform: string; photoUrls: string[]; analysisResult: PhotoScore; isFallback?: boolean }): Promise<number> {
    const query = `
      INSERT INTO dating_photo_history (platform, photo_urls, analysis_result)
      VALUES ($1, $2, $3)
      RETURNING id
    `
    const values = [data.platform, JSON.stringify(data.photoUrls), JSON.stringify(data.analysisResult)]
    const result = await this.pool.query(query, values)
    console.log('[DatingService] Saved photo history with id:', result.rows[0].id)
    return result.rows[0].id
  }

  async getPhotoHistoryList(limit: number = 20, offset: number = 0): Promise<{ list: PhotoHistory[]; total: number }> {
    const countResult = await this.pool.query('SELECT COUNT(*) as count FROM dating_photo_history')
    const total = parseInt(countResult.rows[0]?.count || '0', 10)

    const query = `
      SELECT id, platform, photo_urls, analysis_result, created_at
      FROM dating_photo_history
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `
    const result = await this.pool.query(query, [limit, offset])

    const list = result.rows.map((row) => ({
      id: row.id,
      platform: row.platform,
      photoUrls: typeof row.photo_urls === 'string' ? JSON.parse(row.photo_urls) : row.photo_urls,
      analysisResult: typeof row.analysis_result === 'string' ? JSON.parse(row.analysis_result) : row.analysis_result,
      createdAt: row.created_at,
    }))

    return { list, total }
  }

  async deletePhotoHistory(id: number): Promise<boolean> {
    const query = 'DELETE FROM dating_photo_history WHERE id = $1'
    const result = await this.pool.query(query, [id])
    return result.rowCount > 0
  }

  // ========== 开场白历史 ==========

  async saveOpenerHistory(data: { platform: string; targetProfile: string; selfProfile?: string; result: OpenerResponse; isFallback?: boolean }): Promise<number> {
    const query = `
      INSERT INTO dating_opener_history (platform, target_profile, self_profile, result)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `
    const values = [data.platform, data.targetProfile, data.selfProfile || '', JSON.stringify(data.result)]
    const result = await this.pool.query(query, values)
    console.log('[DatingService] Saved opener history with id:', result.rows[0].id)
    return result.rows[0].id
  }

  async getOpenerHistoryList(limit: number = 20, offset: number = 0): Promise<{ list: OpenerHistory[]; total: number }> {
    const countResult = await this.pool.query('SELECT COUNT(*) as count FROM dating_opener_history')
    const total = parseInt(countResult.rows[0]?.count || '0', 10)

    const query = `
      SELECT id, platform, target_profile, self_profile, result, created_at
      FROM dating_opener_history
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `
    const result = await this.pool.query(query, [limit, offset])

    const list = result.rows.map((row) => ({
      id: row.id,
      platform: row.platform,
      targetProfile: row.target_profile,
      selfProfile: row.self_profile,
      result: typeof row.result === 'string' ? JSON.parse(row.result) : row.result,
      createdAt: row.created_at,
    }))

    return { list, total }
  }

  async deleteOpenerHistory(id: number): Promise<boolean> {
    const query = 'DELETE FROM dating_opener_history WHERE id = $1'
    const result = await this.pool.query(query, [id])
    return result.rowCount > 0
  }
}
