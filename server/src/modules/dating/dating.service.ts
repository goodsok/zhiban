import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { LLMClient, Config, HeaderUtils, S3Storage, ImageGenerationClient } from 'coze-coding-dev-sdk'

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

export interface OpenerResponse {
  targetAnalysis: string
  suggestions: {
    style: string
    content: string
    reason: string
  }[]
  tips: string[]
}

export interface OptimizedPhoto {
  originalUrl: string
  optimizedUrl: string
  improvements: string[]
}

@Injectable()
export class DatingService {
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

    // 构建多模态消息内容
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }> = []

    // 添加文字
    userContent.push({ type: 'text', text: prompt })

    // 添加图片
    for (const imageUrl of imageUrls) {
      userContent.push({
        type: 'image_url',
        image_url: { url: imageUrl, detail: 'high' }
      })
    }

    const response = await client.invoke([{ role: 'user', content: userContent as any }], { temperature: 0.7 })
    return response.content
  }

  async optimizeProfile(data: { nickname?: string; bio?: string; interests?: string }, req: Request): Promise<ProfileAnalysis> {
    const prompt = `你是一位专业的交友软件资料优化顾问。请分析以下交友资料，给出专业的优化建议。

用户资料：
- 昵称：${data.nickname || '未填写'}
- 个人简介：${data.bio || '未填写'}
- 兴趣标签：${data.interests || '未填写'}

请从以下维度进行分析：
1. 整体吸引力评分（0-100分）
2. 当前优势（列出2-3条）
3. 需要改进的地方（列出2-3条）
4. 具体的优化建议（针对昵称、简介、兴趣标签给出改进版本和理由）
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
      "reason": "修改理由"
    }
  ],
  "summary": "总结性建议"
}`

    try {
      const response = await this.callLLM(prompt, req)
      console.log('[DatingService] Profile optimization response:', response)

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('[DatingService] Failed to parse profile analysis:', error)
    }

    // 返回默认结构
    return {
      overallScore: 60,
      strengths: ['资料基本完整'],
      improvements: ['可以添加更多个人特色'],
      suggestions: [],
      summary: '建议完善个人资料，展现真实的自己。',
    }
  }

  /**
   * 资料优化聊天
   */
  async chatProfile(
    data: {
      nickname?: string
      bio?: string
      interests?: string
      analysis: ProfileAnalysis
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      currentMessage: string
    },
    req: Request
  ): Promise<string> {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
    const config = new Config()
    const client = new LLMClient(config, customHeaders)

    const systemPrompt = `你是一位专业的交友软件资料优化顾问，正在与用户进行一对一聊天。

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
1. 帮助用户深入理解为什么某些修改更好
2. 根据用户的具体情况，给出更个性化的建议
3. 回答用户关于资料优化的任何问题
4. 如果用户提供了新的信息，可以重新调整建议

沟通风格：
- 专业但亲切，像朋友一样交流
- 给出具体可执行的建议
- 用例子说明问题
- 鼓励用户展现真实的自己`

    const conversationMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...data.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
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

  async uploadPhoto(file: Express.Multer.File): Promise<string> {
    const ext = file.mimetype.split('/')[1] || 'jpg'
    const key = await this.storage.uploadFile({
      fileContent: file.buffer,
      fileName: `dating-photos/${Date.now()}.${ext}`,
      contentType: file.mimetype,
    })
    const url = await this.storage.generatePresignedUrl({ key, expireTime: 600 })
    console.log('[DatingService] Photo uploaded:', url)
    return url
  }

  async evaluatePhotos(photoUrls: string[], req: Request): Promise<PhotoScore> {
    const prompt = `你是一位专业的交友软件照片评估专家。请仔细分析这些照片，从以下维度给出评分和建议：

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
      // 使用多模态能力分析图片
      const response = await this.callLLMWithImages(prompt, photoUrls, req)
      console.log('[DatingService] Photo evaluation response:', response)

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('[DatingService] Failed to parse photo evaluation:', error)
    }

    // 返回默认结构
    return {
      overallScore: 70,
      dimensions: [
        { name: '整体形象', score: 70, comment: '照片整体感觉不错' },
        { name: '照片质量', score: 70, comment: '清晰度适中' },
        { name: '表情神态', score: 70, comment: '表情自然' },
      ],
      suggestions: ['建议选择更清晰的照片', '可以尝试更多样的场景'],
      summary: '照片整体效果不错，继续优化可以提升吸引力。',
    }
  }

  async generateOptimizedPhoto(
    originalPhotoUrl: string,
    suggestions: string[],
    req: Request
  ): Promise<OptimizedPhoto> {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>)
    const config = new Config()
    const client = new ImageGenerationClient(config, customHeaders)

    // 构建优化提示词
    const suggestionsText = suggestions.slice(0, 3).join('、')
    const prompt = `Based on the original photo, create an optimized version for a dating app profile photo. Apply these improvements: ${suggestionsText}. Make the person look more attractive, confident, and approachable while maintaining their natural appearance. Improve lighting, background, and overall photo quality. Keep it realistic and natural.`

    console.log('[DatingService] Generating optimized photo with prompt:', prompt)

    try {
      // 使用 image-to-image 生成优化照片
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

  async generateOpener(targetProfile: string, req: Request): Promise<OpenerResponse> {
    const prompt = `你是一位交友软件聊天专家，擅长根据对方资料生成吸引人的开场白。

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

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('[DatingService] Failed to parse opener suggestions:', error)
    }

    // 返回默认结构
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
    }
  }
}
